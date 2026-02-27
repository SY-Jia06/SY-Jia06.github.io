// ============================================
// Posts Data - 在这里添加你的博客文章
// ============================================
// 每篇文章需要: id, title, date, tags, summary, file(md文件路径)

const POSTS = [
    {
        id: "java-collections",
        title: "Java 集合框架全景图：List、Map、Set 一网打尽",
        date: "2026-02-27",
        tags: ["Java SE", "集合框架"],
        summary: "从 ArrayList 到 HashMap，理解 Java 集合框架的设计哲学和底层实现。面试必问：HashMap 扩容机制、ConcurrentHashMap 分段锁。",
        file: "posts/java-collections.md"
    },
    {
        id: "mysql-index",
        title: "MySQL 索引原理：为什么是 B+ 树而不是 B 树？",
        date: "2026-02-28",
        tags: ["MySQL", "数据库"],
        summary: "从磁盘 I/O 的角度理解 B+ 树索引的设计，聊聊聚簇索引和非聚簇索引的区别，以及如何写出利用索引的 SQL。",
        file: "posts/mysql-index.md"
    }
];

// 所有可用的标签
function getAllTags() {
    const tags = new Set();
    POSTS.forEach(post => post.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
}
