import { getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const PAYOUT_STORAGE_KEY = "echanj_default_payout";
const LAST_TX_STORAGE_KEY = "echanj_last_inspected_tx";

let authInstance = null;
let authListenerAttached = false;

function getAuthInstance() {
  if (authInstance) return authInstance;
  if (getApps().length) {
    authInstance = getAuth(getApp());
    if (!authListenerAttached) {
      authListenerAttached = true;
      onAuthStateChanged(authInstance, (user) => {
        loadUserAndSavedSettings(user);
      });
    }
  }
  return authInstance;
}

function showParamMessage(text, color = "#00e676") {
  const msgEl = document.getElementById("param-save-msg");
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = color;
  msgEl.style.display = "block";
}

function loadUserAndSavedSettings(user = null) {
  const currentAuth = getAuthInstance();
  const activeUser = user || (currentAuth ? currentAuth.currentUser : null);

  const emailEl = document.getElementById("param-user-email");
  const uidEl = document.getElementById("param-user-uid");
  const walletEl = document.getElementById("param-default-wallet");
  const phoneEl = document.getElementById("param-default-phone");

  if (emailEl) {
    emailEl.textContent = activeUser ? (activeUser.email || "Pa gen imèl") : "Pa konekte";
  }
  if (uidEl) {
    uidEl.textContent = activeUser ? activeUser.uid : "---";
  }

  const saved = localStorage.getItem(PAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (walletEl && parsed.wallet) walletEl.value = parsed.wallet;
      if (phoneEl && parsed.phone && !phoneEl.value) phoneEl.value = parsed.phone;
    } catch (err) {
      console.error("Erè lekti nimewo resepsyon an:", err);
    }
  }
}

window.refreshParametSection = function () {
  const currentAuth = getAuthInstance();
  loadUserAndSavedSettings(currentAuth ? currentAuth.currentUser : null);
};

getAuthInstance();

window.addEventListener("DOMContentLoaded", () => {
  loadUserAndSavedSettings();
});

document.addEventListener("click", (e) => {
  const settingTrigger = e.target.closest('[onclick*="paj-setting"]');
  if (settingTrigger) {
    setTimeout(() => window.refreshParametSection(), 60);
  }
});

window.saveDefaultPayoutInfo = function (event) {
  if (event) event.preventDefault();

  const walletEl = document.getElementById("param-default-wallet");
  const phoneEl = document.getElementById("param-default-phone");

  const wallet = walletEl ? walletEl.value : "MonCash";
  const cleanPhone = phoneEl ? phoneEl.value.replace(/\D/g, "").slice(-8) : "";

  if (cleanPhone.length < 8) {
    showParamMessage("Tanpri antre yon nimewo 8 chif valab (Eg: 34132015).", "#ff5252");
    return;
  }

  if (phoneEl) phoneEl.value = cleanPhone;
  localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify({ wallet, phone: cleanPhone }));
  showParamMessage(`Anrejistre: ${wallet} (+509 ${cleanPhone}).`, "#00e676");
};

window.clearLocalCache = function (event) {
  if (event) event.preventDefault();

  localStorage.removeItem(LAST_TX_STORAGE_KEY);
  localStorage.removeItem(PAYOUT_STORAGE_KEY);

  const phoneEl = document.getElementById("param-default-phone");
  if (phoneEl) phoneEl.value = "";

  const detId = document.getElementById("det-id");
  if (detId) detId.textContent = "--";

  showParamMessage("Kach lokal la netwaye nèt.", "#fbbf24");
};

window.logoutEchanjUser = async function (event) {
  if (event) event.preventDefault();

  try {
    const currentAuth = getAuthInstance();
    if (currentAuth) {
      await signOut(currentAuth);
    }
    localStorage.removeItem(LAST_TX_STORAGE_KEY);
    window.location.reload();
  } catch (err) {
    console.error("Erè dekoneksyon:", err);
    showParamMessage("Erè pandan dekoneksyon an. Eseye ankò.", "#ff5252");
  }
};
