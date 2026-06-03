const DATA_PATHS = {
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    awards: "../../basketball_101_data_files/wnba_regular_season_awards_data.json"
};

const SAVE_URL = "http://127.0.0.1:8787/save-regular-season-award";

let TEAMS = {};
let AWARDS_DATA = { seasons: {} };

const seasonInput = document.getElementById("seasonInput");
const awardKeyInput = document.getElementById("awardKeyInput");
const awardNameInput = document.getElementById("awardNameInput");
const recipientNameInput = document.getElementById("recipientNameInput");
const playerIdInput = document.getElementById("playerIdInput");
const teamCodeInput = document.getElementById("teamCodeInput");
const notesInput = document.getElementById("notesInput");
const saveAwardBtn = document.getElementById("saveAwardBtn");
const statusMessage = document.getElementById("statusMessage");
const savedAwardsList = document.getElementById("savedAwardsList");
const awardPresetInput = document.getElementById("awardPresetInput");

let editingAwardId = null;

function makeId(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("season")) {
        seasonInput.value = params.get("season");
    }

    if (params.has("awardId")) {
        editingAwardId = params.get("awardId");
    }

    if (params.has("awardKey")) {
        awardPresetInput.value = "custom";
        awardKeyInput.value = params.get("awardKey");
        awardKeyInput.removeAttribute("readonly");
    }

    if (params.has("awardName")) {
        awardNameInput.value = params.get("awardName");
        awardNameInput.removeAttribute("readonly");
    }

    if (params.has("recipientName")) {
        recipientNameInput.value = params.get("recipientName");
    }

    if (params.has("playerId")) {
        playerIdInput.value = params.get("playerId");
    }

    if (params.has("teamCode")) {
        teamCodeInput.value = params.get("teamCode");
    }
}

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

function populateTeamSelect() {
    teamCodeInput.innerHTML = `<option value="">Select team</option>`;

    Object.values(TEAMS)
        .sort((a, b) => a.name.full.localeCompare(b.name.full))
        .forEach(team => {
            const option = document.createElement("option");
            option.value = team.teamCode;
            option.textContent = team.name.full;
            teamCodeInput.appendChild(option);
        });
}

const AWARD_PRESETS = {
    mvp: "Most Valuable Player",
    dpoy: "Defensive Player of the Year",
    roy: "Rookie of the Year",
    mip: "Most Improved Player",
    sixth_player: "Sixth Player of the Year",
    coach_of_the_year: "Coach of the Year",
    executive_of_the_year: "Executive of the Year",
    sportsmanship: "Sportsmanship Award",
    kim_perrot_sportsmanship: "Kim Perrot Sportsmanship Award"
};

function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("season")) {
        seasonInput.value = params.get("season");
    }

    if (params.has("awardKey")) {
        awardPresetInput.value = "custom";
        awardKeyInput.value = params.get("awardKey");
        awardKeyInput.removeAttribute("readonly");
    }

    if (params.has("awardName")) {
        awardNameInput.value = params.get("awardName");
        awardNameInput.removeAttribute("readonly");
    }

    if (params.has("recipientName")) {
        recipientNameInput.value = params.get("recipientName");
    }

    if (params.has("playerId")) {
        playerIdInput.value = params.get("playerId");
    }

    if (params.has("teamCode")) {
        teamCodeInput.value = params.get("teamCode");
    }
}

function buildAwardData() {
    const seasonId = String(seasonInput.value).trim();
    const awardKey = makeId(awardKeyInput.value);
    const awardId =
        editingAwardId ||
        `${seasonId}_${awardKey}`;
    const playerName = recipientNameInput.value.trim();
    const playerId = makeId(playerIdInput.value || playerName);

    return {
        awardId,
        season: Number(seasonId),
        seasonId,
        awardKey,
        awardName: awardNameInput.value.trim(),
        recipient: {
            playerId,
            playerName,
            teamCode: teamCodeInput.value
        },
        notes: notesInput.value.trim(),
        links: [],
        entryIds: []
    };
}

function renderSavedAwards() {
    const seasonId = String(seasonInput.value).trim();
    const seasonAwards = AWARDS_DATA.seasons?.[seasonId]?.awards || {};

    savedAwardsList.innerHTML = "";

    Object.values(seasonAwards).forEach(award => {
        const card = document.createElement("div");
        card.className = "award-card";

        card.innerHTML = `
            <div class="award-card-title">${award.awardName}</div>
            <div class="award-card-meta">
                ${award.recipient?.playerName || "Unknown"} · ${getTeamName(award.recipient?.teamCode)}
            </div>
        `;

        savedAwardsList.appendChild(card);
    });

    if (!savedAwardsList.innerHTML) {
        savedAwardsList.innerHTML = `<p>No awards saved for this season yet.</p>`;
    }
}

async function saveAward() {
    const awardData = buildAwardData();

    if (!awardData.seasonId || !awardData.awardKey || !awardData.awardName || !awardData.recipient.playerName) {
        statusMessage.textContent = "Please fill in season, award key, award name, and recipient name.";
        return;
    }

    const response = await fetch(SAVE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(awardData)
    });

    const result = await response.json();

    if (!result.ok) {
        statusMessage.textContent = result.error || "Save failed.";
        return;
    }

    if (!AWARDS_DATA.seasons[awardData.seasonId]) {
        AWARDS_DATA.seasons[awardData.seasonId] = {
            season: awardData.season,
            seasonId: awardData.seasonId,
            awards: {}
        };
    }

    AWARDS_DATA.seasons[awardData.seasonId].awards[awardData.awardId] = awardData;

    statusMessage.textContent = result.message;
    renderSavedAwards();
}

recipientNameInput.addEventListener("input", () => {
    playerIdInput.value = makeId(recipientNameInput.value);
});

awardKeyInput.addEventListener("input", () => {
    awardKeyInput.value = makeId(awardKeyInput.value);
});

awardPresetInput.addEventListener("change", () => {
    const selectedAwardKey = awardPresetInput.value;

    if (!selectedAwardKey || selectedAwardKey === "custom") {
        awardKeyInput.value = "";
        awardNameInput.value = "";
        awardKeyInput.removeAttribute("readonly");
        awardNameInput.removeAttribute("readonly");
        return;
    }

    awardKeyInput.value = selectedAwardKey;
    awardNameInput.value = AWARD_PRESETS[selectedAwardKey] || "";

    awardKeyInput.setAttribute("readonly", "readonly");
    awardNameInput.setAttribute("readonly", "readonly");
});

seasonInput.addEventListener("change", renderSavedAwards);
saveAwardBtn.addEventListener("click", saveAward);

async function init() {
    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    TEAMS = teamsData.teams || {};

    AWARDS_DATA = await loadJson(DATA_PATHS.awards, { seasons: {} });

        populateTeamSelect();
        applyUrlParams();
        renderSavedAwards();
}

init();