(() => {
  const RATE_SELL_TO_SYSTEM = 130; // Itilizatè vann USDT bay sistèm nan -> resevwa 130 HTG / USDT
  const RATE_BUY_FROM_SYSTEM = 142; // Itilizatè achte USDT nan men sistèm nan -> peye 142 HTG / USDT

  const SYSTEM_WALLETS = {
    BEP20: {
      title: "✅ USDT (BEP20)",
      address: "0xb65a9f47d4ef8d749ccf2ab39bba36ddcc2ebcfe"
    },
    TRC20: {
      title: "✅ TRX / Tron (TRC20)",
      address: "TYourTronWalletAddressHere1234567890"
    }
  };

  let currentMode = "achte"; // 'achte' = moun vann USDT bay sistèm nan (130 HTG) | 'vann' = moun achte USDT nan men sistèm nan (142 HTG)

  const tabs = document.querySelectorAll("#paj-depo .depo-tab");
  const networkSelect = document.getElementById("depo-network");
  const systemWalletBox = document.getElementById("depo-system-wallet-box");
  const mobileMoneyBox = document.getElementById("depo-mobile-money-box");
  const walletNetTitle = document.getElementById("depo-wallet-net-title");
  const sysWalletAddress = document.getElementById("depo-sys-wallet-address");
  const amountInput = document.getElementById("depo-amount");
  const amountLabel = document.getElementById("depo-amount-label");
  const targetInput = document.getElementById("depo-target");
  const targetLabel = document.getElementById("depo-target-label");
  const modeTitle = document.getElementById("depo-mode-title");
  const modeSubtitle = document.getElementById("depo-mode-subtitle");

  const sumOp = document.getElementById("depo-sum-op");
  const sumIn = document.getElementById("depo-sum-in");
  const sumNetUsdtLabel = document.getElementById("depo-sum-net-usdt-label");
  const sumNetUsdt = document.getElementById("depo-sum-net-usdt");
  const sumOutLabel = document.getElementById("depo-sum-out-label");
  const sumOut = document.getElementById("depo-sum-out");

  const pinInput = document.getElementById("depo-pin-input");
  const submitBtn = document.getElementById("btn-submit-depo");
  const feedbackEl = document.getElementById("depo-feedback");

  const txBanner = document.getElementById("depo-last-tx-banner");
  const txStatusEl = document.getElementById("depo-last-tx-status");
  const txIdEl = document.getElementById("depo-last-tx-id");
  const txDescEl = document.getElementById("depo-last-tx-desc");
  const copyTxBtn = document.getElementById("btn-copy-depo-tx");
  const copyWalletBtn = document.getElementById("btn-copy-sys-wallet");

  function updateWalletDisplay() {
    const net = networkSelect.value;
    const info = SYSTEM_WALLETS[net] || SYSTEM_WALLETS.BEP20;
    walletNetTitle.textContent = info.title;
    sysWalletAddress.textContent = info.address;
  }

  function updateModeUI() {
    const isSellingToSystem = currentMode === "achte";

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === currentMode);
    });

    if (isSellingToSystem) {
      modeTitle.textContent = "Vann Bay Echanj Plus (130 HTG)";
      modeSubtitle.textContent =
        "Voye sou adrès rezo ki chwazi anba a epi resevwa HTG sou balans Echanj Plus ou.";
      systemWalletBox.style.display = "flex";
      mobileMoneyBox.style.display = "none";

      amountLabel.textContent = "Kantite Ou Ap Vann (USDT)";
      targetLabel.textContent = "Hash Tranzaksyon (TXID) oswa Adrès Wallet Ou";
      targetInput.placeholder = "Kole TXID oswa adrès wallet kote w voye l soti a";

      sumOp.textContent = "VANN BAY SISTÈM (130 HTG)";
      sumNetUsdtLabel.textContent = "Valè Nèt Konvèti:";
      sumOutLabel.textContent = "Montan HTG Ou Ap Resevwa:";
    } else {
      modeTitle.textContent = "Achte USDT Nan Men Echanj Plus (142 HTG)";
      modeSubtitle.textContent =
        "Mete kantite USDT w ap achte a, voye Goud la sou MonCash oswa NatCash bay Ralph Stevenson Aristor, epi soumèt demann lan pou verifikasyon.";
      systemWalletBox.style.display = "none";
      mobileMoneyBox.style.display = "flex";

      amountLabel.textContent = "Kantite USDT Ou Ap Achte";
      targetLabel.textContent = "Adrès Wallet Resepsyon Ou (USDT) + Nimewo / Ref MonCash oswa NatCash";
      targetInput.placeholder = "Ex: 0x... (BEP20) | Voye depi +509 3XXXXXXX (Ref: ...)";

      sumOp.textContent = "ACHTE USDT (142 HTG)";
      sumNetUsdtLabel.textContent = "Kantite USDT Ou Ap Resevwa:";
      sumOutLabel.textContent = "Montan HTG Ou Dwe Peye (MonCash / NatCash):";
    }

    updateCalculation();
  }

  function updateCalculation() {
    const rawAmount = parseFloat(amountInput.value);
    const qty = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 0;
    const rate = currentMode === "achte" ? RATE_SELL_TO_SYSTEM : RATE_BUY_FROM_SYSTEM;
    const totalHtg = qty * rate;

    sumIn.textContent = `${qty.toFixed(2)} USDT`;
    sumNetUsdt.textContent = `${qty.toFixed(6)} USDT`;
    sumOut.textContent = `${totalHtg.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} HTG`;
  }

  function generateTxId() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    return `ARS-${year}-${randomNum}`;
  }

  function setFeedback(message, type = "") {
    feedbackEl.textContent = message;
    feedbackEl.className = `depo-feedback ${type}`.trim();
  }

  async function copyText(text, triggerBtn, defaultHtml) {
    try {
      await navigator.clipboard.writeText(text);
      triggerBtn.textContent = "✓ Kopye!";
      setTimeout(() => {
        triggerBtn.innerHTML = defaultHtml;
      }, 1600);
    } catch {
      setFeedback("Pa t kapab kopye otomatikman. Kopye manyèlman.", "error");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentMode = tab.dataset.mode;
      setFeedback("");
      updateModeUI();
    });
  });

  networkSelect.addEventListener("change", updateWalletDisplay);
  amountInput.addEventListener("input", updateCalculation);

  copyWalletBtn.addEventListener("click", () => {
    copyText(
      sysWalletAddress.textContent.trim(),
      copyWalletBtn,
      '<i class="fa-regular fa-copy"></i> Kopiye Adrès'
    );
  });

  document.querySelectorAll(".depo-btn-copy-momo").forEach((btn) => {
    const originalHtml = btn.innerHTML;
    btn.addEventListener("click", () => {
      copyText(btn.dataset.copy, btn, originalHtml);
    });
  });

  copyTxBtn.addEventListener("click", () => {
    copyText(txIdEl.textContent.trim(), copyTxBtn, "Kopiye ID");
  });

  submitBtn.addEventListener("click", () => {
    setFeedback("");
    const qty = parseFloat(amountInput.value);
    const target = targetInput.value.trim();
    const pin = pinInput.value.trim();
    const network = networkSelect.value;

    if (!Number.isFinite(qty) || qty < 1) {
      setFeedback("Tanpri antre yon kantite omwen 1 USDT.", "error");
      return;
    }

    if (!target) {
      setFeedback(
        currentMode === "achte"
          ? "Tanpri mete TXID oswa adrès wallet ou a."
          : "Tanpri mete adrès wallet USDT ou a ak detay peman MonCash/NatCash la.",
        "error"
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setFeedback("Tanpri antre PIN sekirite 4 chif ou a.", "error");
      return;
    }

    const txId = generateTxId();
    const rate = currentMode === "achte" ? RATE_SELL_TO_SYSTEM : RATE_BUY_FROM_SYSTEM;
    const htgAmount = (qty * rate).toFixed(2);

    txBanner.style.display = "block";
    txStatusEl.className = "depo-badge pending";
    txStatusEl.textContent = "An atant verifikasyon";
    txIdEl.textContent = txId;

    if (currentMode === "achte") {
      txDescEl.textContent = `Vann ${qty} USDT (${network}) -> Resevwa ${htgAmount} HTG. Demann anrejistre pou verifikasyon.`;
    } else {
      txDescEl.textContent = `Achte ${qty} USDT (${network}) -> Peye ${htgAmount} HTG sou MonCash (+509 34132015) / NatCash (+509 35749198) - Ralph Stevenson Aristor.`;
    }

    setFeedback(
      `Demann ${txId} soumèt avèk siksè! N ap verifye peman an anvan n trete operasyon an.`,
      "success"
    );

    amountInput.value = "";
    targetInput.value = "";
    pinInput.value = "";
    updateCalculation();
  });

  updateWalletDisplay();
  updateModeUI();
})();
                                                 
