// auth.js - Version Konplè ak Mizajou Sekirite & Kontwòl Vizibilite
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
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

// --- 1. KONTWÒL ETA KONEKSYON (STATE MANAGEMENT) ---
// Sa a rezoud pwoblèm kote navbar yo parèt an menm tan ak paj auth la
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si moun nan konekte:
        // Nou ajoute klas "logged-in" nan body a pou CSS montre aplikasyon an
        document.body.classList.add('logged-in');
        console.log("Itilizatè konekte:", user.email);
        
        // Isit la ou ka rele lòt fonksyon pou chaje done moun nan si sa nesesè
    } else {
        // Si moun nan dekonekte:
        // Nou retire klas "logged-in" la, sa k ap kache tout aplikasyon an otomatikman
        document.body.classList.remove('logged-in');
        console.log("Itilizatè dekonekte");
    }
});

// --- 2. JENERE ARS-ID ---
function generateARSID() {
    const ran = Math.floor(100000 + Math.random() * 899999);
    return `ARS-${ran}`;
}

// --- 3. KONEKSYON (LOGIN) ---
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

// --- 4. ENSKRIPSYON (SIGNUP) ---
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

// --- 5. DEKONEKSYON (LOGOUT) ---
window.handleLogout = async function() {
    if(confirm("Èske ou vle dekonekte vre?")) {
        try {
            await signOut(auth);
            // CSS la ap kache aplikasyon an otomatikman gras ak onAuthStateChanged
        } catch (error) {
            alert("Erè lè w ap dekonekte: " + error.message);
        }
    }
};

// --- 6. CHANJE MODPAS LÈ KONEKTE (MODAL PARAMÈT) ---
window.openPasswordModal = () => {
    const user = auth.currentUser;
    const emailDisplay = document.getElementById('user-email-display'); 
    
    if (user && emailDisplay) {
        emailDisplay.innerText = user.email; 
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
    if(btn) {
        btn.innerText = "Y AP VOYE...";
        btn.disabled = true;
    }

    try {
        auth.languageCode = 'fr'; 
        await sendPasswordResetEmail(auth, user.email);
        alert("Yon lien reyajisman voye nan Gmail ou: " + user.email);
        if (window.closeModal) window.closeModal('modal-password');
    } catch (error) {
        alert("Erè: " + error.message);
    } finally {
        if(btn) {
            btn.innerText = "VOYE LIEN";
            btn.disabled = false;
        }
    }
};

// --- 7. BLIYE MODPAS LÈ DEKONEKTE (PAJ AUTH) ---
window.handleForgotPasswordExternal = async () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return alert("Tanpri antre email ou.");

    const btn = document.querySelector("#forgot-section .btn-primary-pro");
    if(btn) btn.disabled = true;

    try {
        auth.languageCode = 'fr';
        await sendPasswordResetEmail(auth, email);
        alert("Yon lien reyajisman voye nan: " + email);
        window.toggleAuth('login');
    } catch (error) {
        alert("Erè: " + error.message);
    } finally {
        if(btn) btn.disabled = false;
    }
};

// --- 8. NAVIGASYON PAJ AUTH ---
window.toggleAuth = (mode) => {
    const login = document.getElementById('login-section');
    const signup = document.getElementById('signup-section');
    const forgot = document.getElementById('forgot-section');

    if(!login || !signup || !forgot) return;

    login.classList.add('hidden');
    signup.classList.add('hidden');
    forgot.classList.add('hidden');

    if (mode === 'signup') signup.classList.remove('hidden');
    else if (mode === 'forgot') forgot.classList.remove('hidden');
    else login.classList.remove('hidden');
};

// --- 9. INITIALIZASYON ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    const input = document.getElementById('sponsor-input');
    if (refCode && input) {
        input.value = refCode;
        input.style.border = "2px solid #FFD700";
    }
});
    
