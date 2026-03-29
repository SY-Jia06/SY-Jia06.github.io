const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const blogHtml = fs.readFileSync(path.join(__dirname, "..", "blog.html"), "utf8");
const styleCss = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const blogAppJs = fs.readFileSync(path.join(__dirname, "..", "blog-app.js"), "utf8");

test("blog list page groups filter header and post list inside one list shell", () => {
    assert.match(
        blogHtml,
        /<section class="blog-list-shell"[^>]*>[\s\S]*<div class="panel filter-panel" id="listPanel">[\s\S]*<div class="blog-list" id="blogList"><\/div>[\s\S]*<\/section>/
    );
});

test("blog list shell styles tighten the filter area and connect it to the list", () => {
    assert.match(styleCss, /\.blog-list-shell\s*\{/);
    assert.match(styleCss, /\.blog-list-shell\s+\.filter-panel\s*\{/);
    assert.match(styleCss, /\.blog-list-shell\s+\.blog-list\s*\{/);
});

test("opening a post hides the outer blog list shell instead of leaving an empty bar", () => {
    assert.match(blogHtml, /id="blogListShell"/);
    assert.match(blogAppJs, /document\.getElementById\("blogListShell"\)/);
});

test("reading mode keeps top spacing for the fixed navbar", () => {
    assert.match(
        styleCss,
        /\.blog-page-grid\.reading-mode\s*\{[\s\S]*padding-top:\s*calc\(var\(--nav-height\)\s*\+\s*18px\);[\s\S]*\}/
    );
});

test("project showcase uses symmetric desktop columns", () => {
    assert.match(
        styleCss,
        /\.project-showcase\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*\}/
    );
});
