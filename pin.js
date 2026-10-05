import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

// Tcheke si itilizatè a konekte ak Firebase
onAuthStateChanged(auth, (user) => {
  if (user) {
    showSecurityTip();
  } else {
    closeSecurityTip();
  }
});

// Fonksyon pou afiche modal la
function showSecurityTip() {
  const tipOverlay = document.getElementById('floating-security-tip');
  if (tipOverlay) {
    tipOverlay.classList.add('show');
  }
}

// Fonksyon pou fèmen modal la lè itilizatè a klike sou OK
window.closeSecurityTip = function() {
  const tipOverlay = document.getElementById('floating-security-tip');
  if (tipOverlay) {
    tipOverlay.classList.remove('show');
  }
};
