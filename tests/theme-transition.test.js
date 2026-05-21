const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const styleCss = fs.readFileSync(path.join(root, "style.css"), "utf8");
const themeJs = fs.readFileSync(path.join(root, "theme.js"), "utf8");

test("theme changes temporarily enable scoped color transitions", () => {
    assert.match(themeJs, /classList\.add\("theme-changing"\)/);
    assert.match(themeJs, /classList\.remove\("theme-changing"\)/);
    assert.match(themeJs, /setTimeout\([^,]+,\s*260\)/);
});

test("theme transition CSS is scoped and respects reduced motion", () => {
    assert.match(styleCss, /html\.theme-changing\s+\*,/);
    assert.match(styleCss, /background-color\s+220ms\s+ease/);
    assert.match(styleCss, /border-color\s+220ms\s+ease/);
    assert.match(styleCss, /prefers-reduced-motion:\s*reduce/);
    assert.match(styleCss, /transition:\s*none\s*!important/);
});
