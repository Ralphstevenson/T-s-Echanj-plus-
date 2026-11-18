import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = getApp();
const rtdb = getDatabase(app);
const auth = getAuth(app);

let currentInspectedTx = null;

window.inspectTransactionDetails = async function(event) {
  if (event) event.preventDefault();

  const inputEl = document.getElementById('delayed-trx-id');
  const errorEl = document.getElementById('trx-error-msg');
  const cardEl = document.getElementById('trx-details-card');

  if (!inputEl) return;
  const rawId = inputEl.value.trim();

  // Reset UI
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  cardEl.style.display = 'none';
  currentInspectedTx = null;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    errorEl.textContent = "Tanpri konekte ankò pou w ka fè verifikasyon an.";
    errorEl.style.display = 'block';
    return;
  }

  if (!rawId) {
    errorEl.textContent = "Tanpri antre yon ID tranzaksyon valab.";
    errorEl.style.display = 'block';
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
      errorEl.textContent = "ID tranzaksyon sa a pa egziste nan sistèm nan.";
      errorEl.style.display = 'block';
      return;
    }

    tx.id = finalId;
    currentInspectedTx = tx;

    // --- RÈG 12 ÈDTAN AN ---
    if (tx.createdAt) {
      const txTime = new Date(tx.createdAt).getTime();
      const now = new Date().getTime();
      const diffHours = (now - txTime) / (1000 * 60 * 60);

      if (diffHours < 12 && tx.status !== 'success') {
        errorEl.textContent = `Tranzaksyon sa a poko gen 12 èdtan (l gen anviwon ${Math.floor(diffHours)}è tan). Suivi ak asistans rapid disponib sèlman si 12 èdtan pase epi li toujou poko valide.`;
        errorEl.style.display = 'block';
        return;
      }
    }

    // Afiche detay yo nan kat la
    document.getElementById('det-id').textContent = tx.id;
    
    const statusEl = document.getElementById('det-status');
    statusEl.textContent = tx.status === 'success' ? 'Validé' : (tx.status === 'pending' ? 'An atant' : tx.status);
    statusEl.style.background = tx.status === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    statusEl.style.color = tx.status === 'success' ? '#00e676' : '#fbbf24';

    document.getElementById('det-network').textContent = (tx.rezo || tx.type || 'N/A').toUpperCase();
    document.getElementById('det-amount').textContent = `${tx.amount || 0} HTG`;
    document.getElementById('det-date').textContent = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';

    cardEl.style.display = 'block';
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error("Erè nan verifikasyon ID a:", err);
    errorEl.textContent = "Gen yon ti pwoblèm pèmisyon oswa teknik nan Firebase. Tcheke règ baz de done w yo.";
    errorEl.style.display = 'block';
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
