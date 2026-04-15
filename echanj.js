import { db, auth } from './script.js';
import { ref, get, push, set, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done pou jere kalkil echanj la
let echanjData = {
    rezo: "",
    montan: 0,
    fre: 0.165, // Frè sistèm 16.5%
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
        // Tcheke rabè san bloke baz de done a
        const uid = auth.currentUser.uid;
        const transRef = ref(db, 'transactions');
        const rabeQuery = query(transRef, orderByChild('uid'), equalTo(uid));
        
        const snapshot = await get(rabeQuery);
        let dejaFèEchanj = false;

        if (snapshot.exists()) {
            const transactions = snapshot.val();
            // Verifye si gen yon echanj ki 'completed' deja
            dejaFèEchanj = Object.values(transactions).some(t => 
                t.type === 'echanj' && t.status === 'completed'
            );
        }

        // Rabè 9.5 HTG pou premye fwa
        echanjData.rabe = dejaFèEchanj ? 0 : 9.5;

        // Afiche rezime a
        prepareRezimeModal();

    } catch (error) {
        console.error("Erè rabè:", error);
        // Si gen yon erè, nou kontinye san rabè pou nou pa bloke itilizatè a
        echanjData.rabe = 0;
        prepareRezimeModal();
    }
};

/**
 * 2. Ranpli done nan Modal Rezime a
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
 * 3. Fèmen Modal la
 */
window.femenModalEchanj = () => {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
};

/**
 * 4. Konfimasyon final, PIN, ak USSD
 */
const btnKonfime = document.getElementById('btn-konfime-final');
if (btnKonfime) {
    btnKonfime.onclick = async () => {
        const pinAntre = prompt("Antre PIN sekirite ou (4 chif):");
        
        if (!pinAntre) return;

        try {
            // Verifye PIN nan profil la
            const pinRef = ref(db, `users/${auth.currentUser.uid}/pin`);
            const snapshot = await get(pinRef);
            
            if (snapshot.val() !== pinAntre) {
                alert("PIN sa a pa kòrèk.");
                return;
            }

            // Prepare kòd USSD a
            let ussdKod = (echanjData.rezo === 'digicel') 
                ? `*128*50947111123*${echanjData.montan}#` 
                : `*123*88888888*32160708*${echanjData.montan}#`;

            // Anrejistre tranzaksyon an
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

            // Fèmen modal epi deklanche dialer a
            window.femenModalEchanj();
            window.location.href = "tel:" + encodeURIComponent(ussdKod);

        } catch (error) {
            alert("Erè: " + error.message);
        }
    };
            }
    
