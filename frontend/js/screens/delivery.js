// ============================================
// Delivery Boy Screens
// ============================================
const DeliveryScreens = {
  async renderDashboard() {
    const content = document.getElementById('main-content');
    const user = Store.getUser();

    content.innerHTML = `
      ${UI.pageHeader(t('my_deliveries'), `
        <button class="btn btn-ghost btn-sm" onclick="UI.toggleTheme()">
          <span class="material-icons-round">${Store.getTheme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      `)}
      <div style="padding:var(--space-md)">
        <div class="card mb-md" style="text-align:center;padding:var(--space-xl)">
          <div class="list-item-avatar" style="width:56px;height:56px;font-size:20px;margin:0 auto var(--space-sm)">
            ${user?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <h3>${user?.name || 'Delivery Boy'}</h3>
          <p style="color:var(--text-hint);font-size:13px">${UI.formatPhone(user?.phone)}</p>
        </div>
        <div id="delivery-stats" class="dashboard-stats"></div>
      </div>
      <div id="delivery-tasks-list" style="padding:0"></div>
      <div style="padding:var(--space-md)">
        <button class="btn btn-danger btn-full" onclick="Store.logout();Router.navigate('login')">
          <span class="material-icons-round">logout</span> ${t('logout')}
        </button>
      </div>
    `;

    this.loadDeliveries();
  },

  async loadDeliveries() {
    try {
      const result = await API.getOrders('limit=50');
      const orders = result.data;

      const pending = orders.filter(o => o.status === 'out_for_delivery').length;
      const delivered = orders.filter(o => o.status === 'delivered').length;

      const statsEl = document.getElementById('delivery-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          ${Components.statCard('local_shipping', pending, 'Pending Deliveries', 'orange')}
          ${Components.statCard('check_circle', delivered, 'Completed', 'green')}
        `;
      }

      const listEl = document.getElementById('delivery-tasks-list');
      if (listEl) {
        const activeOrders = orders.filter(o => o.status === 'out_for_delivery');
        if (activeOrders.length === 0) {
          listEl.innerHTML = `<div style="padding:var(--space-md)">${UI.emptyState('local_shipping', 'No pending deliveries', 'All caught up! 🎉')}</div>`;
        } else {
          listEl.innerHTML = activeOrders.map(o => Components.deliveryCard(o)).join('');
        }
      }
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  },

  async renderTasks() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('deliveries'))}
      <div class="tabs">
        <button class="tab active" onclick="DeliveryScreens.filterTasks('out_for_delivery', this)">Active</button>
        <button class="tab" onclick="DeliveryScreens.filterTasks('delivered', this)">Completed</button>
      </div>
      <div id="delivery-tasks" style="padding:0"></div>
    `;
    this.loadTasks('out_for_delivery');
  },

  async loadTasks(status) {
    const el = document.getElementById('delivery-tasks');
    if (!el) return;
    el.innerHTML = '<div style="padding:var(--space-md)"><div class="shimmer" style="height:150px;border-radius:var(--radius-lg)"></div></div>';

    try {
      const result = await API.getOrders(`status=${status}&limit=50`);
      if (result.data.length === 0) {
        el.innerHTML = `<div style="padding:var(--space-md)">${UI.emptyState('local_shipping', 'No deliveries', '')}</div>`;
        return;
      }
      el.innerHTML = result.data.map(o => Components.deliveryCard(o)).join('');
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  },

  filterTasks(status, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    this.loadTasks(status);
  },

  async markDelivered(orderId) {
    // In a full implementation, we'd open camera for proof photo
    // For now, just mark as delivered
    UI.confirm('Mark this order as delivered?', async () => {
      UI.showLoading();
      try {
        await API.patch(`/orders/${orderId}/deliver`);
        UI.toast('Order delivered! ✅', 'success');
        // Refresh
        if (document.getElementById('delivery-tasks')) this.loadTasks('out_for_delivery');
        else this.loadDeliveries();
      } catch (error) {
        UI.toast(error.message, 'error');
      } finally {
        UI.hideLoading();
      }
    });
  },

  shareLocation(customerPhone) {
    // Open WhatsApp with location sharing prompt
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
          const message = `📍 My current location: ${mapsLink}`;
          const phone = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone;
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        },
        () => {
          UI.toast('Location access denied', 'warning');
        }
      );
    } else {
      UI.toast('Location not supported', 'warning');
    }
  }
};
