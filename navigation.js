/** GLOBAL NAVIGATION & SCROLL BEHAVIORS **/

document.addEventListener('DOMContentLoaded', () => {
    // Note: Navbar scroll logic is now managed in app.js via the initNavbarScroll() function
    // for better integration with the nav-hidden class.

    // Initialize global navigation and scroll features
    initFooterHomeScroll();
    initScrollToTop();
    initScrollReveal();
});

/** FOOTER HOME SCROLL LOGIC **/
function initFooterHomeScroll() {
    const scrollLinks = document.querySelectorAll('.footer-nav a, .nav-tab:not(.btn-animate)');
    const currentPath = window.location.pathname.toLowerCase();
    
    scrollLinks.forEach(link => {
        const href = link.getAttribute('href')?.toLowerCase();
        if (!href || href.startsWith('javascript')) return;
        
        const isHome = href === 'index.html' || href === './' || href === '/';
        const isMatch = (href && currentPath.endsWith(href)) || 
                        (isHome && (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === ''));

        if (isMatch) {
            link.addEventListener('click', (e) => {
                if (link.id === 'cart-count-wrapper') return;
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });
}

/** SCROLL TO TOP LOGIC **/
function initScrollToTop() {
    const topBtn = document.querySelector('.scroll-to-top-btn');
    const footer = document.querySelector('.main-footer');
    if (!topBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }

        // Stop before footer logic
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // If the footer starts entering the viewport
            if (footerRect.top < viewportHeight) {
                const offset = (viewportHeight - footerRect.top) + 30; // 30 is original bottom spacing
                topBtn.style.bottom = `${offset}px`;
            } else {
                topBtn.style.bottom = `30px`;
            }
        }
    }, { passive: true });

    topBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/** SCROLL REVEAL LOGIC **/
function initScrollReveal() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}