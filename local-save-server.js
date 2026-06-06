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
    ),
    teamSeasonRosters: path.join(
    __dirname,
    "basketball_101_data_files",
    "wnba_team_season_rosters_data.json"
    ),
    seasonGeneralInfo: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_season_general_info_data.json"
    ),
    gamedayCalendar: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_gameday_calendar_data.json"
    ),
    regularSeasonAwards: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_regular_season_awards_data.json"
    ),
    drafts: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_drafts_data.json"
    ),
    colleges: path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_colleges.json"
    ),
    entriesWnba: path.join(
        __dirname,
        "entries",
        "entry data",
        "wnba",
        "wnba_entries_data.json"
    ),

    entryMarkdownWnba: path.join(
        __dirname,
        "entries",
        "entry data",
        "wnba",
        "text"
    ),
    postsData: path.join(
        __dirname,
        "posts",
        "post data",
        "posts_data.json"
    ),
    postsPagesData: path.join(
        __dirname,
        "posts",
        "post data",
        "pages_data.json"
    )
};

function getGamedayCalendarFilePath(seasonId) {
    return path.join(
        __dirname,
        "basketball_101_data_files",
        "wnba_calendar_data",
        `wnba_${seasonId}_calendar_data.json`
    );
}

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

        if (raw.trim()) {
            existingData = JSON.parse(raw);
        }
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
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.players,
                    topLevelKey: "players",
                    idField: "playerId"
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

            if (
                req.url === "/save-season-general-info" ||
                req.url === "/save-season-calendar"
            ) {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.seasonGeneralInfo,
                    topLevelKey: "seasons",
                    idField: "seasonId"
                });
                return;
            }

            if (req.url === "/save-team-season-roster") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.teamSeasonRosters,
                    topLevelKey: "teamSeasons",
                    idField: "teamSeasonId"
                });
                return;
            }

            if (req.url === "/save-gameday-calendar-game") {
                const { seasonId, gameId } = incomingData;

                if (!seasonId || !gameId) {
                    sendJson(res, 400, {
                        ok: false,
                        error: "Missing seasonId or gameId"
                    });
                    return;
                }

                const filePath = getGamedayCalendarFilePath(seasonId);

                let existingData = {
                    season: Number(seasonId),
                    seasonId,
                    games: {}
                };

                if (fs.existsSync(filePath)) {
                    const raw = fs.readFileSync(filePath, "utf8");
                    existingData = JSON.parse(raw);
                }

                if (!existingData.games) {
                    existingData.games = {};
                }

                existingData.games[gameId] = incomingData;

                fs.mkdirSync(path.dirname(filePath), { recursive: true });

                fs.writeFileSync(
                    filePath,
                    JSON.stringify(existingData, null, 2) + "\n",
                    "utf8"
                );

                sendJson(res, 200, {
                    ok: true,
                    message: `Saved ${gameId}`,
                    filePath
                });

                return;
            }

            if (req.url === "/update-gameday-game") {
                const { seasonId, gameId } = incomingData;

                if (!seasonId || !gameId) {
                    sendJson(res, 400, {
                        ok: false,
                        error: "Missing seasonId or gameId"
                    });
                    return;
                }

                const filePath = getGamedayCalendarFilePath(seasonId);

                let existingData = {
                    season: Number(seasonId),
                    seasonId,
                    games: {}
                };

                if (fs.existsSync(filePath)) {
                    const raw = fs.readFileSync(filePath, "utf8");
                    existingData = JSON.parse(raw);
                }

                if (!existingData.games?.[gameId]) {
                    sendJson(res, 404, {
                        ok: false,
                        error: `Game not found: ${gameId}`
                    });
                    return;
                }

                existingData.games[gameId] = {
                    ...existingData.games[gameId],
                    ...incomingData
                };

                fs.mkdirSync(path.dirname(filePath), { recursive: true });

                fs.writeFileSync(
                    filePath,
                    JSON.stringify(existingData, null, 2) + "\n",
                    "utf8"
                );

                sendJson(res, 200, {
                    ok: true,
                    message: `Updated ${gameId}`,
                    filePath
                });

                return;
            }

            if (req.url === "/save-regular-season-award") {
                const { seasonId, awardId } = incomingData;

                if (!seasonId || !awardId) {
                    sendJson(res, 400, {
                        ok: false,
                        error: "Missing seasonId or awardId"
                    });
                    return;
                }

                let existingData = { seasons: {} };

                if (fs.existsSync(SAVE_TARGETS.regularSeasonAwards)) {
                    const raw = fs.readFileSync(SAVE_TARGETS.regularSeasonAwards, "utf8");
                    existingData = JSON.parse(raw);
                }

                if (!existingData.seasons[seasonId]) {
                    existingData.seasons[seasonId] = {
                        season: Number(seasonId),
                        seasonId,
                        awards: {}
                    };
                }

                if (!existingData.seasons[seasonId].awards) {
                    existingData.seasons[seasonId].awards = {};
                }

                existingData.seasons[seasonId].awards[awardId] = incomingData;

                fs.writeFileSync(
                    SAVE_TARGETS.regularSeasonAwards,
                    JSON.stringify(existingData, null, 2) + "\n",
                    "utf8"
                );

                sendJson(res, 200, {
                    ok: true,
                    message: `Saved ${awardId}`,
                    filePath: SAVE_TARGETS.regularSeasonAwards
                });

                return;
            }

            if (req.url === "/save-draft") {
                const { seasonId, draftId } = incomingData;

                if (!seasonId || !draftId) {
                    sendJson(res, 400, {
                        ok: false,
                        error: "Missing seasonId or draftId"
                    });
                    return;
                }

                let existingData = { drafts: {} };

                if (fs.existsSync(SAVE_TARGETS.drafts)) {
                    const raw = fs.readFileSync(SAVE_TARGETS.drafts, "utf8");
                    existingData = JSON.parse(raw);
                }

                if (!existingData.drafts) {
                    existingData.drafts = {};
                }

                existingData.drafts[draftId] = incomingData;

                fs.writeFileSync(
                    SAVE_TARGETS.drafts,
                    JSON.stringify(existingData, null, 2) + "\n",
                    "utf8"
                );

                sendJson(res, 200, {
                    ok: true,
                    message: `Saved ${draftId}`,
                    filePath: SAVE_TARGETS.drafts
                });

                return;
            }

            if (req.url === "/save-college") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.colleges,
                    topLevelKey: "colleges",
                    idField: "collegeId"
                });
                return;
            }

            if (req.url === "/save-wnba-entry") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.entriesWnba,
                    topLevelKey: "entries",
                    idField: "entryId"
                });
                return;
            }

            if (req.url === "/save-wnba-entry-markdown") {
                const filePath = path.join(
                    __dirname,
                    incomingData.contentFile
                );

                fs.mkdirSync(path.dirname(filePath), { recursive: true });

                fs.writeFileSync(filePath, incomingData.markdownContent || "", "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true, savedTo: filePath }));
                return;
            }

            if (req.url === "/save-post") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.postsData,
                    topLevelKey: "posts",
                    idField: "postId"
                });
                return;
            }

            if (req.url === "/save-post-content") {
                const filePath = path.join(__dirname, incomingData.contentFile);

                console.log("Saving post content to:", filePath);

                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, incomingData.content || "", "utf8");

                sendJson(res, 200, {
                    ok: true,
                    savedTo: filePath
                });

                return;
            }

            if (req.url === "/save-post-style") {
                const filePath = path.join(__dirname, incomingData.styleFile);

                console.log("Saving post CSS to:", filePath);
                console.log("CSS length:", (incomingData.css || "").length);

                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, incomingData.css || "", "utf8");

                sendJson(res, 200, {
                    ok: true,
                    savedTo: filePath
                });

                return;
            }

            if (req.url === "/save-post-page") {
                saveByKey({
                    res,
                    incomingData,
                    filePath: SAVE_TARGETS.postsPagesData,
                    topLevelKey: "pages",
                    idField: "pageId"
                });
                return;
            }

            if (req.url === "/save-post-page-style") {
                const filePath = path.join(__dirname, incomingData.styleFile);

                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, incomingData.css || "", "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true, savedTo: filePath }));
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