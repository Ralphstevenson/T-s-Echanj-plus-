// auth.js - Version Konplè ak tout Mizajou
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider 
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

// --- 3. ENSKRIPSYON (SIGNUP) AK PARENNAJ ---
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

        // Chèche si kòd sponsor a egziste (Check ars_id ak arsID)
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
            } else {
                alert("Kòd Sponsor sa a pa valid. Enskripsyon an ap kontinye san sponsor.");
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const newID = generateARSID();

        const userData = {
            uid: user.uid,
            full_name: name,
            name: name, 
            phone: phone,
            email: email,
            ars_id: newID,   
            arsID: newID,    
            balance: 0,
            komisyon_balance: 0,
            invited_by_uid: sponsorUid,
            invited_by: sponsorName,
            first_exchange_done: false,
            status: "active",
            createdAt: serverTimestamp()
        };

        await set(ref(db, 'users/' + user.uid), userData);
        alert(`Felisitasyon ${name}! Kont ou kreye. ID ou se: ${newID}`);
        
    } catch (error) {
        alert("Erè enskripsyon: " + error.message);
    }
};

// --- 4. CHANJE MODPAS (SEKIRITE) ---
window.handleUpdatePassword = async function() {
    const user = auth.currentUser;
    const oldPass = document.getElementById('old-pass').value.trim();
    const newPass = document.getElementById('new-pass').value.trim();

    if (!oldPass || !newPass) return alert("Ranpli tout bwat yo.");
    if (newPass.length < 6) return alert("Modpas la dwe gen omwen 6 karaktè.");

    const btn = document.querySelector("#modal-password .btn-primary-pro");
    const originalText = btn.innerText;
    btn.innerText = "Y AP VERIFYE...";
    btn.disabled = true;

    try {
        // Rekonekte pou verifye si se mèt kont lan
        const credential = EmailAuthProvider.credential(user.email, oldPass);
        await reauthenticateWithCredential(user, credential);

        // Chanje modpas la
        await updatePassword(user, newPass);

        alert("Modpas ou chanje ak siksè!");
        window.closeModal('modal-password');
        document.getElementById('old-pass').value = "";
        document.getElementById('new-pass').value = "";
    } catch (error) {
        if (error.code === 'auth/wrong-password') alert("Ansyen modpas la pa kòrèk.");
        else alert("Erè: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- 5. JESTYON MODAL ---
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
};

// --- 6. DETEKTE REFFERAL NAN URL ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    const input = document.getElementById('sponsor-input');
    if (refCode && input) {
        input.value = refCode;
        input.style.border = "2px solid #109121";
    }
});
        
