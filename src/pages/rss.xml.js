import rss from "@astrojs/rss";
import { getAbsolutePostUrl, getAllPosts, renderPost } from "../lib/posts.mjs";

export async function GET(context) {
    const posts = getAllPosts();
    const items = await Promise.all(posts.map(async (post) => {
        const rendered = await renderPost(post);
        return {
            title: post.title,
            description: post.summary,
            pubDate: new Date(post.date),
            link: getAbsolutePostUrl(post),
            content: rendered.html
        };
    }));

    return rss({
        title: "SY-Jia06 Blog",
        description: "SY-Jia06 的技术博客与个人笔记。",
        site: context.site,
        items
    });
}
