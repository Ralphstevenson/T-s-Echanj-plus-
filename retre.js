import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let retreData = { non: "", telefon: "", metod: "", montan: 0 };

// 1. Bouton Kontinye nan fòm nan
document.getElementById('btn-konfime-retre').onclick = async () => {
    retreData.non = document.getElementById('retre-name').value;
    retreData.telefon = document.getElementById('retre-phone').value;
    retreData.metod = document.getElementById('retre-method').value;
    retreData.montan = parseFloat(document.getElementById('retre-amount').value);

    if (!retreData.non || !retreData.telefon || isNaN(retreData.montan) || retreData.montan < 100) {
        alert("Tanpri ranpli fòm nan kòrèkteman (Min 100 HTG).");
        return;
    }

    try {
        // Tcheke balans nan Firebase
        const userSnap = await get(ref(db, `users/${auth.currentUser.uid}`));
        const balansAktyel = userSnap.val().balance || 0;

        if (retreData.montan > balansAktyel) {
            alert("Balans ou pa ase pou montan sa a!");
            return;
        }

        // Ranpli Rezime a
        document.getElementById('sum-retre-non').innerText = retreData.non;
        document.getElementById('sum-retre-tel').innerText = retreData.telefon;
        document.getElementById('sum-retre-metod').innerText = retreData.metod.toUpperCase();
        document.getElementById('sum-retre-montan').innerText = retreData.montan.toFixed(2) + " HTG";

        // Louvri Rezime
        document.getElementById('modal-rezime-retre').classList.remove('hidden');
    } catch (e) { alert("Erè: " + e.message); }
};

// 2. Louvri modal PIN apre rezime
window.openPinModal = () => {
    document.getElementById('modal-rezime-retre').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.remove('hidden');
};

// 3. Valide PIN epi Save
window.validateAndSaveRetre = async () => {
    const pinAntre = document.getElementById('pin-retre-input').value;
    if (!pinAntre) return;

    try {
        const pinSnap = await get(ref(db, `users/${auth.currentUser.uid}/pin`));
        if (pinSnap.val() !== pinAntre) {
            alert("PIN sa a pa kòrèk.");
            return;
        }

        // Anrejistre nan Firebase
        const nouvoTransRef = push(ref(db, 'transactions'));
        await set(nouvoTransRef, {
            uid: auth.currentUser.uid,
            type: "retre",
            method: retreData.metod,
            receiver_name: retreData.non,
            receiver_phone: retreData.telefon,
            amount: retreData.montan,
            status: "pending",
            timestamp: serverTimestamp()
        });

        // Montre Siksè (LordIcon)
        document.getElementById('modal-pin-retre').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');

        // Netwaye fòm nan
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-amount').value = "";
        document.getElementById('pin-retre-input').value = "";

    } catch (error) { alert("Erè nan save: " + error.message); }
};

window.closeAllModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
};
        
