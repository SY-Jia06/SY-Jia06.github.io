const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("Pages Function exposes a KV-backed article view counter endpoint", () => {
    const functionPath = path.join(root, "functions", "api", "views.js");
    assert.ok(fs.existsSync(functionPath), "functions/api/views.js should exist");

    const source = fs.readFileSync(functionPath, "utf8");
    assert.match(source, /export\s+async\s+function\s+onRequestGet/);
    assert.match(source, /env\.VIEWS/);
    assert.match(source, /searchParams\.get\(["']slug["']\)/);
});

test("blog article page requests and renders the view count for the active post", () => {
    const blogAppJs = fs.readFileSync(path.join(root, "blog-app.js"), "utf8");
    const astroArticle = fs.readFileSync(path.join(root, "src", "pages", "blog", "[id].astro"), "utf8");
    const styleCss = fs.readFileSync(path.join(root, "style.css"), "utf8");

    assert.match(blogAppJs, /fetchPostViews\(post\.id\)/);
    assert.match(astroArticle, /post-view-count/);
    assert.match(astroArticle, /\/api\/views\?slug=/);
    assert.match(blogAppJs, /post-view-count/);
    assert.match(styleCss, /\.post-view-count\s*\{/);
});
