import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let retreData = { non: "", telefon: "", metod: "", montan: 0 };

/**
 * ETAP 1: Klike sou bouton "KONTINYE" nan fòm nan
 * Sa a ap louvri Rezime a anvan
 */
document.getElementById('btn-konfime-retre').onclick = async () => {
    retreData.non = document.getElementById('retre-name').value;
    retreData.telefon = document.getElementById('retre-phone').value;
    retreData.metod = document.getElementById('retre-method').value;
    retreData.montan = parseFloat(document.getElementById('retre-amount').value);

    if (!retreData.non || !retreData.telefon || isNaN(retreData.montan) || retreData.montan < 100) {
        alert("Tanpri ranpli fòm nan kòrèkteman (Min 100 HTG).");
        return;
    }

    // Tcheke balans
    const userSnap = await get(ref(db, `users/${auth.currentUser.uid}`));
    if (retreData.montan > userSnap.val().balance) {
        alert("Balans ou pa ase!");
        return;
    }

    // Mete enfòmasyon nan Modal Rezime a
    document.getElementById('sum-retre-non').innerText = retreData.non;
    document.getElementById('sum-retre-tel').innerText = retreData.telefon;
    document.getElementById('sum-retre-metod').innerText = retreData.metod.toUpperCase();
    document.getElementById('sum-retre-montan').innerText = retreData.montan.toFixed(2) + " HTG";

    // Louvri Modal Rezime
    document.getElementById('modal-rezime-retre').classList.remove('hidden');
};

/**
 * ETAP 2: Itilizatè a klike sou "Kontinye" nan Rezime a
 * Sa a ap louvri Modal PIN lan
 */
window.openPinModal = () => {
    document.getElementById('modal-rezime-retre').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.remove('hidden');
};

/**
 * ETAP 3: Valide PIN epi Anrejistre nan Firebase
 */
window.validateAndSaveRetre = async () => {
    const pinAntre = document.getElementById('pin-retre-input').value;
    
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

        // Louvri Modal Siksè a ak Ikon an
        document.getElementById('modal-pin-retre').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');

        // Vide fòm nan
        document.getElementById('retre-amount').value = "";
        document.getElementById('pin-retre-input').value = "";

    } catch (error) {
        alert("Erè: " + error.message);
    }
};

window.closeAllModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
};
        
