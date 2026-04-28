import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Objè pou sere done retrè a pandan etap yo
let retreData = {
    non: "",
    telefon: "",
    metod: "",
    montan: 0
};

/**
 * ETAP 1: Klike sou bouton "KONTINYE" nan fòm prensipal la
 */
document.getElementById('btn-konfime-retre').onclick = async () => {
    // Rekipere valè yo
    retreData.non = document.getElementById('retre-name').value.trim();
    retreData.telefon = document.getElementById('retre-phone').value.trim();
    retreData.metod = document.getElementById('retre-method').value;
    retreData.montan = parseFloat(document.getElementById('retre-amount').value);

    // 1. Validasyon fòm nan
    if (!retreData.non || !retreData.telefon || isNaN(retreData.montan) || retreData.montan < 100) {
        alert("Tanpri ranpli tout chan yo kòrèkteman. Minimòm nan se 100 HTG.");
        return;
    }

    // 2. Tcheke si itilizatè a konekte
    if (!auth.currentUser) {
        alert("Ou dwe konekte pou w fè yon retrè.");
        return;
    }

    try {
        // 3. Tcheke balans nan Firebase anvan nou montre rezime
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (!userData || retreData.montan > (userData.balance || 0)) {
            alert("Balans ou pa ase pou w retire montan sa a.");
            return;
        }

        // 4. Mete done yo nan Modal Rezime a
        document.getElementById('sum-retre-non').innerText = retreData.non;
        document.getElementById('sum-retre-tel').innerText = retreData.telefon;
        document.getElementById('sum-retre-metod').innerText = retreData.metod.toUpperCase();
        document.getElementById('sum-retre-montan').innerText = retreData.montan.toFixed(2) + " HTG";

        // 5. Louvri Modal Rezime a
        document.getElementById('modal-rezime-retre').classList.remove('hidden');

    } catch (error) {
        console.error("Erè balans:", error);
        alert("Yon erè rive pandan n ap tcheke balans ou.");
    }
};

/**
 * ETAP 2: Itilizatè a klike sou "Kontinye" nan Rezime a
 */
window.openPinModal = () => {
    // Fèmen rezime, louvri modal PIN
    document.getElementById('modal-rezime-retre').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.remove('hidden');
};

/**
 * ETAP 3: Valide PIN epi anrejistre nan Firebase
 */
window.validateAndSaveRetre = async () => {
    const pinInput = document.getElementById('pin-retre-input');
    const pinAntre = pinInput.value;

    if (!pinAntre || pinAntre.length < 4) {
        alert("Tanpri antre yon PIN valab.");
        return;
    }

    try {
        // 1. Verifye PIN nan profil itilizatè a
        const pinRef = ref(db, `users/${auth.currentUser.uid}/pin`);
        const snapshot = await get(pinRef);

        if (snapshot.val() !== pinAntre) {
            alert("PIN sa a pa kòrèk.");
            pinInput.value = ""; // Efase PIN ki mal la
            return;
        }

        // 2. Anrejistre tranzaksyon an nan branch "transactions"
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

        // 3. Montre Modal Final la (Siksè)
        document.getElementById('modal-pin-retre').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');

        // 4. Netwaye tout chan yo
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";
        pinInput.value = "";

    } catch (error) {
        console.error("Erè finalizasyon:", error);
        alert("Tranzaksyon an echwe. Eseye ankò pita.");
    }
};

/**
 * Fonksyon pou fèmen tout Modals yo
 */
window.closeAllModals = () => {
    document.getElementById('modal-rezime-retre').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.add('hidden');
    document.getElementById('modal-final').classList.add('hidden');
};
                                        
