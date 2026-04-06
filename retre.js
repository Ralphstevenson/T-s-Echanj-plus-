/**
 * Gid: Jere tout etap retrè kòb la (Validation, PIN, Confirmation)
 */

export function initRetreLogic() {
    const btnKonfime = document.getElementById('btn-konfime-retre');
    const btnNextStep2 = document.getElementById('next-to-step2');
    const btnVerifyPin = document.getElementById('btn-verify-pin-retre');

    if (!btnKonfime) return;

    // ETAP 1: Klike sou bouton prensipal la
    btnKonfime.onclick = () => {
        const name = document.getElementById('retre-name').value;
        const phone = document.getElementById('retre-phone').value;
        const amount = document.getElementById('retre-amount').value;
        const method = document.getElementById('retre-method').value;

        if (!name || !phone || amount < 100) {
            alert("Tanpri ranpli tout chan yo kòrèkteman (Min 100 HTG).");
            return;
        }

        // Montre Recap done yo
        const recapBox = document.getElementById('info-recap');
        recapBox.innerHTML = `
            <p><b>Reseptè:</b> ${name}</p>
            <p><b>Telefòn:</b> ${phone}</p>
            <p><b>Metòd:</b> ${method}</p>
            <p><b>Montan:</b> <span style="color:#FFD700">${amount} HTG</span></p>
        `;

        document.getElementById('modal-step1').classList.remove('hidden');
    };

    // ETAP 2: Ale nan PIN
    btnNextStep2.onclick = () => {
        document.getElementById('modal-step1').classList.add('hidden');
        document.getElementById('modal-pin-retre').classList.remove('hidden');
    };

    // ETAP 3: Verifye PIN
    btnVerifyPin.onclick = () => {
        const pinInput = document.getElementById('pin-retre-input').value;
        // Isit la ou sipoze verifye PIN lan ak sa ki nan Firebase la
        if (pinInput.length === 4) {
            document.getElementById('modal-pin-retre').classList.add('hidden');
            
            // Montre dènye konfimasyon an
            const amount = document.getElementById('retre-amount').value;
            document.getElementById('amount-recap').innerText = amount + " HTG";
            document.getElementById('modal-step2').classList.remove('hidden');
        } else {
            alert("PIN lan dwe gen 4 chif.");
        }
    };

    // ETAP FINAL: Voye demann lan
    window.finaliseRetre = function() {
        document.getElementById('modal-step2').classList.add('hidden');
        document.getElementById('modal-final').classList.remove('hidden');

        // Fèmen modal siksè a apre 4 segonn
        setTimeout(() => {
            window.closeAllModals();
            // Ou ka reset fòm lan isit la
        }, 4000);
    };

    window.closeAllModals = function() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    };
          }
          
