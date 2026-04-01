let currentTag = "all";
let currentKeyword = "";
let currentCategory = "";
let currentArchive = "";
let currentBrowserPanel = "";
let lastListScrollY = 0;
let activePostId = "";
const OG_TITLE = document.title;

const GISCUS_CONFIG = {
    repo: "SY-Jia06/SY-Jia06.github.io",
    repoId: "R_kgDORaXmKw",
    category: "Comments",
    categoryId: "DIC_kwDORaXmK84C5hPk",
    lang: "zh-CN"
};

const {
    initMobileNav,
    initScrollEffects,
    formatDate,
    formatArchive,
    buildFilterUrl
} = window.BlogShared;

const {
    extractFirstImage,
    removeLeadingImage,
    stripFrontMatter,
    removeLeadingTitle
} = window.ArticleMarkdown;



document.addEventListener("DOMContentLoaded", () => {
    restoreFiltersFromUrl();
    initMobileNav();
    initScrollEffects();
    initFilters();
    initCommentsThemeSync();
    renderTopToolbar();
    renderBlogList();
    initBackButton();
    initHistoryState();

    const directPostId = getDirectPostId();
    if (directPostId) {
        openPostInternal(directPostId, { skipHistory: true });
        return;
    }


});

function initFilters() {
    renderTagFilter();
    renderActiveFilters();

    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchInput.value = currentKeyword;

    searchInput.addEventListener("input", (event) => {
        currentKeyword = event.target.value.trim().toLowerCase();
        syncFiltersToUrl();
        renderActiveFilters();
        renderBlogList();
    });
}

function renderTagFilter() {
    const container = document.getElementById("tagFilter");
    if (!container) return;

    const allTags = ["all", ...getAllTags()];
    container.innerHTML = allTags
        .map((tag) => {
            const activeClass = tag === currentTag ? " active" : "";
            const label = tag === "all" ? "全部" : tag;
            return `<button class="tag-btn${activeClass}" data-tag="${tag}">${label}</button>`;
        })
        .join("");

    container.querySelectorAll(".tag-btn").forEach((button) => {
        button.addEventListener("click", () => {
            currentTag = button.dataset.tag;
            syncFiltersToUrl();
            renderTagFilter();
            renderActiveFilters();
            renderBlogList();
        });
    });
}

function renderTopToolbar() {
    const container = document.getElementById("blogTopToolbar");
    if (!container) return;

    const stats = getSiteStats();
    container.innerHTML = `
        <button type="button" class="toolbar-chip${!currentBrowserPanel && !hasActiveFilters() ? " active" : ""}" data-browser-action="all">
            ${stats.postCount} 篇文章
        </button>
        <button type="button" class="toolbar-chip${currentBrowserPanel === "categories" ? " active" : ""}" data-browser-action="categories">
            ${stats.categoryCount} 个分类
        </button>
        <button type="button" class="toolbar-chip${currentBrowserPanel === "tags" ? " active" : ""}" data-browser-action="tags">
            ${stats.tagCount} 个标签
        </button>
        ${stats.latestDate ? `
        <button type="button" class="toolbar-chip" data-browser-action="latest">
            最近更新 ${formatDate(stats.latestDate)}
        </button>` : ""}
    `;

    container.querySelectorAll("[data-browser-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.browserAction;

            if (action === "all") {
                clearFilters();
                return;
            }

            if (action === "latest") {
                const latestPost = sortPostsByDate()[0];
                if (latestPost) openPost(latestPost.id);
                return;
            }

            currentBrowserPanel = currentBrowserPanel === action ? "" : action;
            renderTopToolbar();
            renderQuickBrowser();
        });
    });

    renderQuickBrowser();
}

function renderQuickBrowser() {
    const container = document.getElementById("quickBrowser");
    if (!container) return;

    if (!currentBrowserPanel) {
        container.hidden = true;
        container.innerHTML = "";
        return;
    }

    if (currentBrowserPanel === "categories") {
        container.hidden = false;
        container.innerHTML = `
            <div class="quick-browser-section">
                <span class="quick-browser-label">分类列表</span>
                <div class="quick-browser-list">
                    ${getCategoryCounts().map((item) => `
                        <button type="button" class="quick-browser-item${item.name === currentCategory ? " active" : ""}" data-category="${item.name}">
                            <span>${item.name}</span>
                            <span>${item.count}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;

        container.querySelectorAll("[data-category]").forEach((button) => {
            button.addEventListener("click", () => {
                currentCategory = button.dataset.category;
                currentBrowserPanel = "";
                syncFiltersToUrl();
                renderTagFilter();
                renderActiveFilters();
                renderTopToolbar();
                renderBlogList();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        return;
    }

    if (currentBrowserPanel === "tags") {
        container.hidden = false;
        container.innerHTML = `
            <div class="quick-browser-section">
                <span class="quick-browser-label">标签列表</span>
                <div class="quick-browser-list quick-browser-list-tags">
                    ${getAllTags().map((tag) => `
                        <button type="button" class="quick-browser-item${tag === currentTag ? " active" : ""}" data-tag-browser="${tag}">
                            <span>${tag}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;

        container.querySelectorAll("[data-tag-browser]").forEach((button) => {
            button.addEventListener("click", () => {
                currentTag = button.dataset.tagBrowser;
                currentBrowserPanel = "";
                syncFiltersToUrl();
                renderTagFilter();
                renderActiveFilters();
                renderTopToolbar();
                renderBlogList();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });
    }
}

function renderActiveFilters() {
    const container = document.getElementById("activeFilterBar");
    if (!container) return;

    const items = [];
    if (currentCategory) items.push(`分类: ${currentCategory}`);
    if (currentArchive) items.push(`归档: ${formatArchive(currentArchive)}`);
    if (currentTag !== "all") items.push(`标签: ${currentTag}`);
    if (currentKeyword) items.push(`搜索: ${currentKeyword}`);

    if (items.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        ${items.map((item) => `<span class="active-filter-chip">${item}</span>`).join("")}
        <button type="button" class="active-filter-clear" id="clearFiltersBtn">清除筛选</button>
    `;

    container.querySelector("#clearFiltersBtn")?.addEventListener("click", () => {
        clearFilters();
    });
}

function hasActiveFilters() {
    return Boolean(currentCategory || currentArchive || currentKeyword || currentTag !== "all");
}

function clearFilters() {
    currentTag = "all";
    currentKeyword = "";
    currentCategory = "";
    currentArchive = "";
    currentBrowserPanel = "";

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    syncFiltersToUrl();
    renderTagFilter();
    renderActiveFilters();
    renderTopToolbar();
    renderBlogList();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderBlogList() {
    const container = document.getElementById("blogList");
    if (!container) return;

    const filteredPosts = filterPosts();
    if (filteredPosts.length === 0) {
        container.innerHTML = `<div class="empty-state">没有匹配的文章，换个关键词或标签试试。</div>`;
        return;
    }

    const randomPostHtml = buildRandomPostHtml(filteredPosts);

    container.innerHTML = filteredPosts
        .map((post) => `
            <article class="post-card-link" data-id="${post.id}">
                ${buildPostCard(post)}
            </article>
        `)
        .join("");

    if (randomPostHtml) {
        container.insertAdjacentHTML("afterbegin", randomPostHtml);
        const randomCard = container.querySelector("[data-random-id]");
        if (randomCard) {
            randomCard.addEventListener("click", () => openPost(randomCard.dataset.randomId));
        }
    }

    container.querySelectorAll("[data-id]").forEach((card) => {
        card.addEventListener("click", () => openPost(card.dataset.id));
    });

    observePostCards();
}

function buildRandomPostHtml(posts) {
    if (posts.length < 2) return "";
    const randomIndex = Math.floor(Math.random() * posts.length);
    const post = posts[randomIndex];
    const coverStyle = post.coverImage
        ? ` style="--cover-image: url('${post.coverImage}');"`
        : "";
    const imageClass = post.coverImage ? " has-image" : "";
    return `
        <div class="random-post-card" data-random-id="${post.id}">
            <div class="random-post-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                随便看看
            </div>
            <article class="post-card">
                <div class="post-card-cover tone-${post.coverTone || "teal"}${imageClass}"${coverStyle}>
                    <span>${post.coverLabel || "POST"}</span>
                    <span>${post.date.slice(5).replace("-", ".")}</span>
                </div>
                <div class="post-card-body">
                    <div class="post-card-meta">
                        <span>${formatDate(post.date)}</span>
                        <a class="post-card-category is-link" href="${buildFilterUrl({ category: post.category })}">${post.category}</a>
                    </div>
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-summary">${post.summary}</p>
                    <div class="post-card-tags">${post.tags.map((tag) => `<a class="post-tag" href="${buildFilterUrl({ tag })}">${tag}</a>`).join("")}</div>
                </div>
            </article>
        </div>
    `;
}

function filterPosts() {
    return sortPostsByDate().filter((post) => {
        const matchesTag = currentTag === "all" || post.tags.includes(currentTag);
        const matchesCategory = !currentCategory || post.category === currentCategory;
        const matchesArchive = !currentArchive || post.date.startsWith(currentArchive);
        const source = [post.title, post.summary, post.category, ...post.tags].join(" ").toLowerCase();
        const matchesKeyword = !currentKeyword || source.includes(currentKeyword);
        return matchesTag && matchesCategory && matchesArchive && matchesKeyword;
    });
}

async function openPost(postId) {
    return openPostInternal(postId, { skipHistory: false });
}

async function openPostInternal(postId, { skipHistory = false } = {}) {
    const post = POSTS.find((item) => item.id === postId);
    if (!post) return;
    activePostId = post.id;
    window.ReadingEnhancements?.unmount();

    const blogListShell = document.getElementById("blogListShell");
    const listPanel = document.getElementById("listPanel");
    const blogList = document.getElementById("blogList");
    const blogPageLayout = document.getElementById("blogPageLayout");
    const postView = document.getElementById("postView");
    const postContent = document.getElementById("postContent");
    const postHero = document.getElementById("postHero");
    const postHeroTitle = document.getElementById("postHeroTitle");
    const postMetaHead = document.getElementById("postMetaHead");
    const blogTopToolbar = document.getElementById("blogTopToolbar");
    const quickBrowser = document.getElementById("quickBrowser");
    const blogBanner = document.getElementById("blogBanner");

    const listElements = [blogListShell, listPanel, blogList, blogTopToolbar, quickBrowser, blogBanner].filter(Boolean);

    if (typeof gsap !== "undefined") {
        gsap.to(listElements, {
            opacity: 0, y: -20, duration: 0.25, ease: "power2.in",
            onComplete: () => {
                listElements.forEach(el => { el.style.display = "none"; el.style.opacity = ""; el.style.transform = ""; });
                blogPageLayout.classList.add("reading-mode");
                postView.style.display = "block";
                postView.style.opacity = "0";
                gsap.to(postView, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
                gsap.from(postView, { y: 30, duration: 0.4, ease: "power2.out" });
            }
        });
    } else {
        listElements.forEach(el => { el.style.display = "none"; });
        blogPageLayout.classList.add("reading-mode");
        postView.style.display = "block";
    }

    if (!skipHistory) {
        lastListScrollY = window.scrollY;
        history.replaceState({ view: "list", scrollY: lastListScrollY }, "", buildCurrentUrl());
        const nextUrl = buildCurrentUrl(post.id);
        history.pushState({ view: "post", postId, scrollY: lastListScrollY }, "", nextUrl);
    }

    postHeroTitle.textContent = post.title;
    document.title = `${post.title} - SY-Jia06`;

    let jsonLdScript = document.getElementById("jsonld-post");
    if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = "jsonld-post";
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "datePublished": post.date,
        "description": post.summary,
        "author": {
            "@type": "Person",
            "name": "SY-Jia06"
        }
    });
    postMetaHead.innerHTML = `
        <span>${formatDate(post.date)}</span>
        <a class="post-card-category is-link" href="${buildFilterUrl({ category: post.category })}">${post.category}</a>
        ${post.tags.map((tag) => `<a class="post-tag" href="${buildFilterUrl({ tag })}">${tag}</a>`).join("")}
    `;

    try {
        const response = await fetch(post.file);
        if (!response.ok) throw new Error("Post not found");
        const markdown = await response.text();
        const renderer = new marked.Renderer();
        const postDir = post.file.substring(0, post.file.lastIndexOf("/") + 1);
        const cleanMarkdown = stripFrontMatter(markdown);
        const heroImage = extractFirstImage(cleanMarkdown, postDir);
        postHero.style.backgroundImage = heroImage
            ? `linear-gradient(135deg, rgba(12, 57, 67, 0.54), rgba(28, 103, 116, 0.36)), url("${heroImage}")`
            : "";

        renderer.image = ({ href, title, text }) => {
            let src = href;
            if (src && !src.startsWith("http") && !src.startsWith("/")) {
                src = `${postDir}${src}`;
            }
            return window.ImageLightbox.renderZoomableImage({ src, title, text });
        };

        const readingMarkdown = removeLeadingImage(removeLeadingTitle(cleanMarkdown, post.title));
        postContent.innerHTML = marked.parse(readingMarkdown, { renderer });
        window.ImageLightbox?.mount({ contentElement: postContent });
        window.ReadingEnhancements?.mount({
            post,
            posts: sortPostsByDate(),
            contentElement: postContent
        });
    } catch (error) {
        postHero.style.backgroundImage = "";
        postContent.innerHTML = `
            <div class="post-empty">
                <h2>${post.title}</h2>
                <p>当前无法读取 <code>${post.file}</code>。</p>
                <p>如果你是直接打开本地 HTML 文件，浏览器通常会拦截 <code>fetch()</code> 读取本地 Markdown。请改用本地服务器或部署到 GitHub Pages 后访问。</p>
            </div>
        `;
    }

    renderComments(post);

    finishSiteLoading();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function initBackButton() {
    const backBtn = document.getElementById("backBtn");
    if (!backBtn) return;

    backBtn.addEventListener("click", () => {
        if (getDirectPostId()) {
            const directPostId = getDirectPostId();
            const cameFromList = window.history.length > 1 && history.state?.view === "post";

            if (cameFromList && directPostId) {
                history.back();
                return;
            }

            window.location.href = buildCurrentUrl();
            return;
        }
        closePostView({ skipHistory: true, restoreScrollY: lastListScrollY });
    });
}

function initHistoryState() {
    const directPostId = getDirectPostId();
    history.replaceState(
        {
            view: directPostId ? "post" : "list",
            postId: directPostId || null,
            scrollY: window.scrollY
        },
        "",
        buildCurrentUrl(directPostId)
    );

    window.addEventListener("popstate", (event) => {
        const directPostId = getDirectPostId();
        if (directPostId) {
            openPostInternal(directPostId, { skipHistory: true });
            return;
        }
        closePostView({ skipHistory: true, restoreScrollY: event.state?.scrollY ?? lastListScrollY });
    });
}

function closePostView({ skipHistory = false, restoreScrollY = 0 } = {}) {
    const postView = document.getElementById("postView");
    const blogListShell = document.getElementById("blogListShell");
    const listPanel = document.getElementById("listPanel");
    const blogList = document.getElementById("blogList");
    const blogTopToolbar = document.getElementById("blogTopToolbar");
    const quickBrowser = document.getElementById("quickBrowser");
    const blogBanner = document.getElementById("blogBanner");
    const blogPageLayout = document.getElementById("blogPageLayout");

    window.ImageLightbox?.unmount();
    window.ReadingEnhancements?.unmount();
    activePostId = "";
    document.title = OG_TITLE;
    const jsonLdScript = document.getElementById("jsonld-post");
    if (jsonLdScript) jsonLdScript.remove();
    clearComments();

    const listElements = [blogListShell, listPanel, blogList, blogTopToolbar, quickBrowser, blogBanner].filter(Boolean);

    function restoreList() {
        postView.style.display = "none";
        postView.style.opacity = "";
        postView.style.transform = "";
        blogPageLayout.classList.remove("reading-mode");
        listElements.forEach(el => { el.style.display = ""; el.style.opacity = ""; el.style.transform = ""; });

        if (typeof gsap !== "undefined") {
            gsap.from(listElements, { opacity: 0, y: -20, duration: 0.35, ease: "power2.out", stagger: 0.04 });
        }

        window.setTimeout(() => {
            window.scrollTo({ top: restoreScrollY, behavior: "auto" });
        }, 0);
    }

    if (typeof gsap !== "undefined") {
        gsap.to(postView, {
            opacity: 0, y: 20, duration: 0.25, ease: "power2.in",
            onComplete: restoreList
        });
    } else {
        restoreList();
    }

    if (!skipHistory) {
        history.pushState({ view: "list", scrollY: restoreScrollY }, "", buildCurrentUrl());
    } else {
        history.replaceState({ view: "list", scrollY: restoreScrollY }, "", buildCurrentUrl());
    }
}

function initCommentsThemeSync() {
    window.addEventListener("blog-theme-change", () => {
        if (!activePostId) return;
        const post = POSTS.find((item) => item.id === activePostId);
        if (!post) return;
        renderComments(post);
    });
}

function renderComments(post) {
    const commentsSection = document.getElementById("postComments");
    const commentsSetup = document.getElementById("postCommentsSetup");
    const commentsEmbed = document.getElementById("postCommentsEmbed");
    if (!commentsSection || !commentsSetup || !commentsEmbed) return;

    commentsSection.hidden = false;
    commentsEmbed.innerHTML = "";

    if (!isCommentsConfigured()) {
        commentsSetup.hidden = false;
        commentsSetup.innerHTML = `评论区配置还没填完整。先在 GitHub 开启 Discussions 并创建 <code>${GISCUS_CONFIG.category}</code> 分类，再把 <code>categoryId</code> 填到 <code>blog-app.js</code> 里的 <code>GISCUS_CONFIG</code>。`;
        return;
    }

    commentsSetup.hidden = true;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS_CONFIG.repo);
    script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    script.setAttribute("data-category", GISCUS_CONFIG.category);
    script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", post.id);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", getCommentsTheme());
    script.setAttribute("data-lang", GISCUS_CONFIG.lang);
    commentsEmbed.appendChild(script);
}

function clearComments() {
    const commentsSection = document.getElementById("postComments");
    const commentsSetup = document.getElementById("postCommentsSetup");
    const commentsEmbed = document.getElementById("postCommentsEmbed");
    if (commentsEmbed) commentsEmbed.innerHTML = "";
    if (commentsSetup) {
        commentsSetup.hidden = true;
        commentsSetup.textContent = "";
    }
    if (commentsSection) commentsSection.hidden = true;
}

function isCommentsConfigured() {
    return Boolean(
        GISCUS_CONFIG.repo &&
        GISCUS_CONFIG.repoId &&
        GISCUS_CONFIG.category &&
        GISCUS_CONFIG.categoryId
    );
}

function getCommentsTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function buildPostCard(post) {
    const coverStyle = post.coverImage
        ? ` style="--cover-image: url('${post.coverImage}');"`
        : "";
    const imageClass = post.coverImage ? " has-image" : "";
    return `
        <article class="post-card">
            <div class="post-card-cover tone-${post.coverTone || "teal"}${imageClass}"${coverStyle}>
                <span>${post.coverLabel || "POST"}</span>
                <span>${post.date.slice(5).replace("-", ".")}</span>
            </div>
            <div class="post-card-body">
                <div class="post-card-meta">
                    <span>${formatDate(post.date)}</span>
                    <a class="post-card-category is-link" href="${buildFilterUrl({ category: post.category })}">${post.category}</a>
                </div>
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-summary">${post.summary}</p>
                <div class="post-card-tags">${post.tags.map((tag) => `<a class="post-tag" href="${buildFilterUrl({ tag })}">${tag}</a>`).join("")}</div>
            </div>
        </article>
    `;
}

function restoreFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    currentTag = params.get("tag") || "all";
    currentCategory = params.get("category") || "";
    currentArchive = params.get("archive") || "";
    currentKeyword = (params.get("q") || "").trim().toLowerCase();
}

function syncFiltersToUrl() {
    const params = new URLSearchParams();
    if (currentTag !== "all") params.set("tag", currentTag);
    if (currentCategory) params.set("category", currentCategory);
    if (currentArchive) params.set("archive", currentArchive);
    if (currentKeyword) params.set("q", currentKeyword);
    const query = params.toString();
    history.replaceState("", document.title, `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

function getDirectPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("post") || window.location.hash.slice(1) || "";
}

function buildCurrentUrl(postId = "") {
    const params = new URLSearchParams(window.location.search);
    params.delete("post");
    if (postId) params.set("post", postId);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
}



function observePostCards() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add("in-view");
                }, index * 60);
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.1 });

    document.querySelectorAll('.post-card-link, .random-post-card').forEach(card => {
        card.classList.add('fade-up');
        observer.observe(card);
    });
}
