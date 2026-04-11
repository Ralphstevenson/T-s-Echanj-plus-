import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- A. JENERE ARS ID POU NOUVO MOUN ---
// Lojik strik pou chak moun gen yon ID inik
async function generateArsId(uid) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Jenere 4 chif
    const newId = `ARS-${randomNum}`;
    
    // Sove ID a nan Firebase si li pa t egziste
    await update(ref(db, `users/${uid}`), { arsId: newId });
    return newId;
}

// --- B. AUTH OBSERVER (SÈVO A) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        setupUserEnvironment(user);
    } else {
        window.location.href = "login.html"; // Redirect si pa gen sesyon
    }
});

function setupUserEnvironment(user) {
    const userRef = ref(db, `users/${user.uid}`);
    
    onValue(userRef, (snapshot) => {
        let data = snapshot.val();
        
        // Si itilizatè a pa gen ARS ID toujou, nou kreye l
        if (data && !data.arsId) {
            generateArsId(user.uid);
        }

        if (data) {
            updateGlobalUI(data, user.email);
        }
    });
}

// --- C. MIZAJOU UI (Mete tout done yo kote yo dwe ye) ---
function updateGlobalUI(data, email) {
    // 1. Balans Prensipal
    const mainBalance = parseFloat(data.balance || 0).toFixed(2);
    const balEl = document.getElementById('display-balance');
    if (balEl) balEl.innerText = `${mainBalance} HTG`;

    // 2. Sidebar & Profil (Non, Email, ARS ID)
    const sideName = document.getElementById('side-name');
    const sideEmail = document.getElementById('side-email');
    const sideId = document.getElementById('side-id'); // Sa ki nan tèt sidebar a

    if (sideName) sideName.innerText = data.name || "Itilizatè";
    if (sideEmail) sideEmail.innerText = email || data.email;
    if (sideId) sideId.innerText = data.arsId || "ARS-XXXX";

    // 3. Kòd ARS pou kopye nan paj Parennaj la
    const arsDisplay = document.getElementById('display-ars-id');
    if (arsDisplay) arsDisplay.innerText = data.arsId || "---";
}

// --- D. BOUTON NAVBAR & AKSYON ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Bouton Dekoneksyon
    const logoutBtn = document.getElementById('btn-logout'); // Asire w ID sa nan sidebar a
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Èske w vle dekonekte vrèman?")) {
                signOut(auth).then(() => location.reload());
            }
        });
    }

    // 2. Klòch Notifikasyon (Lojik senp pou kounye a)
    const notifBtn = document.querySelector('.fa-bell');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert("Ou pa gen nouvo notifikasyon pou kounye a.");
        });
    }

    // 3. Navigasyon Navbar anba a
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (window.showPage) window.showPage(page, item);
        });
    });
});
        
