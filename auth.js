import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// --- 1. FONKSYON POU JENERE ARS-ID ---
function generateARSID() {
    const ran = Math.floor(1000 + Math.random() * 998999);
    return `ARS-${ran}`;
}

// --- 2. KONEKSYON (LOGIN) ---
window.handleLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!email || !pass) {
        alert("Tanpri antre imèl ou ak modpas ou.");
        return;
    }

    const btn = document.querySelector("#login-section .btn-primary-pro");
    const originalText = btn.innerText;
    btn.innerText = "Y AP KONEKTE...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Erè koneksyon:", error.code);
        alert("Modpas la oswa Imèl la pa kòrèk.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- 3. ENSKRIPSYON (SIGNUP) KONPLÈ AK PARENNAJ ---
window.handleSignup = async function() {
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value.trim();
    const sponsorCode = document.getElementById('sponsor-input').value.trim();

    if (!name || !phone || !email || !pass) {
        alert("Tanpri ranpli tout bwat yo.");
        return;
    }

    if (pass.length < 6) {
        alert("Modpas la dwe gen omwen 6 karaktè.");
        return;
    }

    try {
        let sponsorUid = null;
        let sponsorName = "Sistèm";

        // --- LOJIK CHÈCHE PARENN ---
        if (sponsorCode !== "") {
            const usersRef = ref(db, 'users');
            // Nou chèche nan database la kilès ki gen arsId sa a
            const q = query(usersRef, orderByChild('arsId'), equalTo(sponsorCode));
            const snap = await get(q);

            if (snap.exists()) {
                // Si nou jwenn li, nou pran UID li ak Non li
                const result = snap.val();
                const keys = Object.keys(result);
                sponsorUid = keys[0]; 
                sponsorName = result[sponsorUid].full_name || result[sponsorUid].name;
            } else {
                alert("Kòd Sponsor sa a pa egziste. Enskripsyon an ap fèt san sponsor.");
                sponsorCode = "none";
            }
        }

        // Kreye itilizatè a nan Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const newID = generateARSID();

        // Prepare done yo ak non chan ki kòrèk pou Sèvo Santral la ak Paj Parennaj la
        const userData = {
            uid: user.uid,
            full_name: name, // Nou itilize full_name pou l senkronize ak updateGlobalUI
            phone: phone,
            email: email,
            ars_id: newID,   // Nou itilize ars_id pou konsistans
            balance: 0,
            komisyon_balance: 0, // Pou parenn nan ka wè kòb li
            invited_by_uid: sponsorUid, // Pou nou ka fè rabe ak komisyon an
            invited_by: sponsorName,    // Pou afiche non parenn nan
            first_exchange_done: false, // Lè l fè premye echanj, sa ap tounen true
            status: "active",
            createdAt: Date.now()
        };

        // Sove done yo
        await set(ref(db, 'users/' + user.uid), userData);

        alert(`Felisitasyon ${name}! Kont ou kreye ak siksè.`);
        
    } catch (error) {
        console.error("Erè enskripsyon:", error.code);
        if (error.code === 'auth/email-already-in-use') {
            alert("Imèl sa a gen yon kont deja.");
        } else {
            alert("Erè: " + error.message);
        }
    }
};
        
