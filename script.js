// 1. Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. Import Modil Separe yo
import { updateSidebarUI } from './sidebar-manager.js';
import { initNavigation } from './navigation-manager.js';
import { initAkeyFeatures, updateAkeyBalance, setFlashInfo } from './akey-manager.js';

// 3. Firebase Config
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

// Inisyalize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Inisyalize Navigasyon Global la
initNavigation();

// --- FONKSYON GLOBAL (Pou bouton nan HTML wè yo) ---

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

window.handleLogout = function() {
    if(confirm("Èske w vle dekonekte tèlman?")) {
        signOut(auth).then(() => { 
            sessionStorage.clear(); // Netwaye sesyon an
            location.reload(); 
        });
    }
};

// --- LOGIK SÈVÈ AN TAN REYÈL ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 1. Chaje done itilizatè a
        loadUserData(user.uid);
        
        // 2. Limen Carousel ak Flash Info (Paj Akèy)
        initAkeyFeatures();
        setFlashInfo("Byenveni! Pwofite 13.5% rabe sou premye transaksyon ou! 🚀");
        
    } else {
        // Si moun nan pa konekte, montre paj login la
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function loadUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    
    // Koute chanjman nan database la an tan reyèl (onValue)
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // A. Mete ajou tout UI a san rafrechi paj
            updateSidebarUI(data);     // Sidebar (ID, Non, Email)
            updateAkeyBalance(data.balance); // Balans nan Akèy
            
            // B. Montre Dashboard la
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            
            // C. Afiche Alèt Byenveni yon sèl fwa
            if(!sessionStorage.getItem('welcomed')) {
                showWelcomeAlert(data.name);
                sessionStorage.setItem('welcomed', 'true');
            }
        }
    });
}

// Alèt Byenveni
function showWelcomeAlert(name) {
    const alertBox = document.createElement('div');
    alertBox.className = 'welcome-toast animated bounceInRight';
    alertBox.style = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #FFD700; 
        color: black; 
        padding: 15px; 
        border-radius: 12px; 
        z-index: 9999; 
        font-weight: bold; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    alertBox.innerHTML = `<span>👋</span> Bonswa, ${name}!`;
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.style.opacity = "0";
        alertBox.style.transition = "0.5s";
        setTimeout(() => alertBox.remove(), 500);
    }, 4000);
               }
