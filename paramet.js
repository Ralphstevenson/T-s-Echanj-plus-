import { getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = getApp();
const auth = getAuth(app);

const PAYOUT_STORAGE_KEY = "echanj_default_payout";

function loadUserAndSavedSettings(user) {
  const emailEl = document.getElementById("param-user-email");
  const uidEl = document.getElementById("param-user-uid");
  const walletEl = document.getElementById("param-default-wallet");
  const phoneEl = document.getElementById("param-default-phone");

  if (user) {
    if (emailEl) emailEl.textContent = user.email || "Pa gen imèl";
    if (uidEl) uidEl.textContent = user.uid;
  } else {
    if (emailEl) emailEl.textContent = "Pa konekte";
    if (uidEl) uidEl.textContent = "---";
  }

  const saved = localStorage.getItem(PAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (walletEl && parsed.wallet) walletEl.value = parsed.wallet;
      if (phoneEl && parsed.phone) phoneEl.value = parsed.phone;
    } catch (err) {
      console.error("Erè lekti nimewo resepsyon an:", err);
    }
  }
}

onAuthStateChanged(auth, (user) => {
  loadUserAndSavedSettings(user);
});

window.addEventListener("DOMContentLoaded", () => {
  loadUserAndSavedSettings(auth.currentUser);
});

window.saveDefaultPayoutInfo = function(event) {
  if (event) event.preventDefault();

  const walletEl = document.getElementById("param-default-wallet");
  const phoneEl = document.getElementById("param-default-phone");
  const msgEl = document.getElementById("param-save-msg");

  const wallet = walletEl ? walletEl.value : "MonCash";
  const phone = phoneEl ? phoneEl.value.trim() : "";

  if (!phone) {
    if (msgEl) {
      msgEl.textContent = "Tanpri antre yon nimewo telefòn valab.";
      msgEl.style.color = "#ff5252";
      msgEl.style.display = "block";
    }
    return;
  }

  localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify({ wallet, phone }));

  if (msgEl) {
    msgEl.textContent = `Anrejistre: ${wallet} (${phone}).`;
    msgEl.style.color = "#00e676";
    msgEl.style.display = "block";
  }
};

window.clearLocalCache = function(event) {
  if (event) event.preventDefault();

  localStorage.removeItem("echanj_last_inspected_tx");
  localStorage.removeItem(PAYOUT_STORAGE_KEY);

  const phoneEl = document.getElementById("param-default-phone");
  const msgEl = document.getElementById("param-save-msg");
  if (phoneEl) phoneEl.value = "";

  if (msgEl) {
    msgEl.textContent = "Kach lokal la netwaye.";
    msgEl.style.color = "#fbbf24";
    msgEl.style.display = "block";
  }
};

window.logoutEchanjUser = async function(event) {
  if (event) event.preventDefault();

  try {
    await signOut(auth);
    window.location.reload();
  } catch (err) {
    console.error("Erè dekoneksyon:", err);
  }
};
