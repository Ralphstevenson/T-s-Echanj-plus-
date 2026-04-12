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

// --- A. NAVIGASYON PAJ (index.html) ---
window.showPage = function(pageId, element) {
    // 1. Kache tout seksyon ki ka kontni paj
    document.querySelectorAll('section, .tab-content, .page-content').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none'; // Sekirite anplis
    });

    // 2. Montre paj ki mande a
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
    }

    // 3. Jere klas "active" nan Bottom Nav ak Sidebar
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // 4. Fèmen sidebar otomatikman
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
};

window.toggleSidebar = function() {
    const sb = document.getElementById('sidebar');
    if(sb) sb.classList.toggle('active');
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
    if (!email || !pass) return alert("Tanpri antre email ak modpas ou!");
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Erè koneksyon: " + e.message);
    }
};

window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value;
    const sponsor = document.getElementById('sponsor-input').value;

    if (!name || !email || !pass) return alert("Ranpli tout bwat obligatwa yo!");

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const randomId = "ARS-" + Math.floor(1000 + Math.random() * 9000);
        
        await set(ref(db, 'users/' + cred.user.uid), {
            name, email, phone, arsId: randomId,
            balance: 0, commissions: 0, 
            sponsor: sponsor || "Okenn",
            nightMode: false,
            joinedAt: new Date().toISOString()
        });
        alert("Kont ou kreye! ID ou se: " + randomId);
    } catch (e) { alert("Erè enskripsyon: " + e.message); }
};

window.handleLogout = function() {
    if (confirm("Èske w vle dekonekte?")) {
        signOut(auth).then(() => location.reload());
    }
};

// --- C. MIZAJOU UI AN TAN REYÈL ---
window.updateUI = function(data) {
    if (!data) return;
    const balance = parseFloat(data.balance || 0).toFixed(2);

    // Ranpli enfòmasyon nan Header ak Sidebar
    if (document.getElementById('side-name')) document.getElementById('side-name').innerText = data.name;
    if (document.getElementById('side-email')) document.getElementById('side-email').innerText = data.email;
    if (document.getElementById('side-id')) document.getElementById('side-id').innerText = data.arsId || "ARS-XXXX";
    if (document.getElementById('header-quick-balance')) document.getElementById('header-quick-balance').innerText = `${balance} HTG`;
    
    // Balans nan Paj Akèy ak Retrè
    if (document.getElementById('user-balance')) document.getElementById('user-balance').innerText = balance;
    if (document.getElementById('display-balance')) document.getElementById('display-balance').innerText = `${balance} HTG`;
    if (document.getElementById('display-ars-id')) document.getElementById('display-ars-id').innerText = data.arsId || "---";

    // Paj Parennaj
    if (document.getElementById('komisyon-balans')) document.getElementById('komisyon-balans').innerText = parseFloat(data.commissions || 0).toFixed(2);
    if (document.getElementById('my-ref-code')) document.getElementById('my-ref-code').value = data.arsId || "";
    if (document.getElementById('my-sponsor')) document.getElementById('my-sponsor').innerText = data.sponsor || "Okenn";

    // Night Mode
    if (data.nightMode) {
        document.body.classList.add('dark-theme');
        if(document.getElementById('dark-mode-toggle')) document.getElementById('dark-mode-toggle').checked = true;
    } else {
        document.body.classList.remove('dark-theme');
    }
};

// --- D. AUTH OBSERVER (SÈVO A) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        // Moun nan konekte
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
        
        // Asire n montre paj Akèy la premye fwa
        window.showPage('paj-akey');

        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if (data) window.updateUI(data);
        });
    } else {
        // Moun nan dekonekte
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

// Listener pou Night Mode
document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const user = auth.currentUser;
    if (user) update(ref(db, 'users/' + user.uid), { nightMode: e.target.checked });
});
          
