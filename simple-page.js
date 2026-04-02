const { initMobileNav, initScrollEffects } = window.BlogShared;

document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initScrollEffects();
    if (window.ImageLightbox) {
        window.ImageLightbox.mount({ contentElement: document.body });
    }
});
