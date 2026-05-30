/** UI COMPONENTS INITIALIZATION **/

/** CAMPUS TALK MARQUEE: Smooth Pause on Interaction **/
function initMarqueeInteraction() {
    const track = document.querySelector('.marquee-track');
    // Check if the track exists and the browser supports the Web Animations API
    if (!track || typeof track.getAnimations !== 'function') return;

    let targetRate = 1;
    let currentRate = 1;
    let rafId = null;

    const updateRate = () => {
        // Using Linear Interpolation (lerp) for smooth deceleration
        const lerpFactor = 0.05; 
        currentRate += (targetRate - currentRate) * lerpFactor;

        // Snap to target value and stop the animation loop if we are close enough
        if (Math.abs(targetRate - currentRate) < 0.005) {
            currentRate = targetRate;
            rafId = null;
        } else {
            rafId = requestAnimationFrame(updateRate);
        }
        
        const animations = track.getAnimations();
        animations.forEach(anim => {
            anim.playbackRate = currentRate;
        });
    };

    track.addEventListener('mouseenter', () => {
        targetRate = 0; // Slowly stop
        if (!rafId) rafId = requestAnimationFrame(updateRate);
    });

    track.addEventListener('mouseleave', () => {
        targetRate = 1; // Slowly resume
        if (!rafId) rafId = requestAnimationFrame(updateRate);
    });
}