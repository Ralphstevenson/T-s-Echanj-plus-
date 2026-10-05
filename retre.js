/* ============================================================
   JS RETRÈ V6.0 - INTEGRATED WITH SCRIPT.JS (FIRESTORE EDITION)
   ============================================================ */
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialisation / Références Firebase
const auth = getAuth();
const db = getFirestore();

// Données globales utilisateur et transaction
window.userAppData = window.userAppData || {
  hasPin: false,
  correctPin: "",
  fullname: "",
  currentBalance: 0
};

window.retreData = {
  methodKey: '',
  methodName: '',
  minLimit: 50,
  maxLimit: 5000,
  amount: 0,
  phone: '',
  holder: ''
};

// 1. RECUPERATION DES DONNEES UTILISATEUR DEPUIS FIRESTORE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        window.userAppData = {
          hasPin: !!data.pin,
          correctPin: data.pin || "",
          fullname: data.fullname || data.phone || "Itilizatè",
          currentBalance: Number(data.balance || 0)
        };
      }
    } catch (e) {
      console.error("Erreur de chargement des données utilisateur:", e);
    }
  }
});

// 2. NAVIGATION ENTRE LES ETAPES
window.goToStep = function(stepId) {
  const steps = ['step-select-method', 'step-enter-amount', 'step-enter-account'];
  
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stepId) {
        el.classList.remove('hidden');
        el.style.display = 'block';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    }
  });
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// 3. SELECTION DU MOYEN DE PAIEMENT (NatCash / MonCash)
window.selectRetreMethod = function(key, name, min, max) {
  window.retreData.methodKey = key;
  window.retreData.methodName = name;
  window.retreData.minLimit = Number(min);
  window.retreData.maxLimit = Number(max);

  const nameEl = document.getElementById('selected-method-name');
  const minEl = document.getElementById('display-min-limit');
  const maxEl = document.getElementById('display-max-limit');
  const amountInput = document.getElementById('retre-amount-input');

  if (nameEl) nameEl.innerText = name;
  if (minEl) minEl.innerText = min.toLocaleString('fr-FR');
  if (maxEl) maxEl.innerText = max.toLocaleString('fr-FR');
  if (amountInput) {
    amountInput.min = min;
    amountInput.max = max;
    amountInput.value = '';
  }

  window.goToStep('step-enter-amount');
};

// 4. VALIDATION DU MONTANT (BOUTON VALIDER)
window.validateAmountStep = function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault(); // Empêche le rechargement de page si inclus dans un formulaire
  }

  const amountInput = document.getElementById('retre-amount-input');
  if (!amountInput) return;

  const val = parseFloat(amountInput.value);

  if (isNaN(val) || val <= 0) {
    alert("🔴 Tanpri antre yon montan ki valab.");
    return;
  }

  if (val < window.retreData.minLimit) {
    alert(`🔴 Montan minimòm pou ${window.retreData.methodName || 'sèvis sa a'} se ${window.retreData.minLimit} HTG.`);
    return;
  }

  if (val > window.retreData.maxLimit) {
    alert(`🔴 Montan maksimòm pou ${window.retreData.methodName || 'sèvis sa a'} se ${window.retreData.maxLimit} HTG.`);
    return;
  }

  if (val > window.userAppData.currentBalance) {
    alert(`🔴 Balans ou ensifizan pou fè retrè sa a. Balans ou se ${window.userAppData.currentBalance} HTG.`);
    return;
  }

  window.retreData.amount = val;
  window.goToStep('step-enter-account');
};

// 5. VALIDATION DU COMPTE DESTINATAIRE
window.validateAccountStep = function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const phoneInput = document.getElementById('retre-phone-input');
  const holderInput = document.getElementById('retre-holder-input');

  if (!phoneInput || !holderInput || !phoneInput.value.trim() || !holderInput.value.trim()) {
    alert("🔴 Tanpri ranpli nimewo telefòn lan ak non titilè a.");
    return;
  }

  window.retreData.phone = phoneInput.value.trim();
  window.retreData.holder = holderInput.value.trim();

  const dtMethod = document.getElementById('dt-method');
  const dtAmount = document.getElementById('dt-amount');
  const dtPhone = document.getElementById('dt-phone');
  const dtHolder = document.getElementById('dt-holder');
  const dtDate = document.getElementById('dt-date');

  if (dtMethod) dtMethod.innerText = window.retreData.methodName;
  if (dtAmount) dtAmount.innerText = window.retreData.amount.toFixed(2) + " HTG";
  if (dtPhone) dtPhone.innerText = window.retreData.phone;
  if (dtHolder) dtHolder.innerText = window.retreData.holder;
  
  if (dtDate) {
    const now = new Date();
    dtDate.innerText = now.toLocaleDateString('fr-FR') + " " + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const modalDetails = document.getElementById('modal-retre-details');
  if (modalDetails) {
    modalDetails.classList.remove('hidden');
    modalDetails.style.display = 'flex';
  }
};

// 6. PASSAGE A L'ETAPE PIN
window.proceedToPinStep = function() {
  window.closeModal('modal-retre-details');

  if (!window.userAppData.hasPin) {
    alert("⚠️ Ou dwe kreye yon kòd PIN anvan nan atelye Paramètres pou konfime tranzaksyon yo.");
    if (typeof window.showSection === 'function') {
      window.showSection('paj-setting');
    }
    return;
  }

  const pinInput = document.getElementById('retre-pin-input');
  if (pinInput) pinInput.value = '';
  
  const modalPin = document.getElementById('modal-retre-pin');
  if (modalPin) {
    modalPin.classList.remove('hidden');
    modalPin.style.display = 'flex';
  }
};

// 7. CONFIRMATION FINALE TRANSACTION FIRESTORE
window.confirmFinalRetre = async function() {
  const pinInput = document.getElementById('retre-pin-input');
  
  if (!pinInput || pinInput.value !== String(window.userAppData.correctPin)) {
    alert("❌ Kòd PIN sa a pa korèk! Tanpri re-eseye.");
    if (pinInput) pinInput.value = '';
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  window.closeModal('modal-retre-pin');

  try {
    const transID = "RET-" + Date.now().toString().slice(-6);
    
    await setDoc(doc(db, "withdrawals", transID), {
      id: transID,
      uid: user.uid,
      type: "Retrè",
      method: window.retreData.methodName,
      amount: window.retreData.amount,
      phone: window.retreData.phone,
      receiver: window.retreData.holder,
      status: "En attente",
      createdAt: serverTimestamp()
    });

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      balance: increment(-window.retreData.amount)
    });

    window.userAppData.currentBalance -= window.retreData.amount;
    const balanceText = document.getElementById('user-balance');
    if (balanceText) {
      balanceText.innerText = `${window.userAppData.currentBalance.toFixed(2)} HTG`;
    }

    alert("✅ Demann retrè ou an voye avèk siksè! Kòb la dedwi sou balans ou anatandan validasyon admin.");

    const amountIn = document.getElementById('retre-amount-input');
    const phoneIn = document.getElementById('retre-phone-input');
    const holderIn = document.getElementById('retre-holder-input');
    
    if (amountIn) amountIn.value = '';
    if (phoneIn) phoneIn.value = '';
    if (holderIn) holderIn.value = '';
    
    window.goToStep('step-select-method');

  } catch (e) {
    console.error("Erreur lors de la confirmation du retrait:", e);
    alert("Erè pandan tranzaksyon an: " + e.message);
  }
};

// 8. CORRECTION DU DELEGATEUR D'EVENEMENT CLIC
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[onclick]');
  if (!btn) return;

  const onclickAttr = btn.getAttribute('onclick');
  if (!onclickAttr) return;

  // Empeche la soumission du formulaire HTML par défaut si le bouton est dans un <form>
  if (btn.tagName === 'BUTTON' || btn.getAttribute('type') === 'submit') {
    e.preventDefault();
  }
});
