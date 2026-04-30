/**
 * 1. OUVRI AK FÈMEN SIDEBAR
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Togle klas 'open' la
    const isOpen = sidebar.classList.toggle('open');
    
    // Montre oswa kache overlay a
    overlay.style.display = isOpen ? 'block' : 'none';
}

/**
 * 2. CHANJE PAJ (NAVIGASYON)
 */
function switchPage(pageId, element) {
    // 1. Kache tout seksyon paj yo (yo dwe gen klas 'page-section' oswa ou vize id yo)
    // Sipoze paj ou yo anndan <main> ak ID tankou 'paj-akey', 'paj-echanj', elatriye.
    const allPages = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-istorik', 'paj-paramet'];
    
    allPages.forEach(id => {
        const page = document.getElementById(id);
        if (page) page.classList.add('hidden');
    });

    // 2. Montre paj ki klike a
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // 3. Jere klas 'active' nan sidebar a
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // 4. Fèmen sidebar a otomatikman apre klik la
    toggleSidebar();
    
    console.log(`Navige vè: ${pageId}`);
}

/**
 * 3. DEKONEKTE
 */
function logoutUser() {
    if (confirm("Èske ou vle dekonekte vre?")) {
        // Ajoute lojik Firebase signOut ou isit la
        console.log("Itilizatè dekonekte");
        window.location.reload();
    }
}
