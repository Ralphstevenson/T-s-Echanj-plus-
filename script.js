// 1. Enpòte modil Firebase SDK v9+ yo
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  child 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Konfigirasyon Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAjK6EPlokkARHnakMaDRjqRzN-yQqlayU",
  authDomain: "echanj-plus.firebaseapp.com",
  databaseURL: "https://echanj-plus-default-rtdb.firebaseio.com",
  projectId: "echanj-plus",
  storageBucket: "echanj-plus.firebasestorage.app",
  messagingSenderId: "117332306453",
  appId: "1:117332306453:web:41d04226aa15ca5c3fbc1c",
  measurementId: "G-LPGLMCR7HP"
};

// Inisyalize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. Element DOM yo
const loadingOverlay = document.getElementById('loading-overlay');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const signupBtn = document.getElementById('signup-btn');
const alertBox = document.getElementById('alert-box');
const authContainer = document.getElementById('auth-container');
const dashboardSection = document.getElementById('dashboard-section');
const userDisplayPhone = document.getElementById('user-display-phone');
const logoutBtn = document.getElementById('logout-btn');

const pwdInput = document.getElementById('signup-password');
const confirmPwdInput = document.getElementById('signup-confirm-password');
const phoneInput = document.getElementById('signup-phone');

// Cache Loader a lè paj la fin chaje
window.addEventListener('load', () => {
  hideLoader();
});

// 3. Jesyon Tabs & UI Otantifikasyon
window.switchTab = function(tab) {
  const isSignup = tab === 'signup';
  document.getElementById('signup-section').classList.toggle('active', isSignup);
  document.getElementById('login-section').classList.toggle('active', !isSignup);
  document.getElementById('tab-signup').classList.toggle('active', isSignup);
  document.getElementById('tab-login').classList.toggle('active', !isSignup);
  alertBox.style.display = 'none';
};

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

function showAlert(message, isError = true) {
  alertBox.textContent = message;
  alertBox.style.display = 'block';
  alertBox.style.color = isError ? '#ef4444' : '#10b981';
}

function showLoader() { loadingOverlay.style.display = 'flex'; }
function hideLoader() { loadingOverlay.style.display = 'none'; }

// 4. Validasyon Modyepas ak Règ Sekirite yo
const rules = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  special: /[^a-zA-Z0-9]/,
  length: /^.{8,}$/
};

function checkPasswordRules() {
  const pwd = pwdInput.value;
  const phone = phoneInput.value;

  const validLower = rules.lowercase.test(pwd);
  const validUpper = rules.uppercase.test(pwd);
  const validNumber = rules.number.test(pwd);
  const validSpecial = rules.special.test(pwd);
  const validLength = rules.length.test(pwd);
  
  // Anti-Swiv nimewo (ex: 1234, 4321)
  const validNoSeqNum = !/(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(pwd);
  
  // Anti-Swiv let (ex: abc, cba)
  const validNoSeqLet = !/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(pwd);
  
  // Pa gen login (nimewo telefòn) nan modyepas la
  const validNoLogin = phone.length < 4 || !pwd.includes(phone);
  
  // Pa gen karaktè k ap repete (ex: aaa, 111)
  const validNoRepeat = !/(.)\1\1/.test(pwd);

  // Mete koulè ak ikòn nan lis HTML la
  updateRuleUI('rule-lowercase', validLower);
  updateRuleUI('rule-uppercase', validUpper);
  updateRuleUI('rule-number', validNumber);
  updateRuleUI('rule-special', validSpecial);
  updateRuleUI('rule-length', validLength);
  updateRuleUI('rule-no-seq-num', validNoSeqNum);
  updateRuleUI('rule-no-seq-let', validNoSeqLet);
  updateRuleUI('rule-no-login', validNoLogin);
  updateRuleUI('rule-no-repeat', validNoRepeat);

  const isFormValid = validLower && validUpper && validNumber && validSpecial && 
                      validLength && validNoSeqNum && validNoSeqLet && 
                      validNoLogin && validNoRepeat && (pwd === confirmPwdInput.value);

  signupBtn.disabled = !isFormValid;
}

function updateRuleUI(elementId, isValid) {
  const el = document.getElementById(elementId);
  if (el) {
    el.style.color = isValid ? '#10b981' : '#6b7280';
    const icon = el.querySelector('.status-icon');
    if (icon) icon.textContent = isValid ? '✓ ' : '• ';
  }
}

// Koute sa k ap tape nan chan yo
pwdInput.addEventListener('input', checkPasswordRules);
confirmPwdInput.addEventListener('input', checkPasswordRules);
phoneInput.addEventListener('input', checkPasswordRules);

// 5. Enskripsyon (Sove nan Firebase Realtime Database)
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById('signup-phone').value.trim();
  const password = pwdInput.value;
  const email = document.getElementById('signup-email').value.trim();
  const referral = document.getElementById('signup-referral').value.trim();

  if (password !== confirmPwdInput.value) {
    showAlert('Modyepas yo pa menm!');
    return;
  }

  showLoader();

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${phone}`));
    
    if (snapshot.exists()) {
      hideLoader();
      showAlert('Nimewo sa a gen yon kont deja!');
      return;
    }

    // Anregistre nouvo itilizatè a
    await set(ref(db, 'users/' + phone), {
      phone: "+509" + phone,
      email: email,
      password: password,
      balance: 0.00,
      referralCode: referral || null,
      createdAt: new Date().toISOString()
    });

    hideLoader();
    showAlert('Kont ou kreye ak siksè!', false);
    
    // Antre dirèkteman sou Akey
    openDashboard("+509 " + phone);

  } catch (error) {
    hideLoader();
    showAlert('Erè: ' + error.message);
  }
});

// 6. Koneksyon
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  showLoader();

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${phone}`));

    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.password === password) {
        hideLoader();
        // Antre dirèkteman sou Akey
        openDashboard("+509 " + phone);
      } else {
        hideLoader();
        showAlert('Modyepas la pa bon!');
      }
    } else {
      hideLoader();
      showAlert('Nimewo sa a pa gen kont!');
    }
  } catch (error) {
    hideLoader();
    showAlert('Erè koneksyon: ' + error.message);
  }
});

// 7. Jesyon Navigasyon & Afichaj Seksyon yo
window.switchSection = function(targetSectionId) {
  // Kachè tout seksyon yo nan Dashboard la
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(section => {
    section.style.display = 'none';
  });

  // Afiche sèlman seksyon ki gen mande a
  const activeSection = document.getElementById(`${targetSectionId}-section`);
  if (activeSection) {
    activeSection.style.display = 'block';
  }
};

// Fonksyon ki ouvri Dashboard la epi ki asire moun nan antre dwat sou Akey
function openDashboard(phone) {
  authContainer.style.display = 'none';
  dashboardSection.style.display = 'block';
  if (userDisplayPhone) {
    userDisplayPhone.textContent = phone;
  }

  // FORCE ITILIZATÈ A ANTRE DIRÈKTEMAN SOU SEKSYON AKEY
  switchSection('home');
}

// 8. Dekoneksyon
logoutBtn.addEventListener('click', () => {
  dashboardSection.style.display = 'none';
  authContainer.style.display = 'block';
  signupForm.reset();
  loginForm.reset();
  checkPasswordRules();
});
