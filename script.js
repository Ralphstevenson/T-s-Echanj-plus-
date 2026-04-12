import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Config
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

// --- A. NAVIGASYON (GWO MODIL) ---
window.showPage = function(pageId, element) {
    document.querySelectorAll('section, .page-content').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    document.getElementById('sidebar')?.classList.remove('active');
};

window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('active');
};

// --- B. MIZAJOU UI & DONE GLOBAL ---
window.updateUI = function(data) {
    if (!data) return;
    
    // Nou estoke done yo isit la pou lòt JS yo (echanj, retre, elatriye) ka jwenn yo
    window.userData = data;

    const balance = parseFloat(data.balance || 0).toFixed(2);

    // Sekirite: Tcheke si eleman yo egziste anvan nou chanje yo
    const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
    
    setTxt('header-quick-balance', `${balance} HTG`);
    setTxt('user-balance', balance);
    setTxt('display-balance', `${balance} HTG`);
    setTxt('side-name', data.name);
    setTxt('side-id', data.arsId);
    setTxt('komisyon-balans', parseFloat(data.commissions || 0).toFixed(2));

    // Night Mode (Lojik senp)
    if (data.nightMode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
};

// --- C. AUTH OBSERVER (SÈVO A) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage?.classList.add('hidden');
        homePage?.classList.remove('hidden');
        
        // Koute done yo an tan reyèl
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                window.updateUI(data);
                // Si lòt JS yo gen fonksyon pou resevwa done yo, rele yo isit la
                if(typeof window.syncEchanj === 'function') window.syncEchanj(data);
            }
        });
    } else {
        authPage?.classList.remove('hidden');
        homePage?.classList.add('hidden');
    }
});

// --- D. FONKSYON AUTH (Senp) ---
window.handleLogout = function() {
    if (confirm("Èske w vle dekonekte?")) signOut(auth).then(() => location.reload());
};

window.toggleAuth = function(type) {
    document.getElementById('login-section')?.classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section')?.classList.toggle('hidden', type === 'login');
};

// Pwofite mete klik dark mode la isit la si se nan script sa a li ye
document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const user = auth.currentUser;
    if (user) update(ref(db, 'users/' + user.uid), { nightMode: e.target.checked });
});
      
