/** MODAL & POPUP CONTROLLERS **/

document.addEventListener('DOMContentLoaded', () => {
    initVideoModal();
    initWarningModal();
    initTeamModal();
    initPdpModal();
});

function initVideoModal() {
    const overlay = document.getElementById('video-modal-overlay');
    const iframe = document.getElementById('video-modal-iframe');
    const socialLinks = document.querySelectorAll('.social-card');
    if (!overlay || !socialLinks.length) return;
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');
            let embedUrl = '';
            if (url.includes('instagram.com/reel/')) {
                const id = url.split('/reel/')[1].split('/')[0];
                embedUrl = `https://www.instagram.com/reel/${id}/embed`;
            } else if (url.includes('tiktok.com')) {
                const id = url.split('/video/')[1].split('?')[0];
                embedUrl = `https://www.tiktok.com/embed/v2/${id}`;
            }
            if (embedUrl) {
                iframe.src = embedUrl;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else { window.open(url, '_blank'); }
        });
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            iframe.src = '';
            document.body.style.overflow = '';
        }
    });
}

function initWarningModal() {
    const overlay = document.getElementById('warning-modal-overlay');
    const openBtn = document.getElementById('cancel-order-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    if (!overlay || !openBtn) return;
    openBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    cancelResetBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    confirmResetBtn.addEventListener('click', () => {
        cart = [];
        try { localStorage.setItem('manekoCart', JSON.stringify(cart)); } catch (e) {}
        window.location.href = 'menu.html';
    });
}

function initTeamModal() {
    const overlay = document.getElementById('team-overlay');
    const teamCards = document.querySelectorAll('.team-card');
    if (!overlay || !teamCards.length) return;
    const nameEl = document.getElementById('team-modal-name');
    const roleEl = document.getElementById('team-modal-role');
    const bioEl = document.getElementById('team-modal-bio');
    const imgEl = document.getElementById('team-modal-img');
    teamCards.forEach(card => {
        card.addEventListener('click', () => {
            nameEl.innerText = card.getAttribute('data-name');
            roleEl.innerText = card.getAttribute('data-role');
            bioEl.innerText = card.getAttribute('data-bio');
            if (imgEl && card.querySelector('.team-img')) imgEl.src = card.querySelector('.team-img').src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function initPdpModal() {
    const pdpOverlay = document.getElementById('pdp-overlay');
    if (!pdpOverlay) return;
    const pdpMainImage = document.getElementById('pdp-main-image');
    const pdpCategoryBadge = document.getElementById('pdp-category-badge');
    const pdpProductName = document.getElementById('pdp-product-name');
    const pdpProductPrice = document.getElementById('pdp-product-price');
    const pdpProductDescription = document.getElementById('pdp-product-description');
    const pdpQtyInput = document.getElementById('pdp-qty-input');
    const pdpQtyDown = document.getElementById('pdp-qty-down');
    const pdpQtyUp = document.getElementById('pdp-qty-up');
    const pdpAddToBagBtn = document.getElementById('pdp-add-to-bag');
    const pdpVariantSelector = document.getElementById('pdp-variant-selector');
    const variantOptions = document.getElementById('variant-options');

    let currentProduct = null;
    function updatePdpTotal() {
        if (!currentProduct) return;
        const t = translations[currentLang];
        const qty = parseInt(pdpQtyInput.value) || 1;
        const total = currentProduct.price * qty;
        pdpAddToBagBtn.innerText = `${t.add_to_bag} — ${total.toLocaleString('en-US')} Rp`;
    }

    document.addEventListener('click', function(e) {
        const card = e.target.closest('.shop-card, .joy-card');
        if (!card) return;
        if (e.target.closest('.card-action')) return;

        currentProduct = {
            id: card.getAttribute('data-product-id'),
            name: card.getAttribute('data-name'),
            price: parseInt(card.getAttribute('data-price')),
            details: card.getAttribute('data-details'),
            img: card.getAttribute('data-img'),
            category: card.getAttribute('data-category'),
            variants: card.getAttribute('data-variants') ? card.getAttribute('data-variants').split(',') : []
        };
        pdpMainImage.src = currentProduct.img;
        pdpMainImage.alt = currentProduct.name;
        if (pdpCategoryBadge) {
            pdpCategoryBadge.innerText = currentProduct.category;
        }
        const translation = translations[currentLang].food[currentProduct.name];
        pdpProductName.innerText = translation ? (translation.name || translation) : currentProduct.name;
        pdpProductPrice.innerText = `${currentProduct.price.toLocaleString('en-US')} Rp`;
        pdpProductDescription.innerText = (translation && translation.desc) ? translation.desc : (currentProduct.details || '');

        if (currentProduct.variants.length > 0 && variantOptions) {
            pdpVariantSelector.style.display = 'block';
            variantOptions.innerHTML = currentProduct.variants.map((v, index) => `
                <label class="payment-method-label">
                    <input type="radio" name="pdp-variant" value="${v}" ${index === 0 ? 'checked' : ''}>
                    <span>${translations[currentLang][v] || v}</span>
                </label>
            `).join('');
        } else if (pdpVariantSelector) {
            pdpVariantSelector.style.display = 'none';
        }

        pdpQtyInput.value = 1; 

        // Add New/Favorite badges to PDP modal
        const pdpBadgesContainer = document.getElementById('pdp-badges-container'); // Keep container but clear content
        if (pdpBadgesContainer) pdpBadgesContainer.innerHTML = '';
        updatePdpTotal();
        pdpOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    });

    pdpOverlay.addEventListener('click', (e) => {
        if (e.target === pdpOverlay) { 
            pdpOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    if (pdpQtyDown) pdpQtyDown.addEventListener('click', () => {
        let qty = parseInt(pdpQtyInput.value);
        if (qty > 1) { pdpQtyInput.value = qty - 1; updatePdpTotal(); }
    });
    if (pdpQtyUp) pdpQtyUp.addEventListener('click', () => {
        let qty = parseInt(pdpQtyInput.value);
        pdpQtyInput.value = qty + 1;
        updatePdpTotal();
    });
    if (pdpAddToBagBtn) pdpAddToBagBtn.addEventListener('click', (e) => {
        if (currentProduct) {
            const qty = parseInt(pdpQtyInput.value);
            let variant = null;
            if (currentProduct.variants.length > 0) {
                const selected = document.querySelector('input[name="pdp-variant"]:checked');
                if (selected) variant = selected.value;
            }
            addToCart(currentProduct.name, currentProduct.price, qty, e.target, variant);
            setTimeout(() => {
                pdpOverlay.classList.remove('active'); 
                document.body.style.overflow = '';
            }, 600);
        }
    });
}

function openImagePopup(src) {
    let overlay = document.getElementById('image-popup-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'image-popup-overlay';
        overlay.className = 'image-popup-overlay';
        overlay.innerHTML = `<img src="" alt="Popup" class="image-popup-content" id="image-popup-img">`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    const img = document.getElementById('image-popup-img');
    if (img) img.src = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openImagePopup = openImagePopup;