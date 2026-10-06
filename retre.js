import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
const firestore = getFirestore();
const rtdb = getDatabase();

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

// 1. REKIPERASYON DONE UTILIZATÈ DEPI NAN FIRESTORE AK RTDB
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // 1. Firestore pou balans ak non
      const userRef = doc(firestore, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        window.userAppData.fullname = data.fullname || data.phone || "Itilizatè";
        window.userAppData.currentBalance = Number(data.balance || 0);
      }

      // 2. RTDB pou PIN lan[span_4](start_span)[span_4](end_span)
      const rtdbRef = ref(rtdb, 'users/' + user.uid);
      const rtdbSnap = await get(rtdbRef);
      if (rtdbSnap.exists()) {
        const rData = rtdbSnap.val();
        if (rData.transactionPin) {
          window.userAppData.hasPin = true;
          window.userAppData.correctPin = String(rData.transactionPin);
        }
      }
    } catch (e) {
      console.error("Erreur de chargement des données utilisateur:", e);
    }
  }
});

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

window.validateAmountStep = function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
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

// PASE NAN ETAP PIN OOSWA ADIRIJE POU KREYE PIN
window.proceedToPinStep = function() {
  window.closeModal('modal-retre-details');

  if (!window.userAppData.hasPin) {
    if (confirm("⚠️ Ou dwe kreye yon kòd PIN pou konfime retrè yo. Klike sou OK pou ale nan kreye PIN.")) {
      if (typeof window.openPinModal === 'function') {
        window.openPinModal('create');
      }
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

// CONFIRMATION FINALE TRANSACTION RETRÈ FIRESTORE
window.confirmFinalRetre = async function() {
  const pinInput = document.getElementById('retre-pin-input');
  
  if (!pinInput || String(pinInput.value.trim()) !== String(window.userAppData.correctPin)) {
    alert("❌ Kòd PIN sa a pa korèk! Tanpri re-eseye.");
    if (pinInput) pinInput.value = '';
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  window.closeModal('modal-retre-pin');

  try {
    const transID = "RET-" + Date.now().toString().slice(-6);
    
    await setDoc(doc(firestore, "withdrawals", transID), {
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

    const userRef = doc(firestore, "users", user.uid);
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

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[onclick]');
  if (!btn) return;

  const onclickAttr = btn.getAttribute('onclick');
  if (!onclickAttr) return;

  if (btn.tagName === 'BUTTON' || btn.getAttribute('type') === 'submit') {
    e.preventDefault();
  }
});
