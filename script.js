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

// --- FONKSYON POU DAT (FÒMA KREYÒL) ---
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

// --- A. JESYON NAVIGASYON ---
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

// --- B. SISTÈM NOTIFIKASYON AVANSE (AVÈK DAT AK LÈ) ---
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
    const btnId = tab === 'koneksyon' ? 'tab-koneksyon' : 'tab-transak';
    const btnEl = document.getElementById(btnId);
    if (btnEl) btnEl.classList.add('active');
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
                        <p>Byenveni nan Echanj Plus.</p>
                        <small><i class="fa fa-calendar-alt"></i> ${joinDate}</small>
                    </div>
                </div>
                <div class="notif-item">
                    <i class="fa fa-sign-in-alt" style="color: #1a73e8;"></i>
                    <div class="notif-text">
                        <p><b>Dènye koneksyon</b></p>
                        <p>Sesyon ou an sekirize.</p>
                        <small><i class="fa fa-clock"></i> Jodi a, ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</small>
                    </div>
                </div>`;
        } else {
            content.innerHTML = `
                <div class="notif-item success">
                    <i class="fa fa-check-circle" style="color: #28a745;"></i>
                    <div class="notif-text">
                        <p><b>Sistèm ou an aktif</b></p>
                        <p>W ap resevwa detay tranzaksyon ou yo isit la.</p>
                        <small><i class="fa fa-calendar-check"></i> ${kounye a}</small>
                    </div>
                </div>
                <p class="empty-msg" style="font-size: 11px; margin-top:10px;">Istorik tranzaksyon yo ap parèt otomatikman isit la apre validasyon.</p>`;
        }
    });
}

// --- C. MIZAJOU UI AN TAN REYÈL ---
window.updateUI = function(data) {
    if (!data) return;

    const name = data.name || "Itilizatè";
    const email = data.email || "---";
    const arsId = data.arsId || "ARS-XXXX";
    const balance = parseFloat(data.balance || 0).toFixed(2);
    const comms = parseFloat(data.commissions || 0).toFixed(2);

    // Sidebar & Header
    if (document.getElementById('side-name')) document.getElementById('side-name').innerText = name;
    if (document.getElementById('side-email')) document.getElementById('side-email').innerText = email;
    if (document.getElementById('side-id')) document.getElementById('side-id').innerText = arsId;
    if (document.getElementById('sett-name')) document.getElementById('sett-name').innerText = name;
    if (document.getElementById('sett-email')) document.getElementById('sett-email').innerText = email;
    if (document.getElementById('header-quick-balance')) document.getElementById('header-quick-balance').innerText = `${balance} HTG`;

    // Balans Dashboard & Retrè
    if (document.getElementById('user-balance')) document.getElementById('user-balance').innerText = balance;
    if (document.getElementById('display-balance')) document.getElementById('display-balance').innerText = `${balance} HTG`;

    // Parennaj
    if (document.getElementById('komisyon-balans')) document.getElementById('komisyon-balans').innerText = comms;
    if (document.getElementById('display-ars-id')) document.getElementById('display-ars-id').innerText = arsId;
    if (document.getElementById('my-ref-code')) document.getElementById('my-ref-code').value = arsId;
    if (document.getElementById('my-sponsor')) document.getElementById('my-sponsor').innerText = data.sponsor || "Okenn";

    // Night Mode
    const toggle = document.getElementById('dark-mode-toggle');
    if (data.nightMode) {
        document.body.classList.add('dark-theme');
        if(toggle) toggle.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        if(toggle) toggle.checked = false;
    }
};

// --- D. PARAMÈT & AUTH ---
document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const user = auth.currentUser;
    if (user) update(ref(db, 'users/' + user.uid), { nightMode: e.target.checked });
});

window.handleLogout = function() {
    if (confirm("Èske w vle dekonekte?")) {
        signOut(auth).then(() => location.reload());
    }
};

window.toggleAuth = function(type) {
    document.getElementById('login-section').classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', type === 'login');
};

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout bwat yo!");
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Erè: " + e.message); }
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

// --- E. SÈVO A (AUTH OBSERVER) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if (data) window.updateUI(data);
        });
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

// Konekte klòch la ak lòt eleman apre paj la chaje
document.addEventListener('DOMContentLoaded', () => {
    const bell = document.querySelector('.notif-wrapper');
    if (bell) bell.onclick = window.toggleNotifPanel;
});
  
