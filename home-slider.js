/** HOME PAGE: Slider Initialization **/
document.addEventListener('DOMContentLoaded', function () {
    const sliderEl = document.querySelector('#menu-slider');
    if (sliderEl && typeof Splide !== 'undefined') {
        // Chrome Fix: Ensure the browser has painted the layout before mounting Splide
        requestAnimationFrame(() => {
            const isPaymentPage = !!document.getElementById('payment-summary-list');
            const splide = new Splide('#menu-slider', {
                type: 'loop',
                perPage: isPaymentPage ? 1 : 4,
                perMove: 1,
                autoplay: true,
                interval: 3000,
                speed: 1000,
                pauseOnHover: true,
                arrows: true,
                pagination: false,
                gap: '2rem',
                breakpoints: {
                    1200: { perPage: isPaymentPage ? 1 : 3 },
                    1024: { perPage: isPaymentPage ? 1 : 2 },
                    768: { perPage: 1 }
                }
            });
            splide.mount();
        });
    }
});