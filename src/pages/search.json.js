import { getAllPosts, getPostText, getPostUrl } from "../lib/posts.mjs";

export function GET() {
    const search = getAllPosts().map((post) => ({
        id: post.id,
        title: post.title,
        url: getPostUrl(post),
        category: post.category,
        tags: post.tags,
        content: getPostText(post)
    }));

    return new Response(JSON.stringify(search, null, 2), {
        headers: {
            "content-type": "application/json; charset=utf-8"
        }
    });
}
