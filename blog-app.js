// ============================================
// Blog Page Application Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initBlog();
    initScrollEffects();
});

// ============================================
// Mobile Navigation
// ============================================
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });
    }
}

// ============================================
// Blog
// ============================================
function initBlog() {
    renderTagFilter();
    renderBlogList();
    initBackButton();

    // Check URL hash for direct post link
    const hash = window.location.hash.slice(1);
    if (hash) {
        openPost(hash);
    }
}

function renderTagFilter() {
    const container = document.getElementById('tagFilter');
    if (!container) return;

    const tags = getAllTags();

    // "全部" button
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-btn active';
    allBtn.dataset.tag = 'all';
    allBtn.textContent = '全部';
    allBtn.addEventListener('click', () => filterByTag('all', allBtn));
    container.appendChild(allBtn);

    // Individual tag buttons
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

async function openPost(postId) {
    const post = POSTS.find(p => p.id === postId);
    if (!post) return;

    const blogList = document.getElementById('blogList');
    const tagFilter = document.getElementById('tagFilter');
    const postView = document.getElementById('postView');
    const postContent = document.getElementById('postContent');
    const pageHeader = document.querySelector('.page-header');

    // Hide list, show post
    blogList.style.display = 'none';
    tagFilter.style.display = 'none';
    if (pageHeader) pageHeader.style.display = 'none';
    postView.style.display = 'block';

    // Update URL hash
    window.location.hash = postId;

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
        const pageHeader = document.querySelector('.page-header');

        postView.style.display = 'none';
        blogList.style.display = '';
        tagFilter.style.display = '';
        if (pageHeader) pageHeader.style.display = '';

        // Clear hash
        history.pushState('', document.title, window.location.pathname);
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

    // Intersection Observer for fade-in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.blog-card').forEach(el => {
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
