const DATA_PATHS = {
    players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
    awards: "../../basketball_101_data_files/wnba_regular_season_awards_data.json",
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json"
};

const PLAYER_INPUT_TOOL_PATH =
    "../../input tools/player-input-tools/player-input-tool.html";

const AWARDS_INPUT_TOOL_PATH =
    "../../input tools/regular-season-awards-input-tools/regular-season-awards-input-tool.html";

let PLAYERS = {};
let AWARDS_DATA = { seasons: {} };
let TEAMS = {};

const DRAFT_INPUT_TOOL_PATH =
    "../../input tools/draft-input-tools/draft-input-tool.html";

let DRAFTS_DATA = { drafts: {} };

const runChecksBtn = document.getElementById("runChecksBtn");
const statusMessage = document.getElementById("statusMessage");

const missingPlayersCount = document.getElementById("missingPlayersCount");
const teamMismatchCount = document.getElementById("teamMismatchCount");
const okCount = document.getElementById("okCount");

const missingPlayersList = document.getElementById("missingPlayersList");
const teamMismatchList = document.getElementById("teamMismatchList");
const okList = document.getElementById("okList");

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) return fallback;

        const text = await response.text();

        if (!text.trim()) {
            return fallback;
        }

        return JSON.parse(text);
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

function makeId(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getTeamName(teamCode) {
    return TEAMS[teamCode]?.name?.full || teamCode || "No team listed";
}

function getPlayerDisplayName(playerId, fallbackName) {
    return PLAYERS[playerId]?.playerName || fallbackName || playerId;
}

function getPlayerWnbaTeams(player) {
    return (
        player?.careerDetails?.wnbaTeams ||
        player?.wnbaTeams ||
        []
    );
}

function yearFallsInsideRange(year, startYear, endYear) {
    const numericYear = Number(year);
    const start = Number(startYear);

    if (!start || numericYear < start) {
        return false;
    }

    if (
        endYear === null ||
        endYear === undefined ||
        endYear === "" ||
        String(endYear).toLowerCase() === "present"
    ) {
        return true;
    }

    return numericYear <= Number(endYear);
}

function playerHasTeamForSeason(player, teamCode, season) {
    if (!player || !teamCode) {
        return false;
    }

    const teams = getPlayerWnbaTeams(player);

    return teams.some(teamEntry => {
        return (
            teamEntry.teamCode === teamCode &&
            yearFallsInsideRange(
                season,
                teamEntry.startYear,
                teamEntry.endYear
            )
        );
    });
}

function collectAwardPlayerReferences() {
    const references = [];

    Object.values(AWARDS_DATA.seasons || {}).forEach(seasonData => {
        Object.values(seasonData.awards || {}).forEach(award => {
            const playerId = award.recipient?.playerId;
            const playerName = award.recipient?.playerName;
            const teamCode = award.recipient?.teamCode;

            if (!playerId && !playerName) return;

            references.push({
                sourceType: "regular-season-award",
                sourceFile: "wnba_regular_season_awards_data.json",
                sourceLabel: `${seasonData.seasonId} ${award.awardName}`,
                detailPath: `seasons.${seasonData.seasonId}.awards.${award.awardId}.recipient`,
                season: seasonData.season,
                seasonId: seasonData.seasonId,
                awardId: award.awardId,
                awardKey: award.awardKey,
                awardName: award.awardName,
                playerId: playerId || makeId(playerName),
                playerName,
                teamCode
            });
        });
    });

    return references;
}

function collectDraftPlayerReferences() {
    const references = [];

    Object.values(DRAFTS_DATA.drafts || {}).forEach(draft => {
        Object.values(draft.rounds || {}).forEach(round => {
            Object.values(round.picks || {}).forEach(pick => {
                const playerId = pick.player?.playerId;
                const playerName = pick.player?.playerName;
                const teamCode = pick.team?.teamCode;

                if (!playerId && !playerName) return;

                references.push({
                    sourceType: "draft",
                    sourceFile: "wnba_drafts_data.json",
                    sourceLabel: `${draft.draftName} — Pick #${pick.overallPick}`,
                    detailPath: `drafts.${draft.draftId}.rounds.${round.roundNumber}.picks.${pick.pickId}.player`,
                    season: draft.season,
                    seasonId: draft.seasonId,
                    draftId: draft.draftId,
                    draftType: draft.draftType,
                    pickId: pick.pickId,
                    playerId: playerId || makeId(playerName),
                    playerName,
                    teamCode,
                    previousTeamCode: pick.previousTeam?.teamCode || null
                });
            });
        });
    });

    return references;
}

function buildPlayerEditorUrl(reference) {
    const params = new URLSearchParams();

    params.set("mode", "create");
    params.set("playerName", reference.playerName || "");
    params.set("playerId", reference.playerId || makeId(reference.playerName));

    return `${PLAYER_INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildDraftEditorUrl(reference) {
    const params = new URLSearchParams();

    params.set("year", reference.seasonId || "");
    params.set("type", reference.draftType || "");
    params.set("draftId", reference.draftId || "");
    params.set("pickId", reference.pickId || "");
    params.set("mode", reference.pickId ? "pick" : "draft");

    return `${DRAFT_INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildAwardEditorUrl(reference) {
    const params = new URLSearchParams();

    params.set("season", reference.seasonId || "");
    params.set("awardId", reference.awardId || "");
    params.set("awardKey", reference.awardKey || "");
    params.set("awardName", reference.awardName || "");
    params.set("recipientName", reference.playerName || "");
    params.set("playerId", reference.playerId || "");
    params.set("teamCode", reference.teamCode || "");

    return `${AWARDS_INPUT_TOOL_PATH}?${params.toString()}`;
}

function classifyReferences(references) {
    const missingPlayers = [];
    const teamMismatches = [];
    const okReferences = [];

    references.forEach(reference => {
        const player = PLAYERS[reference.playerId];

        if (!player) {
            missingPlayers.push({
                ...reference,
                issueType: "missing-player",
                message: `${reference.playerName} is referenced in ${reference.sourceFile}, but is not in the main player file.`
            });
            return;
        }

        if (reference.teamCode && !playerHasTeamForSeason(player, reference.teamCode, reference.season)) {
            teamMismatches.push({
                ...reference,
                issueType: "team-mismatch",
                message: `${getPlayerDisplayName(reference.playerId, reference.playerName)} is listed with ${getTeamName(reference.teamCode)} for ${reference.season}, but that team/year was not found in their WNBA team history.`
            });
            return;
        }

        okReferences.push({
            ...reference,
            issueType: "ok",
            message: `${getPlayerDisplayName(reference.playerId, reference.playerName)} matched successfully.`
        });
    });

    return {
        missingPlayers,
        teamMismatches,
        okReferences
    };
}

function renderIssueList(container, issues, type) {
    container.innerHTML = "";

    if (!issues.length) {
        container.innerHTML = `<p class="empty-message">No issues found.</p>`;
        return;
    }

    issues.forEach(issue => {
        const card = document.createElement("article");
        card.className = "issue-card";

        const playerUrl = buildPlayerEditorUrl(issue);
        const sourceEditorUrl =
            issue.sourceType === "draft"
                ? buildDraftEditorUrl(issue)
                : buildAwardEditorUrl(issue);

        const sourceEditorLabel =
            issue.sourceType === "draft"
                ? "Open Draft Editor"
                : "Open Award Editor";

        card.innerHTML = `
            <div class="issue-title">${issue.playerName || issue.playerId}</div>

            <div class="issue-meta">
                <span><strong>Issue:</strong> ${issue.message}</span>
                <span><strong>Source:</strong> ${issue.sourceLabel}</span>
                <span><strong>Path:</strong> ${issue.detailPath}</span>
                <span><strong>Team:</strong> ${getTeamName(issue.teamCode)}</span>
            </div>

            <div class="issue-actions">
                ${
                    type === "missing"
                        ? `<button type="button" data-url="${playerUrl}">Start Adding Player</button>`
                        : ""
                }
                <button class="secondary-btn" type="button" data-url="${sourceEditorUrl}">
                    ${sourceEditorLabel}
                </button>
            </div>
        `;

        card.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", event => {
                window.location.href = event.currentTarget.dataset.url;
            });
        });

        container.appendChild(card);
    });
}

function renderResults(results) {
    missingPlayersCount.textContent = results.missingPlayers.length;
    teamMismatchCount.textContent = results.teamMismatches.length;
    okCount.textContent = results.okReferences.length;

    renderIssueList(missingPlayersList, results.missingPlayers, "missing");
    renderIssueList(teamMismatchList, results.teamMismatches, "mismatch");
    renderIssueList(okList, results.okReferences, "ok");
}

async function runChecks() {
    statusMessage.textContent = "Loading data...";

    const playersData = await loadJson(DATA_PATHS.players, { players: {} });
    const awardsData = await loadJson(DATA_PATHS.awards, { seasons: {} });
    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    const draftsData = await loadJson(DATA_PATHS.drafts, { drafts: {} });

    PLAYERS = playersData.players || {};
    AWARDS_DATA = awardsData || { seasons: {} };
    TEAMS = teamsData.teams || {};
    DRAFTS_DATA = draftsData || { drafts: {} };

    const awardReferences = collectAwardPlayerReferences();
    const draftReferences = collectDraftPlayerReferences();

    const allReferences = [
        ...awardReferences,
        ...draftReferences
    ];

    const results = classifyReferences(allReferences);

    renderResults(results);

    statusMessage.textContent = `Checked ${allReferences.length} player references.`;
}

runChecksBtn.addEventListener("click", runChecks);

runChecks();