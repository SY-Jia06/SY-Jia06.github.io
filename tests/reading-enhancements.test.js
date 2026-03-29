const test = require("node:test");
const assert = require("node:assert/strict");

const {
    slugifyHeading,
    shouldShowToc,
    getAdjacentPosts,
    computeReadingProgress
} = require("../reading-enhancements.js");

test("slugifyHeading normalizes plain headings into stable ids", () => {
    assert.equal(slugifyHeading("德波说了什么"), "section-5fb7-6ce2-8bf4-4e86-4ec0-4e48");
    assert.equal(slugifyHeading("What is Spectacle?"), "what-is-spectacle");
});

test("shouldShowToc requires at least one h2 and one h3", () => {
    assert.equal(shouldShowToc([{ level: 2 }]), false);
    assert.equal(shouldShowToc([{ level: 3 }]), false);
    assert.equal(shouldShowToc([{ level: 2 }, { level: 3 }]), true);
});

test("getAdjacentPosts returns previous and next in current order", () => {
    const posts = [{ id: "essay" }, { id: "os-1" }, { id: "os-2" }];

    assert.deepEqual(getAdjacentPosts(posts, "essay"), {
        previous: null,
        next: { id: "os-1" }
    });

    assert.deepEqual(getAdjacentPosts(posts, "os-1"), {
        previous: { id: "essay" },
        next: { id: "os-2" }
    });
});

test("computeReadingProgress clamps between 0 and 1", () => {
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 50 }), 0);
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 300 }), 0.5);
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 999 }), 1);
});
