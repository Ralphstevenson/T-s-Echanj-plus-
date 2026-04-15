import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let toutTranzaksyon = [];

/**
 * 1. Koute tranzaksyon itilizatè a an tan reyèl
 */
const kòmanseKouteIstorik = () => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const transRef = ref(db, 'transactions');
    const myTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));

    onValue(myTransQuery, (snapshot) => {
        toutTranzaksyon = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Konvèti objè a an tablo epi ajoute ID a, epi triye yo pa dat (pi resan anlè)
            toutTranzaksyon = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp);
        }
        // Depi done yo chanje nan Firebase, nou rafrechi sa ki nan ekran an
        window.aficheTranzaksyon('tout');
    });
};

/**
 * 2. Afiche done yo nan HTML la selon filtè a
 */
window.aficheTranzaksyon = (filte = 'tout') => {
    const veso = {
        tout: document.getElementById('list-tout'),
        echanj: document.getElementById('list-echanj'),
        retre: document.getElementById('list-retre'),
        echwe: document.getElementById('list-echwe')
    };

    // Netwaye tout lis yo anvan nou ranpli yo
    Object.values(veso).forEach(v => { if(v) v.innerHTML = ""; });

    if (toutTranzaksyon.length === 0) {
        if(veso.tout) veso.tout.innerHTML = '<p class="empty-msg">Ou poko gen okenn tranzaksyon.</p>';
        return;
    }

    toutTranzaksyon.forEach(t => {
        const kat = kreyeKatTranzaksyon(t);
        
        // 1. Toujou ajoute nan lis TOUT la
        if(veso.tout) veso.tout.appendChild(kat.cloneNode(true));

        // 2. Filtre pa tip (echanj oswa retre)
        if (t.type === 'echanj' && veso.echanj) {
            veso.echanj.appendChild(kat.cloneNode(true));
        } else if (t.type === 'retre' && veso.retre) {
            veso.retre.appendChild(kat.cloneNode(true));
        }

        // 3. Filtre sa ki echwe yo
        if ((t.status === 'failed' || t.status === 'cancelled' || t.status === 'echwe') && veso.echwe) {
            veso.echwe.appendChild(kat.cloneNode(true));
        }
    });

    // Si yon lis vid apre filtè a, mete mesaj "poko genyen"
    Object.keys(veso).forEach(key => {
        if (veso[key] && veso[key].children.length === 0) {
            veso[key].innerHTML = `<p class="empty-msg">Pa gen ${key} pou kounye a.</p>`;
        }
    });
};

/**
 * 3. Kreye HTML pou yon sèl tranzaksyon
 */
function kreyeKatTranzaksyon(t) {
    const div = document.createElement('div');
    // Nou mete status la nan class la pou CSS ka bay koulè (pending, completed, failed)
    div.className = `transaction-item ${t.status || 'pending'}`;
    
    // Ajoute evènman klike pou ouvri resi a
    div.addEventListener('click', () => window.ouvriResi(t));

    const icon = t.type === 'echanj' ? 'fa-rotate' : 'fa-money-bill-transfer';
    const dat = t.timestamp ? new Date(t.timestamp).toLocaleDateString('ht-HT', {day:'numeric', month:'short'}) : '---';

    div.innerHTML = `
        <div class="trans-icon-box">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="trans-details">
            <b>${t.type === 'echanj' ? (t.rezo || 'Echanj') : (t.method || 'Retrè')}</b>
            <small>${dat}</small>
        </div>
        <div class="trans-amount">
            <span class="amount-val">${parseFloat(t.amount).toFixed(2)} HTG</span>
            <span class="status-dot ${t.status || 'pending'}"></span>
        </div>
    `;
    return div;
}

/**
 * 4. Chanje Tab yo (Bouton Filtè yo)
 */
window.switchIstorik = (tab, btn) => {
    // 1. Retire klas 'active' nan tout bouton yo epi mete l sou sa nou klike a
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    // 2. Kache tout kontni yo
    document.querySelectorAll('.ist-content').forEach(c => c.classList.add('hidden'));
    
    // 3. Montre lis ki koresponn lan
    const targetList = document.getElementById(`list-${tab}`);
    if (targetList) {
        targetList.classList.remove('hidden');
    }
};

/**
 * 5. Jesyon Resi (Modal Receipt)
 */
window.ouvriResi = (t) => {
    const statusText = t.status || 'pending';
    document.getElementById('rec-status').innerText = statusText.toUpperCase();
    document.getElementById('rec-status').className = `status-badge-rec ${statusText}`;
    
    document.getElementById('rec-amount').innerText = parseFloat(t.amount).toFixed(2) + " HTG";
    document.getElementById('rec-method').innerText = t.rezo || t.method || "---";
    document.getElementById('rec-phone').innerText = t.receiver_phone || "Minit voye";
    document.getElementById('rec-date').innerText = t.timestamp ? new Date(t.timestamp).toLocaleString('ht-HT') : "---";
    document.getElementById('rec-id').innerText = t.id || "---";

    document.getElementById('modal-receipt').classList.remove('hidden');
};

window.closeReceipt = () => {
    document.getElementById('modal-receipt').classList.add('hidden');
};

/**
 * 6. Pataje Resi
 */
window.shareReceipt = () => {
    const montan = document.getElementById('rec-amount').innerText;
    const id = document.getElementById('rec-id').innerText;
    const text = `Echanj Plus - Prèv Tranzaksyon\nMontan: ${montan}\nID: ${id}\n\nMèsi paske ou fè nou konfyans!`;
    
    if (navigator.share) {
        navigator.share({ title: 'Resi Echanj Plus', text: text }).catch(console.error);
    } else {
        alert("Ops! Navigatè w la pa pèmèt pataje dirèkteman. Ou ka fè yon screenshot.");
    }
};

// Deklanche lè moun nan konekte oswa dekonekte
auth.onAuthStateChanged((user) => {
    if (user) {
        kòmanseKouteIstorik();
    } else {
        toutTranzaksyon = [];
        window.aficheTranzaksyon('tout');
    }
});
        
