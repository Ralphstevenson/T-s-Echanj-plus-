document.addEventListener('DOMContentLoaded', () => {
  const btnOpenProfileView = document.getElementById('open-profile-modal');
  const modalGadeProfil = document.getElementById('modal-gade-profil');
  const closeGadeProfil = document.getElementById('close-gade-profil');
  const btnLouvriModifye = document.getElementById('btn-louvri-modifye');
  const modalProfil = document.getElementById('modal-profil'); // Fòm modifye a

  // Lè itilizatè a klike sou lyen profil la nan sidebar la
  if (btnOpenProfileView && modalGadeProfil) {
    btnOpenProfileView.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Tanpri konekte anvan.");
        return;
      }

      try {
        const userRef = ref(rtdb, 'users/' + currentUser.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Afiche done yo nan modal la
          document.getElementById('lbl-profil-non').textContent = data.fullName || '';
          document.getElementById('lbl-profil-tel').textContent = data.phone || '';
          document.getElementById('lbl-profil-seks').textContent = data.sex || '';
          document.getElementById('lbl-profil-depatman').textContent = data.departman || '';
          document.getElementById('lbl-profil-komin').textContent = data.komin || '';
          document.getElementById('lbl-profil-zon').textContent = data.zon || '';

          // Louvri fenèt modal kote l ap wè enfòmasyon l yo
          modalGadeProfil.style.setProperty('display', 'flex', 'important');
        } else {
          alert("Poko gen done profil anrejistre pou ou.");
        }
      } catch (error) {
        console.error("Erè nan chaje profil la:", error);
      }

      // Fèmen sidebar la apre l fin klike sou li
      if (typeof window.toggleSidebar === 'function') {
        window.toggleSidebar();
      }
    });
  }

  // Fèmen modal gade profil la
  if (closeGadeProfil && modalGadeProfil) {
    closeGadeProfil.addEventListener('click', () => {
      modalGadeProfil.style.setProperty('display', 'none', 'important');
    });
  }

  // Si l vle chanje enfòmasyon l yo, bouton modifye a ap ouvri fòm nan epi pre-ranpli l
  if (btnLouvriModifye && modalProfil && modalGadeProfil) {
    btnLouvriModifye.addEventListener('click', async () => {
      modalGadeProfil.style.setProperty('display', 'none', 'important');
      
      // Chaje done yo nan fòm nan pou l ka modifye yo
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = ref(rtdb, 'users/' + currentUser.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          document.getElementById('input-profil-non').value = data.fullName || '';
          document.getElementById('input-profil-tel').value = data.phone || '';
          document.getElementById('input-profil-seks').value = data.sex || '';
          document.getElementById('input-profil-zon').value = data.zon || '';
          // Depatman ak komin...
        }
      }

      modalProfil.style.setProperty('display', 'flex', 'important');
    });
  }
});
