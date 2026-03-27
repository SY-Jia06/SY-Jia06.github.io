let currentTag = "all";
let currentKeyword = "";
let currentCategory = "";
let currentArchive = "";
let currentBrowserPanel = "";

document.body.classList.add("loading");

document.addEventListener("DOMContentLoaded", () => {
    restoreFiltersFromUrl();
    initMobileNav();
    initScrollEffects();
    initFilters();
    renderTopToolbar();
    renderBlogList();
    initBackButton();

    const hash = window.location.hash.slice(1);
    if (hash) {
        openPost(hash);
        return;
    }

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
    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    });
}

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
        <a class="active-filter-clear" href="blog.html">清除筛选</a>
    `;
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

    container.innerHTML = filteredPosts
        .map((post) => `
            <article class="post-card-link" data-id="${post.id}">
                ${buildPostCard(post)}
            </article>
        `)
        .join("");

    container.querySelectorAll("[data-id]").forEach((card) => {
        card.addEventListener("click", () => openPost(card.dataset.id));
    });
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
    const post = POSTS.find((item) => item.id === postId);
    if (!post) return;

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

    listPanel.style.display = "none";
    blogList.style.display = "none";
    blogTopToolbar.style.display = "none";
    quickBrowser.style.display = "none";
    blogPageLayout.classList.add("reading-mode");
    postView.style.display = "block";
    window.location.hash = post.id;

    postHeroTitle.textContent = post.title;
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
        const heroImage = extractFirstImage(markdown, postDir);
        postHero.style.backgroundImage = heroImage
            ? `linear-gradient(135deg, rgba(12, 57, 67, 0.54), rgba(28, 103, 116, 0.36)), url("${heroImage}")`
            : "";

        renderer.image = ({ href, title, text }) => {
            let src = href;
            if (src && !src.startsWith("http") && !src.startsWith("/")) {
                src = `${postDir}${src}`;
            }
            const titleAttr = title ? ` title="${title}"` : "";
            return `<img src="${src}" alt="${text || ""}"${titleAttr}>`;
        };

        postContent.innerHTML = marked.parse(removeLeadingImage(markdown), { renderer });
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

    finishSiteLoading();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function initBackButton() {
    const backBtn = document.getElementById("backBtn");
    if (!backBtn) return;

    backBtn.addEventListener("click", () => {
        document.getElementById("listPanel").style.display = "";
        document.getElementById("blogList").style.display = "";
        document.getElementById("blogTopToolbar").style.display = "";
        document.getElementById("quickBrowser").style.display = "";
        document.getElementById("blogPageLayout").classList.remove("reading-mode");
        document.getElementById("postView").style.display = "none";
        history.pushState("", document.title, window.location.pathname);
    });
}

function buildPostCard(post) {
    return `
        <article class="post-card">
            <div class="post-card-cover tone-${post.coverTone || "teal"}">
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

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatArchive(value) {
    const [year, month] = value.split("-");
    return `${year} 年 ${Number(month)} 月`;
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

function buildFilterUrl(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    return `blog.html?${params.toString()}`;
}

function extractFirstImage(markdown, postDir) {
    const match = markdown.match(/!\[[^\]]*]\(([^)]+)\)/);
    if (!match) return "";

    let src = match[1].trim();
    if (!src.startsWith("http") && !src.startsWith("/")) {
        src = `${postDir}${src}`;
    }
    return src;
}

function removeLeadingImage(markdown) {
    return markdown.replace(/^\s*!\[[^\]]*]\(([^)]+)\)\s*/m, "").trimStart();
}

function finishSiteLoading() {
    const loader = document.getElementById("siteLoader");
    if (!loader) return;

    window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.classList.remove("loading");
    }, 420);
}
