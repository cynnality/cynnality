const DATA_PATHS = {
    seasonCalendar: "../../basketball_101_data_files/wnba_season_calendar_data.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    teamSeasonDetails: "../../basketball_101_data_files/wnba_team_season_rosters_data.json"
};

const SAVE_URLS = {
    teamSeasonRoster: "http://127.0.0.1:8787/save-team-season-roster"
};

let SEASON_CALENDAR_DATA = {};
let TEAMS_DATA = {};
let TEAM_SEASON_DATA = {};

let CURRENT_PLAYERS = [];
let CURRENT_LINKS = [];
let CURRENT_GAME_CELLS = [];
let SELECTED_GAME_CELL_ID = null;

const seasonSelect = document.getElementById("seasonSelect");
const teamPickerGrid = document.getElementById("teamPickerGrid");
let SELECTED_TEAM_CODE = null;
const seasonSummary = document.getElementById("seasonSummary");
const gameCellsGrid = document.getElementById("gameCellsGrid");

const playerIdInput = document.getElementById("playerIdInput");
const playerNameInput = document.getElementById("playerNameInput");
const rosterStatusInput = document.getElementById("rosterStatusInput");
const playerStartDateInput = document.getElementById("playerStartDateInput");
const playerEndDateInput = document.getElementById("playerEndDateInput");
const playerNotesInput = document.getElementById("playerNotesInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playersList = document.getElementById("playersList");

const linkTitleInput = document.getElementById("linkTitleInput");
const linkUrlInput = document.getElementById("linkUrlInput");
const linkDescriptionInput = document.getElementById("linkDescriptionInput");
const addLinkBtn = document.getElementById("addLinkBtn");
const linksList = document.getElementById("linksList");

const teamNotesInput = document.getElementById("teamNotesInput");
const saveTeamSeasonBtn = document.getElementById("saveTeamSeasonBtn");
const statusMessage = document.getElementById("statusMessage");

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);

        if (!response.ok) {
            return fallback;
        }

        return await response.json();
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

async function initTool() {
    SEASON_CALENDAR_DATA = await loadJson(DATA_PATHS.seasonCalendar, { seasons: {} });
    TEAMS_DATA = await loadJson(DATA_PATHS.teams, { teams: {} });
    TEAM_SEASON_DATA = await loadJson(DATA_PATHS.teamSeasonDetails, { teamSeasons: {} });

    renderTeamOptions();
    loadSelectedTeamSeason();
}

function getSelectedSeasonId() {
    return seasonSelect.value;
}

function getSelectedTeamCode() {
    return SELECTED_TEAM_CODE;
}

function getSeasonRecord() {
    return SEASON_CALENDAR_DATA?.seasons?.[getSelectedSeasonId()] || null;
}

function getTeamRecord(teamCode) {
    return TEAMS_DATA?.teams?.[teamCode] || null;
}

function getTeamSeasonId() {
    return `${getSelectedSeasonId()}_${getSelectedTeamCode()}`;
}

function getTeamSeasonRecord() {
    return TEAM_SEASON_DATA?.teamSeasons?.[getTeamSeasonId()] || null;
}

function renderTeamOptions() {
    teamPickerGrid.innerHTML = "";

    const teams = Object.values(TEAMS_DATA.teams || {})
        .filter(team => team.status?.isActive)
        .sort((a, b) => a.name.full.localeCompare(b.name.full));

    if (!SELECTED_TEAM_CODE && teams.length > 0) {
        SELECTED_TEAM_CODE = teams[0].teamCode;
    }

    teams.forEach(team => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "team-picker-card";

        if (team.teamCode === SELECTED_TEAM_CODE) {
            card.classList.add("selected");
        }

        const color = team.branding?.colors?.color1 || "#111";
        card.style.background = color;

        card.innerHTML = `
            <span>${team.name.full}</span>
            <small>${team.teamCode}</small>
        `;

        card.addEventListener("click", () => {
            SELECTED_TEAM_CODE = team.teamCode;
            SELECTED_GAME_CELL_ID = null;

            renderTeamOptions();
            loadSelectedTeamSeason();
        });

        teamPickerGrid.appendChild(card);
    });
}

function loadSelectedTeamSeason() {
    const seasonRecord = getSeasonRecord();
    const teamSeasonRecord = getTeamSeasonRecord();

    CURRENT_PLAYERS = [...(teamSeasonRecord?.players || [])];
    CURRENT_LINKS = [...(teamSeasonRecord?.links || [])];
    CURRENT_GAME_CELLS = [...(teamSeasonRecord?.gameCells || [])];

    teamNotesInput.value = teamSeasonRecord?.notes || "";

    renderSeasonSummary(seasonRecord);
    ensureGameCells();
    renderGameCells();
    renderPlayersList();
    renderLinksList();
}

function renderSeasonSummary(seasonRecord) {
    if (!seasonRecord) {
        seasonSummary.textContent = "No season calendar data found for this season.";
        return;
    }

    seasonSummary.innerHTML = `
        <strong>${seasonRecord.season}</strong><br>
        Start: ${seasonRecord.startDate || "—"}<br>
        End: ${seasonRecord.endDate || "—"}<br>
        Games per team: ${seasonRecord.regularSeasonGamesPerTeam || "—"}<br>
        Teams: ${seasonRecord.numTeams || "—"}
    `;
}

function ensureGameCells() {
    const seasonRecord = getSeasonRecord();
    const teamCode = getSelectedTeamCode();

    const gamesPerTeam = seasonRecord?.regularSeasonGamesPerTeam || 0;

    if (CURRENT_GAME_CELLS.length > 0 || !gamesPerTeam) {
        return;
    }

    CURRENT_GAME_CELLS = Array.from({ length: gamesPerTeam }, (_, index) => {
        const gameNumber = index + 1;
        const paddedNumber = String(gameNumber).padStart(3, "0");

        return {
            gameCellId: `${getSelectedSeasonId()}_${teamCode}_GAME_${paddedNumber}`,
            gameNumber,
            cellType: "game-slot",
            notes: "",
            links: [],
            entryIds: []
        };
    });
}

function cellHasEntry(cell) {
    return (
        (cell.notes && cell.notes.trim()) ||
        (cell.links && cell.links.length > 0) ||
        (cell.entryIds && cell.entryIds.length > 0)
    );
}

function renderGameCells() {
    const team = getTeamRecord(getSelectedTeamCode());
    const color = team?.branding?.colors?.color1 || "#111";

    gameCellsGrid.innerHTML = "";

    CURRENT_GAME_CELLS.forEach(cell => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "game-cell";
        button.textContent = cell.gameNumber;
        button.style.background = color;

        if (!cellHasEntry(cell)) {
            button.classList.add("muted");
        } else {
            button.classList.add("has-entry");
        }

        if (cell.gameCellId === SELECTED_GAME_CELL_ID) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            SELECTED_GAME_CELL_ID = cell.gameCellId;
            renderGameCells();

            statusMessage.textContent =
                `Selected ${team?.name?.full || getSelectedTeamCode()} game slot ${cell.gameNumber}.`;
        });

        gameCellsGrid.appendChild(button);
    });
}

function addPlayer() {
    const playerId = playerIdInput.value.trim();
    const playerName = playerNameInput.value.trim();

    if (!playerId && !playerName) {
        statusMessage.textContent = "Add a player ID or player name first.";
        return;
    }

    CURRENT_PLAYERS.push({
        playerId,
        playerName,
        rosterStatus: rosterStatusInput.value,
        startDate: playerStartDateInput.value || null,
        endDate: playerEndDateInput.value || null,
        notes: playerNotesInput.value.trim()
    });

    playerIdInput.value = "";
    playerNameInput.value = "";
    playerStartDateInput.value = "";
    playerEndDateInput.value = "";
    playerNotesInput.value = "";

    renderPlayersList();
}

function renderPlayersList() {
    playersList.innerHTML = "";

    CURRENT_PLAYERS.forEach(player => {
        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <strong>${player.playerName || player.playerId}</strong>
            <p>ID: ${player.playerId || "—"}</p>
            <p>Status: ${player.rosterStatus}</p>
            <p>${player.notes || ""}</p>
        `;

        playersList.appendChild(item);
    });
}

function addLink() {
    const title = linkTitleInput.value.trim();
    const url = linkUrlInput.value.trim();
    const description = linkDescriptionInput.value.trim();

    if (!title || !url) {
        statusMessage.textContent = "Add a link title and URL first.";
        return;
    }

    CURRENT_LINKS.push({
        title,
        url,
        description
    });

    linkTitleInput.value = "";
    linkUrlInput.value = "";
    linkDescriptionInput.value = "";

    renderLinksList();
}

function renderLinksList() {
    linksList.innerHTML = "";

    CURRENT_LINKS.forEach(link => {
        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <strong>${link.title}</strong>
            <p>${link.url}</p>
            <p>${link.description || ""}</p>
        `;

        linksList.appendChild(item);
    });
}

function buildTeamSeasonRecord() {
    const seasonRecord = getSeasonRecord();
    const teamCode = getSelectedTeamCode();

    return {
        teamSeasonId: getTeamSeasonId(),
        season: Number(getSelectedSeasonId()),
        teamCode,

        seasonStartDate: seasonRecord?.startDate || null,
        seasonEndDate: seasonRecord?.endDate || null,
        regularSeasonGamesPerTeam: seasonRecord?.regularSeasonGamesPerTeam || null,
        numTeams: seasonRecord?.numTeams || null,

        players: CURRENT_PLAYERS,
        links: CURRENT_LINKS,
        notes: teamNotesInput.value.trim(),

        markdownEntries: getTeamSeasonRecord()?.markdownEntries || [],
        gameCells: CURRENT_GAME_CELLS,
        entryIds: getTeamSeasonRecord()?.entryIds || []
    };
}

async function saveTeamSeason() {
    const record = buildTeamSeasonRecord();

    try {
        const response = await fetch(SAVE_URLS.teamSeasonRoster, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(record)
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Save failed");
        }

        if (!TEAM_SEASON_DATA.teamSeasons) {
            TEAM_SEASON_DATA.teamSeasons = {};
        }

        TEAM_SEASON_DATA.teamSeasons[record.teamSeasonId] = record;

        statusMessage.textContent = `Saved ${record.teamSeasonId}.`;
    } catch (error) {
        statusMessage.textContent = `Save error: ${error.message}`;
    }
}

seasonSelect.addEventListener("change", loadSelectedTeamSeason);

addPlayerBtn.addEventListener("click", addPlayer);
addLinkBtn.addEventListener("click", addLink);
saveTeamSeasonBtn.addEventListener("click", saveTeamSeason);

initTool();