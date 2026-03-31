// ============================================
// App Constants
// ============================================

module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff',
    DELIVERY: 'delivery',
    CUSTOMER: 'customer'
  },

  // Product Categories
  CATEGORIES: {
    MILK: 'milk',
    CURD: 'curd',
    LASSI: 'lassi',
    GHEE: 'ghee',
    ICE_CREAM: 'ice_cream',
    OTHER: 'other'
  },

  // Order Statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
  },

  // Payment Methods
  PAYMENT_METHODS: {
    UPI: 'upi',
    COD: 'cod',
    WHATSAPP: 'whatsapp'
  },

  // Payment Statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  },

  // Subscription Plans
  SUBSCRIPTION_PLANS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    FIFTEEN_DAYS: '15days',
    MONTHLY: 'monthly',
    THREE_MONTHS: '3months',
    SIX_MONTHS: '6months',
    YEARLY: 'yearly'
  },

  // Subscription Statuses
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    OFFER: 'offer',
    ORDER: 'order',
    SYSTEM: 'system',
    SUBSCRIPTION: 'subscription'
  },

  // Log Levels
  LOG_LEVELS: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  },

  // Upload Categories
  UPLOAD_CATEGORIES: {
    PRODUCTS: 'products',
    PAYMENTS: 'payments',
    DELIVERIES: 'deliveries',
    LOGOS: 'logos',
    QRCODES: 'qrcodes',
    MISC: 'misc'
  },

  // Default Settings
  DEFAULT_SETTINGS: {
    dairyName: 'Khetalpura Dairy',
    dairyNameHi: 'खेतलपुरा डेयरी',
    contactPhone: '',
    contactEmail: '',
    upiId: '',
    upiQr: '',
    logo: '',
    ownerPhone: '',
    adminPhone: '',
    staffPhone: ''
  }
};
