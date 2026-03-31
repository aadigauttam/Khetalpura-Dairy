// ============================================
// App Entry Point
// ============================================
(async function initApp() {
  // 1. Apply saved theme
  Store.setTheme(Store.getTheme());

  // 2. Apply saved language
  if (currentLang === 'hi') document.body.classList.add('lang-hi');

  // 3. Initialize router
  Router.init();

  // 4. Load settings from API (non-blocking)
  try {
    const result = await API.getSettings();
    const settings = result.data.settings;
    Store.setSettings(settings);
    // Update splash screen with dynamic name
    const splashName = document.getElementById('splash-name');
    if (splashName) splashName.textContent = getLocalizedField(settings, 'dairyName') || CONFIG.APP_NAME;
    const splashTagline = document.getElementById('splash-tagline');
    if (splashTagline) splashTagline.textContent = getLocalizedField(settings, 'tagline') || '';
    // Update page title
    document.title = settings.dairyName || CONFIG.APP_NAME;
  } catch (e) {
    // Use cached settings
    console.log('Using cached settings');
  }

  // 5. Check connectivity
  window.addEventListener('online', () => {
    document.getElementById('offline-banner')?.classList.add('hidden');
  });
  window.addEventListener('offline', () => {
    document.getElementById('offline-banner')?.classList.remove('hidden');
  });
  if (!navigator.onLine) {
    document.getElementById('offline-banner')?.classList.remove('hidden');
  }

  // 6. Cart badge updates
  Store.onCartChange((count) => {
    const badge = document.getElementById('cart-nav-badge');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  });

  // 7. Hide splash and navigate
  setTimeout(() => {
    document.getElementById('splash-screen')?.classList.add('hidden');

    if (Store.isLoggedIn()) {
      // Auto-login: go to role-based home
      Router.navigate(Router.getDefaultRoute());
    } else {
      Router.navigate('login');
    }
  }, 1500);
})();
