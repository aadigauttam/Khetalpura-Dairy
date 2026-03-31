const mongoose = require('mongoose');
const { validateIndianPhone } = require('../config/phone');
const { DEFAULT_SETTINGS } = require('../config/constants');

const settingsSchema = new mongoose.Schema({
  // Branding
  dairyName: {
    type: String,
    default: DEFAULT_SETTINGS.dairyName,
    trim: true
  },
  dairyNameHi: {
    type: String,
    default: DEFAULT_SETTINGS.dairyNameHi,
    trim: true
  },
  logo: {
    type: String, // Local path: /uploads/logos/logo.png
    default: ''
  },
  tagline: {
    type: String,
    default: 'Fresh from farm to your doorstep',
    trim: true
  },
  taglineHi: {
    type: String,
    default: 'खेत से सीधा आपके दरवाजे तक',
    trim: true
  },

  // Contact
  contactPhone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || validateIndianPhone(v);
      },
      message: 'Contact phone must be a valid Indian number'
    }
  },
  contactEmail: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },

  // UPI Payment
  upiId: {
    type: String,
    default: '',
    trim: true
  },
  upiQr: {
    type: String, // Local path: /uploads/qrcodes/upi.png
    default: ''
  },

  // WhatsApp Numbers
  ownerPhone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || validateIndianPhone(v);
      },
      message: 'Owner phone must be a valid Indian number'
    }
  },
  adminPhone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || validateIndianPhone(v);
      },
      message: 'Admin phone must be a valid Indian number'
    }
  },
  staffPhone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || validateIndianPhone(v);
      },
      message: 'Staff phone must be a valid Indian number'
    }
  },

  // App Configuration
  isMaintenanceMode: {
    type: Boolean,
    default: false
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  freeDeliveryAbove: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ============================================
// Singleton Pattern: Ensure only one settings doc
// ============================================
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
