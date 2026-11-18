import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = getApp();
const rtdb = getDatabase(app);

// Global variable pou estoke tranzaksyon ki jwenn nan chèk la
let currentInspectedTx = null;

// 1. Fonksyon Kalkilatè Minit ak Frè 16.5%
window.calculateExchange = function() {
  const amountInput = document.getElementById('calc-amount');
  const resultEl = document.getElementById('calc-result');
  
  if (!amountInput || !resultEl) return;

  const val = parseFloat(amountInput.value) || 0;
  // Kalkil: valè minit - 16.5% frè (oswa jan ou konn kalkile l la)
  const fee = val * 0.165;
  const netReceive = val - fee;

  resultEl.textContent = `${netReceive.toFixed(2)} HTG`;
};

// 2. Fonksyon Verifikasyon ID ak Règ 12 Èdtan an
window.inspectTransactionDetails = async function() {
  const idInput = document.getElementById('delayed-trx-id');
  const errorMsg = document.getElementById('trx-error-msg');
  const detailsCard = document.getElementById('trx-details-card');

  if (!idInput) return;

  const searchId = idInput.value.trim();
  
  if (errorMsg) errorMsg.style.display = 'none';
  if (detailsCard) detailsCard.style.display = 'none';

  if (!searchId) {
    if (errorMsg) {
      errorMsg.textContent = "Tanpri antre yon ID tranzaksyon ki valid.";
      errorMsg.style.display = 'block';
    }
    return;
  }

  try {
    const txRef = ref(rtdb, `transactions/${searchId}`);
    const snapshot = await get(txRef);

    if (!snapshot.exists()) {
      if (errorMsg) {
        errorMsg.textContent = "ID tranzaksyon sa a pa egziste nan sistèm nan.";
        errorMsg.style.display = 'block';
      }
      return;
    }

    const tx = snapshot.val();
    tx.firebaseId = snapshot.key;
    currentInspectedTx = tx;

    // Tcheke dat kreye a pou règ 12 èdtan an
    if (tx.createdAt) {
      const txTime = new Date(tx.createdAt).getTime();
      const nowTime = new Date().getTime();
      const diffHours = (nowTime - txTime) / (1000 * 60 * 60);

      // Si tranzaksyon an poko gen 12 èdtan epi estati l an atant (pending)
      if (diffHours < 12 && tx.status === 'pending') {
        if (errorMsg) {
          errorMsg.textContent = "Tan an poko rive! Sistèm nan kite yon delè 12 èdtan pou tranzaksyon an valide natirèlman. Se sèlman si tan sa a pase san l pa valide ke ou ka fè suivi a pou jwenn asistans.";
          errorMsg.style.display = 'block';
        }
        return;
      }
    }

    // Si l pase 12h oswa l pa 'pending', nou afiche detay yo
    document.getElementById('det-id').textContent = tx.firebaseId;
    document.getElementById('det-status').textContent = tx.status ? tx.status.toUpperCase() : 'AN ATANT';
    document.getElementById('det-network').textContent = tx.rezo || '---';
    document.getElementById('det-amount').textContent = `${tx.amount || 0} Minit`;
    document.getElementById('det-receive').textContent = `${tx.netAmount || tx.amount || 0} HTG`;
    document.getElementById('det-date').textContent = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';

    if (detailsCard) detailsCard.style.display = 'block';

  } catch (error) {
    console.error("Erè pandan verifikasyon ID a:", error);
    if (errorMsg) {
      errorMsg.textContent = "Gen yon ti pwoblèm teknik. Eseye ankò.";
      errorMsg.style.display = 'block';
    }
  }
};

// 3. Fonksyon Asistans Rapid (Voye bay WhatsApp Admin ak enfòmasyon yo)
window.sendFullClaimToWhatsApp = function() {
  if (!currentInspectedTx) return;

  const tx = currentInspectedTx;
  const text = `*REKLAMASYON / SUIVI TRANZAKSYON* - Echanj Plus\n\n` +
               `🆔 ID: ${tx.firebaseId}\n` +
               `📊 Estati: ${tx.status || 'pending'}\n` +
               `🌐 Rezo: ${tx.rezo || '---'}\n` +
               `💰 Montan: ${tx.amount || 0} Minit\n` +
               `📅 Dat: ${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---'}\n\n` +
               `Mwen ta renmen jwen asistans sou tranzaksyon sa a ki depase 12è tan.`;

  // Nimewo WhatsApp Admin (ou ka mete bon nimewo ou a la)
  const adminPhone = "509341332015"; 
  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  
  window.open(url, '_blank');
};
