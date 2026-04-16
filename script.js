// 1. Enpòte SDK Firebase yo
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, onValue, get, set, update, query, orderByChild, equalTo, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. Konfigirasyon Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10",
  measurementId: "G-J1BQRF32ZW"
};

// 3. Inisyalizasyon
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// 4. State Global
export let CurrentUser = null;
export let userPinGlobal = null;

// 5. Fonksyon Navigasyon
window.showPage = (pageId, element) => {
    document.querySelectorAll('.page-content, section, .tab-content').forEach(p => {
        p.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');

    if (pageId === 'paj-trans' && typeof window.aficheTranzaksyon === 'function') {
        window.aficheTranzaksyon('tout');
    }

    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (element) element.classList.add('active');
};

// 6. Obsèvatè Koneksyon
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        CurrentUser = user;
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
        listenToUserData(user.uid);
    } else {
        CurrentUser = null;
        userPinGlobal = null;
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

// 7. Koute done itilizatè an tan reyèl
function listenToUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateGlobalUI(data);
        }
    });
}

// 8. Mete UI a ajou
function updateGlobalUI(data) {
    userPinGlobal = data.pin ? String(data.pin) : null;
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Balans
    ['user-balance', 'header-quick-balance', 'display-balance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = (id === 'user-balance') ? balance : balance + " HTG";
    });

    // Profil & Header
    const sideName = document.getElementById('side-name');
    const sideId = document.getElementById('side-id');
    const displayArsId = document.getElementById('display-ars-id');
    const greeting = document.getElementById('header-user-greeting');

    if (sideName) sideName.innerText = data.full_name || "Itilizatè";
    if (sideId) sideId.innerText = data.ars_id || "ARS-ID";
    if (displayArsId) displayArsId.innerText = data.ars_id || "---";
    if (greeting) {
        const pwoon = data.full_name ? data.full_name.split(' ')[0] : "Itilizatè";
        greeting.innerText = "Bonjou, " + pwoon;
    }

    // Paramèt (Settings)
    const settName = document.getElementById('sett-name');
    const settEmail = document.getElementById('sett-email');
    const settAvatar = document.getElementById('user-avatar-settings');

    if (settName) settName.innerText = data.full_name || "Enfòmasyon...";
    if (settEmail && auth.currentUser) settEmail.innerText = auth.currentUser.email;
    if (settAvatar && data.full_name) {
        settAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=109121&color=fff`;
    }
}

// --- 9. LOGIK AUTH (LOGIN & SIGNUP) ---

window.toggleAuth = (mode) => {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    if (mode === 'signup') {
        loginSec.classList.add('hidden');
        signupSec.classList.remove('hidden');
    } else {
        signupSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
    }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!email || !pass) return alert("Ranpli tout bwat yo.");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Email oswa modpas pa kòrèk.");
    }
};

window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value.trim();
    const sponsorCode = document.getElementById('sponsor-input').value.trim();

    if (!name || !phone || !email || !pass) return alert("Ranpli tout bwat yo.");

    try {
        let sponsorUid = null;
        let sponsorName = "Sistèm";

        // Rechèch Sponsor
        if (sponsorCode !== "") {
            const usersRef = ref(db, 'users');
            const q = query(usersRef, orderByChild('ars_id'), equalTo(sponsorCode));
            const snap = await get(q);

            if (snap.exists()) {
                const result = snap.val();
                sponsorUid = Object.keys(result)[0];
                sponsorName = result[sponsorUid].full_name;
            } else {
                alert("Kòd Sponsor sa a pa valid. Enskripsyon ap fèt san sponsor.");
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;

        await set(ref(db, 'users/' + uid), {
            uid: uid,
            full_name: name,
            phone: phone,
            email: email,
            ars_id: "ARS-" + Math.floor(100000 + Math.random() * 900000),
            balance: 0,
            komisyon_balance: 0,
            invited_by_uid: sponsorUid,
            invited_by: sponsorName,
            first_exchange_done: false,
            status: "active",
            createdAt: serverTimestamp()
        });

        alert("Kont ou kreye ak siksè!");
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// 10. Lòt Fonksyon (Sidebar, Logout)
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

window.handleLogout = () => {
    signOut(auth).then(() => window.location.reload());
};

console.log("Echanj Plus | Sèvo Santral ak Parennaj aktive.");
                     
