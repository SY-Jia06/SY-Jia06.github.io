# Reading Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add article reading progress, in-article table of contents, and previous/next navigation to the existing single-page blog reading view.

**Architecture:** Introduce a focused `reading-enhancements.js` module that owns reading-only UI and lifecycle. Keep `blog-app.js` responsible for article loading and rendering, then call the new module after markdown has been rendered and on teardown when leaving the post view.

**Tech Stack:** Vanilla JavaScript, DOM APIs, existing static blog structure, Node built-in test runner

---

### Task 1: Add testable reading helper coverage

**Files:**
- Create: `tests/reading-enhancements.test.js`
- Modify: `reading-enhancements.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
    slugifyHeading,
    shouldShowToc,
    getAdjacentPosts,
    computeReadingProgress
} = require("../reading-enhancements.js");

test("slugifyHeading normalizes Chinese and punctuation safely", () => {
    assert.equal(slugifyHeading("德波说了什么"), "section-de-bo-shuo-liao-shen-me");
});

test("shouldShowToc requires at least one h2 and one h3", () => {
    assert.equal(shouldShowToc([{ level: 2 }]), false);
    assert.equal(shouldShowToc([{ level: 2 }, { level: 3 }]), true);
});

test("getAdjacentPosts follows sorted post order", () => {
    const posts = [{ id: "b" }, { id: "a" }, { id: "c" }];
    assert.deepEqual(getAdjacentPosts(posts, "a"), {
        previous: { id: "b" },
        next: { id: "c" }
    });
});

test("computeReadingProgress clamps to 0-1", () => {
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 0 }), 0);
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 300 }), 0.5);
    assert.equal(computeReadingProgress({ start: 100, end: 500, scrollY: 999 }), 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/reading-enhancements.test.js`
Expected: FAIL because `reading-enhancements.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create `reading-enhancements.js` with the tested helper exports first, then stub browser mount/unmount hooks around them.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/reading-enhancements.test.js`
Expected: PASS

### Task 2: Mount reading enhancements into article view

**Files:**
- Modify: `blog.html`
- Modify: `blog-app.js`
- Modify: `reading-enhancements.js`

- [ ] **Step 1: Add reading UI mount points**

Add progress bar container, TOC container, and pagination container in the post view markup.

- [ ] **Step 2: Wire reading enhancement lifecycle**

Call `window.ReadingEnhancements.mount({ post, posts: sortPostsByDate(), contentElement })` after markdown render.

- [ ] **Step 3: Clean up on post exit**

Call `window.ReadingEnhancements.unmount()` when closing the post view and before remounting another post.

- [ ] **Step 4: Verify manually**

Run: local preview and open a post
Expected: No console errors, existing reading view still opens

### Task 3: Finish reading UX styling

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Style progress bar**

Keep it thin, fixed, and visually aligned with the current theme tokens.

- [ ] **Step 2: Style TOC card**

Make it a compact card above the article body with active item highlighting.

- [ ] **Step 3: Style previous/next navigation**

Use card-like links at the article bottom, stacked vertically on mobile.

- [ ] **Step 4: Verify manually**

Run: local preview on desktop width and narrow width
Expected: TOC and pagination remain readable without layout breakage

### Task 4: Final verification

**Files:**
- Test: `tests/reading-enhancements.test.js`
- Test: `blog-app.js`
- Test: `reading-enhancements.js`
- Test: `style.css`

- [ ] **Step 1: Run automated checks**

Run:

```bash
node --test tests/reading-enhancements.test.js
node --check blog-app.js
node --check reading-enhancements.js
node --check theme.js
```

Expected: all commands pass

- [ ] **Step 2: Run manual reading checks**

Verify:
- long article shows progress bar
- article with `h2` and `h3` shows TOC
- TOC click scrolls correctly
- current section highlights while scrolling
- previous / next links match list ordering
- leaving article removes reading-only UI state

- [ ] **Step 3: Commit**

Use a Lore-format commit message describing why article reading needed a stronger navigation layer.
