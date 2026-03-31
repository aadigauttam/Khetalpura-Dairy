const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getFileUrl } = require('../middleware/upload');

/**
 * @route POST /api/payments/upload-screenshot
 * @desc Upload payment screenshot (Customer)
 */
const uploadScreenshot = asyncHandler(async (req, res) => {
  const { orderId, transactionId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  if (order.customer.toString() !== req.user.id) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  const screenshotUrl = req.file ? getFileUrl(req.file) : '';

  // Update order
  order.paymentScreenshot = screenshotUrl;
  await order.save();

  // Create payment record
  const payment = await Payment.create({
    order: order._id,
    amount: order.totalAmount,
    method: order.paymentMethod,
    screenshot: screenshotUrl,
    transactionId
  });

  ApiResponse.created(res, { payment }, 'Payment screenshot uploaded');
});

/**
 * @route PATCH /api/payments/:id/verify
 * @desc Verify payment (Staff/Admin)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return ApiResponse.notFound(res, 'Payment not found');
  }

  payment.status = status; // 'verified' or 'rejected'
  payment.verifiedBy = req.user._id;
  payment.verifiedAt = new Date();
  if (rejectionReason) payment.rejectionReason = rejectionReason;
  await payment.save();

  // Update order payment status
  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentVerified = status === 'verified';
    order.paymentVerifiedBy = req.user._id;
    await order.save();
  }

  ApiResponse.success(res, { payment }, `Payment ${status}`);
});

/**
 * @route GET /api/payments
 * @desc Get all payments (Admin/Staff)
 */
const getPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (status) filter.status = status;

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate('order', 'orderId totalAmount customerName')
    .populate('verifiedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, payments, total, page, limit);
});

module.exports = { uploadScreenshot, verifyPayment, getPayments };
