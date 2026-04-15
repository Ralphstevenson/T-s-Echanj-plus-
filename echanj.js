import { db, auth, CurrentUser } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done Global pou echanj la
let echanjData = {
    rezo: "",
    montan: 0,
    fre: 0.165, // 16.5% pa defo
    rabe: 0
};

// 1. Fonksyon prensipal pou kòmanse echanj
window.openDialer = async (rezo) => {
    const kantite = prompt("Konbyen minit w ap echanje?");
    if (!kantite || isNaN(kantite) || kantite <= 0) return alert("Tanpri antre yon montan valab.");

    echanjData.rezo = rezo;
    echanjData.montan = parseFloat(kantite);

    // Tcheke si se premye echanj pou Rabè a
    await tchekePremyeEchanj();
    
    ouvriModalRezime();
};

// 2. Tcheke si moun nan merite rabè 9.5 HTG a
async function tchekePremyeEchanj() {
    const uid = auth.currentUser.uid;
    const transRef = ref(db, `transactions`);
    
    // Nou tcheke si itilizatè a gen tranzaksyon ki rele 'echanj' deja
    const snapshot = await get(transRef);
    let dejaFèEchanj = false;

    if (snapshot.exists()) {
        const data = snapshot.val();
        dejaFèEchanj = Object.values(data).some(t => t.uid === uid && t.type === 'echanj' && t.status === 'completed');
    }

    // Si li poko janm fè echanj, nou ba l rabè a
    echanjData.rabe = dejaFèEchanj ? 0 : 9.5;
}

// 3. Montre Rezime a nan Modal la
function ouvriModalRezime() {
    const freSistèm = echanjData.montan * echanjData.fre;
    const totalResevwa = (echanjData.montan - freSistèm) + echanjData.rabe;

    document.getElementById('sum-minit').innerText = echanjData.montan + " HTG";
    document.getElementById('sum-fre').innerText = "-" + freSistèm.toFixed(2) + " HTG";
    
    const rabeBox = document.getElementById('box-rabe-premium');
    if (echanjData.rabe > 0) {
        rabeBox.classList.remove('hidden');
        document.getElementById('sum-rabe').innerText = "+" + echanjData.rabe + " HTG";
    } else {
        rabeBox.classList.add('hidden');
    }

    document.getElementById('sum-total').innerText = totalResevwa.toFixed(2) + " HTG";
    document.getElementById('modal-confirm-echanj').classList.remove('hidden');
}

// 4. Konfime ak Deklanche USSD
window.femenModalEchanj = () => document.getElementById('modal-confirm-echanj').classList.add('hidden');

document.getElementById('btn-konfime-final').onclick = async () => {
    const pin = prompt("Antre PIN sekirite ou (4 chif):");
    // Isit la ou ka ajoute yon chèk pou verifye si PIN nan bon nan Database la
    
    let ussdKod = "";
    if (echanjData.rezo === 'digicel') {
        ussdKod = `*128*50947111123*${echanjData.montan}#`;
    } else {
        ussdKod = `*123*88888888*32160708*${echanjData.montan}#`;
    }

    // Anrejistre tranzaksyon an nan Firebase
    try {
        const nouvoTransRef = push(ref(db, 'transactions'));
        await set(nouvoTransRef, {
            uid: auth.currentUser.uid,
            type: "echanj",
            rezo: echanjData.rezo,
            amount: echanjData.montan,
            to_receive: (echanjData.montan * (1 - echanjData.fre)) + echanjData.rabe,
            status: "pending",
            timestamp: serverTimestamp()
        });

        femenModalEchanj();
        window.location.href = "tel:" + encodeURIComponent(ussdKod);
    } catch (error) {
        alert("Errè nan voye tranzaksyon an: " + error.message);
    }
};
                                   
