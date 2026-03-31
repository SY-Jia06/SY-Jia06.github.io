const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const blogHtml = fs.readFileSync(path.join(__dirname, "..", "blog.html"), "utf8");
const blogAppJs = fs.readFileSync(path.join(__dirname, "..", "blog-app.js"), "utf8");
const imageLightboxJs = fs.readFileSync(path.join(__dirname, "..", "image-lightbox.js"), "utf8");
const styleCss = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");

test("blog page includes a reusable image lightbox overlay container", () => {
    assert.match(blogHtml, /id="imageLightbox"/);
    assert.match(blogHtml, /id="imageLightboxImg"/);
});

test("blog app mounts the image lightbox after rendering article markdown", () => {
    assert.match(blogAppJs, /ImageLightbox\?\.mount\(\{\s*contentElement:\s*postContent\s*\}\)/);
});

test("image lightbox module renders zoomable image triggers and overlay styles exist", () => {
    assert.match(imageLightboxJs, /function renderZoomableImage/);
    assert.match(imageLightboxJs, /post-image-trigger/);
    assert.match(styleCss, /\.post-image-trigger/);
    assert.match(styleCss, /\.image-lightbox/);
});
