async function renderCurrentView() {
  const activeUser = auth.currentUser || currentUser;
  if (!activeUser) {
    console.log("Okenn itilizatè pa konekte kounye a.");
    return;
  }

  const targetContainer = document.getElementById(`list-${activeTab}`);
  if (!targetContainer) return;

  targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #9eaab6;">N ap chache tranzaksyon yo...</p>`;

  const dateInput = document.getElementById('filter-date-input');
  const selectedDate = dateInput ? dateInput.value : '';

  try {
    const txRef = ref(rtdb, 'transactions');
    const snapshot = await get(txRef);

    // Mete non mwa aktyèl la nan banèv la
    const monthsNames = ["JANVYE", "FEVRIYE", "MAS", "AVRI", "ME", "JEN", "JIYÈ", "OUT", "SEPTANM", "OKTÒB", "NOVANM", "DESANM"];
    const now = new Date();
    const currentMonthName = `${monthsNames[now.getMonth()]} ${now.getFullYear()}`;
    const monthLabelEl = document.getElementById('txt-current-month');
    if (monthLabelEl) monthLabelEl.textContent = currentMonthName;

    if (!snapshot.exists()) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #9eaab6;">Pa gen okenn tranzaksyon ki anrejistre.</p>`;
      updateSummaryBanner([], 0, 0, 0);
      return;
    }

    let transactions = [];

    snapshot.forEach((childSnap) => {
      const tx = childSnap.val();
      tx.firebaseId = childSnap.key;
      
      // Nou asire n l ap pran uid a kòrèkteman san diskisyon
      const txUid = tx.uid || tx.userId;
      
      if (txUid && txUid.toString().trim() === activeUser.uid.toString().trim()) {
        transactions.push(tx);
      }
    });

    // Triye pou mete pi resan yo anwo
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let filtered = transactions.filter(tx => {
      if (activeTab === 'echanj') return tx.type === 'echanj_minit';
      if (activeTab === 'retre') return tx.type === 'retrait' || tx.type === 'retre';
      if (activeTab === 'echwe') return tx.status === 'failed' || tx.status === 'echwe';
      return true;
    });

    if (selectedDate) {
      filtered = filtered.filter(tx => {
        if (!tx.createdAt) return false;
        return tx.createdAt.startsWith(selectedDate);
      });
    }

    let totalEntries = 0;
    let totalSorties = 0;
    let monthlySum = 0;

    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'deposit' || tx.type === 'depot' || (amt > 0 && tx.type !== 'retrait' && tx.type !== 'retre')) {
        totalEntries += amt;
      } else {
        totalSorties += amt;
      }
      monthlySum += amt;
    });

    updateSummaryBanner(transactions, totalEntries, totalSorties, monthlySum);

    if (filtered.length === 0) {
      targetContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #9eaab6;">Pa gen tranzaksyon pou kritè sa yo.</p>`;
      return;
    }

    let html = '';
    filtered.forEach(tx => {
      const dateFormatted = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';
      const statusColor = tx.status === 'pending' ? '#ff9800' : (tx.status === 'success' ? '#00e676' : '#ff5252');
      const titreRezo = tx.rezo ? tx.rezo.toUpperCase() : (tx.type || 'TRANZAKSYON');
      
      html += `
        <div class="transaction-item" onclick="window.showReceiptFromGlobal('${tx.firebaseId}')">
          <div>
            <strong style="text-transform: uppercase; color: #ffffff; font-size: 14px;">${titreRezo}</strong><br>
            <small style="color: #9eaab6; font-size: 12px;">Montan: <b style="color: #00e676;">${tx.amount} HTG</b></small><br>
            <small style="color: #64748b; font-size: 11px;">${dateFormatted}</small>
          </div>
          <div style="text-align: right;">
            <span style="background: ${statusColor}; color: #131a22; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${tx.status}</span><br>
            <span style="color: #00e676; font-size: 12px; margin-top: 6px; display: inline-block;">Wè Reçu <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i></span>
          </div>
        </div>
      `;
    });

    targetContainer.innerHTML = html;
    window.allUserTransactions = transactions;

  } catch (error) {
    console.error("Erè nan chajman istorik la:", error);
    targetContainer.innerHTML = `<p style="text-align:center; color: #ff5252; padding: 20px;">Erè nan chajman done yo.</p>`;
  }
}
