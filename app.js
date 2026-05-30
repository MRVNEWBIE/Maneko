/** CORE LOGIC: Translations, Language State, and Orchestration **/
function getStorageItem(key, defaultValue) {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch (e) {
        console.warn("Storage access denied:", e);
        return defaultValue;
    }
}

let currentLang = getStorageItem('manekoLang', 'id');

// Helper to get nested translation value (e.g., "hero_info.time")
const getTranslation = (key, lang = currentLang) => {
    const t = translations[lang];
    if (!t) {
        console.warn(`Translations for language '${lang}' not found.`);
        return key; // Fallback to key if language not found
    }
    const value = key.split('.').reduce((obj, k) => obj && obj[k], t);
    if (value === undefined) {
        console.warn(`Translation key '${key}' not found for language '${lang}'.`);
        return key; // Fallback to key if translation not found
    }
    return value;
};

function applyTranslations() {
    const t = translations[currentLang];
    document.documentElement.lang = currentLang;

    // Clear all previous validation warnings to prevent language mismatch
    document.querySelectorAll('.warning-text').forEach(span => {
        span.innerText = '';
        span.style.display = 'none';
    });

    // Sync Navbar Active State - Improved for local and server environments
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll('.nav-tab').forEach(tab => {
        const href = tab.getAttribute('href')?.toLowerCase();
        if (!href || href.startsWith('javascript')) return;
        
        const isHome = href === 'index.html' || href === './' || href === '/';
        const isMatch = (href && currentPath.endsWith(href)) || 
                        (isHome && (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === ''));
        
        tab.classList.toggle('active', isMatch);
    });

    document.documentElement.style.setProperty('--cart-thank-you', `"${getTranslation('cart_footer_msg')}"`);
    
    if (document.title.includes('Home') || document.title.includes('Beranda')) document.title = `Maneko | ${getTranslation('home')}`;
    if (document.title.includes('Menu')) document.title = `Maneko | Menu`;
    if (document.title.includes('Story') || document.title.includes('Cerita')) document.title = `Maneko | ${getTranslation('story')}`;
    if (document.title.includes('Payment') || document.title.includes('Pembayaran')) {
        document.title = `Maneko | ${getTranslation('payment_page_title')}`;
    }

    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);

        if (translation) {
            if (element.id === 'cart-count-wrapper') {
                 const count = document.getElementById('cart-count')?.innerText || '0';
                 element.innerHTML = `${translation} (<span id="cart-count">${count}</span>)`;
            } else if (element.classList.contains('order-context-item')) {
                // Specifically allow complex HTML injection for items that function as containers
                element.innerHTML = translation;
            } else { 
                // Check if the translation contains HTML tags to render them correctly
                if (translation.includes('<')) {
                    element.innerHTML = translation;
                } else { element.innerText = translation; }
            }
        }
    });

    // Sync Dropdown Active States
    document.querySelectorAll('.lang-option').forEach(btn => {
        const btnLang = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        btn.classList.toggle('active', btnLang === currentLang);
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(key);
        if (translation) element.placeholder = translation;
    });

    // Translate Campus Talk reviews in the marquee
    const reviewBoxes = document.querySelectorAll('.review-box');
    if (reviewBoxes.length > 0 && t.reviews) {
        reviewBoxes.forEach((box, i) => {
            box.innerText = `"${t.reviews[i % t.reviews.length]}"`;
        });
    }

    // PDP Modal Tags
    const pdpTags = document.querySelectorAll('.fact-tag');
    if (pdpTags.length >= 3) {
        pdpTags[0].innerText = t.pdp_tags.time;
        pdpTags[1].innerText = t.pdp_tags.served;
        pdpTags[2].innerText = t.pdp_tags.ingredients;
    }

    document.querySelectorAll('.shop-card, .joy-card').forEach(card => {
        const originalName = card.getAttribute('data-name');
        const translation = t.food[originalName];
        if (translation) {
            const h3 = card.querySelector('h3');
            if (h3) h3.innerText = translation.name || translation;
            
            // Always sync the description to the data-details attribute so the pop-up modal has content
            if (translation.desc) {
                card.setAttribute('data-details', translation.desc);
            }

            const p = card.querySelector('.card-details');
            if (p && translation.desc) {
                p.innerText = translation.desc;
            }
        }
    });

    // Update Team Cards data attributes for Story page
    document.querySelectorAll('.team-card').forEach(card => {
        const name = card.getAttribute('data-name');
        if (t.team && t.team[name]) {
            card.setAttribute('data-role', t.team[name].role);
            card.setAttribute('data-bio', t.team[name].bio);
            const roleP = card.querySelector('p');
            if (roleP) roleP.innerText = t.team[name].role;
        }
    });

    document.querySelectorAll('.menu-add-btn').forEach(btn => {
        btn.innerText = t.add_to_bag + ' +';
    });

    // Refresh menu filters to reflect new translated names in search
    if (window.filterMenu) window.filterMenu();

    // Warning Modal
    const warningTitle = document.querySelector('#warning-modal-overlay h2');
    if (warningTitle) warningTitle.innerHTML = t.wait_title;
    const warningText = document.querySelector('#warning-modal-overlay p');
    if (warningText) warningText.innerText = t.wait_msg;
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    if (confirmResetBtn) confirmResetBtn.innerText = t.yes_reset;
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    if (cancelResetBtn) cancelResetBtn.innerText = t.no_back;

    // Update Success Modal values if open
    const resType = document.getElementById('res-type');
    if (resType) {
        const key = resType.getAttribute('data-key');
        if (key) resType.innerText = (key === 'Daily' ? t.daily_order_btn : t.pre_order_btn);
    }
    const resMethod = document.getElementById('res-method');
    if (resMethod) {
        const key = resMethod.getAttribute('data-key');
        if (key && t[key]) resMethod.innerText = t[key];
    }
}

document.addEventListener('DOMContentLoaded', function () {
    applyTranslations();

    updateCartUI();
    if (window.initFilters) window.initFilters();

    initOrderRackInteraction();
    initMarqueeInteraction();
    initNavbarScroll();

    // Handle checkout button redirection
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = 'payment.html';
            } else {
                const drawerWarning = document.getElementById('drawer-warning');
                if (drawerWarning) {
                    drawerWarning.innerText = getTranslation('val_empty');
                }
            }
        });
    }
});

/** NAVBAR SCROLL HIDE/SHOW **/
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Hide navbar when scrolling down past 100px, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            navbar.classList.add('nav-hidden');
        } else {
            navbar.classList.remove('nav-hidden');
        }
        lastScrollY = currentScrollY;
    }, { passive: true });
}

/** LANGUAGE SWITCHER **/
window.changeLanguage = function(lang) {
    currentLang = lang;
    try {
        localStorage.setItem('manekoLang', currentLang);
    } catch (err) {
        console.error("Failed to save language preference");
    }
    applyTranslations();
    updateCartUI();
    toggleTranslatorDrawer(false);
};

function toggleTranslatorDrawer(forceOpen = null) {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) {
        if (forceOpen === true) {
            toggleCart(false);
            dropdown.classList.add('show');
        } else if (forceOpen === false) {
            dropdown.classList.remove('show');
        } else {
            const isShowing = dropdown.classList.contains('show');
            toggleTranslatorDrawer(!isShowing);
        }
    }
}

/** ORDER RACK INTERACTION **/
function initOrderRackInteraction() {
    const rackContainer = document.querySelector('.order-rack-container');
    const papers = document.querySelectorAll('.order-paper');
    const contexts = document.querySelectorAll('.order-context-item:not(.is-placeholder)');
    const placeholder = document.querySelector('.order-context-item.is-placeholder');
    const placeholderImage = document.getElementById('placeholder-image');
    const rackLabel = rackContainer ? rackContainer.querySelector('.section-title') : null;
    const defaultLabelKey = 'story_content.us_label';
    const paperKeys = ['story_content.story_title', 'story_content.who_title', 'story_content.aoa_h2'];

    papers.forEach((paper, index) => {
        paper.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document listener from firing
            const placeholderImages = ['Manekomenu.png', 'Buisnesslogonobackground.png', 'aoa_logo.png']; 
            const wasActive = paper.classList.contains('active');
            
            // Find the currently active context item to determine if a fade-out is needed
            const currentlyActiveContext = document.querySelector('.order-context-item.active');

            // Deactivate all papers and contexts immediately to start their fade-out transition
            papers.forEach(p => p.classList.remove('active'));
            contexts.forEach(c => c.classList.remove('active'));
            if (placeholder) placeholder.classList.remove('active'); // Deactivate placeholder if active

            // Function to activate the new state (either a specific context or the placeholder)
            const activateNewState = () => {
                if (!wasActive) { // A new paper is being activated
                    paper.classList.add('active'); // Activate the clicked paper
                    if (contexts[index]) contexts[index].classList.add('active'); // Activate its corresponding context
                    
                    // Update rack label and image
                    if (rackLabel) {
                        rackLabel.setAttribute('data-i18n', paperKeys[index]);
                        rackLabel.innerHTML = getTranslation(paperKeys[index]);
                    }
                    if (placeholderImage && placeholderImages[index]) placeholderImage.src = placeholderImages[index];
                } else { // The active paper was clicked again, revert to placeholder
                    if (placeholder) placeholder.classList.add('active'); // Activate placeholder
                    // Revert rack label and image to default
                    if (rackLabel) {
                        rackLabel.setAttribute('data-i18n', defaultLabelKey);
                        rackLabel.innerHTML = getTranslation(defaultLabelKey);
                    }
                    if (placeholderImage) placeholderImage.src = 'mascot.png';
                }
            };

            // If there was an active context, wait for its fade-out transition to complete (0.4s)
            // before activating the new state. Otherwise, activate immediately.
            if (currentlyActiveContext) {
                setTimeout(activateNewState, 400); 
            } else {
                activateNewState();
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (rackContainer && !rackContainer.contains(e.target)) {
            const currentlyActiveContext = document.querySelector('.order-context-item.active');

            papers.forEach(p => p.classList.remove('active'));
            contexts.forEach(c => c.classList.remove('active'));
            
            const activatePlaceholder = () => {
                if (placeholder) placeholder.classList.add('active');
                if (placeholderImage) placeholderImage.src = 'mascot.png';
                if (rackLabel) {
                    rackLabel.setAttribute('data-i18n', defaultLabelKey);
                    rackLabel.innerHTML = getTranslation(defaultLabelKey);
                }
            };

            if (currentlyActiveContext) {
                setTimeout(activatePlaceholder, 400);
            } else {
                activatePlaceholder();
            }
        }
    });
}