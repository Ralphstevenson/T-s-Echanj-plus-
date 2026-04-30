import { db, auth } from './script.js';
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. VERSION MANAGEMENT
const APP_VERSION = "v3.2.5";
document.querySelectorAll('.version-tag').forEach(el => el.innerText = APP_VERSION);

// 2. LOAD USER DATA
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('set-name').innerText = data.full_name || "Itilizatè";
                document.getElementById('set-email').innerText = user.email;
                document.getElementById('set-phone').innerText = data.phone || "4711-1123";
                
                // PIN Status
                const pinStatus = document.getElementById('pin-status');
                pinStatus.innerText = data.pin ? "Chanje" : "Kreye";
                pinStatus.className = data.pin ? "status-badge active" : "status-badge alert";

                // Sync Switches
                if(data.settings) {
                    document.getElementById('dark-mode-toggle').checked = data.settings.dash_night || false;
                    document.getElementById('mail-notif-toggle').checked = data.settings.gmail_notif || false;
                }
            }
        });
    }
});

// 3. DARK MODE LOGIC
document.getElementById('dark-mode-toggle').addEventListener('change', async (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle('dark-mode', isDark);
    await update(ref(db, `users/${auth.currentUser.uid}/settings`), { dash_night: isDark });
});

// 4. GMAIL NOTIF LOGIC
document.getElementById('mail-notif-toggle').addEventListener('change', async (e) => {
    await update(ref(db, `users/${auth.currentUser.uid}/settings`), { gmail_notif: e.target.checked });
});

// 5. PASSWORD RESET
window.resetPassword = async () => {
    try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        alert("Yon lyen reyajisman voye nan Gmail ou.");
    } catch (e) { alert("Erè: " + e.message); }
};
    
