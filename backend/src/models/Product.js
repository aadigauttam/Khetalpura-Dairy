const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  nameHi: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  descriptionHi: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: Object.values(CATEGORIES),
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
    // e.g., 'ltr', 'kg', 'piece', '500ml', '250g'
  },
  image: {
    type: String, // Local file path: /uploads/products/filename.jpg
    default: ''
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minStock: {
    type: Number,
    default: 10
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ============================================
// Indexes
// ============================================
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ name: 'text', nameHi: 'text' });

// ============================================
// Virtual: Low stock check
// ============================================
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
