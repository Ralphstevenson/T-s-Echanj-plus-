import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Konfigirasyon Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Sere done yo pou tout lòt JS ka wè yo
export let appData = { user: null, settings: null };

// --- A. LOJIK NIGHT MODE (PREMYE BAGAY KI CHAJE) ---
// Pou evite flach blan si moun nan te nan Night Mode
(function applyTheme() {
    const isNight = localStorage.getItem('nightMode') === 'true';
    if (isNight) document.body.classList.add('dark-theme');
})();

// --- B. AUTH OBSERVER & ROUTING ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        startSystem(user.uid); // Koneksyon ak tout lòt pati yo
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
    } else {
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

// --- C. SISTÈM NÈ (KONEKSYON DONE) ---
function startSystem(uid) {
    // 1. Koute Itilizatè a (Balans, Komisyon, Gmail Notif)
    onValue(ref(db, `users/${uid}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appData.user = data;
            syncUI(data);
            checkEmailNotification(data); // Lojik Gmail la
        }
    });

    // 2. Koute Settings (To 16.5%)
    onValue(ref(db, `settings`), (snapshot) => {
        appData.settings = snapshot.val();
    });
}

// --- D. BRIDGE PARENNAJ (AKÒ TRANSFÈ 100 HTG) ---
// Lojik sa a konekte script.js ak parenn.js
window.executeReferralTransfer = async function() {
    const commission = appData.user.commissions || 0;
    
    if (commission < 100) {
        alert("Ou dwe gen omwen 100 HTG pou w transfere.");
        return;
    }

    try {
        const newBalance = (appData.user.balance || 0) + commission;
        await update(ref(db, `users/${auth.currentUser.uid}`), {
            balance: newBalance,
            commissions: 0 // Reset komisyon apre transfè
        });
        alert("Komisyon ou transfere nan Balans Prensipal!");
    } catch (e) {
        console.error("Transfè echwe", e);
    }
};

// --- E. LOJIK GMAIL NOTIFIKASYON ---
function checkEmailNotification(data) {
    // Si itilizatè a aktive "Notifikasyon Gmail" nan Paramèt
    if (data.gmailNotifEnabled) {
        // Isit la nou pral ploge EmailJS oswa Cloud Function
        console.log("Sistèm Gmail pare pou voye alèt bay:", data.email);
    }
}

// --- F. SYNC UI (ID KI SOTI NAN ANSYEN KÒD LA) ---
function syncUI(data) {
    const elements = {
        'display-balance': (data.balance || 0).toFixed(2) + " HTG",
        'komisyon-balans': (data.commissions || 0).toFixed(2),
        'sett-name': data.name || "Itilizatè",
        'sett-email': data.email || "Pa gen imèl",
        'side-id': data.arsId || 'ARS-XXXX'
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }
}
