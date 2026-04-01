(function (global) {
    let mountedElement = null;
    let clickHandler = null;
    let keyHandler = null;
    let overlayHandler = null;

    function renderZoomableImage({ src, title, text }) {
        const alt = text || "";
        const caption = title || alt || "";
        const titleAttr = title ? ` title="${title}"` : "";
        const captionAttr = caption ? ` data-lightbox-caption="${escapeHtml(caption)}"` : "";
        return `
            <button type="button" class="post-image-trigger" data-lightbox-src="${src}" data-lightbox-alt="${escapeHtml(alt)}"${captionAttr}>
                <img src="${src}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" decoding="async">
            </button>
        `;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function openLightbox({ src, alt, caption }) {
        const overlay = document.getElementById("imageLightbox");
        const image = document.getElementById("imageLightboxImg");
        const captionNode = document.getElementById("imageLightboxCaption");
        if (!overlay || !image || !captionNode) return;

        image.src = src;
        image.alt = alt || "";
        captionNode.textContent = caption || alt || "";
        overlay.hidden = false;
        document.body.classList.add("image-lightbox-open");
    }

    function closeLightbox() {
        const overlay = document.getElementById("imageLightbox");
        const image = document.getElementById("imageLightboxImg");
        const captionNode = document.getElementById("imageLightboxCaption");
        if (!overlay || !image || !captionNode) return;

        overlay.hidden = true;
        image.src = "";
        image.alt = "";
        captionNode.textContent = "";
        document.body.classList.remove("image-lightbox-open");
    }

    function mount({ contentElement }) {
        unmount();
        if (!contentElement) return;

        mountedElement = contentElement;
        clickHandler = (event) => {
            const trigger = event.target.closest(".post-image-trigger");
            if (!trigger || !mountedElement.contains(trigger)) return;

            openLightbox({
                src: trigger.dataset.lightboxSrc,
                alt: trigger.dataset.lightboxAlt,
                caption: trigger.dataset.lightboxCaption
            });
        };

        keyHandler = (event) => {
            if (event.key === "Escape") {
                closeLightbox();
            }
        };

        overlayHandler = (event) => {
            if (
                event.target.id === "imageLightbox" ||
                event.target.id === "imageLightboxImg" ||
                event.target.closest("[data-lightbox-close]")
            ) {
                closeLightbox();
            }
        };

        mountedElement.addEventListener("click", clickHandler);
        document.addEventListener("keydown", keyHandler);
        document.getElementById("imageLightbox")?.addEventListener("click", overlayHandler);
    }

    function unmount() {
        if (mountedElement && clickHandler) {
            mountedElement.removeEventListener("click", clickHandler);
        }
        document.removeEventListener("keydown", keyHandler);
        document.getElementById("imageLightbox")?.removeEventListener("click", overlayHandler);

        mountedElement = null;
        clickHandler = null;
        keyHandler = null;
        overlayHandler = null;
        closeLightbox();
    }

    const api = {
        mount,
        unmount,
        renderZoomableImage
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.ImageLightbox = api;
})(typeof window !== "undefined" ? window : globalThis);
