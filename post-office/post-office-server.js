const http = require("http");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const PORT = process.env.POST_OFFICE_PORT || 8788;

const ARENA_TOKEN = process.env.ARENA_TOKEN;
const SUBMISSIONS_CHANNEL_ID = Number(process.env.ARENA_SUBMISSIONS_CHANNEL_ID);
const REPLIES_CHANNEL_ID = Number(process.env.ARENA_REPLIES_CHANNEL_ID);

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === "/test" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            ok: true,
            message: "Post Office server is running.",
            hasArenaToken: Boolean(ARENA_TOKEN),
            submissionsChannel: SUBMISSIONS_CHANNEL || null,
            repliesChannel: REPLIES_CHANNEL || null
        }, null, 2));
        return;
    }

        if (req.url === "/test-arena" && req.method === "GET") {
            fetch(`https://api.are.na/v3/channels/${SUBMISSIONS_CHANNEL}`, {
                headers: {
                    "Authorization": `Bearer ${ARENA_TOKEN}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: true,
                        channelTitle: data.title,
                        channelSlug: data.slug,
                        channelId: data.id
                    }, null, 2));
                })
                .catch(error => {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: false,
                        error: error.message
                    }, null, 2));
                });

            return;
        }

        if (req.url === "/send-letter" && req.method === "POST") {
            let body = "";

            req.on("data", chunk => {
                body += chunk.toString();
            });

            req.on("end", async () => {
                try {
                    const incoming = JSON.parse(body);

                    const title = incoming.title || "Untitled letter";
                    const description = incoming.description || "";
                    const content = incoming.content || "";

                    const arenaResponse = await fetch("https://api.are.na/v3/blocks", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${ARENA_TOKEN}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            title,
                            description,
                            value: content,
                            channel_ids: [
                                SUBMISSIONS_CHANNEL_ID
                            ]
                        })
                    });

                    console.log("Sending letter to Are.na:", {
                        title,
                        channelId: SUBMISSIONS_CHANNEL_ID
                    });

                    const arenaData = await arenaResponse.json();

                    console.log("Are.na response:", arenaResponse.status, arenaData);

                    res.writeHead(arenaResponse.ok ? 200 : arenaResponse.status, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        ok: arenaResponse.ok,
                        blockId: arenaData.id || null,
                        title,
                        arena: arenaData
                    }, null, 2));
                } catch (error) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: false,
                        error: error.message
                    }, null, 2));
                }
            });

            return;
        }

        if (req.url === "/test-send" && req.method === "GET") {
            fetch("https://api.are.na/v3/blocks", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ARENA_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    value: [
                        "# Test Letter",
                        "",
                        "This is a test letter created from the Post Office server.",
                        "",
                        `Created: ${new Date().toISOString()}`
                    ].join("\n"),
                    channel_ids: [
                        SUBMISSIONS_CHANNEL_ID
                    ]
                })
            })
            .then(response => response.json())
            .then(data => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    ok: true,
                    arenaResponse: data
                }, null, 2));
            })
            .catch(error => {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    ok: false,
                    error: error.message
                }, null, 2));
            });

            return;
        }

        if (req.url === "/letters" && req.method === "GET") {
            fetch(`https://api.are.na/v3/channels/${SUBMISSIONS_CHANNEL_ID}/contents?sort=created_at_desc&per=50`, {
                headers: {
                    "Authorization": `Bearer ${ARENA_TOKEN}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    res.writeHead(200, { "Content-Type": "application/json" });

                    res.end(JSON.stringify({
                        ok: true,
                        letters: data.contents || data.data || []
                    }, null, 2));
                })
                .catch(error => {
                    res.writeHead(500, { "Content-Type": "application/json" });

                    res.end(JSON.stringify({
                        ok: false,
                        error: error.message
                    }, null, 2));
                });

            return;
        }

        if (req.url === "/test-replies-channel" && req.method === "GET") {
            fetch(`https://api.are.na/v3/channels/${REPLIES_CHANNEL}`, {
                headers: {
                    "Authorization": `Bearer ${ARENA_TOKEN}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: true,
                        channelTitle: data.title,
                        channelSlug: data.slug,
                        channelId: data.id
                    }, null, 2));
                });

            return;
        }

        if (req.url === "/send-response" && req.method === "POST") {
            let body = "";

            req.on("data", chunk => {
                body += chunk.toString();
            });

            req.on("end", async () => {
                try {
                    const incoming = JSON.parse(body);

                    const letterId = incoming.letterId;
                    const letterTitle = incoming.letterTitle || "Untitled letter";
                    const letterContent = incoming.letterContent || "";
                    const responseContent = incoming.responseContent || "";

                    if (!letterId || !responseContent) {
                        throw new Error("Missing letterId or responseContent.");
                    }

                    const correspondenceText = [
                        `## Original Message`,
                        "",
                        letterContent,
                        "",
                        "---",
                        "",
                        `## Response`,
                        "",
                        responseContent
                    ].join("\n");

                    const arenaResponse = await fetch("https://api.are.na/v3/blocks", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${ARENA_TOKEN}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            title: `Re: ${letterTitle}`,
                            description: `Response to letter block ${letterId}`,
                            value: correspondenceText,
                            channel_ids: [
                                REPLIES_CHANNEL_ID
                            ]
                        })
                    });

                    const arenaData = await arenaResponse.json();

                    res.writeHead(arenaResponse.ok ? 200 : arenaResponse.status, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        ok: arenaResponse.ok,
                        blockId: arenaData.id || null,
                        arena: arenaData
                    }, null, 2));
                } catch (error) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: false,
                        error: error.message
                    }, null, 2));
                }
            });

            return;
        }

        if (req.url === "/correspondence" && req.method === "GET") {
            fetch(`https://api.are.na/v3/channels/${REPLIES_CHANNEL_ID}/contents?sort=created_at_desc&per=50`, {
                headers: {
                    "Authorization": `Bearer ${ARENA_TOKEN}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: true,
                        correspondence: data.contents || data.data || []
                    }, null, 2));
                })
                .catch(error => {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        ok: false,
                        error: error.message
                    }, null, 2));
                });

            return;
        }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Route not found." }));
});

server.listen(PORT, () => {
    console.log(`Post Office server running at http://localhost:${PORT}`);
});