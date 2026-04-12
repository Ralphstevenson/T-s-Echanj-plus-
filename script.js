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
const auth = getAuth(app);
const db = getDatabase(app);

// --- FONKSYON POU FÒMATE DAT (KREYÒL) ---
function formatDateTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- A. JESYON NAVIGASYON (PAJ YO) ---
window.showPage = function(pageId, element) {
    // Kache tout seksyon yo
    document.querySelectorAll('section, .page-content, .tab-content').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none';
    });

    // Montre paj ki klike a
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
    }

    // Aktive bouton nan Navbar anba a
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fèmen sidebar otomatikman si l te louvri
    document.getElementById('sidebar')?.classList.remove('active');
};

window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('active');
};

// --- B. JESYON AUTH (LOGIN / SIGNUP) ---
window.toggleAuth = function(type) {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    
    if (type === 'signup') {
        loginSec?.classList.add('hidden');
        signupSec?.classList.remove('hidden');
    } else {
        signupSec?.classList.add('hidden');
        loginSec?.classList.remove('hidden');
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Antre enfòmasyon ou yo!");
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Erè: " + e.message); }
};

window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value;
    const sponsor = document.getElementById('sponsor-input').value;

    if (!name || !email || !pass) return alert("Ranpli bwat yo!");
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const randomId = "ARS-" + Math.floor(1000 + Math.random() * 9000);
        await set(ref(db, 'users/' + cred.user.uid), {
            name, email, phone, arsId: randomId,
            balance: 0, commissions: 0, 
            sponsor: sponsor || "Okenn",
            nightMode: false, joinedAt: new Date().toISOString()
        });
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogout = function() {
    if (confirm("Dekonekte?")) signOut(auth).then(() => location.reload());
};

// --- C. KLÒCH NOTIFIKASYON AK DAT/LÈ ---
window.toggleNotifPanel = function() {
    document.getElementById('notif-panel')?.classList.toggle('active');
};

window.activeNotifTab = 'koneksyon';
window.switchNotifTab = function(tab) {
    window.activeNotifTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab === 'koneksyon' ? 'koneksyon' : 'transak'}`)?.classList.add('active');
    loadNotifications();
};

function loadNotifications() {
    const content = document.getElementById('notif-content');
    const user = auth.currentUser;
    if (!content || !user) return;

    onValue(ref(db, `users/${user.uid}`), (snapshot) => {
        const data = snapshot.val();
        const kounye a = formatDateTime();
        if (window.activeNotifTab === 'koneksyon') {
            const joinDate = data?.joinedAt ? formatDateTime(data.joinedAt) : "---";
            content.innerHTML = `
                <div class="notif-item">
                    <i class="fa fa-user-shield"></i>
                    <div class="notif-text">
                        <p>Kont kreye ak siksè</p>
                        <small><i class="fa fa-calendar-alt"></i> ${joinDate}</small>
                    </div>
                </div>
                <div class="notif-item">
                    <i class="fa fa-clock"></i>
                    <div class="notif-text">
                        <p>Koneksyon sekirize</p>
                        <small>${kounye a}</small>
                    </div>
                </div>`;
        } else {
            content.innerHTML = `<p class="empty-msg">Pa gen istorik tranzaksyon pou kounye a.</p>`;
        }
    });
}

// --- D. MIZAJOU UI (BALANCE, DONE PÈSONÈL) ---
window.updateUI = function(data) {
    if (!data) return;
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Tout IDs ki soti nan HTML ou a
    const elements = {
        'header-quick-balance': `${balance} HTG`,
        'user-balance': balance,
        'display-balance': `${balance} HTG`,
        'side-name': data.name,
        'side-id': data.arsId,
        'display-ars-id': data.arsId,
        'komisyon-balans': parseFloat(data.commissions || 0).toFixed(2),
        'my-ref-code': data.arsId
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'INPUT') el.value = elements[id];
            else el.innerText = elements[id];
        }
    }

    // Night Mode
    if (data.nightMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
};

// --- E. SÈVO A (AUTH OBSERVER) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage?.classList.add('hidden');
        homePage?.classList.remove('hidden');
        window.showPage('paj-akey'); // Louvri paj akèy pa defo
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            window.updateUI(snapshot.val());
        });
    } else {
        authPage?.classList.remove('hidden');
        homePage?.classList.add('hidden');
    }
});

// Listener pou Night Mode nan Settings
document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const user = auth.currentUser;
    if (user) update(ref(db, 'users/' + user.uid), { nightMode: e.target.checked });
});

// Konekte klòch la lè paj la fin chaje
document.addEventListener('DOMContentLoaded', () => {
    const bell = document.querySelector('.notif-wrapper') || document.querySelector('.fa-bell');
    if (bell) bell.onclick = window.toggleNotifPanel;
});
      
