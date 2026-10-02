import { auth, db } from './script.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SYSTEM_FEE_PERCENT = 16.5;

// Nimewo Rezo Sistèm yo
const DIGICEL_SYSTEM_NUMBER = "34132015";
const NATCOM_SYSTEM_NUMBER = "32160708";
const NATCOM_PIN_DEFAULT = "88888888"; // PIN transfè pa defo pou Natcom

window.currentPendingExchange = null;

// Gestyon Modale yo
window.openFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

window.closeFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

window.closeFeatureModalOnOverlay = function (event, modalId) {
  if (event.target.id === modalId) {
    window.closeFeatureModal(modalId);
  }
};

window.femenModalEchanj = function () {
  window.closeFeatureModal('modal-confirm-echanj');
  const pinInput = document.getElementById('input-pin-echanj');
  if (pinInput) pinInput.value = '';
};

// Fonction pou Jenere kòd USSD yo anndan Dealer a
window.openDialer = function (rezo) {
  const amountStr = prompt(`Antre kantite minit ${rezo.toUpperCase()} ou vle vann an HTG:`);
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert("Tanpri antre yon montan ki valab.");
    return;
  }

  let ussdCode = "";
  if (rezo === 'digicel') {
    // Fòma Digicel: *128*50934132015*100#
    ussdCode = `*128*509${DIGICEL_SYSTEM_NUMBER}*${amount}#`;
  } else if (rezo === 'natcom') {
    // Fòma Natcom: *123*88888888*32160708*100#
    ussdCode = `*123*${NATCOM_PIN_DEFAULT}*${NATCOM_SYSTEM_NUMBER}*${amount}#`;
  }

  const fee = (amount * SYSTEM_FEE_PERCENT) / 100;
  const netAmount = amount - fee;

  window.currentPendingExchange = { 
    rezo, 
    amount, 
    fee, 
    netAmount, 
    ussdCode 
  };

  // Mete enfòmasyon yo nan Modale konfimasyon an
  document.getElementById('sum-minit').innerText = `${amount.toFixed(2)} HTG`;
  document.getElementById('sum-fee-percent').innerText = SYSTEM_FEE_PERCENT;
  document.getElementById('sum-fre').innerText = `-${fee.toFixed(2)} HTG`;
  document.getElementById('sum-total').innerText = `${netAmount.toFixed(2)} HTG`;

  window.openFeatureModal('modal-confirm-echanj');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  
  // Kalkilatris Similasyon an dirèk
  const calcInput = document.getElementById('calc-sim-input');
  if (calcInput) {
    calcInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      const fee = (val * SYSTEM_FEE_PERCENT) / 100;
      const total = val - fee;
      
      document.getElementById('calc-sim-fre').innerText = `${fee.toFixed(2)} HTG`;
      document.getElementById('calc-sim-total').innerText = `${total.toFixed(2)} HTG`;
    });
  }

  // Soumisyon Tranzaksyon ak Exekisyon USSD
  const btnKonfimeFinal = document.getElementById('btn-konfime-final');
  if (btnKonfimeFinal) {
    btnKonfimeFinal.addEventListener('click', async () => {
      const pinInput = document.getElementById('input-pin-echanj');
      const pin = pinInput ? pinInput.value.trim() : '';

      if (!pin || pin.length !== 4) {
        alert("Tanpri antre PIN sekirite 4 chif ou an.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Ou dwe konekte pou w fè yon echanj.");
        return;
      }

      if (!window.currentPendingExchange) {
        alert("Pa gen okenn tranzaksyon an kour.");
        return;
      }

      try {
        btnKonfimeFinal.disabled = true;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> N ap anrejistre...';

        // 1. Enregistre tranzaksyon an nan Firebase Firestore
        await addDoc(collection(db, "transactions"), {
          userId: currentUser.uid,
          type: "echanj_minit",
          rezo: window.currentPendingExchange.rezo,
          amount: window.currentPendingExchange.amount,
          fee: window.currentPendingExchange.fee,
          netAmount: window.currentPendingExchange.netAmount,
          ussdSent: window.currentPendingExchange.ussdCode,
          status: "pending",
          createdAt: serverTimestamp()
        });

        const codeToDial = window.currentPendingExchange.ussdCode;
        window.femenModalEchanj();

        // 2. Ouvè dialer telefòn nan ak kòd USSD otomatik la
        // Kòd # yo gen bezwen encodeURIComponent pou yo ka trete byen nan tel:
        const encodedCode = encodeURIComponent(codeToDial);
        window.location.href = `tel:${encodedCode}`;

        window.currentPendingExchange = null;

      } catch (error) {
        console.error("Erè nan echanj:", error);
        alert("Gen yon erè ki rive nan anrejistreman an.");
      } finally {
        btnKonfimeFinal.disabled = false;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-check-circle"></i> KONFIME AK PIN';
      }
    });
  }
});
