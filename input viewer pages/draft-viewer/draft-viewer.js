const DATA_PATHS = {
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json",
    players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    colleges: "../../basketball_101_data_files/wnba_colleges.json",
    overseasTeams: "../../basketball_101_data_files/overseas_teams_data.json",
    overseasLeagues: "../../basketball_101_data_files/overseas_leagues_data.json",
    unrivaledTeams: "../../basketball_101_data_files/unrivaled_teams_data.json"
};

const PLAYER_VIEWER_PATH =
    "../player-viewer/player-viewer.html";

let DRAFTS = {};
let activeDraftFilter = "all";

let PLAYERS = {};
let TEAMS = {};
let COLLEGES = {};
let OVERSEAS_TEAMS = {};
let OVERSEAS_LEAGUES = {};
let UNRIVALED_TEAMS = {};

const draftsContainer = document.getElementById("draftsContainer");
const draftFilterControls = document.getElementById("draftFilterControls");

const DRAFT_TYPE_ORDER = {
    college: 1,
    expansion: 2,
    dispersal: 3
};

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return await response.json();
    } catch (error) {
        console.warn(error);
        return fallback;
    }
}

async function init() {
    const [
        draftsData,
        playersData,
        teamsData,
        collegesData,
        overseasTeamsData,
        overseasLeaguesData,
        unrivaledTeamsData
    ] = await Promise.all([
        loadJson(DATA_PATHS.drafts, { drafts: {} }),
        loadJson(DATA_PATHS.players, { players: {} }),
        loadJson(DATA_PATHS.teams, { teams: {} }),
        loadJson(DATA_PATHS.colleges, { colleges: {} }),
        loadJson(DATA_PATHS.overseasTeams, { teams: {} }),
        loadJson(DATA_PATHS.overseasLeagues, { leagues: {} }),
        loadJson(DATA_PATHS.unrivaledTeams, { teams: {} })
    ]);

    DRAFTS = draftsData.drafts || {};
    PLAYERS = playersData.players || {};
    TEAMS = teamsData.teams || teamsData || {};
    COLLEGES = collegesData.colleges || collegesData || {};
    OVERSEAS_TEAMS = overseasTeamsData.teams || overseasTeamsData.overseasTeams || {};
    OVERSEAS_LEAGUES = overseasLeaguesData.leagues || overseasLeaguesData.overseasLeagues || {};
    UNRIVALED_TEAMS = unrivaledTeamsData.teams || unrivaledTeamsData.unrivaledTeams || {};

    bindEvents();
    renderDrafts();
}

function bindEvents() {
    draftFilterControls.addEventListener("click", event => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;

        activeDraftFilter = button.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(filterButton => {
            filterButton.classList.remove("active");
        });

        button.classList.add("active");

        renderDrafts();
    });
}

function getSortedDrafts() {
    return Object.values(DRAFTS)
        .filter(draft => {
            if (activeDraftFilter === "all") return true;
            return draft.draftType === activeDraftFilter;
        })
        .sort((a, b) => {
            const yearCompare =
                Number(b.season || b.seasonId) - Number(a.season || a.seasonId);

            if (yearCompare !== 0) return yearCompare;

            return (
                (DRAFT_TYPE_ORDER[a.draftType] || 99) -
                (DRAFT_TYPE_ORDER[b.draftType] || 99)
            );
        });
}

function getRounds(draft) {
    return Object.values(draft.rounds || {})
        .sort((a, b) => Number(a.roundNumber) - Number(b.roundNumber));
}

function getPicksForRound(round) {
    return Object.values(round.picks || {})
        .sort((a, b) => Number(a.overallPick) - Number(b.overallPick));
}

function getAllPicks(draft) {
    return getRounds(draft).flatMap(round => getPicksForRound(round));
}

function normalizePlayerRecord(playerId, playerRecord) {
    if (!playerRecord) return null;

    return {
        playerId,
        isQuickAdd: !!playerRecord?.dataStatus?.isQuickAdd || !!playerRecord?.playerData,
        data: playerRecord.playerData || playerRecord
    };
}

function openPlayerReceipt(playerId) {
    if (!playerId) {
        alert("No playerId found for this pick yet.");
        return;
    }

    const normalizedPlayer = normalizePlayerRecord(playerId, PLAYERS[playerId]);

    if (!normalizedPlayer?.data) {
        alert(`No player record found for ${playerId}.`);
        return;
    }

    PlayerReceiptRenderer.openPlayerModal({
        playerId: normalizedPlayer.playerId,
        player: normalizedPlayer.data,
        teams: TEAMS,
        colleges: COLLEGES,
        overseasTeams: OVERSEAS_TEAMS,
        overseasLeagues: OVERSEAS_LEAGUES,
        unrivaledTeams: UNRIVALED_TEAMS
    });
}

function togglePanel(button, panelBody) {
    const isCollapsed = panelBody.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", String(!isCollapsed));
}

function renderDrafts() {
    const drafts = getSortedDrafts();

    draftsContainer.innerHTML = "";

    if (!drafts.length) {
        draftsContainer.innerHTML = `
            <section class="panel">
                No ${activeDraftFilter === "all" ? "" : activeDraftFilter} drafts found.
            </section>
        `;
        return;
    }

    drafts.forEach(draft => {
        draftsContainer.appendChild(renderDraftPanel(draft));
    });
}

function renderDraftPanel(draft) {
    const panel = document.createElement("section");
    panel.className = `draft-panel draft-type-${draft.draftType}`;

    const picks = getAllPicks(draft);
    const rounds = getRounds(draft);

    const header = document.createElement("button");
    header.type = "button";
    header.className = `draft-header draft-header-${draft.draftType}`;
    header.setAttribute("aria-expanded", "true");

    header.innerHTML = `
        <span>
            <strong>${draft.draftName || draft.draftId}</strong>
        </span>
        <span class="panel-toggle">−</span>
    `;

    const body = document.createElement("div");
    body.className = "draft-body";

    body.innerHTML = `
        <div class="draft-meta-row">
            <div class="draft-meta">Draft Date: ${draft.draftDate || "—"}</div>
            <div class="draft-meta">Rounds: ${draft.roundsCount || rounds.length || "—"}</div>
            <div class="draft-meta">Picks Entered: ${picks.length}</div>
        </div>
    `;

    const roundsWrap = document.createElement("div");
    roundsWrap.className = "rounds-wrap";

    rounds.forEach(round => {
        roundsWrap.appendChild(renderRoundPanel(round));
    });

    body.appendChild(roundsWrap);

    header.addEventListener("click", () => {
        togglePanel(header, body);
        header.querySelector(".panel-toggle").textContent =
            body.classList.contains("collapsed") ? "+" : "−";
    });

    panel.appendChild(header);
    panel.appendChild(body);

    return panel;
}

function renderRoundPanel(round) {
    const panel = document.createElement("section");
    panel.className = "round-panel";

    const picks = getPicksForRound(round);

    const header = document.createElement("button");
    header.type = "button";
    header.className = "round-header";
    header.setAttribute("aria-expanded", "true");

    header.innerHTML = `
        <span>
            <p><strong>Round ${round.roundNumber}</strong></p>
            <p><small>${picks.length} picks</small></p>
        </span>
        <span class="panel-toggle">−</span>
    `;

    const body = document.createElement("div");
    body.className = "round-body picks-grid";

    picks.forEach(pick => {
        body.appendChild(renderPickCard(pick));
    });

    header.addEventListener("click", () => {
        togglePanel(header, body);
        header.querySelector(".panel-toggle").textContent =
            body.classList.contains("collapsed") ? "+" : "−";
    });

    panel.appendChild(header);
    panel.appendChild(body);

    return panel;
}

function renderPickCard(pick) {
    const pickCard = document.createElement("button");
    pickCard.type = "button";
    pickCard.className = "pick-card";

    const playerId = pick.player?.playerId || "";

    pickCard.innerHTML = `
        <strong>#${pick.overallPick} — ${pick.player?.playerName || "Unknown Player"}</strong>
        <div class="pick-meta">Round ${pick.round}, Pick ${pick.roundPick}</div>
        <div class="pick-meta">Team: ${pick.team?.teamName || "—"}</div>
        <div class="pick-meta">Previous Team: ${pick.previousTeam?.teamName || "—"}</div>
        <div class="pick-meta">College: ${pick.college?.collegeName || "—"}</div>
        <div class="pick-meta">Overseas: ${pick.overseas?.teamName || pick.overseas?.country || "—"}</div>
    `;

    pickCard.addEventListener("click", () => {
        openPlayerReceipt(playerId);
    });

    return pickCard;
}

init();