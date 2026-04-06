// 1. Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. Import Modil Separe nou yo
import { updateSidebarUI } from './sidebar-manager.js';
import { initCarousel, updateHomeBalance, setFlashInfo } from './carousel-manager.js'; // Nou ka mete updateHomeBalance nan carousel-manager oswa home-manager
import { initNavigation } from './navigation-manager.js';

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

// Inisyalize Navigasyon an
initNavigation();

// --- FONKSYON GLOBAL (Pou HTML a ka wè yo) ---

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
        signOut(auth).then(() => { location.reload(); });
    }
};

// --- LOGIK SÈVÈ ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData(user.uid);
        // Limen Carousel la yon sèl fwa
        initCarousel();
        // Mete mesaj akey la
        setFlashInfo("Pwofite rabe 13.5% sou premye transaksyon ou! 🚀");
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function loadUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // 1. Mete ajou Sidebar la (via sidebar-manager.js)
            updateSidebarUI(data);
            
            // 2. Mete ajou Balans nan Akèy (via home/carousel manager)
            updateHomeBalance(data.balance);
            
            // 3. Montre paj prensipal la
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            
            // 4. Afiche Alèt Byenveni
            if(!sessionStorage.getItem('welcomed')) {
                showWelcomeAlert(data.name);
                sessionStorage.setItem('welcomed', 'true');
            }
        }
    });
}

// Ti alèt animasyon (Nou ka kite l isit la paske li jeneral)
function showWelcomeAlert(name) {
    const alertBox = document.createElement('div');
    alertBox.className = 'welcome-toast animated bounceInRight';
    alertBox.style = "position: fixed; top: 20px; right: 20px; background: #FFD700; color: black; padding: 15px; border-radius: 10px; z-index: 9999; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
    alertBox.innerHTML = `<i class="fas fa-hand-wave"></i> Bonswa, ${name}! 👋`;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 4000);
          }
