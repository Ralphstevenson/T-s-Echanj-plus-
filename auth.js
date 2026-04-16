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
    equalTo,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// --- 1. FONKSYON POU JENERE ARS-ID ---
function generateARSID() {
    const ran = Math.floor(100000 + Math.random() * 899999);
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

// --- 3. ENSKRIPSYON (SIGNUP) KONPLÈ ---
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

        // --- LOJIK CHÈCHE PARENN (Double Verifikasyon) ---
        if (sponsorCode !== "") {
            const usersRef = ref(db, 'users');
            
            // Tcheke sou nouvo fòma a (ars_id)
            let q = query(usersRef, orderByChild('ars_id'), equalTo(sponsorCode));
            let snap = await get(q);

            // Si nou pa jwenn li, tcheke sou ansyen fòma a (arsID)
            if (!snap.exists()) {
                q = query(usersRef, orderByChild('arsID'), equalTo(sponsorCode));
                snap = await get(q);
            }

            if (snap.exists()) {
                const result = snap.val();
                sponsorUid = Object.keys(result)[0]; 
                sponsorName = result[sponsorUid].full_name || result[sponsorUid].name;
            } else {
                alert("Kòd Sponsor sa a pa valid. Enskripsyon an ap kontinye san sponsor.");
                sponsorUid = null;
            }
        }

        // Kreye kont nan Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const newID = generateARSID();

        // Prepare done yo pou tout pati nan sit la ka rale yo
        const userData = {
            uid: user.uid,
            full_name: name,
            name: name, // Pou ansyen konpatibilite
            phone: phone,
            email: email,
            ars_id: newID,   // Nouvo fòma
            arsID: newID,    // Ansyen fòma (pou sekirite)
            balance: 0,
            komisyon_balance: 0,
            invited_by_uid: sponsorUid,
            invited_by: sponsorName,
            first_exchange_done: false,
            status: "active",
            createdAt: serverTimestamp()
        };

        // Sove nan Database la
        await set(ref(db, 'users/' + user.uid), userData);

        alert(`Felisitasyon ${name}! Kont ou kreye. ID ou se: ${newID}`);
        
    } catch (error) {
        console.error("Erè enskripsyon:", error.code);
        if (error.code === 'auth/email-already-in-use') {
            alert("Imèl sa a gen yon kont deja.");
        } else {
            alert("Erè: " + error.message);
        }
    }
};

// Detekte kòd Refferal nan lyen an (egz: ?ref=ARS-123)
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    const input = document.getElementById('sponsor-input');
    if (refCode && input) {
        input.value = refCode;
        input.style.border = "2px solid #109121";
    }
});
            
