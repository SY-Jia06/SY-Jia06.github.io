const test = require("node:test");
const assert = require("node:assert/strict");

const {
    removeLeadingImage,
    removeLeadingTitle
} = require("../article-markdown.js");

test("removeLeadingImage removes only an image at the very beginning of the markdown", () => {
    const source = `## Section

Paragraph

![one](first.jpg)

![two](second.jpg)
`;

    assert.equal(removeLeadingImage(source), source.trimStart());
});

test("removeLeadingImage strips a true leading image before the content", () => {
    const source = `![cover](cover.jpg)

## Section

Body
`;

    assert.equal(
        removeLeadingImage(source),
        `## Section

Body
`
    );
});

test("removeLeadingTitle removes only the matching title heading", () => {
    const source = `# 我的一些思想观念的变化

## Begin

Body`;

    assert.equal(
        removeLeadingTitle(source, "我的一些思想观念的变化"),
        `## Begin

Body`
    );
});
