import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let toutTranzaksyon = [];

/**
 * Chaje Istorik depi Firebase
 */
export function loadIstorik() {
    if (!auth.currentUser) return;

    const transRef = ref(db, 'transactions');
    const q = query(transRef, orderByChild('uid'), equalTo(auth.currentUser.uid));

    onValue(q, (snapshot) => {
        const data = snapshot.val();
        toutTranzaksyon = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : [];
        renderIstorik(toutTranzaksyon);
    });
}

/**
 * Afiche lis la nan HTML
 */
function renderIstorik(lis) {
    const container = document.getElementById('istorik-list');
    container.innerHTML = "";

    lis.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleDateString('fr-FR');
        const statusClass = `stat-${t.status}`;
        
        const card = document.createElement('div');
        card.className = 'trans-card';
        card.onclick = () => montreDetay(t);
        
        card.innerHTML = `
            <div class="trans-icon"><i class="fa ${t.type === 'echanj' ? 'fa-sync' : 'fa-arrow-up'}"></i></div>
            <div style="flex:1">
                <div style="display:flex; justify-content:space-between">
                    <b>${t.type === 'echanj' ? 'Echanj Minit' : 'Retrè Lajan'}</b>
                    <b class="${statusClass}">${t.amount} HTG</b>
                </div>
                <div style="display:flex; justify-content:space-between; font-size: 0.75rem; color:#888">
                    <span>${dateStr}</span>
                    <span class="${statusClass}" style="text-transform:uppercase">${t.status}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Filtre Tranzaksyon yo (Tout, Echanj, Retre, Refize)
 */
window.filterIstorik = (type, btn) => {
    // Chanje bouton active
    document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (type === 'all') {
        renderIstorik(toutTranzaksyon);
    } else if (type === 'refize') {
        renderIstorik(toutTranzaksyon.filter(t => t.status === 'refize'));
    } else {
        renderIstorik(toutTranzaksyon.filter(t => t.type === type));
    }
};

/**
 * Montre Modal Detay pou Pataje
 */
function montreDetay(t) {
    document.getElementById('detay-tip').innerText = t.type.toUpperCase();
    document.getElementById('detay-dat').innerText = new Date(t.timestamp).toLocaleString();
    document.getElementById('detay-montan').innerText = t.amount + " HTG";
    document.getElementById('detay-status').innerText = t.status.toUpperCase();
    
    document.getElementById('modal-detay-trans').classList.remove('hidden');
}

window.closeDetay = () => document.getElementById('modal-detay-trans').classList.add('hidden');

/**
 * Fonksyon Pataje (Screenshot/Text)
 */
window.shareReceipt = async () => {
    const tip = document.getElementById('detay-tip').innerText;
    const montan = document.getElementById('detay-montan').innerText;
    const status = document.getElementById('detay-status').innerText;

    const textToShare = `ECHANJ PLUS - RESI\n----------------\nTip: ${tip}\nMontan: ${montan}\nStatus: ${status}\n\nMèsi pou konfyans ou!`;

    if (navigator.share) {
        navigator.share({ title: 'Resi Echanj Plus', text: textToShare });
    } else {
        alert("Opsyon pataje a pa disponib sou navigatè sa a, men men resi w la: \n\n" + textToShare);
    }
};
