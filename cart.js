/** SHOPPING BAG LOGIC **/
let cart = [];
try {
    const savedCart = localStorage.getItem('manekoCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
} catch (e) {
    console.warn("Could not load cart from storage");
    cart = [];
}

function toggleCart(forceOpen = null) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) {
        if (forceOpen === true) {
            if (typeof toggleTranslatorDrawer === 'function') toggleTranslatorDrawer(false);
            drawer.classList.add('open');
            if (overlay) overlay.classList.add('active');
        } else if (forceOpen === false) {
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        } else {
            const isOpening = !drawer.classList.contains('open');
            if (isOpening && typeof toggleTranslatorDrawer === 'function') toggleTranslatorDrawer(false);
            drawer.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        }
    }
}

function addToCart(name, price, qty = 1, btnElement = null, variant = null) {
    // Input validation
    if (typeof name !== 'string' || typeof price !== 'number' || price < 0) {
        console.error('Invalid cart item parameters');
        return;
    }

    // Always open PDP modal when "Add to Bag" button is clicked from a product card,
    // unless a variant has already been selected (which happens from within the PDP modal itself).
    if (btnElement && !variant) {
        const card = btnElement.closest('.shop-card, .joy-card');
        if (card) { card.click(); return; }
    }

    const existing = cart.find(item => item.name === name && item.variant === variant);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ name, price, qty, variant });
    }
    saveCart();

    let btn = btnElement;
    if (!btn && window.event) {
        btn = window.event.target.closest('button, .btn-animate');
    }

    if (btn && btn.textContent && !btn.textContent.includes("✨")) {
        const originalText = btn.textContent;
        btn.textContent = "Added! ✨";
        btn.classList.add('success');
        btn.style.transform = "scale(1.05) translateY(-3px)";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success');
            btn.style.transform = "";
        }, 1200);
    }

    updateCartUI();
    toggleCart(true);
}

function saveCart() {
    try {
        localStorage.setItem('manekoCart', JSON.stringify(cart));
    } catch (e) { 
        console.warn("Cart save failed:", e); 
    }
}

function updateCartQty(name, change, variant = null) {
    // Input validation
    if (typeof name !== 'string' || typeof change !== 'number') {
        console.error('Invalid cart update parameters');
        return;
    }

    const item = cart.find(i => i.name === name && i.variant === variant);
    if (item) {
        item.qty += change;
        // Filter specifically by name and variant so other variants are preserved
        if (item.qty <= 0) cart = cart.filter(i => !(i.name === name && i.variant === variant));
    }
    saveCart();
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    const cartCountEl = document.getElementById('cart-count');
    const drawerListEl = document.getElementById('cart-items-list');
    const drawerTotalEl = document.getElementById('cart-subtotal');
    const paymentListEl = document.getElementById('payment-summary-list');
    const paymentTotalEl = document.getElementById('payment-total-amount');

    // Validate cart is an array
    if (!Array.isArray(cart)) {
        cart = [];
    }

    const totalQty = cart.reduce((sum, i) => sum + (i.qty || 0), 0);
    const totalPrice = cart.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || 0)), 0);
    const formattedTotal = `${totalPrice.toLocaleString('en-US')} Rp`;

    if (cartCountEl) cartCountEl.textContent = totalQty;
    const t = (typeof translations !== 'undefined' && translations) ? translations[currentLang] : {};

    if (drawerListEl) {
        if (cart.length === 0) {
            drawerListEl.innerHTML = '';
            const container = document.createElement('div');
            container.className = 'empty-cart-container';
            
            const icon = document.createElement('div');
            icon.className = 'empty-cart-icon';
            icon.textContent = 'ฅ^•⩊•^ฅ';
            
            const subtitle = document.createElement('p');
            subtitle.className = 'empty-cart-subtitle';
            subtitle.textContent = t.empty_bag || 'Your bag is empty';
            
            const link = document.createElement('a');
            link.href = 'menu.html';
            link.className = 'browse-products-btn';
            link.textContent = t.browse || 'Browse menu';
            link.onclick = () => toggleCart(false);
            
            container.appendChild(icon);
            container.appendChild(subtitle);
            container.appendChild(link);
            drawerListEl.appendChild(container);
            
            const df = document.querySelector('.cart-summary-footer');
            if (df) df.style.display = 'none';
        } else {
            const df = document.querySelector('.cart-summary-footer');
            if (df) df.style.display = 'block';
            
            drawerListEl.innerHTML = cart.map(item => {
                const foodEntry = t.food && t.food[item.name];
                const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
                const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
                
                // Create safe button with data attributes instead of inline onclick
                const itemHTML = document.createElement('div');
                itemHTML.className = 'cart-item';
                itemHTML.innerHTML = `
                <div>
                    <h4>${displayName}${variantLabel}</h4>
                    <p>${((item.price || 0) * (item.qty || 0)).toLocaleString('en-US')} Rp</p>
                </div>
                <div class="quantity-selector drawer-qty">
                    <button class="qty-btn qty-down" data-item="${encodeURIComponent(item.name)}" data-variant="${encodeURIComponent(item.variant || '')}">➖</button>
                    <span class="qty-display">${item.qty}</span>
                    <button class="qty-btn qty-up" data-item="${encodeURIComponent(item.name)}" data-variant="${encodeURIComponent(item.variant || '')}">➕</button>
                </div>
                `;
                
                // Add event listeners instead of inline onclick
                itemHTML.querySelector('.qty-down').addEventListener('click', function() {
                    updateCartQty(decodeURIComponent(this.dataset.item), -1, this.dataset.variant ? decodeURIComponent(this.dataset.variant) : null);
                });
                itemHTML.querySelector('.qty-up').addEventListener('click', function() {
                    updateCartQty(decodeURIComponent(this.dataset.item), 1, this.dataset.variant ? decodeURIComponent(this.dataset.variant) : null);
                });
                
                return itemHTML;
            }).reduce((container, item) => {
                container.appendChild(item);
                return container;
            }, document.createElement('div'));
        }
        if (drawerTotalEl) drawerTotalEl.textContent = formattedTotal;
    }

    if (paymentListEl) {
        if (cart.length === 0) {
            paymentListEl.innerHTML = '';
            const p = document.createElement('p');
            p.textContent = 'No items selected.';
            paymentListEl.appendChild(p);
        } else {
            paymentListEl.innerHTML = cart.map(item => {
                const foodEntry = t.food && t.food[item.name];
                const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
                const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
                return `
                <div class="receipt-item">
                    <span>${item.qty}x ${displayName}${variantLabel}</span>
                    <span>${((item.price || 0) * (item.qty || 0)).toLocaleString('en-US')} Rp</span>
                </div>`;
            }).join('');
        }
        if (paymentTotalEl) paymentTotalEl.textContent = formattedTotal;
    }
}