import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Konfigirasyon
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
export const auth = getAuth(app);
export const db = getDatabase(app);

// --- A. NAVIGASYON PAJ (GWO LOJIK) ---
window.showPage = function(pageId, element) {
    // Kache tout sa ki ka kontni paj
    document.querySelectorAll('section, .tab-content, .page-content').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none';
    });

    // Montre paj ki mande a
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
    }

    // Mizajou klas "active" nan Bottom Nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fèmen sidebar otomatikman
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- B. AUTH OBSERVER (SÈVO A) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        // Itilizatè a konekte
        if(authPage) authPage.classList.add('hidden');
        if(homePage) homePage.classList.remove('hidden');
        
        // Louvri paj akèy la pa defo
        window.showPage('paj-akey');

        // Nou ka koute done itilizatè a isit la pou mete ajou Header a sèlman
        onValue(ref(db, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if (data && window.updateHeaderUI) {
                window.updateHeaderUI(data);
            }
        });
    } else {
        // Itilizatè a dekonekte
        if(authPage) authPage.classList.remove('hidden');
        if(homePage) homePage.classList.add('hidden');
    }
});

// Fonksyon pou louvri sidebar la
window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('active');
};
