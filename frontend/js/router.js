// ============================================
// Simple Client-Side Router
// ============================================
const Router = {
  _routes: {},
  _currentRoute: null,

  init() {
    // Register routes based on roles
    this._routes = {
      // Auth (no login required)
      'login': () => AuthScreens.renderLogin(),
      'otp': () => AuthScreens.renderOTP(),
      'signup': () => AuthScreens.renderSignup(),
      'staff-login': () => AuthScreens.renderStaffLogin(),

      // Customer
      'customer-home': () => CustomerScreens.renderHome(),
      'customer-products': () => CustomerScreens.renderProducts(),
      'customer-cart': () => CustomerScreens.renderCart(),
      'customer-checkout': () => CustomerScreens.renderCheckout(),
      'customer-orders': () => CustomerScreens.renderOrders(),
      'customer-subscriptions': () => CustomerScreens.renderSubscriptions(),
      'customer-profile': () => CustomerScreens.renderProfile(),

      // Admin
      'admin-dashboard': () => AdminScreens.renderDashboard(),
      'admin-products': () => AdminScreens.renderProducts(),
      'admin-orders': () => AdminScreens.renderOrders(),
      'admin-inventory': () => AdminScreens.renderInventory(),
      'admin-customers': () => AdminScreens.renderCustomers(),
      'admin-subscriptions': () => AdminScreens.renderSubscriptions(),
      'admin-offers': () => AdminScreens.renderOffers(),
      'admin-settings': () => AdminScreens.renderSettings(),
      'admin-whatsapp': () => AdminScreens.renderWhatsApp(),

      // Staff
      'staff-dashboard': () => StaffScreens.renderDashboard(),
      'staff-orders': () => StaffScreens.renderOrders(),
      'staff-stock': () => StaffScreens.renderStock(),

      // Delivery
      'delivery-dashboard': () => DeliveryScreens.renderDashboard(),
      'delivery-tasks': () => DeliveryScreens.renderTasks(),
    };
  },

  navigate(route, params = {}) {
    this._currentRoute = route;
    this._currentParams = params;

    const content = document.getElementById('main-content');
    content.innerHTML = '';
    content.className = 'page-enter';

    // Update bottom nav
    this._updateNav();

    // Execute route handler
    if (this._routes[route]) {
      this._routes[route](params);
    } else {
      content.innerHTML = '<div class="empty-state"><span class="material-icons-round">error_outline</span><h3>Page not found</h3></div>';
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  refresh() {
    if (this._currentRoute) {
      this.navigate(this._currentRoute, this._currentParams);
    }
  },

  getDefaultRoute() {
    const role = Store.getRole();
    switch (role) {
      case 'admin': return 'admin-dashboard';
      case 'staff': return 'staff-dashboard';
      case 'delivery': return 'delivery-dashboard';
      case 'customer': return 'customer-home';
      default: return 'login';
    }
  },

  _updateNav() {
    const nav = document.getElementById('bottom-nav');
    const role = Store.getRole();

    if (!Store.isLoggedIn() || this._currentRoute?.startsWith('login') || this._currentRoute?.startsWith('otp') || this._currentRoute?.startsWith('signup') || this._currentRoute?.startsWith('staff-login')) {
      nav.classList.add('hidden');
      return;
    }

    nav.classList.remove('hidden');
    nav.innerHTML = this._getNavItems(role);
  },

  _getNavItems(role) {
    const navConfigs = {
      customer: [
        { route: 'customer-home', icon: 'home', label: t('home') },
        { route: 'customer-products', icon: 'store', label: t('products') },
        { route: 'customer-cart', icon: 'shopping_cart', label: t('cart'), badge: true },
        { route: 'customer-orders', icon: 'receipt_long', label: t('orders') },
        { route: 'customer-profile', icon: 'person', label: t('profile') }
      ],
      admin: [
        { route: 'admin-dashboard', icon: 'dashboard', label: t('dashboard') },
        { route: 'admin-products', icon: 'inventory_2', label: t('products') },
        { route: 'admin-orders', icon: 'receipt_long', label: t('orders') },
        { route: 'admin-inventory', icon: 'warehouse', label: t('inventory') },
        { route: 'admin-settings', icon: 'settings', label: t('settings') }
      ],
      staff: [
        { route: 'staff-dashboard', icon: 'dashboard', label: t('dashboard') },
        { route: 'staff-orders', icon: 'receipt_long', label: t('orders') },
        { route: 'staff-stock', icon: 'warehouse', label: t('inventory') }
      ],
      delivery: [
        { route: 'delivery-dashboard', icon: 'dashboard', label: t('dashboard') },
        { route: 'delivery-tasks', icon: 'local_shipping', label: t('deliveries') }
      ]
    };

    const items = navConfigs[role] || [];
    return items.map(item => {
      const isActive = this._currentRoute === item.route;
      const badgeHtml = item.badge ? `<span id="cart-nav-badge" class="cart-badge ${Store.getCartCount() > 0 ? '' : 'hidden'}">${Store.getCartCount()}</span>` : '';
      return `
        <button class="nav-item ${isActive ? 'active' : ''}" onclick="Router.navigate('${item.route}')" id="nav-${item.route}">
          <span class="material-icons-round" style="position:relative">${item.icon}${badgeHtml}</span>
          <span>${item.label}</span>
        </button>
      `;
    }).join('');
  }
};
