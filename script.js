// ==========================================
// 1. ELEMAN AK VARIAB PRENSIPAL YO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Masque loader a Lè paj la fin chaje
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    setTimeout(() => {
      loader.style.display = 'none';
    }, 800);
  }

  // Initialisation pou règ modpas ak fòm yo
  initAuthValidation();
  initCarousel();
});

// ==========================================
// 2. OTANTIFIKASYON (AUTH) & SWITCH TAB
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
    loginSection.classList.add('active');
    signupSection.classList.remove('active');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupSection.classList.add('active');
    loginSection.classList.remove('active');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
};

// Pèmèt gade oswa kache modpas
window.toggleVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

// ==========================================
// 3. VALIDASYON RÈG MODPAS (INSCRIPTION)
// ==========================================
function initAuthValidation() {
  const signupPassword = document.getElementById('signup-password');
  const signupConfirm = document.getElementById('signup-confirm-password');
  const signupPhone = document.getElementById('signup-phone');
  const signupBtn = document.getElementById('signup-btn');

  if (!signupPassword) return;

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
    const pwd = signupPassword.value;
    const phone = signupPhone.value;
    const confirmPwd = signupConfirm.value;

    let allValid = true;

    // Verifikasyon chak règ
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

    allValid = isLower && isUpper && isNum && isSpec && isLen && isNoSeqNum && isNoSeqLet && isNoLogin && isNoRepeat;

    // Bouton an ap limen sèlman si tout règ valab epi modpas yo parey
    const isConfirmMatch = pwd === confirmPwd && confirmPwd.length > 0;
    signupBtn.disabled = !(allValid && isConfirmMatch && phone.length === 8);
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

  signupPassword.addEventListener('input', validateForm);
  signupConfirm.addEventListener('input', validateForm);
  signupPhone.addEventListener('input', validateForm);

  // Soumisyon Form Connexion
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value;
      
      // Similasyon koneksyon reyisi
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
      
      document.getElementById('user-display-phone').textContent = '+509 ' + phone;
      document.getElementById('sidebar-user-phone').textContent = '+509 ' + phone;
    });
  }

  // Soumisyon Form Inscription
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = document.getElementById('signup-phone').value;

      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';

      document.getElementById('user-display-phone').textContent = '+509 ' + phone;
      document.getElementById('sidebar-user-phone').textContent = '+509 ' + phone;
    });
  }
}

// ==========================================
// 4. SIDEBAR & DASHBOARD INTERACTIONS
// ==========================================
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
};

// Kach-kach / Montre Balans
let balanceHidden = false;
const originalBalance = "0.00 HTG";

window.toggleBalanceVisibility = function() {
  const balanceEl = document.getElementById('user-balance');
  balanceHidden = !balanceHidden;

  if (balanceHidden) {
    balanceEl.textContent = '••••••';
  } else {
    balanceEl.textContent = originalBalance;
  }
};

// Switch Tab nan Dashboard anba (Bottom Nav)
window.switchDashTab = function(tab, btn) {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  btn.classList.add('active');
  
  // Isit la ou ka ajoute lojik pou chanje paj nan dashboard la (ex: Sèvis, Profil)
};

// Bouton Aksyon Rapid yo (Depo, Retrè, Echanj, Istwa)
window.openActionModal = function(actionType) {
  alert(`Ou klike sou: ${actionType.toUpperCase()}`);
};

// ==========================================
// 5. CAROUSEL BANNER
// ==========================================
let currentSlide = 0;

function initCarousel() {
  const dots = document.querySelectorAll('.carousel-dots .dot');
  if (!dots.length) return;

  setInterval(() => {
    currentSlide = (currentSlide + 1) % 3;
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

// ==========================================
// 6. SANT ÈD / FAQ TOGGLE
// ==========================================
window.toggleFaq = function(element) {
  const answer = element.querySelector('.faq-answer');
  const icon = element.querySelector('.faq-question i');

  if (answer.style.display === 'none' || answer.style.display === '') {
    answer.style.display = 'block';
    if (icon) icon.className = 'fas fa-chevron-up';
  } else {
    answer.style.display = 'none';
    if (icon) icon.className = 'fas fa-chevron-down';
  }
};

// Dekoneksyon
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    toggleSidebar();
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
  });
}