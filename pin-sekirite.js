import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();
let currentUser = null;

// Tcheke Firebase Auth
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Element DOM yo
const modal = document.getElementById('pin-modal-overlay');
const openBtn = document.getElementById('open-pin-modal-btn');
const sidebarPinBtn = document.getElementById('open-pin-sidebar-btn');
const closeBtn = document.getElementById('close-pin-modal');
const actionsDiv = document.querySelector('.pin-actions');
const createForm = document.getElementById('create-pin-form');
const changeForm = document.getElementById('change-pin-form');
const statusMsg = document.getElementById('modal-pin-status');

// Fonksyon pou ouvri modal la epi chwazi ki View pou afiche
window.openPinModal = function(defaultMode = 'actions') {
  if (typeof window.toggleSidebar === 'function') {
    window.toggleSidebar();
  }
  
  resetModalViews();
  
  if (defaultMode === 'create') {
    if (actionsDiv) actionsDiv.style.display = 'none';
    createForm?.classList.remove('hidden');
  } else if (defaultMode === 'change') {
    if (actionsDiv) actionsDiv.style.display = 'none';
    changeForm?.classList.remove('hidden');
  }

  if (modal) {
    modal.classList.add('show');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

// Listeners
sidebarPinBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  window.openPinModal('actions');
});

openBtn?.addEventListener('click', () => {
  window.openPinModal('actions');
});

closeBtn?.addEventListener('click', () => {
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
});

document.getElementById('btn-show-create')?.addEventListener('click', () => {
  if (actionsDiv) actionsDiv.style.display = 'none';
  createForm?.classList.remove('hidden');
});

document.getElementById('btn-show-change')?.addEventListener('click', () => {
  if (actionsDiv) actionsDiv.style.display = 'none';
  changeForm?.classList.remove('hidden');
});

document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', resetModalViews);
});

function resetModalViews() {
  if (actionsDiv) actionsDiv.style.display = 'flex';
  createForm?.classList.add('hidden');
  changeForm?.classList.add('hidden');
  if (statusMsg) {
    statusMsg.className = 'status-msg';
    statusMsg.style.display = 'none';
  }
  createForm?.reset();
  changeForm?.reset();
}

// Soumèt Formulaire KREYE PIN
createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = document.getElementById('create-pin-input').value.trim();
  const confirmPin = document.getElementById('confirm-create-pin-input').value.trim();

  if (pin !== confirmPin) {
    showMsg('2 PIN yo pa menm!', 'error');
    return;
  }

  if (pin.length !== 4) {
    showMsg('PIN lan dwe gen 4 chif!', 'error');
    return;
  }

  savePinToFirebase(pin, 'PIN ou an kreye ak siksè!');
});

// Soumèt Formulaire CHANJE PIN
changeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPin = document.getElementById('old-pin-input').value.trim();
  const newPin = document.getElementById('new-pin-input').value.trim();

  if (!currentUser) return;

  const userRef = ref(db, 'users/' + currentUser.uid);
  const snapshot = await get(userRef);
  const userData = snapshot.val();

  if (userData && userData.transactionPin && String(userData.transactionPin) !== oldPin) {
    showMsg('Ansyen PIN la pa bon!', 'error');
    return;
  }

  savePinToFirebase(newPin, 'PIN ou an chanje ak siksè!');
});

async function savePinToFirebase(pinValue, successText) {
  if (!currentUser) {
    showMsg('Ou dwe konekte toujou.', 'error');
    return;
  }

  try {
    const userRef = ref(db, 'users/' + currentUser.uid);
    await update(userRef, { transactionPin: String(pinValue) });
    
    // Mete ajou navigasyon an nan rezo a
    if (window.userAppData) {
      window.userAppData.hasPin = true;
      window.userAppData.correctPin = String(pinValue);
    }

    showMsg(successText, 'success');
    setTimeout(() => {
      resetModalViews();
      if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }, 1500);
  } catch (err) {
    showMsg('Gen yon erè ki rive, tanpri reyezi.', 'error');
  }
}

function showMsg(text, type) {
  if (statusMsg) {
    statusMsg.textContent = text;
    statusMsg.className = `status-msg ${type}`;
    statusMsg.style.display = 'block';
  }
}
