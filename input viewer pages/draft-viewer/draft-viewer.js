const DATA_PATHS = {
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json"
};

const INPUT_TOOL_PATH =
    "../../input tools/draft-input-tools/draft-input-tool.html";

let DRAFTS = {};

const seasonInput = document.getElementById("seasonInput");
const loadSeasonBtn = document.getElementById("loadSeasonBtn");
const draftsContainer = document.getElementById("draftsContainer");

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
    const draftsData = await loadJson(DATA_PATHS.drafts, { drafts: {} });
    DRAFTS = draftsData.drafts || {};

    bindEvents();
    renderDraftsForSeason();
}

function bindEvents() {
    loadSeasonBtn.addEventListener("click", renderDraftsForSeason);

    seasonInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            renderDraftsForSeason();
        }
    });
}

function getDraftsForSeason(seasonId) {
    return Object.values(DRAFTS)
        .filter(draft => String(draft.seasonId) === String(seasonId))
        .sort((a, b) => {
            const order = {
                college: 1,
                expansion: 2,
                dispersal: 3
            };

            return (order[a.draftType] || 99) - (order[b.draftType] || 99);
        });
}

function getAllPicks(draft) {
    return Object.values(draft.rounds || {})
        .flatMap(round => Object.values(round.picks || {}))
        .sort((a, b) => a.overallPick - b.overallPick);
}

function openDraftEditor(draft) {
    const params = new URLSearchParams({
        year: draft.seasonId,
        type: draft.draftType,
        draftId: draft.draftId,
        mode: "draft"
    });

    window.location.href = `${INPUT_TOOL_PATH}?${params.toString()}`;
}

function openPickEditor(draft, pick) {
    const params = new URLSearchParams({
        year: draft.seasonId,
        type: draft.draftType,
        draftId: draft.draftId,
        pickId: pick.pickId,
        mode: "pick"
    });

    window.location.href = `${INPUT_TOOL_PATH}?${params.toString()}`;
}

function renderDraftsForSeason() {
    const seasonId = String(seasonInput.value).trim();
    const drafts = getDraftsForSeason(seasonId);

    draftsContainer.innerHTML = "";

    if (!drafts.length) {
        draftsContainer.innerHTML = `
            <section class="panel">
                No drafts found for ${seasonId}.
            </section>
        `;
        return;
    }

    drafts.forEach(draft => {
        const panel = document.createElement("section");
        panel.className = "draft-panel";

        const picks = getAllPicks(draft);

        panel.innerHTML = `
            <h2>${draft.draftName || draft.draftId}</h2>
            <div class="draft-meta">Draft ID: ${draft.draftId}</div>
            <div class="draft-meta">Type: ${draft.draftType}</div>
            <div class="draft-meta">Season: ${draft.seasonId}</div>
            <div class="draft-meta">Draft Date: ${draft.draftDate || "—"}</div>
            <div class="draft-meta">Rounds: ${draft.roundsCount || "—"}</div>
            <div class="draft-meta">Picks Entered: ${picks.length}</div>

            <div class="picks-grid"></div>
        `;

        panel.addEventListener("click", () => {
            openDraftEditor(draft);
        });

        const picksGrid = panel.querySelector(".picks-grid");

        picks.forEach(pick => {
            const pickCard = document.createElement("article");
            pickCard.className = "pick-card";

            pickCard.innerHTML = `
                <strong>#${pick.overallPick} — ${pick.player?.playerName || "Unknown Player"}</strong>
                <div class="pick-meta">Round ${pick.round}, Pick ${pick.roundPick}</div>
                <div class="pick-meta">Team: ${pick.team?.teamName || "—"}</div>
                <div class="pick-meta">Previous Team: ${pick.previousTeam?.teamName || "—"}</div>
                <div class="pick-meta">College: ${pick.college?.collegeName || "—"}</div>
                <div class="pick-meta">Overseas: ${pick.overseas?.teamName || pick.overseas?.country || "—"}</div>
            `;

            pickCard.addEventListener("click", event => {
                event.stopPropagation();
                openPickEditor(draft, pick);
            });

            picksGrid.appendChild(pickCard);
        });

        draftsContainer.appendChild(panel);
    });
}

init();