import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = getApp();
const auth = getAuth(app);
const rtdb = getDatabase(app);

// Variable globale pour suivre l'onglet actif
let activeTab = 'tout';

/**
 * Fonction pour changer d'onglet et déplacer le style actif
 * @param {string} targetId - L'identifiant de la liste ('tout', 'echanj', 'retre', 'echwe')
 * @param {HTMLElement} [btn] - Le bouton cliqué (optionnel)
 */
export function switchIstorik(targetId, btn) {
  activeTab = targetId;

  // 1. Retirer la classe 'active' de tous les boutons
  const buttons = document.querySelectorAll('.tab-btn-ist');
  buttons.forEach(b => b.classList.remove('active'));

  // 2. Appliquer la classe 'active' sur le bouton sélectionné
  if (btn) {
    btn.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.tab-btn-ist[onclick*="'${targetId}'"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  // 3. Masquer tous les contenus
  document.querySelectorAll('.ist-content').forEach(div => {
    div.classList.add('hidden');
    div.innerHTML = ''; // Netwaye pou evite doublon
  });

  // 4. Afficher le contenu de l'onglet sélectionné
  const targetContainer = document.getElementById(`list-${targetId}`);
  if (targetContainer) {
    targetContainer.classList.remove('hidden');
  }

  // 5. Charger et afficher les données
  renderCurrentView();
}

/**
 * Filtrer les transactions par date
 */
export function filterByDate() {
  renderCurrentView();
}

/**
 * Effacer le filtre de date
 */
export function clearDateFilter() {
  const dateInput = document.getElementById('filter-date-input');
  if (dateInput) {
    dateInput.value = '';
  }
  renderCurrentView();
}

/**
 * Mettre à jour l'affichage selon l'onglet actif et le filtre de date depuis Realtime Database
 */
async function renderCurrentView() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const targetContainer = document.getElementById(`list-${activeTab}`);
  if (!targetContainer) return;

  targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #666;">N ap chache tranzaksyon yo...</p>`;

  const dateInput = document.getElementById('filter-date-input');
  const selectedDate = dateInput ? dateInput.value : ''; // Fòma YYYY-MM-DD

  try {
    // Nou kòmande tranzaksyon yo sou RTDB
    const txRef = ref(rtdb, 'transactions');
    const q = query(txRef, orderByChild('uid'), equalTo(currentUser.uid));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Pa gen okenn tranzaksyon ki anrejistre.</p>`;
      return;
    }

    let html = '';
    let transactions = [];

    snapshot.forEach((childSnap) => {
      const tx = childSnap.val();
      tx.firebaseId = childSnap.key;
      transactions.push(tx);
    });

    // Triye pou mete pi resan yo anwo (Descending)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filtraj selon tab la (Tout, Echanj, Retrè, Echwe)
    let filtered = transactions.filter(tx => {
      if (activeTab === 'echanj') return tx.type === 'echanj_minit';
      if (activeTab === 'retre') return tx.type === 'retrait' || tx.type === 'retre';
      if (activeTab === 'echwe') return tx.status === 'failed' || tx.status === 'echwe';
      return true; // 'tout'
    });

    // Filtraj selon dat si itilizatè a chwazi youn
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

    // Konstriksyon HTML pou chak tranzaksyon
    filtered.forEach(tx => {
      const dateFormatted = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';
      const statusColor = tx.status === 'pending' ? 'orange' : (tx.status === 'success' ? 'green' : 'red');
      
      html += `
        <div style="background: #fff; padding: 12px 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="text-transform: uppercase; color: #333;">${tx.rezo || tx.type}</strong><br>
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

    // Fonksyon global pou montre reçus lè w klike sou li a
    window.allUserTransactions = transactions;

  } catch (error) {
    console.error("Erè nan chajman istorik la:", error);
    targetContainer.innerHTML = `<p style="text-align:center; color: red; padding: 20px;">Erè nan chajman done yo.</p>`;
  }
}

/**
 * Afficher la modal du reçu de transaction
 * @param {Object} tx - Les données de la transaction
 */
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

/**
 * Fermer la modal du reçu
 */
export function closeReceipt() {
  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.add('hidden');
}

/**
 * Partager le reçu via WhatsApp
 */
export function shareReceipt() {
  const id = document.getElementById('rec-id')?.textContent || '';
  const amount = document.getElementById('rec-amount')?.textContent || '';
  const status = document.getElementById('rec-status')?.textContent || '';

  const text = `Reçu Echanj Plus\nID: ${id}\nMontant: ${amount}\nStatut: ${status}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  
  window.open(url, '_blank');
}

// Rendre les fonctions accessibles globalement pour les événements inline (onclick)
window.switchIstorik = switchIstorik;
window.filterByDate = filterByDate;
window.clearDateFilter = clearDateFilter;
window.closeReceipt = closeReceipt;
window.shareReceipt = shareReceipt;

// Otomatikman chaje istorik la depi paj la ouvè
document.addEventListener('DOMContentLoaded', () => {
  renderCurrentView();
});
