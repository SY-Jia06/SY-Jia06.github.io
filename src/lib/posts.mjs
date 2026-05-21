import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const SITE_URL = "https://syjia.pages.dev";
const ROOT = process.cwd();
const POSTS_ROOT = path.join(ROOT, "posts");
const COVER_TONES = ["teal", "amber", "slate"];

let cachedPosts;
let cachedLegacyPosts;

export function getAllPosts() {
    if (!cachedPosts) {
        cachedPosts = walkMarkdownFiles(POSTS_ROOT)
            .map((filePath, index) => buildPostRecord(filePath, index))
            .sort((a, b) => new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title, "zh-CN"));
    }
    return cachedPosts;
}

export function getPostById(id) {
    return getAllPosts().find((post) => post.id === id);
}

export function getPostUrl(post) {
    return `/blog/${post.id}/`;
}

export function getAbsolutePostUrl(post) {
    return `${SITE_URL}${getPostUrl(post)}`;
}

export function getPostOgImageUrl(post) {
    return `/og/${post.id}.png`;
}

export function getAllTags() {
    const tags = new Set();
    getAllPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
}

export function getCategoryCounts() {
    const counts = new Map();
    getAllPosts().forEach((post) => {
        counts.set(post.category, (counts.get(post.category) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export function getArchiveCounts() {
    const counts = new Map();
    getAllPosts().forEach((post) => {
        const month = post.date.slice(0, 7);
        counts.set(month, (counts.get(month) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month.localeCompare(a.month));
}

export function getSiteStats() {
    const posts = getAllPosts();
    return {
        postCount: posts.length,
        categoryCount: getCategoryCounts().length,
        tagCount: getAllTags().length,
        latestDate: posts[0]?.date || ""
    };
}

export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

export function formatArchive(value) {
    const [year, month] = value.split("-");
    return `${year} 年 ${Number(month)} 月`;
}

export function getAdjacentPosts(postId) {
    const posts = getAllPosts();
    const index = posts.findIndex((post) => post.id === postId);
    return {
        previous: posts[index - 1] || null,
        next: posts[index + 1] || null
    };
}

export async function renderPost(post) {
    const raw = fs.readFileSync(path.join(ROOT, post.file), "utf8");
    const { body } = splitFrontMatter(raw);
    const postDir = post.file.substring(0, post.file.lastIndexOf("/") + 1);
    const bodyWithoutTitle = removeLeadingTitle(removeLeadingImage(body), post.title);
    const { markdown, headings } = addHeadingIds(rewriteRelativeImages(bodyWithoutTitle, postDir));

    return {
        html: marked.parse(markdown),
        headings
    };
}

export function getPostText(post) {
    const raw = fs.readFileSync(path.join(ROOT, post.file), "utf8");
    const { body } = splitFrontMatter(raw);
    return stripMarkdown(body).replace(/\s+/g, " ").trim();
}

function walkMarkdownFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
            files.push(fullPath);
        }
    }

    return files.sort();
}

function buildPostRecord(filePath, index) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { frontMatter, body } = splitFrontMatter(raw);
    const relativePath = normalizePath(path.relative(ROOT, filePath));
    const legacy = getLegacyPostByFile(relativePath);
    const categoryFromDir = normalizeCategory(path.dirname(path.relative(POSTS_ROOT, filePath)).split(path.sep)[0] || "未分类");
    const stat = fs.statSync(filePath);

    const title = frontMatter.title || legacy?.title || extractTitle(body) || stripExtension(path.basename(filePath));
    const date = normalizeDate(frontMatter.date) || legacy?.date || formatIsoDate(stat.mtime);
    const category = firstOf(frontMatter.category, frontMatter.categories?.[0], legacy?.category, categoryFromDir);
    const tags = normalizeTags(frontMatter.tags || legacy?.tags, category, path.basename(path.dirname(filePath)));
    const summary = frontMatter.summary || legacy?.summary || extractSummary(body, title);
    const id = frontMatter.id || legacy?.id || slugify(relativePath.replace(/^posts\//, "").replace(/\.md$/i, ""));
    const coverLabel = frontMatter.coverLabel || legacy?.coverLabel || buildCoverLabel(title, category);
    const coverTone = COVER_TONES.includes(frontMatter.coverTone)
        ? frontMatter.coverTone
        : COVER_TONES.includes(legacy?.coverTone)
            ? legacy.coverTone
            : COVER_TONES[index % COVER_TONES.length];
    const coverImage = normalizeAssetUrl(frontMatter.coverImage || legacy?.coverImage || extractCoverImage(body, relativePath));

    return {
        id,
        title,
        date,
        category,
        tags,
        summary,
        coverLabel,
        coverTone,
        coverImage,
        file: relativePath
    };
}

function getLegacyPostByFile(relativePath) {
    const posts = getLegacyPosts();
    return posts.find((post) => post.file === relativePath);
}

function getLegacyPosts() {
    if (cachedLegacyPosts) return cachedLegacyPosts;

    const postsModule = path.join(ROOT, "posts.js");
    if (!fs.existsSync(postsModule)) {
        cachedLegacyPosts = [];
        return cachedLegacyPosts;
    }

    const source = fs.readFileSync(postsModule, "utf8");
    const match = source.match(/const POSTS = (\[[\s\S]*?\]);/);
    cachedLegacyPosts = match ? JSON.parse(match[1]) : [];
    return cachedLegacyPosts;
}

function splitFrontMatter(raw) {
    if (!raw.startsWith("---\n")) {
        return { frontMatter: {}, body: raw };
    }

    const endIndex = raw.indexOf("\n---\n", 4);
    if (endIndex === -1) {
        return { frontMatter: {}, body: raw };
    }

    return {
        frontMatter: parseFrontMatter(raw.slice(4, endIndex).trim()),
        body: raw.slice(endIndex + 5)
    };
}

function parseFrontMatter(text) {
    const result = {};
    let currentKey = null;

    text.split(/\r?\n/).forEach((line) => {
        if (!line.trim()) return;

        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch && currentKey) {
            if (!Array.isArray(result[currentKey])) result[currentKey] = [];
            result[currentKey].push(cleanValue(listMatch[1]));
            return;
        }

        const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!keyValueMatch) return;

        const [, key, rawValue] = keyValueMatch;
        currentKey = key;
        result[key] = rawValue.trim() ? parseValue(rawValue.trim()) : [];
    });

    return result;
}

function parseValue(value) {
    if (value.startsWith("[") && value.endsWith("]")) {
        return value.slice(1, -1).split(",").map(cleanValue).filter(Boolean);
    }
    return cleanValue(value);
}

function cleanValue(value) {
    return String(value).trim().replace(/^["']|["']$/g, "");
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
        .replace(/---+/g, " ")
        .trim();
}

function normalizeDate(value) {
    if (!value) return "";
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

function formatIsoDate(date) {
    return new Date(date).toISOString().slice(0, 10);
}

function normalizeTags(frontMatterTags, category, folderName) {
    const tags = Array.isArray(frontMatterTags)
        ? [...frontMatterTags]
        : frontMatterTags
            ? [frontMatterTags]
            : [];

    [category, normalizeCategory(folderName)].forEach((item) => {
        if (item && !tags.includes(item)) tags.push(item);
    });

    return tags.filter(Boolean);
}

function normalizeCategory(value) {
    const map = {
        OS: "操作系统",
        DB: "数据库",
        NET: "计算机网络",
        Essay: "随笔",
        Thoughts: "随想"
    };
    return map[value] || value;
}

function buildCoverLabel(title, category) {
    const source = title || category || "POST";
    const upperLatin = source.replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase();
    return upperLatin || source.slice(0, 4).toUpperCase();
}

function extractCoverImage(markdown, relativePath) {
    const match = markdown.match(/!\[[^\]]*]\(([^)]+)\)/);
    if (!match) return "";

    const src = match[1].trim();
    if (src.startsWith("http") || src.startsWith("/")) return src;

    const postDir = normalizePath(path.dirname(relativePath));
    return `/${postDir}/${src}`.replace(/\/+/g, "/");
}

function normalizeAssetUrl(value) {
    if (!value) return "";
    const url = String(value).trim();
    if (!url || url.startsWith("http") || url.startsWith("/")) return url;
    return `/${url}`.replace(/\/+/g, "/");
}

function removeLeadingImage(markdown) {
    return markdown.replace(/^\s*!\[[^\]]*]\(([^)]+)\)\s*/, "").trimStart();
}

function removeLeadingTitle(markdown, title) {
    const escapedTitle = escapeRegExp(title.trim());
    const pattern = new RegExp(`^\\s*#\\s+${escapedTitle}\\s*\\r?\\n+`, "u");
    return markdown.replace(pattern, "").trimStart();
}

function rewriteRelativeImages(markdown, postDir) {
    return markdown.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt, src) => {
        const cleanSrc = src.trim();
        if (cleanSrc.startsWith("http") || cleanSrc.startsWith("/")) return match;
        return `![${alt}](/${postDir}${cleanSrc})`;
    });
}

function addHeadingIds(markdown) {
    const seen = new Map();
    const headings = [];

    const withIds = markdown.replace(/^(#{2,3})\s+(.+)$/gm, (match, hashes, rawText) => {
        const level = hashes.length;
        const text = rawText.trim().replace(/\s+#+$/, "");
        const base = slugifyHeading(text);
        const count = seen.get(base) || 0;
        seen.set(base, count + 1);
        const id = count ? `${base}-${count + 1}` : base;
        headings.push({ id, level, text: stripMarkdown(text) });
        return `<h${level} id="${id}">${text}</h${level}>`;
    });

    return { markdown: withIds, headings };
}

function slugifyHeading(text) {
    const normalized = stripMarkdown(text).trim().toLowerCase();
    const ascii = normalized
        .replace(/[^\w\s-]/g, " ")
        .replace(/_/g, " ")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (ascii) return ascii;

    const codepoints = Array.from(normalized)
        .filter((char) => /\S/.test(char))
        .map((char) => char.codePointAt(0).toString(16));

    return codepoints.length ? `section-${codepoints.join("-")}` : "section";
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

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
