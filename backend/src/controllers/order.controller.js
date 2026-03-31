const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { generateOrderId } = require('../utils/helpers');
const { sendOrderNotification } = require('../services/notification.service');
const { generateOrderWhatsAppLink } = require('../services/whatsapp.service');
const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getFileUrl } = require('../middleware/upload');
const logger = require('../utils/logger');

/**
 * @route POST /api/orders
 * @desc Create new order (Customer)
 */
const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, notes, deliveryAddress } = req.body;
  const customer = req.user;

  // Build order items with product details
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findOne({ _id: item.product, isDeleted: false, isAvailable: true });
    if (!product) {
      return ApiResponse.error(res, `Product not found or unavailable: ${item.product}`, 400);
    }

    // Check stock availability
    if (product.stock < item.quantity) {
      return ApiResponse.error(res, `Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
    }

    const itemTotal = product.price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      nameHi: product.nameHi,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      total: itemTotal
    });

    totalAmount += itemTotal;
  }

  // Create order
  const order = await Order.create({
    orderId: generateOrderId(),
    customer: customer._id,
    items: orderItems,
    totalAmount,
    paymentMethod,
    deliveryAddress: deliveryAddress || customer.address,
    customerPhone: customer.phone,
    customerName: customer.name,
    notes
  });

  // Generate WhatsApp link if applicable
  let whatsappLink = null;
  if (paymentMethod === 'whatsapp') {
    const settings = await Settings.getSettings();
    const targetPhone = settings.staffPhone || settings.adminPhone || settings.ownerPhone;
    if (targetPhone) {
      whatsappLink = generateOrderWhatsAppLink(order, targetPhone, settings);
    }
  }

  ApiResponse.created(res, {
    order,
    whatsappLink
  }, 'Order placed successfully');
});

/**
 * @route GET /api/orders
 * @desc Get orders (role-based filtering)
 */
const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, startDate, endDate } = req.query;
  const user = req.user;

  const filter = {};

  // Role-based filtering
  if (user.role === 'customer') {
    filter.customer = user._id;
  } else if (user.role === 'delivery') {
    filter.deliveryBoy = user._id;
  }
  // Admin and staff see all orders

  if (status) filter.status = status;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('customer', 'name phone address')
    .populate('deliveryBoy', 'name phone')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, orders, total, page, limit);
});

/**
 * @route GET /api/orders/:id
 * @desc Get order details
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone address')
    .populate('deliveryBoy', 'name phone')
    .populate('paymentVerifiedBy', 'name');

  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  // Check access
  if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  ApiResponse.success(res, { order });
});

/**
 * @route PATCH /api/orders/:id/status
 * @desc Update order status (Staff/Admin)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  // Status transition validation
  const validTransitions = {
    pending: ['approved', 'rejected'],
    approved: ['out_for_delivery', 'rejected'],
    out_for_delivery: ['delivered'],
    delivered: [],
    rejected: [],
    cancelled: [],
    failed: ['pending'] // Allow retry
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return ApiResponse.error(res, `Cannot change status from '${order.status}' to '${status}'`, 400);
  }

  // Update status and timestamps
  order.status = status;
  switch (status) {
    case 'approved':
      order.approvedAt = new Date();
      break;
    case 'out_for_delivery':
      order.outForDeliveryAt = new Date();
      break;
    case 'delivered':
      order.deliveredAt = new Date();
      // Deduct stock ONLY on delivery
      await deductStock(order);
      break;
    case 'rejected':
      order.rejectedAt = new Date();
      order.rejectionReason = rejectionReason || '';
      break;
  }

  await order.save();

  // Send notification
  await sendOrderNotification(order, status);

  ApiResponse.success(res, { order }, `Order status updated to ${status}`);
});

/**
 * Deduct stock from inventory (called only when order is delivered)
 */
async function deductStock(order) {
  if (order.stockDeducted) return; // Prevent double deduction

  try {
    for (const item of order.items) {
      // Update Product stock
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );

      // Update Inventory
      await Inventory.findOneAndUpdate(
        { product: item.product },
        {
          $inc: { currentStock: -item.quantity },
          $push: {
            movements: {
              type: 'deduct',
              quantity: item.quantity,
              reason: `Order ${order.orderId} delivered`,
              orderId: order._id,
              performedBy: order.deliveryBoy
            }
          },
          lastUpdated: new Date()
        }
      );
    }

    order.stockDeducted = true;
    await order.save();

    logger.info(`📦 Stock deducted for order ${order.orderId}`);
  } catch (error) {
    logger.error(`❌ Stock deduction failed for order ${order.orderId}:`, error);
    order.isFailed = true;
    order.failureReason = `Stock deduction failed: ${error.message}`;
    await order.save();
  }
}

/**
 * @route PATCH /api/orders/:id/assign
 * @desc Assign delivery boy (Staff/Admin)
 */
const assignDeliveryBoy = asyncHandler(async (req, res) => {
  const { deliveryBoyId } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  if (!['approved', 'pending'].includes(order.status)) {
    return ApiResponse.error(res, 'Can only assign delivery for approved orders', 400);
  }

  const deliveryBoy = await User.findOne({ _id: deliveryBoyId, role: 'delivery', isActive: true });
  if (!deliveryBoy) {
    return ApiResponse.notFound(res, 'Delivery boy not found or inactive');
  }

  order.deliveryBoy = deliveryBoy._id;
  order.assignedAt = new Date();
  if (order.status === 'approved') {
    order.status = 'out_for_delivery';
    order.outForDeliveryAt = new Date();
  }
  await order.save();

  ApiResponse.success(res, { order }, 'Delivery boy assigned');
});

/**
 * @route PATCH /api/orders/:id/deliver
 * @desc Mark as delivered with proof (Delivery Boy)
 */
const markDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  if (order.deliveryBoy?.toString() !== req.user.id) {
    return ApiResponse.forbidden(res, 'Only assigned delivery boy can mark as delivered');
  }

  if (order.status !== 'out_for_delivery') {
    return ApiResponse.error(res, 'Order must be out for delivery first', 400);
  }

  // Handle delivery proof upload
  if (req.file) {
    order.deliveryProof = getFileUrl(req.file);
  }

  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();

  // Deduct stock
  await deductStock(order);

  // Send notification
  await sendOrderNotification(order, 'delivered');

  ApiResponse.success(res, { order }, 'Order marked as delivered');
});

/**
 * @route POST /api/orders/repeat/:id
 * @desc Repeat a previous order (Customer)
 */
const repeatOrder = asyncHandler(async (req, res) => {
  const previousOrder = await Order.findOne({
    _id: req.params.id,
    customer: req.user._id
  });

  if (!previousOrder) {
    return ApiResponse.notFound(res, 'Original order not found');
  }

  // Check if all products are still available
  const orderItems = [];
  let totalAmount = 0;

  for (const item of previousOrder.items) {
    const product = await Product.findOne({ _id: item.product, isDeleted: false, isAvailable: true });
    if (!product) continue; // Skip unavailable products

    const itemTotal = product.price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      nameHi: product.nameHi,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      total: itemTotal
    });
    totalAmount += itemTotal;
  }

  if (orderItems.length === 0) {
    return ApiResponse.error(res, 'None of the previous order items are available', 400);
  }

  const newOrder = await Order.create({
    orderId: generateOrderId(),
    customer: req.user._id,
    items: orderItems,
    totalAmount,
    paymentMethod: previousOrder.paymentMethod,
    deliveryAddress: req.user.address || previousOrder.deliveryAddress,
    customerPhone: req.user.phone,
    customerName: req.user.name,
    notes: `Repeated from order ${previousOrder.orderId}`
  });

  ApiResponse.created(res, { order: newOrder }, 'Order repeated successfully');
});

/**
 * @route POST /api/orders/fix-failed
 * @desc Fix failed orders (Admin only)
 */
const fixFailedOrders = asyncHandler(async (req, res) => {
  const failedOrders = await Order.find({ isFailed: true });

  const results = [];
  for (const order of failedOrders) {
    try {
      if (!order.stockDeducted && order.status === 'delivered') {
        await deductStock(order);
      }
      order.isFailed = false;
      order.failureReason = '';
      await order.save();
      results.push({ orderId: order.orderId, status: 'fixed' });
    } catch (error) {
      results.push({ orderId: order.orderId, status: 'still_failed', error: error.message });
    }
  }

  ApiResponse.success(res, { results, totalFixed: results.filter(r => r.status === 'fixed').length });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignDeliveryBoy,
  markDelivered,
  repeatOrder,
  fixFailedOrders
};
