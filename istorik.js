/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V5.5 (OPTIMIZÉ AK KATEGORI TAN)
   ============================================================ */
import { db } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon sa a rele depi nan script.js lè itilizatè a konekte
export function initIstorik(uid) {
    if (!uid) return;

    // 1. Vize branch 'transactions' ak Query filtre pa 'uid'
    const transRef = ref(db, `transactions`);
    const userTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));
    
    onValue(userTransQuery, (snap) => {
        // Netwaye tout lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if (el) el.innerHTML = "";
        });

        const data = snap.val();

        if (!data) {
            showEmptyMsg();
            return;
        }

        // 2. Transfòme done yo an lis epi klase yo depi sou pi nouvo a
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // 3. Afiche tranzaksyon yo ak gwoupman pa Jou, Semèn, Mwa, Ane
        renderCategorizedList('list-tout', myTrans);

        // Distribye nan lòt tab yo filtre pa kategori
        const echweTrans = myTrans.filter(t => ['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
        const echanjTrans = myTrans.filter(t => t.type === 'Echanj' && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
        const retreTrans = myTrans.filter(t => (t.type === 'Retrè' || t.type === 'Retre') && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));

        renderCategorizedList('list-echanj', echanjTrans);
        renderCategorizedList('list-retre', retreTrans);
        renderCategorizedList('list-echwe', echweTrans);

    });
}

/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V5.5 (OPTIMIZÉ AK KATEGORI TAN)
   ============================================================ */
import { db } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon sa a rele depi nan script.js lè itilizatè a konekte
export function initIstorik(uid) {
    if (!uid) return;

    // 1. Vize branch 'transactions' ak Query filtre pa 'uid'
    const transRef = ref(db, `transactions`);
    const userTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));
    
    onValue(userTransQuery, (snap) => {
        // Netwaye tout lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if (el) el.innerHTML = "";
        });

        const data = snap.val();

        if (!data) {
            showEmptyMsg();
            return;
        }

        // 2. Transfòme done yo an lis epi klase yo depi sou pi nouvo a
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // 3. Afiche tranzaksyon yo ak gwoupman pa Jou, Semèn, Mwa, Ane
        renderCategorizedList('list-tout', myTrans);

        // Distribye nan lòt tab yo filtre pa kategori
        const echweTrans = myTrans.filter(t => ['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
        const echanjTrans = myTrans.filter(t => t.type === 'Echanj' && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));
        const retreTrans = myTrans.filter(t => (t.type === 'Retrè' || t.type === 'Retre') && !['Refusé', 'Annulé', 'Echoué', 'Echwe'].includes(t.status));

        renderCategorizedList('list-echanj', echanjTrans);
        renderCategorizedList('list-retre', retreTrans);
        renderCategorizedList('list-echwe', echweTrans);

    });
}

// Fonksyon pou kreye gwoup tan (Jodi a, Semèn sa a, Mwa sa a, Pi ansyen)
function groupTransactionsByDate(transactions) {
    const now = new Date();
    
    // Konfigirasyon kòmansman jodi a (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Konfigirasyon kòmansman semèn sa a (Dimanch / Lendi)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    
    // Konfigirasyon kòmansman mwa sa a
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

// Fonksyon pou afiche lis ki gen tit tan yo (Headers)
function renderCategorizedList(containerId, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:30px; color:#757575;">
                <i class="fas fa-folder-open" style="font-size:30px; margin-bottom:10px;"></i>
                <p style="font-size:14px; margin:0;">Poko gen aktivite nan kategori sa a.</p>
            </div>`;
        return;
    }

    const groups = groupTransactionsByDate(transactions);
    container.innerHTML = ""; // Netwaye anvan genyen

    const groupTitles = [
        { key: 'today', title: "Jodi a" },
        { key: 'thisWeek', title: "Semèn sa a" },
        { key: 'thisMonth', title: "Mwa sa a" },
        { key: 'older', title: "Plus ansyen" }
    ];

    groupTitles.forEach(g => {
        const list = groups[g.key];
        if (list && list.length > 0) {
            // Kreye Tit Gwoup la (Eg: Jodi a, Semèn sa a)
            const header = document.createElement('div');
            header.className = "time-group-header";
            header.style.cssText = "font-size: 13px; font-weight: 700; color: #555; margin: 15px 0 8px 5px; text-transform: uppercase; letter-spacing: 0.5px;";
            header.innerText = g.title;
            container.appendChild(header);

            // Kreye kat tranzaksyon yo pou gwoup sa a
            list.forEach(t => {
                const montanAfiche = t.htg_to_receive || t.amount_sent || t.amount || 0;
                const cardElement = createCardElement(t, montanAfiche);
                container.appendChild(cardElement);
            });
        }
    });
}

// Fonksyon pou kreye kat tranzaksyon yo ak stil ak kout klike yo
function createCardElement(t, montan) {
    let color = (t.status === "Validé" || t.status === "Success" || t.status === "Complété" || t.status === "Approuvé") ? "#36b37e" : 
                (t.status === "En attente" || t.status === "Pending") ? "#ffab00" : "#ff5630";
    
    let icon = t.type === "Echanj" ? "fa-rotate" : "fa-money-bill-transfer";
    
    const div = document.createElement('div');
    div.className = "transaction-item";
    div.style.cssText = `border-left: 4px solid ${color}; cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; background:#fff; border-radius:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);`;
    
    const rezoText = t.rezo ? ` (${t.rezo.toUpperCase()})` : '';

    div.innerHTML = `
        <div class="trans-info-left" style="display:flex; align-items:center; gap:12px; flex:1;">
            <div class="icon-circle" style="background:${color}15; color:${color}; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <b class="trans-type-text" style="font-size:14px; color:#1a1a1a;">${t.type}${rezoText}</b>
                <div class="trans-date-text" style="font-size:12px; color:#757575; margin-top:2px;">
                    ${t.date || (t.timestamp ? new Date(t.timestamp).toLocaleDateString('fr-FR') : '---')}
                </div>
            </div>
        </div>
        <div class="trans-info-right" style="text-align:right;">
            <b class="trans-amount-text" style="font-size:15px; color:#1a1a1a;">${montan} HTG</b>
            <div class="trans-status-text" style="font-size:12px; color:${color}; font-weight:600; margin-top:2px;">● ${t.status || 'En attente'}</div>
        </div>`;

    // Lè moun nan klike sou kat la, li ouvri detay resi a
    div.onclick = () => window.viewReceipt(t);
    return div;
}

// Afiche mesaj vid si pa gen okenn tranzaksyon
function showEmptyMsg() {
    const emptyHTML = `
        <div class="empty-state" style="text-align:center; padding:40px; color:#757575;">
            <i class="fas fa-folder-open" style="font-size:40px; margin-bottom:15px;"></i>
            <p>Poko gen okenn tranzaksyon nan kont sa a.</p>
        </div>`;
    const sections = ['tout', 'echanj', 'retre', 'echwe'];
    sections.forEach(s => {
        const el = document.getElementById(`list-${s}`);
        if (el) el.innerHTML = emptyHTML;
    });
}

// Jere switch ant tabs yo (Tout, Echanj, Retrè, Echwe)
window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    
    const target = document.getElementById(`list-${targetId}`);
    if (target) target.classList.remove('hidden');
};

// --- AFICHE DETAY AK PATAJE / TELECHAJMAN PDF ---
window.viewReceipt = (t) => {
    const montan = t.htg_to_receive || t.amount_sent || t.amount || 0;
    const dat = t.date || (t.timestamp ? new Date(t.timestamp).toLocaleString('fr-FR') : '---');
    const transID = t.transID || t.id || '---';
    const method = (t.rezo || t.method || t.provider || "---").toUpperCase();
    const phone = t.phone || t.number || "---";
    const status = t.status || "En attente";

    if (document.getElementById('rec-id')) document.getElementById('rec-id').innerText = transID;
    if (document.getElementById('rec-status')) {
        const statusBadge = document.getElementById('rec-status');
        statusBadge.innerText = status;
        statusBadge.style.color = (status === 'Validé' || status === 'Approuvé') ? '#22c55e' : (status === 'Refusé' ? '#ef4444' : '#f59e0b');
    }
    if (document.getElementById('rec-amount')) document.getElementById('rec-amount').innerText = montan + " HTG";
    if (document.getElementById('rec-method')) document.getElementById('rec-method').innerText = method;
    if (document.getElementById('rec-phone')) document.getElementById('rec-phone').innerText = phone;
    if (document.getElementById('rec-date')) document.getElementById('rec-date').innerText = dat;
    
    window.currentReceiptData = { transID, montan, method, phone, dat, status };

    document.getElementById('modal-receipt')?.classList.remove('hidden');
};

// Fonksyon pou fèmen Modal Resi a
window.closeReceipt = () => {
    document.getElementById('modal-receipt')?.classList.add('hidden');
};

// Fonksyon pou pataje resi
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
            await navigator.share({
                title: 'Resi Echanj Plus',
                text: shareText
            });
        } catch (err) {
            console.log("Pataje anile.");
        }
    } else {
        navigator.clipboard.writeText(shareText);
        alert("✅ Resi a kopye nan presse-papier ou! Ou ka kole l sou WhatsApp.");
    }
};
￼Enterksyon pou kreye gwoup tan (Jodi a, Semèn sa a, Mwa sa a, Pi ansyen)
function groupTransactionsByDate(transactions) {
    const now = new Date();
    
    // Konfigirasyon kòmansman jodi a (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Konfigirasyon kòmansman semèn sa a (Dimanch / Lendi)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    
    // Konfigirasyon kòmansman mwa sa a
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

// Fonksyon pou afiche lis ki gen tit tan yo (Headers)
function renderCategorizedList(containerId, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:30px; color:#757575;">
                <i class="fas fa-folder-open" style="font-size:30px; margin-bottom:10px;"></i>
                <p style="font-size:14px; margin:0;">Poko gen aktivite nan kategori sa a.</p>
            </div>`;
        return;
    }

    const groups = groupTransactionsByDate(transactions);
    container.innerHTML = ""; // Netwaye anvan genyen

    const groupTitles = [
        { key: 'today', title: "Jodi a" },
        { key: 'thisWeek', title: "Semèn sa a" },
        { key: 'thisMonth', title: "Mwa sa a" },
        { key: 'older', title: "Plus ansyen" }
    ];

    groupTitles.forEach(g => {
        const list = groups[g.key];
        if (list && list.length > 0) {
            // Kreye Tit Gwoup la (Eg: Jodi a, Semèn sa a)
            const header = document.createElement('div');
            header.className = "time-group-header";
            header.style.cssText = "font-size: 13px; font-weight: 700; color: #555; margin: 15px 0 8px 5px; text-transform: uppercase; letter-spacing: 0.5px;";
            header.innerText = g.title;
            container.appendChild(header);

            // Kreye kat tranzaksyon yo pou gwoup sa a
            list.forEach(t => {
                const montanAfiche = t.htg_to_receive || t.amount_sent || t.amount || 0;
                const cardElement = createCardElement(t, montanAfiche);
                container.appendChild(cardElement);
            });
        }
    });
}

// Fonksyon pou kreye kat tranzaksyon yo ak stil ak kout klike yo
function createCardElement(t, montan) {
    let color = (t.status === "Validé" || t.status === "Success" || t.status === "Complété" || t.status === "Approuvé") ? "#36b37e" : 
                (t.status === "En attente" || t.status === "Pending") ? "#ffab00" : "#ff5630";
    
    let icon = t.type === "Echanj" ? "fa-rotate" : "fa-money-bill-transfer";
    
    const div = document.createElement('div');
    div.className = "transaction-item";
    div.style.cssText = `border-left: 4px solid ${color}; cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; background:#fff; border-radius:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);`;
    
    const rezoText = t.rezo ? ` (${t.rezo.toUpperCase()})` : '';

    div.innerHTML = `
        <div class="trans-info-left" style="display:flex; align-items:center; gap:12px; flex:1;">
            <div class="icon-circle" style="background:${color}15; color:${color}; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
