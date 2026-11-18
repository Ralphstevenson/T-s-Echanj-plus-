import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = getApp();
const rtdb = getDatabase(app);
const auth = getAuth(app);

let currentInspectedTx = null;

// Fonksyon pou trase kat la lè eleman yo egziste nan DOM nan
function renderTransactionCard(tx) {
  currentInspectedTx = tx;

  const detId = document.getElementById('det-id');
  const statusEl = document.getElementById('det-status');
  const netEl = document.getElementById('det-network');
  const amtEl = document.getElementById('det-amount');
  const dateEl = document.getElementById('det-date');

  if (!detId || !statusEl) return; // Si nou pa sou bon ekran an kounye a, sispann yon ti moman

  detId.textContent = tx.id;
  statusEl.textContent = tx.status === 'success' ? 'Validé' : (tx.status === 'pending' ? 'An atant' : tx.status);
  statusEl.style.background = tx.status === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 191, 36, 0.15)';
  statusEl.style.color = tx.status === 'success' ? '#00e676' : '#fbbf24';

  if (netEl) netEl.textContent = (tx.rezo || tx.type || 'N/A').toUpperCase();
  if (amtEl) amtEl.textContent = `${tx.amount || 0} HTG`;
  if (dateEl) dateEl.textContent = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';
}

// Fonksyon entelijan k ap tcheke tout tan epi retabli kat la otomatikman
function checkAndRestoreState() {
  const savedTx = localStorage.getItem('echanj_last_inspected_tx');
  const detId = document.getElementById('det-id');
  
  if (savedTx && detId && detId.textContent === '--') {
    try {
      const tx = JSON.parse(savedTx);
      renderTransactionCard(tx);
      const inputEl = document.getElementById('delayed-trx-id');
      if (inputEl && !inputEl.value) inputEl.value = tx.id;
    } catch (e) {
      console.error("Erè restorasyon:", e);
    }
  }
}

// 1. Koute chak fwa itilizatè a chanje ekran oswa klike nenpòt kote sou sit la
document.addEventListener('click', () => {
  setTimeout(checkAndRestoreState, 50);
});

// 2. Sèvi ak yon MutationObserver pou l veye chanjman nan ekran an an tan reyèl
const observer = new MutationObserver(() => {
  checkAndRestoreState();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 3. Verifikasyon lè paj la chaje nèt tou
window.addEventListener('DOMContentLoaded', checkAndRestoreState);

// Fonksyon verifikasyon ID a
window.inspectTransactionDetails = async function(event) {
  if (event) event.preventDefault();

  const inputEl = document.getElementById('delayed-trx-id');
  const errorEl = document.getElementById('trx-error-msg');

  if (!inputEl) return;
  const rawId = inputEl.value.trim();

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
  currentInspectedTx = null;
  localStorage.removeItem('echanj_last_inspected_tx');

  const currentUser = auth.currentUser;
  if (!currentUser) {
    if (errorEl) {
      errorEl.textContent = "Tanpri konekte ankò pou w ka fè verifikasyon an.";
      errorEl.style.display = 'block';
    }
    return;
  }

  if (!rawId) {
    if (errorEl) {
      errorEl.textContent = "Tanpri antre yon ID tranzaksyon valab.";
      errorEl.style.display = 'block';
    }
    return;
  }

  try {
    const txRef = ref(rtdb, `transactions/${rawId}`);
    let snapshot = await get(txRef);

    let tx = null;
    let finalId = rawId;

    if (snapshot.exists()) {
      tx = snapshot.val();
      tx.id = rawId;
    } else {
      const allTxRef = ref(rtdb, `transactions`);
      const allSnap = await get(allTxRef);
      
      if (allSnap.exists()) {
        allSnap.forEach((child) => {
          if (child.key.toLowerCase() === rawId.toLowerCase()) {
            tx = child.val();
            finalId = child.key;
          }
        });
      }
    }

    if (!tx) {
      if (errorEl) {
        errorEl.textContent = "ID tranzaksyon sa a pa egziste nan sistèm nan.";
        errorEl.style.display = 'block';
      }
      return;
    }

    tx.id = finalId;

    // --- RÈG 12 ÈDTAN AN ---
    if (tx.createdAt) {
      const txTime = new Date(tx.createdAt).getTime();
      const now = new Date().getTime();
      const diffHours = (now - txTime) / (1000 * 60 * 60);

      if (diffHours < 12 && tx.status !== 'success') {
        if (errorEl) {
          errorEl.textContent = `Tranzaksyon sa a poko gen 12 èdtan (l gen anviwon ${Math.floor(diffHours)}è tan). Suivi ak asistans rapid disponib sèlman si 12 èdtan pase epi li toujou poko valide.`;
          errorEl.style.display = 'block';
        }
        return;
      }
    }

    localStorage.setItem('echanj_last_inspected_tx', JSON.stringify(tx));
    renderTransactionCard(tx);

  } catch (err) {
    console.error("Erè nan verifikasyon ID a:", err);
    if (errorEl) {
      errorEl.textContent = "Gen yon ti pwoblèm pèmisyon oswa teknik nan Firebase.";
      errorEl.style.display = 'block';
    }
  }
};

window.sendFullClaimToWhatsApp = function() {
  if (!currentInspectedTx) return;

  const tx = currentInspectedTx;
  const adminPhone = "+50934132015";
  const userMsgInput = document.getElementById('client-claim-msg');
  const customMsg = userMsgInput ? userMsgInput.value.trim() : '';

  const currentUser = auth.currentUser;
  const userEmail = currentUser ? currentUser.email : 'N/A';

  let message = `*REKLAMASYON / SUIVI TRANZAKSYON*\n\n` +
    `🆔 *ID Tranzaksyon:* ${tx.id}\n` +
    `👤 *ID Itilizatè:* ${tx.uid || currentUser.uid}\n` +
    `📧 *Imèl Itilizatè:* ${userEmail}\n` +
    `📶 *Rezo:* ${tx.rezo || 'N/A'}\n` +
    `💰 *Montan:* ${tx.amount} HTG\n` +
    `📌 *Estati:* ${tx.status}\n` +
    `📅 *Dat Tranzaksyon:* ${tx.createdAt || 'N/A'}\n`;

  if (customMsg) {
    message += `\n💬 *Mesaj Kliyan:* ${customMsg}\n`;
  }

  message += `\n_M ap mande asistans rapid sou tranzaksyon sa a ki depase delè a._`;

  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
