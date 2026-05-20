#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

const directories = ["assets", "posts"];
const files = [
    "style.css",
    "theme.js",
    "shared.js",
    "simple-page.js",
    "image-lightbox.js",
    "animations.js"
];

fs.mkdirSync(publicDir, { recursive: true });

for (const dir of directories) {
    const source = path.join(root, dir);
    const target = path.join(publicDir, dir);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, {
        recursive: true,
        filter: (filePath) => !filePath.endsWith(".DS_Store")
    });
}

for (const file of files) {
    fs.copyFileSync(path.join(root, file), path.join(publicDir, file));
}

fs.copyFileSync(path.join(root, "src", "legacy", "blog.html"), path.join(publicDir, "blog.html"));

console.log(`Prepared public assets in ${path.relative(root, publicDir)}`);
