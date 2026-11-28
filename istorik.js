import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = getApp();
const auth = getAuth(app);
const rtdb = getDatabase(app);

let activeTab = 'tout';
let currentUser = null;

function isUsdtTx(tx) {
  return tx && tx.type === 'usdt_exchange';
}

function isApprovedTx(tx) {
  const st = String(tx?.status || '').toLowerCase().trim();
  return ['approved', 'valide', 'validated', 'success'].includes(st);
}

function getTxHtgAmount(tx) {
  if (tx?.totalHtg !== undefined && tx?.totalHtg !== null && !Number.isNaN(Number(tx.totalHtg))) {
    return Number(tx.totalHtg);
  }
  return parseFloat(tx?.amount) || 0;
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    renderCurrentView();
  } else {
    const targetContainer = document.getElementById(`list-${activeTab}`);
    if (targetContainer) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #9eaab6;">Tanpri konekte pou w wè istorik ou an.</p>`;
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
  if (!activeUser) {
    console.log("Itilizatè a poko otantifye.");
    return;
  }

  const targetContainer = document.getElementById(`list-${activeTab}`);
  if (!targetContainer) return;

  targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #9eaab6;">N ap chache tranzaksyon yo...</p>`;

  const dateInput = document.getElementById('filter-date-input');
  const selectedDate = dateInput ? dateInput.value : '';

  try {
    const txRef = ref(rtdb, 'transactions');
    const snapshot = await get(txRef);

    // Mete non mwa aktyèl la nan banèv la
    const monthsNames = ["JANVYE", "FEVRIYE", "MAS", "AVRI", "ME", "JEN", "JIYÈ", "OUT", "SEPTANM", "OKTÒB", "NOVANM", "DESANM"];
    const now = new Date();
    const currentMonthName = `${monthsNames[now.getMonth()]} ${now.getFullYear()}`;
    const monthLabelEl = document.getElementById('txt-current-month');
    if (monthLabelEl) monthLabelEl.textContent = currentMonthName;

    if (!snapshot.exists()) {
      targetContainer.innerHTML = activeTab === 'usdt'
        ? `<p style="text-align:center; padding: 20px; color: #9eaab6;">pa gen transaksyon pou krite sa yo .</p>`
        : `<p style="text-align:center; padding: 20px; color: #9eaab6;">Pa gen okenn tranzaksyon ki anrejistre.</p>`;
      updateSummaryBanner([], 0, 0, 0);
      return;
    }

    let transactions = [];

    snapshot.forEach((childSnap) => {
      const tx = childSnap.val();
      tx.firebaseId = childSnap.key;

      const txUid = tx.uid || tx.userId;

      if (txUid && txUid.toString().trim() === activeUser.uid.toString().trim()) {
        transactions.push(tx);
      }
    });

    // Triye pou mete pi resan yo anwo
    transactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let filtered = transactions.filter(tx => {
      if (activeTab === 'usdt') return isUsdtTx(tx);
      if (activeTab === 'echanj') return tx.type === 'echanj_minit';
      if (activeTab === 'retre') return tx.type === 'retrait' || tx.type === 'retre';
      if (activeTab === 'echwe') return ['failed', 'echwe', 'rejected', 'rejete'].includes(String(tx.status || '').toLowerCase());
      return true;
    });

    if (selectedDate) {
      filtered = filtered.filter(tx => {
        if (!tx.createdAt) return false;
        const dt = new Date(tx.createdAt);
        if (!Number.isNaN(dt.getTime())) {
          return dt.toISOString().slice(0, 10) === selectedDate;
        }
        return String(tx.createdAt).startsWith(selectedDate);
      });
    }

    let totalEntries = 0;
    let totalSorties = 0;
    let monthlySum = 0;

    transactions.forEach(tx => {
      if (isUsdtTx(tx)) {
        // Pou USDT, konte nan Entre / Sòti / Total Mwa sèlman lè tranzaksyon an valide
        if (!isApprovedTx(tx)) return;
        const htgAmt = getTxHtgAmount(tx);
        if (tx.subType === 'achte') {
          totalEntries += htgAmt;
          monthlySum += htgAmt;
        } else if (tx.subType === 'vann') {
          totalSorties += htgAmt;
          monthlySum -= htgAmt;
        }
        return;
      }

      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'deposit' || tx.type === 'depot' || (amt > 0 && tx.type !== 'retrait' && tx.type !== 'retre')) {
        totalEntries += amt;
      } else {
        totalSorties += amt;
      }
      monthlySum += amt;
    });

    updateSummaryBanner(transactions, totalEntries, totalSorties, monthlySum);

    if (filtered.length === 0) {
      targetContainer.innerHTML = activeTab === 'usdt'
        ? `<p style="text-align:center; padding: 20px; color: #9eaab6;">pa gen transaksyon pou krite sa yo .</p>`
        : `<p style="text-align:center; padding: 20px; color: #9eaab6;">Pa gen tranzaksyon pou kritè sa yo.</p>`;
      return;
    }

    let html = '';
    filtered.forEach(tx => {
      const dateFormatted = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';
      const stLower = String(tx.status || '').toLowerCase();
      const statusColor = stLower === 'pending'
        ? '#ff9800'
        : (isApprovedTx(tx) ? '#00e676' : '#ff5252');

      if (isUsdtTx(tx)) {
        const modeLabel = tx.subType === 'vann' ? 'Achte USDT (142 HTG)' : 'Vann Bay Sistèm (130 HTG)';
        const netUsdtDisp = Number(tx.netUsdt || 0).toFixed(6);
        const htgDisp = getTxHtgAmount(tx).toFixed(2);

        html += `
          <div class="transaction-item" onclick="window.showReceiptFromGlobal('${tx.firebaseId}')">
            <div>
              <strong style="text-transform: uppercase; color: #ffffff; font-size: 14px;">USDT (${tx.network || 'BEP20'}) • ${modeLabel}</strong><br>
              <small style="color: #9eaab6; font-size: 12px;">Nèt: <b style="color: #00e676;">${netUsdtDisp} USDT</b> • <b style="color: #fbbf24;">${htgDisp} HTG</b></small><br>
              <small style="color: #64748b; font-size: 11px;">${dateFormatted}</small>
            </div>
            <div style="text-align: right;">
              <span style="background: ${statusColor}; color: #131a22; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${tx.status}</span><br>
              <span style="color: #00e676; font-size: 12px; margin-top: 6px; display: inline-block;">Wè Reçu <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i></span>
            </div>
          </div>
        `;
        return;
      }

      const titreRezo = tx.rezo ? tx.rezo.toUpperCase() : (tx.type || 'TRANZAKSYON');

      html += `
        <div class="transaction-item" onclick="window.showReceiptFromGlobal('${tx.firebaseId}')">
          <div>
            <strong style="text-transform: uppercase; color: #ffffff; font-size: 14px;">${titreRezo}</strong><br>
            <small style="color: #9eaab6; font-size: 12px;">Montan: <b style="color: #00e676;">${tx.amount} HTG</b></small><br>
            <small style="color: #64748b; font-size: 11px;">${dateFormatted}</small>
          </div>
          <div style="text-align: right;">
            <span style="background: ${statusColor}; color: #131a22; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${tx.status}</span><br>
            <span style="color: #00e676; font-size: 12px; margin-top: 6px; display: inline-block;">Wè Reçu <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i></span>
          </div>
        </div>
      `;
    });

    targetContainer.innerHTML = html;
    window.allUserTransactions = transactions;

  } catch (error) {
    console.error("Erè nan chajman istorik la:", error);
    targetContainer.innerHTML = `<p style="text-align:center; color: #ff5252; padding: 20px;">Erè nan chajman done yo.</p>`;
  }
}

function updateSummaryBanner(transactions, entries, sorties, monthlySum) {
  const totalCountEl = document.getElementById('txt-total-count');
  const monthlyTotalEl = document.getElementById('txt-monthly-total');
  const totalEntriesEl = document.getElementById('txt-total-entries');
  const totalSortiesEl = document.getElementById('txt-total-sorties');

  if (totalCountEl) totalCountEl.textContent = `TOTAL • ${transactions.length} tranzaksyon`;
  if (monthlyTotalEl) monthlyTotalEl.textContent = `${monthlySum >= 0 ? '+' : ''}${monthlySum.toFixed(2)} HTG`;
  if (totalEntriesEl) totalEntriesEl.textContent = `${entries.toFixed(2)} HTG`;
  if (totalSortiesEl) totalSortiesEl.textContent = `${sorties.toFixed(2)} HTG`;
}

export function showReceipt(tx) {
  if (!tx) return;

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  if (isUsdtTx(tx)) {
    const modeText = tx.subType === 'vann' ? 'Achte USDT (142 HTG)' : 'Vann Bay Sistèm (130 HTG)';
    setElText('rec-id', tx.firebaseId || tx.id || '---');
    setElText('rec-status', tx.status || '---');
    setElText('rec-amount', `${Number(tx.netUsdt || 0).toFixed(6)} USDT Nèt (${getTxHtgAmount(tx).toFixed(2)} HTG)`);
    setElText('rec-method', `${modeText} • ${tx.network || 'BEP20'}`);
    setElText('rec-phone', tx.target || tx.txHash || tx.mobileMoneyTxId || tx.receivingWalletAddress || '---');
    setElText('rec-date', tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---');
  } else {
    setElText('rec-id', tx.firebaseId || tx.id || '---');
    setElText('rec-status', tx.status || '---');
    setElText('rec-amount', tx.amount ? `${tx.amount} HTG` : '---');
    setElText('rec-method', tx.rezo || tx.method || '---');
    setElText('rec-phone', tx.userPhone || tx.phone || '---');
    setElText('rec-date', tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---');
  }

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

window.openReleveCompte = function() {
  alert("Fonksyonalite Relevé de compte la ap disponib anpil byento!");
};

window.switchIstorik = switchIstorik;
window.filterByDate = filterByDate;
window.clearDateFilter = clearDateFilter;
window.closeReceipt = closeReceipt;
window.shareReceipt = shareReceipt;
