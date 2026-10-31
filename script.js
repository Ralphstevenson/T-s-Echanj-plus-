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

// Variables Globales pou UI
let isBalanceHidden = false;
let currentBalanceValue = "0.00 HTG";
let currentSlide = 0;
let selectedNetwork = '';

// Tout komin yo pa depatman an Ayiti
const komins = {
  "Lwès": ["Pòtoprens", "Delmas", "Petyonvil", "Kafou", "Kwadèboukè", "Gressier", "Kenscoff", "Cité Soleil", "Tabarre", "Grand-Goâve", "Petit-Goâve"],
  "Nò": ["Kap Ayisyen", "Akil Nò", "Bansè", "Bò Mòn", "Lenbe", "Lison", "Plèn Nò", "Pò Mago", "Sen Rasyon", "Sen Rapèl", "Don Datos"],
  "Nòdès": ["Fò Libète", "Baramòt", "Caracol", "Fò Dòf", "Grangou", "Matèn", "Terrier-Rouge", "Trou du Nord", "Vallières"],
  "Nòdwès": ["Pòdepè", "Ans a Fè", "Bassin-Bleu", "Chansolme", "Mòtpli", "Ba-de-Soleil", "Tòti"],
  "Latibonit": ["Gonayiv", "Sen Mak", "Desalin", "Ans Wouj", "Basen", "Marmelade", "Lestère", "Pò Mago", "Vèr", "Grande Saline"],
  "Sant": ["Hinche", "Cerca La Source", "Maïssade", "Savanèt", "Sen Mikal", "Mache Panyòl"],
  "Grand'Anse": ["Jérémie", "Anse d'Hainault", "Abricots", "Chambellan", "Corail", "Dame-Marie", "Moron", "Pestel", "Les Irois"],
  "Nip": ["Miragwàn", "Ans Vavo", "Baradè", "Fò Liberasyon", "Pètit Rivyè de Nip", "L'Asile", "Plaisance du Sud"],
  "Sid": ["Les Cayes", "Aquin", "Chantal", "Maniche", "Port-Salut", "Torbeck", "Camp-Perrin", "Cavaillon", "Arniquet"],
  "Sidès": ["Jakmèl", "Bèl Anse", "Marigot", "Mayò", "Grand-Gosier", "Thai-Thail"]
};

// ==========================================
// 3. FONKSYON GLOBAL POU UI (Attaché sou window)
// ==========================================

window.showSection = function (sectionId, navElement = null) {
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(sec => sec.style.display = 'none');

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  if (navElement) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    navElement.classList.add('active');
  }
};

window.showAlert = function (message, type = 'danger') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;
  alertBox.className = `alert-msg alert-${type}`;
  alertBox.innerText = message;
  alertBox.style.display = 'block';
  setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
};

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

window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

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

window.toggleFaq = function (element) {
  element.classList.toggle('active');
};

// ==========================================
// 4. JESTYON MODAL AK SÈVIS ECHANJ
// ==========================================

window.openFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
};

window.closeFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
};

window.closeFeatureModalOnOverlay = function (event, modalId) {
  if (event.target.id === modalId) {
    window.closeFeatureModal(modalId);
  }
};

window.femenModalEchanj = function () {
  window.closeFeatureModal('modal-confirm-echanj');
};

window.openDialer = function (rezo) {
  selectedNetwork = rezo;
  const modal = document.getElementById('modal-confirm-echanj');
  if (modal) {
    modal.classList.remove('hidden');
  }
};

// ==========================================
// 5. VALIDATION RÈG SEKIRITE MODPAS
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

// Fonksyon pou tcheke si itilizatè a gen profil ranpli nan Firestore
async function checkUserProfileFirst(user) {
  const modalProfil = document.getElementById('modal-profil');
  if (!modalProfil) return;

  if (!user) {
    modalProfil.style.setProperty('display', 'none', 'important');
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists() || !userSnap.data().fullName || !userSnap.data().departman) {
      modalProfil.style.setProperty('display', 'flex', 'important');
    } else {
      modalProfil.style.setProperty('display', 'none', 'important');
    }
  } catch (error) {
    console.error("Erè nan tcheke profil la:", error);
  }
}

// ==========================================
// 6. EVENT LISTENERS & FORM SUBMISSIONS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const signupPwd = document.getElementById('signup-password');
  const signupConfirmPwd = document.getElementById('signup-confirm-password');
  const signupPhone = document.getElementById('signup-phone');

  if (signupPwd) signupPwd.addEventListener('input', validatePasswordRules);
  if (signupConfirmPwd) signupConfirmPwd.addEventListener('input', validatePasswordRules);
  if (signupPhone) signupPhone.addEventListener('input', validatePasswordRules);

  const selectDepatman = document.getElementById('select-depatman');
  const selectKomin = document.getElementById('select-komin');
  const btnSaveProfil = document.getElementById('btn-save-profil');

  // Jere komin yo otomatikman
  if (selectDepatman) {
    selectDepatman.addEventListener('change', (e) => {
      const dep = e.target.value;
      if (selectKomin) {
        selectKomin.innerHTML = '<option value="">Chwazi yon komin</option>';
        if (komins[dep]) {
          komins[dep].forEach(komin => {
            const opt = document.createElement('option');
            opt.value = komin;
            opt.textContent = komin;
            selectKomin.appendChild(opt);
          });
        }
      }
    });
  }

  // Anrejistre profil nan Firestore
  if (btnSaveProfil) {
    btnSaveProfil.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Tanpri konekte anvan.");
        return;
      }

      const fullName = document.getElementById('input-profil-non')?.value.trim() || '';
      const phone = document.getElementById('input-profil-tel')?.value.trim() || '';
      const sex = document.getElementById('input-profil-seks')?.value || '';
      const departman = document.getElementById('select-depatman')?.value || '';
      const komin = document.getElementById('select-komin')?.value || '';
      const zon = document.getElementById('input-profil-zon')?.value.trim() || '';

      if (!fullName || !phone || !sex || !departman || !komin || !zon) {
        alert("Tanpri ranpli tout chan yo.");
        return;
      }

      btnSaveProfil.innerText = "N ap anrejistre...";
      btnSaveProfil.disabled = true;

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, {
          fullName,
          phone,
          sex,
          departman,
          komin,
          zon,
          updatedAt: serverTimestamp()
        }, { merge: true });

        alert("Profil ou an anrejistre avèk siksè!");
        checkUserProfileFirst(currentUser);
      } catch (error) {
        console.error("Erè anrejistreman profil:", error);
        alert("Gen yon erè ki rive: " + error.message);
      } finally {
        btnSaveProfil.innerText = "Anrejistre Profil";
        btnSaveProfil.disabled = false;
      }
    });
  }

  // Sidebar link pou gade profil
  const btnOpenProfileView = document.getElementById('open-profile-modal');
  const modalGadeProfil = document.getElementById('modal-gade-profil');
  const closeGadeProfil = document.getElementById('close-gade-profil');
  const btnLouvriModifye = document.getElementById('btn-louvri-modifye');
  const modalProfil = document.getElementById('modal-profil');

  if (btnOpenProfileView && modalGadeProfil) {
    btnOpenProfileView.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Tanpri konekte anvan.");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '--';
          };

          setTxt('lbl-profil-non', data.fullName);
          setTxt('lbl-profil-tel', data.phone);
          setTxt('lbl-profil-seks', data.sex);
          setTxt('lbl-profil-depatman', data.departman);
          setTxt('lbl-profil-komin', data.komin);
          setTxt('lbl-profil-zon', data.zon);

          modalGadeProfil.style.setProperty('display', 'flex', 'important');
        } else {
          alert("Poko gen done profil anrejistre pou ou.");
        }
      } catch (error) {
        console.error("Erè nan chaje profil la:", error);
      }

      if (typeof window.toggleSidebar === 'function') {
        window.toggleSidebar();
      }
    });
  }

  if (closeGadeProfil && modalGadeProfil) {
    closeGadeProfil.addEventListener('click', () => {
      modalGadeProfil.style.setProperty('display', 'none', 'important');
    });
  }

  if (btnLouvriModifye && modalProfil && modalGadeProfil) {
    btnLouvriModifye.addEventListener('click', async () => {
      modalGadeProfil.style.setProperty('display', 'none', 'important');
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
          };

          setVal('input-profil-non', data.fullName);
          setVal('input-profil-tel', data.phone);
          setVal('input-profil-seks', data.sex);
          setVal('input-profil-zon', data.zon);
          
          const depSelect = document.getElementById('select-depatman');
          if (depSelect) {
            depSelect.value = data.departman || '';
            if (data.departman && komins[data.departman] && selectKomin) {
              selectKomin.innerHTML = '<option value="">Chwazi yon komin</option>';
              komins[data.departman].forEach(komin => {
                const opt = document.createElement('option');
                opt.value = komin;
                opt.textContent = komin;
                if (komin === data.komin) opt.selected = true;
                selectKomin.appendChild(opt);
              });
            }
          }
        }
      }

      modalProfil.style.setProperty('display', 'flex', 'important');
    });
  }

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

  // 3. BOUTON DEKONEKSYON
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

  // 4. BOUTON KONFIMASYON FINAL TRANZAKSYON ECHANJ
  const btnKonfimeFinal = document.getElementById('btn-konfime-final');
  if (btnKonfimeFinal) {
    btnKonfimeFinal.addEventListener('click', () => {
      const pinInput = document.getElementById('input-pin-echanj');
      if (!pinInput || pinInput.value.length !== 4) {
        alert("Tanpri antre yon PIN 4 chif ki valab.");
        return;
      }
      alert(`Tranzaksyon pou rezo ${selectedNetwork.toUpperCase()} anrejistre avèk siksè!`);
      window.femenModalEchanj();
      if (pinInput) pinInput.value = '';
    });
  }
});

// ==========================================
// 7. SUIVI ETAT DE KONEKSYON (STATE OBSERVER)
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const authContainer = document.getElementById('auth-container');
  const dashContainer = document.getElementById('dashboard-section');
  const loader = document.getElementById('loading-overlay');

  if (user) {
    if (authContainer) authContainer.style.display = 'none';
    if (dashContainer) dashContainer.style.display = 'block';

    // Tcheke estati profil la nan Firestore
    await checkUserProfileFirst(user);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const phoneFormatted = `+509 ${data.phone || ''}`;
        
        const sidebarPhone = document.getElementById('sidebar-user-phone');
        const displayPhone = document.getElementById('user-display-phone');
        
        if (sidebarPhone) sidebarPhone.innerText = phoneFormatted;
        if (displayPhone) displayPhone.innerText = phoneFormatted;
        
        currentBalanceValue = `${(data.balance || 0).toFixed(2)} HTG`;
        const userBalanceEl = document.getElementById('user-balance');
        if (userBalanceEl && !isBalanceHidden) {
          userBalanceEl.innerText = currentBalanceValue;
        }
      }
    } catch (e) {
      console.error("Erreur chargement profil:", e);
    }
  } else {
    const modalProfil = document.getElementById('modal-profil');
    if (modalProfil) modalProfil.style.setProperty('display', 'none', 'important');

    if (dashContainer) dashContainer.style.display = 'none';
    if (authContainer) authContainer.style.display = 'block';
  }

  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 300);
  }
});
