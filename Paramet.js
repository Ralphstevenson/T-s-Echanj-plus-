import { db, auth, userPinGlobal } from './script.js';
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. KONFIGIRASYON VÈSYON APP LA
const APP_VERSION = "v3.2.5";
const vTag = document.querySelector('.version-tag');
if (vTag) vTag.innerText = APP_VERSION;

// 2. NAVIGASYON AK MODAL
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.closeSettings = () => window.showPage('home-page');

// 3. JESYON PIN (KREYE OUBYEN CHANJE)
window.openPinManager = () => {
    const pinTitle = document.getElementById('pin-title');
    const pinMsg = document.getElementById('pin-msg');
    const pinInput = document.getElementById('pin-input');
    
    pinInput.value = ""; // Netwaye bwat la

    if (userPinGlobal) {
        pinTitle.innerText = "Chanje PIN Sekirite";
        pinMsg.innerText = "Antre yon nouvo PIN 4 chif pou ranplase ansyen an.";
    } else {
        pinTitle.innerText = "Kreye PIN Sekirite";
        pinMsg.innerText = "Ou poko gen yon PIN. Antre 4 chif pou sekirize tranzaksyon w yo.";
    }
    window.openModal('modal-pin');
};

// Sove PIN nan nan branch: users/uid/pin
document.getElementById('btn-save-pin').onclick = async () => {
    const pinVal = document.getElementById('pin-input').value;

    if (pinVal.length !== 4) {
        alert("PIN nan dwe gen 4 chif egzakteman.");
        return;
    }

    try {
        const userRef = ref(db, 'users/' + auth.currentUser.uid);
        await update(userRef, { pin: pinVal });
        alert("PIN ou sove ak siksè!");
        window.closeModal('modal-pin');
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// 4. REYAJISTE MODPAS (GMAIL)
document.getElementById('btn-send-reset-link').onclick = async () => {
    const email = auth.currentUser.email;
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Yon lien reyajisman voye nan Gmail ou.");
        window.closeModal('modal-password');
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// 5. NOTIFIKASYON GMAIL (KREYE BRANCH NAN FIREBASE)
const gmailToggle = document.getElementById('gmail-notif-toggle');

// Koute si opsyon a deja aktive nan Firebase pou n mete switch la nan bon pozisyon
auth.onAuthStateChanged((user) => {
    if (user) {
        const notifRef = ref(db, `users/${user.uid}/settings/gmail_notif`);
        onValue(notifRef, (snapshot) => {
            if (gmailToggle) gmailToggle.checked = snapshot.val() || false;
        });
    }
});

if (gmailToggle) {
    gmailToggle.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        try {
            const settingsRef = ref(db, `users/${auth.currentUser.uid}/settings`);
            await update(settingsRef, { gmail_notif: isEnabled });
        } catch (error) {
            console.error("Erè nan sove preferans:", error);
        }
    });
}

// 6. DASH NIGHT (DARK MODE) - SYNC AK SWITCH LA
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    // Tcheke si body a gen deja klas la pou n mete switch la an liy
    darkModeToggle.checked = document.body.classList.contains('dark-mode');
    
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
    });
}

console.log(`Echanj Plus Settings | ${APP_VERSION} aktive.`);
              
