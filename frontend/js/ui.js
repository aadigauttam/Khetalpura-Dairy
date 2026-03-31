// ============================================
// UI Utility Functions
// ============================================
const UI = {
  // Show toast notification
  toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="material-icons-round">${icons[type]}</span>${message}`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
  },

  // Show/hide loading overlay
  showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); },
  hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); },

  // Format currency (INR)
  formatPrice(amount) {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  },

  // Format date
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },

  // Format phone for display
  formatPhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      return `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
    }
    return phone;
  },

  // Validate Indian phone (10 digits, starts with 6-9)
  validatePhone(phone) {
    return CONFIG.PHONE_REGEX.test(phone);
  },

  // Get status badge HTML
  statusBadge(status) {
    const info = CONFIG.ORDER_STATUSES[status] || { label: status };
    const label = currentLang === 'hi' ? (info.labelHi || info.label) : info.label;
    return `<span class="badge badge-${status}">${label}</span>`;
  },

  // Get greeting based on time
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t('morning');
    if (hour < 17) return t('afternoon');
    return t('evening');
  },

  // Product image or placeholder
  productImage(product) {
    if (product.image) {
      return `<img src="${CONFIG.API_URL.replace('/api', '')}${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover">`;
    }
    const icon = CONFIG.CATEGORIES[product.category]?.icon || 'local_drink';
    return `<span class="material-icons-round">${icon}</span>`;
  },

  // Create modal
  showModal(title, content, actions = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.onclick = (e) => { if (e.target === overlay) UI.closeModal(); };
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="UI.closeModal()">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">${content}</div>
        ${actions ? `<div class="modal-actions" style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm)">${actions}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeModal() {
    const modal = document.getElementById('active-modal');
    if (modal) modal.remove();
  },

  // Confirm dialog
  confirm(message, onConfirm) {
    UI.showModal(
      t('confirm'),
      `<p style="color:var(--text-secondary)">${message}</p>`,
      `
        <button class="btn btn-ghost" onclick="UI.closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="UI.closeModal(); (${onConfirm})()">${t('confirm')}</button>
      `
    );
  },

  // Empty state
  emptyState(icon, title, description) {
    return `
      <div class="empty-state">
        <span class="material-icons-round">${icon}</span>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
  },

  // Page header
  pageHeader(title, actions = '') {
    const settings = Store.getSettings();
    return `
      <div class="page-header">
        <div>
          <div class="page-title">${title}</div>
        </div>
        <div class="header-actions">${actions}</div>
      </div>
    `;
  },

  // Quantity control for a product
  qtyControl(productId, currentQty) {
    if (currentQty === 0) {
      return `<button class="add-to-cart-btn" onclick="event.stopPropagation(); CustomerScreens.addToCart('${productId}')">
        <span class="material-icons-round" style="font-size:16px">add</span> ${t('add_to_cart')}
      </button>`;
    }
    return `
      <div class="qty-control" onclick="event.stopPropagation()">
        <button class="qty-btn" onclick="CustomerScreens.updateQty('${productId}', ${currentQty - 1})">−</button>
        <span class="qty-value">${currentQty}</span>
        <button class="qty-btn" onclick="CustomerScreens.updateQty('${productId}', ${currentQty + 1})">+</button>
      </div>
    `;
  },

  // Shimmer loading placeholder
  shimmerCard() {
    return `
      <div class="product-card">
        <div class="shimmer" style="height:140px"></div>
        <div style="padding:var(--space-md)">
          <div class="shimmer" style="height:16px;width:80%;margin-bottom:8px"></div>
          <div class="shimmer" style="height:12px;width:50%;margin-bottom:12px"></div>
          <div class="shimmer" style="height:20px;width:40%"></div>
        </div>
      </div>
    `;
  },

  // Toggle dark/light theme
  toggleTheme() {
    const current = Store.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Store.setTheme(next);
    return next;
  },

  // Toggle language
  toggleLanguage() {
    const next = currentLang === 'en' ? 'hi' : 'en';
    setLanguage(next);
    return next;
  }
};
