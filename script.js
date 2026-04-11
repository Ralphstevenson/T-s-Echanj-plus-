import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- A. JESYON NAVIGASYON (NAVBAR) ---
window.showPage = function(pageId, element) {
    document.querySelectorAll('section, .page-content, .auth-container').forEach(p => {
        p.classList.add('hidden');
    });

    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
};

// --- B. JESYON AUTH (LOGIN & SIGNUP) ---
window.toggleAuth = function(type) {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    if (type === 'signup') {
        loginSec.classList.add('hidden');
        signupSec.classList.remove('hidden');
    } else {
        loginSec.classList.remove('hidden');
        signupSec.classList.add('hidden');
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout bwat yo!");
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const sponsor = document.getElementById('sponsor-input').value;

    if (!name || !email || !pass) return alert("Non, Email ak Modpas obligatwa!");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        const randomId = "ARS-" + Math.floor(1000 + Math.random() * 9000);

        await set(ref(db, 'users/' + uid), {
            name: name,
            phone: phone,
            email: email,
            arsId: randomId,
            balance: 0,
            commissions: 0,
            sponsor: sponsor || "Okenn",
            joinedAt: new Date().toISOString()
        });
        alert("Kont ou kreye! ID: " + randomId);
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// --- C. PATI 2: MIZAJOU UI (REAL-TIME) ---
window.updateUI = function(data) {
    if (!data) return;

    // Done Sekirite (Anti-Undefined)
    const name = data.name || "Itilizatè";
    const email = data.email || "---";
    const arsId = data.arsId || "ARS-XXXX";
    const balance = parseFloat(data.balance || 0).toFixed(2);
    const comms = parseFloat(data.commissions || 0).toFixed(2);

    // 1. Sidebar (Non, Email, ID nan tèt la)
    if (document.getElementById('side-name')) document.getElementById('side-name').innerText = name;
    if (document.getElementById('side-email')) document.getElementById('side-email').innerText = email;
    if (document.getElementById('side-id')) document.getElementById('side-id').innerText = arsId;

    // 2. Balans (Mizajou tout kote ki gen klas sa yo)
    document.querySelectorAll('#display-balance, .user-balance').forEach(el => {
        el.innerText = `${balance} HTG`;
    });

    // 3. Paj Parennaj (Komisyon ak ARS ID)
    if (document.getElementById('komisyon-balans')) document.getElementById('komisyon-balans').innerText = comms;
    if (document.getElementById('display-ars-id')) document.getElementById('display-ars-id').innerText = arsId;
};

// --- D. AUTH OBSERVER & LOAD DATA ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    if (user) {
        if(authPage) authPage.classList.add('hidden');
        window.showPage('paj-akey');
        loadUserData(user.uid);
    } else {
        if(authPage) authPage.classList.remove('hidden');
    }
});

function loadUserData(uid) {
    onValue(ref(db, 'users/' + uid), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.updateUI(data); // Rele updateUI otomatikman
            
            if(!sessionStorage.getItem('welcomed')) {
                console.log("Byenveni, " + data.name);
                sessionStorage.setItem('welcomed', 'true');
            }
        }
    });
      }
        
