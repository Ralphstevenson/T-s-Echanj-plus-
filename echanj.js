// ==========================================
// ECHANJ MINIT MODULE (echanj.js)
// ==========================================
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Reperan instans Firebase
const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Konfigirasyon Rezo ak Limit yo
const DIGICEL_NUM = "34132015";
const NATCOM_NUM = "32160708";
const NATCOM_PIN = "88888888";

const FEE_DIGICEL = 18.3; // 18.3% pou Digicel
const FEE_NATCOM = 17.5;  // 17.5% pou Natcom

const MIN_AMOUNT = 100;
const MAX_DIGICEL = 1000;
const MAX_NATCOM = 500;

// Objè pou kenbe done tranzaksyon an pandan navigasyon an
let currentTransaction = {
  rezo: null,
  amount: 0,
  feePercent: 0,
  feeAmount: 0,
  netAmount: 0,
  ussdCode: ''
};

// Fonksyon pou kache tout fenèt pop-up (modals) yo
function closeAllModals() {
  document.querySelectorAll('.modal-echanj').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('DOMContentLoaded', () => {
  const btnDigicel = document.getElementById('btn-digi');
  const btnNatcom = document.getElementById('btn-nat');
  
  const modalAmount = document.getElementById('modal-step-amount');
  const modalSummary = document.getElementById('modal-step-summary');
  const modalPin = document.getElementById('modal-step-pin');

  const inputAmount = document.getElementById('input-montan-echanj');
  const inputPin = document.getElementById('input-pin-echanj');

  // Fèmen fenèt lè w klike sou bouton X
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // 1. KLIK SOU BOUTON DIGICEL
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
      if (modalAmount) modalAmount.classList.remove('hidden');
    });
  }

  // 2. KLIK SOU BOUTON NATCOM
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
      if (modalAmount) modalAmount.classList.remove('hidden');
    });
  }

  // 3. SOUMÈT MONTAN AN SOU FENÈT DETAY (SUIVANT - ETAP 1)
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

      // Kalkil Frè ak Montan Nèt
      const fee = (amountVal * currentTransaction.feePercent) / 100;
      const net = amountVal - fee;

      currentTransaction.amount = amountVal;
      currentTransaction.feeAmount = fee;
      currentTransaction.netAmount = net;

      // Generasyon kòd USSD
      if (currentTransaction.rezo === 'digicel') {
        currentTransaction.ussdCode = `*128*509${DIGICEL_NUM}*${amountVal}#`;
      } else {
        currentTransaction.ussdCode = `*123*${NATCOM_PIN}*${NATCOM_NUM}*${amountVal}#`;
      }

      // Mete detay yo nan fenèt Rezime a
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
      if (modalSummary) modalSummary.classList.remove('hidden');
    });
  }

  // 4. RETOUNEN SOU FENÈT MONTAN (RETOUNEN - ETAP 2)
  const btnBackToAmount = document.getElementById('btn-back-to-amount');
  if (btnBackToAmount) {
    btnBackToAmount.addEventListener('click', () => {
      closeAllModals();
      if (modalAmount) modalAmount.classList.remove('hidden');
    });
  }

  // 5. PASE NAN FENÈT PIN (SUIVANT - ETAP 2)
  const btnToStepPin = document.getElementById('btn-to-step-pin');
  if (btnToStepPin) {
    btnToStepPin.addEventListener('click', () => {
      if (inputPin) inputPin.value = '';
      closeAllModals();
      if (modalPin) modalPin.classList.remove('hidden');
    });
  }

  // 6. RETOUNEN SOU REZIME (RETOUNEN - ETAP 3)
  const btnBackToSummary = document.getElementById('btn-back-to-summary');
  if (btnBackToSummary) {
    btnBackToSummary.addEventListener('click', () => {
      closeAllModals();
      if (modalSummary) modalSummary.classList.remove('hidden');
    });
  }

  // 7. VERIFIKASYON PIN, ANREJISTREMAN FIRESTORE AK VOYE CALL
  const btnFinalConfirm = document.getElementById('btn-final-confirm');
  if (btnFinalConfirm) {
    btnFinalConfirm.addEventListener('click', async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
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

        // Chèche PIN pou verifye
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          alert("Erè: Nou pa jwenn enfòmasyon kont ou an.");
          return;
        }

        const userData = userDocSnap.data();
        const savedPin = userData.pinSecurity || userData.pin;

        if (!savedPin) {
          alert("Ou pa gen yon PIN sekirite ki anrejistre nan kont ou. Tanpri kreye youn nan Settings.");
          return;
        }

        if (userPinEntered !== String(savedPin)) {
          alert("PIN sekirite a pa kòrèk!");
          return;
        }

        btnFinalConfirm.innerText = "N ap anrejistre...";

        // Anrejistre tranzaksyon an sou Firestore
        await addDoc(collection(db, "transactions"), {
          userId: currentUser.uid,
          userPhone: userData.phone || null,
          type: "echanj_minit",
          rezo: currentTransaction.rezo,
          amount: currentTransaction.amount,
          feePercent: currentTransaction.feePercent,
          feeAmount: currentTransaction.feeAmount,
          netAmount: currentTransaction.netAmount,
          ussdSent: currentTransaction.ussdCode,
          status: "pending",
          createdAt: serverTimestamp()
        });

        closeAllModals();
        if (inputAmount) inputAmount.value = '';
        if (inputPin) inputPin.value = '';

        // Ouvè Dialer telefòn nan pou voye kòd USSD a otomatikman
        window.location.href = `tel:${encodeURIComponent(currentTransaction.ussdCode)}`;

      } catch (error) {
        console.error("Erè nan konfimasyon tranzaksyon an:", error);
        alert("Gen yon erè ki rive pandan anrejistreman an. Tanpri eseye ankò.");
      } finally {
        btnFinalConfirm.disabled = false;
        btnFinalConfirm.innerText = "Konfime & Voye Call";
      }
    });
  }
});
