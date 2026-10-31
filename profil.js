import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const rtdb = getDatabase();
const auth = getAuth();

// Tout komin yo pa depatman an Ayiti
const komins = {
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

// Fonksyon ki tcheke anvan tout bagay
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

    // Si done yo pa egziste oswa yo manke chan esansyèl yo
    if (!snapshot.exists() || !snapshot.val().fullName || !snapshot.val().departman) {
      modalProfil.style.setProperty('display', 'flex', 'important'); // Fòse l parèt pou l ranpli fòm nan
    } else {
      modalProfil.style.setProperty('display', 'none', 'important'); // Kache l nèt si l gen done deja
    }
  } catch (error) {
    console.error("Erè nan tcheke profil la:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const selectDepatman = document.getElementById('select-depatman');
  const selectKomin = document.getElementById('select-komin');
  const btnSave = document.getElementById('btn-save-profil');

  // Tcheke estati itilizatè a depi nan konmansman
  onAuthStateChanged(auth, (user) => {
    checkUserProfileFirst(user);
  });

  // Jere lis komin yo otomatikman lè yo chwazi depatman an
  if (selectDepatman) {
    selectDepatman.addEventListener('change', (e) => {
      const dep = e.target.value;
      selectKomin.innerHTML = '<option value="">Chwazi yon komin</option>';
      
      if (komins[dep]) {
        komins[dep].forEach(komin => {
          const opt = document.createElement('option');
          opt.value = komin;
          opt.textContent = komin;
          selectKomin.appendChild(opt);
        });
      }
    });
  }

  // Anrejistreman done profil yo nan Firebase RTDB
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

      if (!fullName || !phone || !sex || !departman || !komin || !zon) {
        alert("Tanpri ranpli tout chan yo.");
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
          createdAt: new Date().toISOString()
        };

        const userRef = ref(rtdb, 'users/' + currentUser.uid);
        await set(userRef, profilData);

        alert("Profil ou an anrejistre avèk siksè!");
        
        // Apre l anrejistre, nou kache fòm nan imedyatman
        checkUserProfileFirst(currentUser);

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
