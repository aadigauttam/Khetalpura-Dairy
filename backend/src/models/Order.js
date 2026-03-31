const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_METHODS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  nameHi: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit: String,
  total: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  paymentScreenshot: {
    type: String, // Local path: /uploads/payments/screenshot.jpg
    default: ''
  },
  paymentVerified: {
    type: Boolean,
    default: false
  },
  paymentVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryProof: {
    type: String, // Local path: /uploads/deliveries/proof.jpg
    default: ''
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  // Status timestamps
  approvedAt: Date,
  assignedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  // For failed order recovery
  isFailed: {
    type: Boolean,
    default: false
  },
  failureReason: String,
  // Stock deduction tracking
  stockDeducted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ============================================
// Indexes
// ============================================
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryBoy: 1 });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
