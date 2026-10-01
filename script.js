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
    // Kache fòm otantifikasyon yo (Connexion / Inscription)
    if (authContainer) {
      authContainer.style.display = 'none';
      authContainer.classList.add('hidden');
    }

    // Afiche Paj Akèy / Dashboard la ak tout fonksyon l yo
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      dashboardSection.classList.remove('hidden');
    }

    // Rekipere nimewo telefòn nan san domèn email la (@echanjplus.com)
    let displayPhone = 'Itilizatè';
    if (user.email) {
      displayPhone = user.email.split('@')[0];
    }

    // Ajoute nimewo a nan Header ak Sidebar UI
    const userPhoneEl = document.getElementById('user-display-phone');
    const sidebarPhoneEl = document.getElementById('sidebar-user-phone');
    if (userPhoneEl) userPhoneEl.textContent = '+509 ' + displayPhone;
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = '+509 ' + displayPhone;

    // Chaje solde itilizatè a an tan reyèl sou Realtime Database
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
    // Si kliyan an dekonekte, kache akèy la epi tounen sou fòm otantifikasyon an
    if (dashboardSection) {
      dashboardSection.style.display = 'none';
      dashboardSection.classList.add('hidden');
    }
    if (authContainer) {
      authContainer.style.display = 'block';
      authContainer.classList.remove('hidden');
    }
  }

  // Retire loader an kèlkeswa sa k rive
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
      if (buyRateEl && config.rate_buy !== undefined) {
        buyRateEl.textContent = parseFloat(config.rate_buy).toFixed(2) + " HTG";
      }
      if (sellRateEl && config.rate_sell !== undefined) {
        sellRateEl.textContent = parseFloat(config.rate_sell).toFixed(2) + " HTG";
      }

      const moncashStatusEl = document.getElementById('moncash-status');
      const moncashDot = document.getElementById('moncash-dot');
      if (moncashStatusEl && config.moncash_status) {
        const active = config.moncash_status === 'active';
        moncashStatusEl.textContent = active ? 'Operasyonèl' : 'Pa disponib';
        moncashStatusEl.style.color = active ? '#22c55e' : '#ef4444';
        if (moncashDot) moncashDot.className = active ? 'dot-status online' : 'dot-status offline';
      }

      const natcashStatusEl = document.getElementById('natcash-status');
      const natcashDot = document.getElementById('natcash-dot');
      if (natcashStatusEl && config.natcash_status) {
        const active = config.natcash_status === 'active';
        natcashStatusEl.textContent = active ? 'Operasyonèl' : 'Pa disponib';
        natcashStatusEl.style.color = active ? '#22c55e' : '#ef4444';
        if (natcashDot) natcashDot.className = active ? 'dot-status online' : 'dot-status offline';
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
// 5. FONKSYON PIVOT AK UI (WINDOW EXPORTS)
// ==========================================

// Fonksyon Pivot ant Connexion ak Inscription
window.switchToAuthTab = function(type) {
  const loginSection = document.getElementById('login-section');
  const signupSection = document.getElementById('signup-section');
  const alertBox = document.getElementById('alert-box');

  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'alert-msg';
  }

  if (type === 'signup') {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'block';
  } else {
    if (signupSection) signupSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
  }
};

window.toggleVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.className = 'fa-solid fa-eye';
    } else {
      btn.textContent = '👁️';
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      btn.textContent = '🙈';
    }
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
    balanceEl.textContent = balanceHidden ? '•••••• HTG' : rawUserBalance;
  }
  if (eyeIcon) {
    eyeIcon.className = balanceHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
}

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
