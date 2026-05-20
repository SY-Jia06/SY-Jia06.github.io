import { getAbsolutePostUrl, getAllPosts } from "../lib/posts.mjs";

const SITE_URL = "https://sy-jia06.github.io";

export function GET() {
    const staticUrls = ["/", "/blog/", "/projects/", "/about/"].map((path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`);

    const postUrls = getAllPosts().map((post) => `  <url>
    <loc>${getAbsolutePostUrl(post)}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);

    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join("\n")}
</urlset>`, {
        headers: {
            "content-type": "application/xml; charset=utf-8"
        }
    });
}
