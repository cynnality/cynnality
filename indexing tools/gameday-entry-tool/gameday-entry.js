const DATA_PATHS = {
    gamedayCalendar: "../../basketball_101_data_files/wnba_gameday_calendar_data.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json"
};

const SAVE_URLS = {
    updateGame: "http://127.0.0.1:8787/update-gameday-game"
};

let GAMEDAY_CALENDAR_DATA = {};
let TEAMS_DATA = {};
let CURRENT_GAME = null;

const gameContext = document.getElementById("gameContext");
const matchupPanel = document.getElementById("matchupPanel");

const prevGameBtn = document.getElementById("prevGameBtn");
const nextGameBtn = document.getElementById("nextGameBtn");
const backToCalendarBtn = document.getElementById("backToCalendarBtn");

const awayScoreLabel = document.getElementById("awayScoreLabel");
const homeScoreLabel = document.getElementById("homeScoreLabel");

const awayScoreInput = document.getElementById("awayScoreInput");
const homeScoreInput = document.getElementById("homeScoreInput");
const isFinalInput = document.getElementById("isFinalInput");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const statusMessage = document.getElementById("statusMessage");

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        seasonId: params.get("season"),
        gameId: params.get("gameId")
    };
}

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
    GAMEDAY_CALENDAR_DATA = await loadJson(DATA_PATHS.gamedayCalendar, { seasons: {} });
    TEAMS_DATA = await loadJson(DATA_PATHS.teams, { teams: {} });

    loadCurrentGame();
    renderPage();
}

function loadCurrentGame() {
    const { seasonId, gameId } = getUrlParams();

    CURRENT_GAME = GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games?.[gameId] || null;
}

function getTeam(teamCode) {
    return TEAMS_DATA?.teams?.[teamCode] || null;
}

function getTeamLabel(teamCode) {
    return getTeam(teamCode)?.name?.short || teamCode;
}

function getTeamColor(teamCode) {
    return getTeam(teamCode)?.branding?.colors?.color1 || "#111";
}

function getCurrentSeasonGamesSorted() {
    const { seasonId } = getUrlParams();

    return Object.values(GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games || {})
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);

            if (dateCompare !== 0) {
                return dateCompare;
            }

            return a.gameId.localeCompare(b.gameId);
        });
}

function getCurrentGameIndex() {
    const games = getCurrentSeasonGamesSorted();

    return games.findIndex(game => game.gameId === CURRENT_GAME?.gameId);
}

function openGame(game) {
    const { seasonId } = getUrlParams();

    const url =
        `gameday-entry.html?season=${seasonId}&gameId=${encodeURIComponent(game.gameId)}`;

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
        `../../index%20pages/season-calendar/season-calendar.html?season=${seasonId}`;
}

function updateGameNavButtons() {
    const games = getCurrentSeasonGamesSorted();
    const currentIndex = getCurrentGameIndex();

    prevGameBtn.disabled = currentIndex <= 0;
    nextGameBtn.disabled = currentIndex === -1 || currentIndex >= games.length - 1;
}

function renderPage() {
    if (!CURRENT_GAME) {
        gameContext.textContent = "Game not found. Check the season and gameId in the URL.";
        matchupPanel.innerHTML = `<p>No game loaded.</p>`;
        return;
    }

    gameContext.textContent = `${CURRENT_GAME.date} • ${CURRENT_GAME.gameId}`;

    matchupPanel.innerHTML = `
        <h2 class="matchup-title">
            ${getTeamLabel(CURRENT_GAME.awayTeam)} at ${getTeamLabel(CURRENT_GAME.homeTeam)}
        </h2>

        <div class="team-line">
            <span class="team-color-box" style="background:${getTeamColor(CURRENT_GAME.awayTeam)}"></span>
            <span>${getTeamLabel(CURRENT_GAME.awayTeam)}</span>
        </div>

        <p><strong>at</strong></p>

        <div class="team-line">
            <span class="team-color-box" style="background:${getTeamColor(CURRENT_GAME.homeTeam)}"></span>
            <span>${getTeamLabel(CURRENT_GAME.homeTeam)}</span>
        </div>
    `;

    const awayTeamLabel = getTeamLabel(CURRENT_GAME.awayTeam);
    const homeTeamLabel = getTeamLabel(CURRENT_GAME.homeTeam);
    awayScoreLabel.textContent = `${awayTeamLabel} Score`;
    homeScoreLabel.textContent = `${homeTeamLabel} Score`;
    awayScoreLabel.style.color = getTeamColor(CURRENT_GAME.awayTeam);
    homeScoreLabel.style.color = getTeamColor(CURRENT_GAME.homeTeam);

    awayScoreInput.value = CURRENT_GAME.score?.awayScore ?? "";
    homeScoreInput.value = CURRENT_GAME.score?.homeScore ?? "";
    isFinalInput.checked = Boolean(CURRENT_GAME.score?.isFinal);

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
        statusMessage.textContent = "No game loaded.";
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

        statusMessage.textContent = "Score saved.";
    } catch (error) {
        statusMessage.textContent = `Save error: ${error.message}`;
    }
}

prevGameBtn.addEventListener("click", () => {
    goToAdjacentGame(-1);
});

nextGameBtn.addEventListener("click", () => {
    goToAdjacentGame(1);
});

backToCalendarBtn.addEventListener("click", goBackToCalendar);

saveScoreBtn.addEventListener("click", saveScore);

initTool();