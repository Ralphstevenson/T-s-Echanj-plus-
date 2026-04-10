// ==========================================
// SCRIPT.JS - SÈVO ECHANJ PLUS (CENTRAL HUB)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. KONFIGIRASYON (Done ou te bay yo) ---
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
const db = getDatabase(app);
const auth = getAuth(app);

// Global State pou lòt modil yo ka itilize (export)
export let appData = {
    user: null,
    settings: null
};

// --- 2. LOJIK STRIK: AUTH OBSERVER ---
// Sa a se premye lojik: Si w pa konekte, ou pa ka wè dashboard la
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Koneksyon detekte pou:", user.uid);
        startGlobalListeners(user.uid);
    } else {
        console.log("Pa gen itilizatè konekte.");
        // Si nou nan dashboard la, voye moun nan nan login
        if (!window.location.href.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// --- 3. LOJIK STRIK: GLOBAL LISTENERS ---
// Fonksyon sa a koute tout sa k ap pase nan Firebase an tan reyèl
function startGlobalListeners(uid) {
    // A. Koute done itilizatè a
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appData.user = data;
            syncUserUI(data); // Mete UI a ajou
        }
    });

    // B. Koute anviwònman sistèm nan (to echanj 16.5% la)
    const settingsRef = ref(db, `settings`);
    onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            appData.settings = settings;
            console.log("Paramèt sistèm ajou:", settings.to_echanj);
        }
    });
}

// --- 4. LOJIK STRIK: SYNC UI (ANTI-UNDEFINED) ---
// Sa asire tout non, email ak balans yo parèt byen
function syncUserUI(data) {
    // Ranje Non an (Lojik #16)
    const fullName = data.fullName || "Itilizatè Echanj Plus";
    const email = data.email || "Pa gen imèl";
    
    // Mete non nan Header ak Paramètre
    const nameDisplays = document.querySelectorAll('.user-name-text, #sett-name');
    nameDisplays.forEach(el => el.innerText = fullName);

    const emailDisplays = document.querySelectorAll('.user-email-text, #sett-email');
    emailDisplays.forEach(el => el.innerText = email);

    // Ranje Balans lan (Lojik #7)
    const mainBalance = data.balance || 0;
    const balanceElements = document.querySelectorAll('.main-bal-val, #main-balance');
    balanceElements.forEach(el => {
        el.innerText = `${mainBalance.toLocaleString()} HTG`;
    });

    // Ranje Balans Komisyon (Parennaj)
    const refBalance = data.referralBalance || 0;
    const refElements = document.querySelectorAll('#komisyon-balans');
    refElements.forEach(el => {
        el.innerText = refBalance.toFixed(2);
    });

    // Ranje Kòd ARS la
    const arsCode = data.referralCode || "ARS-WAIT";
    const arsElements = document.querySelectorAll('#my-ref-code-text');
    arsElements.forEach(el => el.innerText = arsCode);
}

// --- 5. INITIALIZE APP ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Echanj Plus v3.2 pare.");
    // Isit la nou ka inisyalize lòt ti bagay global si sa nesesè
});
  
