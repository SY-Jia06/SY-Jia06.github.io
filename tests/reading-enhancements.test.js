const test = require("node:test");
const assert = require("node:assert/strict");

const {
    slugifyHeading,
    shouldShowToc,
    shouldRenderDesktopSidebars,
    getAdjacentPosts,
    computeReadingProgress,
    getSubtocItems,
    getActiveHeadingFromPositions
} = require("../reading-enhancements.js");

test("slugifyHeading normalizes plain headings into stable ids", () => {
    assert.equal(slugifyHeading("德波说了什么"), "section-5fb7-6ce2-8bf4-4e86-4ec0-4e48");
    assert.equal(slugifyHeading("What is Spectacle?"), "what-is-spectacle");
});

test("shouldShowToc requires at least one h2", () => {
    assert.equal(shouldShowToc([{ level: 2 }]), true);
    assert.equal(shouldShowToc([{ level: 3 }]), false);
    assert.equal(shouldShowToc([{ level: 2 }, { level: 3 }]), true);
});

test("shouldRenderDesktopSidebars disables chapter sidebars on narrow screens", () => {
    assert.equal(shouldRenderDesktopSidebars(1200), true);
    assert.equal(shouldRenderDesktopSidebars(980), false);
    assert.equal(shouldRenderDesktopSidebars(430), false);
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

test("getSubtocItems keeps only h3 items under current h2", () => {
    const headings = [
        { id: "intro", level: 2, text: "引子" },
        { id: "intro-a", level: 3, text: "小节 A", parentId: "intro" },
        { id: "intro-b", level: 3, text: "小节 B", parentId: "intro" },
        { id: "next", level: 2, text: "下一章" },
        { id: "next-a", level: 3, text: "小节 C", parentId: "next" }
    ];

    assert.deepEqual(getSubtocItems(headings, "intro"), [
        { id: "intro-a", level: 3, text: "小节 A", parentId: "intro" },
        { id: "intro-b", level: 3, text: "小节 B", parentId: "intro" }
    ]);
});

test("getActiveHeadingFromPositions promotes a new h2 once it enters the activation band", () => {
    const headings = [
        { id: "prev-h3", level: 3, top: 40, parentId: "old-h2" },
        { id: "new-h2", level: 2, top: 220, parentId: "" }
    ];

    assert.deepEqual(getActiveHeadingFromPositions(headings, 260), headings[1]);
});
