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
const closeBtn = document.getElementById('close-pin-modal');
const actionsDiv = document.querySelector('.pin-actions');
const createForm = document.getElementById('create-pin-form');
const changeForm = document.getElementById('change-pin-form');
const statusMsg = document.getElementById('modal-pin-status');

// Louvri Modal
openBtn?.addEventListener('click', () => {
  resetModalViews();
  modal.classList.add('show');
});

// Fèmen Modal
closeBtn?.addEventListener('click', () => {
  modal.classList.remove('show');
});

// Bouton Navigasyon nan modal la
document.getElementById('btn-show-create')?.addEventListener('click', () => {
  actionsDiv.style.display = 'none';
  createForm.classList.remove('hidden');
});

document.getElementById('btn-show-change')?.addEventListener('click', () => {
  actionsDiv.style.display = 'none';
  changeForm.classList.remove('hidden');
});

document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', resetModalViews);
});

function resetModalViews() {
  actionsDiv.style.display = 'flex';
  createForm.classList.add('hidden');
  changeForm.classList.add('hidden');
  statusMsg.className = 'status-msg';
  statusMsg.style.display = 'none';
  createForm.reset();
  changeForm.reset();
}

// Soumèt Formulaire KREYE PIN
createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = document.getElementById('create-pin-input').value;
  const confirmPin = document.getElementById('confirm-create-pin-input').value;

  if (pin !== confirmPin) {
    showMsg('2 PIN yo pa menm!', 'error');
    return;
  }

  savePinToFirebase(pin, 'PIN ou an kreye ak siksè!');
});

// Soumèt Formulaire CHANJE PIN
changeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPin = document.getElementById('old-pin-input').value;
  const newPin = document.getElementById('new-pin-input').value;

  if (!currentUser) return;

  // Verifye si ansyen PIN lan bon nan Firebase anvan
  const userRef = ref(db, 'users/' + currentUser.uid);
  const snapshot = await get(userRef);
  const userData = snapshot.val();

  if (userData && userData.transactionPin && userData.transactionPin !== oldPin) {
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
    await update(userRef, { transactionPin: pinValue });
    showMsg(successText, 'success');
    setTimeout(() => {
      resetModalViews();
      modal.classList.remove('show');
    }, 1500);
  } catch (err) {
    showMsg('Gen yon erè ki rive, reyezi berèy.', 'error');
  }
}

function showMsg(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = `status-msg ${type}`;
}
￼Enter
