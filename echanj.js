// ==========================================
// 1. ENPÒTASYON DEPANSDANS SOTI NAN SCRIPT.JS AK FIREBASE
// ==========================================
import { auth, db } from './script.js';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konstants Sèvis Echanj
const SYSTEM_FEE_PERCENT = 16.5; // Frè sistèm nan %

// Variable pou kenbe tranzaksyon ki an kour an
window.currentPendingExchange = null;

// ==========================================
// 2. FONKSYON POU JERE MODALE VIZYÈL YO
// ==========================================

// Louvri Modale
window.openFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

// Fèmen Modale
window.closeFeatureModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// Fèmen Modale Lè w Klike sou Background an
window.closeFeatureModalOnOverlay = function (event, modalId) {
  if (event.target.id === modalId) {
    window.closeFeatureModal(modalId);
  }
};

// Fèmen Modale Echanj la epi Reinitialise Input PIN an
window.femenModalEchanj = function () {
  window.closeFeatureModal('modal-confirm-echanj');
  const pinInput = document.getElementById('input-pin-echanj');
  if (pinInput) pinInput.value = '';
};

// ==========================================
// 3. LOGIK TRANZAKSYON ECHANJ MINIT
// ==========================================

// Lancer Dial ak Seleksyon Rezo (Digicel / Natcom)
window.openDialer = function (rezo) {
  const amountStr = prompt(`Antre kantite minit ${rezo.toUpperCase()} ou vle vann an HTG:`);
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    if (window.showAlert) {
      window.showAlert("Tanpri antre yon montan ki valab.");
    } else {
      alert("Tanpri antre yon montan ki valab.");
    }
    return;
  }

  // Kalkil Frè ak Net
  const fee = (amount * SYSTEM_FEE_PERCENT) / 100;
  const netAmount = amount - fee;

  // Sove enfòmasyon tranzaksyon an kour an
  window.currentPendingExchange = {
    rezo: rezo,
    amount: amount,
    fee: fee,
    netAmount: netAmount
  };

  // Mete ajou rezime nan HTML la
  const sumMinit = document.getElementById('sum-minit');
  const sumFeePercent = document.getElementById('sum-fee-percent');
  const sumFre = document.getElementById('sum-fre');
  const sumTotal = document.getElementById('sum-total');

  if (sumMinit) sumMinit.innerText = `${amount.toFixed(2)} HTG`;
  if (sumFeePercent) sumFeePercent.innerText = SYSTEM_FEE_PERCENT;
  if (sumFre) sumFre.innerText = `-${fee.toFixed(2)} HTG`;
  if (sumTotal) sumTotal.innerText = `${netAmount.toFixed(2)} HTG`;

  // Ouvri Modale Konfimasyon PIN la
  window.openFeatureModal('modal-confirm-echanj');
};

// ==========================================
// 4. EVENT LISTENERS POU SOUMISYON TRANZAKSYON
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnKonfimeFinal = document.getElementById('btn-konfime-final');

  if (btnKonfimeFinal) {
    btnKonfimeFinal.addEventListener('click', async () => {
      const pinInput = document.getElementById('input-pin-echanj');
      const pin = pinInput ? pinInput.value.trim() : '';

      if (!pin || pin.length !== 4) {
        if (window.showAlert) window.showAlert("Tanpri antre yon PIN 4 chif ki valab.");
        return;
      }

      // Tcheke si itilizatè a konekte ak gwo script.js la
      const currentUser = auth.currentUser;
      if (!currentUser) {
        if (window.showAlert) window.showAlert("Ou dwe konekte pou w fè yon echanj.");
        return;
      }

      // Tcheke PIN itilizatè a (Si done yo chaje nan window.currentUserData soti nan script.js)
      const validPin = window.currentUserData?.pin || "1234";
      if (pin !== validPin) {
        if (window.showAlert) window.showAlert("PIN sekirite a pa korèk!");
        return;
      }

      if (!window.currentPendingExchange) {
        if (window.showAlert) window.showAlert("Pa gen okenn tranzaksyon an kour.");
        return;
      }

      try {
        btnKonfimeFinal.disabled = true;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

        // Anrejistre tranzaksyon an nan Firestore san bezwen inisyalize Firebase ankò
        await addDoc(collection(db, "transactions"), {
          userId: currentUser.uid,
          userPhone: window.currentUserData?.phone || "",
          type: "echanj_minit",
          rezo: window.currentPendingExchange.rezo,
          amount: window.currentPendingExchange.amount,
          fee: window.currentPendingExchange.fee,
          netAmount: window.currentPendingExchange.netAmount,
          status: "pending",
          createdAt: serverTimestamp()
        });

        window.femenModalEchanj();
        if (window.showAlert) {
          window.showAlert("Tranzaksyon soumèt ak siksè! N ap trete l nan kèk enstant.", "success");
        }

        // Netwaye tranzaksyon an kour an
        window.currentPendingExchange = null;

      } catch (error) {
        console.error("Erè pandan anrejistreman echanj la:", error);
        if (window.showAlert) window.showAlert("Erè nan soumisyon tranzaksyon an.");
      } finally {
        btnKonfimeFinal.disabled = false;
        btnKonfimeFinal.innerHTML = '<i class="fas fa-check-circle"></i> KONFIME AK PIN';
      }
    });
  }
});
