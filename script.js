// Import Firebase Modules (Vèsyon 10 pou 2026)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Config
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

// Inisyalize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- FONKSYON GLOBAL POU BOUTON YO KA MACHE ---

// 2. Chanje ant Login ak Signup
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

// 3. Navigasyon ant paj yo
window.showPage = function(pageId, element) {
    // Kache tout seksyon yo
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.style.opacity = "0";
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        setTimeout(() => { activePage.style.opacity = "1"; }, 50);
    }

    // Mizajou klas "active" nan meni yo
    document.querySelectorAll('.nav-item, .menu-item').forEach(item => {
        item.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    // Fèmen sidebar otomatikman sou mobil
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
};

// 4. Louvri/Fèmen Sidebar
window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('active');
};

// 5. Dekonekte
window.handleLogout = function() {
    if(confirm("Èske w vle dekonekte tèlman?")) {
        signOut(auth).then(() => {
            location.reload();
        });
    }
};

// --- LOGIK SISTÈM NAN ---

// Kontwole si itilizatè a konekte
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData(user.uid);
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

// Chaje done itilizatè a depi nan Database la
function loadUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateUI(data);
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            
            // Alèt Byenveni yon sèl fwa pa sesyon
            if(!sessionStorage.getItem('welcomed')) {
                showWelcomeAlert(data.name);
                sessionStorage.setItem('welcomed', 'true');
            }
        }
    });
}

// Mete done yo nan HTML la
function updateUI(data) {
    const elements = {
        'side-name': data.name,
        'side-email': data.email,
        'side-id': data.arsId || 'ARS-XXXX',
        'user-balance': parseFloat(data.balance || 0).toFixed(2),
        'display-balance': parseFloat(data.balance || 0).toFixed(2) + " HTG",
        'display-ars-id': data.arsId || '---',
        'sett-name': data.name,
        'sett-email': data.email,
        'komisyon-balans': parseFloat(data.commissions || 0).toFixed(2)
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }
}

// Ti alèt animasyon
function showWelcomeAlert(name) {
    const alertBox = document.createElement('div');
    alertBox.className = 'welcome-toast animated bounceInRight';
    alertBox.style = "position: fixed; top: 20px; right: 20px; background: #FFD700; color: black; padding: 15px; border-radius: 10px; z-index: 9999; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
    alertBox.innerHTML = `<i class="fas fa-hand-wave"></i> Bonswa, ${name}! 👋`;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 4000);
      }
