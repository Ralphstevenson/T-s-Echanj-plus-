import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done tanporè pou retrè a
let retreData = {
    non: "",
    telefon: "",
    metod: "",
    montan: 0
};

/**
 * 1. Premye Etap: Klike sou bouton "RETIRE KÒB LA"
 */
document.getElementById('btn-konfime-retre').onclick = async () => {
    const non = document.getElementById('retre-name').value;
    const telefon = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    // Validasyon fòm lan
    if (!non || !telefon || isNaN(montan) || montan < 100) {
        alert("Tanpri ranpli tout chan yo kòrèkteman. Minimòm nan se 100 HTG.");
        return;
    }

    // Tcheke balans nan Firebase anvan nou kontinye
    try {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (montan > userData.balance) {
            alert("Balans ou pa ase pou montan sa a!");
            return;
        }

        // Sere done yo pou lòt etap yo
        retreData = { non, telefon, metod, montan };

        // Prepare recap la pou modal la
        document.getElementById('info-recap').innerHTML = `
            <p><b>Reseptè:</b> ${non}</p>
            <p><b>Telefòn:</b> ${telefon}</p>
            <p><b>Metòd:</b> ${metod}</p>
            <p><b>Montan:</b> ${montan.toFixed(2)} HTG</p>
        `;

        document.getElementById('modal-step1').classList.remove('hidden');

    } catch (error) {
        alert("Erè koneksyon: " + error.message);
    }
};

/**
 * 2. Pase nan Modal PIN nan
 */
document.getElementById('next-to-step2').onclick = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.remove('hidden');
};

/**
 * 3. Verifikasyon PIN
 */
document.getElementById('btn-verify-pin-retre').onclick = async () => {
    const pinAntre = document.getElementById('pin-retre-input').value;

    if (!pinAntre) {
        alert("Tanpri antre PIN ou.");
        return;
    }

    try {
        const pinRef = ref(db, `users/${auth.currentUser.uid}/pin`);
        const snapshot = await get(pinRef);

        if (snapshot.val() !== pinAntre) {
            alert("PIN nan pa kòrèk!");
            return;
        }

        // Si PIN nan bon, pase nan dènye konfimasyon an
        document.getElementById('amount-recap').innerText = retreData.montan.toFixed(2) + " HTG";
        document.getElementById('modal-pin-retre').classList.add('hidden');
        document.getElementById('modal-step2').classList.remove('hidden');

    } catch (error) {
        alert("Erè: " + error.message);
    }
};

/**
 * 4. Finalizasyon ak Anrejistreman nan Firebase
 */
window.finaliseRetre = async () => {
    try {
        const uid = auth.currentUser.uid;
        
        // 1. Voye demann lan nan branch transactions
        const nouvoTransRef = push(ref(db, 'transactions'));
        await set(nouvoTransRef, {
            uid: uid,
            type: "retre",
            method: retreData.metod,
            receiver_name: retreData.non,
            receiver_phone: retreData.telefon,
            amount: retreData.montan,
            status: "pending", // Admin ap valide sa
            timestamp: serverTimestamp()
        });

        // 2. Montre modal siksè a
        document.getElementById('modal-step2').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');
        
        // Vide fòm lan
        document.getElementById('retre-amount').value = "";
        document.getElementById('pin-retre-input').value = "";

    } catch (error) {
        alert("Erè nan finalizasyon: " + error.message);
    }
};

/**
 * 5. Fonksyon pou fèmen tout modals
 */
window.closeAllModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.add('hidden');
    });
};
                
