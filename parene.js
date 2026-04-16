import { db, auth } from './script.js';
import { 
    ref, onValue, get, update, query, orderByChild, equalTo 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CHACHE DONE PARENNAJ ITILIZATÈ A
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        
        // Koute chanjman nan balans ak kòd ARS
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Afiche Balans Komisyon
                const komisyonBal = document.getElementById('komisyon-balans');
                if (komisyonBal) {
                    komisyonBal.innerText = parseFloat(data.komisyon_balance || 0).toFixed(2);
                }
                
                // Afiche Kòd ARS (Tcheke tou de fòma yo pou sekirite)
                const myCodeInput = document.getElementById('my-ref-code');
                if (myCodeInput) {
                    myCodeInput.value = data.ars_id || data.arsID || "Chaje...";
                }

                // Afiche Non Parenn nan
                const sponsorName = document.getElementById('my-sponsor');
                if (sponsorName) {
                    sponsorName.innerText = data.invited_by || "Sistèm";
                }
            }
        });

        // Chaje lis "Ekip" la (Moun ou envite yo)
        chacheEkipMwen(user.uid);
    }
});

// 2. CHACHE LIS EKIP LA (LIVE)
function chacheEkipMwen(uid) {
    const usersRef = ref(db, 'users');
    // Nou chèche tout moun ki gen UID ou nan "invited_by_uid"
    const ekipQuery = query(usersRef, orderByChild('invited_by_uid'), equalTo(uid));

    onValue(ekipQuery, (snapshot) => {
        const container = document.getElementById('container-lis-envite');
        const totalInvites = document.getElementById('total-invites');
        
        if (!container) return;
        container.innerHTML = ""; 

        if (snapshot.exists()) {
            let count = 0;
            snapshot.forEach((childSnapshot) => {
                count++;
                const moun = childSnapshot.val();
                
                const item = document.createElement('div');
                item.className = "setting-item-glass animated fadeIn";
                item.style.cssText = "margin-bottom:12px; padding:12px; display:flex; align-items:center; border-radius:15px;";

                item.innerHTML = `
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(moun.full_name || moun.name)}&background=109121&color=fff" 
                         style="width:40px; height:40px; border-radius:50%; border: 2px solid #FFD700;">
                    <div style="margin-left:15px;">
                        <b style="display:block; font-size:14px; color:var(--text-color);">${moun.full_name || moun.name}</b>
                        <small style="opacity:0.6; color:var(--text-color);">${moun.ars_id || moun.arsID} • Enskri</small>
                    </div>
                `;
                container.appendChild(item);
            });
            if (totalInvites) totalInvites.innerText = count;
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; opacity:0.5;">
                    <p>Poko gen okenn aktivite nan ekip ou a.</p>
                </div>`;
            if (totalInvites) totalInvites.innerText = "0";
        }
    });
}

// 3. BOUTON KOPIYE KÒD LA
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    if (copyText && copyText.value !== "Chaje...") {
        copyText.select();
        navigator.clipboard.writeText(copyText.value);
        alert("Kòd ou kopiye: " + copyText.value);
    }
};

// 4. TRANSFÈRE KOMISYON NAN BALANS PRENSIPAL
window.demannTransfere = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = ref(db, 'users/' + user.uid);
        const snap = await get(userRef);
        const data = snap.val();

        const komisyon = parseFloat(data.komisyon_balance || 0);

        if (komisyon < 50) {
            alert("Ou bezwen omwen 50.00 HTG pou w fè transfè sa a.");
            return;
        }

        const nouvoBalansPrensipal = (parseFloat(data.balance) || 0) + komisyon;

        // Mizajour an menm tan
        await update(userRef, {
            balance: nouvoBalansPrensipal,
            komisyon_balance: 0
        });

        alert("Bravo! Kòb la transfere nan balans prensipal ou.");
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// 5. PATAJE SOU REZO SOSYO
window.patajeLien = (platform) => {
    const code = document.getElementById('my-ref-code').value;
    const link = "https://echanjplus064.netlify.app/register.html?ref=" + code;
    const msg = encodeURIComponent(`Antre sou Echanj Plus ak kòd mwen an (${code}) pou w fè echanj rapid: `);
    
    const urls = {
        whatsapp: `https://wa.me/?text=${msg}${link}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
        telegram: `https://t.me/share/url?url=${link}&text=${msg}`,
        sms: `sms:?body=${msg}${link}`
    };
    
    if (urls[platform]) window.open(urls[platform], '_blank');
};
            
