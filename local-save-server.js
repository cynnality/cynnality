const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8787;

const SAVE_TARGETS = {
    overseasLeagues: path.join(
        __dirname,
        "basketball_101_data_files",
        "overseas_leagues_data.json"
    ),

    overseasTeams: path.join(
        __dirname,
        "basketball_101_data_files",
        "overseas_teams_data.json"
    ),

    unrivaledTeams: path.join(
        __dirname,
        "basketball_101_data_files",
        "unrivaled_teams_data.json"
    ),
    players: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_olympic_players_v2.json"
    ),
    wnbaTeams: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_static_data_v2.json"
    )
};

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });

    res.end(JSON.stringify(data));
}

function saveByKey({ res, incomingData, filePath, topLevelKey, idField }) {
    const itemId = incomingData[idField];

    if (!itemId) {
        sendJson(res, 400, {
            ok: false,
            error: `Missing ${idField}`
        });
        return;
    }

    let existingData = {
        [topLevelKey]: {}
    };

    if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        existingData = JSON.parse(raw);
    }

    if (!existingData[topLevelKey]) {
        existingData[topLevelKey] = {};
    }

    existingData[topLevelKey][itemId] = incomingData;

    fs.writeFileSync(
        filePath,
        JSON.stringify(existingData, null, 2) + "\n",
        "utf8"
    );

    sendJson(res, 200, {
        ok: true,
        message: `Saved ${itemId}`,
        filePath
    });
}

const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (req.method !== "POST") {
        sendJson(res, 404, { ok: false, error: "Route not found" });
        return;
    }

    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", () => {
        try {
            const incomingData = JSON.parse(body);

            if (req.url === "/save-overseas-league") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.overseasLeagues,
                    topLevelKey: "leagues",
                    idField: "leagueCode"
                });
                return;
            }

            if (req.url === "/save-overseas-team") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.overseasTeams,
                    topLevelKey: "teams",
                    idField: "teamCode"
                });
                return;
            }

            if (req.url === "/save-unrivaled-team") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.unrivaledTeams,
                    topLevelKey: "teams",
                    idField: "teamCode"
                });
                return;
            }

            if (req.url === "/save-player") {
                const { playerId, playerData } = incomingData;

                if (!playerId || !playerData) {
                    sendJson(res, 400, {
                    ok: false,
                    error: "Missing playerId or playerData"
                    });
                    return;
                }

                let existingData = { players: {} };

                if (fs.existsSync(SAVE_TARGETS.players)) {
                    const raw = fs.readFileSync(SAVE_TARGETS.players, "utf8");
                    existingData = JSON.parse(raw);
                }

                if (!existingData.players) {
                    existingData.players = {};
                }

                existingData.players[playerId] = playerData;

                fs.writeFileSync(
                    SAVE_TARGETS.players,
                    JSON.stringify(existingData, null, 2) + "\n",
                    "utf8"
                );

                sendJson(res, 200, {
                    ok: true,
                    message: `Saved ${playerId}`,
                    filePath: SAVE_TARGETS.players
                });

                return;
            }

            if (req.url === "/save-wnba-team") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.wnbaTeams,
                    topLevelKey: "teams",
                    idField: "teamCode"
                });
                return;
            }

            sendJson(res, 404, { ok: false, error: "Route not found" });
        } catch (error) {
            sendJson(res, 500, {
                ok: false,
                error: error.message
            });
        }
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`Local save server running at http://127.0.0.1:${PORT}`);
});