 import { db, auth } from './script.js';
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ============================================================
   1. KONFIGIRASYON JENERAL & VÈSYON
   ============================================================ */
const APP_VERSION = "v3.2.5";
document.querySelectorAll('.version-tag, .sidebar-footer p').forEach(el => {
    el.innerText = `Echanj Plus | ${APP_VERSION}`;
});

/* ============================================================
   2. NAVIGASYON (SIDEBAR & BOTTOM NAV)
   ============================================================ */
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

// Louvri/Fèmen Sidebar
window.toggleSidebar = () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
        setTimeout(() => overlay.style.opacity = '1', 10);
        document.body.style.overflow = 'hidden';
    } else {
        closeSidebarEffect();
    }
};

function closeSidebarEffect() {
    sidebar.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

overlay.addEventListener('click', closeSidebarEffect);

// Fonksyon inifye pou chanje paj (switchPage & showPage)
window.switchPage = window.showPage = (pageId, element) => {
    // Lis tout ID paj yo (Peye atansyon si se 'paj-trans' oswa 'paj-istorik')
    const allPages = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-istorik', 'paj-trans', 'paj-paramet', 'chat-container'];

    allPages.forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.add('hidden');
    });

    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // Mizajou vizyèl bouton aktif yo
    document.querySelectorAll('.menu-item, .nav-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fèmen sidebar si l te ouvri
    if (sidebar.classList.contains('open')) closeSidebarEffect();
};

/* ============================================================
   3. DONE PWOFIL & PARAMÈT (FIREBASE)
   ============================================================ */
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Done Pwofil (Sidebar & Settings)
                const name = data.full_name || "Itilizatè";
                document.getElementById('side-full-name').innerText = name;
                document.getElementById('side-email').innerText = user.email;
                if(document.getElementById('set-name')) document.getElementById('set-name').innerText = name;
                if(document.getElementById('set-email')) document.getElementById('set-email').innerText = user.email;
                if(document.getElementById('set-phone')) document.getElementById('set-phone').innerText = data.phone || "4711-1123";

                // Avatar
                const initials = name.substring(0, 2).toUpperCase();
                document.getElementById('side-avatar').innerText = initials;

                // Senkronizasyon Switches
                if (data.settings) {
                    const darkToggle = document.getElementById('dark-mode-toggle');
                    const mailToggle = document.getElementById('mail-notif-toggle');
                    if (darkToggle) {
                        darkToggle.checked = data.settings.dash_night || false;
                        document.body.classList.toggle('dark-theme', darkToggle.checked);
                    }
                    if (mailToggle) mailToggle.checked = data.settings.gmail_notif || false;
                }
            }
        });
    }
});

/* ============================================================
   4. LOJIK SISTÈM (DASH NIGHT / GMAIL / PIN)
   ============================================================ */

// Dark Mode & Gmail Toggle
document.addEventListener('change', async (e) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    if (e.target.id === 'dark-mode-toggle') {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark-theme', isDark);
        await update(ref(db, `users/${uid}/settings`), { dash_night: isDark });
    }

    if (e.target.id === 'mail-notif-toggle') {
        await update(ref(db, `users/${uid}/settings`), { gmail_notif: e.target.checked });
    }
});

// Modpas Reset
window.resetPassword = async () => {
    try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        alert("Yon lyen reyajisman voye nan Gmail ou.");
    } catch (err) { alert("Erè: " + err.message); }
};

// PIN Update
window.handlePinUpdate = async () => {
    const pinVal = document.getElementById('pin-input').value;
    if (pinVal.length !== 4) return alert("PIN nan dwe gen 4 chif.");

    try {
        await update(ref(db, `users/${auth.currentUser.uid}`), { pin: pinVal });
        alert("PIN sove ak siksè!");
        if(window.closeModal) closeModal('modal-pin');
    } catch (err) { alert("Erè: " + err.message); }
};

/* ============================================================
   5. DEKONEKSYON
   ============================================================ */
window.logoutUser = () => {
    if (confirm("Èske ou vle dekonekte?")) {
        signOut(auth).then(() => window.location.reload());
    }
};
