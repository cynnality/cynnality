const DATA_PATHS = {
    legacyAwards: "../../basketball_101_data_files/wnba_reg_season_awards.json"
};

const INPUT_TOOL_PATH =
    "../regular-season-awards-input-tools/regular-season-awards-input-tool.html";

let LEGACY_AWARDS = {};

const seasonSelect = document.getElementById("seasonSelect");
const seasonTitle = document.getElementById("seasonTitle");
const awardsList = document.getElementById("awardsList");

const openSeasonMigrationBtn = document.getElementById("openSeasonMigrationBtn");

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

function makeId(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function populateSeasonSelect() {
    const seasons = Object.keys(LEGACY_AWARDS).sort((a, b) => Number(b) - Number(a));

    seasonSelect.innerHTML = "";

    seasons.forEach(season => {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = season;
        seasonSelect.appendChild(option);
    });

    if (seasons.includes("2025")) {
        seasonSelect.value = "2025";
    }
}

function buildEditorUrl(season, award) {
    const params = new URLSearchParams();

    params.set("season", season);
    params.set("legacyAwardId", award.id || "");
    params.set("awardKey", makeId(award.id || award.award));
    params.set("awardName", award.award || "");
    params.set("recipientName", award.winner || "");
    params.set("playerId", makeId(award.winner || ""));
    params.set("teamCode", award.teamCode || "");
    params.set("legacyType", award.type || "");

    return `${INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildSeasonMigrationUrl(season) {
    const params = new URLSearchParams();

    params.set("migrationSeason", season);

    return `${INPUT_TOOL_PATH}?${params.toString()}`;
}

function renderAwardsForSeason() {
    const season = seasonSelect.value;
    const awards = LEGACY_AWARDS[season] || [];

    seasonTitle.textContent = `${season} Regular Season Awards`;
    awardsList.innerHTML = "";

    if (!awards.length) {
        awardsList.innerHTML = `<p>No awards found for this season.</p>`;
        return;
    }

    awards.forEach((award, index) => {
        const card = document.createElement("article");
        card.className = "award-card";

        const editorUrl = buildEditorUrl(season, award);

        card.innerHTML = `
            <h3>${award.award || "Unnamed Award"}</h3>

            <div class="award-meta">
                <span><strong>Legacy ID:</strong> ${award.id || "none"}</span>
                <span><strong>Type:</strong> ${award.type || "none"}</span>
                <span><strong>Winner:</strong> ${award.winner || "none"}</span>
                <span><strong>Team:</strong> ${award.team || "none"} ${award.teamCode ? `(${award.teamCode})` : ""}</span>
            </div>

            <div class="award-actions">
                <button type="button" data-editor-url="${editorUrl}">
                    Open in New Awards Input Tool
                </button>
            </div>
        `;

        card.querySelector("button").addEventListener("click", event => {
            window.location.href = event.currentTarget.dataset.editorUrl;
        });

        awardsList.appendChild(card);
    });
}

seasonSelect.addEventListener("change", renderAwardsForSeason);

openSeasonMigrationBtn.addEventListener("click", () => {
    const season = seasonSelect.value;

    if (!season) return;

    window.location.href = buildSeasonMigrationUrl(season);
});

async function init() {
    LEGACY_AWARDS = await loadJson(DATA_PATHS.legacyAwards, {});

    populateSeasonSelect();
    renderAwardsForSeason();
}

init();