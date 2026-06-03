const DATA_PATHS = {
    seasonStats: "../../basketball_101_data_files/wnba_season_stats.json",
    seasonGeneralInfo: "../../basketball_101_data_files/wnba_season_general_info_data.json"
};

const SAVE_URLS = {
    seasonGeneralInfo: "http://127.0.0.1:8787/save-season-general-info"
};

let SEASON_STATS = {};
let SEASON_CALENDAR_DATA = {};
let CURRENT_LINKS = [];

const seasonSelect = document.getElementById("seasonSelect");
const addSeasonBtn = document.getElementById("addSeasonBtn");

const startDateInput = document.getElementById("startDateInput");
const endDateInput = document.getElementById("endDateInput");
const regularSeasonGamesInput = document.getElementById("regularSeasonGamesInput");
const numTeamsInput = document.getElementById("numTeamsInput");
const isCbaSeasonInput = document.getElementById("isCbaSeasonInput");

const isExpansionYearInput = document.getElementById("isExpansionYearInput");
const hasFoldedTeamsInput = document.getElementById("hasFoldedTeamsInput");
const hasRelocationsInput = document.getElementById("hasRelocationsInput");
const hasDispersalDraftInput = document.getElementById("hasDispersalDraftInput");
const hasExpansionDraftInput = document.getElementById("hasExpansionDraftInput");

const specialSeasonTypeInput = document.getElementById("specialSeasonTypeInput");
const notesInput = document.getElementById("notesInput");
const saveSeasonBtn = document.getElementById("saveSeasonBtn");
const statusMessage = document.getElementById("statusMessage");

const linkTitleInput = document.getElementById("linkTitleInput");
const linkUrlInput = document.getElementById("linkUrlInput");
const linkDescriptionInput = document.getElementById("linkDescriptionInput");
const addLinkBtn = document.getElementById("addLinkBtn");
const linksList = document.getElementById("linksList");

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) return fallback;
        return await response.json();
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

async function initTool() {
    SEASON_STATS = await loadJson(DATA_PATHS.seasonStats, {});
    SEASON_CALENDAR_DATA = await loadJson(
        DATA_PATHS.seasonGeneralInfo,
        { seasons: {} }
    );

    populateSeasonSelect();

    renderSeasonForm(seasonSelect.value);
}

function getSeasonInfoFromStats(season) {
    return SEASON_STATS?.[season]?.seasonInfo || {};
}

function getSeasonCalendarRecord(season) {
    return SEASON_CALENDAR_DATA?.seasons?.[season] || null;
}

function populateSeasonSelect() {
    seasonSelect.innerHTML = "";

    const seasons = new Set();

    Object.keys(SEASON_STATS || {}).forEach(year => {
        seasons.add(year);
    });

    Object.keys(SEASON_CALENDAR_DATA?.seasons || {}).forEach(year => {
        seasons.add(year);
    });

    [...seasons]
        .sort((a, b) => Number(b) - Number(a))
        .forEach(year => {
            const option = document.createElement("option");

            option.value = year;
            option.textContent = year;

            seasonSelect.appendChild(option);
        });
}

function renderSeasonForm(season) {
    const statsInfo = getSeasonInfoFromStats(season);
    const savedRecord = getSeasonCalendarRecord(season);

    startDateInput.value = savedRecord?.startDate || statsInfo.startDate || "";
    endDateInput.value = savedRecord?.endDate || statsInfo.endDate || "";

    regularSeasonGamesInput.value =
        savedRecord?.regularSeasonGamesPerTeam ||
        savedRecord?.regularSeasonGames ||
        statsInfo.regSeasonGames ||
        "";

    numTeamsInput.value = savedRecord?.numTeams || statsInfo.numTeams || "";

    isCbaSeasonInput.value = String(savedRecord?.isCbaSeason ?? false);
    specialSeasonTypeInput.value = savedRecord?.specialSeasonType || "";
    notesInput.value = savedRecord?.notes || "";

    const savedFlags = savedRecord?.flags || {};

    isExpansionYearInput.value = String(savedFlags.isExpansionYear ?? false);
    hasFoldedTeamsInput.value = String(savedFlags.hasFoldedTeams ?? false);
    hasRelocationsInput.value = String(savedFlags.hasRelocations ?? false);
    hasDispersalDraftInput.value = String(savedFlags.hasDispersalDraft ?? false);
    hasExpansionDraftInput.value = String(savedFlags.hasExpansionDraft ?? false);

    CURRENT_LINKS = Array.isArray(savedRecord?.links) ? [...savedRecord.links] : [];

    renderLinksList();
}

function renderLinksList() {
    linksList.innerHTML = "";

    if (CURRENT_LINKS.length === 0) {
        linksList.innerHTML = `<p>No links added yet.</p>`;
        return;
    }

    CURRENT_LINKS.forEach((link, index) => {
        const item = document.createElement("div");
        item.className = "link-item";

        item.innerHTML = `
            <strong>${link.title}</strong>
            <p>${link.url}</p>
            <p>${link.description || ""}</p>
            <button type="button" data-remove-link="${index}">Remove</button>
        `;

        linksList.appendChild(item);
    });

    linksList.querySelectorAll("[data-remove-link]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.removeLink);
            CURRENT_LINKS.splice(index, 1);
            renderLinksList();
        });
    });
}

function addSeasonLink() {
    const title = linkTitleInput.value.trim();
    const url = linkUrlInput.value.trim();
    const description = linkDescriptionInput.value.trim();

    if (!title || !url) {
        statusMessage.textContent = "Link title and URL are required.";
        return;
    }

    CURRENT_LINKS.push({ title, url, description });

    linkTitleInput.value = "";
    linkUrlInput.value = "";
    linkDescriptionInput.value = "";

    renderLinksList();
}

function buildSeasonRecord() {
    const season = Number(seasonSelect.value);
    const seasonId = String(season);

    const gamesPerTeam = Number(regularSeasonGamesInput.value) || null;
    const numTeams = Number(numTeamsInput.value) || null;

    const existingRecord = getSeasonCalendarRecord(seasonId);

    return {
        season,
        seasonId,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        regularSeasonGamesPerTeam: gamesPerTeam,
        regularSeasonTeamGameSlots: gamesPerTeam && numTeams
            ? gamesPerTeam * numTeams
            : null,
        numTeams,
        isCbaSeason: isCbaSeasonInput.value === "true",
        flags: {
            isCbaSeason: isCbaSeasonInput.value === "true",
            isExpansionYear: isExpansionYearInput.value === "true",
            hasFoldedTeams: hasFoldedTeamsInput.value === "true",
            hasRelocations: hasRelocationsInput.value === "true",
            hasDispersalDraft: hasDispersalDraftInput.value === "true",
            hasExpansionDraft: hasExpansionDraftInput.value === "true",
            hasCollegeDraft: true,
            hasPlayoffs: true,
            hasRegularSeasonAwards: true
        },
        specialSeasonType: specialSeasonTypeInput.value.trim() || null,
        notes: notesInput.value.trim(),
        links: CURRENT_LINKS,
        cells: existingRecord?.cells || {},
        entryIds: existingRecord?.entryIds || []
    };
}

async function saveSeasonCalendar() {
    const seasonRecord = buildSeasonRecord();

    try {
        const response = await fetch(SAVE_URLS.seasonGeneralInfo, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(seasonRecord)
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Save failed");
        }

        if (!SEASON_CALENDAR_DATA.seasons) {
            SEASON_CALENDAR_DATA.seasons = {};
        }

        SEASON_CALENDAR_DATA.seasons[seasonRecord.seasonId] = seasonRecord;

        statusMessage.textContent = `Saved season ${seasonRecord.seasonId}.`;
    } catch (error) {
        statusMessage.textContent = `Save error: ${error.message}`;
    }
}

seasonSelect.addEventListener("change", () => {
    renderSeasonForm(seasonSelect.value);
});

addSeasonBtn.addEventListener("click", () => {
    const year = prompt("Season year?");

    if (!year) return;

    if (!SEASON_CALENDAR_DATA.seasons[year]) {
        SEASON_CALENDAR_DATA.seasons[year] = {
            season: Number(year),
            seasonId: year
        };
    }

    populateSeasonSelect();

    seasonSelect.value = year;

    renderSeasonForm(year);
});

saveSeasonBtn.addEventListener("click", saveSeasonCalendar);
addLinkBtn.addEventListener("click", addSeasonLink);

initTool();