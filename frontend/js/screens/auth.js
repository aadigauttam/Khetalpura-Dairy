// ============================================
// Authentication Screens
// ============================================
const AuthScreens = {
  renderLogin() {
    const settings = Store.getSettings();
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="material-icons-round">local_drink</span>
            <h1 class="auth-title" id="auth-dairy-name">${getLocalizedField(settings, 'dairyName') || CONFIG.APP_NAME}</h1>
            <p class="auth-subtitle">${t('customer_login')}</p>
          </div>

          <div class="form-group">
            <label class="form-label">${t('phone_label')}</label>
            <div class="phone-input-group">
              <span class="phone-prefix">+91</span>
              <input type="tel" id="login-phone" class="form-input" placeholder="${t('phone_placeholder')}" maxlength="10" inputmode="numeric" pattern="[0-9]*">
            </div>
            <div class="form-error hidden" id="phone-error">${t('invalid_phone')}</div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="send-otp-btn" onclick="AuthScreens.handleSendOTP()">
            <span class="material-icons-round">sms</span> ${t('send_otp')}
          </button>

          <div class="auth-options">
            <button class="btn btn-ghost btn-sm" onclick="UI.toggleLanguage()">
              <span class="material-icons-round" style="font-size:18px">translate</span>
              ${currentLang === 'en' ? 'हिंदी' : 'English'}
            </button>
            <button class="btn btn-ghost btn-sm" onclick="UI.toggleTheme()">
              <span class="material-icons-round" style="font-size:18px">${Store.getTheme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>

          <div class="auth-footer">
            <a href="javascript:void(0)" onclick="Router.navigate('staff-login')">${t('staff_login')} →</a>
          </div>
        </div>
      </div>
    `;

    // Auto-focus phone input
    setTimeout(() => document.getElementById('login-phone')?.focus(), 300);
  },

  async handleSendOTP() {
    const phoneInput = document.getElementById('login-phone');
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById('phone-error');
    const btn = document.getElementById('send-otp-btn');

    // Validate
    if (!UI.validatePhone(phone)) {
      errorEl.classList.remove('hidden');
      phoneInput.classList.add('error');
      return;
    }

    errorEl.classList.add('hidden');
    phoneInput.classList.remove('error');

    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px"></span> ${t('loading')}`;

    try {
      const result = await API.sendOTP(CONFIG.COUNTRY_CODE + phone);
      Store.setOTPPhone(CONFIG.COUNTRY_CODE + phone);
      UI.toast(t('otp_sent'), 'success');
      Router.navigate('otp');
    } catch (error) {
      UI.toast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-icons-round">sms</span> ${t('send_otp')}`;
    }
  },

  renderOTP() {
    const phone = Store.getOTPPhone();
    if (!phone) return Router.navigate('login');

    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="material-icons-round">lock</span>
          </div>
          <h2 class="auth-title">${t('verify_otp')}</h2>
          <p class="auth-subtitle">${t('enter_otp')}<br><strong>${UI.formatPhone(phone)}</strong></p>

          <div class="otp-inputs">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="0">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="1">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="2">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="3">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="4">
            <input type="tel" class="otp-input" maxlength="1" inputmode="numeric" data-otp="5">
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="verify-otp-btn" onclick="AuthScreens.handleVerifyOTP()">
            ${t('verify_otp')}
          </button>

          <div class="auth-footer" style="margin-top:var(--space-lg)">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('login')">← ${t('phone_label')}</button>
          </div>
        </div>
      </div>
    `;

    // Setup OTP auto-advance
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, i) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && i < 5) inputs[i + 1].focus();
        if (i === 5 && e.target.value) AuthScreens.handleVerifyOTP();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) inputs[i - 1].focus();
      });
    });
    inputs[0].focus();
  },

  async handleVerifyOTP() {
    const phone = Store.getOTPPhone();
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const btn = document.getElementById('verify-otp-btn');

    if (otp.length < 4) {
      UI.toast('Please enter complete OTP', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px"></span>`;

    try {
      const result = await API.verifyOTP(phone, otp);
      Store.setToken(result.data.token);
      Store.setUser(result.data.user);
      Store.clearOTPPhone();

      if (result.data.isNewUser) {
        Router.navigate('signup');
      } else {
        UI.toast(t('success') + '!', 'success');
        Router.navigate(Router.getDefaultRoute());
      }
    } catch (error) {
      UI.toast(error.message, 'error');
      btn.disabled = false;
      btn.innerHTML = t('verify_otp');
    }
  },

  renderSignup() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="material-icons-round">person_add</span>
          </div>
          <h2 class="auth-title">${t('complete_signup')}</h2>
          <p class="auth-subtitle">Tell us about yourself</p>

          <div class="form-group">
            <label class="form-label">${t('name_label')}</label>
            <input type="text" id="signup-name" class="form-input" placeholder="${t('name_placeholder')}">
          </div>

          <div class="form-group">
            <label class="form-label">${t('address_label')}</label>
            <textarea id="signup-address" class="form-input" rows="3" placeholder="${t('address_placeholder')}"></textarea>
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="signup-btn" onclick="AuthScreens.handleSignup()">
            <span class="material-icons-round">check_circle</span> ${t('complete_signup')}
          </button>
        </div>
      </div>
    `;
  },

  async handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const address = document.getElementById('signup-address').value.trim();
    const btn = document.getElementById('signup-btn');

    if (!name || name.length < 2) {
      UI.toast('Please enter your name', 'warning');
      return;
    }
    if (!address || address.length < 5) {
      UI.toast('Please enter your address', 'warning');
      return;
    }

    btn.disabled = true;

    try {
      const user = Store.getUser();
      const result = await API.signup({ name, address, phone: user.phone });
      Store.setToken(result.data.token);
      Store.setUser(result.data.user);
      UI.toast(t('success') + '! Welcome!', 'success');
      Router.navigate('customer-home');
    } catch (error) {
      UI.toast(error.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  renderStaffLogin() {
    const settings = Store.getSettings();
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="material-icons-round">admin_panel_settings</span>
            <h1 class="auth-title">${getLocalizedField(settings, 'dairyName') || CONFIG.APP_NAME}</h1>
            <p class="auth-subtitle">${t('staff_login')}</p>
          </div>

          <div class="form-group">
            <label class="form-label">${t('phone_label')}</label>
            <div class="phone-input-group">
              <span class="phone-prefix">+91</span>
              <input type="tel" id="staff-phone" class="form-input" placeholder="${t('phone_placeholder')}" maxlength="10" inputmode="numeric">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${t('password_label')}</label>
            <input type="password" id="staff-password" class="form-input" placeholder="${t('password_placeholder')}">
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="staff-login-btn" onclick="AuthScreens.handleStaffLogin()">
            <span class="material-icons-round">login</span> ${t('login')}
          </button>

          <div class="auth-footer">
            <a href="javascript:void(0)" onclick="Router.navigate('login')">← ${t('customer_login')}</a>
          </div>
        </div>
      </div>
    `;
  },

  async handleStaffLogin() {
    const phone = document.getElementById('staff-phone').value.trim();
    const password = document.getElementById('staff-password').value;
    const btn = document.getElementById('staff-login-btn');

    if (!UI.validatePhone(phone)) {
      UI.toast(t('invalid_phone'), 'warning');
      return;
    }
    if (!password || password.length < 6) {
      UI.toast('Password must be at least 6 characters', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px"></span>`;

    try {
      const result = await API.staffLogin(CONFIG.COUNTRY_CODE + phone, password);
      Store.setToken(result.data.token);
      Store.setUser(result.data.user);
      UI.toast(`Welcome, ${result.data.user.name}!`, 'success');
      Router.navigate(Router.getDefaultRoute());
    } catch (error) {
      UI.toast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-icons-round">login</span> ${t('login')}`;
    }
  }
};
