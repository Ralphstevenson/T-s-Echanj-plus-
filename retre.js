/* ============================================================
   JS RETRÈ V5.0 - ECHANJ PLUS
   ============================================================ */
import { auth, db } from './script.js';
import { ref, serverTimestamp, onValue, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Global Stores
window.userAppData = window.userAppData || {};
window.retreData = {
  methodKey: '',
  methodName: '',
  minLimit: 50,
  maxLimit: 5000,
  amount: 0,
  phone: '',
  holder: ''
};

// 1. ÉCOUTE DES DONNÉES FIREBASE
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        window.userAppData = {
          hasPin: !!data.pin,
          correctPin: data.pin || "",
          fullname: data.fullname || "Itilizatè",
          currentBalance: Number(data.balance || 0)
        };
      }
    });
  }
});

// 2. FONCTIONS DE NAVIGATION (Attachées à 'window')
window.goToStep = function(stepId) {
  const steps = ['step-select-method', 'step-enter-amount', 'step-enter-account'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stepId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
};

// 3. SÉLECTION DE LA MÉTHODE DE PAIEMENT
window.selectRetreMethod = function(key, name, min, max) {
  window.retreData.methodKey = key;
  window.retreData.methodName = name;
  window.retreData.minLimit = min;
  window.retreData.maxLimit = max;

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

// 4. VALIDATION DU MONTANT
window.validateAmountStep = function() {
  const amountInput = document.getElementById('retre-amount-input');
  const val = parseFloat(amountInput.value);

  if (isNaN(val)) {
    alert("🔴 Tanpri antre yon montan valid.");
    return;
  }

  if (val < window.retreData.minLimit) {
    alert(`🔴 Montan minimòm pou ${window.retreData.methodName} se ${window.retreData.minLimit} HTG.`);
    return;
  }

  if (val > window.retreData.maxLimit) {
    alert(`🔴 Montan maksimòm pou ${window.retreData.methodName} se ${window.retreData.maxLimit} HTG.`);
    return;
  }

  if (val > window.userAppData.currentBalance) {
    alert("🔴 Balans ou ensifizan pou fè retrè sa a.");
    return;
  }

  window.retreData.amount = val;
  window.goToStep('step-enter-account');
};

// 5. VALIDATION DU COMPTE ET DÉTAILS
window.validateAccountStep = function() {
  const phoneInput = document.getElementById('retre-phone-input');
  const holderInput = document.getElementById('retre-holder-input');

  if (!phoneInput || !holderInput || !phoneInput.value.trim() || !holderInput.value.trim()) {
    alert("🔴 Tanpri ranpli nimewo telefòn lan ak non titilè a.");
    return;
  }

  window.retreData.phone = phoneInput.value.trim();
  window.retreData.holder = holderInput.value.trim();

  document.getElementById('dt-method').innerText = window.retreData.methodName;
  document.getElementById('dt-amount').innerText = window.retreData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) + " HTG";
  document.getElementById('dt-phone').innerText = window.retreData.phone;
  document.getElementById('dt-holder').innerText = window.retreData.holder;
  
  const now = new Date();
  document.getElementById('dt-date').innerText = now.toLocaleDateString('fr-FR') + " à " + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('modal-retre-details')?.classList.remove('hidden');
};

// 6. VÉRIFICATION DU CODE PIN
window.proceedToPinStep = function() {
  window.closeModal('modal-retre-details');

  if (!window.userAppData.hasPin) {
    alert("⚠️ Ou dwe kreye yon kòd PIN anvan pou ou ka fè retrè! N ap dirije w nan Paramètres.");
    if (typeof window.showPage === 'function') {
      window.showPage('paj-paramet');
    }
    return;
  }

  const pinInput = document.getElementById('retre-pin-input');
  if (pinInput) pinInput.value = '';
  document.getElementById('modal-retre-pin')?.classList.remove('hidden');
};

// 7. CONFIRMATION FINALE ET FIREBASE
window.confirmFinalRetre = async function() {
  const pinInput = document.getElementById('retre-pin-input');
  
  if (!pinInput || pinInput.value !== String(window.userAppData.correctPin)) {
    alert("❌ PIN enkòrèk! Tanpri reyeseye.");
    if (pinInput) pinInput.value = '';
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  window.closeModal('modal-retre-pin');

  try {
    const transID = "RET-" + Math.floor(Math.random() * 1000000);
    const updates = {};
    
    updates[`/withdrawals/${transID}`] = {
      id: transID,
      uid: user.uid,
      type: "Retrè",
      method: window.retreData.methodName,
      amount: window.retreData.amount,
      phone: window.retreData.phone,
      receiver: window.retreData.holder,
      status: "En attente",
      timestamp: serverTimestamp()
    };

    updates[`/users/${user.uid}/balance`] = increment(-window.retreData.amount);

    await update(ref(db), updates);

    if (typeof window.voyeGmail === 'function') {
      window.voyeGmail('retre', { 
        amount: window.retreData.amount, 
        method: window.retreData.methodName, 
        phone: window.retreData.phone, 
        name: window.retreData.holder 
      });
    }

    alert("✅ Demann retrè ou an voye ak siksè! Kòb la retire sou kont ou an atandan validasyon admin.");

    document.getElementById('retre-amount-input').value = '';
    document.getElementById('retre-phone-input').value = '';
    document.getElementById('retre-holder-input').value = '';
    window.goToStep('step-select-method');

  } catch (e) {
    alert("Erè nan tranzaksyon an: " + e.message);
  }
};
