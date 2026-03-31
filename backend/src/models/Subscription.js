const mongoose = require('mongoose');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } = require('../config/constants');

const subscriptionProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: String,
  price: Number
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [subscriptionProductSchema],
  plan: {
    type: String,
    enum: Object.values(SUBSCRIPTION_PLANS),
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SUBSCRIPTION_STATUS),
    default: SUBSCRIPTION_STATUS.ACTIVE
  },
  pausedAt: Date,
  resumedAt: Date,
  cancelledAt: Date,
  deliveryAddress: String,
  notes: String,
  // Track remaining days when paused
  remainingDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ============================================
// Indexes
// ============================================
subscriptionSchema.index({ customer: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
