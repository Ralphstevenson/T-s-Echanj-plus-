window.inspectTransactionDetails = async function(event) {
  if (event) event.preventDefault(); // Sa anpeche paj la retounen monte anwo

  const inputEl = document.getElementById('delayed-trx-id');
  const errorEl = document.getElementById('trx-error-msg');
  const cardEl = document.getElementById('trx-details-card');

  if (!inputEl) return;
  const rawId = inputEl.value.trim();

  errorEl.style.display = 'none';
  errorEl.textContent = '';
  cardEl.style.display = 'none';
  currentInspectedTx = null;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    errorEl.textContent = "Tanpri konekte ankò pou w ka fè verifye tranzaksyon sa a.";
    errorEl.style.display = 'block';
    return;
  }

  if (!rawId) {
    errorEl.textContent = "Tanpri antre yon ID tranzaksyon valab.";
    errorEl.style.display = 'block';
    return;
  }

  try {
    const txRef = ref(rtdb, `transactions`);
    const snapshot = await get(txRef);

    if (!snapshot.exists()) {
      errorEl.textContent = "Pa gen okenn tranzaksyon nan sistèm nan.";
      errorEl.style.display = 'block';
      return;
    }

    let foundTx = null;
    snapshot.forEach((childSnap) => {
      const key = childSnap.key;
      if (key.toLowerCase() === rawId.toLowerCase()) {
        foundTx = childSnap.val();
        foundTx.id = key;
      }
    });

    if (!foundTx) {
      errorEl.textContent = "ID tranzaksyon sa a pa egziste nan sistèm nan.";
      errorEl.style.display = 'block';
      return;
    }

    const tx = foundTx;
    currentInspectedTx = tx;

    // --- RÈG 12 ÈDTAN AN ---
    if (tx.createdAt) {
      const txTime = new Date(tx.createdAt).getTime();
      const now = new Date().getTime();
      const diffHours = (now - txTime) / (1000 * 60 * 60);

      if (diffHours < 12 && tx.status !== 'success') {
        errorEl.textContent = `Tranzaksyon sa a poko gen 12 èdtan (l gen anviwon ${Math.floor(diffHours)}è tan). Suivi ak asistans rapid disponib sèlman si 12 èdtan pase epi li toujou poko valide.`;
        errorEl.style.display = 'block';
        return;
      }
    }

    // Afiche detay yo
    document.getElementById('det-id').textContent = tx.id;
    
    const statusEl = document.getElementById('det-status');
    statusEl.textContent = tx.status === 'success' ? 'Validé' : (tx.status === 'pending' ? 'An atant' : tx.status);
    statusEl.style.background = tx.status === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    statusEl.style.color = tx.status === 'success' ? '#00e676' : '#fbbf24';

    document.getElementById('det-network').textContent = (tx.rezo || tx.type || 'N/A').toUpperCase();
    document.getElementById('det-amount').textContent = `${tx.amount || 0} HTG`;
    document.getElementById('det-date').textContent = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '---';

    cardEl.style.display = 'block';

    // Fè paj la desann yon ti kras pou moun nan wè kat rezilta a parèt klè
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error("Erè nan verifikasyon ID a:", err);
    errorEl.textContent = "Gen yon ti pwoblèm teknik. Eseye ankò.";
    errorEl.style.display = 'block';
  }
};
