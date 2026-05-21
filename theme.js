(function () {
    const storageKey = "blog-theme-mode";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let transitionTimer;

    function getStoredMode() {
        const stored = localStorage.getItem(storageKey);
        return ["light", "dark", "system"].includes(stored) ? stored : "system";
    }

    function resolveTheme(mode) {
        if (mode === "system") {
            return media.matches ? "dark" : "light";
        }
        return mode;
    }

    function startThemeTransition() {
        clearTimeout(transitionTimer);
        document.documentElement.classList.add("theme-changing");
        transitionTimer = setTimeout(() => {
            document.documentElement.classList.remove("theme-changing");
        }, 260);
    }

    function applyTheme(mode, options = {}) {
        const resolved = resolveTheme(mode);
        if (options.animate) {
            startThemeTransition();
        }
        document.documentElement.dataset.themeMode = mode;
        document.documentElement.dataset.theme = resolved;
        syncThemeControls(mode);
        window.dispatchEvent(new CustomEvent("blog-theme-change", {
            detail: { mode, theme: resolved }
        }));
    }

    function syncThemeControls(mode) {
        document.querySelectorAll("[data-theme-mode]").forEach((button) => {
            button.classList.toggle("active", button.dataset.themeMode === mode);
        });
    }

    function handleThemeClick(event) {
        const button = event.target.closest("[data-theme-mode]");
        if (!button) return;
        const mode = button.dataset.themeMode;
        localStorage.setItem(storageKey, mode);
        applyTheme(mode, { animate: true });
    }

    document.addEventListener("DOMContentLoaded", () => {
        applyTheme(getStoredMode());
        document.querySelectorAll(".theme-switcher").forEach((group) => {
            group.addEventListener("click", handleThemeClick);
        });
    });

    media.addEventListener("change", () => {
        if (getStoredMode() === "system") {
            applyTheme("system", { animate: true });
        }
    });

    applyTheme(getStoredMode());
})();
