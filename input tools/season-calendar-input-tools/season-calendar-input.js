const DATA_PATHS = {
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    gamedayCalendar: "../../basketball_101_data_files/wnba_gameday_calendar_data.json"
};

const SAVE_URLS = {
    gamedayGame: "http://127.0.0.1:8787/save-gameday-calendar-game",
    updateGame: "http://127.0.0.1:8787/update-gameday-game"
};

let TEAMS_DATA = {};
let GAMEDAY_CALENDAR_DATA = {};

let CURRENT_MATCHUP_ROWS = [];
let CURRENT_GAME = null;

const seasonSelect = document.getElementById("seasonSelect");

const statusMessage = document.getElementById("statusMessage");

const gameDateInput = document.getElementById("gameDateInput");

const toggleGamedayBuilderBtn = document.getElementById("toggleGamedayBuilderBtn");
const gamedayBuilderContent = document.getElementById("gamedayBuilderContent");

const gamesOnDateInput = document.getElementById("gamesOnDateInput");
const generateGameRowsBtn = document.getElementById("generateGameRowsBtn");
const matchupRowsContainer = document.getElementById("matchupRowsContainer");

const gameEditorPanel = document.getElementById("gameEditorPanel");

const gameContext = document.getElementById("gameContext");
const matchupPanel = document.getElementById("matchupPanel");

const awayScoreLabel = document.getElementById("awayScoreLabel");
const homeScoreLabel = document.getElementById("homeScoreLabel");

const awayScoreInput = document.getElementById("awayScoreInput");
const homeScoreInput = document.getElementById("homeScoreInput");

const isFinalInput = document.getElementById("isFinalInput");

const saveScoreBtn = document.getElementById("saveScoreBtn");

const prevGameBtn = document.getElementById("prevGameBtn");
const nextGameBtn = document.getElementById("nextGameBtn");
const backToCalendarBtn = document.getElementById("backToCalendarBtn");

const scoreStatusMessage =
    document.getElementById("scoreStatusMessage");

const saveGameBtn = document.getElementById("saveGameBtn");
const savedGamesList = document.getElementById("savedGamesList");
const savedGamesPanel =
    document.getElementById("savedGamesPanel");

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

    TEAMS_DATA =
        await loadJson(
            DATA_PATHS.teams,
            { teams: {} }
        );

    GAMEDAY_CALENDAR_DATA =
        await loadJson(
            DATA_PATHS.gamedayCalendar,
            { seasons: {} }
        );

    populateSeasonSelect();

    const { gameId } = getUrlParams();

    if (gameId) {

        document
            .querySelector(".gameday-builder-panel")
            ?.classList.add("hidden");

        savedGamesPanel?.classList.add("hidden");

        initGameEditor();

    } else {

        renderSavedGamesList();
    }
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        seasonId: params.get("season"),
        gameId: params.get("gameId")
    };
}

function loadCurrentGame() {
    const { seasonId, gameId } = getUrlParams();

    CURRENT_GAME =
        GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games?.[gameId]
        || null;
}

function getTeam(teamCode) {
    return TEAMS_DATA?.teams?.[teamCode] || null;
}

function populateSeasonSelect() {

    seasonSelect.innerHTML = "";

    const seasonIds =
        Object.keys(GAMEDAY_CALENDAR_DATA.seasons || {})
        .sort((a, b) => Number(b) - Number(a));

    seasonIds.forEach(seasonId => {

        const option = document.createElement("option");

        option.value = seasonId;
        option.textContent = seasonId;

        seasonSelect.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);

    const seasonFromUrl = params.get("season");

    if (seasonFromUrl) {
        seasonSelect.value = seasonFromUrl;
    }
}

function initGameEditor() {

    loadCurrentGame();

    if (!CURRENT_GAME) {
        return;
    }

    gameEditorPanel.classList.remove("hidden");

    gameEditorPanel.scrollIntoView({
        behavior: "instant",
        block: "start"
    });

    renderGameEditor();
}

function renderGameEditor() {

    if (!CURRENT_GAME) {
        gameContext.textContent = "Game not found.";
        return;
    }

    gameContext.textContent =
        `${CURRENT_GAME.date} • ${CURRENT_GAME.gameType || "regular-season"}`;

    matchupPanel.innerHTML = `
        <h2 class="matchup-title">
            ${getTeamShortName(CURRENT_GAME.awayTeam)}
            at
            ${getTeamShortName(CURRENT_GAME.homeTeam)}
        </h2>

        <div class="team-line">
            <span
                class="team-color-box"
                style="background:${getTeamColor(CURRENT_GAME.awayTeam)}">
            </span>

            <span>
                ${getTeamShortName(CURRENT_GAME.awayTeam)}
            </span>
        </div>

        <p><strong>at</strong></p>

        <div class="team-line">
            <span
                class="team-color-box"
                style="background:${getTeamColor(CURRENT_GAME.homeTeam)}">
            </span>

            <span>
                ${getTeamShortName(CURRENT_GAME.homeTeam)}
            </span>
        </div>
    `;

    awayScoreLabel.textContent =
        `${getTeamShortName(CURRENT_GAME.awayTeam)} Score`;

    homeScoreLabel.textContent =
        `${getTeamShortName(CURRENT_GAME.homeTeam)} Score`;

    awayScoreLabel.style.color =
        getTeamColor(CURRENT_GAME.awayTeam);

    homeScoreLabel.style.color =
        getTeamColor(CURRENT_GAME.homeTeam);

    awayScoreInput.value =
        CURRENT_GAME.score?.awayScore ?? "";

    homeScoreInput.value =
        CURRENT_GAME.score?.homeScore ?? "";

    isFinalInput.checked =
        Boolean(CURRENT_GAME.score?.isFinal);

    updateGameNavButtons();
}

function getWinnerFromScore(awayScore, homeScore) {
    if (awayScore === null || homeScore === null) {
        return null;
    }

    if (awayScore > homeScore) {
        return CURRENT_GAME.awayTeam;
    }

    if (homeScore > awayScore) {
        return CURRENT_GAME.homeTeam;
    }

    return null;
}

function buildUpdatedGameRecord() {
    const awayScore = awayScoreInput.value === ""
        ? null
        : Number(awayScoreInput.value);

    const homeScore = homeScoreInput.value === ""
        ? null
        : Number(homeScoreInput.value);

    return {
        ...CURRENT_GAME,
        score: {
            awayScore,
            homeScore,
            winner: getWinnerFromScore(awayScore, homeScore),
            isFinal: isFinalInput.checked
        }
    };
}

async function saveScore() {
    if (!CURRENT_GAME) {
        scoreStatusMessage.textContent = "No game loaded.";
        return;
    }

    const updatedGame = buildUpdatedGameRecord();

    try {
        const response = await fetch(SAVE_URLS.updateGame, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedGame)
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Save failed");
        }

        CURRENT_GAME = updatedGame;

        scoreStatusMessage.textContent = "Score saved.";
    } catch (error) {
        scoreStatusMessage.textContent = `Save error: ${error.message}`;
    }
}

function getCurrentSeasonGamesSorted() {

    const { seasonId } = getUrlParams();

    return Object.values(
        GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games || {}
    )
    .sort((a, b) => {

        const dateCompare =
            a.date.localeCompare(b.date);

        if (dateCompare !== 0) {
            return dateCompare;
        }

        return a.gameId.localeCompare(b.gameId);
    });
}

function getCurrentGameIndex() {

    const games = getCurrentSeasonGamesSorted();

    return games.findIndex(
        game => game.gameId === CURRENT_GAME?.gameId
    );
}

function updateGameNavButtons() {

    const games = getCurrentSeasonGamesSorted();

    const currentIndex = getCurrentGameIndex();

    prevGameBtn.disabled =
        currentIndex <= 0;

    nextGameBtn.disabled =
        currentIndex === -1 ||
        currentIndex >= games.length - 1;
}

function getTeamColor(teamCode) {
    return getTeam(teamCode)?.branding?.colors?.color1 || "#111";
}

function getActiveTeamsForSeason() {
    return Object.values(TEAMS_DATA.teams || {})
        .filter(team => team.status?.isActive)
        .sort((a, b) => a.name.full.localeCompare(b.name.full));
}

function makeGameId({ date, awayTeam, homeTeam }) {
    return `${date}_${awayTeam}_${homeTeam}`;
}

function renderSavedGamesList() {
    const seasonId = seasonSelect.value;
    const games = Object.values(GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games || {});

    savedGamesList.innerHTML = "";

    if (games.length === 0) {
        savedGamesList.innerHTML = `<p>No games saved for this season yet.</p>`;
        return;
    }

    const gamesByDate = games
        .sort((a, b) => a.date.localeCompare(b.date))
        .reduce((grouped, game) => {
            if (!grouped[game.date]) {
                grouped[game.date] = [];
            }

            grouped[game.date].push(game);
            return grouped;
        }, {});

    Object.entries(gamesByDate).forEach(([date, dateGames]) => {
        const dateGroup = document.createElement("div");
        dateGroup.className = "schedule-date-group";

        dateGroup.innerHTML = `
            <h4>${date}</h4>
            <div class="schedule-games-list"></div>
        `;

        const list = dateGroup.querySelector(".schedule-games-list");

        dateGames.forEach(game => {
            const awayTeam = TEAMS_DATA.teams?.[game.awayTeam];
            const homeTeam = TEAMS_DATA.teams?.[game.homeTeam];

            const item = document.createElement("div");
            item.className = "schedule-game-item";

            item.innerHTML = `
                <span class="team-chip">
                    <span class="team-color-box" style="background:${awayTeam?.branding?.colors?.color1 || "#111"}"></span>
                    ${awayTeam?.name?.short || game.awayTeam}
                </span>

                <span class="at-symbol">at</span>

                <span class="team-chip">
                    <span class="team-color-box" style="background:${homeTeam?.branding?.colors?.color1 || "#111"}"></span>
                    ${homeTeam?.name?.short || game.homeTeam}
                </span>
            `;

            list.appendChild(item);
        });

        savedGamesList.appendChild(dateGroup);
    });
}

function createEmptyMatchupRow(index) {
    return {
        rowId: `row_${index}`,
        awayTeam: null,
        homeTeam: null,
        gameType: "regular-season",
        status: "scheduled",
        entryIds: []
    };
}

function generateMatchupRows() {
    const gameDate = gameDateInput.value;
    const count = Number(gamesOnDateInput.value) || 1;

    if (!gameDate) {
        statusMessage.textContent = "Pick a game date first.";
        return;
    }

    CURRENT_MATCHUP_ROWS = Array.from({ length: count }, (_, index) => {
        return createEmptyMatchupRow(index + 1);
    });

    renderMatchupRows();
}

generateGameRowsBtn.addEventListener("click", generateMatchupRows);

function renderMatchupRows() {
    matchupRowsContainer.innerHTML = "";

    CURRENT_MATCHUP_ROWS.forEach((row, index) => {
        const rowEl = document.createElement("div");
        rowEl.className = "matchup-row";

        rowEl.innerHTML = `
            <div class="matchup-row-header">
                <div>
                    <div class="matchup-row-title">Game ${index + 1}</div>
                    <div class="matchup-row-preview" id="preview-${row.rowId}">
                        ${getRowPreview(row)}
                    </div>
                </div>
            </div>

            <label>
                Game Type
                    <select data-row-id="${row.rowId}" data-field="gameType">
                        <option value="regular-season">Regular Season</option>
                        <option value="playoffs">Pre Season</option>
                        <option value="commissioners-cup">Commissioner's Cup</option>
                        <option value="all-star-game">All-Star Game</option>
                        <option value="postseason">Postseason</option>
                        <option value="special-event">Special Event</option>
                        <option value="other">Other</option>
                    </select>
            </label>

            <div class="matchup-selected-display">
                <div class="selected-team-box">
                    <span class="selected-label">Away</span>
                    <strong>${getTeamShortName(row.awayTeam)}</strong>
                </div>

                <div class="matchup-at">at</div>

                <div class="selected-team-box">
                    <span class="selected-label">Home</span>
                    <strong>${getTeamShortName(row.homeTeam)}</strong>
                </div>
            </div>

            <div class="team-picker-wide" data-row-id="${row.rowId}"></div>

        `;

        matchupRowsContainer.appendChild(rowEl);

        rowEl.querySelector(`[data-field="gameType"]`).value = row.gameType;

        renderRowTeamPicker(row.rowId);
    });

    bindMatchupRowEvents();
}

function getTeamShortName(teamCode) {
    return TEAMS_DATA.teams?.[teamCode]?.name?.short || teamCode || "—";
}

function getReadableTextColor(hexColor) {
    if (!hexColor) return "#fff";

    const cleanHex = hexColor.replace("#", "").trim();

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 150 ? "#000" : "#fff";
}

function getTeamsByConference() {
    const teams = getActiveTeamsForSeason();

    return {
        west: teams.filter(team => team.league?.conference === "west"),
        east: teams.filter(team => team.league?.conference === "east")
    };
}

function getRowPreview(row) {
    if (!row.awayTeam && !row.homeTeam) {
        return "No teams selected yet.";
    }

    return `${getTeamShortName(row.awayTeam)} at ${getTeamShortName(row.homeTeam)}`;
}

function getRowById(rowId) {
    return CURRENT_MATCHUP_ROWS.find(row => row.rowId === rowId);
}

function renderRowTeamPicker(rowId) {
    const row = getRowById(rowId);
    const container = document.querySelector(`[data-row-id="${rowId}"].team-picker-wide`);

    if (!row || !container) return;

    const groupedTeams = getTeamsByConference();

    container.innerHTML = `
        <div class="team-picker-help">
            ${getTeamPickerInstruction(row)}
        </div>

        <div class="conference-team-group">
            <h5>West</h5>
            <div class="team-picker-list" data-conference-list="west"></div>
        </div>

        <div class="conference-team-group">
            <h5>East</h5>
            <div class="team-picker-list" data-conference-list="east"></div>
        </div>
    `;

    ["west", "east"].forEach(conference => {
        const list = container.querySelector(`[data-conference-list="${conference}"]`);

        groupedTeams[conference].forEach(team => {
            const color = team.branding?.colors?.color1 || "#111";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "team-select-pill";
            button.textContent = team.name.short || team.name.full;
            button.style.background = color;
            button.style.color = getReadableTextColor(color);

            if (row.awayTeam === team.teamCode) {
                button.classList.add("selected-away");
            }

            if (row.homeTeam === team.teamCode) {
                button.classList.add("selected-home");
            }

            button.addEventListener("click", () => {
                handleTeamPickForRow(rowId, team.teamCode);
            });

            list.appendChild(button);
        });
    });
}

function getTeamPickerInstruction(row) {
    if (!row.awayTeam) {
        return "Pick the away team first.";
    }

    if (!row.homeTeam) {
        return `${getTeamShortName(row.awayTeam)} selected as away. Now pick the home team.`;
    }

    return `${getTeamShortName(row.awayTeam)} at ${getTeamShortName(row.homeTeam)}`;
}

function handleTeamPickForRow(rowId, teamCode) {
    const row = getRowById(rowId);

    if (!row) return;

    if (!row.awayTeam) {
        row.awayTeam = teamCode;
    } else if (!row.homeTeam && teamCode !== row.awayTeam) {
        row.homeTeam = teamCode;
    } else {
        // If both are already selected, restart the row selection with the clicked team as away.
        row.awayTeam = teamCode;
        row.homeTeam = null;
    }

    renderMatchupRows();
}

function bindMatchupRowEvents() {
    matchupRowsContainer.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("input", () => {
            const row = getRowById(input.dataset.rowId);
            if (!row) return;

            if (input.dataset.field === "entryIds") {
                row.entryIds = input.value
                    .split(",")
                    .map(id => id.trim())
                    .filter(Boolean);
            } else {
                row[input.dataset.field] = input.value;
            }
        });
    });
}

function openGame(game) {
    const { seasonId } = getUrlParams();

    const url =
        `season-calendar-input.html?season=${seasonId}&gameId=${encodeURIComponent(game.gameId)}`;

    window.location.href = url;
}

function goToAdjacentGame(direction) {
    const games = getCurrentSeasonGamesSorted();
    const currentIndex = getCurrentGameIndex();

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;

    if (!games[nextIndex]) return;

    openGame(games[nextIndex]);
}

function goBackToCalendar() {
    const { seasonId } = getUrlParams();

    window.location.href =
        `../../season-calendar.html?season=${seasonId}`;
}


async function saveAllMatchupRows() {
    const date = gameDateInput.value;

    if (!date) {
        statusMessage.textContent = "Pick a game date first.";
        return;
    }

    if (CURRENT_MATCHUP_ROWS.length === 0) {
        statusMessage.textContent = "Generate at least one matchup row first.";
        return;
    }

    for (const row of CURRENT_MATCHUP_ROWS) {
        if (!row.awayTeam || !row.homeTeam) {
            statusMessage.textContent = "Every game row needs an away team and home team.";
            return;
        }

        if (row.awayTeam === row.homeTeam) {
            statusMessage.textContent = "Away team and home team cannot be the same.";
            return;
        }
    }

    try {
        for (const row of CURRENT_MATCHUP_ROWS) {
            const gameRecord = buildGameRecordFromRow(row);

            const response = await fetch(SAVE_URLS.gamedayGame, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(gameRecord)
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || "Save failed");
            }

            if (!GAMEDAY_CALENDAR_DATA.seasons[gameRecord.seasonId]) {
                GAMEDAY_CALENDAR_DATA.seasons[gameRecord.seasonId] = {
                    season: gameRecord.season,
                    seasonId: gameRecord.seasonId,
                    games: {}
                };
            }

            GAMEDAY_CALENDAR_DATA.seasons[gameRecord.seasonId].games[gameRecord.gameId] = gameRecord;
        }

        CURRENT_MATCHUP_ROWS = [];
        matchupRowsContainer.innerHTML = "";
        renderSavedGamesList();

        statusMessage.textContent = `Saved gameday matchups for ${date}.`;
    } catch (error) {
        statusMessage.textContent = `Save error: ${error.message}`;
    }
}

function buildGameRecordFromRow(row) {
    const season = Number(seasonSelect.value);
    const seasonId = String(season);
    const date = gameDateInput.value;

    const gameId = makeGameId({
        date,
        awayTeam: row.awayTeam,
        homeTeam: row.homeTeam
    });

    return {
        gameId,
        season,
        seasonId,
        date,
        awayTeam: row.awayTeam,
        homeTeam: row.homeTeam,
        gameType: row.gameType || "regular-season",
        status: "scheduled",
        entryIds: row.entryIds || []
    };
}

seasonSelect.addEventListener("change", () => {
    renderSeasonForm(seasonSelect.value);
    renderSavedGamesList();
});

toggleGamedayBuilderBtn.addEventListener("click", () => {
    gamedayBuilderContent.classList.toggle("hidden");
});

saveScoreBtn.addEventListener("click", saveScore);

prevGameBtn.addEventListener("click", () => {
    goToAdjacentGame(-1);
});

nextGameBtn.addEventListener("click", () => {
    goToAdjacentGame(1);
});

backToCalendarBtn.addEventListener("click", goBackToCalendar);

saveGameBtn.addEventListener("click", saveAllMatchupRows);

initTool();