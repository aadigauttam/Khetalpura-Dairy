// ============================================
// Local State Store (persisted via localStorage)
// ============================================
const Store = {
  _prefix: 'kd_',

  // ---- Auth ----
  getToken() { return localStorage.getItem(this._prefix + 'token'); },
  setToken(token) { localStorage.setItem(this._prefix + 'token', token); },
  
  getUser() {
    const data = localStorage.getItem(this._prefix + 'user');
    return data ? JSON.parse(data) : null;
  },
  setUser(user) { localStorage.setItem(this._prefix + 'user', JSON.stringify(user)); },
  
  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
  
  getRole() { return this.getUser()?.role || null; },

  logout() {
    localStorage.removeItem(this._prefix + 'token');
    localStorage.removeItem(this._prefix + 'user');
    this.clearCart();
  },

  // ---- Cart ----
  getCart() {
    const data = localStorage.getItem(this._prefix + 'cart');
    return data ? JSON.parse(data) : [];
  },

  setCart(cart) {
    localStorage.setItem(this._prefix + 'cart', JSON.stringify(cart));
    this._notifyCartChange();
  },

  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(item => item.product === product._id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        product: product._id,
        name: product.name,
        nameHi: product.nameHi,
        price: product.price,
        unit: product.unit,
        image: product.image,
        quantity
      });
    }
    
    this.setCart(cart);
  },

  updateCartQuantity(productId, quantity) {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter(item => item.product !== productId);
    } else {
      const item = cart.find(item => item.product === productId);
      if (item) item.quantity = quantity;
    }
    this.setCart(cart);
  },

  removeFromCart(productId) {
    const cart = this.getCart().filter(item => item.product !== productId);
    this.setCart(cart);
  },

  clearCart() {
    localStorage.removeItem(this._prefix + 'cart');
    this._notifyCartChange();
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },

  getCartTotal() {
    return this.getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCartItem(productId) {
    return this.getCart().find(item => item.product === productId);
  },

  // Cart change listeners
  _cartListeners: [],
  onCartChange(fn) { this._cartListeners.push(fn); },
  _notifyCartChange() {
    this._cartListeners.forEach(fn => fn(this.getCartCount(), this.getCartTotal()));
  },

  // ---- Settings (cached from API) ----
  getSettings() {
    const data = localStorage.getItem(this._prefix + 'settings');
    return data ? JSON.parse(data) : { dairyName: CONFIG.APP_NAME, dairyNameHi: CONFIG.APP_NAME_HI };
  },
  setSettings(settings) { localStorage.setItem(this._prefix + 'settings', JSON.stringify(settings)); },

  // ---- Theme ----
  getTheme() { return localStorage.getItem(this._prefix + 'theme') || 'light'; },
  setTheme(theme) {
    localStorage.setItem(this._prefix + 'theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  // ---- Products cache ----
  cacheProducts(products) { localStorage.setItem(this._prefix + 'products_cache', JSON.stringify(products)); },
  getCachedProducts() {
    const data = localStorage.getItem(this._prefix + 'products_cache');
    return data ? JSON.parse(data) : [];
  },

  // ---- OTP flow state ----
  setOTPPhone(phone) { sessionStorage.setItem(this._prefix + 'otp_phone', phone); },
  getOTPPhone() { return sessionStorage.getItem(this._prefix + 'otp_phone'); },
  clearOTPPhone() { sessionStorage.removeItem(this._prefix + 'otp_phone'); }
};
