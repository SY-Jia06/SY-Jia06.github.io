#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { formatDate, getAllPosts } from "../src/lib/posts.mjs";

const root = process.cwd();
const outputDir = path.join(root, "public", "og");
const fontDir = path.join(root, "node_modules", "@embedpdf", "fonts-sc", "fonts");
const width = 1200;
const height = 630;

const regularFont = fs.readFileSync(path.join(fontDir, "NotoSansHans-Regular.otf"));
const boldFont = fs.readFileSync(path.join(fontDir, "NotoSansHans-Bold.otf"));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const toneMap = {
    teal: {
        bg: "#0f171b",
        panel: "#173139",
        accent: "#58c4d5",
        muted: "#b8cbc8"
    },
    amber: {
        bg: "#171511",
        panel: "#3b2c18",
        accent: "#f0b35b",
        muted: "#d4c5ad"
    },
    slate: {
        bg: "#12171d",
        panel: "#202b34",
        accent: "#9fb886",
        muted: "#bdc8c2"
    }
};

for (const post of getAllPosts()) {
    const tone = toneMap[post.coverTone] || toneMap.teal;
    const svg = await satori(renderCard(post, tone), {
        width,
        height,
        fonts: [
            { name: "Noto Sans Hans", data: regularFont, weight: 400, style: "normal" },
            { name: "Noto Sans Hans", data: boldFont, weight: 700, style: "normal" }
        ]
    });
    const png = new Resvg(svg, {
        fitTo: { mode: "width", value: width }
    }).render().asPng();

    fs.writeFileSync(path.join(outputDir, `${post.id}.png`), png);
}

console.log(`Generated ${getAllPosts().length} Open Graph images in ${path.relative(root, outputDir)}`);

function renderCard(post, tone) {
    return h("div", {
        style: {
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: tone.bg,
            color: "#f4fbfb",
            fontFamily: "Noto Sans Hans",
            overflow: "hidden"
        }
    }, [
        h("div", {
            style: {
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: 260,
                left: -180,
                top: -220,
                backgroundColor: tone.accent,
                opacity: 0.18
            }
        }),
        h("div", {
            style: {
                position: "absolute",
                width: 440,
                height: 440,
                borderRadius: 220,
                right: -120,
                bottom: -160,
                backgroundColor: "#ffffff",
                opacity: 0.08
            }
        }),
        h("div", {
            style: {
                position: "absolute",
                inset: 46,
                display: "flex",
                border: "1px solid rgba(244, 251, 251, 0.14)",
                borderRadius: 32,
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                overflow: "hidden"
            }
        }, [
            h("div", {
                style: {
                    width: 770,
                    padding: "52px 58px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }
            }, [
                h("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: tone.muted,
                        fontSize: 25
                    }
                }, [
                    h("div", { style: { fontWeight: 700, letterSpacing: 2, color: "#f4fbfb" } }, "SY/J"),
                    h("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 16
                        }
                    }, [
                        pill(post.category, tone),
                        h("div", {}, formatDate(post.date))
                    ])
                ]),
                h("div", {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 24
                    }
                }, [
                    h("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            color: "#ffffff",
                            fontSize: 68,
                            fontWeight: 700,
                            lineHeight: 1.15,
                            letterSpacing: 0
                        }
                    }, splitText(post.title, 14, 2).map((line) => h("div", {}, line))),
                    h("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            color: tone.muted,
                            fontSize: 28,
                            lineHeight: 1.55
                        }
                    }, splitText(post.summary, 28, 2).map((line) => h("div", {}, line)))
                ]),
                h("div", {
                    style: {
                        color: "rgba(244, 251, 251, 0.66)",
                        fontSize: 24
                    }
                }, `syjia.pages.dev/blog/${post.id}/`)
            ]),
            h("div", {
                style: {
                    flex: 1,
                    display: "flex",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tone.panel
                }
            }, [
                h("div", {
                    style: {
                        position: "absolute",
                        inset: 30,
                        border: "1px solid rgba(244, 251, 251, 0.12)",
                        borderRadius: 26
                    }
                }),
                h("div", {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 18,
                        transform: "rotate(-8deg)"
                    }
                }, [
                    h("div", {
                        style: {
                            width: 150,
                            height: 150,
                            borderRadius: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: tone.accent,
                            color: tone.bg,
                            fontSize: 58,
                            fontWeight: 700
                        }
                    }, post.coverLabel.slice(0, 2)),
                    h("div", {
                        style: {
                            color: "rgba(244, 251, 251, 0.72)",
                            fontSize: 28,
                            letterSpacing: 3
                        }
                    }, "BLOG")
                ])
            ])
        ])
    ]);
}

function h(type, props = {}, children = []) {
    const normalizedChildren = Array.isArray(children) ? children : [children];
    const style = { ...(props.style || {}) };
    if (type === "div" && !style.display) {
        style.display = "flex";
    }

    return {
        type,
        props: {
            ...props,
            style,
            children: normalizedChildren
        }
    };
}

function pill(text, tone) {
    return h("div", {
        style: {
            display: "flex",
            alignItems: "center",
            padding: "6px 16px",
            borderRadius: 999,
            color: tone.bg,
            backgroundColor: tone.accent,
            fontSize: 22,
            fontWeight: 700
        }
    }, text);
}

function splitText(value, limit, maxLines) {
    const chars = Array.from(String(value || "").replace(/\s+/g, " ").trim());
    const lines = [];

    for (let index = 0; index < chars.length && lines.length < maxLines; index += limit) {
        lines.push(chars.slice(index, index + limit).join(""));
    }

    if (chars.length > limit * maxLines && lines.length) {
        lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。,.!?！？、\s]+$/u, "")}...`;
    }

    return lines.length ? lines : ["SY/J"];
}
