import { auth, db } from './script.js';
import { collection, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigirasyon Rezo yo
const DIGICEL_NUM = "34132015";
const NATCOM_NUM = "32160708";
const NATCOM_PIN = "88888888";
const FEE_PERCENT = 16.5;

let selectedRezo = null;

// Lè itilizatè a klike sou bouton Digicel oswa Natcom
window.selectRezo = function(rezo) {
  selectedRezo = rezo;
  
  // Update vizyèl bouton yo
  const btnDigi = document.getElementById('btn-digi');
  const btnNat = document.getElementById('btn-nat');
  
  if (btnDigi) btnDigi.style.border = rezo === 'digicel' ? '3px solid #000' : 'none';
  if (btnNat) btnNat.style.border = rezo === 'natcom' ? '3px solid #000' : 'none';
  
  // Afiche fòm nan
  const formEchanj = document.getElementById('form-echanj');
  if (formEchanj) formEchanj.style.display = 'block';
};

document.addEventListener('DOMContentLoaded', () => {
  const btnVoye = document.getElementById('btn-voye-echanj');

  if (btnVoye) {
    btnVoye.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      
      // 1. Ferifye si itilizatè a konekte
      if (!currentUser) {
        alert("Tanpri konekte nan kont ou anvan.");
        return;
      }

      if (!selectedRezo) {
        alert("Tanpri chwazi yon rezo (Digicel oswa Natcom).");
        return;
      }

      const amountInput = document.getElementById('input-montan');
      const pinInput = document.getElementById('input-pin');

      const amount = parseFloat(amountInput.value);
      const userPinEntered = pinInput.value.trim();

      // 2. Validate montan an
      if (!amount || amount <= 0) {
        alert("Tanpri antre yon montan ki valab.");
        return;
      }

      // 3. Validate si l mete yon PIN
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
        const savedPin = userData.pinSecurity || userData.pin; // Chèche PIN nan profil li

        // Si itilizatè a pa t janm kreye yon PIN nan Settings
        if (!savedPin) {
          alert("Ou pa ankò kreye yon PIN sekirite nan Settings. Tanpri ale nan Settings pou w kreye youn anvan.");
          return;
        }

        // Si PIN li tape a pa koresponn ak sa ki nan Settings lan
        if (userPinEntered !== String(savedPin)) {
          alert("PIN sekirite a pa kòrèk! Ou pa ka kontinye tranzaksyon an.");
          return;
        }

        // 5. Jenere kòd USSD sipòte pa rezo a
        let ussdCode = "";
        if (selectedRezo === 'digicel') {
          ussdCode = `*128*509${DIGICEL_NUM}*${amount}#`;
        } else {
          ussdCode = `*123*${NATCOM_PIN}*${NATCOM_NUM}*${amount}#`;
        }

        const fee = (amount * FEE_PERCENT) / 100;
        const netAmount = amount - fee;

        btnVoye.innerText = "N ap anrejistre...";

        // 6. Anrejistre tranzaksyon an nan Firebase
        await addDoc(collection(db, "transactions"), {
          userId: currentUser.uid,
          type: "echanj_minit",
          rezo: selectedRezo,
          amount: amount,
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
