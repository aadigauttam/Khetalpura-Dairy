const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true
  },
  titleHi: {
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
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validTo: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Empty array means applicable to all products
  minOrderAmount: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

offerSchema.index({ isActive: 1 });
offerSchema.index({ validFrom: 1, validTo: 1 });

// Virtual: is currently valid
offerSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && now >= this.validFrom && now <= this.validTo;
});

offerSchema.set('toJSON', { virtuals: true });
offerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Offer', offerSchema);
