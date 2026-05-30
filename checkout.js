/** PAYMENT PAGE LOGIC: UI Interaction & Order Submission **/
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', processPayment);
    }
    initPaymentPage();
});

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
            const scanText = getTranslation('scan_code');
            container.insertAdjacentHTML('afterbegin', `<div id="qris-scan-inline" class="qris-inline-container"><p>${scanText}</p><img src="QRIZ_code.jpg" alt="QRIS Code" style="display:block; margin: 10px auto;"></div>`);
        }
    }
}

async function processPayment() {
    const submitBtn = document.getElementById('submit-order-btn');
    const t = translations[currentLang];
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
            warningEl.innerText = message;
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
            }, 2000);
        }
        return false;
    };

    // Clear all previous warnings
    document.querySelectorAll('.warning-text').forEach(span => {
        span.innerText = '';
        span.style.display = 'none';
    });

    // 3. Mandatory Field Validations: Checking 'Your Name' first
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameEl || !nameEl.value.trim()) {
        return invalidate(nameEl, 'name-warning', t.val_name);
    }

    if (!emailEl || !emailPattern.test(emailEl.value.trim())) {
        return invalidate(emailEl, 'email-warning', t.val_email);
    }

    if (!phoneEl || !phoneEl.value.trim() || !/^\d+$/.test(phoneEl.value.trim())) {
        return invalidate(phoneEl, 'phone-warning', t.val_phone);
    }

    if (!dateEl || !dateEl.value) return invalidate(dateEl, 'date-warning', t.val_date);

    // Date Rule Validation: Must be in the future (Tomorrow or later)
    const selectedDate = new Date(dateEl.value);
    selectedDate.setHours(0,0,0,0);
    
    const minAllowedDate = new Date();
    // Pre-order requires H+2, Daily requires H+1
    const leadDays = (orderTypeEl && orderTypeEl.value === 'Pre-Order') ? 2 : 1;
    minAllowedDate.setDate(minAllowedDate.getDate() + leadDays);
    minAllowedDate.setHours(0,0,0,0);

    if (selectedDate < minAllowedDate) {
        return invalidate(dateEl, 'date-warning', t.val_date_future);
    }

    // Weekday Rule: 0 = Sun, 6 = Sat
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
        return invalidate(dateEl, 'date-warning', t.val_date_weekday);
    }

    if (termsEl && !termsEl.checked) {
        return invalidate(termsEl, 'checkbox-warning', t.val_terms);
    }

    if (correctnessEl && !correctnessEl.checked) {
        return invalidate(correctnessEl, 'checkbox-warning', t.val_correct);
    }

    if (currentCart.length === 0) {
        const cartWarn = document.getElementById('cart-warning');
        if (cartWarn) {
            cartWarn.innerText = t.val_empty;
            cartWarn.style.display = 'block';
            cartWarn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (!selectedMethod) {
        const methodGroup = document.querySelector('.payment-methods-group');
        if (methodGroup) {
            methodGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // You might want a specific warning for this, e.g., using notes-warning or a new one
            const notesWarn = document.getElementById('notes-warning');
            if (notesWarn) {
                notesWarn.innerText = t.val_method;
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
            invalidate(qrisProofEl, 'qris-warning', t.val_qris);
            return;
        }

        // Disable button early for file processing
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = t.val_processing;
        }

        const file = qrisProofEl.files[0];
        fileNameText = file.name;
        fileMimeTypeText = file.type;

        // Convert image to Base64 string for transmission to Google Sheets
        fileDataText = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
    }

    // 4. Final Submission State
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        submitBtn.innerText = t.val_sending;
    }

    const payload = {
        "Timestamp": new Date().toLocaleString(),
        "Terms": termsEl && termsEl.checked ? "Accepted" : "No",
        "Name": nameEl.value.trim(),
        "Phone": phoneEl.value.trim(),
        "Order": currentCart.map(item => {
            const foodEntry = t.food[item.name];
            const displayName = (foodEntry && typeof foodEntry === 'object') ? (foodEntry.name || item.name) : (foodEntry || item.name);
            const variantLabel = item.variant ? ` (${t[item.variant] || item.variant})` : '';
            return `${item.qty}x ${displayName}${variantLabel}`;
        }).join(' | '),
        "Order Type": orderTypeEl ? orderTypeEl.value : "Daily",
        "Pickup Date": dateEl.value,
        "Special Instructions / Specific Needs": document.getElementById('cust-notes')?.value.trim() || "None",
        "Amount of food": currentCart.reduce((sum, item) => sum + item.qty, 0),
        "Total amount": document.getElementById('payment-total-amount')?.innerText || '0 Rp',
        "Payment method": method,
        "Order date": new Date().toLocaleDateString(),
        "Correctness": correctnessEl && correctnessEl.checked ? "Yes" : "No",
        "Email": emailEl.value.trim(),
        "Proof link": method === 'qris' ? "Image Uploaded" : "N/A", // This will be replaced by the actual link from GAS
        fileData: fileDataText,
        fileName: fileNameText,
        fileMimeType: fileMimeTypeText
    };

    // Replace this string with your new Google Apps Script Deployment URL
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzBHlW4a-RrHT9XAvn3K5lygm3AW2_IF1L9hqiAYCSiBDApPaT8v7bqx_WOIXjUm8lG/exec'; 

    try {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });

        // Show Success Modal instead of Alert
        showSuccessModal(payload);
        localStorage.removeItem('manekoCart');
        if (typeof updateCartUI === 'function') updateCartUI();
    } catch (error) {
        console.error('Error!', error);
        alert(getTranslation('val_failed_submit'));
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = getTranslation('place_order');
        }
    }
}

function showSuccessModal(payload) {
    const overlay = document.getElementById('success-modal-overlay');
    if (!overlay) return;

    const t = translations[currentLang];

    // Fill user data
    document.getElementById('res-name').innerText = payload["Name"];
    document.getElementById('res-email').innerText = payload["Email"];
    
    // Order Type display
    const typeKey = payload["Order Type"];
    const typeText = typeKey === 'Daily' ? t.daily_order_btn : t.pre_order_btn;
    document.getElementById('res-type').innerText = typeText;

    // Date display
    document.getElementById('res-purchase-date').innerText = payload["Timestamp"];
    document.getElementById('res-pickup-date').innerText = payload["Pickup Date"];

    // Method display
    const methodKey = payload["Payment method"];
    document.getElementById('res-method').innerText = t[methodKey] || methodKey;

    // Copy order list and total from the main receipt
    document.getElementById('res-summary-list').innerHTML = document.getElementById('payment-summary-list').innerHTML;
    document.getElementById('res-total-amount').innerText = document.getElementById('payment-total-amount').innerText;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Handle Download
    const downloadBtn = document.getElementById('download-receipt-btn');
    if (downloadBtn) {
        downloadBtn.onclick = async () => {
            const receiptArea = document.getElementById('receipt-to-download');
            const canvas = await html2canvas(receiptArea, { backgroundColor: '#ffffff', scale: 2 });
            const link = document.createElement('a');
            link.download = `Maneko_Receipt_${payload["Name"].replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
    }
}