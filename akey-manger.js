/**
 * Gid: Jere tout eleman nan paj Akèy la (Carousel, Balans, Flash Info)
 */

let currentSlide = 0;
let slideInterval;

// --- 1. JENEYE CAROUSEL LA ---
export function initAkeyFeatures() {
    const slidesContainer = document.getElementById('carousel-slider');
    const allSlides = document.querySelectorAll('.slide');
    const totalSlides = allSlides.length;

    if (!slidesContainer || totalSlides === 0) return;

    // Fonksyon pou deplase slide yo
    const moveSlide = () => {
        currentSlide++;
        if (currentSlide >= totalSlides) {
            currentSlide = 0;
        }
        const offset = currentSlide * -100;
        slidesContainer.style.transform = `translateX(${offset}%)`;
    };

    // Netwaye entèval si l te egziste deja pou evite akselerasyon
    if (slideInterval) clearInterval(slideInterval);
    
    // Chanje slide chak 4 segonn
    slideInterval = setInterval(moveSlide, 4000);
}

// --- 2. METE AJOU BALANS LAN ---
export function updateAkeyBalance(amount) {
    const balanceEl = document.getElementById('user-balance');
    if (balanceEl) {
        // Nou fòmate nimewo a pou l gen 2 chif apre pwen an (eg: 150.00)
        const formatted = parseFloat(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        balanceEl.innerText = formatted;
    }
}

// --- 3. METE AJOU FLASH INFO A ---
export function setFlashInfo(message) {
    const flashBar = document.getElementById('header-flash-info');
    if (flashBar) {
        // Nou ajoute yon ti icon zèklè pou l parèt pi byen
        flashBar.innerHTML = `<i class="fa fa-bolt"></i> ${message}`;
    }
}

