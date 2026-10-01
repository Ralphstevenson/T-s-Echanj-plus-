/* js/auth.js - Jere Validasyon, Inscription ak Connexion Firebase Auth */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import sèvis Firebase ak UI ki soti nan main.js
import { auth, showLoader, hideLoader, showAuthAlert } from "./main.js";

document.addEventListener('DOMContentLoaded', () => {
  initAuthValidation();
});

function initAuthValidation() {
  const signupPassword = document.getElementById('signup-password');
  const signupConfirm = document.getElementById('signup-confirm-password');
  const signupPhone = document.getElementById('signup-phone');
  const signupBtn = document.getElementById('signup-btn');

  // Règleman pou kalkile fòs modpas la
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

  // Validasyon règ modpas yo an tan reyèl
  function validateForm() {
    if (!signupPassword) return;

    const pwd = signupPassword.value;
    const phone = signupPhone ? signupPhone.value.trim() : '';
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

    // Verifye si tout 9 kondisyon yo bon
    const allRulesPassed = isLower && isUpper && isNum && isSpec && isLen && 
                           isNoSeqNum && isNoSeqLet && isNoLogin && isNoRepeat;

    // Verifye konfimasyon modpas ak gwosè telefòn (8 chif)
    const isConfirmMatch = (pwd === confirmPwd) && confirmPwd.length > 0;
    const isPhoneValid = phone.length === 8;

    // Debloke bouton "Suivant" an sèlman si tout bagay konfòm
    if (signupBtn) {
      signupBtn.disabled = !(allRulesPassed && isConfirmMatch && isPhoneValid);
    }
  }

  // Mete ajou ikòn ✓ ak ✕ yo
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

  // Koute antre nan champa yo pou validasyon an tan reyèl
  if (signupPassword) signupPassword.addEventListener('input', validateForm);
  if (signupConfirm) signupConfirm.addEventListener('input', validateForm);
  if (signupPhone) signupPhone.addEventListener('input', validateForm);

  // Kache tout bwat alèt chak fwa itilizatè a ap re-tape
  const inputs = document.querySelectorAll('#login-form input, #signup-form input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      const alertBox = document.getElementById('alert-box');
      if (alertBox) alertBox.style.display = 'none';
    });
  });

  // ==========================================
  // 1. SOUMISYON FÒM KONEKSYON (CONNEXION)
  // ==========================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phoneInput = document.getElementById('login-phone');
      const passwordInput = document.getElementById('login-password');
      
      if (!phoneInput || !passwordInput) return;

      const phone = phoneInput.value.trim();
      const password = passwordInput.value;

      if (phone.length !== 8) {
        showAuthAlert("Tanpri antre yon nimewo telefòn ki gen 8 chif.", "error");
        return;
      }

      // Format Email pou Firebase Auth (eg: 37000000@echanjplus.com)
      const formattedEmail = `${phone}@echanjplus.com`;

      showLoader();

      try {
        // Otantifikasyon ak Firebase
        await signInWithEmailAndPassword(auth, formattedEmail, password);
        // Si sa reyisi, `onAuthStateChanged` ki nan `main.js` ap afiche akèy/dashboard la otomatikman!
      } catch (error) {
        hideLoader();
        console.error("Erè koneksyon:", error);

        let errorMessage = "Nimewo telefòn oswa modpas la pa kòrèk.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = "Identifiant oswa modpas sa a pa kòrèk.";
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = "Twòp tantativ ki echwe. Tanpri tann yon ti moman anvan ou reyele.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Pwoblèm rezo entènèt. Tanpri verifye konneksyon w.";
        }

        showAuthAlert(errorMessage, "error");
      }
    });
  }

  // ==========================================
  // 2. SOUMISYON FÒM ENSKRIPSYON (INSCRIPTION)
  // ==========================================
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('signup-phone');
      const passwordInput = document.getElementById('signup-password');

      if (!phoneInput || !passwordInput) return;

      const phone = phoneInput.value.trim();
      const password = passwordInput.value;
      const formattedEmail = `${phone}@echanjplus.com`;

      showLoader();

      try {
        // Kreyasyon kont sou Firebase Auth
        await createUserWithEmailAndPassword(auth, formattedEmail, password);
        // Si sa reyisi, `onAuthStateChanged` ki nan `main.js` ap ire dirèkteman sou paj Akèy la!
      } catch (error) {
        hideLoader();
        console.error("Erè enskripsyon:", error);
        
        let message = "Gen yon erè nan kreyasyon kont lan.";
        if (error.code === 'auth/email-already-in-use') {
          message = "Nimewo telefòn sa a deja gen yon kont kreye.";
        } else if (error.code === 'auth/weak-password') {
          message = "Modpas la twò feblès.";
        } else if (error.code === 'auth/network-request-failed') {
          message = "Pwoblèm rezo entènèt. Tanpri verifye konneksyon w.";
        }

        showAuthAlert(message, "error");
      }
    });
  }
}
