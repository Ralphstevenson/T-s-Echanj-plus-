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

// --- FONKSYON UTILITÈ ---
function formatDateTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// --- A. JESYON NAVIGASYON (PAJ YO) ---
window.showPage = function(pageId, element) {
    document.querySelectorAll('section, .page-content').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
};

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('active');
};

// --- B. JESYON AUTH (LOGIN / SIGNUP) ---
window.toggleAuth = function(type) {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    
    if (type === 'signup') {
        loginSec.classList.add('hidden');
        signupSec.classList.remove('hidden');
    } else {
        signupSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout bwat yo!");
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Erè: " + e.message);
    }
};

window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value;
    const sponsor = document.getElementById('sponsor-input').value;

    if (!name || !email || !pass) return alert("Ranpli tout bwat yo!");
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
    if (confirm("Èske w vle dekonekte?")) signOut(auth).then(() => location.reload());
};

// --- C. SISTÈM NOTIFIKASYON AVANSE ---
window.toggleNotifPanel = function() {
    const panel = document.getElementById('notif-panel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) loadNotifications();
    }
};

window.activeNotifTab = 'koneksyon';

window.switchNotifTab = function(tab) {
    window.activeNotifTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab === 'koneksyon' ? 'koneksyon' : 'transak'}`).classList.add('active');
    loadNotifications(); 
};

function loadNotifications() {
    const content = document.getElementById('notif-content');
    if (!content) return;
    const user = auth.currentUser;
    if (!user) return;

    onValue(ref(db, `users/${user.uid}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const kounye a = formatDateTime();
        if (window.activeNotifTab === 'koneksyon') {
            const joinDate = data.joinedAt ? formatDateTime(data.joinedAt) : "---";
            content.innerHTML = `
                <div class="notif-item">
                    <i class="fa fa-user-shield" style="color: #109121;"></i>
                    <div class="notif-text">
                        <p><b>Kont kreye ak siksè</b></p>
                        <small><i class="fa fa-calendar-alt"></i> ${joinDate}</small>
                    </div>
                </div>
                <div class="notif-item">
                    <i class="fa fa-sign-in-alt" style="color: #1a73e8;"></i>
                    <div class="notif-text">
                        <p><b>Dènye koneksyon</b></p>
                        <small><i class="fa fa-clock"></i> ${kounye a}</small>
                    </div>
                </div>`;
        } else {
            content.innerHTML = `
                <div class="notif-item success">
                    <i class="fa fa-check-circle" style="color: #28a745;"></i>
                    <div class="notif-text">
                        <p><b>Byenveni!</b></p>
                        <p>Sistèm nan pare pou echanj.</p>
                        <small><i class="fa fa-calendar-check"></i> ${kounye a}</small>
                    </div>
                </div>`;
        }
    });
}

// --- D. MIZAJOU UI AN TAN REYÈL ---
window.updateUI = function(data) {
    if (!data) return;
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Header & Sidebar
    if (document.getElementById('header-quick-balance')) document.getElementById('header-quick-balance').innerText = `${balance} HTG`;
    if (document.getElementById('side-name')) document.getElementById('side-name').innerText = data.name || "Itilizatè";
    if (document.getElementById('side-id')) document.getElementById('side-id').innerText = data.arsId || "ARS-XXXX";
    
    // Dashboard & Others
    if (document.getElementById('user-balance')) document.getElementById('user-balance').innerText = balance;
    if (document.getElementById('display-balance')) document.getElementById('display-balance').innerText = `${balance} HTG`;
    if (document.getElementById('komisyon-balans')) document.getElementById('komisyon-balans').innerText = parseFloat(data.commissions || 0).toFixed(2);
    if (document.getElementById('my-ref-code')) document.getElementById('my-ref-code').value = data.arsId || "";

    // Night Mode
    if (data.nightMode) {
        document.body.classList.add('dark-theme');
        const tg = document.getElementById('dark-mode-toggle');
        if(tg) tg.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
    }
};

// --- E. SÈVO A (AUTH OBSERVER) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
        
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if (data) window.updateUI(data);
        });
    } else {
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

// Night Mode Toggle Listener
document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const user = auth.currentUser;
    if (user) update(ref(db, 'users/' + user.uid), { nightMode: e.target.checked });
});

// Inisyalizasyon klik klòch
document.addEventListener('DOMContentLoaded', () => {
    const bell = document.querySelector('.notif-wrapper') || document.querySelector('.fa-bell')?.parentElement;
    if (bell) bell.onclick = window.toggleNotifPanel;
});
  
