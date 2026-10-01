/* js/main.js - Konfigirasyon Prensipal Firebase, Dashboard, UI ak Sèvis */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. KONFIGIRASYON FIREBASE (EKSPÒTE POU TOUT PYÈS)
// ==========================================
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

// Inisyalizasyon Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// ==========================================
// 2. VARIYAB GLOBAL AK UI UTILITIES
// ==========================================
let rawUserBalance = "0.00 HTG";
let balanceHidden = false;
let currentSlide = 0;

export function hideLoader() {
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
}

export function showLoader() {
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.style.display = 'flex';
    loader.style.opacity = '1';
  }
}

export function showAuthAlert(message, type) {
  const alertBox = document.getElementById('alert-box');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = `alert-msg ${type}`;
    alertBox.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(hideLoader, 500);
  initCarousel();
  fetchSystemConfig();
  initLogoutEvent();
});

// ==========================================
// 3. KONTWÒL ETAT OTANTIFIKASYON (FIREBASE AUTH)
// ==========================================
onAuthStateChanged(auth, (user) => {
  const authContainer = document.getElementById('auth-container');
  const dashboardSection = document.getElementById('dashboard-section');

  if (user) {
    // Kache fòm atantifikasyon an epi afiche dashboard la
    if (authContainer) {
      authContainer.style.display = 'none';
      authContainer.classList.add('hidden');
    }
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      dashboardSection.classList.remove('hidden');
    }

    const displayPhone = user.email ? user.email.split('@')[0] : 'Itilizatè';
    
    const userPhoneEl = document.getElementById('user-display-phone');
    const sidebarPhoneEl = document.getElementById('sidebar-user-phone');
    if (userPhoneEl) userPhoneEl.textContent = '+509 ' + displayPhone;
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = '+509 ' + displayPhone;

    // Chaje solde an tan reyèl
    try {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.balance !== undefined) {
          rawUserBalance = parseFloat(data.balance).toFixed(2) + " HTG";
        } else {
          rawUserBalance = "0.00 HTG";
        }
        updateBalanceUI();
      });
    } catch (e) {
      console.error("Erè chajman solde:", e);
    }

  } else {
    // Si pa gen itilizatè, kache dashboard la epi afiche auth
    if (dashboardSection) {
      dashboardSection.style.display = 'none';
      dashboardSection.classList.add('hidden');
    }
    if (authContainer) {
      authContainer.style.display = 'block';
      authContainer.classList.remove('hidden');
    }
  }

  // Asire nou retire loader a nan nenpòt ka
  hideLoader();
});

// ==========================================
// 4. KONFIGIRASYON SISTÈM AN TAN REYÈL
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
// 5. FONKSYON NAN WINDOW POU DOM / HTML LA
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

  // Si w gen plizyè seksyon nan Dashboard la ki chanje lè w klike sou meni anba a:
  const dashViews = document.querySelectorAll('.dash-view');
  if (dashViews.length > 0) {
    dashViews.forEach(view => view.style.display = 'none');
    const targetView = document.getElementById(`dash-view-${tab}`);
    if (targetView) targetView.style.display = 'block';
  }
};

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

function initLogoutEvent() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        showLoader();
        await signOut(auth);
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
          window.toggleSidebar();
        }
      } catch (error) {
        console.error("Erè dekoneksyon:", error);
      } finally {
        hideLoader();
      }
    });
  }
}
