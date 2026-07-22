/** PAYMENT PAGE LOGIC: UI Interaction & Order Submission **/

// Configuration
const GLOW_EFFECT_DURATION = 2000; // milliseconds
const TIMEOUT_DURATION = 30000; // 30 seconds

// Note: The Google Apps Script URL should be moved to a backend environment variable
// DO NOT keep sensitive URLs in client-side code
// For now, we'll fetch it from a config endpoint
let PAYMENT_API_ENDPOINT = null;

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', processPayment);
    }
    initPaymentPage();
    loadPaymentConfig();
});

/**
 * Load payment API endpoint from a secure backend
 * This prevents exposing sensitive URLs in client code
 */
async function loadPaymentConfig() {
    try {
        // Attempt to load from your backend config endpoint
        // Replace with your actual backend URL
        const response = await fetch('./config.json', {
            method: 'GET',
            credentials: 'same-origin'
        });
        if (response.ok) {
            const config = await response.json();
            PAYMENT_API_ENDPOINT = config.paymentEndpoint;
        }
    } catch (error) {
        console.warn('Could not load payment config from backend');
        // Fallback: Use environment variable if available
        // PAYMENT_API_ENDPOINT = process.env.REACT_APP_PAYMENT_ENDPOINT || null;
    }
}

function initPaymentPage() {
    const paymentSummary = document.getElementById('payment-summary-list');
    if (!paymentSummary) return;
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    paymentMethods.forEach(input => {
        input.addEventListener('change', (e) => toggleQRIS(e.target.value === 'qris'));
        if (input.checked && input.value === 'qris') toggleQRIS(true);
    });

    const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
    const dateEl = document.getElementById('order-date');

    if (dateEl) {
        // Helper to get date string in local YYYY-MM-DD format
        const getDateStr = (daysAhead) => {
            const date = new Date();
            date.setDate(date.getDate() + daysAhead);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const h1Str = getDateStr(1);
        const h2Str = getDateStr(2);
        
        dateEl.min = h1Str; // Default min is tomorrow

        const handleTypeChange = () => {
            const selected = document.querySelector('input[name="order-type"]:checked');
            if (selected) {
                if (selected.value === 'Daily') {
                    dateEl.value = h1Str;
                    dateEl.min = h1Str;
                    dateEl.max = h1Str; // Restricts to only the next day
                } else {
                    dateEl.min = h2Str;
                    dateEl.removeAttribute('max'); // Allows future dates for Pre-Orders
                    if (dateEl.value < h2Str) dateEl.value = h2Str;
                }
            }
        };

        orderTypeRadios.forEach(radio => radio.addEventListener('change', handleTypeChange));
        handleTypeChange(); // Initialize correctly if 'Daily' is default checked
    }
}

function toggleQRIS(show) {
    const container = document.getElementById('qris-scan-wrapper') || document.getElementById('qris-proof-wrapper');
    if (!container) return;
    container.style.display = show ? 'block' : 'none';
    if (show) {
        if (!document.getElementById('qris-scan-inline')) {
            const scanText = typeof getTranslation === 'function' ? getTranslation('scan_code') : 'Scan QRIS Code';
            const div = document.createElement('div');
            div.id = 'qris-scan-inline';
            div.className = 'qris-inline-container';
            
            const p = document.createElement('p');
            p.textContent = scanText;
            div.appendChild(p);
            
            const img = document.createElement('img');
            img.src = 'QRIZ_code.jpg';
            img.alt = 'QRIS Code';
            img.style.display = 'block';
            img.style.margin = 'auto';
            div.appendChild(img);
            
            container.insertBefore(div, container.firstChild);
        }
    }
}

async function processPayment() {
    const submitBtn = document.getElementById('submit-order-btn');
    const t = (typeof translations !== 'undefined' && translations && translations[currentLang]) || {};
    const currentCart = (typeof cart !== 'undefined') ? cart : [];

    const nameEl = document.getElementById('cust-name');
    const emailEl = document.getElementById('cust-email');
    const phoneEl = document.getElementById('cust-phone');
    const dateEl = document.getElementById('order-date');
    const orderTypeEl = document.querySelector('input[name="order-type"]:checked');
    const selectedMethod = document.querySelector('input[name="payment"]:checked');
    const qrisProofEl = document.getElementById('qris-proof-file');
    const termsEl = document.getElementById('agree-terms');
    const correctnessEl = document.getElementById('agree-correctness');

    // 1. Immediate validation to prevent multiple clicks
    if (submitBtn && submitBtn.disabled) return;

    /**
     * Helper to show warning text and bring user to the problematic field
     */
    const invalidate = (el, warningId, message) => {
        const warningEl = document.getElementById(warningId);
        if (warningEl) {
            warningEl.textContent = message;
            warningEl.style.display = 'block';
        }

        if (el) {
            el.focus({ preventScroll: true }); // Prepares the field for input
            el.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Centers the field on screen
            
            // Visual feedback: Apply a temporary red glow to catch the eye
            const originalBorder = el.style.borderColor;
            const originalShadow = el.style.boxShadow;
            el.style.borderColor = "#ff4444";
            el.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.5)";
            setTimeout(() => {
                el.style.borderColor = originalBorder;
                el.style.boxShadow = originalShadow;
            }, GLOW_EFFECT_DURATION);
        }
        return false;
    };

    // Clear all previous warnings
    document.querySelectorAll('.warning-text').forEach(span => {
        span.textContent = '';
        span.style.display = 'none';
    });

    // 2. Mandatory Field Validations: Checking 'Your Name' first
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameEl || !nameEl.value.trim()) {
        return invalidate(nameEl, 'name-warning', t.val_name || 'Please enter your name');
    }

    if (!emailEl || !emailPattern.test(emailEl.value.trim())) {
        return invalidate(emailEl, 'email-warning', t.val_email || 'Please enter a valid email');
    }

    if (!phoneEl || !phoneEl.value.trim() || !/^\d+$/.test(phoneEl.value.trim())) {
        return invalidate(phoneEl, 'phone-warning', t.val_phone || 'Please enter a valid phone number');
    }

    if (!dateEl || !dateEl.value) return invalidate(dateEl, 'date-warning', t.val_date || 'Please select a date');

    // Date Rule Validation: Must be in the future (Tomorrow or later)
    const selectedDate = new Date(dateEl.value);
    selectedDate.setHours(0,0,0,0);
    
    const minAllowedDate = new Date();
    // Pre-order requires H+2, Daily requires H+1
    const leadDays = (orderTypeEl && orderTypeEl.value === 'Pre-Order') ? 2 : 1;
    minAllowedDate.setDate(minAllowedDate.getDate() + leadDays);
    minAllowedDate.setHours(0,0,0,0);

    if (selectedDate < minAllowedDate) {
        return invalidate(dateEl, 'date-warning', t.val_date_future || 'Please select a future date');
    }

    // Weekday Rule: 0 = Sun, 6 = Sat
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
        return invalidate(dateEl, 'date-warning', t.val_date_weekday || 'Orders only on weekdays');
    }

    if (termsEl && !termsEl.checked) {
        return invalidate(termsEl, 'checkbox-warning', t.val_terms || 'Please accept terms');
    }

    if (correctnessEl && !correctnessEl.checked) {
        return invalidate(correctnessEl, 'checkbox-warning', t.val_correct || 'Please confirm correctness');
    }

    if (currentCart.length === 0) {
        const cartWarn = document.getElementById('cart-warning');
        if (cartWarn) {
            cartWarn.textContent = t.val_empty || 'Your cart is empty';
            cartWarn.style.display = 'block';
            cartWarn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (!selectedMethod) {
        const methodGroup = document.querySelector('.payment-methods-group');
        if (methodGroup) {
            methodGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const notesWarn = document.getElementById('notes-warning');
            if (notesWarn) {
                notesWarn.textContent = t.val_method || 'Please select a payment method';
                notesWarn.style.display = 'block';
            }
        }
        return;
    }

    const method = selectedMethod.value;
    let fileDataText = "";
    let fileNameText = "";
    let fileMimeTypeText = "";

    // 3. Mandatory File Check for QRIS
    if (method === 'qris') {
        if (!qrisProofEl || qrisProofEl.files.length === 0) {
            invalidate(qrisProofEl, 'qris-warning', t.val_qris || 'Please upload QRIS proof');
            return;
        }

        // Validate file size (max 5MB)
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        if (qrisProofEl.files[0].size > maxFileSize) {
            invalidate(qrisProofEl, 'qris-warning', 'File size must be less than 5MB');
            return;
        }

        // Disable button early for file processing
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = t.val_processing || 'Processing...';
        }

        const file = qrisProofEl.files[0];
        fileNameText = file.name;
        fileMimeTypeText = file.type;

        // Convert image to Base64 string for transmission
        fileDataText = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
    }

    // 4. Final Submission State
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        submitBtn.textContent = t.val_sending || 'Sending...';
    }

    const payload = {
        "Timestamp": new Date().toLocaleString(),
        "Terms": termsEl && termsEl.checked ? "Accepted" : "No",
        "Name": nameEl.value.trim(),
        "Phone": phoneEl.value.trim(),
        "Order": currentCart.map(item => {
            const foodEntry = t.food && t.food[item.name];
            const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
            const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
            return `${item.qty}x ${displayName}${variantLabel}`;
        }).join(' | '),
        "Order Type": orderTypeEl ? orderTypeEl.value : "Daily",
        "Pickup Date": dateEl.value,
        "Special Instructions / Specific Needs": (document.getElementById('cust-notes')?.value || '').trim() || "None",
        "Amount of food": currentCart.reduce((sum, item) => sum + (item.qty || 0), 0),
        "Total amount": document.getElementById('payment-total-amount')?.textContent || '0 Rp',
        "Payment method": method,
        "Order date": new Date().toLocaleDateString(),
        "Correctness": correctnessEl && correctnessEl.checked ? "Yes" : "No",
        "Email": emailEl.value.trim(),
        "Proof link": method === 'qris' ? "Image Uploaded" : "N/A",
        fileData: fileDataText,
        fileName: fileNameText,
        fileMimeType: fileMimeTypeText
    };

    // IMPORTANT: Move your Google Apps Script URL to a backend environment variable
    // DO NOT hardcode sensitive URLs in client code
    if (!PAYMENT_API_ENDPOINT) {
        console.error('Payment endpoint not configured');
        alert(t.val_failed_submit || 'Payment endpoint not available');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = t.place_order || 'Place Order';
        }
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

        const response = await fetch(PAYMENT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok && response.status !== 0) { // 0 status can occur with CORS
            throw new Error(`Server returned ${response.status}`);
        }

        // Show Success Modal instead of Alert
        showSuccessModal(payload);
        localStorage.removeItem('manekoCart');
        if (typeof updateCartUI === 'function') updateCartUI();
    } catch (error) {
        console.error('Payment error:', error);
        alert(t.val_failed_submit || 'Order submission failed. Please try again.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = t.place_order || 'Place Order';
        }
    }
}

function showSuccessModal(payload) {
    const overlay = document.getElementById('success-modal-overlay');
    if (!overlay) return;

    const t = (typeof translations !== 'undefined' && translations && translations[currentLang]) || {};

    // Fill user data - safe text assignment
    const resName = document.getElementById('res-name');
    if (resName) resName.textContent = payload["Name"];
    
    const resEmail = document.getElementById('res-email');
    if (resEmail) resEmail.textContent = payload["Email"];
    
    // Order Type display
    const resType = document.getElementById('res-type');
    if (resType) {
        const typeText = payload["Order Type"] === 'Daily' ? t.daily_order_btn : t.pre_order_btn;
        resType.textContent = typeText;
    }

    // Date display
    const resPurchaseDate = document.getElementById('res-purchase-date');
    if (resPurchaseDate) resPurchaseDate.textContent = payload["Timestamp"];
    
    const resPickupDate = document.getElementById('res-pickup-date');
    if (resPickupDate) resPickupDate.textContent = payload["Pickup Date"];

    // Method display
    const resMethod = document.getElementById('res-method');
    if (resMethod) {
        resMethod.textContent = t[payload["Payment method"]] || payload["Payment method"];
    }

    // Copy order list and total from the main receipt
    const resSummaryList = document.getElementById('res-summary-list');
    const paymentSummaryList = document.getElementById('payment-summary-list');
    if (resSummaryList && paymentSummaryList) {
        resSummaryList.innerHTML = paymentSummaryList.innerHTML;
    }
    
    const resTotalAmount = document.getElementById('res-total-amount');
    const paymentTotalAmount = document.getElementById('payment-total-amount');
    if (resTotalAmount && paymentTotalAmount) {
        resTotalAmount.textContent = paymentTotalAmount.textContent;
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Handle Download
    const downloadBtn = document.getElementById('download-receipt-btn');
    if (downloadBtn) {
        downloadBtn.onclick = async () => {
            const receiptArea = document.getElementById('receipt-to-download');
            if (typeof html2canvas === 'function') {
                const canvas = await html2canvas(receiptArea, { backgroundColor: '#ffffff', scale: 2 });
                const link = document.createElement('a');
                link.download = `Maneko_Receipt_${payload["Name"].replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        };
    }
}