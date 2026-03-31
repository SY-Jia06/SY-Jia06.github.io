// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run: node scripts/generate-posts.js

const POSTS = [
    {
        "id": "essay-belief-shifts",
        "title": "我的一些思想观念的变化",
        "date": "2026-03-31",
        "category": "随笔",
        "tags": [
            "成长",
            "自我觉察",
            "思考",
            "随笔"
        ],
        "summary": "回看这些年思想观念的几次转向，我越来越相信，所谓成长不是线性进步，而是在丢弃、得到、觉察和重建之间，慢慢找到自己的心。",
        "coverLabel": "观念变化",
        "coverTone": "slate",
        "coverImage": "posts/Essay/belief-shifts-1.jpg",
        "file": "posts/Essay/belief-shifts.md"
    },
    {
        "id": "essay-spectacle-society",
        "title": "景观社会：当我们用「看」替代「活」",
        "date": "2026-03-28",
        "category": "随笔",
        "tags": [
            "阅读",
            "社会观察",
            "景观社会",
            "随笔"
        ],
        "summary": "德波提醒我们的，不只是景观如何塑造世界，更是我们会如何在不知不觉中用“看”替代理解，用判断替代生活。",
        "coverLabel": "景观社会",
        "coverTone": "slate",
        "coverImage": "posts/Essay/spectacle-cover.png",
        "file": "posts/Essay/spectacle-society.md"
    },
    {
        "id": "os-os-1",
        "title": "操作系统的概念",
        "date": "2026-03-03",
        "category": "操作系统",
        "tags": [
            "操作系统"
        ],
        "summary": "简单而言，操作系统在用户和硬件之间提供了一个接口，位于硬件之上，用户、应用程序之下。",
        "coverLabel": "操作系统",
        "coverTone": "slate",
        "coverImage": "posts/OS/image-1.png",
        "file": "posts/OS/OS-1.md"
    },
    {
        "id": "os-os-2",
        "title": "操作系统的四大特征",
        "date": "2026-03-01",
        "category": "操作系统",
        "tags": [
            "操作系统"
        ],
        "summary": "并发 共享 虚拟 异步 — 这四个特征是操作系统区别于普通软件的根本标志。",
        "coverLabel": "操作系统",
        "coverTone": "teal",
        "coverImage": "posts/OS/image-4.png",
        "file": "posts/OS/OS-2.md"
    }
];

function sortPostsByDate(posts = POSTS) {
    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAllTags() {
    const tags = new Set();
    POSTS.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
}

function getCategoryCounts() {
    const counts = new Map();
    POSTS.forEach((post) => {
        counts.set(post.category, (counts.get(post.category) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function getArchiveCounts() {
    const counts = new Map();
    POSTS.forEach((post) => {
        const key = post.date.slice(0, 7);
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month.localeCompare(a.month));
}

function getSiteStats() {
    return {
        postCount: POSTS.length,
        categoryCount: getCategoryCounts().length,
        tagCount: getAllTags().length,
        latestDate: sortPostsByDate()[0]?.date || ""
    };
}
