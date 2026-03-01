# 🚀 个人技术博客 / Personal Tech Blog

> 你的 `username.github.io` 个人名片站

## 📁 文件结构

```
blog/
├── index.html       # 主页面
├── style.css        # 样式
├── script.js        # 交互逻辑
├── posts.js         # 📌 文章列表（添加新文章改这里）
├── posts/           # 📝 文章内容（Markdown 文件）
│   └── OS/          # 操作系统笔记
│       ├── OS-1.md
│       └── OS-2.md
└── README.md        # 你正在看的这个
```

## ✍️ 如何添加新文章

### 第 1 步：写 Markdown 文件

在 `posts/` 目录下创建一个 `.md` 文件，比如 `redis-cache.md`：

```markdown
# Redis 缓存三兄弟：穿透、击穿、雪崩

> 学习日期：2026-03-02 | 标签：Redis, 缓存

## 一句话总结
...（你的内容）
```

### 第 2 步：在 posts.js 中注册

打开 `posts.js`，在 `POSTS` 数组中添加一条：

```javascript
{
    id: "redis-cache",
    title: "Redis 缓存三兄弟：穿透、击穿、雪崩",
    date: "2026-03-02",
    tags: ["Redis", "缓存"],
    summary: "面试高频题：缓存穿透、击穿、雪崩的区别和解决方案。",
    file: "posts/redis-cache.md"
}
```

### 第 3 步：刷新页面

就这样，新文章自动出现在博客列表里！
