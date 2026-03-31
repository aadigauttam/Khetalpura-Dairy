// ============================================
// App Configuration
// ============================================
const CONFIG = {
  API_URL: 'https://khetalpuradairy-cadi.onrender.com/api',
  APP_NAME: 'Khetalpura Dairy',
  APP_NAME_HI: 'खेतलपुरा डेयरी',
  VERSION: '1.0.0',

  // Timeouts
  API_TIMEOUT: 60000,  // 60 seconds (needed for Render free tier wakeup)
  RETRY_COUNT: 3,
  RETRY_DELAY: 2000,

  // Indian phone
  COUNTRY_CODE: '91',
  PHONE_REGEX: /^[6-9]\d{9}$/,

  // Categories with icons
  CATEGORIES: {
    milk: { name: 'Milk', nameHi: 'दूध', icon: 'local_drink' },
    curd: { name: 'Curd', nameHi: 'दही', icon: 'breakfast_dining' },
    lassi: { name: 'Lassi', nameHi: 'लस्सी', icon: 'local_cafe' },
    ghee: { name: 'Ghee', nameHi: 'घी', icon: 'opacity' },
    ice_cream: { name: 'Ice Cream', nameHi: 'आइसक्रीम', icon: 'icecream' },
    other: { name: 'Other', nameHi: 'अन्य', icon: 'more_horiz' }
  },

  // Order statuses
  ORDER_STATUSES: {
    pending: { label: 'Pending', labelHi: 'लंबित', color: '#E65100' },
    approved: { label: 'Approved', labelHi: 'स्वीकृत', color: '#1565C0' },
    out_for_delivery: { label: 'Out for Delivery', labelHi: 'डिलीवरी में', color: '#7B1FA2' },
    delivered: { label: 'Delivered', labelHi: 'डिलीवर', color: '#2E7D32' },
    rejected: { label: 'Rejected', labelHi: 'अस्वीकृत', color: '#C62828' },
    cancelled: { label: 'Cancelled', labelHi: 'रद्द', color: '#757575' }
  },

  // Subscription plans
  PLANS: {
    daily: { label: 'Daily', labelHi: 'रोज़' },
    weekly: { label: 'Weekly', labelHi: 'हफ़्ते' },
    '15days': { label: '15 Days', labelHi: '15 दिन' },
    monthly: { label: 'Monthly', labelHi: 'महीना' },
    '3months': { label: '3 Months', labelHi: '3 महीने' },
    '6months': { label: '6 Months', labelHi: '6 महीने' },
    yearly: { label: 'Yearly', labelHi: 'सालाना' }
  }
};
