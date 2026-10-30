import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = getApp();
const auth = getAuth(app);
const rtdb = getDatabase(app);

let activeTab = 'tout';
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    renderCurrentView();
  } else {
    const targetContainer = document.getElementById(`list-${activeTab}`);
    if (targetContainer) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Tanpri konekte pou w wè istorik ou an.</p>`;
    }
  }
});

export function switchIstorik(targetId, btn) {
  activeTab = targetId;

  const buttons = document.querySelectorAll('.tab-btn-ist');
  buttons.forEach(b => b.classList.remove('active'));

  if (btn) {
    btn.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.tab-btn-ist[onclick*="'${targetId}'"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  document.querySelectorAll('.ist-content').forEach(div => {
    div.classList.add('hidden');
    div.innerHTML = '';
  });

  const targetContainer = document.getElementById(`list-${targetId}`);
  if (targetContainer) {
    targetContainer.classList.remove('hidden');
  }

  renderCurrentView();
}

export function filterByDate() {
  renderCurrentView();
}

export function clearDateFilter() {
  const dateInput = document.getElementById('filter-date-input');
  if (dateInput) {
    dateInput.value = '';
  }
  renderCurrentView();
}

async function renderCurrentView() {
  const activeUser = auth.currentUser || currentUser;
  if (!activeUser) return;

  const targetContainer = document.getElementById(`list-${activeTab}`);
  if (!targetContainer) return;

  targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #666;">N ap chache tranzaksyon yo...</p>`;

  const dateInput = document.getElementById('filter-date-input');
  const selectedDate = dateInput ? dateInput.value : '';

  try {
    const txRef = ref(rtdb, 'transactions');
    const snapshot = await get(txRef);

    if (!snapshot.exists()) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Pa gen okenn tranzaksyon ki anrejistre.</p>`;
      return;
    }

    let transactions = [];

    snapshot.forEach((childSnap) => {
      const tx = childSnap.val();
      tx.firebaseId = childSnap.key;
      const txUid = tx.uid || tx.userId;
      
      if (txUid === activeUser.uid) {
        transactions.push(tx);
      }
    });

    // Triye pou mete pi resan yo anwo
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let filtered = transactions.filter(tx => {
      if (activeTab === 'echanj') return tx.type === 'echanj_minit';
      if (activeTab === 'retre') return tx.type === 'retrait' || tx.type === 'retre';
      if (activeTab === 'echwe') return tx.status === 'failed' || tx.status === 'echwe';
      return true;
    });

    if (selectedDate) {
      filtered = filtered.filter(tx => {
        if (!tx.createdAt) return false;
        return tx.createdAt.startsWith(selectedDate);
      });
    }

    if (filtered.length === 0) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Pa gen tranzaksyon pou kritè sa yo.</p>`;
      return;
    }

    let html = '';
    filtered.forEach(tx => {
      const dateFormatted = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';
      const statusColor = tx.status === 'pending' ? 'orange' : (tx.status === 'success' ? 'green' : 'red');
      const titreRezo = tx.rezo ? tx.rezo.toUpperCase() : (tx.type || 'TRANZAKSYON');
      
      html += `
        <div style="background: #fff; padding: 12px 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="text-transform: uppercase; color: #333;">${titreRezo}</strong><br>
            <small style="color: #666;">Montan: <b>${tx.amount} HTG</b></small><br>
            <small style="color: #999; font-size: 11px;">${dateFormatted}</small>
          </div>
          <div style="text-align: right;">
            <span style="background: ${statusColor}; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${tx.status}</span><br>
            <button onclick="window.showReceiptFromGlobal('${tx.firebaseId}')" style="margin-top: 5px; background: none; border: none; color: #007bff; cursor: pointer; font-size: 12px;">Wè Reçu</button>
          </div>
        </div>
      `;
    });

    targetContainer.innerHTML = html;
    window.allUserTransactions = transactions;

  } catch (error) {
    console.error("Erè nan chajman istorik la:", error);
    targetContainer.innerHTML = `<p style="text-align:center; color: red; padding: 20px;">Erè nan chajman done yo.</p>`;
  }
}

export function showReceipt(tx) {
  if (!tx) return;

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setElText('rec-id', tx.firebaseId || tx.id || '---');
  setElText('rec-status', tx.status || '---');
  setElText('rec-amount', tx.amount ? `${tx.amount} HTG` : '---');
  setElText('rec-method', tx.rezo || tx.method || '---');
  // Isit la l ap afiche nimewo sistèm lan ki te anrejistre nan echanj.js la
  setElText('rec-phone', tx.userPhone || tx.phone || '---');
  setElText('rec-date', tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---');

  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.remove('hidden');
}

window.showReceiptFromGlobal = function(txId) {
  if (window.allUserTransactions) {
    const found = window.allUserTransactions.find(t => t.firebaseId === txId);
    if (found) showReceipt(found);
  }
};

export function closeReceipt() {
  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.add('hidden');
}

export function shareReceipt() {
  const id = document.getElementById('rec-id')?.textContent || '';
  const amount = document.getElementById('rec-amount')?.textContent || '';
  const status = document.getElementById('rec-status')?.textContent || '';

  const text = `Reçu Echanj Plus\nID: ${id}\nMontant: ${amount}\nStatut: ${status}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  
  window.open(url, '_blank');
}

window.switchIstorik = switchIstorik;
window.filterByDate = filterByDate;
window.clearDateFilter = clearDateFilter;
window.closeReceipt = closeReceipt;
window.shareReceipt = shareReceipt;
