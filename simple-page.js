document.body.classList.add("loading");

document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initScrollEffects();
    finishSiteLoading();
});

function initMobileNav() {
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!navToggle || !mobileMenu) return;

    navToggle.addEventListener("click", () => {
        mobileMenu.classList.toggle("open");
    });
}

function initScrollEffects() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    });
}

function finishSiteLoading() {
    const loader = document.getElementById("siteLoader");
    if (!loader) return;

    window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.classList.remove("loading");
    }, 420);
}
