document.body.classList.add("loading");

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initScrollEffects();
    renderHomePage();
    restorePageFromHash();
    finishSiteLoading();
});

function initNavigation() {
    const navLinks = document.querySelectorAll("[data-page]");
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            navigateTo(link.dataset.page);
            mobileMenu.classList.remove("open");
        });
    });

    if (navToggle) {
        navToggle.addEventListener("click", () => {
            mobileMenu.classList.toggle("open");
        });
    }
}

function navigateTo(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.toggle("active", page.id === `page-${pageId}`);
    });

    document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
        link.classList.toggle("active", link.dataset.page === pageId);
    });

    history.replaceState("", document.title, `${window.location.pathname}${pageId === "projects" ? "#page-projects" : ""}`);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function restorePageFromHash() {
    const hash = window.location.hash.replace("#page-", "");
    if (["home", "projects"].includes(hash)) {
        navigateTo(hash);
    }
}

function initScrollEffects() {
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    });
}

function renderHomePage() {
    renderRecentPosts();
    renderHomeCategories();
    renderHomeArchives();
    renderHomeTags();
    renderHomeStats();
}

function renderRecentPosts() {
    const container = document.getElementById("recentPosts");
    if (!container) return;

    const posts = sortPostsByDate().slice(0, 3);
    container.innerHTML = posts.map((post) => buildPostCard(post, true)).join("");
}

function renderHomeCategories() {
    const container = document.getElementById("homeCategoryList");
    if (!container) return;

    container.innerHTML = getCategoryCounts()
        .map((item) => `<a class="taxonomy-item-link" href="${buildFilterUrl({ category: item.name })}"><span>${item.name}</span><span>${item.count}</span></a>`)
        .join("");
}

function renderHomeArchives() {
    const container = document.getElementById("homeArchiveList");
    if (!container) return;

    container.innerHTML = getArchiveCounts()
        .map((item) => `<a class="taxonomy-item-link" href="${buildFilterUrl({ archive: item.month })}"><span>${formatArchive(item.month)}</span><span>${item.count}</span></a>`)
        .join("");
}

function renderHomeTags() {
    const container = document.getElementById("homeTagCloud");
    if (!container) return;

    container.innerHTML = getAllTags()
        .map((tag) => `<a class="post-tag tag-cloud-link" href="${buildFilterUrl({ tag })}">${tag}</a>`)
        .join("");
}

function renderHomeStats() {
    const container = document.getElementById("homeSiteStats");
    if (!container) return;

    const stats = getSiteStats();
    container.innerHTML = [
        `${stats.postCount} 篇文章`,
        `${stats.categoryCount} 个分类`,
        `${stats.tagCount} 个标签`,
        stats.latestDate ? `更新于 ${formatDate(stats.latestDate)}` : ""
    ]
        .filter(Boolean)
        .map((item) => `<span>${item}</span>`)
        .join("");
}

function buildPostCard(post, linkToPage = false) {
    const card = `
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

    if (linkToPage) {
        return `<a class="post-card-link" href="blog.html#${post.id}">${card}</a>`;
    }

    return card;
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

function buildFilterUrl(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });
    return `blog.html?${params.toString()}`;
}

function finishSiteLoading() {
    const loader = document.getElementById("siteLoader");
    if (!loader) return;

    window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.classList.remove("loading");
    }, 420);
}
