import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

document.addEventListener('DOMContentLoaded', () => {
  const selectDepatman = document.getElementById('select-depatman');
  const selectKomin = document.getElementById('select-komin');
  const btnSave = document.getElementById('btn-save-profil');
  const modalProfil = document.getElementById('modal-profil');

  // Chanje komin yo otomatikman lè yo chwazi yon depatman
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

        // 1. Kache / Fèmen modal profil la imedyatman
        if (modalProfil) {
          modalProfil.style.display = 'none';
        }

        // 2. Vide fòmilè a pou l pa rete ak ansyen enfòmasyon yo
        document.getElementById('input-profil-non').value = '';
        document.getElementById('input-profil-tel').value = '';
        document.getElementById('input-profil-seks').value = '';
        document.getElementById('select-depatman').value = '';
        selectKomin.innerHTML = '<option value="">Premye chwazi yon depatman</option>';
        document.getElementById('input-profil-zon').value = '';

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
