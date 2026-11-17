import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const rtdb = getDatabase();
const auth = getAuth();

window.rtdb = rtdb;
window.auth = auth;

// Tout komin yo pa depatman an Ayiti
window.komins = {
  "Lwès": ["Pòtoprens", "Delmas", "Petyonvil", "Kafou", "Kwadèboukè", "Gressier", "Kenscoff", "Cité Soleil", "Tabarre", "Grand-Goâve", "Petit-Goâve"],
  "Nò": ["Kap Ayisyen", "Akil Nò", "Bansè", "Bò Mòn", "Lenbe", "Lison", "Plèn Nò", "Pò Mago", "Sen Rasyon", "Sen Rapèl", "Don Datos"],
  "Nòdès": ["Fò Libète", "Baramòt", "Caracol", "Fò Dòf", "Grangou", "Matèn", "Terrier-Rouge", "Trou du Nord", "Vallières"],
  "Nòdwès": ["Pòdepè", "Ans a Fè", "Bassin-Bleu", "Chansolme", "Mòtpli", "Ba-de-Soleil", "Tòti"],
  "Latibonit": ["Gonayiv", "Sen Mak", "Desalin", "Ans Wouj", "Basen", "Marmelade", "Lestère", "Pò Mago", "Vèr", "Grande Saline"],
  "Sant": ["Hinche", "Cerca La Source", "Maïssade", "Savanèt", "Sen Mikal", "Mache Panyòl"],
  "Grand'Anse": ["Jérémie", "Anse d'Hainault", "Abricots", "Chambellan", "Corail", "Dame-Marie", "Moron", "Pestel", "Les Irois"],
  "Nip": ["Miragwàn", "Ans Vavo", "Baradè", "Fò Liberasyon", "Pètit Rivyè de Nip", "L'Asile", "Plaisance du Sud"],
  "Sid": ["Les Cayes", "Aquin", "Chantal", "Maniche", "Port-Salut", "Torbeck", "Camp-Perrin", "Cavaillon", "Arniquet"],
  "Sidès": ["Jakmèl", "Bèl Anse", "Marigot", "Mayò", "Grand-Gosier", "Thai-Thail"]
};

// Fonksyon pou tcheke si itilizatè a gen profil ranpli (Guard Clause)
async function checkUserProfileFirst(user) {
  const modalProfil = document.getElementById('modal-profil');
  if (!modalProfil) return;

  if (!user) {
    modalProfil.style.setProperty('display', 'none', 'important');
    return;
  }

  try {
    const userRef = ref(rtdb, 'users/' + user.uid);
    const snapshot = await get(userRef);

    // Si done yo pa egziste oswa yo manke chan esansyèl yo, fòse fòm nan parèt
    if (!snapshot.exists() || !snapshot.val().fullName || !snapshot.val().departman || !snapshot.val().komin) {
      modalProfil.style.setProperty('display', 'flex', 'important');
    } else {
      modalProfil.style.setProperty('display', 'none', 'important'); // Kache l nèt si tout done yo la
    }
  } catch (error) {
    console.error("Erè nan tcheke profil la:", error);
  }
}

window.checkUserProfileFirst = checkUserProfileFirst;

document.addEventListener('DOMContentLoaded', () => {
  const selectDepatman = document.getElementById('select-depatman');
  const selectKomin = document.getElementById('select-komin');
  const btnSave = document.getElementById('btn-save-profil');
  const modalProfil = document.getElementById('modal-profil');

  // Tcheke estati itilizatè a depi nan konmansman
  onAuthStateChanged(auth, (user) => {
    checkUserProfileFirst(user);
  });

  // Lojik: Fèmen modal la si itilizatè a klike sou zòn nwa ki deyò l la (Backdrop Click)
  if (modalProfil) {
    modalProfil.addEventListener('click', (e) => {
      // Nou anpeche l fèmen si li klike anndan bwat blan an, fòk li klike sou background nwa a
      if (e.target === modalProfil) {
        // Nou verifye si itilizatè a gen yon profil valab deja anvan n kite l fèmen l konsa
        const currentUser = auth.currentUser;
        if (currentUser) {
          get(ref(rtdb, 'users/' + currentUser.uid)).then((snapshot) => {
            if (snapshot.exists() && snapshot.val().fullName && snapshot.val().departman) {
              modalProfil.style.setProperty('display', 'none', 'important');
            } else {
              alert("Ou dwe ranpli enfòmasyon profil ou yo anvan ou kontinye.");
            }
          });
        }
      }
    });
  }

  // Jere lis komin yo otomatikman lè yo chwazi depatman an (ak sipò pou pre-select)
  window.populateKomins = function(dep, selectedKomin = "") {
    if (!selectKomin) return;
    selectKomin.innerHTML = '<option value="">Chwazi yon komin</option>';
    
    if (window.komins[dep]) {
      window.komins[dep].forEach(komin => {
        const opt = document.createElement('option');
        opt.value = komin;
        opt.textContent = komin;
        if (komin === selectedKomin) {
          opt.selected = true;
        }
        selectKomin.appendChild(opt);
      });
    }
  };

  if (selectDepatman) {
    selectDepatman.addEventListener('change', (e) => {
      const dep = e.target.value;
      window.populateKomins(dep);
    });
  }

  // Anrejistreman done profil yo nan Firebase RTDB (ak validasyon nimewo 8 chif)
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Tanpri konekte anvan.");
        return;
      }

      const fullName = document.getElementById('input-profil-non').value.trim();
      const phone = document.getElementById('input-profil-tel').value.trim();
      const sex = document.getElementById('input-profil-seks').value;
      const departman = document.getElementById('select-depatman').value;
      const komin = document.getElementById('select-komin').value;
      const zon = document.getElementById('input-profil-zon').value.trim();

      // Validasyon chan yo
      if (!fullName || !phone || !sex || !departman || !komin || !zon) {
        alert("Tanpri ranpli tout chan yo.");
        return;
      }

      // Validasyon strik: Nimewo telefòn dwe egzakteman 8 chif
      if (phone.length !== 8 || isNaN(phone)) {
        alert("Nimewo telefòn lan dwe gen egzakteman 8 chif (san konte +509 la).");
        return;
      }

      btnSave.innerText = "N ap anrejistre...";
      btnSave.disabled = true;

      try {
        const profilData = {
          fullName,
          phone,
          sex,
          departman,
          komin,
          zon,
          updatedAt: new Date().toISOString()
        };

        const userRef = ref(rtdb, 'users/' + currentUser.uid);
        await set(userRef, profilData);

        alert("Profil ou an anrejistre avèk siksè!");
        
        // Fèmen modal profil la imedyatman apre anrejistreman
        if (modalProfil) {
          modalProfil.style.setProperty('display', 'none', 'important');
        }

      } catch (error) {
        console.error("Erè:", error);
        alert("Gen yon erè ki rive: " + error.message);
      } finally {
        btnSave.innerText = "Anrejistre Profil";
        btnSave.disabled = false;
      }
    });
  }
});
