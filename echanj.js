// ==========================================
// ECHANJ MINIT MODULE (echanj.js)
// ==========================================
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Reperan instans Firebase ki deja inisyalize nan script prensipal la
const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Konfigirasyon Rezo, Frais ak Limit yo
const DIGICEL_NUM = "34132015";
const NATCOM_NUM = "32160708";
const NATCOM_PIN = "88888888";

const FEE_DIGICEL = 18.3; // 18.3% pou Digicel
const FEE_NATCOM = 17.5;  // 17.5% pou Natcom

const MIN_AMOUNT = 100;    // Minimum 100 HTG pou tou de rezo yo
const MAX_DIGICEL = 1000;  // Maximum 1000 HTG pou Digicel
const MAX_NATCOM = 500;    // Maximum 500 HTG pou Natcom

let selectedRezo = null;

// Fonksyon pou chwazi rezo a
window.selectRezo = function(rezo) {
  selectedRezo = rezo;
  
  const btnDigi = document.getElementById('btn-digi');
  const btnNat = document.getElementById('btn-nat');
  const formEchanj = document.getElementById('form-echanj');
  
  // Update klase ak style vizyèl pou bouton yo
  if (btnDigi) {
    if (rezo === 'digicel') btnDigi.classList.add('selected');
    else btnDigi.classList.remove('selected');
  }

  if (btnNat) {
    if (rezo === 'natcom') btnNat.classList.add('selected');
    else btnNat.classList.remove('selected');
  }
  
  // Afiche fòm echanj la
  if (formEchanj) {
    formEchanj.style.display = 'block';
  }
};

// Lè paj la fin chaje
document.addEventListener('DOMContentLoaded', () => {
  const btnDigi = document.getElementById('btn-digi');
  const btnNat = document.getElementById('btn-nat');
  const btnVoye = document.getElementById('btn-voye-echanj');

  // Koute klik sou bouton rezo yo (si yo pa itilize onclick nan HTML)
  if (btnDigi) {
    btnDigi.addEventListener('click', () => window.selectRezo('digicel'));
  }

  if (btnNat) {
    btnNat.addEventListener('click', () => window.selectRezo('natcom'));
  }

  // Soumisyon ak tretman tranzaksyon an
  if (btnVoye) {
    btnVoye.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      
      // 1. Verifye si itilizatè a konekte
      if (!currentUser) {
        if (typeof window.showAlert === 'function') {
          window.showAlert("Tanpri konekte nan kont ou anvan.");
        } else {
          alert("Tanpri konekte nan kont ou anvan.");
        }
        return;
      }

      if (!selectedRezo) {
        alert("Tanpri chwazi yon rezo (Digicel oswa Natcom).");
        return;
      }

      const amountInput = document.getElementById('input-montan');
      const pinInput = document.getElementById('input-pin');

      if (!amountInput || !pinInput) {
        console.error("Champ montan oswa PIN pa egziste nan HTML la.");
        return;
      }

      const amount = parseFloat(amountInput.value);
      const userPinEntered = pinInput.value.trim();

      // 2. VALIDASYON MONTAN MINIMUM AK MAXIMUM
      if (!amount || isNaN(amount)) {
        alert("Tanpri antre yon montan ki valab.");
        return;
      }

      if (amount < MIN_AMOUNT) {
        alert(`Minimum ou ka transfere se ${MIN_AMOUNT} HTG.`);
        return;
      }

      if (selectedRezo === 'digicel' && amount > MAX_DIGICEL) {
        alert(`Kantitè maksimòm pou Digicel se ${MAX_DIGICEL} HTG.`);
        return;
      }

      if (selectedRezo === 'natcom' && amount > MAX_NATCOM) {
        alert(`Kantitè maksimòm pou Natcom se ${MAX_NATCOM} HTG.`);
        return;
      }

      // 3. Verifye si l antre PIN 4 chif
      if (!userPinEntered || userPinEntered.length !== 4) {
        alert("Tanpri antre PIN sekirite 4 chif ou an.");
        return;
      }

      try {
        btnVoye.disabled = true;
        btnVoye.innerText = "N ap verifye PIN...";

        // 4. CHÈCHE AK VERIFYE PIN NAN SETTINGS (FIRESTORE)
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          alert("Erè: Nou pa jwenn enfòmasyon kont ou an.");
          return;
        }

        const userData = userDocSnap.data();
        const savedPin = userData.pinSecurity || userData.pin;

        if (!savedPin) {
          alert("Ou pa ankò kreye yon PIN sekirite nan Settings. Tanpri ale nan Settings pou w kreye youn anvan.");
          return;
        }

        if (userPinEntered !== String(savedPin)) {
          alert("PIN sekirite a pa kòrèk! Ou pa ka kontinye tranzaksyon an.");
          return;
        }

        // 5. KALKIL FRAIS AK KÒD USSD
        let currentFeePercent = 0;
        let ussdCode = "";

        if (selectedRezo === 'digicel') {
          currentFeePercent = FEE_DIGICEL;
          ussdCode = `*128*509${DIGICEL_NUM}*${amount}#`;
        } else {
          currentFeePercent = FEE_NATCOM;
          ussdCode = `*123*${NATCOM_PIN}*${NATCOM_NUM}*${amount}#`;
        }

        const fee = (amount * currentFeePercent) / 100;
        const netAmount = amount - fee;

        btnVoye.innerText = "N ap anrejistre...";

        // 6. Anrejistre tranzaksyon an nan Firebase
        await addDoc(collection(db, "transactions"), {
          userId: currentUser.uid,
          userPhone: userData.phone || null,
          type: "echanj_minit",
          rezo: selectedRezo,
          amount: amount,
          feePercent: currentFeePercent,
          fee: fee,
          netAmount: netAmount,
          ussdSent: ussdCode,
          status: "pending",
          createdAt: serverTimestamp()
        });

        // Vide fòm lan
        amountInput.value = '';
        pinInput.value = '';

        // 7. Ouvè Dialer telefòn nan ak kòd USSD a
        window.location.href = `tel:${encodeURIComponent(ussdCode)}`;

      } catch (error) {
        console.error("Erè nan echanj:", error);
        alert("Gen yon erè ki rive. Tanpri eseye ankò.");
      } finally {
        btnVoye.disabled = false;
        btnVoye.innerText = "KONEKTE AK DIALER";
      }
    });
  }
});
