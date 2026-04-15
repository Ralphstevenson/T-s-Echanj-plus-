import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
            // Konvèti objè a an tablo epi ajoute ID a
            toutTranzaksyon = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp); // Montre pi resan yo an premye
        }
        aficheTranzaksyon('tout');
    });
};

/**
 * 2. Afiche done yo nan HTML la selon filtè a
 */
window.aficheTranzaksyon = (filte) => {
    const veso = {
        tout: document.getElementById('list-tout'),
        echanj: document.getElementById('list-echanj'),
        retre: document.getElementById('list-retre'),
        echwe: document.getElementById('list-echwe')
    };

    // Netwaye veso yo
    Object.values(veso).forEach(v => { if(v) v.innerHTML = ""; });

    if (toutTranzaksyon.length === 0) {
        veso.tout.innerHTML = '<p class="empty-msg">Ou poko gen okenn tranzaksyon.</p>';
        return;
    }

    toutTranzaksyon.forEach(t => {
        const kat = kreyeKatTranzaksyon(t);
        
        // Ajoute nan lis "TOUT" la
        veso.tout.appendChild(kat.cloneNode(true));

        // Filtre pou lòt kategori yo
        if (t.type === 'echanj') veso.echanj.appendChild(kat.cloneNode(true));
        if (t.type === 'retre') veso.retre.appendChild(kat.cloneNode(true));
        if (t.status === 'failed' || t.status === 'cancelled') veso.echwe.appendChild(kat.cloneNode(true));
    });
};

/**
 * 3. Kreye HTML pou yon sèl tranzaksyon
 */
function kreyeKatTranzaksyon(t) {
    const div = document.createElement('div');
    div.className = `transaction-item ${t.status}`;
    div.onclick = () => ouvriResi(t);

    const icon = t.type === 'echanj' ? 'fa-rotate' : 'fa-money-bill-transfer';
    const dat = t.timestamp ? new Date(t.timestamp).toLocaleDateString('ht-HT') : '---';

    div.innerHTML = `
        <div class="trans-icon-box">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="trans-details">
            <b>${t.type.toUpperCase()} - ${t.rezo || t.method}</b>
            <small>${dat}</small>
        </div>
        <div class="trans-amount">
            <span class="amount-val">${t.amount} HTG</span>
            <span class="status-dot ${t.status}"></span>
        </div>
    `;
    return div;
}

/**
 * 4. Chanje Tab yo
 */
window.switchIstorik = (tab, btn) => {
    // Jere bouton active
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Jere kontni ki parèt
    document.querySelectorAll('.ist-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`list-${tab}`).classList.remove('hidden');
};

/**
 * 5. Jesyon Resi (Modal Receipt)
 */
window.ouvriResi = (t) => {
    document.getElementById('rec-status').innerText = t.status.toUpperCase();
    document.getElementById('rec-status').className = `status-badge-rec ${t.status}`;
    document.getElementById('rec-amount').innerText = t.amount.toFixed(2) + " HTG";
    document.getElementById('rec-method').innerText = t.rezo || t.method;
    document.getElementById('rec-phone').innerText = t.receiver_phone || "Sistèm";
    document.getElementById('rec-date').innerText = new Date(t.timestamp).toLocaleString();
    document.getElementById('rec-id').innerText = t.id;

    document.getElementById('modal-receipt').classList.remove('hidden');
};

window.closeReceipt = () => {
    document.getElementById('modal-receipt').classList.add('hidden');
};

// Deklanche lè moun nan konekte
auth.onAuthStateChanged((user) => {
    if (user) kòmanseKouteIstorik();
});

