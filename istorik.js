/* ============================================================
   JS ISTORIK FINAL & KONPLÈ - ECHANJ PLUS
   ============================================================ */
import { getDatabase, ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Variab pou jere eta (State)
let allUserTransactions = [];
let activeTab = 'tout';
let currentReceiptData = null;

// Chèche instances Firebase yo
const auth = getAuth();
const db = getDatabase();

// Ekoutè sou eta atantifikasyon an
onAuthStateChanged(auth, (user) => {
  if (user) {
    initIstorik(user.uid);
  } else {
    clearUI();
  }
});

/**
 * Chaje ak koute tranzaksyon itilizatè a an tan reyèl nan Firebase
 * @param {string} uid - ID itilizatè a
 */
export function initIstorik(uid) {
  if (!uid) return;

  const transRef = ref(db, 'transactions');
  const userTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));

  // Koute chanjman an tan reyèl
  onValue(userTransQuery, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      allUserTransactions = [];
      renderCurrentView();
      return;
    }

    // Convertir objet an tableau ak triye soti nan pi resan rive nan pi ansyen
    allUserTransactions = Object.keys(data)
      .map((key) => ({ id: key, ...data[key] }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    renderCurrentView();
  }, (error) => {
    console.error("Erè lè n ap chaje tranzaksyon yo:", error);
  });
}

/**
 * Filtre epi afiche tranzaksyon yo dapre onglet ak dat ki chwazi a
 */
function renderCurrentView() {
  const selectedDate = document.getElementById('filter-date-input')?.value;

  // 1. Filtre pa dat si yon dat chwazi
  let filtered = [...allUserTransactions];
  if (selectedDate) {
    filtered = filtered.filter((t) => {
      const itemDate = t.timestamp 
        ? new Date(t.timestamp).toISOString().split('T')[0] 
        : t.date;
      return itemDate === selectedDate;
    });
  }

  // 2. Filtre pa kategori (Onglet)
  let listToRender = [];
  if (activeTab === 'tout') {
    listToRender = filtered;
  } else if (activeTab === 'echanj') {
    listToRender = filtered.filter((t) => 
      t.type === 'Echanj' && !isFailedStatus(t.status)
    );
  } else if (activeTab === 'retre') {
    listToRender = filtered.filter((t) => 
      (t.type === 'Retrè' || t.type === 'Retre') && !isFailedStatus(t.status)
    );
  } else if (activeTab === 'echwe') {
    listToRender = filtered.filter((t) => isFailedStatus(t.status));
  }

  // Vide tout kontni anvan afichaj
  ['tout', 'echanj', 'retre', 'echwe'].forEach((s) => {
    const el = document.getElementById(`list-${s}`);
    if (el) el.innerHTML = "";
  });

  // Afiche lis filtre a
  renderCategorizedList(`list-${activeTab}`, listToRender);
}

/**
 * Tcheke si yon statut konsidere kòm echwe
 */
function isFailedStatus(status) {
  const failedList = ['Refusé', 'Annulé', 'Echoué', 'Echwe', 'Refuse', 'Annule'];
  return failedList.includes(status);
}

/**
 * Gwoupe tranzaksyon yo pa peryòd tan (Jodi a, Semèn sa a, Mwa sa a, Pi ansyen)
 */
function groupTransactionsByDate(transactions) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const groups = { today: [], thisWeek: [], thisMonth: [], older: [] };

  transactions.forEach((t) => {
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

/**
 * Afiche liss tranzaksyon an nan veso DOM lan
 */
function renderCategorizedList(containerId, transactions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>Poko gen okenn tranzaksyon nan pati sa a.</p>
        <small>Lè ou fè yon tranzaksyon, l ap parèt la a lafen.</small>
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

  groupTitles.forEach((g) => {
    const list = groups[g.key];
    if (list && list.length > 0) {
      const header = document.createElement('div');
      header.className = "time-group-header";
      header.innerText = g.title;
      container.appendChild(header);

      list.forEach((t) => {
        const montan = t.htg_to_receive || t.amount_sent || t.amount || 0;
        container.appendChild(createCardElement(t, montan));
      });
    }
  });
}

/**
 * Kreye ti kat pou chak tranzaksyon
 */
function createCardElement(t, montan) {
  const isValid = ['Validé', 'Success', 'Complété', 'Approuvé', 'Valide'].includes(t.status);
  const isPending = ['En attente', 'Pending', 'Atant'].includes(t.status);
  
  const color = isValid ? "#28a745" : (isPending ? "#ffc107" : "#dc3545");
  const icon = (t.type === "Echanj") ? "fa-sync-alt" : "fa-arrow-circle-down";
  const rezoText = t.rezo ? ` (${t.rezo.toUpperCase()})` : '';

  const div = document.createElement('div');
  div.className = "transaction-item";
  div.style.borderLeft = `4px solid ${color}`;

  const dateFormatee = t.date || (t.timestamp ? new Date(t.timestamp).toLocaleDateString('fr-FR') : '---');

  div.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="background:${color}18; color:${color}; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px;">
        <i class="fas ${icon}"></i>
      </div>
      <div>
        <b style="font-size:14px; color:#222; display:block;">${t.type || 'Tranzaksyon'}${rezoText}</b>
        <span style="font-size:12px; color:#777;">${dateFormatee}</span>
      </div>
    </div>
    <div style="text-align:right;">
      <b style="font-size:15px; color:#111; display:block;">${montan} HTG</b>
      <span style="font-size:11px; color:${color}; font-weight:700;">● ${t.status || 'Nan atant'}</span>
    </div>`;

  div.onclick = () => viewReceipt(t);
  return div;
}

/**
 * Changement d'onglet ak jere aparans aktiv bouton an
 */
export function switchIstorik(targetId, btn) {
  activeTab = targetId;

  // 1. Retire klas active nan tout bouton yo
  document.querySelectorAll('.tab-btn-ist').forEach((b) => {
    b.classList.remove('active');
  });

  // 2. Mete klas active sou bouton ki klike a
  if (btn) {
    btn.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.tab-btn-ist[onclick*="'${targetId}'"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  // 3. Kache tout div kontni yo
  document.querySelectorAll('.ist-content').forEach((div) => {
    div.classList.add('hidden');
  });

  // 4. Montre div kontni aktif la
  const targetContainer = document.getElementById(`list-${targetId}`);
  if (targetContainer) {
    targetContainer.classList.remove('hidden');
  }

  // 5. Re-afiche tranzaksyon yo
  renderCurrentView();
}

/**
 * Filtre pa dat
 */
export function filterByDate() {
  renderCurrentView();
}

/**
 * Netwaye filtre dat la
 */
export function clearDateFilter() {
  const input = document.getElementById('filter-date-input');
  if (input) input.value = '';
  renderCurrentView();
}

/**
 * Ouvè modal Resi an ak enfòmasyon tranzaksyon an
 */
export function viewReceipt(t) {
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
    statusBadge.style.color = ['Validé', 'Approuvé', 'Valide'].includes(status) ? '#28a745' : (isFailedStatus(status) ? '#dc3545' : '#ffc107');
  }
  if (document.getElementById('rec-amount')) document.getElementById('rec-amount').innerText = `${montan} HTG`;
  if (document.getElementById('rec-method')) document.getElementById('rec-method').innerText = method;
  if (document.getElementById('rec-phone')) document.getElementById('rec-phone').innerText = phone;
  if (document.getElementById('rec-date')) document.getElementById('rec-date').innerText = dat;

  currentReceiptData = { transID, montan, method, phone, dat, status };
  document.getElementById('modal-receipt')?.classList.remove('hidden');
}

/**
 * Fèmen modal resi a
 */
export function closeReceipt() {
  document.getElementById('modal-receipt')?.classList.add('hidden');
}

/**
 * Pataje resi a sou WhatsApp
 */
export async function shareReceipt() {
  if (!currentReceiptData) return;

  const shareText = `🧾 *RESI TRANZAKSYON ECHANJ PLUS*\n--------------------------------\n🆔 ID: ${currentReceiptData.transID}\n💰 Montan: ${currentReceiptData.montan} HTG\n📲 Rezo: ${currentReceiptData.method}\n📞 Telefòn: ${currentReceiptData.phone}\n📅 Dat: ${currentReceiptData.dat}\n📌 Statut: ${currentReceiptData.status}\n--------------------------------\nMèsi paske ou itilize Echanj Plus!`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Resi Echanj Plus', text: shareText });
    } catch (err) {
      console.log("Pataj annule");
    }
  } else {
    navigator.clipboard.writeText(shareText);
    alert("✅ Resi a kopye nan presse-papier ou!");
  }
}

/**
 * Netwaye interface la si itilizatè a dekonekte
 */
function clearUI() {
  allUserTransactions = [];
  ['tout', 'echanj', 'retre', 'echwe'].forEach((s) => {
    const el = document.getElementById(`list-${s}`);
    if (el) el.innerHTML = "";
  });
}

// Rann tout fonksyon sa yo vizib pou HTML
window.switchIstorik = switchIstorik;
window.filterByDate = filterByDate;
window.clearDateFilter = clearDateFilter;
window.closeReceipt = closeReceipt;
window.shareReceipt = shareReceipt;
window.viewReceipt = viewReceipt;
