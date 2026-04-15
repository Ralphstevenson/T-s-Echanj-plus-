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

// 4. State Global (Done ki disponib pou tout aplikasyon an)
export let CurrentUser = null;

// 5. Fonksyon Navigasyon (Piblik pou HTML ka wè li)
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

    // Jere klas 'active' nan menu an
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
};

// 6. Obsèvatè Koneksyon (Auth Observer)
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        CurrentUser = user;
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        
        // Kòmanse koute done itilizatè a an tan reyèl
        listenToUserData(user.uid);
    } else {
        CurrentUser = null;
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// 7. Koute done itilizatè (Balans, PIN, ID) an tan reyèl
function listenToUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateGlobalUI(data);
        }
    });
}

// 8. Mete UI a ajou toupatou sou sit la
function updateGlobalUI(data) {
    const balance = parseFloat(data.balance || 0).toFixed(2);
    
    // Balans toupatou
    const balElements = ['user-balance', 'header-quick-balance', 'display-balance'];
    balElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = (id === 'user-balance') ? balance : balance + " HTG";
    });

    // Profil sidebar
    const sideName = document.getElementById('side-name');
    const sideId = document.getElementById('side-id');
    const displayArsId = document.getElementById('display-ars-id');
    const greeting = document.getElementById('header-user-greeting');

    if (sideName) sideName.innerText = data.full_name || "Itilizatè";
    if (sideId) sideId.innerText = data.ars_id || "ARS-PENDING";
    if (displayArsId) displayArsId.innerText = data.ars_id || "---";
    if (greeting) {
        const pwoon = data.full_name ? data.full_name.split(' ')[0] : "Itilizatè";
        greeting.innerText = "Bonjou, " + pwoon;
    }
}

// 9. Fonksyon pou bò kote sidebar a (Toggle Sidebar)
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

console.log("Echanj Plus | Sèvo Santral pare.");
      
