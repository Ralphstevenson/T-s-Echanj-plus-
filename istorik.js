/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V5.6 (KREYÒL NET & FILTÈ DAT)
   ============================================================ */
import { db } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let allUserTransactions = []; // Stokaj global pou filtre pa dat
let activeTab = 'tout';

export function initIstorik(uid) {
    if (!uid) return;

    const transRef = ref(db, `transactions`);
    const userTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));
    
    onValue(userTransQuery, (snap) => {
        const data = snap.val();

        if (!data) {
            allUserTransactions = [];
            renderCurrentView();
            return;
        }

        // Transfòme ak klase pi nouvo an premye
        allUserTransactions = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        renderCurrentView();
    });
}

// Rekilke epi afiche sou tab ki aktif la
function renderCurrentView() {
    const selectedDate = document.getElementById('filter-date-input')?.value;
    
    // 1. Filtre pa dat si itilizatè a chwazi yon dat
    let filtered = [...allUserTransactions];
    if (selectedDate) {
        filtered = filtered.filter(t => {
            const itemDate = t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : t.date;
            return itemDate === selectedDate;
        });
    }

    // 2. Filtre pa kategori/onglè
    let listToRender = [];
    if (activeTab === 'tout') {
        listToRender = filtered;
    } else if (activeTab === 'echanj') {
        listToRender = filtered.filter(t => t.type === 'Echanj' && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
    } else if (activeTab === 'retre') {
        listToRender = filtered.filter(t => (t.type === 'Retrè' || t.type === 'Retre') && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
    } else if (activeTab === 'echwe') {
        listToRender = filtered.filter(t => ['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
    }

    // Netwaye tout div yo
    ['tout', 'echanj', 'retre', 'echwe'].forEach(s => {
        const el = document.getElementById(`list-${s}`);
        if (el) el.innerHTML = "";
    });

    renderCategorizedList(`list-${activeTab}`, listToRender);
}

// Gwoupman pa Jou, Semèn, Mwa, Pi ansyen (Tout tèks an Kreyòl)
function groupTransactionsByDate(transactions) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const groups = {
        today: [],
        thisWeek: [],
        thisMonth: [],
        older: []
    };

    transactions.forEach(t => {
        const time = t.timestamp || (t.date ? new Date(t.date).getTime() : 0);

        if (time >= startOfToday) {
            groups.today.push(t);
        } else if (time >= startOfWeek) {
            groups.thisWeek.push(t);
        } else if (time >= startOfMonth) {
            groups.thisMonth.push(t);
        } else {
            groups.older.push(t);
        }
    });

    return groups;
}

function renderCategorizedList(containerId, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px 20px; color:#757575;">
                <i class="fas fa-folder-open" style="font-size:42px; color:#ccc; margin-bottom:12px;"></i>
                <p style="font-size:14px; font-weight:600; margin:0; color:#555;">Poko gen okenn tranzaksyon nan pati sa a.</p>
                <small style="font-size:12px; color:#888;">Lè ou fè yon tranzaksyon, l ap parèt la a lafen.</small>
            </div>`;
        return;
    }

    const groups = groupTransactionsByDate(transactions);
    container.innerHTML = "";

    const groupTitles = [
        { key: 'today', title: "Jodi a" },
        { key: 'thisWeek', title: "Semèn sa a" },
        { key: 'thisMonth', title: "Mwa sa a" },
        { key: 'older', title: "Pi ansyen" }
    ];

    groupTitles.forEach(g => {
        const list = groups[g.key];
        if (list && list.length > 0) {
            const header = document.createElement('div');
            header.className = "time-group-header";
            header.style.cssText = "font-size: 12px; font-weight: 700; color: #007bff; margin: 15px 0 8px 4px; text-transform: uppercase; letter-spacing: 0.5px;";
            header.innerText = g.title;
            container.appendChild(header);

            list.forEach(t => {
                const montanAfiche = t.htg_to_receive || t.amount_sent || t.amount || 0;
                container.appendChild(createCardElement(t, montanAfiche));
            });
        }
    });
}

function createCardElement(t, montan) {
    let color = (t.status === "Validé" || t.status === "Success" || t.status === "Complété" || t.status === "Approuvé") ? "#28a745" : 
                (t.status === "En attente" || t.status === "Pending") ? "#ffc107" : "#dc3545";
    
    let icon = t.type === "Echanj" ? "fa-sync-alt" : "fa-arrow-circle-down";
    
    const div = document.createElement('div');
    div.className = "transaction-item";
    div.style.cssText = `border-left: 4px solid ${color}; cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px; margin-bottom:10px; background:#fff; border-radius:10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: transform 0.1s ease;`;
    
    const rezoText = t.rezo ? ` (${t.rezo.toUpperCase()})` : '';

    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="background:${color}18; color:${color}; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <b style="font-size:14px; color:#222; display:block;">${t.type}${rezoText}</b>
                <span style="font-size:12px; color:#777;">
                    ${t.date || (t.timestamp ? new Date(t.timestamp).toLocaleDateString('fr-FR') : '---')}
                </span>
            </div>
        </div>
        <div style="text-align:right;">
            <b style="font-size:15px; color:#111; display:block;">${montan} HTG</b>
            <span style="font-size:11px; color:${color}; font-weight:700;">● ${t.status || 'Nan atant'}</span>
        </div>`;

    div.onclick = () => window.viewReceipt(t);
    return div;
}

// Switch ant Onglè yo
window.switchIstorik = (targetId, btn) => {
    activeTab = targetId;
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    
    const target = document.getElementById(`list-${targetId}`);
    if (target) target.classList.remove('hidden');

    renderCurrentView();
};

// Filtre pa Dat
window.filterByDate = () => {
    renderCurrentView();
};

// Netwaye Filtè Dat la
window.clearDateFilter = () => {
    const input = document.getElementById('filter-date-input');
    if (input) input.value = '';
    renderCurrentView();
};

// Detay Resi
window.viewReceipt = (t) => {
    const montan = t.htg_to_receive || t.amount_sent || t.amount || 0;
    const dat = t.date || (t.timestamp ? new Date(t.timestamp).toLocaleString('fr-FR') : '---');
    const transID = t.transID || t.id || '---';
    const method = (t.rezo || t.method || t.provider || "---").toUpperCase();
    const phone = t.phone || t.number || "---";
    const status = t.status || "Nan atant";

    if (document.getElementById('rec-id')) document.getElementById('rec-id').innerText = transID;
    if (document.getElementById('rec-status')) {
        const statusBadge = document.getElementById('rec-status');
        statusBadge.innerText = status;
        statusBadge.style.color = (status === 'Validé' || status === 'Approuvé') ? '#28a745' : (status === 'Refusé' ? '#dc3545' : '#ffc107');
    }
    if (document.getElementById('rec-amount')) document.getElementById('rec-amount').innerText = montan + " HTG";
    if (document.getElementById('rec-method')) document.getElementById('rec-method').innerText = method;
    if (document.getElementById('rec-phone')) document.getElementById('rec-phone').innerText = phone;
    if (document.getElementById('rec-date')) document.getElementById('rec-date').innerText = dat;
    
    window.currentReceiptData = { transID, montan, method, phone, dat, status };
    document.getElementById('modal-receipt')?.classList.remove('hidden');
};

window.closeReceipt = () => {
    document.getElementById('modal-receipt')?.classList.add('hidden');
};

window.shareReceipt = async () => {
    const data = window.currentReceiptData;
    if (!data) return;

    const shareText = `🧾 *RESI TRANZAKSYON ECHANJ PLUS*\n` +
                      `--------------------------------\n` +
                      `🆔 ID: ${data.transID}\n` +
                      `💰 Montan: ${data.montan} HTG\n` +
                      `📲 Rezo: ${data.method}\n` +
                      `📞 Telefòn: ${data.phone}\n` +
                      `📅 Dat: ${data.dat}\n` +
                      `📌 Statut: ${data.status}\n` +
                      `--------------------------------\n` +
                      `Mèsi paske ou itilize Echanj Plus!`;

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Resi Echanj Plus', text: shareText });
        } catch (err) {}
    } else {
        navigator.clipboard.writeText(shareText);
        alert("✅ Resi a kopye nan presse-papier ou!");
    }
};
