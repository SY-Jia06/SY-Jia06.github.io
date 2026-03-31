(function (global) {
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
        return markdown.replace(/^\s*!\[[^\]]*]\(([^)]+)\)\s*/, "").trimStart();
    }

    function stripFrontMatter(markdown) {
        return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, "");
    }

    function removeLeadingTitle(markdown, title) {
        const escapedTitle = escapeRegExp(title.trim());
        const pattern = new RegExp(`^\\s*#\\s+${escapedTitle}\\s*\\r?\\n+`, "u");
        return markdown.replace(pattern, "").trimStart();
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    const api = {
        extractFirstImage,
        removeLeadingImage,
        stripFrontMatter,
        removeLeadingTitle
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.ArticleMarkdown = api;
})(typeof window !== "undefined" ? window : globalThis);
