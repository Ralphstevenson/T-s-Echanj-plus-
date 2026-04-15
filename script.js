// Enpòte SDK Firebase yo
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Konfigirasyon Firebase
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

// Inisyalizasyon
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// 2. State Global (Done ki disponib pou tout lòt JS yo)
export let CurrentUser = null;

// 3. Fonksyon Navigasyon (Disponib nan HTML)
window.showPage = (pageId, element) => {
    // Kache tout paj
    document.querySelectorAll('.page-content, section, .tab-content').forEach(p => p.classList.add('hidden'));
    
    // Montre paj ki klike a
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');

    // Jere klas 'active' nan nav la
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
};

// 4. Obsèvatè Koneksyon (Auth Observer)
onAuthStateChanged(auth, (user) => {
    if (user) {
        CurrentUser = user;
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        listenToUserData(user.uid); // Kòmanse koute done yo
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

// 5. Koute Done Itilizatè a (Balans, ID, elatriye) an tan reyèl
function listenToUserData(uid) {
    const userRef = ref(db, 'users/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Mete UI a ajou toupatou
            updateGlobalUI(data);
        }
    });
}

function updateGlobalUI(data) {
    // Balans
    const formattedBalance = parseFloat(data.balance || 0).toFixed(2);
    document.getElementById('user-balance').innerText = formattedBalance;
    document.getElementById('header-quick-balance').innerText = formattedBalance + " HTG";
    document.getElementById('display-balance').innerText = formattedBalance + " HTG";
    
    // Enfòmasyon Profil
    document.getElementById('side-name').innerText = data.full_name || "Itilizatè";
    document.getElementById('side-id').innerText = data.ars_id || "ARS-PENDING";
    document.getElementById('display-ars-id').innerText = data.ars_id || "---";
    document.getElementById('header-user-greeting').innerText = "Bonjou, " + (data.full_name?.split(' ')[0] || "");
}

// 6. Logout
window.handleLogout = () => {
    signOut(auth).then(() => {
        location.reload();
    });
};

// 7. Dark Mode Logic
const darkModeToggle = document.getElementById('dark-mode-toggle');
darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
});
                                               
