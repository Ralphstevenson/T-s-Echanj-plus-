/* ============================================================
   JESYON SIDEBAR & NAVIGASYON - ECHANJ PLUS V3.2
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Nou asire nou tout eleman yo la anvan nou kòmanse
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // 1. FONKSYON POU TOOGLE SIDEBAR (Louvri/Fèmen)
    window.toggleSidebar = function() {
        sidebar.classList.toggle('open');
        
        // Si sidebar la gen klas 'open', nou montre overlay a
        if (sidebar.classList.contains('open')) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 10);
            document.body.style.overflow = 'hidden'; // Anpeche paj la scroll dèyè
        } else {
            closeSidebarEffect();
        }
    };

    // 2. FONKSYON POU FÈMEN SIDEBAR PROPREMAN
    function closeSidebarEffect() {
        sidebar.classList.remove('open');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Fèmen sidebar si moun nan klike sou overlay a
    overlay.addEventListener('click', closeSidebarEffect);

    // 3. FONKSYON POU CHANJE PAJ
    window.switchPage = function(pageId, element) {
        // Lis tout ID seksyon paj ou genyen nan HTML la
        const pages = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-istorik', 'paj-paramet'];

        pages.forEach(id => {
            const pageNode = document.getElementById(id);
            if (pageNode) {
                pageNode.classList.add('hidden'); // Kache tout paj
            }
        });

        // Montre paj ki mande a
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            window.scrollTo(0, 0); // Remonte anlè lè paj la chanje
        }

        // Jere klas 'active' nan meni an
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (element) {
            element.classList.add('active');
        }

        // Fèmen sidebar otomatikman apre klik la
        closeSidebarEffect();
    };

    // 4. JESYON DEKONEKSYON
    window.logoutUser = function() {
        if (confirm("Èske ou vle dekonekte sou kont Echanj Plus ou a?")) {
            // Si w ap itilize Firebase, mete: auth.signOut();
            console.log("Logout deklanche");
            location.reload(); 
        }
    };
});
            
