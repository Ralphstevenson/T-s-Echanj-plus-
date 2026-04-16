// ==========================================================
// ECHANJ PLUS - SÈVO SANTRAL (script.js)
// ==========================================================

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

// ----------------------------------------------------------
// 5. FONKSYON NAVIGASYON (KOREKSYON POU TOUT SEKSYON)
// ----------------------------------------------------------
window.showPage = (pageId, element) => {
    // Kache tout sa ki gen klas "page-content" oswa ki se yon section
    const allPages = document.querySelectorAll('.page-content, section, .tab-content, #chat-container');
    
    allPages.forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none'; // Sekirite siplemantè
    });
    
    // Montre paj ki gen ID nou mande a
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.style.display = 'block'; 
        
        // Si se paj chat la, nou ka bezwen yon style flex
        if(pageId === 'chat-container') targetPage.style.display = 'flex';
    }

    // Mizajou klas "active" nan meni yo
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
    }

    // Si se paj istorik, rele fonksyon an si l egziste
    if (pageId === 'paj-trans' && typeof window.aficheTranzaksyon === 'function') {
        window.aficheTranzaksyon('tout');
    }
    
    // Fèmen sidebar otomatikman sou mobil apre klike
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
};

// ----------------------------------------------------------
// 6. OBSÈVATÈ KONEKSYON (AUTH STATE)
// ----------------------------------------------------------
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app-content');

    if (user) {
        CurrentUser = user;
        if(authPage) authPage.classList.add('hidden');
        if(mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.style.display = 'block';
        }
        
        // Lè li konekte, nou toujou kòmanse sou paj Akèy
        window.showPage('paj-akey', document.querySelector('.nav-item'));
        listenToUserData(user.uid);
    } else {
        CurrentUser = null;
        userPinGlobal = null;
        if(authPage) authPage.classList.remove('hidden');
        if(mainApp) {
            mainApp.classList.add('hidden');
            mainApp.style.display = 'none';
        }
    }
});

// ----------------------------------------------------------
// 7. KOUTE DONE ITILIZATÈ (REAL-TIME)
// ----------------------------------------------------------
function listenToUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateGlobalUI(data);
        }
    });
}

// ----------------------------------------------------------
// 8. METE UI A AJOU (BALANS, ID, NOM)
// ----------------------------------------------------------
function updateGlobalUI(data) {
    userPinGlobal = data.pin ? String(data.pin) : null;
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Mete balans yo tout kote yo bezwen parèt
    const balElements = {
        'user-balance': balance,
        'header-quick-balance': balance + " HTG",
        'display-balance': balance + " HTG",
        'komisyon-balans': parseFloat(data.komisyon_balance || 0).toFixed(2)
    };

    for (let id in balElements) {
        const el = document.getElementById(id);
        if (el) el.innerText = balElements[id];
    }

    // Enfòmasyon Profil
    const myARSID = data.ars_id || data.arsID || "ARS-000000";
    const fullName = data.full_name || data.name || "Itilizatè";

    const uiMap = {
        'side-name': fullName,
        'side-id': myARSID,
        'display-ars-id': myARSID,
        'header-user-greeting': "Bonjou, " + fullName.split(' ')[0]
    };

    for (let id in uiMap) {
        const el = document.getElementById(id);
        if (el) el.innerText = uiMap[id];
    }

    // Si gen Paj Parennaj
    const myRefInput = document.getElementById('my-ref-code');
    if (myRefInput) myRefInput.value = myARSID;

    // Paramèt / Settings
    const settName = document.getElementById('sett-name');
    const settEmail = document.getElementById('sett-email');
    if (settName) settName.innerText = fullName;
    if (settEmail && auth.currentUser) settEmail.innerText = auth.currentUser.email;
}

// ----------------------------------------------------------
// 9. LOJIK LOGIN / SIGNUP
// ----------------------------------------------------------
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!email || !pass) return alert("Tanpri ranpli tout bwat yo.");

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

        if (sponsorCode !== "") {
            const usersRef = ref(db, 'users');
            const q = query(usersRef, orderByChild('ars_id'), equalTo(sponsorCode));
            const snap = await get(q);

            if (snap.exists()) {
                const result = snap.val();
                sponsorUid = Object.keys(result)[0];
                sponsorName = result[sponsorUid].full_name || result[sponsorUid].name;
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
            status: "active",
            createdAt: serverTimestamp()
        });

        alert("Kont ou kreye ak siksè!");
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// ----------------------------------------------------------
// 10. UTILS (SIDEBAR, LOGOUT, ETC.)
// ----------------------------------------------------------
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

window.handleLogout = () => {
    if(confirm("Èske ou vle dekonekte?")) {
        signOut(auth).then(() => {
            window.location.reload();
        });
    }
};

window.toggleAuth = (mode) => {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    const forgotSec = document.getElementById('forgot-section');

    loginSec.classList.add('hidden');
    signupSec.classList.add('hidden');
    forgotSec.classList.add('hidden');

    if (mode === 'signup') signupSec.classList.remove('hidden');
    else if (mode === 'forgot') forgotSec.classList.remove('hidden');
    else loginSec.classList.remove('hidden');
};

// Detekte Referral nan URL la lè paj la chaje
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get('ref');
    const inputSponsor = document.getElementById('sponsor-input');
    if (refFromUrl && inputSponsor) {
        inputSponsor.value = refFromUrl;
        inputSponsor.style.borderColor = "#FFD700"; 
    }
});

console.log("✅ Echanj Plus | Script Santral Chaje.");
        
