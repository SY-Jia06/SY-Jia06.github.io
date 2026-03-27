#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const BLOG_ROOT = path.resolve(__dirname, "..");
const POSTS_ROOT = path.join(BLOG_ROOT, "posts");
const POSTS_OUTPUT = path.join(BLOG_ROOT, "posts.js");
const SEARCH_OUTPUT = path.join(BLOG_ROOT, "search.json");

const COVER_TONES = ["teal", "amber", "slate"];

main();

function main() {
    const markdownFiles = walkMarkdownFiles(POSTS_ROOT);
    const posts = markdownFiles.map((filePath, index) => buildPostRecord(filePath, index));
    posts.sort((a, b) => new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title, "zh-CN"));

    fs.writeFileSync(POSTS_OUTPUT, buildPostsModule(posts), "utf8");
    fs.writeFileSync(SEARCH_OUTPUT, JSON.stringify(buildSearchIndex(posts), null, 2), "utf8");

    console.log(`Generated ${path.relative(process.cwd(), POSTS_OUTPUT)} with ${posts.length} posts.`);
    console.log(`Generated ${path.relative(process.cwd(), SEARCH_OUTPUT)}.`);
}

function walkMarkdownFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];

    entries.forEach((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkMarkdownFiles(fullPath));
            return;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
            files.push(fullPath);
        }
    });

    return files.sort();
}

function buildPostRecord(filePath, index) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { frontMatter, body } = splitFrontMatter(raw);
    const relativePath = normalizePath(path.relative(BLOG_ROOT, filePath));
    const categoryFromDir = normalizeCategory(path.dirname(path.relative(POSTS_ROOT, filePath)).split(path.sep)[0] || "未分类");
    const stat = fs.statSync(filePath);

    const title = frontMatter.title || extractTitle(body) || stripExtension(path.basename(filePath));
    const date = normalizeDate(frontMatter.date) || formatDate(stat.mtime);
    const category = firstOf(frontMatter.category, frontMatter.categories?.[0], categoryFromDir);
    const tags = normalizeTags(frontMatter.tags, category, path.basename(path.dirname(filePath)));
    const summary = frontMatter.summary || extractSummary(body, title);
    const id = frontMatter.id || slugify(relativePath.replace(/^posts\//, "").replace(/\.md$/i, ""));
    const coverLabel = frontMatter.coverLabel || buildCoverLabel(title, category);
    const coverTone = normalizeCoverTone(frontMatter.coverTone, index);

    return {
        id,
        title,
        date,
        category,
        tags,
        summary,
        coverLabel,
        coverTone,
        file: relativePath
    };
}

function splitFrontMatter(raw) {
    if (!raw.startsWith("---\n")) {
        return { frontMatter: {}, body: raw };
    }

    const endIndex = raw.indexOf("\n---\n", 4);
    if (endIndex === -1) {
        return { frontMatter: {}, body: raw };
    }

    const matterText = raw.slice(4, endIndex).trim();
    const body = raw.slice(endIndex + 5);
    return {
        frontMatter: parseFrontMatter(matterText),
        body
    };
}

function parseFrontMatter(text) {
    const result = {};
    let currentKey = null;

    text.split(/\r?\n/).forEach((line) => {
        if (!line.trim()) return;

        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch && currentKey) {
            if (!Array.isArray(result[currentKey])) {
                result[currentKey] = [];
            }
            result[currentKey].push(cleanValue(listMatch[1]));
            return;
        }

        const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!keyValueMatch) return;

        const [, key, rawValue] = keyValueMatch;
        currentKey = key;

        if (!rawValue.trim()) {
            result[key] = [];
            return;
        }

        result[key] = parseValue(rawValue.trim());
    });

    return result;
}

function parseValue(value) {
    if (value.startsWith("[") && value.endsWith("]")) {
        return value
            .slice(1, -1)
            .split(",")
            .map((item) => cleanValue(item))
            .filter(Boolean);
    }

    return cleanValue(value);
}

function cleanValue(value) {
    return value.trim().replace(/^["']|["']$/g, "");
}

function extractTitle(markdown) {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "";
}

function extractSummary(markdown, title) {
    const lines = markdown
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith("#"))
        .filter((line) => !line.startsWith("![")) 
        .filter((line) => !line.startsWith(">"))
        .filter((line) => !line.startsWith("```"))
        .filter((line) => line !== "---");

    const candidate = lines.find((line) => {
        const plain = stripMarkdown(line);
        return plain && plain !== title;
    }) || "持续补充中。";

    const summary = stripMarkdown(candidate).replace(/\s+/g, " ");
    return summary.length > 88 ? `${summary.slice(0, 88)}...` : summary;
}

function stripMarkdown(text) {
    return text
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/!\[[^\]]*]\([^)]+\)/g, "")
        .replace(/\[[^\]]+]\([^)]+\)/g, "$1")
        .replace(/^>\s*/g, "")
        .replace(/\|/g, " ")
        .replace(/#+\s*/g, "")
        .trim();
}

function normalizeDate(value) {
    if (!value) return "";
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

function formatDate(date) {
    return new Date(date).toISOString().slice(0, 10);
}

function normalizeTags(frontMatterTags, category, folderName) {
    const tags = Array.isArray(frontMatterTags)
        ? frontMatterTags
        : frontMatterTags
            ? [frontMatterTags]
            : [];

    [category, normalizeCategory(folderName)].forEach((item) => {
        if (item && !tags.includes(item)) {
            tags.push(item);
        }
    });

    return tags.filter(Boolean);
}

function normalizeCategory(value) {
    const map = {
        OS: "操作系统",
        DB: "数据库",
        NET: "计算机网络"
    };

    return map[value] || value;
}

function buildCoverLabel(title, category) {
    const source = title || category || "POST";
    const upperLatin = source.replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase();
    if (upperLatin) return upperLatin;
    return source.slice(0, 4).toUpperCase();
}

function normalizeCoverTone(value, index) {
    if (COVER_TONES.includes(value)) {
        return value;
    }
    return COVER_TONES[index % COVER_TONES.length];
}

function slugify(value) {
    return value
        .replace(/[\\/]+/g, "-")
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
}

function stripExtension(fileName) {
    return fileName.replace(/\.[^.]+$/, "");
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function firstOf(...values) {
    return values.find((value) => value && String(value).trim());
}

function buildPostsModule(posts) {
    return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n// Run: node scripts/generate-posts.js\n\nconst POSTS = ${JSON.stringify(posts, null, 4)};\n\nfunction sortPostsByDate(posts = POSTS) {\n    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));\n}\n\nfunction getAllTags() {\n    const tags = new Set();\n    POSTS.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));\n    return Array.from(tags);\n}\n\nfunction getCategoryCounts() {\n    const counts = new Map();\n    POSTS.forEach((post) => {\n        counts.set(post.category, (counts.get(post.category) || 0) + 1);\n    });\n    return Array.from(counts.entries())\n        .map(([name, count]) => ({ name, count }))\n        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));\n}\n\nfunction getArchiveCounts() {\n    const counts = new Map();\n    POSTS.forEach((post) => {\n        const key = post.date.slice(0, 7);\n        counts.set(key, (counts.get(key) || 0) + 1);\n    });\n    return Array.from(counts.entries())\n        .map(([month, count]) => ({ month, count }))\n        .sort((a, b) => b.month.localeCompare(a.month));\n}\n\nfunction getSiteStats() {\n    return {\n        postCount: POSTS.length,\n        categoryCount: getCategoryCounts().length,\n        tagCount: getAllTags().length,\n        latestDate: sortPostsByDate()[0]?.date || \"\"\n    };\n}\n`;
}

function buildSearchIndex(posts) {
    return posts.map((post) => {
        const fullPath = path.join(BLOG_ROOT, post.file);
        const raw = fs.readFileSync(fullPath, "utf8");
        const { body } = splitFrontMatter(raw);
        return {
            id: post.id,
            title: post.title,
            url: `blog.html#${post.id}`,
            category: post.category,
            tags: post.tags,
            content: stripMarkdown(body).replace(/\s+/g, " ").trim()
        };
    });
}
