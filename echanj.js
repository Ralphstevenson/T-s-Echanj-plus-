// ==========================================
// 1. ENPÒTASYON SDK FIREBASE (v10+ ES Modules)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  collection,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 2. KONFIGIRASYON FIREBASE
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
const auth = getAuth(app);
const db = getFirestore(app);

// Variables Globales pou UI ak Tranzaksyon
let isBalanceHidden = false;
let currentBalanceValue = "0.00 HTG";
let currentSlide = 0;
let currentUserData = null;
let currentPendingExchange = null;

const SYSTEM_FEE_PERCENT = 16.5; // Frè sistèm nan %

// ==========================================
// 3. FONKSYON GLOBAL POU UI AK ECHANJ
// ==========================================

// Affichage messages d'alerte
window.showAlert = function (message, type = 'danger') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) {
    alert(message);
    return;
  }
  alertBox.className = `alert-msg alert-${type}`;
  alertBox.innerText = message;
  alertBox.style.display = 'block';
  setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
};

// Afiche / Kache modpas
window.toggleVisibility = function (fieldId, btnEl) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const icon = btnEl.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  }
};

// Basculer ant Connexion ak Inscription
window.switchToAuthTab = function (tab) {
  const loginSec = document.getElementById('login-section');
  const signupSec = document.getElementById('signup-section');
  if (!loginSec || !signupSec) return;

  if (tab === 'signup') {
    loginSec.style.display = 'none';
    signupSec.style.display = 'block';
  } else {
    signupSec.style.display = 'none';
    loginSec.style.display = 'block';
  }
};

// Louvri / Fèmen Meni SideBar
window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

// Afiche / Maske Solde Itilizatè a
window.toggleBalanceVisibility = function () {
  const balanceText = document.getElementById('user-balance');
  const eyeIcon = document.getElementById('eye-icon');
  if (!balanceText || !eyeIcon) return;

  if (isBalanceHidden) {
    balanceText.innerText = currentBalanceValue;
    eyeIcon.className = 'fa-solid fa-eye';
    isBalanceHidden = false;
  } else {
    balanceText.innerText = '•••••• HTG';
    eyeIcon.className = 'fa-solid fa-eye-slash';
    isBalanceHidden = true;
  }
};

// Controle Carousel Banner
window.goToSlide = function (index) {
  const wrapper = document.getElementById('carousel-wrapper');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  if (!wrapper) return;

  currentSlide = index;
  wrapper.style.transform = `translateX(-${index * 100}%)`;

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === index);
  });
};

// Accordion pou FAQ
window.toggleFaq = function (element) {
  element.classList.toggle('active');
};

// ------------------------------------------
// FONKSYON SEKSYON ECHANJ MINIT
// ------------------------------------------

// Louvri Modale Entèfaz Vizyèl (Kalkilatris, Parennaj, Resi)
window.openFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

// Fèmen Modale
window.closeFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// Fèmen Modale Lè w Klike Deyò Card la
window.closeFeatureModalOnOverlay = function (event, modalId) {
  if (event.target.id === modalId) {
    window.closeFeatureModal(modalId);
  }
};

// Fèmen Modale Echanj la
window.femenModalEchanj = function () {
  window.closeFeatureModal('modal-confirm-echanj');
  const pinInput = document.getElementById('input-pin-echanj');
  if (pinInput) pinInput.value = '';
};

// Lancer Dial rezo (Digicel / Natcom)
window.openDialer = function (rezo) {
  const amountStr = prompt(`Antre kantite minit ${rezo.toUpperCase()} ou vle vann an HTG:`);
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    window.showAlert("Tanpri antre yon montan ki valab.");
    return;
  }

  // Kalkil Frè ak Net
  const fee = (amount * SYSTEM_FEE_PERCENT) / 100;
  const netAmount = amount - fee;

  currentPendingExchange = {
    rezo: rezo,
    amount: amount,
    fee: fee,
    netAmount: netAmount
  };

  // Mete ajou vizyèl Modale Konfimasyon an
  document.getElementById('sum-minit').innerText = `${amount.toFixed(2)} HTG`;
  document.getElementById('sum-fee-percent').innerText = SYSTEM_FEE_PERCENT;
  document.getElementById('sum-fre').innerText = `-${fee.toFixed(2)} HTG`;
  document.getElementById('sum-total').innerText = `${netAmount.toFixed(2)} HTG`;

  // Ouvri Modale Konfimasyon PIN
  window.openFeatureModal('modal-confirm-echanj');
};

// ==========================================
// 4. VALIDATION RÈG SEKIRITE MODPAS
// ==========================================
function validatePasswordRules() {
  const phoneVal = document.getElementById('signup-phone')?.value.trim() || '';
  const pwdVal = document.getElementById('signup-password')?.value || '';
  const confirmPwdVal = document.getElementById('signup-confirm-password')?.value || '';
  const signupBtn = document.getElementById('signup-btn');

  const rules = {
    lowercase: /[a-z]/.test(pwdVal),
    uppercase: /[A-Z]/.test(pwdVal),
    number: /[0-9]/.test(pwdVal),
    special: /[^a-zA-Z0-9]/.test(pwdVal),
    length: pwdVal.length >= 8,
    noSeqNum: !/(012|123|234|345|456|567|678|789|890)/.test(pwdVal),
    noSeqLet: !/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(pwdVal),
    noLogin: phoneVal ? !pwdVal.includes(phoneVal) : true,
    noRepeat: !/(.)\1\1/.test(pwdVal)
  };

  const setRuleUI = (ruleId, isValid) => {
    const el = document.getElementById(ruleId);
    if (!el) return;
    const icon = el.querySelector('.status-icon');
    if (isValid) {
      el.classList.add('valid');
      el.classList.remove('invalid');
      if (icon) icon.innerText = '✓';
    } else {
      el.classList.add('invalid');
      el.classList.remove('valid');
      if (icon) icon.innerText = '✕';
    }
  };

  setRuleUI('rule-lowercase', rules.lowercase);
  setRuleUI('rule-uppercase', rules.uppercase);
  setRuleUI('rule-number', rules.number);
  setRuleUI('rule-special', rules.special);
  setRuleUI('rule-length', rules.length);
  setRuleUI('rule-no-seq-num', rules.noSeqNum);
  setRuleUI('rule-no-seq-let', rules.noSeqLet);
  setRuleUI('rule-no-login', rules.noLogin);
  setRuleUI('rule-no-repeat', rules.noRepeat);

  const allValid = Object.values(rules).every(Boolean) && (pwdVal === confirmPwdVal) && (pwdVal.length > 0);
  if (signupBtn) signupBtn.disabled = !allValid;
}

// ==========================================
// 5. EVENT LISTENERS & FORM SUBMISSIONS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Listeners pou fòm modpas
  const signupPwd = document.getElementById('signup-password');
  const signupConfirmPwd = document.getElementById('signup-confirm-password');
  const signupPhone = document.getElementById('signup-phone');

  if (signupPwd) signupPwd.addEventListener('input', validatePasswordRules);
  if (signupConfirmPwd) signupConfirmPwd.addEventListener('input', validatePasswordRules);
  if (signupPhone) signupPhone.addEventListener('input', validatePasswordRules);

  // Auto-play Carousel chak 4 segonn
  setInterval(() => {
    const wrapper = document.getElementById('carousel-wrapper');
    if (wrapper) {
      currentSlide = (currentSlide + 1) % 3;
      window.goToSlide(currentSlide);
    }
  }, 4000);

  // 1. FORM KONEKSYON (LOGIN)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('login-phone').value.trim();
      const passwordInput = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-btn');

      if (phoneInput.length !== 8) {
        window.showAlert("Tanpri antre yon nimewo telefòn 8 chif ki valab.");
        return;
      }

      const formattedEmail = `509${phoneInput}@echanjplus.com`;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Connexion en cours...</span>';

        await signInWithEmailAndPassword(auth, formattedEmail, passwordInput);

      } catch (error) {
        console.error("Login error:", error);
        let msg = "Erè: " + error.code;
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          msg = "Nimewo telefòn oswa modpas la pa korèk.";
        } else if (error.code === 'auth/invalid-email') {
          msg = "Fòma nimewo a pa valab pou sistèm nan.";
        }
        window.showAlert(msg);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Se connecter</span>';
      }
    });
  }

  // 2. FORM ENSKRIPSYON (SIGNUP)
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const email = document.getElementById('signup-email').value.trim();
      const referral = document.getElementById('signup-referral').value.trim();
      const submitBtn = document.getElementById('signup-btn');

      if (phone.length !== 8) {
        window.showAlert("Nimewo telefòn lan dwe gen 8 chif.");
        return;
      }

      if (password !== confirmPassword) {
        window.showAlert("Modpas yo pa sanble.");
        return;
      }

      const formattedAuthEmail = `509${phone}@echanjplus.com`;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Création du compte...</span>';

        const userCredential = await createUserWithEmailAndPassword(auth, formattedAuthEmail, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          phone: phone,
          email: email || null,
          referralCode: referral || null,
          pin: "1234", // PIN pa defo
          balance: 0.00,
          createdAt: serverTimestamp(),
          role: "user"
        });

        window.showAlert("Kont ou kreye ak siksè!", "success");

      } catch (error) {
        console.error("Signup error:", error);
        let msg = "Erè: " + error.code;
        if (error.code === 'auth/email-already-in-use') {
          msg = "Nimewo telefòn sa a gen yon kont ki egziste deja.";
        } else if (error.code === 'auth/weak-password') {
          msg = "Modpas la tro fèb.";
        }
        window.showAlert(msg);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Suivant</span>';
      }
    });
  }

  // 3. KONFIMASYON TRANZAKSYON ECHANJ AK PIN
  const btnKonfimeFinal = document.getElementById('btn-konfime-final');
  if (btnKonfimeFinal) {
    btnKonfimeFinal.addEventListener('click', async () => {
      const pinInput = document.getElementById('input-pin-echanj').value.trim();

      if (!pinInput || pinInput.length !== 4) {
        window.showAlert("Tanpri antre yon PIN 4 chif.");
        return;
      }

      const userPin = currentUserData?.pin || "1234";
      if (pinInput !== userPin) {
        window.showAlert("PIN enkasi pa korèk!");
        return;
      }

      if (!currentPendingExchange) {
        window.showAlert("Pa gen okenn tranzaksyon an kour.");
        return;
      }

      try {
        btnKonfimeFinal.disabled = true;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

        const user = auth.currentUser;

        // Enregistre tranzaksyon an nan Firestore
        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          userPhone: currentUserData.phone,
          type: "echanj_minit",
          rezo: currentPendingExchange.rezo,
          amount: currentPendingExchange.amount,
          fee: currentPendingExchange.fee,
          netAmount: currentPendingExchange.netAmount,
          status: "pending",
          createdAt: serverTimestamp()
        });

        window.femenModalEchanj();
        window.showAlert("Tranzaksyon soumèt ak siksè! N ap trete l nan kèk enstant.", "success");

      } catch (err) {
        console.error("Erreur transaction:", err);
        window.showAlert("Erè nan soumisyon tranzaksyon an.");
      } finally {
        btnKonfimeFinal.disabled = false;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-check-circle"></i> KONFIME AK PIN';
      }
    });
  }

  // 4. BOUTON DEKONEKSYON
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.reload();
      } catch (err) {
        console.error("Logout Error:", err);
      }
    });
  }
});

// ==========================================
// 6. SUIVI ETAT DE KONEKSYON (STATE OBSERVER)
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const authContainer = document.getElementById('auth-container');
  const dashContainer = document.getElementById('dashboard-section');
  const loader = document.getElementById('loading-overlay');

  if (user) {
    if (authContainer) authContainer.style.display = 'none';
    if (dashContainer) dashContainer.style.display = 'block';

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUserData = userDoc.data();
        const phoneFormatted = `+509 ${currentUserData.phone || ''}`;
        
        const sidebarPhone = document.getElementById('sidebar-user-phone');
        const displayPhone = document.getElementById('user-display-phone');
        
        if (sidebarPhone) sidebarPhone.innerText = phoneFormatted;
        if (displayPhone) displayPhone.innerText = phoneFormatted;
        
        currentBalanceValue = `${(currentUserData.balance || 0).toFixed(2)} HTG`;
        const userBalanceEl = document.getElementById('user-balance');
        if (userBalanceEl && !isBalanceHidden) {
          userBalanceEl.innerText = currentBalanceValue;
        }
      }
    } catch (e) {
      console.error("Erreur chargement profil:", e);
    }
  } else {
    currentUserData = null;
    if (dashContainer) dashContainer.style.display = 'none';
    if (authContainer) authContainer.style.display = 'block';
  }

  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 300);
  }
});
