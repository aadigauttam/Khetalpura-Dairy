const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const { calculateSubscriptionEndDate } = require('../utils/helpers');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route POST /api/subscriptions
 * @desc Create subscription (Customer)
 */
const createSubscription = asyncHandler(async (req, res) => {
  const { products, plan, deliveryAddress, notes } = req.body;

  const subProducts = [];
  let totalPrice = 0;

  for (const item of products) {
    const product = await Product.findOne({ _id: item.product, isDeleted: false, isAvailable: true });
    if (!product) continue;

    subProducts.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      unit: product.unit,
      price: product.price
    });
    totalPrice += product.price * item.quantity;
  }

  if (subProducts.length === 0) {
    return ApiResponse.error(res, 'No valid products selected', 400);
  }

  const startDate = new Date();
  const endDate = calculateSubscriptionEndDate(startDate, plan);

  const subscription = await Subscription.create({
    customer: req.user._id,
    products: subProducts,
    plan,
    price: totalPrice,
    startDate,
    endDate,
    deliveryAddress: deliveryAddress || req.user.address,
    notes
  });

  ApiResponse.created(res, { subscription }, 'Subscription created successfully');
});

/**
 * @route GET /api/subscriptions
 * @desc Get subscriptions (role-based)
 */
const getSubscriptions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (req.user.role === 'customer') {
    filter.customer = req.user._id;
  }
  if (status) filter.status = status;

  const total = await Subscription.countDocuments(filter);
  const subscriptions = await Subscription.find(filter)
    .populate('customer', 'name phone address')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, subscriptions, total, page, limit);
});

/**
 * @route GET /api/subscriptions/:id
 */
const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('customer', 'name phone address');

  if (!subscription) {
    return ApiResponse.notFound(res, 'Subscription not found');
  }

  ApiResponse.success(res, { subscription });
});

/**
 * @route PATCH /api/subscriptions/:id/pause
 * @desc Pause subscription (Admin/Customer)
 */
const pauseSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return ApiResponse.notFound(res, 'Subscription not found');
  }

  if (subscription.status !== 'active') {
    return ApiResponse.error(res, 'Only active subscriptions can be paused', 400);
  }

  // Calculate remaining days
  const now = new Date();
  const end = new Date(subscription.endDate);
  const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  subscription.status = 'paused';
  subscription.pausedAt = now;
  subscription.remainingDays = remainingDays;
  await subscription.save();

  ApiResponse.success(res, { subscription }, 'Subscription paused');
});

/**
 * @route PATCH /api/subscriptions/:id/resume
 * @desc Resume subscription (Admin/Customer)
 */
const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return ApiResponse.notFound(res, 'Subscription not found');
  }

  if (subscription.status !== 'paused') {
    return ApiResponse.error(res, 'Only paused subscriptions can be resumed', 400);
  }

  // Extend end date by remaining days
  const now = new Date();
  const newEndDate = new Date(now);
  newEndDate.setDate(newEndDate.getDate() + subscription.remainingDays);

  subscription.status = 'active';
  subscription.resumedAt = now;
  subscription.endDate = newEndDate;
  subscription.remainingDays = 0;
  await subscription.save();

  ApiResponse.success(res, { subscription }, 'Subscription resumed');
});

/**
 * @route PUT /api/subscriptions/:id
 * @desc Update subscription (Admin)
 */
const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return ApiResponse.notFound(res, 'Subscription not found');
  }

  const { price, products, status } = req.body;
  if (price !== undefined) subscription.price = price;
  if (status) subscription.status = status;
  if (products) subscription.products = products;

  await subscription.save();
  ApiResponse.success(res, { subscription }, 'Subscription updated');
});

/**
 * @route DELETE /api/subscriptions/:id
 * @desc Cancel subscription
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return ApiResponse.notFound(res, 'Subscription not found');
  }

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();

  ApiResponse.success(res, null, 'Subscription cancelled');
});

module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  updateSubscription,
  cancelSubscription
};
