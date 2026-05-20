const SLUG_PATTERN = /^[a-zA-Z0-9\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5._-]{0,119}$/u;

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const slug = normalizeSlug(url.searchParams.get("slug"));

    if (!slug) {
        return jsonResponse({ error: "Missing or invalid slug" }, 400);
    }

    if (!env.VIEWS) {
        return jsonResponse({ error: "KV binding VIEWS is not configured" }, 500);
    }

    const key = `post:${slug}`;
    const current = Number(await env.VIEWS.get(key)) || 0;
    const next = current + 1;

    await env.VIEWS.put(key, String(next));

    return jsonResponse({ slug, count: next });
}

function normalizeSlug(value) {
    const slug = String(value || "").trim();
    return SLUG_PATTERN.test(slug) ? slug : "";
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
        }
    });
}
