import { db, auth } from './script.js';
import { ref, onValue, get, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. CHACHE DONE PARENNAJ YO ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Koute balans komisyon an ak kòd ARS la
        const userRef = ref(db, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Afiche Balans Komisyon
                const komisyonBal = document.getElementById('komisyon-balans');
                if (komisyonBal) komisyonBal.innerText = parseFloat(data.komisyon_balance || 0).toFixed(2);
                
                // Afiche Kòd ARS
                const myCodeInput = document.getElementById('my-ref-code');
                if (myCodeInput) myCodeInput.value = data.ars_id || "Chaje...";

                // Afiche Non Parenn nan (Sponsor)
                const sponsorName = document.getElementById('my-sponsor');
                if (sponsorName) sponsorName.innerText = data.invited_by || "Sistèm";
            }
        });

        // Chache lis moun nan "Ekip" la
        chacheEkipMwen(user.uid);
    }
});

// --- 2. CHACHE LIS EKIP LA (MOUN OU ENVITE) ---
function chacheEkipMwen(uid) {
    const usersRef = ref(db, 'users');
    const ekipQuery = query(usersRef, orderByChild('invited_by_uid'), equalTo(uid));

    onValue(ekipQuery, (snapshot) => {
        const container = document.getElementById('container-lis-envite');
        const totalInvites = document.getElementById('total-invites');
        
        if (!container) return;
        container.innerHTML = ""; // Reyalize lis la

        if (snapshot.exists()) {
            let count = 0;
            snapshot.forEach((childSnapshot) => {
                count++;
                const moun = childSnapshot.val();
                
                const item = document.createElement('div');
                item.className = "setting-item-glass animated fadeInUp";
                item.style.marginBottom = "10px";
                item.style.padding = "10px";
                item.style.display = "flex";
                item.style.alignItems = "center";

                item.innerHTML = `
                    <div class="avatar-circle-small" style="width:40px; height:40px; border-radius:50%; overflow:hidden; border:2px solid var(--primary);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(moun.full_name)}&background=random&color=fff" style="width:100%; height:100%;">
                    </div>
                    <div class="item-info" style="margin-left:15px;">
                        <b style="font-size:14px; color:var(--text-color);">${moun.full_name}</b>
                        <p style="font-size:11px; opacity:0.6; color:var(--text-color);">${moun.ars_id} • ${new Date(moun.createdAt).toLocaleDateString()}</p>
                    </div>
                `;
                container.appendChild(item);
            });
            if (totalInvites) totalInvites.innerText = count;
        } else {
            container.innerHTML = `
                <div class="empty-state-box">
                    <i class="fas fa-user-clock"></i>
                    <p>Poko gen okenn aktivite nan ekip ou a.</p>
                </div>`;
            if (totalInvites) totalInvites.innerText = "0";
        }
    });
}

// --- 3. BOUTON KOPIYE ---
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    if (copyText) {
        copyText.select();
        copyText.setSelectionRange(0, 99999); 
        navigator.clipboard.writeText(copyText.value);
        
        const btn = document.getElementById('btn-copy-ref');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
        }
    }
};

// --- 4. BOUTON PATAJE ---
window.patajeLien = (platform) => {
    const code = document.getElementById('my-ref-code').value;
    const appLink = "https://teksechanjplus064.netlify.app";
    const message = encodeURIComponent(`Salitasyon! Mwen envite w sou Echanj Plus. Sèvi ak kòd mwen an (${code}) pou w jwenn rabè sou premye echanj ou: ${appLink}`);
    
    let shareUrl = "";
    switch(platform) {
        case 'whatsapp': shareUrl = `https://wa.me/?text=${message}`; break;
        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${appLink}`; break;
        case 'telegram': shareUrl = `https://t.me/share/url?url=${appLink}&text=${message}`; break;
        case 'sms': shareUrl = `sms:?body=${message}`; break;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
};

// --- 5. TRANSFÈ KOMISYON ---
window.demannTransfere = async () => {
    const balKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    
    if (balKomisyon < 50) {
        alert("Ou bezwen omwen 50.00 HTG pou w fè transfè sa a.");
        return;
    }

    if (confirm(`Èske ou vle transfere ${balKomisyon} HTG nan balans prensipal ou?`)) {
        try {
            const userRef = ref(db, 'users/' + auth.currentUser.uid);
            const snapshot = await get(userRef);
            const data = snapshot.val();

            const nouvoBalansPrensipal = (parseFloat(data.balance) || 0) + balKomisyon;
            
            await update(userRef, {
                balance: nouvoBalansPrensipal,
                komisyon_balance: 0 
            });

            alert("Transfè a fèt ak siksè! Balans ou mete ajou.");
        } catch (error) {
            alert("Erè nan transfè a: " + error.message);
        }
    }
};

console.log("Referral Module | Operasyonèl.");
          
