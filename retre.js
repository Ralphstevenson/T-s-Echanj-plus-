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

// Re-itilize entansiyasyon Firebase ki nan script.js oswa kree referans
const auth = getAuth();
const db = getFirestore();

// Etazini/Done Lokal pou Retrè
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

// 1. REKIPERE DONE ITILIZATÈ A NAN FIRESTORE
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
      console.error("Erè nan chajman done retre:", e);
    }
  }
});

// 2. NAVIGASYON ANT ETAP YO (Sipòte kijan script.js afiche seksyon yo)
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

// 3. CHWA METÒD RETRÈ (NatCash / MonCash)
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

// 4. VALIDASYON MONTAN AN
window.validateAmountStep = function() {
  const amountInput = document.getElementById('retre-amount-input');
  const val = parseFloat(amountInput.value);

  if (isNaN(val) || val <= 0) {
    if (typeof window.showAlert === 'function') {
      window.showAlert("Tanpri antre yon montan ki valab.");
    } else {
      alert("🔴 Tanpri antre yon montan ki valab.");
    }
    return;
  }

  if (val < window.retreData.minLimit) {
    const msg = `Montan minimòm pou ${window.retreData.methodName} se ${window.retreData.minLimit} HTG.`;
    typeof window.showAlert === 'function' ? window.showAlert(msg) : alert("🔴 " + msg);
    return;
  }

  if (val > window.retreData.maxLimit) {
    const msg = `Montan maksimòm pou ${window.retreData.methodName} se ${window.retreData.maxLimit} HTG.`;
    typeof window.showAlert === 'function' ? window.showAlert(msg) : alert("🔴 " + msg);
    return;
  }

  if (val > window.userAppData.currentBalance) {
    const msg = "Balans ou ensifizan pou fè retrè sa a.";
    typeof window.showAlert === 'function' ? window.showAlert(msg) : alert("🔴 " + msg);
    return;
  }

  window.retreData.amount = val;
  window.goToStep('step-enter-account');
};

// 5. VALIDASYON ENFÒMASYON KONT LAN
window.validateAccountStep = function() {
  const phoneInput = document.getElementById('retre-phone-input');
  const holderInput = document.getElementById('retre-holder-input');

  if (!phoneInput || !holderInput || !phoneInput.value.trim() || !holderInput.value.trim()) {
    const msg = "Tanpri ranpli nimewo telefòn lan ak non titilè a.";
    typeof window.showAlert === 'function' ? window.showAlert(msg) : alert("🔴 " + msg);
    return;
  }

  window.retreData.phone = phoneInput.value.trim();
  window.retreData.holder = holderInput.value.trim();

  document.getElementById('dt-method').innerText = window.retreData.methodName;
  document.getElementById('dt-amount').innerText = window.retreData.amount.toFixed(2) + " HTG";
  document.getElementById('dt-phone').innerText = window.retreData.phone;
  document.getElementById('dt-holder').innerText = window.retreData.holder;
  
  const now = new Date();
  document.getElementById('dt-date').innerText = now.toLocaleDateString('fr-FR') + " " + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const modalDetails = document.getElementById('modal-retre-details');
  if (modalDetails) {
    modalDetails.classList.remove('hidden');
    modalDetails.style.display = 'flex';
  }
};

// 6. PASAY NAN MODAL PIN
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

// 7. CONFIRMATION FINALE FIRESTORE TRANSAKTION
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
    
    // Anrejistre tranzaksyon nan Firestore
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

    // Diminye balans itilizatè a nan Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      balance: increment(-window.retreData.amount)
    });

    // Mettre à jour solde nan memwa lokal la
    window.userAppData.currentBalance -= window.retreData.amount;
    const balanceText = document.getElementById('user-balance');
    if (balanceText) {
      balanceText.innerText = `${window.userAppData.currentBalance.toFixed(2)} HTG`;
    }

    alert("✅ Demann retrè ou an voye avèk siksè! Kòb la dedwi sou balans ou anatandan validasyon admin.");

    // Reset fòm yo
    document.getElementById('retre-amount-input').value = '';
    document.getElementById('retre-phone-input').value = '';
    document.getElementById('retre-holder-input').value = '';
    window.goToStep('step-select-method');

  } catch (e) {
    console.error("Erè nan konfimasyon retrè:", e);
    alert("Erè pandan tranzaksyon an: " + e.message);
  }
};

// 8. KOUTE-KOUP KLIK YO POU SAK NAN HTML LYO
document.addEventListener('click', (e) => {
  const target = e.target.closest('[onclick]');
  if (!target) return;

  const onclickStr = target.getAttribute('onclick');
  if (!onclickStr) return;

  // Si se yon fonksyon ki gen rapò ak retre, asire ekzekisyon li
  if (
    onclickStr.includes('selectRetreMethod') || 
    onclickStr.includes('goToStep') || 
    onclickStr.includes('validateAmountStep') || 
    onclickStr.includes('validateAccountStep') ||
    onclickStr.includes('proceedToPinStep') ||
    onclickStr.includes('confirmFinalRetre') ||
    onclickStr.includes('closeModal')
  ) {
    try {
      const fnName = onclickStr.split('(')[0].trim();
      if (typeof window[fnName] === 'function') {
        e.preventDefault();
        new Function(onclickStr).call(target);
      }
    } catch (err) {
      console.error("Erè ekzekisyon click:", err);
    }
  }
});
