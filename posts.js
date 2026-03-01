// ============================================
// Posts Data - 在这里添加你的博客文章
// ============================================
// 每篇文章需要: id, title, date, tags, summary, file(md文件路径)

const POSTS = [
    {
        id: "os-concepts",
        title: "操作系统的概念、功能与目标",
        date: "2026-03-01",
        tags: ["操作系统", "OS"],
        summary: "操作系统位于用户与硬件之间，管理硬件+软件资源，向上提供方便易用的接口（GUI、命令接口、程序接口）。",
        file: "posts/OS/OS-1.md"
    },
    {
        id: "os-features",
        title: "操作系统四大特征：并发、共享、虚拟、异步",
        date: "2026-03-01",
        tags: ["操作系统", "OS"],
        summary: "并发与并行的区别、互斥共享与同时共享、时分复用与空分复用、异步的走走停停。并发是最基本的特征。",
        file: "posts/OS/OS-2.md"
    }
];

// 所有可用的标签
function getAllTags() {
    const tags = new Set();
    POSTS.forEach(post => post.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
}
