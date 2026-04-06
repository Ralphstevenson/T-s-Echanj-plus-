/**
 * Gid: Fichye sa a jere tout entèraksyon nan Sidebar la
 */

// Fonksyon pou ouvri/fèmen Sidebar la
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay'); // Si ou gen yon div pou nwa dèyè a
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
};

// Fonksyon pou mete ajou enfòmasyon pèsonèl nan Sidebar la
export function updateSidebarUI(userData) {
    const sideName = document.getElementById('side-name');
    const sideEmail = document.getElementById('side-email');
    const sideId = document.getElementById('side-id');
    const greeting = document.getElementById('header-user-greeting');
    const security = document.getElementById('header-security-status');

    if (sideName) sideName.innerText = userData.name || "Kliyan Echanj";
    if (sideEmail) sideEmail.innerText = userData.email || "";
    if (sideId) sideId.innerText = userData.arsId || "ARS-0000";
    
    // Tèks Byenveni an jan ou te mande l la
    if (greeting) greeting.innerText = "Welcome 🤗 !";
    
    // Estati sekirite a
    if (security) {
        security.innerHTML = '<i class="fa fa-shield-check"></i> Kont Sekirize';
    }
}

// Fèmen sidebar si itilizatè a klike sou yon lyen
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            window.toggleSidebar();
        }
    });
});

