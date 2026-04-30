import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let retreData = { non: "", telefon: "", metod: "", montan: 0 };

// ETAP 1: Klike sou bouton "KONTINYE" (Validasyon vizyèl sèlman)
document.getElementById('btn-konfime-retre').onclick = async () => {
    retreData.non = document.getElementById('retre-name').value.trim();
    retreData.telefon = document.getElementById('retre-phone').value.trim();
    retreData.metod = document.getElementById('retre-method').value;
    retreData.montan = parseFloat(document.getElementById('retre-amount').value);

    if (!retreData.non || !retreData.telefon || isNaN(retreData.montan) || retreData.montan < 100) {
        alert("Tanpri ranpli tout chan yo kòrèkteman (Min: 100 HTG).");
        return;
    }

    if (!auth.currentUser) return alert("Ou dwe konekte.");

    // Montre rezime a
    document.getElementById('sum-retre-non').innerText = retreData.non;
    document.getElementById('sum-retre-tel').innerText = retreData.telefon;
    document.getElementById('sum-retre-metod').innerText = retreData.metod.toUpperCase();
    document.getElementById('sum-retre-montan').innerText = retreData.montan.toFixed(2) + " HTG";
    document.getElementById('modal-rezime-retre').classList.remove('hidden');
};

window.openPinModal = () => {
    document.getElementById('modal-rezime-retre').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.remove('hidden');
};

// ETAP FINAL: Valide PIN + Retire Lajan (Sekirite Maksimòm)
window.validateAndSaveRetre = async () => {
    const pinInput = document.getElementById('pin-retre-input');
    const pinAntre = pinInput.value;
    const uid = auth.currentUser.uid;

    if (!pinAntre || pinAntre.length < 4) return alert("Antre yon PIN valab.");

    try {
        // 1. Verifye PIN nan premye
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.pin !== pinAntre) {
            alert("PIN sa a pa kòrèk.");
            pinInput.value = "";
            return;
        }

        // 2. Sèvi ak yon Transaction pou retire kòb la anvan nou anrejistre demand lan
        // Sa anpeche moun fè de retrè anmenmtan pou "vole" kòb
        const balanceRef = ref(db, `users/${uid}/balance`);
        
        const transactionResult = await runTransaction(balanceRef, (currentBalance) => {
            if (currentBalance === null) return 0;
            if (currentBalance < retreData.montan) {
                return; // Sa ap anile tranzaksyon an si kòb la pa ase
            }
            return currentBalance - retreData.montan; // Soustraksyon an fèt isit la
        });

        if (!transactionResult.committed) {
            alert("Balans ou pa ase pou aksyon sa a!");
            return;
        }

        // 3. Si soustraksyon an mache, kounye a nou anrejistre tranzaksyon an nan istorik
        const nouvoTransRef = push(ref(db, 'transactions'));
        await set(nouvoTransRef, {
            uid: uid,
            type: "retre",
            method: retreData.metod,
            receiver_name: retreData.non,
            receiver_phone: retreData.telefon,
            amount: retreData.montan,
            status: "pending",
            timestamp: serverTimestamp()
        });

        // 4. Mizajou balans nan UI a (pou itilizatè a wè chanjman an menm kote)
        if(document.getElementById('top-balance')) {
            document.getElementById('top-balance').innerText = (userData.balance - retreData.montan).toFixed(2);
        }

        // Siksè
        document.getElementById('modal-pin-retre').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');
        
        // Netwaye fòm nan
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";
        pinInput.value = "";

    } catch (error) {
        console.error("Erè sekirite:", error);
        alert("Yon erè rive. Eseye ankò.");
    }
};

window.closeAllModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
};
            
