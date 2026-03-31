const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Stock movement log
  movements: [{
    type: {
      type: String,
      enum: ['add', 'deduct', 'adjust'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ============================================
// Indexes
// ============================================
inventorySchema.index({ product: 1 }, { unique: true });

// ============================================
// Virtual: Is low stock?
// ============================================
inventorySchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.minThreshold;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
