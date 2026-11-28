import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjK6EPlokkARHnakMaDRjqRzN-yQqlayU",
  authDomain: "echanj-plus.firebaseapp.com",
  databaseURL: "https://echanj-plus-default-rtdb.firebaseio.com",
  projectId: "echanj-plus",
  storageBucket: "echanj-plus.firebasestorage.app",
  messagingSenderId: "117332306453",
  appId: "1:117332306453:web:41d04226aa15ca5c3fbc1c",
  measurementId: "G-LPGLMCR7HP"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// 2 adrès rezo sistèm lan lè kliyan ap vann bay sistèm lan (130 HTG)
const SYSTEM_WALLETS = {
  BEP20: {
    label: "✅ USDT (BEP20)",
    address: "0xb65a9f47d4ef8d749ccf2ab39bba36ddcc2ebcfe",
    receivePlaceholder: "Kole adrès wallet USDT (BEP20) ou a (ex: 0x...)"
  },
  TRC20: {
    label: "✅ TRX / Tron (TRC20)",
    address: "TX2Ur6faAmFrKhgqz7w5saYbq1qfjT4hw8",
    receivePlaceholder: "Kole adrès wallet TRX / Tron (TRC20) ou a (ex: T...)"
  }
};

// Règ kalkil yo:
// - achte (Vann Bay Sistèm 130 HTG): (Montan - 0.10) * 130
// - vann (Achte USDT 142 HTG, min 12): (Montan * 0.97) - 0.30%
const RULES = {
  achte: {
    rateHtg: 130,
    minUsdt: 1,
    fixedFeeUsdt: 0.10,
    title: "Vann Bay Echanj Plus (130 HTG)",
    subtitle: "Voye sou adrès rezo ki chwazi anba a epi resevwa HTG sou balans Echanj Plus ou.",
    amountLabel: "Kantite Ou Ap Vann (USDT)",
    placeholderAmount: "Eg: 10 oswa 15",
    minHint: "Minimòm: 1 USDT • Frè sèvis: 0.100000",
    targetLabel: "Hash Tranzaksyon (TXID)",
    placeholderTarget: "Kole Hash Tranzaksyon (TXID) ou te fè a",
    opLabel: "VANN BAY SISTÈM (130 HTG)",
    netUsdtLabel: "Kantite Nèt Apre Frè (0.10):",
    outLabel: "Montan HTG Ou Ap Resevwa:"
  },
  vann: {
    rateHtg: 142,
    minUsdt: 12,
    usdtFactor: 0.97,
    feePercent: 0.003, // 0.30%
    title: "Achte USDT Nan Men Echanj Plus (142 HTG)",
    subtitle: "Peye total HTG a sou MonCash/NatCash an premye, mete ID tranzaksyon peman an, epi mete adrès wallet USDT ou.",
    amountLabel: "Kantite USDT Ou Ap Achte",
    placeholderAmount: "Eg: 12 oswa 15",
    minHint: "Minimòm: 12 USDT • Kalkil nèt: (Kantite × 0.97) - 0.30%",
    targetLabel: "ID Tranzaksyon MonCash oswa NatCash (Apre Peman an)",
    placeholderTarget: "Antre ID tranzaksyon MonCash / NatCash ou sot fè a",
    walletOutLabel: "Adrès Wallet Resepsyon USDT Ou (Apre ID Peman an)",
    opLabel: "ACHTE USDT (142 HTG)",
    netUsdtLabel: "Kantite USDT Nèt Ou Ap Resevwa:",
    outLabel: "Montan HTG Ou Dwe Peye:"
  }
};

let currentMode = "achte";
let watchedDepoTxId = null;
let depoTxUnsub = null;

function generateARSId() {
  const year = new Date().getFullYear();
  const rnd = Math.floor(10000000 + Math.random() * 90000000);
  return `ARS-${year}-${rnd}`;
}

function setFeedback(msg, color = "#00e676") {
  const el = document.getElementById("depo-feedback");
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;
}

async function copyTextSafe(text) {
  if (!text) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
  }
  try {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(tempInput);
    return ok;
  } catch (_) {
    return false;
  }
}

function syncWalletAndPaymentBoxes() {
  const net = document.getElementById("depo-network")?.value || "BEP20";
  const walletInfo = SYSTEM_WALLETS[net] || SYSTEM_WALLETS.BEP20;

  const sysWalletBox = document.getElementById("depo-system-wallet-box");
  const momoBox = document.getElementById("depo-mobile-money-box");
  const walletOutField = document.getElementById("depo-wallet-out-field");
  const walletOutInput = document.getElementById("depo-wallet-out");
  const titleEl = document.getElementById("depo-wallet-net-title");
  const addrEl = document.getElementById("depo-sys-wallet-address");

  if (titleEl) titleEl.textContent = walletInfo.label;
  if (addrEl) addrEl.textContent = walletInfo.address;

  if (currentMode === "achte") {
    if (sysWalletBox) sysWalletBox.style.display = "block";
    if (momoBox) momoBox.style.display = "none";
    if (walletOutField) walletOutField.style.display = "none";
  } else {
    if (sysWalletBox) sysWalletBox.style.display = "none";
    if (momoBox) momoBox.style.display = "block";
    if (walletOutField) walletOutField.style.display = "block";
    if (walletOutInput) walletOutInput.placeholder = walletInfo.receivePlaceholder;
  }
}

function computeUsdtTransaction(mode, rawAmount) {
  const amount = Math.max(0, Number(rawAmount) || 0);

  if (mode === "achte") {
    const feeUsdt = amount > 0 ? RULES.achte.fixedFeeUsdt : 0;
    const netUsdt = Math.max(0, amount - feeUsdt);
    const totalHtg = netUsdt * RULES.achte.rateHtg;
    return { amount, feeUsdt, netUsdt, totalHtg, rateHtg: RULES.achte.rateHtg };
  }

  const baseFactor = amount * RULES.vann.usdtFactor;
  const feeUsdt = baseFactor * RULES.vann.feePercent;
  const netUsdt = Math.max(0, baseFactor - feeUsdt);
  const totalHtg = amount * RULES.vann.rateHtg;
  return { amount, feeUsdt, netUsdt, totalHtg, rateHtg: RULES.vann.rateHtg };
}

function updateSummaryUI() {
  const cfg = RULES[currentMode];
  const raw = parseFloat(document.getElementById("depo-amount")?.value || "0") || 0;
  const calc = computeUsdtTransaction(currentMode, raw);

  const opEl = document.getElementById("depo-sum-op");
  const inEl = document.getElementById("depo-sum-in");
  const netLblEl = document.getElementById("depo-sum-net-usdt-label");
  const netValEl = document.getElementById("depo-sum-net-usdt");
  const outLblEl = document.getElementById("depo-sum-out-label");
  const outValEl = document.getElementById("depo-sum-out");

  if (opEl) opEl.textContent = cfg.opLabel;
  if (inEl) inEl.textContent = `${calc.amount.toFixed(2)} USDT`;
  if (netLblEl) netLblEl.textContent = cfg.netUsdtLabel;
  if (netValEl) netValEl.textContent = `${calc.netUsdt.toFixed(6)} USDT`;
  if (outLblEl) outLblEl.textContent = cfg.outLabel;
  if (outValEl) {
    outValEl.textContent = `${calc.totalHtg.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} HTG`;
  }

  return calc;
}

function switchDepoMode(mode) {
  if (!RULES[mode]) return;
  currentMode = mode;

  document.querySelectorAll(".depo-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  const cfg = RULES[mode];
  const titleEl = document.getElementById("depo-mode-title");
  const subEl = document.getElementById("depo-mode-subtitle");
  const amtLblEl = document.getElementById("depo-amount-label");
  const amountEl = document.getElementById("depo-amount");
  const minHintEl = document.getElementById("depo-min-hint");
  const targetLblEl = document.getElementById("depo-target-label");
  const targetEl = document.getElementById("depo-target");
  const walletOutLblEl = document.getElementById("depo-wallet-out-label");

  if (titleEl) titleEl.textContent = cfg.title;
  if (subEl) subEl.textContent = cfg.subtitle;
  if (amtLblEl) amtLblEl.textContent = cfg.amountLabel;
  if (amountEl) {
    amountEl.placeholder = cfg.placeholderAmount;
    amountEl.min = String(cfg.minUsdt);
  }
  if (minHintEl) minHintEl.textContent = cfg.minHint;
  if (targetLblEl) targetLblEl.textContent = cfg.targetLabel;
  if (targetEl) targetEl.placeholder = cfg.placeholderTarget;
  if (walletOutLblEl && cfg.walletOutLabel) walletOutLblEl.textContent = cfg.walletOutLabel;

  setFeedback("");
  syncWalletAndPaymentBoxes();
  updateSummaryUI();
}

function renderDepoBanner(tx) {
  if (!tx || !tx.id) return;
  const banner = document.getElementById("depo-last-tx-banner");
  const statusEl = document.getElementById("depo-last-tx-status");
  const idEl = document.getElementById("depo-last-tx-id");
  const descEl = document.getElementById("depo-last-tx-desc");
  if (!banner) return;

  const isApproved = ["approved", "valide", "validated"].includes(String(tx.status || "").toLowerCase());
  banner.style.display = "block";
  banner.classList.toggle("approved", isApproved);

  if (idEl) idEl.textContent = tx.id;
  if (statusEl) {
    statusEl.textContent = isApproved ? "Validé" : "An atant";
    statusEl.className = `depo-badge ${isApproved ? "approved" : "pending"}`;
  }
  if (descEl) {
    descEl.textContent = `${String(tx.subType || "").toUpperCase()} • ${tx.network || "BEP20"} • ${Number(tx.amountUsdt || 0).toFixed(2)} USDT → Nèt: ${Number(tx.netUsdt || 0).toFixed(6)} USDT (${Number(tx.totalHtg || 0).toFixed(2)} HTG)`;
  }

  if (watchedDepoTxId !== tx.id) {
    if (depoTxUnsub) depoTxUnsub();
    watchedDepoTxId = tx.id;
    depoTxUnsub = onValue(ref(rtdb, `transactions/${tx.id}`), (snap) => {
      if (snap.exists()) renderDepoBanner(snap.val());
    });
  }
}

function initDepoSection() {
  document.querySelectorAll(".depo-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchDepoMode(tab.dataset.mode));
  });

  const networkSelect = document.getElementById("depo-network");
  if (networkSelect) {
    networkSelect.addEventListener("change", () => {
      syncWalletAndPaymentBoxes();
      setFeedback("");
    });
  }

  const copySysBtn = document.getElementById("btn-copy-sys-wallet");
  if (copySysBtn) {
    copySysBtn.addEventListener("click", async () => {
      const net = document.getElementById("depo-network")?.value || "BEP20";
      const addr = SYSTEM_WALLETS[net]?.address || document.getElementById("depo-sys-wallet-address")?.textContent?.trim() || "";
      const copied = await copyTextSafe(addr);
      if (copied) {
        copySysBtn.classList.add("copied");
        copySysBtn.innerHTML = '<i class="fa-solid fa-check"></i> Adrès Kopye!';
        setFeedback(`Adrès ${net} la kopye: ${addr}`, "#00e676");
        setTimeout(() => {
          copySysBtn.classList.remove("copied");
          copySysBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Kopiye Adrès';
        }, 2000);
      } else {
        setFeedback(`Adrès: ${addr}`, "#fbbf24");
      }
    });
  }

  document.querySelectorAll(".depo-btn-copy-momo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const num = btn.dataset.copy || "";
      const copied = await copyTextSafe(num);
      if (copied) {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Kopye!';
        setFeedback(`Nimewo kopye: ${num}`, "#00e676");
        setTimeout(() => { btn.innerHTML = oldHtml; }, 1800);
      } else {
        setFeedback(`Nimewo: ${num}`, "#fbbf24");
      }
    });
  });

  const amountInput = document.getElementById("depo-amount");
  if (amountInput) {
    amountInput.addEventListener("input", updateSummaryUI);
    amountInput.addEventListener("change", updateSummaryUI);
  }

  const copyBtn = document.getElementById("btn-copy-depo-tx");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const id = document.getElementById("depo-last-tx-id")?.textContent?.trim() || "";
      const copied = await copyTextSafe(id);
      if (copied) {
        copyBtn.textContent = "Kopye!";
        setTimeout(() => { copyBtn.textContent = "Kopiye ID"; }, 1800);
      } else {
        setFeedback(`ID: ${id}`, "#fbbf24");
      }
    });
  }

  const submitBtn = document.getElementById("btn-submit-depo");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        setFeedback("Tanpri konekte ak kont ou anvan.", "#ff5252");
        return;
      }

      const cfg = RULES[currentMode];
      const calc = updateSummaryUI();
      const network = document.getElementById("depo-network")?.value || "BEP20";
      const sysWallet = SYSTEM_WALLETS[network]?.address || "";
      const target = (document.getElementById("depo-target")?.value || "").trim();
      const walletOut = (document.getElementById("depo-wallet-out")?.value || "").trim();
      const pin = (document.getElementById("depo-pin-input")?.value || "").trim();

      if (calc.amount < cfg.minUsdt) {
        setFeedback(`Minimòm pou operasyon sa a se ${cfg.minUsdt} USDT.`, "#ff5252");
        return;
      }

      if (currentMode === "achte") {
        if (!target) {
          setFeedback("Tanpri antre Hash Tranzaksyon (TXID) ou te fè a.", "#ff5252");
          return;
        }
      } else {
        if (!target) {
          setFeedback("Tanpri antre ID tranzaksyon MonCash oswa NatCash ou sot fè a an premye.", "#ff5252");
          return;
        }
        if (!walletOut) {
          setFeedback("Apre ID peman an, tanpri antre adrès wallet USDT kote w ap resevwa l la.", "#ff5252");
          return;
        }
      }

      const userSnap = await get(ref(rtdb, `users/${user.uid}`));
      const profile = userSnap.exists() ? userSnap.val() : {};
      if (profile.transactionPin && String(profile.transactionPin) !== pin) {
        setFeedback("PIN sekirite 4 chif la pa kòrèk.", "#ff5252");
        return;
      }

      const txId = generateARSId();
      const txPayload = {
        id: txId,
        uid: user.uid,
        type: "usdt_exchange",
        subType: currentMode,
        network,
        systemWalletAddress: currentMode === "achte" ? sysWallet : null,
        txHash: currentMode === "achte" ? target : null,
        mobileMoneyTxId: currentMode === "vann" ? target : null,
        receivingWalletAddress: currentMode === "vann" ? walletOut : null,
        target: currentMode === "achte" ? target : `${target} | ${walletOut}`,
        amountUsdt: calc.amount,
        feeUsdt: Number(calc.feeUsdt.toFixed(6)),
        netUsdt: Number(calc.netUsdt.toFixed(6)),
        rateHtg: calc.rateHtg,
        totalHtg: Number(calc.totalHtg.toFixed(2)),
        creditTarget: currentMode === "achte" ? "echanj_plus_balance" : "external_wallet",
        status: "pending",
        createdAt: serverTimestamp()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "N ap voye...";

      try {
        await set(ref(rtdb, `transactions/${txId}`), txPayload);
        await set(ref(rtdb, `users/${user.uid}/lastTransaction`), txPayload);
        renderDepoBanner(txPayload);
        document.getElementById("depo-pin-input").value = "";
        setFeedback(`Demann ${txId} anrejistre avèk siksè!`, "#00e676");
      } catch (err) {
        console.error(err);
        setFeedback("Erè pandan voye demann lan.", "#ff5252");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Konfime & Soumèt Demann lan";
      }
    });
  }

  switchDepoMode("achte");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDepoSection);
} else {
  initDepoSection();
}
