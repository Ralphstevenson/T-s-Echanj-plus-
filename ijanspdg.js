// ==========================================
// 1. KALKILATÈ ECHANJ RAPID (16.5% Frè)
// ==========================================
window.calculateExchange = function() {
  const amountInput = document.getElementById('calc-amount').value;
  const resultDisplay = document.getElementById('calc-result');
  
  let minutes = parseFloat(amountInput);
  if (isNaN(minutes) || minutes <= 0) {
    resultDisplay.innerText = "0.00 HTG";
    return;
  }
  
  // Ap aplike frè 16.5% (retire 16.5%, kidonk miltipliye pa 0.835)
  let totalHTG = minutes * 0.835; 
  resultDisplay.innerText = totalHTG.toFixed(2) + " HTG";
};


// ==========================================
// 2. VOYE NOUVO TRANZAKSYON SOU WHATSAPP ADMIN LAN
// ==========================================
window.sendExchangeToWhatsApp = function() {
  const network = document.getElementById('calc-network').value;
  const minutes = document.getElementById('calc-amount').value;
  const result = document.getElementById('calc-result').innerText;

  if (!minutes || parseFloat(minutes) <= 0) {
    alert("Tanpri antre kantite minit w ap voye a anvan.");
    return;
  }

  const message = `Bonjou Echanj Plus 👋,\nMwen vle fè yon tranzaksyon:\n• Sèvis: ${network}\n• Minit: ${minutes}\n• Montan pou m resevwa: ${result}\n\nMwen pare pou m voye minit yo.`;
  const whatsappUrl = `https://wa.me/5093413215?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};


// ==========================================
// 3. VERIFIKASYON ID TRANZAKSYON AK SEKIRITE KONT
// ==========================================
let currentInspectedTrx = null;

window.inspectTransactionDetails = async function() {
  const trxInput = document.getElementById('delayed-trx-id');
  const errorMsg = document.getElementById('trx-error-msg');
  const detailsCard = document.getElementById('trx-details-card');
  const btnSearch = document.getElementById('btn-search-trx');
  
  const trxId = trxInput.value.trim().toUpperCase();

  if (trxId === "") {
    errorMsg.innerText = "Tanpri antre yon ID tranzaksyon anvan.";
    errorMsg.style.display = "block";
    detailsCard.style.display = "none";
    return;
  }

  // Rekipere nimewo telefòn itilizatè ki konekte a
  const loggedInUserPhone = localStorage.getItem("userPhone") || document.getElementById('user-display-phone')?.innerText.trim();

  errorMsg.style.display = "none";
  btnSearch.innerText = "Ap verifye...";
  btnSearch.disabled = true;

  try {
    // Chèche nan Firebase Firestore (Koleksyon 'transactions')
    const docSnap = await firebase.firestore().collection("transactions").doc(trxId).get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const trxOwnerPhone = data.phone || data.receiverPhone || data.userPhone;

      // 🔒 RESTRIKSYON SEKIRITE: Anpeche lòt moun wè tranzaksyon ki pa pou yo
      if (loggedInUserPhone && trxOwnerPhone && loggedInUserPhone !== trxOwnerPhone && loggedInUserPhone !== "+509 --") {
        detailsCard.style.display = "none";
        errorMsg.innerText = "❌ Aksè refize! Tranzaksyon sa a pa fèt sou kont sa a.";
        errorMsg.style.display = "block";
        btnSearch.innerText = "Verifye ID";
        btnSearch.disabled = false;
        return;
      }

      // Si tout bagay an lòd, nou afiche tout detay tranzaksyon an
      currentInspectedTrx = { id: trxId, ...data };

      document.getElementById('det-id').innerText = trxId;
      document.getElementById('det-network').innerText = data.network || data.type || "Echanj Minit";
      document.getElementById('det-amount').innerText = (data.amount || 0) + " Minit/HTG";
      document.getElementById('det-receive').innerText = (data.receiveAmount || 0) + " HTG";
      document.getElementById('det-phone').innerText = trxOwnerPhone || "--";
      document.getElementById('det-date').innerText = data.date || new Date().toLocaleDateString();

      const statusBadge = document.getElementById('det-status');
      const status = (data.status || "Pending").toLowerCase();
      
      if (status === "approved" || status === "valide" || status === "completed") {
        statusBadge.innerText = "Valide ✅";
        statusBadge.style.background = "rgba(0, 230, 118, 0.15)";
        statusBadge.style.color = "#00e676";
      } else if (status === "rejected" || status === "refize") {
        statusBadge.innerText = "Refize ❌";
        statusBadge.style.background = "rgba(255, 82, 82, 0.15)";
        statusBadge.style.color = "#ff5252";
      } else {
        statusBadge.innerText = "An atant Admin ⏳";
        statusBadge.style.background = "rgba(251, 191, 36, 0.15)";
        statusBadge.style.color = "#fbbf24";
      }

      detailsCard.style.display = "block";
    } else {
      detailsCard.style.display = "none";
      errorMsg.innerText = "❌ Okenn tranzaksyon pa jwenn ak ID sa a nan sistèm nan.";
      errorMsg.style.display = "block";
    }
  } catch (error) {
    console.error("Erè sekirite rechèch:", error);
    errorMsg.innerText = "Gen yon ti pwoblèm teknik. Eseye ankò.";
    errorMsg.style.display = "block";
  } finally {
    btnSearch.innerText = "Verifye ID";
    btnSearch.disabled = false;
  }
};


// ==========================================
// 4. VOYE FICH REKLAMASYON AN SOU WHATSAPP ADMIN LAN
// ==========================================
window.sendFullClaimToWhatsApp = function() {
  if (!currentInspectedTrx) return;

  const t = currentInspectedTrx;
  const message = `📋 *REKLAMASYON TRANZAKSYON (24H+)*\n\n` +
                  `🆔 *ID Tranzaksyon:* ${t.id}\n` +
                  `📡 *Rezo:* ${t.network || t.type || 'N/A'}\n` +
                  `💰 *Montan:* ${t.amount || 0} -> *${t.receiveAmount || 0} HTG*\n` +
                  `📱 *Nimewo:* ${t.phone || t.receiverPhone || 'N/A'}\n` +
                  `📌 *Estati aktyèl:* ${t.status || 'An atant'}\n` +
                  `📅 *Dat:* ${t.date || 'N/A'}\n\n` +
                  `Bonjou Admin, tranzaksyon sa a ap tann depi plis pase 24h. Tanpri verifye l pou mwen.`;

  const whatsappUrl = `https://wa.me/5093413215?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
