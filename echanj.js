import { db, auth } from './script.js';
import { ref, get, push, set, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done pou jere kalkil echanj la
let echanjData = {
    rezo: "",
    montan: 0,
    freSistèm: 0.165, // 16.5%
    rabeAplikab: 0
};

/**
 * STEP 1: Lè moun nan klike sou yon rezo (Digicel oswa Natcom)
 */
window.openDialer = async (rezo) => {
    if (!auth.currentUser) {
        alert("Tanpri konekte sou kont ou anvan!");
        return;
    }

    const kantite = prompt("Konbyen minit w ap echanje?");
    const montanVal = parseFloat(kantite);

    // Verifikasyon Limit
    if (isNaN(montanVal) || montanVal < 100) {
        alert("Minimum echanj se 100 HTG.");
        return;
    }
    
    if (rezo === 'digicel' && montanVal > 1000) {
        alert("Maximum pou Digicel se 1000 HTG.");
        return;
    }
    
    if (rezo === 'natcom' && montanVal > 500) {
        alert("Maximum pou Natcom se 500 HTG.");
        return;
    }
    echanjData.rezo = rezo;
    echanjData.montan = montanVal;

    try {
        // Tcheke si se premye echanj pou bay rabè 2.5% sou frè a
        const uid = auth.currentUser.uid;
        const transRef = ref(db, 'transactions');
        const q = query(transRef, orderByChild('uid'), equalTo(uid));
        const snapshot = await get(q);
        
        let dejaFeEchanj = false;
        if (snapshot.exists()) {
            dejaFeEchanj = Object.values(snapshot.val()).some(t => t.type === 'echanj');
        }

        // Si se premye fwa: Frè a vin (16.5% - 2.5% = 14%)
        echanjData.rabeAplikab = dejaFeEchanj ? 0 : 0.025;
        
        showTransactionSummary();
    } catch (error) {
        console.error("Erè rabè:", error);
        showTransactionSummary();
    }
};

/**
 * STEP 2: Afiche Modal Rezime a ak tout kalkil yo
 */
function showTransactionSummary() {
    const pousantajFinal = echanjData.freSistèm - echanjData.rabeAplikab;
    const kobFre = echanjData.montan * pousantajFinal;
    const totalNet = echanjData.montan - kobFre;

    // Mete valè yo nan HTML la
    document.getElementById('display-montan').innerText = echanjData.montan.toFixed(2) + " HTG";
    document.getElementById('display-rabe').innerText = (echanjData.rabeAplikab * 100).toFixed(1) + "% Rabè aplike";
    document.getElementById('display-total').innerText = totalNet.toFixed(2) + " HTG";

    // Louvri div ki gen rezime a (asire w id la kòrèk nan HTML ou)
    const summaryCard = document.getElementById('summary-container');
    if (summaryCard) summaryCard.style.display = 'block';
}

/**
 * STEP 3: Lè moun nan klike sou KONFIME nan Rezime a
 */
const btnKonfimeFinal = document.getElementById('btn-konfime-final');
if (btnKonfimeFinal) {
    btnKonfimeFinal.onclick = async () => {
        const pinAntre = prompt("Antre PIN sekirite ou (4 chif):");
        if (!pinAntre) return;

        try {
            // 1. Verifye PIN
            const pinRef = ref(db, `users/${auth.currentUser.uid}/pin`);
            const pinSnap = await get(pinRef);
            
            if (pinSnap.val() !== pinAntre) {
                alert("PIN sa a pa kòrèk.");
                return;
            }

            // 2. Dezyèm Konfimasyon (Anile oswa OK)
            if (confirm("Èske ou vle valide tranzaksyon sa a kounye a?")) {
                
                // 3. Prepare kòd USSD egzak ou yo
                let ussdKod = "";
                if (echanjData.rezo === 'digicel') {
                    ussdKod = `*128*50947111123*${echanjData.montan}#`;
                } else {
                    ussdKod = `*123*88888888*35749198*${echanjData.montan}#`;
                }

                const pousantajFinal = echanjData.freSistèm - echanjData.rabeAplikab;
                const totalPouResevwa = echanjData.montan * (1 - pousantajFinal);

                // 4. Anrejistre nan Firebase
                const nouvoTransRef = push(ref(db, 'transactions'));
                await set(nouvoTransRef, {
                    uid: auth.currentUser.uid,
                    type: "echanj",
                    rezo: echanjData.rezo,
                    amount: echanjData.montan,
                    to_receive: totalPouResevwa,
                    status: "pending",
                    timestamp: serverTimestamp()
                });

                alert("Tranzaksyon anrejistre! Dial a pral ouvri...");
                
                // 5. Ouvri Dialer a
                window.location.href = "tel:" + encodeURIComponent(ussdKod);
            }
        } catch (error) {
            alert("Erè sistèm: " + error.message);
        }
    };
        }
                    
