// auth.js - Version Konplè ak Mizajou Sekirite & Gmail Display
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get,
    query,
    orderByChild,
    equalTo,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// --- 1. JENERE ARS-ID ---
function generateARSID() {
    const ran = Math.floor(100000 + Math.random() * 899999);
    return `ARS-${ran}`;
}

// --- 2. KONEKSYON (LOGIN) ---
window.handleLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!email || !pass) return alert("Tanpri ranpli tout bwat yo.");

    const btn = document.querySelector("#login-section .btn-primary-pro");
    if(btn) {
        btn.innerText = "Y AP KONEKTE...";
        btn.disabled = true;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Erè login:", error.code);
        alert("Modpas oswa Imèl pa kòrèk.");
        if(btn) {
            btn.innerText = "KONEKTE";
            btn.disabled = false;
        }
    }
};

// --- 3. ENSKRIPSYON (SIGNUP) ---
window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value.trim();
    const sponsorCode = document.getElementById('sponsor-input').value.trim();

    if (!name || !phone || !email || !pass) return alert("Ranpli tout bwat yo.");

    try {
        let sponsorUid = null;
        let sponsorName = "Sistèm";

        if (sponsorCode !== "") {
            const usersRef = ref(db, 'users');
            let q = query(usersRef, orderByChild('ars_id'), equalTo(sponsorCode));
            let snap = await get(q);

            if (!snap.exists()) {
                q = query(usersRef, orderByChild('arsID'), equalTo(sponsorCode));
                snap = await get(q);
            }

            if (snap.exists()) {
                const result = snap.val();
                sponsorUid = Object.keys(result)[0]; 
                sponsorName = result[sponsorUid].full_name || result[sponsorUid].name;
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const newID = generateARSID();

        await set(ref(db, 'users/' + user.uid), {
            uid: user.uid,
            full_name: name,
            phone: phone,
            email: email,
            ars_id: newID,   
            arsID: newID,    
            balance: 0,
            komisyon_balance: 0,
            invited_by_uid: sponsorUid,
            invited_by: sponsorName,
            status: "active",
            createdAt: serverTimestamp()
        });

        alert(`Felisitasyon ${name}! Kont ou kreye. ID ou se: ${newID}`);
    } catch (error) {
        alert("Erè enskripsyon: " + error.message);
    }
};

// --- 4. CHANJE MODPAS (AFICHE GMAIL LA & VOYE LIEN) ---
window.openPasswordModal = () => {
    const user = auth.currentUser;
    // Sa a ap ranje pwoblèm "..." nan Screenshot ou a
    const emailDisplay = document.getElementById('user-email-display'); 
    
    if (user && emailDisplay) {
        emailDisplay.innerText = user.email; // Mete Gmail moun nan la
    }
    
    if (window.openModal) window.openModal('modal-password');
};

window.handleResetPassword = async () => {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
        alert("Ou dwe konekte pou w ka chanje modpas ou.");
        return;
    }

    const btn = document.querySelector("#modal-password .btn-primary-pro");
    const originalText = btn.innerText;
    
    if(btn) {
        btn.innerText = "Y AP VOYE...";
        btn.disabled = true;
    }

    try {
        // Nou fikse lang nan 'fr' pou imèl la ka pi fasil pou konprann
        auth.languageCode = 'fr'; 
        
        await sendPasswordResetEmail(auth, user.email);
        
        alert("Yon lien reyajisman voye nan Gmail ou: " + user.email + "\n\nSi w pa wè l, tcheke katab Spam lan.");
        if (window.closeModal) window.closeModal('modal-password');
    } catch (error) {
        console.error("Erè voye imèl:", error.code);
        if (error.code === 'auth/too-many-requests') {
            alert("Twòp tantativ. Tann kèk minit anvan ou eseye ankò.");
        } else {
            alert("Erè: " + error.message);
        }
    } finally {
        if(btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
};

// Detekte Referral nan URL
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    const input = document.getElementById('sponsor-input');
    if (refCode && input) {
        input.value = refCode;
        input.style.border = "2px solid #FFD700";
    }
});
            
