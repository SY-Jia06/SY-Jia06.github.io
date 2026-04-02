

const {
    initMobileNav,
    initScrollEffects,
    formatDate,
    formatArchive,
    buildFilterUrl,
    buildPostUrl
} = window.BlogShared;

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initScrollEffects();
    initBannerToggle();
    renderHomePage();
    restorePageFromHash();
    finishSiteLoading();
});

function initBannerToggle() {
    const banner = document.querySelector(".home-banner");
    if (!banner) return;
    
    const backgrounds = [
        "assets/banner.png",
        "assets/home-bg.png"
    ];
    
    let currentIndex = Math.random() > 0.5 ? 0 : 1;
    banner.style.backgroundImage = `url("${backgrounds[currentIndex]}")`;
    banner.style.cursor = "pointer";
    
    banner.addEventListener("click", (e) => {
        // Prevent toggle if clicking on buttons or links inside the banner
        if (e.target.closest('button, a')) return;
        
        currentIndex = (currentIndex + 1) % backgrounds.length;
        banner.style.backgroundImage = `url("${backgrounds[currentIndex]}")`;
    });
}

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

    container.querySelectorAll("[data-post-url]").forEach((card) => {
        const openCard = () => {
            window.location.href = card.dataset.postUrl;
        };

        card.addEventListener("click", (event) => {
            if (event.target.closest("a")) return;
            openCard();
        });

        card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            openCard();
        });
    });
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
    const coverStyle = post.coverImage
        ? ` style="--cover-image: url('${post.coverImage}');"`
        : "";
    const imageClass = post.coverImage ? " has-image" : "";
    const card = `
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

    if (linkToPage) {
        return `
            <article class="post-card-link post-card-link-home" data-post-url="${buildPostUrl(post.id)}" tabindex="0" role="link" aria-label="打开文章：${post.title}">
                ${card}
            </article>
        `;
    }

    return card;
}


