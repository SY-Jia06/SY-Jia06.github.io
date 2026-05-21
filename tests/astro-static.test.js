const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("Astro build pipeline is configured for Cloudflare Pages static output", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const astroConfig = fs.readFileSync(path.join(root, "astro.config.mjs"), "utf8");
    const wranglerConfig = fs.readFileSync(path.join(root, "wrangler.toml"), "utf8");

    assert.equal(packageJson.scripts.build, "npm run prepare:public && astro build");
    assert.match(astroConfig, /site:\s*"https:\/\/syjia\.pages\.dev"/);
    assert.match(astroConfig, /output:\s*"static"/);
    assert.match(wranglerConfig, /pages_build_output_dir\s*=\s*"\.\/dist"/);
});

test("Astro generates static article pages with SEO data and the view counter hook", () => {
    const articlePage = fs.readFileSync(path.join(root, "src", "pages", "blog", "[id].astro"), "utf8");

    assert.match(articlePage, /getStaticPaths/);
    assert.match(articlePage, /BlogPosting/);
    assert.match(articlePage, /post-view-count/);
    assert.match(articlePage, /\/api\/views\?slug=/);
});

test("machine-readable outputs exist for RSS, posts JSON, search JSON, and sitemap", () => {
    ["rss.xml.js", "posts.json.js", "search.json.js", "sitemap.xml.js"].forEach((file) => {
        assert.ok(fs.existsSync(path.join(root, "src", "pages", file)), `${file} should exist`);
    });
});

test("article pages use generated Open Graph images", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const articlePage = fs.readFileSync(path.join(root, "src", "pages", "blog", "[id].astro"), "utf8");
    const postsLib = fs.readFileSync(path.join(root, "src", "lib", "posts.mjs"), "utf8");

    assert.match(packageJson.scripts["prepare:public"], /generate-og-images\.mjs/);
    assert.ok(fs.existsSync(path.join(root, "scripts", "generate-og-images.mjs")));
    assert.match(postsLib, /getPostOgImageUrl/);
    assert.match(articlePage, /image=\{getPostOgImageUrl\(post\)\}/);
    assert.match(articlePage, /imageWidth=\{1200\}/);
    assert.match(articlePage, /imageHeight=\{630\}/);
});

test("legacy blog.html redirects old post query links to static article URLs", () => {
    const legacy = fs.readFileSync(path.join(root, "src", "legacy", "blog.html"), "utf8");
    const prepare = fs.readFileSync(path.join(root, "scripts", "prepare-public-assets.cjs"), "utf8");

    assert.match(legacy, /params\.get\("post"\)/);
    assert.match(legacy, /\/blog\/\$\{encodeURIComponent\(post\)\}\//);
    assert.match(prepare, /src", "legacy", "blog\.html"/);
});
