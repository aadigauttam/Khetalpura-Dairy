// ============================================
// Reusable Component Renderers
// ============================================
const Components = {
  // Product card
  productCard(product) {
    const cartItem = Store.getCartItem(product._id);
    const qty = cartItem ? cartItem.quantity : 0;
    const name = getLocalizedName(product);
    const unavailable = !product.isAvailable || product.stock <= 0;

    return `
      <div class="product-card stagger-item ${unavailable ? 'opacity-50' : ''}" onclick="CustomerScreens.showProductDetail('${product._id}')">
        <div class="product-card-image">
          ${UI.productImage(product)}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${name}</div>
          <div class="product-card-unit">${product.unit}</div>
          <div class="product-card-footer">
            <span class="product-card-price">${product.price}</span>
            ${unavailable
              ? `<span class="badge badge-rejected" style="font-size:10px">${t('out_of_stock')}</span>`
              : UI.qtyControl(product._id, qty)
            }
          </div>
        </div>
      </div>
    `;
  },

  // Order card
  orderCard(order) {
    const itemNames = order.items.map(i => currentLang === 'hi' && i.nameHi ? i.nameHi : i.name).join(', ');
    return `
      <div class="order-card stagger-item" onclick="CustomerScreens.showOrderDetail('${order._id}')">
        <div class="order-card-header">
          <span class="order-id">#${order.orderId}</span>
          ${UI.statusBadge(order.status)}
        </div>
        <div class="order-items-summary">${itemNames}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="order-total">${UI.formatPrice(order.totalAmount)}</span>
          <span class="order-date">${UI.formatDate(order.createdAt)}</span>
        </div>
        ${order.status === 'delivered' ? `
          <button class="btn btn-sm btn-secondary mt-sm" onclick="event.stopPropagation(); CustomerScreens.repeatOrder('${order._id}')">
            <span class="material-icons-round" style="font-size:16px">replay</span> ${t('repeat_order')}
          </button>
        ` : ''}
      </div>
    `;
  },

  // Stat card for dashboard
  statCard(icon, value, label, colorClass = 'green') {
    return `
      <div class="stat-card card-enter">
        <div class="stat-icon ${colorClass}">
          <span class="material-icons-round">${icon}</span>
        </div>
        <div>
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
      </div>
    `;
  },

  // Category pill
  categoryPill(key, isActive) {
    const cat = CONFIG.CATEGORIES[key];
    const name = currentLang === 'hi' ? cat.nameHi : cat.name;
    return `
      <button class="category-pill ${isActive ? 'active' : ''}" onclick="CustomerScreens.filterCategory('${key}')">
        <span class="material-icons-round">${cat.icon}</span>
        ${name}
      </button>
    `;
  },

  // Cart item
  cartItem(item) {
    const name = currentLang === 'hi' && item.nameHi ? item.nameHi : item.name;
    return `
      <div class="cart-item">
        <div class="cart-item-image">
          <span class="material-icons-round">local_drink</span>
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${name}</div>
          <div style="font-size:12px;color:var(--text-hint)">${item.unit}</div>
          <div class="cart-item-price">${UI.formatPrice(item.price * item.quantity)}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="CustomerScreens.updateCartQty('${item.product}', ${item.quantity - 1})">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="CustomerScreens.updateCartQty('${item.product}', ${item.quantity + 1})">+</button>
        </div>
      </div>
    `;
  },

  // Bar chart (simple CSS-based)
  barChart(data, maxHeight = 120) {
    if (!data || data.length === 0) return '<p style="text-align:center;color:var(--text-hint)">No data</p>';
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return `
      <div class="bar-chart" style="height:${maxHeight + 40}px">
        ${data.map(d => {
          const height = Math.max(4, (d.value / maxValue) * maxHeight);
          return `
            <div class="bar-chart-bar">
              <div class="bar-chart-value">${d.value >= 1000 ? (d.value/1000).toFixed(1) + 'k' : d.value}</div>
              <div class="bar-chart-fill" style="height:${height}px"></div>
              <div class="bar-chart-label">${d.label}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Delivery card (for delivery boy)
  deliveryCard(order) {
    return `
      <div class="delivery-card stagger-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm)">
          <span class="order-id">#${order.orderId}</span>
          ${UI.statusBadge(order.status)}
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:4px">
          <span class="material-icons-round" style="font-size:18px;color:var(--text-hint)">person</span>
          <span style="font-size:14px">${order.customerName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:4px">
          <span class="material-icons-round" style="font-size:18px;color:var(--text-hint)">phone</span>
          <a href="tel:${order.customerPhone}" style="font-size:14px">${UI.formatPhone(order.customerPhone)}</a>
        </div>
        <div style="display:flex;align-items:start;gap:var(--space-sm);margin-bottom:var(--space-sm)">
          <span class="material-icons-round" style="font-size:18px;color:var(--text-hint)">location_on</span>
          <span style="font-size:13px;color:var(--text-secondary)">${order.deliveryAddress}</span>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-sm)">
          ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
        </div>
        <div style="font-weight:700;color:var(--primary-500);margin-bottom:var(--space-md)">${UI.formatPrice(order.totalAmount)}</div>
        <div class="delivery-actions">
          ${order.status === 'out_for_delivery' ? `
            <button class="btn btn-primary btn-sm" onclick="DeliveryScreens.markDelivered('${order._id}')">
              <span class="material-icons-round" style="font-size:16px">check_circle</span> ${t('mark_delivered')}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="DeliveryScreens.shareLocation('${order.customerPhone}')">
              <span class="material-icons-round" style="font-size:16px">location_on</span> ${t('share_location')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
};
