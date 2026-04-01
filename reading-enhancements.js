(function (global) {
    const state = {
        scrollHandler: null,
        headings: [],
        contentElement: null,
        activeHeadingId: "",
        activeH2Id: ""
    };

    function slugifyHeading(text) {
        const normalized = String(text || "").trim().toLowerCase();
        const ascii = normalized
            .replace(/[^\w\s-]/g, " ")
            .replace(/_/g, " ")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        if (ascii) return ascii;

        const codepoints = Array.from(String(text || "").trim())
            .filter((char) => /\S/.test(char))
            .map((char) => char.codePointAt(0).toString(16));

        return codepoints.length ? `section-${codepoints.join("-")}` : "section";
    }

    function shouldShowToc(items) {
        return items.some((item) => item.level === 2);
    }

    function shouldRenderDesktopSidebars(viewportWidth) {
        return viewportWidth > 980;
    }

    function getAdjacentPosts(posts, postId) {
        const index = posts.findIndex((item) => item.id === postId);
        if (index === -1) {
            return { previous: null, next: null };
        }

        return {
            previous: posts[index - 1] || null,
            next: posts[index + 1] || null
        };
    }

    function computeReadingProgress({ start, end, scrollY }) {
        if (end <= start) return 1;
        const raw = (scrollY - start) / (end - start);
        return Math.max(0, Math.min(1, raw));
    }

    function getSubtocItems(headings, activeH2Id) {
        return headings.filter((item) => item.level === 3 && item.parentId === activeH2Id);
    }

    function getActiveHeadingFromPositions(headings, activationBandY) {
        if (!headings.length) return null;

        let active = headings[0];
        headings.forEach((item) => {
            if (item.top <= activationBandY) {
                active = item;
            }
        });

        return active;
    }

    function createUniqueIds(headings) {
        const seen = new Map();
        return headings.map((heading) => {
            const base = slugifyHeading(heading.textContent);
            const count = seen.get(base) || 0;
            seen.set(base, count + 1);
            return count ? `${base}-${count + 1}` : base;
        });
    }

    function collectHeadings(contentElement) {
        const headingElements = Array.from(contentElement.querySelectorAll("h2, h3"));
        const ids = createUniqueIds(headingElements);
        let currentH2Id = "";

        return headingElements.map((heading, index) => {
            const level = Number(heading.tagName.slice(1));
            const id = ids[index];
            heading.id = id;

            if (level === 2) currentH2Id = id;

            return {
                id,
                level,
                text: heading.textContent.trim(),
                element: heading,
                parentId: level === 3 ? currentH2Id : ""
            };
        });
    }

    function buildTocLinks(items, activeId, linkClass) {
        return items.map((item) => `
            <a href="#${item.id}" class="${linkClass} level-${item.level}${item.id === activeId ? " active" : ""}" data-toc-id="${item.id}">
                ${item.text}
            </a>
        `).join("");
    }

    function bindTocClicks(root) {
        root.querySelectorAll("[data-toc-id]").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const target = document.getElementById(link.dataset.tocId);
                if (!target) return;
                const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 72;
                const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 24;
                window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
            });
        });
    }

    function renderGlobalToc(items, activeId) {
        const toc = document.getElementById("postToc");
        if (!toc) return false;

        if (!shouldShowToc(items)) {
            toc.hidden = true;
            toc.innerHTML = "";
            return false;
        }

        toc.hidden = false;
        toc.innerHTML = `
            <div class="post-side-label">目录</div>
            <div class="post-toc-list">
                ${buildTocLinks(items, activeId, "post-toc-link")}
            </div>
        `;
        bindTocClicks(toc);
        return true;
    }

    function renderSubtoc(items, activeHeadingId, activeH2Id) {
        const subtoc = document.getElementById("postSubtoc");
        if (!subtoc) return false;

        const children = getSubtocItems(items, activeH2Id);
        if (children.length === 0) {
            subtoc.hidden = false;
            subtoc.innerHTML = `
                <div class="post-side-label">本节</div>
                <p class="post-subtoc-empty">当前章节没有更细的子目录。</p>
            `;
            return true;
        }

        subtoc.hidden = false;
        subtoc.innerHTML = `
            <div class="post-side-label">本节</div>
            <div class="post-subtoc-list">
                ${buildTocLinks(children, activeHeadingId, "post-subtoc-link")}
            </div>
        `;
        bindTocClicks(subtoc);
        return true;
    }

    function renderPagination(posts, postId) {
        const pagination = document.getElementById("postPagination");
        if (!pagination) return;

        const { previous, next } = getAdjacentPosts(posts, postId);
        if (!previous && !next) {
            pagination.hidden = true;
            pagination.innerHTML = "";
            return;
        }

        pagination.hidden = false;
        pagination.innerHTML = `
            ${previous ? `
                <button type="button" class="post-pagination-card is-previous" data-post-nav="${previous.id}">
                    <span class="post-pagination-label">上一篇</span>
                    <strong>${previous.title}</strong>
                </button>
            ` : ""}
            ${next ? `
                <button type="button" class="post-pagination-card is-next" data-post-nav="${next.id}">
                    <span class="post-pagination-label">下一篇</span>
                    <strong>${next.title}</strong>
                </button>
            ` : ""}
        `;

        pagination.querySelectorAll("[data-post-nav]").forEach((button) => {
            button.addEventListener("click", () => {
                global.openPost?.(button.dataset.postNav);
            });
        });
    }

    function getActiveHeading(scrollY) {
        const activationBandY = Math.max(180, Math.min(260, Math.round(window.innerHeight * 0.28)));
        const positioned = state.headings.map((item) => ({
            ...item,
            top: item.element.getBoundingClientRect().top
        }));

        return getActiveHeadingFromPositions(positioned, activationBandY);
    }

    function syncTocs() {
        const toc = document.getElementById("postToc");
        const subtoc = document.getElementById("postSubtoc");
        const layout = document.getElementById("articleLayout");

        if (!shouldRenderDesktopSidebars(window.innerWidth)) {
            if (toc) {
                toc.hidden = true;
                toc.innerHTML = "";
            }
            if (subtoc) {
                subtoc.hidden = true;
                subtoc.innerHTML = "";
            }
            if (layout) {
                layout.classList.remove("has-left-toc", "has-right-toc", "toc-both", "toc-left-only");
            }
            return;
        }

        if (!state.headings.length) return;

        const active = getActiveHeading(window.scrollY);
        if (!active) return;

        const activeH2Id = active.level === 2 ? active.id : active.parentId;
        state.activeHeadingId = active.id;
        state.activeH2Id = activeH2Id;

        const hasGlobal = renderGlobalToc(state.headings, state.activeHeadingId);
        const hasSubtoc = renderSubtoc(state.headings, state.activeHeadingId, state.activeH2Id);

        if (layout) {
            layout.classList.toggle("has-left-toc", hasGlobal);
            layout.classList.toggle("has-right-toc", hasSubtoc);
            layout.classList.toggle("toc-both", hasGlobal && hasSubtoc);
            layout.classList.toggle("toc-left-only", hasGlobal && !hasSubtoc);
        }
    }

    function updateProgress() {
        const progress = document.getElementById("readingProgress");
        const progressBar = document.getElementById("readingProgressBar");
        if (!progress || !progressBar || !state.contentElement) return;

        const rect = state.contentElement.getBoundingClientRect();
        const start = rect.top + window.scrollY;
        const end = start + state.contentElement.offsetHeight - window.innerHeight;
        const ratio = computeReadingProgress({
            start,
            end: Math.max(start, end),
            scrollY: window.scrollY
        });

        progress.hidden = false;
        progressBar.style.transform = `scaleX(${ratio})`;
        syncTocs();
    }

    function mount({ post, posts, contentElement }) {
        unmount();

        if (!contentElement) return;
        state.contentElement = contentElement;
        state.headings = collectHeadings(contentElement);

        renderPagination(posts, post.id);
        syncTocs();

        state.scrollHandler = () => updateProgress();
        window.addEventListener("scroll", state.scrollHandler, { passive: true });
        window.addEventListener("resize", state.scrollHandler);
        updateProgress();
    }

    function unmount() {
        if (state.scrollHandler) {
            window.removeEventListener("scroll", state.scrollHandler);
            window.removeEventListener("resize", state.scrollHandler);
        }

        state.scrollHandler = null;
        state.headings = [];
        state.contentElement = null;
        state.activeHeadingId = "";
        state.activeH2Id = "";

        const progress = document.getElementById("readingProgress");
        const progressBar = document.getElementById("readingProgressBar");
        const toc = document.getElementById("postToc");
        const subtoc = document.getElementById("postSubtoc");
        const pagination = document.getElementById("postPagination");
        const layout = document.getElementById("articleLayout");

        if (progress) progress.hidden = true;
        if (progressBar) progressBar.style.transform = "scaleX(0)";
        if (toc) {
            toc.hidden = true;
            toc.innerHTML = "";
        }
        if (subtoc) {
            subtoc.hidden = true;
            subtoc.innerHTML = "";
        }
        if (pagination) {
            pagination.hidden = true;
            pagination.innerHTML = "";
        }
        if (layout) {
            layout.classList.remove("has-left-toc", "has-right-toc", "toc-both", "toc-left-only");
        }
    }

    const api = {
        mount,
        unmount,
        slugifyHeading,
        shouldShowToc,
        shouldRenderDesktopSidebars,
        getAdjacentPosts,
        computeReadingProgress,
        getSubtocItems,
        getActiveHeadingFromPositions
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.ReadingEnhancements = api;
})(typeof window !== "undefined" ? window : globalThis);
