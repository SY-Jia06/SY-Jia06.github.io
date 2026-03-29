(function () {
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
        if (!navbar) return;

        window.addEventListener("scroll", () => {
            navbar.classList.toggle("scrolled", window.scrollY > 20);
        });
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

    function buildFilterUrl(filters, basePath = "blog.html") {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const query = params.toString();
        return `${basePath}${query ? `?${query}` : ""}`;
    }

    function buildPostUrl(postId, basePath = "blog.html") {
        return buildFilterUrl({ post: postId }, basePath);
    }

    window.BlogShared = {
        initMobileNav,
        initScrollEffects,
        formatDate,
        formatArchive,
        buildFilterUrl,
        buildPostUrl
    };
})();
