/* js/auth.js - Jere Validasyon ak Soumisyon Fòm Auth yo */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import sèvis ki soti nan fichye prensipal la (main.js)
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

  // Kalkile chak kondisyon nan lis HTML la an tan reyèl
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

    // Verifye si tout règ modpas yo respekte
    const allRulesPassed = isLower && isUpper && isNum && isSpec && isLen && 
                           isNoSeqNum && isNoSeqLet && isNoLogin && isNoRepeat;

    // Verifye si konfimasyon modpas la koresponn ak nimewo telefòn nan gen 8 chif
    const isConfirmMatch = (pwd === confirmPwd) && confirmPwd.length > 0;
    const isPhoneValid = phone.length === 8;

    // Debloke bouton "Suivant" an sèlman si tout kondisyon yo ranpli
    if (signupBtn) {
      signupBtn.disabled = !(allRulesPassed && isConfirmMatch && isPhoneValid);
    }
  }

  // Mettre à jour ikon ✓ ak ✕ yo ansanm ak klas CSS yo
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

  // Ekoute lè itilizatè a ap tape nan chak champ
  if (signupPassword) signupPassword.addEventListener('input', validateForm);
  if (signupConfirm) signupConfirm.addEventListener('input', validateForm);
  if (signupPhone) signupPhone.addEventListener('input', validateForm);

  // ==========================================
  // SOUMISYON FÒM KONEKSYON
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
      const formattedEmail = `${phone}@echanjplus.com`;

      showLoader();

      try {
        await signInWithEmailAndPassword(auth, formattedEmail, password);
        // Firebase onAuthStateChanged nan main.js ap kouvri switch UI la
      } catch (error) {
        hideLoader();
        console.error("Erè koneksyon:", error);
        showAuthAlert("Nimewo oswa modpas la pa kòrèk.", "error");
      }
    });
  }

  // ==========================================
  // SOUMISYON FÒM ENSKRIPSYON
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
      const email = `${phone}@echanjplus.com`;

      showLoader();

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase onAuthStateChanged nan main.js ap kouvri switch UI la
      } catch (error) {
        hideLoader();
        console.error("Erè inscription:", error);
        
        let message = "Erè nan kreyasyon kont lan.";
        if (error.code === 'auth/email-already-in-use') {
          message = "Nimewo sa a deja gen yon kont sou pwojè a.";
        }
        showAuthAlert(message, "error");
      }
    });
  }
}
