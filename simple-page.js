document.body.classList.add("loading");

const { initMobileNav, initScrollEffects } = window.BlogShared;

document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initScrollEffects();
    finishSiteLoading();
});

function finishSiteLoading() {
    const loader = document.getElementById("siteLoader");
    if (!loader) return;

    window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.classList.remove("loading");
    }, 420);
}
