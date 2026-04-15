import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done Global pou echanj la
let echanjData = {
    rezo: "",
    montan: 0,
    fre: 0.165, 
    rabe: 0
};

// 1. Fonksyon pou kòmanse echanj (Nou rann li piblik ak window)
window.openDialer = async (rezo) => {
    const kantite = prompt("Konbyen minit w ap echanje?");
    
    if (!kantite || isNaN(kantite) || kantite <= 0) {
        alert("Tanpri antre yon montan valab.");
        return;
    }

    echanjData.rezo = rezo;
    echanjData.montan = parseFloat(kantite);

    try {
        // Tcheke si se premye echanj pou Rabè a
        await tchekePremyeEchanj();
        // Montre rezime a
        ouvriModalRezime();
    } catch (error) {
        console.error("Errè:", error);
        alert("Gen yon pwoblèm koneksyon ak baz de done a.");
    }
};

// 2. Tcheke si moun nan merite rabè 9.5 HTG a
async function tchekePremyeEchanj() {
    const user = auth.currentUser;
    if (!user) return;

    const transRef = ref(db, 'transactions');
    const snapshot = await get(transRef);
    let dejaFèEchanj = false;

    if (snapshot.exists()) {
        const data = snapshot.val();
        // Verifye si itilizatè a gen yon echanj ki 'completed' deja nan istwa li
        dejaFèEchanj = Object.values(data).some(t => 
            t.uid === user.uid && t.type === 'echanj' && t.status === 'completed'
        );
    }

    echanjData.rabe = dejaFèEchanj ? 0 : 9.5;
}

// 3. Montre Rezime a nan Modal la
function ouvriModalRezime() {
    const freSistèm = echanjData.montan * echanjData.fre;
    const totalResevwa = (echanjData.montan - freSistèm) + echanjData.rabe;

    // Ranpli HTML la
    document.getElementById('sum-minit').innerText = echanjData.montan.toFixed(2) + " HTG";
    document.getElementById('sum-fre').innerText = "-" + freSistèm.toFixed(2) + " HTG";
    
    const rabeBox = document.getElementById('box-rabe-premium');
    if (echanjData.rabe > 0) {
        rabeBox.classList.remove('hidden');
        document.getElementById('sum-rabe').innerText = "+" + echanjData.rabe.toFixed(2) + " HTG";
    } else {
        rabeBox.classList.add('hidden');
    }

    document.getElementById('sum-total').innerText = totalResevwa.toFixed(2) + " HTG";
    
    // Louvri modal la
    const modal = document.getElementById('modal-confirm-echanj');
    modal.classList.remove('hidden');
}

// 4. Fonksyon pou fèmen modal (Piblik)
window.femenModalEchanj = () => {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
};

// 5. Konfime final epi deklanche USSD
const btnKonfime = document.getElementById('btn-konfime-final');
if (btnKonfime) {
    btnKonfime.onclick = async () => {
        const pinAntre = prompt("Antre PIN sekirite ou (4 chif):");
        
        // Isit la nou verifye PIN nan nan database la anvan nou deklanche USSD a
        const userRef = ref(db, `users/${auth.currentUser.uid}/pin`);
        const pinSnapshot = await get(userRef);
        
        if (pinSnapshot.val() !== pinAntre) {
            alert("PIN nan pa kòrèk. Rekòmanse.");
            return;
        }

        let ussdKod = "";
        if (echanjData.rezo === 'digicel') {
            ussdKod = `*128*50947111123*${echanjData.montan}#`;
        } else {
            ussdKod = `*123*88888888*32160708*${echanjData.montan}#`;
        }

        try {
            // 1. Voye tranzaksyon an nan Firebase
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

            // 2. Fèmen modal la
            window.femenModalEchanj();
            
            // 3. Ouvri Dialer a (Navigateur a ap mande pèmisyon pou fè apèl)
            window.location.href = "tel:" + encodeURIComponent(ussdKod);
            
        } catch (error) {
            alert("Pwoblèm sekirite: " + error.message);
        }
    };
}
    
