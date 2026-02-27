// ============================================
// Main Application Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTypingEffect();
    initCountAnimation();
    initBlog();
    initScrollEffects();
});

// ============================================
// Navigation
// ============================================
function initNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            // Close mobile menu
            mobileMenu.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });

    // Mobile toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });
    }
}

function navigateTo(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    // Update nav links
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageId);
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Typing Effect
// ============================================
function initTypingEffect() {
    const texts = [
        'Java 后端开发者',
        'AI Agent 探索者',
        '终身学习者',
        'System.out.println("Hello World!");',
        '把学到的东西写下来 ✍️'
    ];
    const element = document.getElementById('typingText');
    if (!element) return;

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const current = texts[textIndex];

        if (isDeleting) {
            element.textContent = current.substring(0, charIndex - 1);
            charIndex--;
        } else {
            element.textContent = current.substring(0, charIndex + 1);
            charIndex++;
        }

        let delay = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === current.length) {
            delay = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            delay = 500;
        }

        setTimeout(type, delay);
    }

    type();
}

// ============================================
// Count Animation
// ============================================
function initCountAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateCount(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    });

    counters.forEach(counter => observer.observe(counter));
}

function animateCount(element, target) {
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(eased * target);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================
// Blog
// ============================================
function initBlog() {
    renderBlogList();
    renderRecentPosts();
    renderTagFilter();
    initBackButton();
    updateStats();
}

function updateStats() {
    // Update blog count on hero
    const blogCountEl = document.querySelector('.stat-number[data-target]');
    if (blogCountEl && POSTS) {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers[0]) statNumbers[0].dataset.target = POSTS.length;
    }
}

function renderTagFilter() {
    const container = document.getElementById('tagFilter');
    if (!container) return;

    const tags = getAllTags();
    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.dataset.tag = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => filterByTag(tag, btn));
        container.appendChild(btn);
    });
}

function filterByTag(tag, activeBtn) {
    // Update active button
    document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');

    // Filter posts
    const cards = document.querySelectorAll('.blog-card');
    cards.forEach(card => {
        if (tag === 'all') {
            card.style.display = '';
        } else {
            const cardTags = card.dataset.tags.split(',');
            card.style.display = cardTags.includes(tag) ? '' : 'none';
        }
    });
}

function renderBlogList() {
    const container = document.getElementById('blogList');
    if (!container || !POSTS) return;

    if (POSTS.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="emoji">✍️</div>
                <p>还没有文章，快去写第一篇吧！</p>
            </div>
        `;
        return;
    }

    // Sort by date descending
    const sorted = [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(post => `
        <div class="blog-card" data-id="${post.id}" data-tags="${post.tags.join(',')}" onclick="openPost('${post.id}')">
            <div class="blog-card-header">
                <span class="blog-date">${formatDate(post.date)}</span>
                <div class="blog-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <h3>${post.title}</h3>
            <p>${post.summary}</p>
            <span class="blog-read-more">阅读全文 →</span>
        </div>
    `).join('');
}

function renderRecentPosts() {
    const container = document.getElementById('recentPosts');
    if (!container || !POSTS) return;

    const recent = [...POSTS]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="emoji">📝</div>
                <p>开始写博客吧，你的文章会显示在这里</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recent.map(post => `
        <div class="blog-card" onclick="navigateTo('blog'); setTimeout(() => openPost('${post.id}'), 100);">
            <div class="blog-card-header">
                <span class="blog-date">${formatDate(post.date)}</span>
                <div class="blog-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <h3>${post.title}</h3>
            <p>${post.summary}</p>
        </div>
    `).join('');
}

async function openPost(postId) {
    const post = POSTS.find(p => p.id === postId);
    if (!post) return;

    const blogList = document.getElementById('blogList');
    const tagFilter = document.getElementById('tagFilter');
    const postView = document.getElementById('postView');
    const postContent = document.getElementById('postContent');

    // Hide list, show post
    blogList.style.display = 'none';
    tagFilter.style.display = 'none';
    postView.style.display = 'block';

    // Load markdown
    try {
        const response = await fetch(post.file);
        if (!response.ok) throw new Error('Post not found');
        const markdown = await response.text();
        postContent.innerHTML = marked.parse(markdown);
    } catch (err) {
        postContent.innerHTML = `
            <h1>${post.title}</h1>
            <p style="color: var(--text-muted); margin-top: var(--space-lg);">
                📄 文章文件 <code>${post.file}</code> 还未创建。<br><br>
                创建这个 Markdown 文件，写上你的学习笔记，刷新页面就能看到了！
            </p>
        `;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (!backBtn) return;

    backBtn.addEventListener('click', () => {
        const blogList = document.getElementById('blogList');
        const tagFilter = document.getElementById('tagFilter');
        const postView = document.getElementById('postView');

        postView.style.display = 'none';
        blogList.style.display = '';
        tagFilter.style.display = '';
    });
}

// ============================================
// Scroll Effects
// ============================================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.tech-card, .project-card, .blog-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// ============================================
// Utilities
// ============================================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
