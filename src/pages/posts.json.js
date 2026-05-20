import { getAbsolutePostUrl, getAllPosts, getPostText } from "../lib/posts.mjs";

export function GET() {
    const posts = getAllPosts().map((post) => ({
        id: post.id,
        title: post.title,
        date: post.date,
        category: post.category,
        tags: post.tags,
        summary: post.summary,
        url: getAbsolutePostUrl(post),
        text: getPostText(post)
    }));

    return new Response(JSON.stringify({ posts }, null, 2), {
        headers: {
            "content-type": "application/json; charset=utf-8"
        }
    });
}
