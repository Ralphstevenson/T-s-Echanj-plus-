// Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- GLOBAL VARIABLES ---
let currentUserData = null;

// --- NAVIGASYON AK ANIMASYON ---
window.showPage = function(pageId, element) {
    // Kache tout seksyon yo ak yon ti animasyon fade
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.style.opacity = "0";
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        setTimeout(() => { activePage.style.opacity = "1"; }, 50);
    }

    // Mizajou Navigasyon
    document.querySelectorAll('.nav-item, .menu-item').forEach(item => {
        item.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    // Fèmen sidebar si l te louvri
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
};

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('active');
};

// --- KONTWÒL SESYON (AUTH STATE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Itilizatè a konekte
        loadUserData(user.uid);
    } else {
        // Itilizatè a dekonekte
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

// --- CHAJMAN DONE ITILIZATÈ ---
async function loadUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentUserData = data;
            updateUI(data);
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            
            // Alèt Byenveni (Si se premye fwa nan sesyon an)
            if(!sessionStorage.getItem('welcomed')) {
                showWelcomeAlert(data.name);
                sessionStorage.setItem('welcomed', 'true');
            }
        }
    });
}

function updateUI(data) {
    // Mete enfòmasyon yo nan tout paj yo
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

// --- ALÈT BYENVENI ---
function showWelcomeAlert(name) {
    const alertBox = document.createElement('div');
    alertBox.className = 'welcome-toast animated bounceInRight';
    alertBox.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-hand-wave"></i>
            <span>Bonswa, <b>${name}</b>! Byenveni sou Echanj Plus.</span>
        </div>
    `;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 4000);
}

// --- LOGOUT ---
window.handleLogout = () => {
    if(confirm("Èske w vle dekonekte tèlman?")) {
        signOut(auth).then(() => {
            location.reload();
        });
    }
};

