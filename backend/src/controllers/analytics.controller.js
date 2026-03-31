const Order = require('../models/Order');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard analytics (Admin)
 */
const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Today's stats
  const todayOrders = await Order.find({ createdAt: { $gte: today } });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.status !== 'rejected' && o.status !== 'cancelled' ? o.totalAmount : 0), 0);

  // Weekly stats
  const weekOrders = await Order.find({ createdAt: { $gte: weekAgo } });
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.status !== 'rejected' && o.status !== 'cancelled' ? o.totalAmount : 0), 0);

  // Monthly stats
  const monthOrders = await Order.find({ createdAt: { $gte: monthAgo } });
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.status !== 'rejected' && o.status !== 'cancelled' ? o.totalAmount : 0), 0);

  // Total counts
  const totalOrders = await Order.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

  // Order status breakdown
  const statusBreakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Daily revenue for last 7 days (for chart)
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: weekAgo },
        status: { $nin: ['rejected', 'cancelled'] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  ApiResponse.success(res, {
    today: { revenue: todayRevenue, orders: todayOrders.length },
    week: { revenue: weekRevenue, orders: weekOrders.length },
    month: { revenue: monthRevenue, orders: monthOrders.length },
    totals: { orders: totalOrders, customers: totalCustomers, activeSubscriptions },
    statusBreakdown,
    dailyRevenue
  });
});

/**
 * @route GET /api/analytics/products
 * @desc Get best selling products
 */
const getBestSelling = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const bestSelling = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);

  ApiResponse.success(res, { bestSelling });
});

/**
 * @route GET /api/analytics/subscriptions
 * @desc Get subscription analytics
 */
const getSubscriptionAnalytics = asyncHandler(async (req, res) => {
  const planBreakdown = await Subscription.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$price' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const statusBreakdown = await Subscription.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  ApiResponse.success(res, { planBreakdown, statusBreakdown });
});

module.exports = { getDashboard, getBestSelling, getSubscriptionAnalytics };
