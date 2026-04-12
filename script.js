import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Konfigirasyon
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
export const auth = getAuth(app);
export const db = getDatabase(app);

// --- A. NAVIGASYON PAJ ---
window.showPage = function(pageId, element) {
    document.querySelectorAll('section, .tab-content, .page-content').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none';
    });

    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
    }

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- B. MIZAJOU BALANS (SENP) ---
function updateBalanceUI(data) {
    if (!data) return;
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Header (ti balans anlè a)
    const headerBal = document.getElementById('header-quick-balance');
    if (headerBal) headerBal.innerText = `${balance} HTG`;

    // Dashboard (gwo balans nan mitan an)
    const mainBal = document.getElementById('user-balance');
    if (mainBal) mainBal.innerText = balance;
}

// --- C. AUTH OBSERVER ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
        
        window.showPage('paj-akey');

        // Koute balans lan an tan reyèl
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            updateBalanceUI(data);
            
            // Si w gen lòt fichye ki bezwen done sa yo, yo ka koute l tou
            if (window.syncOtherModules) window.syncOtherModules(data);
        });
    } else {
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('active');
};
