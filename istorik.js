import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let toutTranzaksyon = [];

// 1. Tann itilizatè a fin konekte anvan nou mande done yo
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Koneksyon etabli pou:", user.uid);
        initIstorik(user.uid);
    } else {
        console.log("Itilizatè pa konekte.");
        document.getElementById('istorik-list').innerHTML = "<p class='msg-istorik'>Tanpri konekte pou wè istorik ou.</p>";
    }
});

/**
 * 2. Fonksyon pou rale done yo nan Firebase
 */
function initIstorik(uid) {
    const transRef = ref(db, 'transactions');
    
    // NOUVO: Filtre a dwe fèt bò Firebase la pou respekte règleman sekirite yo
    const q = query(transRef, orderByChild('uid'), equalTo(uid));

    onValue(q, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // Konvèti objè Firebase la an tablo epi triye pa dat (pi resan anlè)
            toutTranzaksyon = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
            renderIstorik(toutTranzaksyon);
        } else {
            document.getElementById('istorik-list').innerHTML = "<p class='msg-istorik'>Ou pa gen okenn tranzaksyon ankò.</p>";
        }
    }, (error) => {
        console.error("Erè sekirite oswa endèks:", error);
        document.getElementById('istorik-list').innerHTML = "<p class='msg-error'>Erè nan chaje done. Tcheke Console la.</p>";
    });
}

/**
 * 3. Fonksyon pou afiche lis la nan HTML
 */
function renderIstorik(lis) {
    const container = document.getElementById('istorik-list');
    container.innerHTML = ""; 

    lis.forEach(t => {
        const d = new Date(t.timestamp);
        const datFome = d.toLocaleDateString('fr-FR') + " " + d.getHours() + ":" + d.getMinutes();
        
        const statusClass = `stat-${t.status}`; // stat-pending, stat-valide, stat-refize
        
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
                    <span>${datFome}</span>
                    <span class="${statusClass}" style="text-transform:uppercase; font-weight:bold;">${t.status}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * 4. Sistèm Filtre (Tout, Echanj, Retrè, Refize)
 */
window.filterIstorik = (type, btn) => {
    // Chanje bouton ki aktif la
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
 * 5. Detay pou Pataje (Modal)
 */
function montreDetay(t) {
    document.getElementById('detay-tip').innerText = t.type.toUpperCase();
    document.getElementById('detay-dat').innerText = new Date(t.timestamp).toLocaleString();
    document.getElementById('detay-montan').innerText = t.amount + " HTG";
    document.getElementById('detay-status').innerText = t.status.toUpperCase();
    
    document.getElementById('modal-detay-trans').classList.remove('hidden');
}

window.closeDetay = () => document.getElementById('modal-detay-trans').classList.add('hidden');
    
