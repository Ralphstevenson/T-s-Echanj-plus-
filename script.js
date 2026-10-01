/* js/main.js - Fichye Prensipal Echanj Plus */

import { auth, db, ref, onValue } from "./config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Variable global pou kenbe solde a an memwa
let rawUserBalance = "0.00 HTG";
let balanceHidden = false;

// ==========================================
// 1. INITIALISATION & LISTENERS
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

// Koute eta koneksyon Firebase (Auth State Listener)
onAuthStateChanged(auth, (user) => {
  const authContainer = document.getElementById('auth-container');
  const dashboardSection = document.getElementById('dashboard-section');

  if (user) {
    // Si itilizatè a konekte, montre dashboard la
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';

    // Afiche nimewo oswa enfòmasyon itilizatè a
    const displayPhone = user.email ? user.email.split('@')[0] : 'Itilizatè';
    
    const userPhoneEl = document.getElementById('user-display-phone');
    const sidebarPhoneEl = document.getElementById('sidebar-user-phone');
    if (userPhoneEl) userPhoneEl.textContent = '+509 ' + displayPhone;
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = '+509 ' + displayPhone;

    // Chaje solde ak enfòmasyon an tan reyèl nan Firebase Realtime Database
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.balance !== undefined) {
        rawUserBalance = parseFloat(data.balance).toFixed(2) + " HTG";
        updateBalanceUI();
      }
    });

  } else {
    // Si itilizatè a pa konekte, montre fòmilè auth la
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (authContainer) authContainer.style.display = 'block';
  }
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

  // SOUMISYON FORM KONEKSYON (FIREBASE LOGIN)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value;
      const password = document.getElementById('login-password').value;
      
      // Gen anpil fwa nimewo w la sèvi kòm baz pou email
      const formattedEmail = `${phone}@echanjplus.com`;

      try {
        await signInWithEmailAndPassword(auth, formattedEmail, password);
        console.log("Koneksyon reyisi!");
      } catch (error) {
        showAuthAlert("Nimewo oswa modpas la pa kòrèk.", "error");
      }
    });
  }

  // SOUMISYON FORM ENSKRIPSYON (FIREBASE SIGNUP)
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('signup-phone').value;
      const password = document.getElementById('signup-password').value;
      const email = document.getElementById('signup-email').value || `${phone}@echanjplus.com`;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Enskripsyon reyisi!");
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
// 4. SIDEBAR & DASHBOARD INTERACTIONS
// ==========================================
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

// Kach-kach / Montre Balans
window.toggleBalanceVisibility = function() {
  balanceHidden = !balanceHidden;
  updateBalanceUI();
};

function updateBalanceUI() {
  const balanceEl = document.getElementById('user-balance');
  if (balanceEl) {
    if (balanceHidden) {
      balanceEl.textContent = '••••••';
    } else {
      balanceEl.textContent = rawUserBalance;
    }
  }
}

// ==========================================
// 5. CAROUSEL BANNER
// ==========================================
let currentSlide = 0;

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

// Dekoneksyon (Firebase Logout)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      if (document.getElementById('sidebar')?.classList.contains('active')) {
        toggleSidebar();
      }
    } catch (error) {
      console.error("Erè pandan dekoneksyon an:", error);
    }
  });
}
