/** MENU PAGE: Search & Filters **/
let currentMaxPrice = 30000;

window.initFilters = function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('menu-search');
    const btnUp = document.getElementById('price-up');
    const btnDown = document.getElementById('price-down');
    const resetBtn = document.getElementById('reset-filters');
    const priceInput = document.getElementById('current-price-input');
    
    if (!filterBtns.length && !searchInput) return;
    if (priceInput) currentMaxPrice = parseInt(priceInput.value) || 30000; 

    // Helper function to reset and re-trigger fade-in animation
    const resetAndAnimateCards = () => {
        // First, apply the filtering logic to update display states
        window.filterMenu();
        
        const cards = document.querySelectorAll('.shop-card');
        cards.forEach(card => {
            if (card.style.display !== 'none') {
                // Reset animation properties to their starting values
                card.style.animation = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                // Force a reflow to ensure the browser registers the property resets
                void card.offsetWidth;
                
                // Re-apply the fade-in animation
                card.style.animation = 'menu-card-fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
            }
        });
    };

    window.filterMenu = function() {
        const activeBtn = document.querySelector('.filter-btn.active');
        const filterValue = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const cards = document.querySelectorAll('.shop-card');
        const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
        const t = (typeof translations !== 'undefined') ? translations[lang] : {food:{}};

        if (priceInput && document.activeElement !== priceInput) {
            priceInput.value = currentMaxPrice;
        }

        cards.forEach(card => {
            const category = card.getAttribute('data-category');
            const price = parseInt(card.getAttribute('data-price'));
            const originalName = (card.getAttribute('data-name') || '').toLowerCase();
            const h3 = card.querySelector('h3');
            const translatedName = h3 ? h3.innerText.toLowerCase() : '';
            
            const matchesCategory = filterValue === 'all' || category === filterValue;
            const matchesPrice = price <= currentMaxPrice;
            const matchesSearch = originalName.includes(searchTerm) || translatedName.includes(searchTerm);
            card.style.display = (matchesCategory && matchesPrice && matchesSearch) ? 'block' : 'none';
        });

        const visibleCount = Array.from(cards).filter(c => c.style.display !== 'none').length;
        let noResults = document.getElementById('menu-no-results');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'menu-no-results';
                noResults.className = 'no-results-msg';
                document.querySelector('.menu-grid')?.appendChild(noResults);
            }
            noResults.innerText = t.food.no_results || "No items match your filters.";
        } else if (noResults) noResults.remove();
    };

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resetAndAnimateCards();
    }));

    let searchTimeout;
    if (searchInput) searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(resetAndAnimateCards, 200);
    });

    // Chrome Fix: Use continuous events for smoother price range adjustment
    if (btnUp) btnUp.addEventListener('click', () => { 
        if (currentMaxPrice < 30000) { 
            currentMaxPrice = Math.min(30000, currentMaxPrice + 1000); 
            resetAndAnimateCards(); // Also animate on price change
        } 
    });
    if (btnDown) btnDown.addEventListener('click', () => { 
        if (currentMaxPrice > 28000) { 
            currentMaxPrice = Math.max(28000, currentMaxPrice - 1000); 
            resetAndAnimateCards(); // Also animate on price change
        } 
    });

    if (priceInput) {
        priceInput.addEventListener('input', () => {
            let val = parseInt(priceInput.value);
            if (!isNaN(val)) {
                currentMaxPrice = Math.max(28000, Math.min(val, 30000));
                resetAndAnimateCards(); // Also animate on price input change
            }
        });
    }

    if (resetBtn) resetBtn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-filter="all"]')?.classList.add('active');
        if (searchInput) searchInput.value = '';
        currentMaxPrice = 30000;
        resetAndAnimateCards();
    });

    resetAndAnimateCards();
};