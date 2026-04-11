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
// Fonksyon sa a kache paj yo epi montre sa w klike a
window.showPage = function(pageId, element) {
    // 1. Kache tout seksyon/paj ki gen klas "page-content" oswa "section"
    document.querySelectorAll('section, .page-content, .auth-container').forEach(p => {
        p.classList.add('hidden');
    });

    // 2. Montre paj ki mande a
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // 3. Jere klas "active" nan navbar la
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
};

// --- B. JESYON AUTH (LOGIN & SIGNUP) ---

// 1. Chanje ant fòm Login ak Signup
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

// 2. Lojik Koneksyon (Login)
window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) return alert("Ranpli tout bwat yo!");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        console.log("Byenveni!");
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// 3. Lojik Enskripsyon (Signup) ak ARS ID
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
        const randomId = "ARS-" + Math.floor(1000 + Math.random() * 9000); // Jenere ID

        // Kreye pwofil nan Database
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

        alert("Kont ou kreye ak siksè! ID ou se: " + randomId);
    } catch (error) {
        alert("Erè nan enskripsyon: " + error.message);
    }
};

// --- C. AUTH OBSERVER (SÈVO A) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('paj-akey'); // Paj akèy ou a

    if (user) {
        // Si moun nan konekte, kache auth-page epi montre dashboard
        if(authPage) authPage.classList.add('hidden');
        window.showPage('paj-akey'); // Paj default apre login
        loadUserData(user.uid);
    } else {
        // Si moun nan dekonekte, montre paj login nan
        if(authPage) authPage.classList.remove('hidden');
    }
});

function loadUserData(uid) {
    onValue(ref(db, 'users/' + uid), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Isit la nou pral mete fonksyon updateUI a pita
            console.log("Done itilizatè chaje:", data.name);
        }
    });
          }
      
