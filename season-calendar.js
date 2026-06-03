const DATA_PATHS = {
    seasonGeneralInfo: "../../basketball_101_data_files/wnba_season_general_info_data.json",
    gamedayCalendar: "../../basketball_101_data_files/wnba_gameday_calendar_data.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json"
};

let SEASON_GENERAL_INFO_DATA = {};
let GAMEDAY_CALENDAR_DATA = {};
let TEAMS_DATA = {};

const seasonSelect = document.getElementById("seasonSelect");
const calendarGrid = document.getElementById("calendarGrid");
const selectedGamePanel = document.getElementById("selectedGamePanel");

const openMatchupEditorBtn = document.getElementById("openMatchupEditorBtn");

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

async function initViewer() {
    SEASON_GENERAL_INFO_DATA = await loadJson(DATA_PATHS.seasonGeneralInfo, { seasons: {} });
    GAMEDAY_CALENDAR_DATA = await loadJson(DATA_PATHS.gamedayCalendar, { seasons: {} });
    TEAMS_DATA = await loadJson(DATA_PATHS.teams, { teams: {} });

    renderSeasonOptions();
    renderCalendar();
}

function renderSeasonOptions() {
    const seasonIds = Object.keys(GAMEDAY_CALENDAR_DATA.seasons || {}).sort();

    seasonSelect.innerHTML = "";

    seasonIds.forEach(seasonId => {
        const option = document.createElement("option");
        option.value = seasonId;
        option.textContent = seasonId;
        seasonSelect.appendChild(option);
    });

    if (seasonIds.includes("2026")) {
        seasonSelect.value = "2026";
    }
}

function getSelectedSeasonId() {
    return seasonSelect.value;
}

function getGamesForSeason() {
    const seasonId = getSelectedSeasonId();

    return Object.values(
        GAMEDAY_CALENDAR_DATA?.seasons?.[seasonId]?.games || {}
    );
}

// helper functions for new "week" calendar organization
// =============================================================================
function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMondayOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay(); // Sun = 0, Mon = 1
    const diff = day === 0 ? -6 : 1 - day;

    copy.setDate(copy.getDate() + diff);
    return copy;
}

function getWeekDates(startDate) {
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        return date;
    });
}
// =============================================================================

function openSeasonCalendarInputTool() {
    const seasonId = getSelectedSeasonId() || "2026";

    const inputToolUrl =
        `../../input%20tools/season-calendar-input-tools/season-calendar-input.html?season=${seasonId}&section=gameday`;

    window.location.href = inputToolUrl;
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

function groupGamesByDate(games) {
    return games
        .sort((a, b) => a.date.localeCompare(b.date))
        .reduce((groups, game) => {
            if (!groups[game.date]) {
                groups[game.date] = [];
            }

            groups[game.date].push(game);
            return groups;
        }, {});
}

function renderCalendar() {
    const games = getGamesForSeason();

    calendarGrid.innerHTML = "";

    if (games.length === 0) {
        calendarGrid.innerHTML = `<p>No gameday matchups saved for this season yet.</p>`;
        return;
    }

    const gamesByDate = groupGamesByDate(games);
    const sortedDates = Object.keys(gamesByDate).sort();

    const firstGameDate = parseLocalDate(sortedDates[0]);
    const lastGameDate = parseLocalDate(sortedDates[sortedDates.length - 1]);

    let currentWeekStart = getMondayOfWeek(firstGameDate);

    while (currentWeekStart <= lastGameDate) {
        const weekRow = document.createElement("section");
        weekRow.className = "calendar-week-row";

        const weekDates = getWeekDates(currentWeekStart);

        weekDates.forEach(dateObj => {
            const dateKey = formatDateKey(dateObj);
            const dayGames = gamesByDate[dateKey] || [];

            const dayColumn = document.createElement("div");
            dayColumn.className = "calendar-day-column";

            dayColumn.innerHTML = `
                <div class="day-heading">
                    <span class="day-name">${dateObj.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span class="day-date">${dateKey}</span>
                </div>

                <div class="day-games"></div>
            `;

            const dayGamesContainer = dayColumn.querySelector(".day-games");

            dayGames.forEach(game => {
                const cell = document.createElement("button");
                cell.type = "button";
                cell.className = "compact-matchup-cell";

                cell.innerHTML = `
                    <span class="compact-team away">
                        <span class="team-color-box" style="background:${getTeamColor(game.awayTeam)}"></span>
                        ${getTeamLabel(game.awayTeam)}
                    </span>

                    <span class="compact-team home">
                        ${getTeamLabel(game.homeTeam)}
                        <span class="team-color-box" style="background:${getTeamColor(game.homeTeam)}"></span>
                    </span>
                `;

                cell.addEventListener("click", () => {
                    openGamedayEntryTool(game);
                });

                dayGamesContainer.appendChild(cell);
            });

            weekRow.appendChild(dayColumn);
        });

        calendarGrid.appendChild(weekRow);

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
}

function renderSelectedGame(game) {
    selectedGamePanel.innerHTML = `
        <h2>${getTeamLabel(game.awayTeam)} at ${getTeamLabel(game.homeTeam)}</h2>
        <p><strong>Date:</strong> ${game.date}</p>
        <p><strong>Game ID:</strong> ${game.gameId}</p>
        <p><strong>Type:</strong> ${game.gameType || "regular-season"}</p>

        <p class="placeholder-note">
            Future: this click can open the score/editor/entry page.
        </p>
    `;
}

seasonSelect.addEventListener("change", renderCalendar);

openMatchupEditorBtn.addEventListener("click", openSeasonCalendarInputTool);

function openGamedayEntryTool(game) {

    const editorUrl =
        `../../input%20tools/season-calendar-input-tools/season-calendar-input.html?season=${game.seasonId}&gameId=${encodeURIComponent(game.gameId)}`;

    window.location.href = editorUrl;
}

initViewer();