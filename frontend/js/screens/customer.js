// ============================================
// Customer Screens
// ============================================
const CustomerScreens = {
  _products: [],
  _activeCategory: 'all',

  async renderHome() {
    const content = document.getElementById('main-content');
    const user = Store.getUser();
    const settings = Store.getSettings();

    content.innerHTML = `
      <div class="home-header">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="home-greeting">${t('greeting')} ${UI.getGreeting()} 👋</div>
            <div class="home-name">${user?.name || 'Guest'}</div>
          </div>
          <div style="display:flex;gap:var(--space-sm)">
            <button class="btn btn-icon" style="background:rgba(255,255,255,0.2);color:white" onclick="UI.toggleLanguage()">
              <span class="material-icons-round">translate</span>
            </button>
            <button class="btn btn-icon" style="background:rgba(255,255,255,0.2);color:white" onclick="UI.toggleTheme()">
              <span class="material-icons-round">${Store.getTheme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
        <div class="home-search" onclick="Router.navigate('customer-products')">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="${t('search_products')}" readonly>
        </div>
      </div>
      <div class="category-pills" id="category-pills">
        <button class="category-pill active" onclick="CustomerScreens.filterCategory('all')">
          <span class="material-icons-round">apps</span>
          ${currentLang === 'hi' ? 'सभी' : 'All'}
        </button>
        ${Object.entries(CONFIG.CATEGORIES).map(([key]) => Components.categoryPill(key, false)).join('')}
      </div>
      <div class="products-section">
        <h2 class="section-title">${t('all_products')}</h2>
        <div class="products-grid" id="products-grid">${UI.shimmerCard().repeat(6)}</div>
      </div>
    `;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      content.innerHTML += `<button class="voice-fab" id="voice-btn" onclick="CustomerScreens.startVoiceOrder()" title="${t('voice_order')}"><span class="material-icons-round">mic</span></button>`;
    }
    this.loadProducts();
  },

  async loadProducts(category = 'all') {
    try {
      let params = 'available=true&limit=100';
      if (category !== 'all') params += `&category=${category}`;
      const result = await API.getProducts(params);
      this._products = result.data;
      Store.cacheProducts(result.data);
      this.renderProductGrid();
    } catch (error) {
      const cached = Store.getCachedProducts();
      if (cached.length > 0) { this._products = cached; this.renderProductGrid(); }
      else { document.getElementById('products-grid').innerHTML = UI.emptyState('cloud_off', 'Cannot load products', 'Check your internet'); }
    }
  },

  renderProductGrid() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    let products = this._products;
    if (this._activeCategory !== 'all') products = products.filter(p => p.category === this._activeCategory);
    if (products.length === 0) { grid.innerHTML = UI.emptyState('inventory_2', 'No products found', 'Try a different category'); return; }
    grid.innerHTML = products.map(p => Components.productCard(p)).join('');
  },

  filterCategory(category) {
    this._activeCategory = category;
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    event?.target?.closest('.category-pill')?.classList.add('active');
    if (category === 'all') document.querySelector('.category-pill')?.classList.add('active');
    this.loadProducts(category);
  },

  addToCart(productId) {
    const product = this._products.find(p => p._id === productId);
    if (!product) return;
    Store.addToCart(product, 1);
    UI.toast(`${getLocalizedName(product)} ${currentLang === 'hi' ? 'कार्ट में जोड़ा' : 'added to cart'}`, 'success');
    this.renderProductGrid();
    this._updateCartBadge();
  },

  updateQty(productId, newQty) {
    if (newQty <= 0) Store.removeFromCart(productId);
    else Store.updateCartQuantity(productId, newQty);
    this.renderProductGrid();
    this._updateCartBadge();
  },

  _updateCartBadge() {
    const badge = document.getElementById('cart-nav-badge');
    const count = Store.getCartCount();
    if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
  },

  async renderProducts() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('all_products'))}
      <div class="search-bar"><span class="material-icons-round">search</span>
        <input type="text" id="product-search" placeholder="${t('search_products')}" oninput="CustomerScreens.handleSearch(this.value)">
      </div>
      <div class="category-pills" style="padding-top:0">
        <button class="category-pill active" onclick="CustomerScreens.filterCategory('all')"><span class="material-icons-round" style="font-size:20px">apps</span> ${currentLang === 'hi' ? 'सभी' : 'All'}</button>
        ${Object.entries(CONFIG.CATEGORIES).map(([key]) => Components.categoryPill(key, false)).join('')}
      </div>
      <div class="products-grid" id="products-grid" style="padding:0 var(--space-md)">${UI.shimmerCard().repeat(6)}</div>
    `;
    this.loadProducts();
  },

  handleSearch(query) {
    const grid = document.getElementById('products-grid');
    const filtered = this._products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) || (p.nameHi && p.nameHi.includes(query))
    );
    grid.innerHTML = filtered.map(p => Components.productCard(p)).join('');
  },

  renderCart() {
    const content = document.getElementById('main-content');
    const cart = Store.getCart();
    const total = Store.getCartTotal();
    content.innerHTML = `
      ${UI.pageHeader(t('your_cart'))}
      <div style="padding:var(--space-md);padding-bottom:${cart.length > 0 ? '140px' : '0'}">
        ${cart.length === 0 ? UI.emptyState('shopping_cart', t('cart_empty'), t('cart_empty_desc')) : cart.map(item => Components.cartItem(item)).join('')}
      </div>
      ${cart.length > 0 ? `<div class="cart-summary"><div class="cart-total-row"><span class="cart-total-label">${t('total')}</span><span class="cart-total-value">${UI.formatPrice(total)}</span></div><button class="btn btn-primary btn-full btn-lg" onclick="Router.navigate('customer-checkout')">${t('checkout')} →</button></div>` : ''}
    `;
  },

  updateCartQty(productId, newQty) {
    if (newQty <= 0) Store.removeFromCart(productId);
    else Store.updateCartQuantity(productId, newQty);
    this.renderCart();
    this._updateCartBadge();
  },

  async renderCheckout() {
    const cart = Store.getCart();
    const total = Store.getCartTotal();
    const user = Store.getUser();
    if (cart.length === 0) return Router.navigate('customer-cart');
    let settings;
    try { settings = (await API.getSettings()).data.settings; Store.setSettings(settings); } catch { settings = Store.getSettings(); }

    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('checkout'))}
      <div style="padding:var(--space-md)">
        <div class="card mb-md"><h3 style="font-size:14px;font-weight:600;margin-bottom:var(--space-sm)">📍 Delivery Address</h3>
          <textarea id="checkout-address" class="form-input" rows="2">${user?.address || ''}</textarea></div>
        <div class="card mb-md"><h3 style="font-size:14px;font-weight:600;margin-bottom:var(--space-sm)">🛒 Order Summary</h3>
          ${cart.map(item => `<div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0;font-size:14px"><span>${getLocalizedName(item)} x${item.quantity}</span><span style="font-weight:600">${UI.formatPrice(item.price * item.quantity)}</span></div>`).join('')}
          <hr style="border:none;border-top:1px solid var(--border-color);margin:var(--space-sm) 0">
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700"><span>${t('total')}</span><span style="color:var(--primary-500)">${UI.formatPrice(total)}</span></div>
        </div>
        <div class="card mb-md"><h3 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md)">💳 Payment Method</h3>
          <button class="btn btn-full btn-lg mb-md" style="background:#25D366;color:white" onclick="CustomerScreens.placeOrder('whatsapp')"><span class="material-icons-round">chat</span> ${t('order_via_whatsapp')}</button>
          ${settings.upiId || settings.upiQr ? `<button class="btn btn-full btn-lg btn-secondary" onclick="CustomerScreens.placeOrder('upi')"><span class="material-icons-round">account_balance</span> ${t('pay_via_upi')}</button>` : ''}
        </div>
      </div>
    `;
  },

  async placeOrder(method) {
    const address = document.getElementById('checkout-address')?.value?.trim();
    if (!address) { UI.toast('Please enter delivery address', 'warning'); return; }
    UI.showLoading();
    try {
      const cart = Store.getCart();
      const result = await API.createOrder({ items: cart.map(i => ({ product: i.product, quantity: i.quantity })), paymentMethod: method, deliveryAddress: address });
      Store.clearCart();
      if (method === 'whatsapp' && result.data.whatsappLink) window.open(result.data.whatsappLink, '_blank');
      UI.toast(t('order_placed'), 'success');
      Router.navigate('customer-orders');
    } catch (error) { UI.toast(error.message, 'error'); }
    finally { UI.hideLoading(); }
  },

  async renderOrders() {
    const content = document.getElementById('main-content');
    content.innerHTML = `${UI.pageHeader(t('my_orders'))}<div id="orders-list" style="padding:var(--space-md)"><div class="shimmer" style="height:100px;margin-bottom:var(--space-md);border-radius:var(--radius-lg)"></div></div>`;
    try {
      const result = await API.getOrders('limit=50');
      const list = document.getElementById('orders-list');
      if (result.data.length === 0) { list.innerHTML = UI.emptyState('receipt_long', t('no_orders'), 'Place your first order!'); return; }
      list.innerHTML = result.data.map(o => Components.orderCard(o)).join('');
    } catch (error) { UI.toast(error.message, 'error'); }
  },

  async repeatOrder(orderId) {
    UI.showLoading();
    try { await API.repeatOrder(orderId); UI.toast(t('order_placed'), 'success'); this.renderOrders(); }
    catch (error) { UI.toast(error.message, 'error'); } finally { UI.hideLoading(); }
  },

  showProductDetail(productId) {
    const product = this._products.find(p => p._id === productId);
    if (!product) return;
    const name = getLocalizedName(product);
    const desc = getLocalizedField(product, 'description');
    const cartItem = Store.getCartItem(product._id);
    const qty = cartItem ? cartItem.quantity : 0;
    UI.showModal(name, `
      <div style="text-align:center;margin-bottom:var(--space-md)"><div style="width:120px;height:120px;margin:0 auto;background:var(--cream-100);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center">${UI.productImage(product)}</div></div>
      <div style="text-align:center;margin-bottom:var(--space-md)"><div style="font-size:28px;font-weight:700;color:var(--primary-500)">${UI.formatPrice(product.price)}</div><div style="color:var(--text-hint)">${product.unit}</div>${desc ? `<p style="margin-top:var(--space-sm);color:var(--text-secondary);font-size:14px">${desc}</p>` : ''}</div>
      <div style="display:flex;justify-content:center">${product.isAvailable && product.stock > 0 ? UI.qtyControl(product._id, qty) : `<span class="badge badge-rejected">${t('out_of_stock')}</span>`}</div>
    `);
  },

  showOrderDetail(orderId) { Router.navigate('customer-orders'); },

  async renderSubscriptions() {
    const content = document.getElementById('main-content');
    content.innerHTML = `${UI.pageHeader('Subscriptions')}<div id="sub-list" style="padding:var(--space-md)"><div class="shimmer" style="height:100px;border-radius:var(--radius-lg)"></div></div>`;
    try {
      const result = await API.getSubscriptions();
      const list = document.getElementById('sub-list');
      if (result.data.length === 0) { list.innerHTML = UI.emptyState('autorenew', 'No subscriptions', 'Subscribe for daily deliveries!'); return; }
      list.innerHTML = result.data.map(s => `
        <div class="card mb-md"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">${CONFIG.PLANS[s.plan]?.[currentLang==='hi'?'labelHi':'label']||s.plan}</div><div style="font-size:13px;color:var(--text-hint)">${s.products.map(p=>p.name).join(', ')}</div></div>${UI.statusBadge(s.status)}</div>
        <div style="margin-top:var(--space-sm);font-size:14px;display:flex;justify-content:space-between"><span>${UI.formatPrice(s.price)}</span><span style="color:var(--text-hint)">${UI.formatDate(s.startDate)} - ${UI.formatDate(s.endDate)}</span></div></div>
      `).join('');
    } catch (error) { UI.toast(error.message, 'error'); }
  },

  renderProfile() {
    const user = Store.getUser();
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('profile'))}
      <div style="padding:var(--space-md)">
        <div class="card mb-lg" style="text-align:center;padding:var(--space-xl)">
          <div class="list-item-avatar" style="width:64px;height:64px;font-size:24px;margin:0 auto var(--space-md)">${user?.name?.[0]?.toUpperCase()||'G'}</div>
          <h2 style="font-size:20px;font-weight:700">${user?.name||'Guest'}</h2>
          <p style="color:var(--text-hint)">${UI.formatPhone(user?.phone)}</p>
          <p style="color:var(--text-secondary);font-size:13px;margin-top:var(--space-xs)">${user?.address||''}</p>
        </div>
        <div class="settings-group">
          <div class="settings-item" onclick="UI.toggleLanguage()"><div class="settings-item-left"><div class="settings-item-icon"><span class="material-icons-round">translate</span></div><div><div class="settings-item-label">${t('language')}</div><div class="settings-item-desc">${currentLang==='en'?'English':'हिंदी'}</div></div></div><span class="material-icons-round" style="color:var(--text-hint)">chevron_right</span></div>
          <div class="settings-item" onclick="UI.toggleTheme()"><div class="settings-item-left"><div class="settings-item-icon"><span class="material-icons-round">dark_mode</span></div><div><div class="settings-item-label">${t('dark_mode')}</div><div class="settings-item-desc">${Store.getTheme()==='dark'?'On':'Off'}</div></div></div><label class="toggle"><input type="checkbox" ${Store.getTheme()==='dark'?'checked':''} onchange="UI.toggleTheme()"><span class="toggle-slider"></span></label></div>
          <div class="settings-item" onclick="Router.navigate('customer-subscriptions')"><div class="settings-item-left"><div class="settings-item-icon"><span class="material-icons-round">autorenew</span></div><div><div class="settings-item-label">Subscriptions</div></div></div><span class="material-icons-round" style="color:var(--text-hint)">chevron_right</span></div>
        </div>
        <button class="btn btn-danger btn-full mt-lg" onclick="Store.logout();Router.navigate('login')"><span class="material-icons-round">logout</span> ${t('logout')}</button>
      </div>
    `;
  },

  startVoiceOrder() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return UI.toast('Voice not supported', 'warning');
    const recognition = new SR();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    const btn = document.getElementById('voice-btn');
    btn.classList.add('listening');
    recognition.onresult = (e) => { const text = e.results[0][0].transcript; btn.classList.remove('listening'); UI.toast(`🎤 "${text}"`, 'info'); this._products.forEach(p => { if (p.nameHi && text.includes(p.nameHi)) { Store.addToCart(p, 1); UI.toast(`${p.nameHi} added!`, 'success'); } }); };
    recognition.onerror = () => btn.classList.remove('listening');
    recognition.onend = () => btn.classList.remove('listening');
    recognition.start();
  }
};
