const DATA_PATHS = {
    awards: "../basketball_101_data_files/wnba_regular_season_awards_data.json",
    teams: "../basketball_101_data_files/wnba_static_data_v2.json",
    entries: "../entries/entry data/wnba/wnba_entries_data.json",

    players: "../basketball_101_data_files/wnba_olympic_players_v2.json",
    colleges: "../basketball_101_data_files/wnba_colleges.json",
    overseasTeams: "../basketball_101_data_files/overseas_teams_data.json",
    overseasLeagues: "../basketball_101_data_files/overseas_leagues_data.json",
    unrivaledTeams: "../basketball_101_data_files/unrivaled_teams_data.json"
};

let AWARDS_DATA = { seasons: {} };
let TEAMS = {};
let ENTRIES = [];

let PLAYERS = {};
let COLLEGES = {};
let OVERSEAS_TEAMS = {};
let OVERSEAS_LEAGUES = {};
let UNRIVALED_TEAMS = {};

const seasonSelect = document.getElementById("seasonSelect");
const seasonTitle = document.getElementById("seasonTitle");
const awardCountText = document.getElementById("awardCountText");
const awardsGrid = document.getElementById("awardsGrid");

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

function getTeamName(teamCode) {
    return TEAMS[teamCode]?.name?.full || teamCode || "No team listed";
}

function populateSeasonSelect() {
    const seasons = Object.keys(AWARDS_DATA.seasons || {})
        .sort((a, b) => Number(b) - Number(a));

    seasonSelect.innerHTML = "";

    seasons.forEach(seasonId => {
        const option = document.createElement("option");
        option.value = seasonId;
        option.textContent = seasonId;
        seasonSelect.appendChild(option);
    });

    if (seasons.includes("2025")) {
        seasonSelect.value = "2025";
    }

    if (!seasons.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No seasons yet";
        seasonSelect.appendChild(option);
    }
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
        alert("No playerId found for this award recipient.");
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

function renderAwards() {
    const seasonId = seasonSelect.value;
    const seasonData = AWARDS_DATA.seasons?.[seasonId];
    const awards = Object.values(seasonData?.awards || {});

    seasonTitle.textContent = seasonId
        ? `${seasonId} Regular Season Awards`
        : "Regular Season Awards";

    awardCountText.textContent = `${awards.length} awards`;

    awardsGrid.innerHTML = "";

    if (!awards.length) {
        awardsGrid.innerHTML = `<p>No awards entered for this season yet.</p>`;
        return;
    }

    awardsGrid.className = "awards-table";

    awardsGrid.innerHTML = `
        <div class="awards-table-header">
            <span>Award</span>
            <span>Recipient</span>
            <span>Team</span>
            <span>Entries</span>
        </div>
    `;

    awards
        .sort((a, b) => (a.awardName || "").localeCompare(b.awardName || ""))
        .forEach(award => {
            const row = document.createElement("article");
            row.className = "award-row";

            const teamCode = award.recipient?.teamCode || "";

            const attachedEntries =
                EntriesRenderer.getEntriesForAttachedTo(
                    ENTRIES,
                    "award",
                    award.awardKey
                );

            row.innerHTML = `
                <div class="award-row-main">
                    <div class="award-name">${award.awardName || "Unnamed Award"}</div>
                    <div class="recipient-name">${award.recipient?.playerName || "No recipient"}</div>
                    <div class="team-line">${getTeamName(teamCode)}</div>
                    <div class="award-entry-actions">
                        ${
                            attachedEntries.length
                                ? `<button class="entry-tooltip-btn" type="button">View Entry</button>`
                                : `<span class="no-entry-text">—</span>`
                        }
                    </div>
                </div>
            `;

            const entryBtn = row.querySelector(".entry-tooltip-btn");

            if (entryBtn) {
                entryBtn.addEventListener("click", event => {
                    event.stopPropagation();
                    EntriesRenderer.openEntryModal(attachedEntries[0]);
                });
            }

            row.addEventListener("click", () => {
                openPlayerReceipt(award.recipient?.playerId || "");
            });

            awardsGrid.appendChild(row);
        });
}

seasonSelect.addEventListener("change", renderAwards);

async function init() {
    AWARDS_DATA = await loadJson(DATA_PATHS.awards, { seasons: {} });

    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    TEAMS = teamsData.teams || {};

    const entriesData = await loadJson(DATA_PATHS.entries, { entries: {} });
    ENTRIES = Object.values(entriesData.entries || {});

    const playersData = await loadJson(DATA_PATHS.players, { players: {} });
    PLAYERS = playersData.players || {};

    const collegesData = await loadJson(DATA_PATHS.colleges, { colleges: {} });
    COLLEGES = collegesData.colleges || collegesData || {};

    const overseasTeamsData = await loadJson(DATA_PATHS.overseasTeams, { teams: {} });
    OVERSEAS_TEAMS = overseasTeamsData.teams || overseasTeamsData.overseasTeams || {};

    const overseasLeaguesData = await loadJson(DATA_PATHS.overseasLeagues, { leagues: {} });
    OVERSEAS_LEAGUES = overseasLeaguesData.leagues || overseasLeaguesData.overseasLeagues || {};

    const unrivaledTeamsData = await loadJson(DATA_PATHS.unrivaledTeams, { teams: {} });
    UNRIVALED_TEAMS = unrivaledTeamsData.teams || unrivaledTeamsData.unrivaledTeams || {};

    populateSeasonSelect();

    EntriesRenderer.setupEntryModal();
    EntriesRenderer.setupEntriesPanelToggle();

    const pageEntries =
        EntriesRenderer.getEntriesForWire(
            ENTRIES,
            "regular-season-awards-viewer"
        );

    EntriesRenderer.renderPageEntries(
        pageEntries,
        document.getElementById("pageEntriesList")
    );

    renderAwards();
}

init();