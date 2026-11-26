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

// 2 wallet aktyèl yo
const SYSTEM_WALLETS = {
  BEP20: {
    label: "✅ USDT (BEP20)",
    address: "0xb65a9f47d4ef8d749ccf2ab39bba36ddcc2ebcfe",
    clientPlaceholder: "Kole adrès USDT (BEP20) ou a (kòmanse ak 0x...)"
  },
  TRC20: {
    label: "✅ TRX / Tron (TRC20)",
    address: "TX2Ur6faAmFrKhgqz7w5saYbq1qfjT4hw8",
    clientPlaceholder: "Kole adrès TRX / Tron (TRC20) ou a (kòmanse ak T...)"
  }
};

// Règ kalkil an background
const RULES = {
  achte: {
    rateHtg: 130,
    minUsdt: 1,
    fixedFeeUsdt: 0.10, // (Montan - 0.10) * 130 HTG
    title: "Vann Bay Echanj Plus (130 HTG)",
    subtitle: "Kopye adrès rezo ki chwazi anba a, voye fon an, epi soumèt demann ou.",
    amountLabel: "Kantite Ou Ap Vann (USDT)",
    placeholderAmount: "Eg: 10",
    minHint: "Minimòm: 1 USDT",
    targetLabel: "Hash Tranzaksyon (TXID) oswa Adrès Wallet Ou",
    placeholderTarget: "Kole TXID oswa adrès wallet kote w voye l soti a",
    opLabel: "ACHTE (130 HTG)",
    netUsdtLabel: "Valè Nèt Konvèti:",
    outLabel: "Montan HTG Ou Ap Resevwa:"
  },
  vann: {
    rateHtg: 142,
    minUsdt: 12,
    usdtFactor: 0.97,   // 12 * 0.97 = 11.64
    feePercent: 0.003,  // Retire 0.30%
    title: "Achte Nan Men Echanj Plus (142 HTG)",
    subtitle: "Antre kantite ou bezwen an (minimòm 12) ak adrès wallet kote w ap resevwa l la.",
    amountLabel: "Kantite Ou Vle Achte (USDT)",
    placeholderAmount: "Eg: 12",
    minHint: "Minimòm obligatwa: 12 USDT",
    targetLabel: "Adrès Wallet Resepsyon Ou (Pou Resevwa Lajan an)",
    placeholderTarget: "Kole adrès wallet ou a",
    opLabel: "VANN (142 HTG)",
    netUsdtLabel: "Kantite Nèt Ou Ap Resevwa:",
    outLabel: "Total HTG Pou Peye:"
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
    } catch (_) {
      // Tonbe sou metòd fallback anba a
    }
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

function syncWalletDisplay() {
  const net = document.getElementById("depo-network")?.value || "BEP20";
  const walletInfo = SYSTEM_WALLETS[net] || SYSTEM_WALLETS.BEP20;
  const box = document.getElementById("depo-system-wallet-box");
  const titleEl = document.getElementById("depo-wallet-net-title");
  const addrEl = document.getElementById("depo-sys-wallet-address");
  const targetInput = document.getElementById("depo-target");

  if (titleEl) titleEl.textContent = walletInfo.label;
  if (addrEl) addrEl.textContent = walletInfo.address;

  if (box) {
    box.style.display = currentMode === "achte" ? "block" : "none";
  }

  if (targetInput && currentMode === "vann") {
    targetInput.placeholder = walletInfo.clientPlaceholder;
  }
}

function computeUsdtTransaction(mode, rawAmount) {
  const amount = Math.max(0, Number(rawAmount) || 0);
  if (mode === "achte") {
    const netUsdt = Math.max(0, amount - RULES.achte.fixedFeeUsdt);
    const feeUsdt = amount > 0 ? Math.min(amount, RULES.achte.fixedFeeUsdt) : 0;
    const totalHtg = netUsdt * RULES.achte.rateHtg;
    return {
      amount,
      feeUsdt,
      netUsdt,
      totalHtg,
      rateHtg: RULES.achte.rateHtg
    };
  }

  const baseConverted = amount * RULES.vann.usdtFactor;
  const feeUsdt = baseConverted * RULES.vann.feePercent;
  const netUsdt = Math.max(0, baseConverted - feeUsdt);
  const totalHtg = amount * RULES.vann.rateHtg;
  return {
    amount,
    feeUsdt,
    netUsdt,
    totalHtg,
    rateHtg: RULES.vann.rateHtg
  };
}

function updateSummaryUI() {
  const cfg = RULES[currentMode];
  const raw = parseFloat(document.getElementById("depo-amount")?.value || "0") || 0;
  const calc = computeUsdtTransaction(currentMode, raw);

  document.getElementById("depo-sum-op").textContent = cfg.opLabel;
  document.getElementById("depo-sum-in").textContent = `${calc.amount.toFixed(2)} USDT`;
  document.getElementById("depo-sum-net-usdt-label").textContent = cfg.netUsdtLabel;
  document.getElementById("depo-sum-net-usdt").textContent = `${calc.netUsdt.toFixed(6)} USDT`;
  document.getElementById("depo-sum-out-label").textContent = cfg.outLabel;
  document.getElementById("depo-sum-out").textContent = `${calc.totalHtg.toFixed(2)} HTG`;

  return calc;
}

function switchDepoMode(mode) {
  if (!RULES[mode]) return;
  currentMode = mode;

  document.querySelectorAll(".depo-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  const cfg = RULES[mode];
  document.getElementById("depo-mode-title").textContent = cfg.title;
  document.getElementById("depo-mode-subtitle").textContent = cfg.subtitle;
  document.getElementById("depo-amount-label").textContent = cfg.amountLabel;
  const amountEl = document.getElementById("depo-amount");
  amountEl.placeholder = cfg.placeholderAmount;
  amountEl.min = String(cfg.minUsdt);
  document.getElementById("depo-min-hint").textContent = cfg.minHint;
  document.getElementById("depo-target-label").textContent = cfg.targetLabel;
  document.getElementById("depo-target").placeholder = cfg.placeholderTarget;

  setFeedback("");
  syncWalletDisplay();
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
    descEl.textContent = `${String(tx.subType || "").toUpperCase()} • ${tx.network || "BEP20"} • ${Number(tx.amountUsdt || 0).toFixed(2)} USDT → Nèt: ${Number(tx.netUsdt || 0).toFixed(4)} (${Number(tx.totalHtg || 0).toFixed(2)} HTG)`;
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
      syncWalletDisplay();
      setFeedback("");
    });
  }

  const copySysBtn = document.getElementById("btn-copy-sys-wallet");
  if (copySysBtn) {
    copySysBtn.addEventListener("click", async () => {
      const addr = document.getElementById("depo-sys-wallet-address")?.textContent?.trim() || "";
      const copied = await copyTextSafe(addr);
      if (copied) {
        copySysBtn.classList.add("copied");
        copySysBtn.innerHTML = '<i class="fa-solid fa-check"></i> Adrès Kopye!';
        setFeedback("Adrès rezo a kopye nan presse-papi a.", "#00e676");
        setTimeout(() => {
          copySysBtn.classList.remove("copied");
          copySysBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Kopiye Adrès';
        }, 2000);
      } else {
        setFeedback(`Adrès: ${addr}`, "#fbbf24");
      }
    });
  }

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
      const pin = (document.getElementById("depo-pin-input")?.value || "").trim();

      if (calc.amount < cfg.minUsdt) {
        setFeedback(`Minimòm pou operasyon sa a se ${cfg.minUsdt} USDT.`, "#ff5252");
        return;
      }

      if (!target) {
        setFeedback("Tanpri antre adrès wallet la oswa TXID la.", "#ff5252");
        return;
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
        clientWalletOrTxid: target,
        target,
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
