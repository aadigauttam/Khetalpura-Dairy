// ============================================
// Admin Screens
// ============================================
const AdminScreens = {
  async renderDashboard() {
    const content = document.getElementById('main-content');
    const settings = Store.getSettings();
    content.innerHTML = `
      ${UI.pageHeader(getLocalizedField(settings, 'dairyName') || t('dashboard'), `
        <button class="btn btn-ghost btn-sm" onclick="UI.toggleLanguage()"><span class="material-icons-round">translate</span></button>
        <button class="btn btn-ghost btn-sm" onclick="UI.toggleTheme()"><span class="material-icons-round">${Store.getTheme()==='dark'?'light_mode':'dark_mode'}</span></button>
      `)}
      <div id="dashboard-content"><div class="p-md"><div class="shimmer" style="height:200px;border-radius:var(--radius-lg)"></div></div></div>
    `;
    try {
      const result = await API.getDashboard();
      const d = result.data;
      document.getElementById('dashboard-content').innerHTML = `
        <div class="dashboard-stats">
          ${Components.statCard('currency_rupee', UI.formatPrice(d.today.revenue), `${t('today')} ${t('total_revenue')}`, 'green')}
          ${Components.statCard('receipt_long', d.today.orders, `${t('today')} ${t('total_orders')}`, 'blue')}
          ${Components.statCard('people', d.totals.customers, t('total_customers'), 'orange')}
          ${Components.statCard('autorenew', d.totals.activeSubscriptions, t('active_subscriptions'), 'purple')}
        </div>
        <div class="dashboard-stats">
          ${Components.statCard('trending_up', UI.formatPrice(d.week.revenue), `${t('this_week')}`, 'green')}
          ${Components.statCard('calendar_month', UI.formatPrice(d.month.revenue), `${t('this_month')}`, 'blue')}
        </div>
        <div class="chart-container">
          <div class="chart-title">${t('revenue_chart')}</div>
          ${Components.barChart(d.dailyRevenue.map(r => ({ label: r._id.slice(-5), value: r.revenue })))}
        </div>
        <div style="padding:0 var(--space-md)">
          <div class="grid-2">
            <button class="card" style="text-align:center;cursor:pointer" onclick="Router.navigate('admin-customers')">
              <span class="material-icons-round" style="font-size:32px;color:var(--primary-500)">people</span>
              <div style="font-weight:600;margin-top:var(--space-sm)">${t('customers')}</div>
            </button>
            <button class="card" style="text-align:center;cursor:pointer" onclick="Router.navigate('admin-offers')">
              <span class="material-icons-round" style="font-size:32px;color:var(--warning)">local_offer</span>
              <div style="font-weight:600;margin-top:var(--space-sm)">Offers</div>
            </button>
            <button class="card" style="text-align:center;cursor:pointer" onclick="Router.navigate('admin-subscriptions')">
              <span class="material-icons-round" style="font-size:32px;color:var(--info)">autorenew</span>
              <div style="font-weight:600;margin-top:var(--space-sm)">Subscriptions</div>
            </button>
            <button class="card" style="text-align:center;cursor:pointer" onclick="Router.navigate('admin-whatsapp')">
              <span class="material-icons-round" style="font-size:32px;color:#25D366">chat</span>
              <div style="font-weight:600;margin-top:var(--space-sm)">WhatsApp</div>
            </button>
          </div>
        </div>
      `;
    } catch (error) { UI.toast(error.message, 'error'); }
  },

  async renderProducts() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('products'), `<button class="btn btn-primary btn-sm" onclick="AdminScreens.showAddProduct()"><span class="material-icons-round" style="font-size:16px">add</span> ${t('add_product')}</button>`)}
      <div id="admin-products-list" style="padding:var(--space-md)"><div class="shimmer" style="height:60px;margin-bottom:8px;border-radius:var(--radius-md)"></div></div>
    `;
    try {
      const result = await API.getProducts('limit=100');
      const list = document.getElementById('admin-products-list');
      list.innerHTML = result.data.map(p => `
        <div class="list-item stagger-item">
          <div class="list-item-avatar" style="border-radius:var(--radius-sm);background:var(--cream-100)">
            <span class="material-icons-round" style="color:var(--primary-300)">${CONFIG.CATEGORIES[p.category]?.icon||'local_drink'}</span>
          </div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px">${p.name}</div>
            <div style="font-size:12px;color:var(--text-hint)">${p.unit} • Stock: ${p.stock}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:var(--primary-500)">${UI.formatPrice(p.price)}</div>
            <span class="badge ${p.isAvailable?'badge-active':'badge-rejected'}" style="font-size:9px">${p.isAvailable?'Active':'Inactive'}</span>
          </div>
        </div>
      `).join('');
    } catch (error) { UI.toast(error.message, 'error'); }
  },

  showAddProduct() {
    UI.showModal(t('add_product'), `
      <div class="form-group"><label class="form-label">Name</label><input type="text" id="prod-name" class="form-input" placeholder="Product name"></div>
      <div class="form-group"><label class="form-label">Name (Hindi)</label><input type="text" id="prod-namehi" class="form-input" placeholder="उत्पाद का नाम"></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select id="prod-category" class="form-input">${Object.entries(CONFIG.CATEGORIES).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select>
      </div>
      <div style="display:flex;gap:var(--space-sm)">
        <div class="form-group" style="flex:1"><label class="form-label">Price (₹)</label><input type="number" id="prod-price" class="form-input" placeholder="0"></div>
        <div class="form-group" style="flex:1"><label class="form-label">Unit</label><input type="text" id="prod-unit" class="form-input" placeholder="1 ltr"></div>
      </div>
      <div class="form-group"><label class="form-label">Stock</label><input type="number" id="prod-stock" class="form-input" placeholder="0"></div>
      <button class="btn btn-primary btn-full mt-md" onclick="AdminScreens.saveProduct()">${t('save')}</button>
    `);
  },

  async saveProduct() {
    const data = {
      name: document.getElementById('prod-name').value,
      nameHi: document.getElementById('prod-namehi').value,
      category: document.getElementById('prod-category').value,
      price: parseFloat(document.getElementById('prod-price').value),
      unit: document.getElementById('prod-unit').value,
      stock: parseInt(document.getElementById('prod-stock').value) || 0
    };
    if (!data.name || !data.price || !data.unit) return UI.toast('Fill required fields', 'warning');
    UI.showLoading();
    try { await API.post('/products', data); UI.closeModal(); UI.toast('Product created!', 'success'); this.renderProducts(); }
    catch (e) { UI.toast(e.message, 'error'); }
    finally { UI.hideLoading(); }
  },

  async renderOrders() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      ${UI.pageHeader(t('manage_orders'), `<button class="btn btn-ghost btn-sm" onclick="AdminScreens.fixFailed()"><span class="material-icons-round" style="font-size:16px">build</span></button>`)}
      <div class="tabs"><button class="tab active" onclick="AdminScreens.filterOrders('all',this)">All</button><button class="tab" onclick="AdminScreens.filterOrders('pending',this)">Pending</button><button class="tab" onclick="AdminScreens.filterOrders('approved',this)">Approved</button><button class="tab" onclick="AdminScreens.filterOrders('delivered',this)">Delivered</button></div>
      <div id="admin-orders-list" style="padding:var(--space-md)"></div>
    `;
    this.loadAdminOrders();
  },

  async loadAdminOrders(status = '') {
    const list = document.getElementById('admin-orders-list');
    if (!list) return;
    list.innerHTML = '<div class="shimmer" style="height:80px;border-radius:var(--radius-md)"></div>';
    try {
      const params = status && status !== 'all' ? `status=${status}&limit=50` : 'limit=50';
      const result = await API.getOrders(params);
      if (result.data.length === 0) { list.innerHTML = UI.emptyState('receipt_long', 'No orders', ''); return; }
      list.innerHTML = result.data.map(o => `
        <div class="order-card stagger-item">
          <div class="order-card-header"><span class="order-id">#${o.orderId}</span>${UI.statusBadge(o.status)}</div>
          <div style="font-size:13px"><strong>${o.customerName}</strong> • ${UI.formatPhone(o.customerPhone)}</div>
          <div class="order-items-summary">${o.items.map(i=>i.name+' x'+i.quantity).join(', ')}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="order-total">${UI.formatPrice(o.totalAmount)}</span><span class="order-date">${UI.formatDate(o.createdAt)}</span>
          </div>
          ${o.status==='pending'?`<div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm)">
            <button class="btn btn-primary btn-sm" onclick="AdminScreens.updateStatus('${o._id}','approved')">${t('approve')}</button>
            <button class="btn btn-danger btn-sm" onclick="AdminScreens.updateStatus('${o._id}','rejected')">${t('reject')}</button>
          </div>`:''}
          ${o.status==='approved'?`<button class="btn btn-secondary btn-sm mt-sm" onclick="AdminScreens.showAssignDelivery('${o._id}')">${t('assign_delivery')}</button>`:''}
        </div>
      `).join('');
    } catch (e) { UI.toast(e.message, 'error'); }
  },

  filterOrders(status, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    this.loadAdminOrders(status);
  },

  async updateStatus(orderId, status) {
    UI.showLoading();
    try { await API.updateOrderStatus(orderId, { status }); UI.toast('Status updated', 'success'); this.loadAdminOrders(); }
    catch (e) { UI.toast(e.message, 'error'); } finally { UI.hideLoading(); }
  },

  async showAssignDelivery(orderId) {
    try {
      const result = await API.getDeliveryBoys();
      const boys = result.data.deliveryBoys;
      UI.showModal(t('assign_delivery'), boys.map(b => `
        <div class="list-item" onclick="AdminScreens.assignDelivery('${orderId}','${b._id}')">
          <div class="list-item-avatar">${b.name[0]}</div>
          <div><div class="settings-item-label">${b.name}</div><div class="settings-item-desc">${UI.formatPhone(b.phone)}</div></div>
        </div>
      `).join('') || '<p>No delivery boys found</p>');
    } catch (e) { UI.toast(e.message, 'error'); }
  },

  async assignDelivery(orderId, deliveryBoyId) {
    UI.closeModal(); UI.showLoading();
    try { await API.assignDelivery(orderId, deliveryBoyId); UI.toast('Delivery assigned', 'success'); this.loadAdminOrders(); }
    catch (e) { UI.toast(e.message, 'error'); } finally { UI.hideLoading(); }
  },

  async fixFailed() {
    UI.showLoading();
    try { const r = await API.fixFailedOrders(); UI.toast(`Fixed: ${r.data.totalFixed} orders`, 'success'); }
    catch (e) { UI.toast(e.message, 'error'); } finally { UI.hideLoading(); }
  },

  async renderInventory() {
    const content = document.getElementById('main-content');
    content.innerHTML = `${UI.pageHeader(t('inventory'))}
      <div id="inv-alerts" style="padding:var(--space-md)"></div>
      <div id="inv-list" style="padding:0 var(--space-md)"></div>`;
    try {
      const [invRes, alertRes] = await Promise.all([API.getInventory(), API.getLowStockAlerts()]);
      const alerts = alertRes.data.alerts;
      if (alerts.length > 0) {
        document.getElementById('inv-alerts').innerHTML = `<div class="card" style="border-left:4px solid var(--warning);margin-bottom:var(--space-md)"><div style="display:flex;align-items:center;gap:var(--space-sm);color:var(--warning);font-weight:600;margin-bottom:var(--space-sm)"><span class="material-icons-round">warning</span> ${t('low_stock')} (${alerts.length})</div>${alerts.map(a=>`<div style="font-size:13px">${a.product?.name}: <strong>${a.currentStock}</strong> left</div>`).join('')}</div>`;
      }
      document.getElementById('inv-list').innerHTML = invRes.data.inventory.map(inv => `
        <div class="list-item stagger-item">
          <div style="flex:1"><div style="font-weight:600">${inv.product?.name||'Unknown'}</div><div style="font-size:12px;color:var(--text-hint)">${inv.product?.category}</div></div>
          <div style="text-align:right"><div style="font-weight:700;font-size:18px;${inv.isLowStock?'color:var(--error)':''}">${inv.currentStock}</div>
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="btn btn-sm btn-secondary" style="padding:4px 8px;min-height:auto" onclick="AdminScreens.adjustStock('${inv.product?._id}','add')">+</button>
              <button class="btn btn-sm btn-ghost" style="padding:4px 8px;min-height:auto" onclick="AdminScreens.adjustStock('${inv.product?._id}','deduct')">−</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) { UI.toast(e.message, 'error'); }
  },

  adjustStock(productId, type) {
    UI.showModal('Update Stock', `
      <div class="form-group"><label class="form-label">Quantity</label><input type="number" id="stock-qty" class="form-input" value="1" min="1"></div>
      <div class="form-group"><label class="form-label">Reason</label><input type="text" id="stock-reason" class="form-input" placeholder="Optional"></div>
      <button class="btn btn-primary btn-full" onclick="AdminScreens.saveStock('${productId}','${type}')">${t('save')}</button>
    `);
  },

  async saveStock(productId, type) {
    const qty = parseInt(document.getElementById('stock-qty').value);
    const reason = document.getElementById('stock-reason').value;
    UI.closeModal(); UI.showLoading();
    try { await API.updateStock(productId, { quantity: qty, type, reason }); UI.toast('Stock updated', 'success'); this.renderInventory(); }
    catch (e) { UI.toast(e.message, 'error'); } finally { UI.hideLoading(); }
  },

  async renderCustomers() {
    const content = document.getElementById('main-content');
    content.innerHTML = `${UI.pageHeader(t('customers'))}
      <div class="search-bar"><span class="material-icons-round">search</span><input type="text" placeholder="Search customers..." oninput="AdminScreens.searchCustomers(this.value)"></div>
      <div id="cust-list" style="padding:0 var(--space-md)"></div>`;
    this.loadCustomers();
  },

  async loadCustomers(search = '') {
    const list = document.getElementById('cust-list');
    if (!list) return;
    try {
      const result = await API.getCustomers(search ? `search=${search}` : '');
      list.innerHTML = result.data.map(c => `
        <div class="list-item stagger-item">
          <div class="list-item-avatar">${c.name?.[0]?.toUpperCase()||'?'}</div>
          <div style="flex:1"><div style="font-weight:600">${c.name||'Unknown'}</div><div style="font-size:12px;color:var(--text-hint)">${UI.formatPhone(c.phone)}</div><div style="font-size:11px;color:var(--text-hint)">${c.address||''}</div></div>
        </div>
      `).join('') || UI.emptyState('people', 'No customers', '');
    } catch (e) { UI.toast(e.message, 'error'); }
  },

  searchCustomers: (() => { let timer; return (q) => { clearTimeout(timer); timer = setTimeout(() => AdminScreens.loadCustomers(q), 300); }; })(),

  async renderSettings() {
    const content = document.getElementById('main-content');
    let settings;
    try { settings = (await API.getSettings()).data.settings; Store.setSettings(settings); } catch { settings = Store.getSettings(); }
    content.innerHTML = `${UI.pageHeader(t('settings'))}
      <div style="padding:var(--space-md)">
        <div class="card mb-md"><h3 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md)">🏷️ Branding</h3>
          <div class="form-group"><label class="form-label">${t('dairy_name')}</label><input type="text" id="s-name" class="form-input" value="${settings.dairyName||''}"></div>
          <div class="form-group"><label class="form-label">${t('dairy_name')} (Hindi)</label><input type="text" id="s-namehi" class="form-input" value="${settings.dairyNameHi||''}"></div>
          <div class="form-group"><label class="form-label">${t('contact_phone')}</label>
            <div class="phone-input-group"><span class="phone-prefix">+91</span><input type="tel" id="s-phone" class="form-input" maxlength="10" value="${(settings.contactPhone||'').replace('91','')}"></div>
          </div>
        </div>
        <div class="card mb-md"><h3 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md)">💳 UPI Payment</h3>
          <div class="form-group"><label class="form-label">${t('upi_id')}</label><input type="text" id="s-upi" class="form-input" value="${settings.upiId||''}" placeholder="example@paytm"></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminScreens.saveSettings()">${t('save')}</button>
        <button class="btn btn-danger btn-full mt-md" onclick="Store.logout();Router.navigate('login')"><span class="material-icons-round">logout</span> ${t('logout')}</button>
      </div>`;
  },

  async saveSettings() {
    const data = { dairyName:document.getElementById('s-name').value, dairyNameHi:document.getElementById('s-namehi').value, upiId:document.getElementById('s-upi').value };
    const phone = document.getElementById('s-phone').value.trim();
    if (phone) data.contactPhone = '91' + phone;
    UI.showLoading();
    try { const r = await API.updateSettings(data); Store.setSettings(r.data.settings); UI.toast('Settings saved!', 'success'); }
    catch (e) { UI.toast(e.message, 'error'); } finally { UI.hideLoading(); }
  },

  renderOffers() { document.getElementById('main-content').innerHTML = `${UI.pageHeader('Offers')}<div class="p-md">${UI.emptyState('local_offer','Offers Management','Coming soon')}</div>`; },
  renderSubscriptions() { document.getElementById('main-content').innerHTML = `${UI.pageHeader('Subscriptions')}<div class="p-md">${UI.emptyState('autorenew','Subscription Management','Coming soon')}</div>`; },
  renderWhatsApp() { document.getElementById('main-content').innerHTML = `${UI.pageHeader('WhatsApp Config')}<div class="p-md">${UI.emptyState('chat','WhatsApp Configuration','Coming soon')}</div>`; }
};
