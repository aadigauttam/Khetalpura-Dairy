// ============================================
// Staff Screens
// ============================================
const StaffScreens = {
  async renderDashboard() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('dashboard'), `
        <button class="btn btn-ghost btn-sm" onclick="UI.toggleTheme()"><span class="material-icons-round">${Store.getTheme()==='dark'?'light_mode':'dark_mode'}</span></button>
      `)}
      <div id="staff-dash" style="padding:var(--space-md)">
        <div class="shimmer" style="height:120px;border-radius:var(--radius-lg)"></div>
      </div>
    `;
    try {
      const result = await API.getOrders('limit=100');
      const orders = result.data;
      const pending = orders.filter(o => o.status === 'pending').length;
      const approved = orders.filter(o => o.status === 'approved').length;
      const outForDelivery = orders.filter(o => o.status === 'out_for_delivery').length;
      const delivered = orders.filter(o => o.status === 'delivered').length;

      document.getElementById('staff-dash').innerHTML = `
        <div class="dashboard-stats">
          ${Components.statCard('pending_actions', pending, 'Pending', 'orange')}
          ${Components.statCard('check_circle', approved, 'Approved', 'blue')}
          ${Components.statCard('local_shipping', outForDelivery, 'Out for Delivery', 'purple')}
          ${Components.statCard('done_all', delivered, 'Delivered', 'green')}
        </div>
        <div style="margin-top:var(--space-lg)">
          <h3 class="section-title" style="padding:0">Recent Pending Orders</h3>
          ${orders.filter(o => o.status === 'pending').slice(0, 5).map(o => `
            <div class="order-card stagger-item">
              <div class="order-card-header">
                <span class="order-id">#${o.orderId}</span>
                ${UI.statusBadge(o.status)}
              </div>
              <div style="font-size:13px"><strong>${o.customerName}</strong> • ${UI.formatPhone(o.customerPhone)}</div>
              <div class="order-items-summary">${o.items.map(i => i.name + ' x' + i.quantity).join(', ')}</div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="order-total">${UI.formatPrice(o.totalAmount)}</span>
                <span class="order-date">${UI.formatDate(o.createdAt)}</span>
              </div>
              <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm)">
                <button class="btn btn-primary btn-sm" onclick="StaffScreens.updateOrder('${o._id}','approved')">
                  <span class="material-icons-round" style="font-size:16px">check</span> ${t('approve')}
                </button>
                <button class="btn btn-danger btn-sm" onclick="StaffScreens.updateOrder('${o._id}','rejected')">
                  <span class="material-icons-round" style="font-size:16px">close</span> ${t('reject')}
                </button>
              </div>
            </div>
          `).join('')}
          ${pending === 0 ? '<p style="color:var(--text-hint);text-align:center;padding:var(--space-lg)">No pending orders 🎉</p>' : ''}
        </div>
        <button class="btn btn-danger btn-full mt-lg" onclick="Store.logout();Router.navigate('login')">
          <span class="material-icons-round">logout</span> ${t('logout')}
        </button>
      `;
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  },

  async renderOrders() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('manage_orders'))}
      <div class="tabs">
        <button class="tab active" onclick="StaffScreens.filterOrders('all', this)">All</button>
        <button class="tab" onclick="StaffScreens.filterOrders('pending', this)">Pending</button>
        <button class="tab" onclick="StaffScreens.filterOrders('approved', this)">Approved</button>
        <button class="tab" onclick="StaffScreens.filterOrders('out_for_delivery', this)">Delivery</button>
      </div>
      <div id="staff-orders" style="padding:var(--space-md)"></div>
    `;
    this.loadOrders();
  },

  async loadOrders(status = '') {
    const list = document.getElementById('staff-orders');
    if (!list) return;
    list.innerHTML = '<div class="shimmer" style="height:80px;border-radius:var(--radius-md)"></div>';

    try {
      const params = status && status !== 'all' ? `status=${status}&limit=50` : 'limit=50';
      const result = await API.getOrders(params);

      if (result.data.length === 0) {
        list.innerHTML = UI.emptyState('receipt_long', 'No orders', '');
        return;
      }

      list.innerHTML = result.data.map(o => `
        <div class="order-card stagger-item">
          <div class="order-card-header">
            <span class="order-id">#${o.orderId}</span>
            ${UI.statusBadge(o.status)}
          </div>
          <div style="font-size:13px"><strong>${o.customerName}</strong></div>
          <div style="font-size:12px;color:var(--text-hint)">${UI.formatPhone(o.customerPhone)} • ${o.deliveryAddress || ''}</div>
          <div class="order-items-summary">${o.items.map(i => i.name + ' x' + i.quantity).join(', ')}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="order-total">${UI.formatPrice(o.totalAmount)}</span>
            <span class="order-date">${UI.formatDate(o.createdAt)}</span>
          </div>
          ${o.paymentScreenshot ? `<div style="margin-top:var(--space-sm)"><a href="${CONFIG.API_URL.replace('/api','')}${o.paymentScreenshot}" target="_blank" class="btn btn-sm btn-ghost"><span class="material-icons-round" style="font-size:16px">image</span> View Payment Proof</a></div>` : ''}
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);flex-wrap:wrap">
            ${o.status === 'pending' ? `
              <button class="btn btn-primary btn-sm" onclick="StaffScreens.updateOrder('${o._id}','approved')">${t('approve')}</button>
              <button class="btn btn-danger btn-sm" onclick="StaffScreens.updateOrder('${o._id}','rejected')">${t('reject')}</button>
            ` : ''}
            ${o.status === 'approved' ? `
              <button class="btn btn-secondary btn-sm" onclick="AdminScreens.showAssignDelivery('${o._id}')">${t('assign_delivery')}</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  },

  filterOrders(status, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    this.loadOrders(status);
  },

  async updateOrder(orderId, status) {
    UI.showLoading();
    try {
      await API.updateOrderStatus(orderId, { status });
      UI.toast('Order updated!', 'success');
      // Refresh current view
      if (document.getElementById('staff-orders')) this.loadOrders();
      else this.renderDashboard();
    } catch (error) {
      UI.toast(error.message, 'error');
    } finally {
      UI.hideLoading();
    }
  },

  async renderStock() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('inventory'))}
      <div id="staff-stock" style="padding:var(--space-md)">
        <div class="shimmer" style="height:60px;margin-bottom:8px;border-radius:var(--radius-md)"></div>
      </div>
    `;

    try {
      const result = await API.getInventory();
      const list = document.getElementById('staff-stock');

      list.innerHTML = result.data.inventory.map(inv => `
        <div class="list-item stagger-item">
          <div style="flex:1">
            <div style="font-weight:600">${inv.product?.name || 'Unknown'}</div>
            <div style="font-size:12px;color:var(--text-hint)">${inv.product?.unit || ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;font-size:18px;${inv.isLowStock ? 'color:var(--error)' : ''}">${inv.currentStock}</div>
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="btn btn-sm btn-secondary" style="padding:4px 8px;min-height:auto" onclick="AdminScreens.adjustStock('${inv.product?._id}','add')">+</button>
              <button class="btn btn-sm btn-ghost" style="padding:4px 8px;min-height:auto" onclick="AdminScreens.adjustStock('${inv.product?._id}','deduct')">−</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  }
};
