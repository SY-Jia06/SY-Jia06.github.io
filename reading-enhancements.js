(function (global) {
    const state = {
        scrollHandler: null,
        headings: [],
        contentElement: null
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
        const hasH2 = items.some((item) => item.level === 2);
        const hasH3 = items.some((item) => item.level === 3);
        return hasH2 && hasH3;
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
        const headings = Array.from(contentElement.querySelectorAll("h2, h3"));
        const ids = createUniqueIds(headings);

        return headings.map((heading, index) => {
            const level = Number(heading.tagName.slice(1));
            const id = ids[index];
            heading.id = id;
            return {
                id,
                level,
                text: heading.textContent.trim(),
                element: heading
            };
        });
    }

    function renderToc(items) {
        const toc = document.getElementById("postToc");
        if (!toc) return;

        if (!shouldShowToc(items)) {
            toc.hidden = true;
            toc.innerHTML = "";
            return;
        }

        toc.hidden = false;
        toc.innerHTML = `
            <div class="post-toc-label">目录</div>
            <div class="post-toc-list">
                ${items.map((item) => `
                    <a href="#${item.id}" class="post-toc-link level-${item.level}" data-toc-id="${item.id}">
                        ${item.text}
                    </a>
                `).join("")}
            </div>
        `;

        toc.querySelectorAll("[data-toc-id]").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const target = document.getElementById(link.dataset.tocId);
                if (!target) return;
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
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

    function updateTocActive(scrollY) {
        const tocLinks = document.querySelectorAll("[data-toc-id]");
        if (!tocLinks.length || !state.headings.length) return;

        let activeId = state.headings[0].id;
        state.headings.forEach((item) => {
            const top = item.element.getBoundingClientRect().top + window.scrollY;
            if (scrollY >= top - 120) {
                activeId = item.id;
            }
        });

        tocLinks.forEach((link) => {
            link.classList.toggle("active", link.dataset.tocId === activeId);
        });
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
        updateTocActive(window.scrollY);
    }

    function mount({ post, posts, contentElement }) {
        unmount();

        if (!contentElement) return;
        state.contentElement = contentElement;
        state.headings = collectHeadings(contentElement);

        renderToc(state.headings);
        renderPagination(posts, post.id);

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

        const progress = document.getElementById("readingProgress");
        const progressBar = document.getElementById("readingProgressBar");
        const toc = document.getElementById("postToc");
        const pagination = document.getElementById("postPagination");

        if (progress) progress.hidden = true;
        if (progressBar) progressBar.style.transform = "scaleX(0)";
        if (toc) {
            toc.hidden = true;
            toc.innerHTML = "";
        }
        if (pagination) {
            pagination.hidden = true;
            pagination.innerHTML = "";
        }
    }

    const api = {
        mount,
        unmount,
        slugifyHeading,
        shouldShowToc,
        getAdjacentPosts,
        computeReadingProgress
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.ReadingEnhancements = api;
})(typeof window !== "undefined" ? window : globalThis);
