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
    // Sécurité au cas où 'this' ne serait pas transmis
    const defaultBtn = document.querySelector(`.tab-btn-ist[onclick*="'${targetId}'"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  // 3. Masquer tous les contenus
  document.querySelectorAll('.ist-content').forEach(div => {
    div.classList.add('hidden');
  });

  // 4. Afficher le contenu de l'onglet sélectionné
  const targetContainer = document.getElementById(`list-${targetId}`);
  if (targetContainer) {
    targetContainer.classList.remove('hidden');
  }

  // 5. Appliquer le filtre et rafraîchir l'affichage
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
 * Mettre à jour l'affichage selon l'onglet actif et le filtre de date
 */
function renderCurrentView() {
  const dateInput = document.getElementById('filter-date-input');
  const selectedDate = dateInput ? dateInput.value : '';

  // Logique d'affichage à adapter avec vos données réelles
  // Exemple: fetchTransactions(activeTab, selectedDate);
}

/**
 * Afficher la modal du reçu de transaction
 * @param {Object} tx - Les données de la transaction
 */
export function showReceipt(tx) {
  if (!tx) return;

  document.getElementById('rec-id').textContent = tx.id || '---';
  document.getElementById('rec-status').textContent = tx.status || '---';
  document.getElementById('rec-amount').textContent = tx.amount ? `${tx.amount} HTG` : '---';
  document.getElementById('rec-method').textContent = tx.method || '---';
  document.getElementById('rec-phone').textContent = tx.phone || '---';
  document.getElementById('rec-date').textContent = tx.date || '---';

  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.remove('hidden');
}

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
  const id = document.getElementById('rec-id').textContent;
  const amount = document.getElementById('rec-amount').textContent;
  const status = document.getElementById('rec-status').textContent;

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
