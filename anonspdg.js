let ceoTimer = null;

window.showCEOInfo = function() {
  const card = document.getElementById('ceo-floating-card');
  if (!card) return;

  // Afiche kat la
  card.style.display = 'block';
  setTimeout(() => {
    card.style.opacity = '1';
  }, 10);

  // Si itilizatè a klike ankò anvan 20 segond yo fini, nou reset revèy la
  if (ceoTimer) {
    clearTimeout(ceoTimer);
  }

  // Fè kat la disparèt otomatikman apre 20 segond (20000 milisgond)
  ceoTimer = setTimeout(() => {
    card.style.opacity = '0';
    setTimeout(() => {
      card.style.display = 'none';
    }, 300); // Tann tranzisyon an fini anvan nou kache l nèt
  }, 20000);
};
