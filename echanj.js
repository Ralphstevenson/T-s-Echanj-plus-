import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);

const DIGICEL_NUM = "34132015";
const NATCOM_NUM = "32160708";
const NATCOM_PIN = "88888888";

const FEE_DIGICEL = 18.3; 
const FEE_NATCOM = 17.5;  

const MIN_AMOUNT = 100;
const MAX_DIGICEL = 1000;
const MAX_NATCOM = 500;

let currentTransaction = {
  rezo: null,
  amount: 0,
  feePercent: 0,
  feeAmount: 0,
  netAmount: 0,
  ussdCode: ''
};

let currentUser = null;

// Tcheke ak kenbe leta koneksyon an
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

function closeAllModals() {
  document.querySelectorAll('.modal-echanj').forEach(m => {
    m.classList.add('hidden');
    m.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btnDigicel = document.getElementById('btn-digi');
  const btnNatcom = document.getElementById('btn-nat');
  
  const modalAmount = document.getElementById('modal-step-amount');
  const modalSummary = document.getElementById('modal-step-summary');
  const modalPin = document.getElementById('modal-step-pin');

  const inputAmount = document.getElementById('input-montan-echanj');
  const inputPin = document.getElementById('input-pin-echanj');

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  if (btnDigicel) {
    btnDigicel.addEventListener('click', () => {
      currentTransaction.rezo = 'digicel';
      currentTransaction.feePercent = FEE_DIGICEL;
      
      const txtRezo = document.getElementById('txt-selected-rezo');
      const txtLimit = document.getElementById('txt-limit-info');
      
      if (txtRezo) txtRezo.innerText = 'Digicel';
      if (txtLimit) txtLimit.innerText = `Limit: Min ${MIN_AMOUNT} HTG - Max ${MAX_DIGICEL} HTG`;
      
      if (inputAmount) inputAmount.value = '';
      closeAllModals();
      if (modalAmount) {
        modalAmount.classList.remove('hidden');
        modalAmount.style.display = 'flex';
      }
    });
  }

  if (btnNatcom) {
    btnNatcom.addEventListener('click', () => {
      currentTransaction.rezo = 'natcom';
      currentTransaction.feePercent = FEE_NATCOM;

      const txtRezo = document.getElementById('txt-selected-rezo');
      const txtLimit = document.getElementById('txt-limit-info');

      if (txtRezo) txtRezo.innerText = 'Natcom';
      if (txtLimit) txtLimit.innerText = `Limit: Min ${MIN_AMOUNT} HTG - Max ${MAX_NATCOM} HTG`;

      if (inputAmount) inputAmount.value = '';
      closeAllModals();
      if (modalAmount) {
        modalAmount.classList.remove('hidden');
        modalAmount.style.display = 'flex';
      }
    });
  }

  // ETAP 1: Pasaj nan Rezime / Detay
  const btnToStepSummary = document.getElementById('btn-to-step-summary');
  if (btnToStepSummary) {
    btnToStepSummary.addEventListener('click', () => {
      if (!inputAmount) return;
      const amountVal = parseFloat(inputAmount.value);
      const maxLimit = currentTransaction.rezo === 'digicel' ? MAX_DIGICEL : MAX_NATCOM;

      if (!amountVal || isNaN(amountVal)) {
        alert("Tanpri antre yon montan ki valab.");
        return;
      }

      if (amountVal < MIN_AMOUNT) {
        alert(`Minimum ou ka transfere se ${MIN_AMOUNT} HTG.`);
        return;
      }

      if (amountVal > maxLimit) {
        alert(`Montan an pa dwe depase ${maxLimit} HTG pou rezo sa a.`);
        return;
      }

      const fee = (amountVal * currentTransaction.feePercent) / 100;
      const net = amountVal - fee;

      currentTransaction.amount = amountVal;
      currentTransaction.feeAmount = fee;
      currentTransaction.netAmount = net;

      if (currentTransaction.rezo === 'digicel') {
        currentTransaction.ussdCode = `*128*509${DIGICEL_NUM}*${amountVal}#`;
      } else {
        currentTransaction.ussdCode = `*123*${NATCOM_PIN}*${NATCOM_NUM}*${amountVal}#`;
      }

      const summaryRezo = document.getElementById('summary-rezo');
      const summaryAmount = document.getElementById('summary-amount');
      const summaryFeePercent = document.getElementById('summary-fee-percent');
      const summaryFee = document.getElementById('summary-fee');
      const summaryNet = document.getElementById('summary-net');

      if (summaryRezo) summaryRezo.innerText = currentTransaction.rezo.toUpperCase();
      if (summaryAmount) summaryAmount.innerText = amountVal.toFixed(2);
      if (summaryFeePercent) summaryFeePercent.innerText = currentTransaction.feePercent;
      if (summaryFee) summaryFee.innerText = fee.toFixed(2);
      if (summaryNet) summaryNet.innerText = net.toFixed(2);

      closeAllModals();
      if (modalSummary) {
        modalSummary.classList.remove('hidden');
        modalSummary.style.display = 'flex';
      }
    });
  }

  const btnBackToAmount = document.getElementById('btn-back-to-amount');
  if (btnBackToAmount) {
    btnBackToAmount.addEventListener('click', () => {
      closeAllModals();
      if (modalAmount) {
        modalAmount.classList.remove('hidden');
        modalAmount.style.display = 'flex';
      }
    });
  }

  // ETAP 2: Pasaj nan Saisir PIN
  const btnToStepPin = document.getElementById('btn-to-step-pin');
  if (btnToStepPin) {
    btnToStepPin.addEventListener('click', async () => {
      const activeUser = auth.currentUser || currentUser;
      
      if (!activeUser) {
        alert("Tanpri konekte nan kont ou anvan.");
        return;
      }

      btnToStepPin.innerText = "N ap verifye...";
      btnToStepPin.disabled = true;

      try {
        const userRtdbRef = ref(rtdb, 'users/' + activeUser.uid);
        const rtdbSnap = await get(userRtdbRef);
        const rtdbData = rtdbSnap.exists() ? rtdbSnap.val() : null;

        if (!rtdbData || !rtdbData.transactionPin) {
          closeAllModals();
          if (confirm("⚠️ Ou poko gen yon PIN tranzaksyon. Est-ce que ou vle ale kreye yon PIN kounye a?")) {
            if (typeof window.openPinModal === 'function') {
              window.openPinModal('create');
            }
          }
          return;
        }

        if (inputPin) inputPin.value = '';
        closeAllModals();
        if (modalPin) {
          modalPin.classList.remove('hidden');
          modalPin.style.display = 'flex';
        }
      } catch (err) {
        console.error("Erè verifikasyon PIN:", err);
        if (inputPin) inputPin.value = '';
        closeAllModals();
        if (modalPin) {
          modalPin.classList.remove('hidden');
          modalPin.style.display = 'flex';
        }
      } finally {
        btnToStepPin.innerText = "Suivant";
        btnToStepPin.disabled = false;
      }
    });
  }

  const btnBackToSummary = document.getElementById('btn-back-to-summary');
  if (btnBackToSummary) {
    btnBackToSummary.addEventListener('click', () => {
      closeAllModals();
      if (modalSummary) {
        modalSummary.classList.remove('hidden');
        modalSummary.style.display = 'flex';
      }
    });
  }

  // ETAP 3: KONFIMASYON FINALE TRANSACTION
  const btnFinalConfirm = document.getElementById('btn-final-confirm');
  if (btnFinalConfirm) {
    btnFinalConfirm.addEventListener('click', async () => {
      const activeUser = auth.currentUser || currentUser;

      if (!activeUser) {
        alert("Tanpri konekte nan kont ou anvan.");
        return;
      }

      if (!inputPin) return;
      const userPinEntered = inputPin.value.trim();

      if (!userPinEntered || userPinEntered.length !== 4) {
        alert("Tanpri antre PIN sekirite 4 chif ou an.");
        return;
      }

      try {
        btnFinalConfirm.disabled = true;
        btnFinalConfirm.innerText = "N ap verifye...";

        const userRtdbRef = ref(rtdb, 'users/' + activeUser.uid);
        const rtdbSnap = await get(userRtdbRef);

        if (!rtdbSnap.exists()) {
          alert("Erè: Nou pa jwenn enfòmasyon kont ou an.");
          btnFinalConfirm.disabled = false;
          btnFinalConfirm.innerText = "Konfime & Voye Call";
          return;
        }

        const userData = rtdbSnap.val();
        const savedPin = userData.transactionPin;

        if (!savedPin) {
          closeAllModals();
          if (confirm("Ou pa gen yon PIN sekirite. Tanpri klike sou OK pou w ale kreye eden kounye a.")) {
            if (typeof window.openPinModal === 'function') {
              window.openPinModal('create');
            }
          }
          btnFinalConfirm.disabled = false;
          btnFinalConfirm.innerText = "Konfime & Voye Call";
          return;
        }

        if (String(userPinEntered) !== String(savedPin)) {
          alert("PIN sekirite a pa kòrèk!");
          btnFinalConfirm.disabled = false;
          btnFinalConfirm.innerText = "Konfime & Voye Call";
          return;
        }

        btnFinalConfirm.innerText = "N ap anrejistre...";

        // Nou prepare done yo byen pwòp san 'undefined' pou evite erè Firestore
        const transactionData = {
          userId: activeUser.uid,
          userPhone: userData.phone || activeUser.phoneNumber || "N/A",
          type: "echanj_minit",
          rezo: currentTransaction.rezo || "",
          amount: Number(currentTransaction.amount) || 0,
          feePercent: Number(currentTransaction.feePercent) || 0,
          feeAmount: Number(currentTransaction.feeAmount) || 0,
          netAmount: Number(currentTransaction.netAmount) || 0,
          ussdSent: currentTransaction.ussdCode || "",
          status: "pending",
          createdAt: serverTimestamp()
        };

        // Anrejistre sou Firestore
        await addDoc(collection(firestore, "transactions"), transactionData);

        closeAllModals();
        if (inputAmount) inputAmount.value = '';
        if (inputPin) inputPin.value = '';

        // Lanse apèl USSD la
        window.location.href = `tel:${encodeURIComponent(currentTransaction.ussdCode)}`;

      } catch (error) {
        console.error("Erè nan konfimasyon tranzaksyon an:", error);
        alert("Gen yon erè ki rive: " + (error.message || "Tanpri eseye ankò."));
      } finally {
        btnFinalConfirm.disabled = false;
        btnFinalConfirm.innerText = "Konfime & Voye Call";
      }
    });
  }
});
