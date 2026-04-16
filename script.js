// 1. Enpòte SDK Firebase yo depi nan sous la
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, set, update, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. Konfigirasyon Firebase ou a
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

// 4. State Global (POU PIN NAN AK ITILIZATÈ A)
export let CurrentUser = null;
export let userPinGlobal = null; // Sa ap sere PIN nan pou tout aplikasyon an

// 5. Fonksyon Navigasyon
window.showPage = (pageId, element) => {
    // Kache tout seksyon yo
    document.querySelectorAll('.page-content, section, .tab-content').forEach(p => {
        p.classList.add('hidden');
    });
    
    // Montre paj ki mande a
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // --- DEKLANCHE ISTORIK LA SI SE PAJ TRANSAKSYON ---
    if (pageId === 'paj-trans') {
        if (typeof window.aficheTranzaksyon === 'function') {
            window.aficheTranzaksyon('tout');
        }
    }

    // Jere klas 'active' nan menu an
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
};

// 6. Obsèvatè Koneksyon
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        CurrentUser = user;
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        listenToUserData(user.uid);
    } else {
        CurrentUser = null;
        userPinGlobal = null;
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
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

// 8. Mete UI a ajou (AK PARAMÈT YO TOU)
function updateGlobalUI(data) {
    // Sere PIN nan varyab global la (toujou konvèti l an String pou evite erè)
    userPinGlobal = data.pin ? String(data.pin) : null;

    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Balans
    const balElements = ['user-balance', 'header-quick-balance', 'display-balance'];
    balElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = (id === 'user-balance') ? balance : balance + " HTG";
    });

    // Profil sidebar ak Header
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

    // --- MIZAJOU PAJ PARAMÈT (SETTINGS) ---
    const settName = document.getElementById('sett-name');
    const settEmail = document.getElementById('sett-email');
    const emailResetDisplay = document.getElementById('email-display-reset');
    const settAvatar = document.getElementById('user-avatar-settings');

    if (settName) settName.innerText = data.full_name || "Enfòmasyon...";
    if (settEmail && auth.currentUser) settEmail.innerText = auth.currentUser.email;
    if (emailResetDisplay && auth.currentUser) emailResetDisplay.innerText = auth.currentUser.email;
    
    if (settAvatar && data.full_name) {
        settAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=109121&color=fff`;
    }
}

// 9. Sidebar
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// 10. Logout
window.handleLogout = () => {
    signOut(auth).then(() => {
        window.location.reload();
    }).catch((error) => {
        console.error("Erè logout:", error);
    });
};

// 11. Dark Mode
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
    });
}

console.log("Echanj Plus | Sèvo Santral pare ak PIN ak Paramètres.");
      
