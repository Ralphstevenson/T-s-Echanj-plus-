import { db, auth } from './script.js';
import { ref, get, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done pou jere kalkil echanj la
let echanjData = {
    rezo: "",
    montan: 0,
    fre: 0.165, // 16.5% pa defo (sa ka chanje nan Firebase settings)
    rabe: 0
};

/**
 * 1. Ouvri premye etap echanj la
 */
window.openDialer = async (rezo) => {
    // Tcheke si itilizatè a konekte
    if (!auth.currentUser) {
        alert("Tanpri konekte sou kont ou anvan!");
        return;
    }

    const kantite = prompt("Konbyen minit w ap echanje?");
    
    if (!kantite || isNaN(kantite) || kantite <= 0) {
        alert("Tanpri antre yon montan ki valab.");
        return;
    }

    echanjData.rezo = rezo;
    echanjData.montan = parseFloat(kantite);

    try {
        // Tcheke si moun nan merite rabè 9.5 HTG a
        await tchekeRabèByenveni();
        // Kalkile epi afiche rezime a nan modal la
        prepareRezimeModal();
    } catch (error) {
        console.error("Erè:", error);
        alert("Gen yon pwoblèm koneksyon. Verifye entènèt ou.");
    }
};

/**
 * 2. Lojik pou verifye si se premye echanj (Rabè)
 */
async function tchekeRabèByenveni() {
    const uid = auth.currentUser.uid;
    const transRef = ref(db, 'transactions');
    
    const snapshot = await get(transRef);
    let dejaFèEchanj = false;

    if (snapshot.exists()) {
        const data = snapshot.val();
        // Verifye si gen yon tranzaksyon 'echanj' ki 'completed' pou itilizatè sa
        dejaFèEchanj = Object.values(data).some(t => 
            t.uid === uid && t.type === 'echanj' && t.status === 'completed'
        );
    }

    // Si se premye echanj, nou ba l 9.5 HTG
    echanjData.rabe = dejaFèEchanj ? 0 : 9.5;
}

/**
 * 3. Ranpli done nan Modal Rezime a epi afiche l
 */
function prepareRezimeModal() {
    const freSistèm = echanjData.montan * echanjData.fre;
    const totalNet = (echanjData.montan - freSistèm) + echanjData.rabe;

    // Mete done yo nan HTML la
    document.getElementById('sum-minit').innerText = echanjData.montan.toFixed(2) + " HTG";
    document.getElementById('sum-fre').innerText = "-" + freSistèm.toFixed(2) + " HTG";
    
    const rabeBox = document.getElementById('box-rabe-premium');
    if (echanjData.rabe > 0) {
        rabeBox.classList.remove('hidden');
        document.getElementById('sum-rabe').innerText = "+" + echanjData.rabe.toFixed(2) + " HTG";
    } else {
        rabeBox.classList.add('hidden');
    }

    document.getElementById('sum-total').innerText = totalNet.toFixed(2) + " HTG";
    
    // Montre modal la
    document.getElementById('modal-confirm-echanj').classList.remove('hidden');
}

/**
 * 4. Fèmen Modal la
 */
window.femenModalEchanj = () => {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
};

/**
 * 5. Validasyon PIN ak deklanchman USSD
 */
const btnKonfime = document.getElementById('btn-konfime-final');
if (btnKonfime) {
    btnKonfime.onclick = async () => {
        const pinAntre = prompt("Antre PIN sekirite ou (4 chif):");
        
        if (!pinAntre) return;

        try {
            // Ale chache PIN ki anrejistre nan profil itilizatè a
            const pinRef = ref(db, `users/${auth.currentUser.uid}/pin`);
            const snapshot = await get(pinRef);
            
            if (snapshot.val() !== pinAntre) {
                alert("PIN sa a pa kòrèk. Tanpri re-eseye.");
                return;
            }

            // Prepare kòd USSD a
            let ussdKod = "";
            if (echanjData.rezo === 'digicel') {
                ussdKod = `*128*50947111123*${echanjData.montan}#`;
            } else {
                ussdKod = `*123*88888888*32160708*${echanjData.montan}#`;
            }

            // Anrejistre tranzaksyon an nan Firebase kòm 'pending'
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

            // Fèmen modal la epi ouvri dialer telefòn nan
            window.femenModalEchanj();
            window.location.href = "tel:" + encodeURIComponent(ussdKod);

        } catch (error) {
            alert("Erè sekirite: " + error.message);
        }
    };
              }
