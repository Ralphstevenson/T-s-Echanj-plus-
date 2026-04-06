import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// --- 1. FONKSYON POU JENERE ARS-ID ---
function generateARSID() {
    // Jenere yon nimewo ant 1000 ak 999999
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

    // Ti animasyon sou bouton an
    const btn = document.querySelector("#login-section .btn-primary-pro");
    const originalText = btn.innerText;
    btn.innerText = "Y AP KONEKTE...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // "onAuthStateChanged" nan script.js ap detekte koneksyon an epi ouvri dashboard la automatikman
    } catch (error) {
        console.error("Erè koneksyon:", error.code);
        alert("Modpas la oswa Imèl la pa kòrèk.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- 3. ENSKRIPSYON (SIGNUP) ---
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
        // Kreye itilizatè a nan Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const newID = generateARSID();

        // Prepare done yo pou Realtime Database
        const userData = {
            uid: user.uid,
            name: name,
            phone: phone,
            email: email,
            arsId: newID,
            balance: 0,
            commissions: 0,
            invitedBy: sponsorCode || "none", // Sove kòd moun ki envite l la
            isFirstExchange: true, // Sa ap sèvi pou rabe 2% a
            status: "active",
            createdAt: Date.now()
        };

        // Sove done yo nan bran "users" nan database la
        await set(ref(db, 'users/' + user.uid), userData);

        alert(`Felisitasyon ${name}! Kont ou kreye. ID ou se: ${newID}`);
        // location.reload() ap fèt otomatikman via onAuthStateChanged
        
    } catch (error) {
        console.error("Erè enskripsyon:", error.code);
        if (error.code === 'auth/email-already-in-use') {
            alert("Imèl sa a gen yon kont deja.");
        } else {
            alert("Erè: " + error.message);
        }
    }
};
