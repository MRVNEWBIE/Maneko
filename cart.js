/** SHOPPING BAG LOGIC **/
let cart = [];
try {
    const savedCart = localStorage.getItem('manekoCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
} catch (e) {
    console.warn("Could not load cart from storage");
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

    if (btn && btn.innerText && !btn.innerText.includes("✨")) {
        const originalText = btn.innerText;
        btn.innerText = "Added! ✨";
        btn.classList.add('success');
        btn.style.transform = "scale(1.05) translateY(-3px)";
        setTimeout(() => {
            btn.innerText = originalText;
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
    } catch (e) { console.warn("Cart save failed:", e); }
}

function updateCartQty(name, change, variant = null) {
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

    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const formattedTotal = `${totalPrice.toLocaleString('en-US')} Rp`;

    if (cartCountEl) cartCountEl.innerText = totalQty;
    const t = translations[currentLang];

    if (drawerListEl) {
        if (cart.length === 0) {
            drawerListEl.innerHTML = `
                <div class="empty-cart-container">
                    <div class="empty-cart-icon">ฅ^<span class="mascot-text-blink">•</span>⩊<span class="mascot-text-blink">•</span>^ฅ</div>
                    <p class="empty-cart-subtitle">${t.empty_bag}</p>
                    <a href="menu.html" class="browse-products-btn" onclick="toggleCart(false)">${t.browse}</a>
                </div>`;
            const df = document.querySelector('.cart-summary-footer');
            if (df) df.style.display = 'none';
        } else {
            const df = document.querySelector('.cart-summary-footer');
            if (df) df.style.display = 'block';
            drawerListEl.innerHTML = cart.map(item => {
                const foodEntry = t.food[item.name];
                const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
                const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
                const safeName = item.name.replace(/'/g, "\\'");
                const safeVariant = item.variant ? `'${item.variant}'` : 'null';
                return `
                <div class="cart-item">
                    <div>
                        <h4>${displayName}${variantLabel}</h4>
                        <p>${(item.price * item.qty).toLocaleString('en-US')} Rp</p>
                    </div>
                    <div class="quantity-selector drawer-qty">
                        <button class="qty-btn" onclick="updateCartQty('${safeName}', -1, ${safeVariant})">➖</button>
                        <span class="qty-display">${item.qty}</span>
                        <button class="qty-btn" onclick="updateCartQty('${safeName}', 1, ${safeVariant})">➕</button>
                    </div>
                </div>`;
            }).join('');
        }
        if (drawerTotalEl) drawerTotalEl.innerText = formattedTotal;
    }

    if (paymentListEl) {
        paymentListEl.innerHTML = cart.length === 0 ? '<p>No items selected.</p>' : cart.map(item => {
            const foodEntry = t.food[item.name];
            const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
            const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
            return `
            <div class="receipt-item">
                <span>${item.qty}x ${displayName}${variantLabel}</span>
                <span>${(item.price * item.qty).toLocaleString('en-US')} Rp</span>
            </div>`;
        }).join('');
        if (paymentTotalEl) paymentTotalEl.innerText = formattedTotal;
    }
}