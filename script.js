/* js/main.js - Echanj Plus (Mizajou Jeneral Firebase & UI) */

import { auth, db, ref, onValue } from "./config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Varayb global pou kenbe solde ak eta aplikasyon an an memwa
let rawUserBalance = "0.00 HTG";
let balanceHidden = false;
let currentSlide = 0;

// ==========================================
// KONTWÒL LOADER A
// ==========================================
function hideLoader() {
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
}

// ==========================================
// 1. INITIALISATION PAJ LA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Masque loader apre 500ms max
  setTimeout(hideLoader, 500);

  // Initialisation pou validasyon règ modpas yo ak Carousel
  initAuthValidation();
  initCarousel();
  fetchSystemConfig();
});

// ==========================================
// 2. OTANTIFIKASYON (FIREBASE AUTH STATE)
// ==========================================
onAuthStateChanged(auth, (user) => {
  hideLoader();

  const authContainer = document.getElementById('auth-container');
  const dashboardSection = document.getElementById('dashboard-section');

  if (user) {
    // Si itilizatè a konekte, rantre nan Dashboard
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';

    const displayPhone = user.email ? user.email.split('@')[0] : 'Itilizatè';
    
    const userPhoneEl = document.getElementById('user-display-phone');
    const sidebarPhoneEl = document.getElementById('sidebar-user-phone');
    if (userPhoneEl) userPhoneEl.textContent = '+509 ' + displayPhone;
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = '+509 ' + displayPhone;

    // Koute chanjman nan solde a an tan reyèl nan Firebase Database
    try {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.balance !== undefined) {
          rawUserBalance = parseFloat(data.balance).toFixed(2) + " HTG";
          updateBalanceUI();
        }
      });
    } catch (e) {
      console.error("Erè chajman solde:", e);
    }

  } else {
    // Si li pa konekte, FORCE kache dashboard epi MONTRE fòm koneksyon an an premye
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (authContainer) authContainer.style.display = 'block';
  }
});

// ==========================================
// 3. SWITCH TAB (CONNEXION / INSCRIPTION) & TOGGLE MODPAS
// ==========================================
window.switchTab = function(tabName) {
  const loginSection = document.getElementById('login-section');
  const signupSection = document.getElementById('signup-section');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const alertBox = document.getElementById('alert-box');

  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'alert-msg';
  }

  if (tabName === 'login') {
    if (loginSection) loginSection.classList.add('active');
    if (signupSection) signupSection.classList.remove('active');
    if (tabLogin) tabLogin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
  } else {
    if (signupSection) signupSection.classList.add('active');
    if (loginSection) loginSection.classList.remove('active');
    if (tabSignup) tabSignup.classList.add('active');
    if (tabLogin) tabLogin.classList.remove('active');
  }
};

window.toggleVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

// ==========================================
// 4. VALIDASYON AK SOUMISYON FÒM YO
// ==========================================
function initAuthValidation() {
  const signupPassword = document.getElementById('signup-password');
  const signupConfirm = document.getElementById('signup-confirm-password');
  const signupPhone = document.getElementById('signup-phone');
  const signupBtn = document.getElementById('signup-btn');

  const rules = {
    lowercase: (val) => /[a-z]/.test(val),
    uppercase: (val) => /[A-Z]/.test(val),
    number: (val) => /[0-9]/.test(val),
    special: (val) => /[^A-Za-z0-9]/.test(val),
    length: (val) => val.length >= 8,
    noSeqNum: (val) => !/(012|123|234|345|456|567|678|789|890)/.test(val),
    noSeqLet: (val) => !/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(val),
    noLogin: (val, phone) => phone === '' || !val.includes(phone),
    noRepeat: (val) => !/(.)\1{2,}/.test(val)
  };

  function validateForm() {
    if (!signupPassword) return;

    const pwd = signupPassword.value;
    const phone = signupPhone ? signupPhone.value : '';
    const confirmPwd = signupConfirm ? signupConfirm.value : '';

    const isLower = rules.lowercase(pwd);
    updateRuleState('rule-lowercase', isLower);

    const isUpper = rules.uppercase(pwd);
    updateRuleState('rule-uppercase', isUpper);

    const isNum = rules.number(pwd);
    updateRuleState('rule-number', isNum);

    const isSpec = rules.special(pwd);
    updateRuleState('rule-special', isSpec);

    const isLen = rules.length(pwd);
    updateRuleState('rule-length', isLen);

    const isNoSeqNum = rules.noSeqNum(pwd);
    updateRuleState('rule-no-seq-num', isNoSeqNum);

    const isNoSeqLet = rules.noSeqLet(pwd);
    updateRuleState('rule-no-seq-let', isNoSeqLet);

    const isNoLogin = rules.noLogin(pwd, phone);
    updateRuleState('rule-no-login', isNoLogin);

    const isNoRepeat = rules.noRepeat(pwd);
    updateRuleState('rule-no-repeat', isNoRepeat);

    const allValid = isLower && isUpper && isNum && isSpec && isLen && isNoSeqNum && isNoSeqLet && isNoLogin && isNoRepeat;
    const isConfirmMatch = pwd === confirmPwd && confirmPwd.length > 0;

    if (signupBtn) {
      signupBtn.disabled = !(allValid && isConfirmMatch && phone.length === 8);
    }
  }

  function updateRuleState(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const icon = el.querySelector('.status-icon');

    if (isValid) {
      el.classList.add('valid');
      el.classList.remove('invalid');
      if (icon) icon.textContent = '✓ ';
    } else {
      el.classList.add('invalid');
      el.classList.remove('valid');
      if (icon) icon.textContent = '✕ ';
    }
  }

  if (signupPassword) signupPassword.addEventListener('input', validateForm);
  if (signupConfirm) signupConfirm.addEventListener('input', validateForm);
  if (signupPhone) signupPhone.addEventListener('input', validateForm);

  // Soumisyon Form Connexion (FIREBASE AUTH)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value;
      const password = document.getElementById('login-password').value;
      const formattedEmail = `${phone}@echanjplus.com`;

      try {
        await signInWithEmailAndPassword(auth, formattedEmail, password);
      } catch (error) {
        showAuthAlert("Nimewo oswa modpas la pa kòrèk.", "error");
      }
    });
  }

  // Soumisyon Form Inscription (FIREBASE AUTH)
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('signup-phone').value;
      const password = document.getElementById('signup-password').value;
      const email = `${phone}@echanjplus.com`;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        showAuthAlert(error.message, "error");
      }
    });
  }
}

function showAuthAlert(message, type) {
  const alertBox = document.getElementById('alert-box');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = `alert-msg ${type}`;
    alertBox.style.display = 'block';
  }
}

// ==========================================
// 5. FONKSYON SISTÈM AN TAN REYÈL (TO AK STATI)
// ==========================================
function fetchSystemConfig() {
  try {
    const configRef = ref(db, 'system_config');
    onValue(configRef, (snapshot) => {
      const config = snapshot.val();
      if (!config) return;

      const buyRateEl = document.getElementById('display-rate-buy');
      const sellRateEl = document.getElementById('display-rate-sell');
      if (buyRateEl && config.rate_buy) buyRateEl.textContent = parseFloat(config.rate_buy).toFixed(2) + " HTG";
      if (sellRateEl && config.rate_sell) sellRateEl.textContent = parseFloat(config.rate_sell).toFixed(2) + " HTG";

      const moncashStatusEl = document.getElementById('moncash-status');
      if (moncashStatusEl && config.moncash_status) {
        const active = config.moncash_status === 'active';
        moncashStatusEl.textContent = active ? 'Operasyonèl' : 'Pa disponib';
        moncashStatusEl.style.color = active ? '#22c55e' : '#ef4444';
      }

      const natcashStatusEl = document.getElementById('natcash-status');
      if (natcashStatusEl && config.natcash_status) {
        const active = config.natcash_status === 'active';
        natcashStatusEl.textContent = active ? 'Operasyonèl' : 'Pa disponib';
        natcashStatusEl.style.color = active ? '#22c55e' : '#ef4444';
      }

      const flashEl = document.getElementById('header-flash-info');
      if (flashEl && config.flash_message) {
        flashEl.textContent = config.flash_message;
        flashEl.style.display = 'block';
      }
    });
  } catch (e) {
    console.error("Erè konfigirasyon:", e);
  }
}

// ==========================================
// 6. INTERAKSYON DASHBOARD, BALANS AK SIDEBAR
// ==========================================
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
  }
};

window.toggleBalanceVisibility = function() {
  balanceHidden = !balanceHidden;
  updateBalanceUI();
};

function updateBalanceUI() {
  const balanceEl = document.getElementById('user-balance');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (balanceEl) {
    balanceEl.textContent = balanceHidden ? '••••••' : rawUserBalance;
  }
  if (eyeIcon) {
    eyeIcon.className = balanceHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
}

window.switchDashTab = function(tab, btn) {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  if (btn) btn.classList.add('active');
};

window.openActionModal = function(actionType) {
  alert(`Aksyon zgade: ${actionType.toUpperCase()}`);
};

// ==========================================
// 7. CAROUSEL BANNER & FAQ
// ==========================================
function initCarousel() {
  const dots = document.querySelectorAll('.carousel-dots .dot');
  if (!dots.length) return;

  setInterval(() => {
    currentSlide = (currentSlide + 1) % dots.length;
    goToSlide(currentSlide);
  }, 4000);
}

window.goToSlide = function(index) {
  const wrapper = document.getElementById('carousel-wrapper');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  if (!wrapper) return;

  currentSlide = index;
  wrapper.style.transform = `translateX(-${index * 100}%)`;

  dots.forEach((dot, idx) => {
    if (idx === index) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
};

window.toggleFaq = function(element) {
  const answer = element.querySelector('.faq-answer');
  const icon = element.querySelector('.faq-question i');

  if (!answer) return;

  if (answer.classList.contains('show')) {
    answer.classList.remove('show');
    if (icon) icon.className = 'fas fa-chevron-down faq-arrow';
  } else {
    answer.classList.add('show');
    if (icon) icon.className = 'fas fa-chevron-up faq-arrow';
  }
};

// ==========================================
// 8. DEKONEKSYON
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
          window.toggleSidebar();
        }
      } catch (error) {
        console.error("Erè dekoneksyon:", error);
      }
    });
  }
});
