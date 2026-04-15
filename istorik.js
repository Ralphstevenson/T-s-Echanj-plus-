import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let toutTranzaksyon = [];

const kòmanseKouteIstorik = () => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    // Asire w li rele 'transactions' ak yon S pou l matche ak Firebase ou
    const transRef = ref(db, 'transactions'); 
    const myTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));

    onValue(myTransQuery, (snapshot) => {
        toutTranzaksyon = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            toutTranzaksyon = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp);
        }
        window.aficheTranzaksyon('tout');
    }, (error) => {
        console.error("Erè Firebase:", error);
    });
};

window.aficheTranzaksyon = (filte) => {
    const veso = {
        tout: document.getElementById('list-tout'),
        echanj: document.getElementById('list-echanj'),
        retre: document.getElementById('list-retre'),
        echwe: document.getElementById('list-echwe')
    };

    Object.values(veso).forEach(v => { if(v) v.innerHTML = ""; });

    if (toutTranzaksyon.length === 0) {
        veso.tout.innerHTML = '<p class="empty-msg">Ou poko gen okenn tranzaksyon.</p>';
        return;
    }

    toutTranzaksyon.forEach(t => {
        const kat = kreyeKatTranzaksyon(t);
        
        // Nou konvèti type la an miniskil pou konparezon an toujou mache
        const tipMinit = t.type ? t.type.toLowerCase() : '';
        const statusMinit = t.status ? t.status.toLowerCase() : '';

        veso.tout.appendChild(kat.cloneNode(true));

        if (tipMinit === 'echanj') veso.echanj.appendChild(kat.cloneNode(true));
        if (tipMinit === 'retre') veso.retre.appendChild(kat.cloneNode(true));
        if (statusMinit === 'failed' || statusMinit === 'cancelled' || statusMinit === 'echwe') {
            veso.echwe.appendChild(kat.cloneNode(true));
        }
    });
};

function kreyeKatTranzaksyon(t) {
    const div = document.createElement('div');
    // Nou netwaye status la pou CSS ka li l (Validé -> valide)
    const klasStatus = t.status ? t.status.toLowerCase().replace('é', 'e') : 'pending';
    div.className = `transaction-item ${klasStatus}`;
    div.onclick = () => window.ouvriResi(t);

    const icon = (t.type && t.type.toLowerCase() === 'echanj') ? 'fa-rotate' : 'fa-money-bill-transfer';
    const dat = t.timestamp ? new Date(t.timestamp).toLocaleDateString('ht-HT') : '---';

    div.innerHTML = `
        <div class="trans-icon-box">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="trans-details">
            <b>${t.type ? t.type.toUpperCase() : 'TRANZAKSYON'} - ${t.rezo || t.method || ''}</b>
            <small>${dat}</small>
        </div>
        <div class="trans-amount">
            <span class="amount-val">${t.amount} HTG</span>
            <span class="status-dot ${klasStatus}"></span>
        </div>
    `;
    return div;
}

window.switchIstorik = (tab, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.ist-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`list-${tab}`).classList.remove('hidden');
};

window.ouvriResi = (t) => {
    document.getElementById('rec-status').innerText = (t.status || '---').toUpperCase();
    document.getElementById('rec-status').className = `status-badge-rec ${(t.status || 'pending').toLowerCase()}`;
    document.getElementById('rec-amount').innerText = t.amount + " HTG";
    document.getElementById('rec-method').innerText = t.rezo || t.method || '---';
    document.getElementById('rec-phone').innerText = t.receiver_phone || "Sistèm";
    document.getElementById('rec-date').innerText = t.timestamp ? new Date(t.timestamp).toLocaleString() : '---';
    document.getElementById('rec-id').innerText = t.id;
    document.getElementById('modal-receipt').classList.remove('hidden');
};

window.closeReceipt = () => document.getElementById('modal-receipt').classList.add('hidden');

auth.onAuthStateChanged((user) => {
    if (user) kòmanseKouteIstorik();
});
                            
