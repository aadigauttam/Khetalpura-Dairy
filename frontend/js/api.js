// ============================================
// API Service with Retry & Timeout
// ============================================
const API = {
  /**
   * Make an API request with retry logic
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchOptions = {
      method,
      headers,
      ...(data && method !== 'GET' && { body: JSON.stringify(data) })
    };

    let lastError;
    const maxRetries = options.retries || CONFIG.RETRY_COUNT;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || CONFIG.API_TIMEOUT);
        fetchOptions.signal = controller.signal;

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeout);

        const result = await response.json();

        if (!response.ok) {
          // Handle 401 - token expired
          if (response.status === 401) {
            Store.logout();
            Router.navigate('login');
            throw new Error(result.message || 'Session expired');
          }
          throw new Error(result.message || `Request failed (${response.status})`);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (error.name === 'AbortError') {
          lastError = new Error('Request timed out. Check your internet.');
        }

        // Don't retry on auth errors
        if (error.message.includes('401') || error.message.includes('Session expired')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    throw lastError;
  },

  // Convenience methods
  get(endpoint, options) { return this.request('GET', endpoint, null, options); },
  post(endpoint, data, options) { return this.request('POST', endpoint, data, options); },
  put(endpoint, data, options) { return this.request('PUT', endpoint, data, options); },
  patch(endpoint, data, options) { return this.request('PATCH', endpoint, data, options); },
  delete(endpoint, options) { return this.request('DELETE', endpoint, null, options); },

  /**
   * Upload file (multipart form data)
   */
  async upload(endpoint, formData, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Don't set Content-Type for FormData - browser will set it with boundary

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s for uploads

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeout);

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Upload failed');
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Upload timed out');
      throw error;
    }
  },

  // ============================================
  // Specific API Endpoints
  // ============================================
  
  // Auth
  sendOTP: (phone) => API.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => API.post('/auth/verify-otp', { phone, otp }),
  signup: (data) => API.post('/auth/signup', data),
  staffLogin: (phone, password) => API.post('/auth/login', { phone, password }),
  getMe: () => API.get('/auth/me'),

  // Products
  getProducts: (params = '') => API.get(`/products?${params}`),
  getProduct: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories'),

  // Orders
  createOrder: (data) => API.post('/orders', data),
  getOrders: (params = '') => API.get(`/orders?${params}`),
  getOrder: (id) => API.get(`/orders/${id}`),
  updateOrderStatus: (id, data) => API.patch(`/orders/${id}/status`, data),
  assignDelivery: (id, deliveryBoyId) => API.patch(`/orders/${id}/assign`, { deliveryBoyId }),
  repeatOrder: (id) => API.post(`/orders/repeat/${id}`),
  fixFailedOrders: () => API.post('/orders/fix-failed'),

  // Inventory
  getInventory: () => API.get('/inventory'),
  updateStock: (productId, data) => API.patch(`/inventory/${productId}`, data),
  getLowStockAlerts: () => API.get('/inventory/alerts'),

  // Subscriptions
  createSubscription: (data) => API.post('/subscriptions', data),
  getSubscriptions: (params = '') => API.get(`/subscriptions?${params}`),
  pauseSubscription: (id) => API.patch(`/subscriptions/${id}/pause`),
  resumeSubscription: (id) => API.patch(`/subscriptions/${id}/resume`),

  // Offers
  getOffers: (params = '') => API.get(`/offers?${params}`),

  // Notifications
  getMyNotifications: (params = '') => API.get(`/notifications/my?${params}`),
  markNotificationRead: (id) => API.patch(`/notifications/${id}/read`),
  broadcastNotification: (data) => API.post('/notifications/broadcast', data),

  // Analytics
  getDashboard: () => API.get('/analytics/dashboard'),
  getBestSelling: () => API.get('/analytics/products'),

  // Settings
  getSettings: () => API.get('/settings'),
  updateSettings: (data) => API.put('/settings', data),

  // Users
  getCustomers: (params = '') => API.get(`/users/customers?${params}`),
  getDeliveryBoys: () => API.get('/users/delivery-boys'),
  createStaff: (data) => API.post('/users/create-staff', data),

  // Payments
  getPayments: (params = '') => API.get(`/payments?${params}`)
};
