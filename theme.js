(function () {
    const storageKey = "blog-theme-mode";
    const media = window.matchMedia("(prefers-color-scheme: dark)");

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

    function applyTheme(mode) {
        const resolved = resolveTheme(mode);
        document.documentElement.dataset.themeMode = mode;
        document.documentElement.dataset.theme = resolved;
        syncThemeControls(mode);
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
        applyTheme(mode);
    }

    document.addEventListener("DOMContentLoaded", () => {
        applyTheme(getStoredMode());
        document.querySelectorAll(".theme-switcher").forEach((group) => {
            group.addEventListener("click", handleThemeClick);
        });
    });

    media.addEventListener("change", () => {
        if (getStoredMode() === "system") {
            applyTheme("system");
        }
    });

    applyTheme(getStoredMode());
})();
