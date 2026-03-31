const mongoose = require('mongoose');
const { LOG_LEVELS } = require('../config/constants');

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: String,
    default: ''
  },
  level: {
    type: String,
    enum: Object.values(LOG_LEVELS),
    default: LOG_LEVELS.INFO
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

logSchema.index({ createdAt: -1 });
logSchema.index({ level: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ action: 1 });

// Auto-delete logs older than 90 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', logSchema);
