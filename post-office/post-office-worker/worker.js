const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS
            });
        }

        try {
            if (url.pathname === "/test" && request.method === "GET") {
                return jsonResponse({
                    ok: true,
                    message: "Post Office Worker is running.",
                    hasArenaToken: Boolean(env.ARENA_TOKEN),
                    submissionsChannelId: env.ARENA_SUBMISSIONS_CHANNEL_ID,
                    repliesChannelId: env.ARENA_REPLIES_CHANNEL_ID
                });
            }

            if (url.pathname === "/send-letter" && request.method === "POST") {
                const incoming = await request.json();

                const title = incoming.title || "Untitled letter";
                const description = incoming.description || "";
                const content = incoming.content || "";

                if (!content.trim()) {
                    return jsonResponse({
                        ok: false,
                        error: "Letter content is required."
                    }, 400);
                }

                const arenaResponse = await fetch("https://api.are.na/v3/blocks", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${env.ARENA_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        value: content,
                        channel_ids: [
                            Number(env.ARENA_SUBMISSIONS_CHANNEL_ID)
                        ]
                    })
                });

                const arenaData = await arenaResponse.json();

                return jsonResponse({
                    ok: arenaResponse.ok,
                    blockId: arenaData.id || null,
                    arena: arenaData
                }, arenaResponse.ok ? 200 : arenaResponse.status);
            }

            if (url.pathname === "/letters" && request.method === "GET") {
                const arenaResponse = await fetch(
                    `https://api.are.na/v3/channels/${env.ARENA_SUBMISSIONS_CHANNEL_ID}/contents?sort=created_at_desc&per=50`,
                    {
                        headers: {
                            "Authorization": `Bearer ${env.ARENA_TOKEN}`
                        }
                    }
                );

                const arenaData = await arenaResponse.json();

                return jsonResponse({
                    ok: arenaResponse.ok,
                    letters: arenaData.contents || arenaData.data || [],
                    arena: arenaData
                }, arenaResponse.ok ? 200 : arenaResponse.status);
            }

            if (url.pathname === "/send-response" && request.method === "POST") {
                const incoming = await request.json();

                const letterId = incoming.letterId;
                const letterTitle = incoming.letterTitle || "Untitled letter";
                const letterContent = incoming.letterContent || "";
                const responseContent = incoming.responseContent || "";

                if (!letterId || !responseContent.trim()) {
                    return jsonResponse({
                        ok: false,
                        error: "Missing letterId or responseContent."
                    }, 400);
                }

                const correspondenceText = [
                    "## Original Message",
                    "",
                    letterContent,
                    "",
                    "---",
                    "",
                    "## Response",
                    "",
                    responseContent
                ].join("\n");

                const arenaResponse = await fetch("https://api.are.na/v3/blocks", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${env.ARENA_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: `Re: ${letterTitle}`,
                        description: `Response to letter block ${letterId}`,
                        value: correspondenceText,
                        channel_ids: [
                            Number(env.ARENA_REPLIES_CHANNEL_ID)
                        ]
                    })
                });

                const arenaData = await arenaResponse.json();

                return jsonResponse({
                    ok: arenaResponse.ok,
                    blockId: arenaData.id || null,
                    arena: arenaData
                }, arenaResponse.ok ? 200 : arenaResponse.status);
            }

            if (url.pathname === "/correspondence" && request.method === "GET") {
                const arenaResponse = await fetch(
                    `https://api.are.na/v3/channels/${env.ARENA_REPLIES_CHANNEL_ID}/contents?sort=created_at_desc&per=50`,
                    {
                        headers: {
                            "Authorization": `Bearer ${env.ARENA_TOKEN}`
                        }
                    }
                );

                const arenaData = await arenaResponse.json();

                return jsonResponse({
                    ok: arenaResponse.ok,
                    correspondence: arenaData.contents || arenaData.data || [],
                    arena: arenaData
                }, arenaResponse.ok ? 200 : arenaResponse.status);
            }

            return jsonResponse({
                ok: false,
                error: "Route not found."
            }, 404);
        } catch (error) {
            return jsonResponse({
                ok: false,
                error: error.message
            }, 500);
        }
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json"
        }
    });
}