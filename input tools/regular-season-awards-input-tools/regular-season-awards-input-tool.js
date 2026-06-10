const DATA_PATHS = {
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    awards: "../../basketball_101_data_files/wnba_regular_season_awards_data.json",
    legacyAwards: "../../basketball_101_data_files/wnba_reg_season_awards.json"
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

const singleAwardPanel = document.getElementById("singleAwardPanel");
const migrationPanel = document.getElementById("migrationPanel");
const migrationTitle = document.getElementById("migrationTitle");
const migrationAwardsEditor = document.getElementById("migrationAwardsEditor");
const saveMigrationSeasonBtn = document.getElementById("saveMigrationSeasonBtn");

let editingAwardId = null;

let LEGACY_AWARDS = {};
let migrationSeason = null;

function makeId(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getAwardKeyFromLegacy(legacyAward) {
    const legacyId = legacyAward.id || "";

    const AWARD_KEY_MAP = {
        MVP: "mvp",
        defensivePlayerOfTheYear: "dpoy",
        rookieOfTheYear: "roy",
        mostImprovedPlayer: "mip",
        sixthPlayerOfTheYear: "sixth_player",
        coachOfTheYear: "coach_of_the_year",
        executiveOfTheYear: "executive_of_the_year",
        sportsmanshipAward: "kim_perrot_sportsmanship"
    };

    return AWARD_KEY_MAP[legacyId] || makeId(legacyId || legacyAward.award);
}

function getAwardNameFromLegacy(legacyAward, awardKey) {
    const AWARD_NAME_MAP = {
        mvp: "Most Valuable Player",
        dpoy: "Defensive Player of the Year",
        roy: "Rookie of the Year",
        mip: "Most Improved Player",
        sixth_player: "Sixth Player of the Year",
        coach_of_the_year: "Coach of the Year",
        executive_of_the_year: "Executive of the Year",
        kim_perrot_sportsmanship: "Kim Perrot Sportsmanship Award"
    };

    return AWARD_NAME_MAP[awardKey] || legacyAward.award || "";
}

function convertLegacyAwardToNewAward(seasonId, legacyAward) {
    const awardKey = getAwardKeyFromLegacy(legacyAward);
    const awardName = getAwardNameFromLegacy(legacyAward, awardKey);
    const playerName = legacyAward.winner || "";
    const playerId = makeId(playerName);

    return {
        awardId: `${seasonId}_${awardKey}`,
        season: Number(seasonId),
        seasonId,
        awardKey,
        awardName,
        recipient: {
            playerId,
            playerName,
            teamCode: legacyAward.teamCode || ""
        },
        notes: "",
        links: [],
        entryIds: [],
        legacy: {
            legacyAwardId: legacyAward.id || "",
            legacyType: legacyAward.type || "",
            legacyAwardName: legacyAward.award || "",
            legacyTeamName: legacyAward.team || ""
        }
    };
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

function getAwardPresetOptionsHtml(selectedAwardKey = "") {
    return `
        <option value="">Select award</option>
        ${Object.entries(AWARD_PRESETS).map(([key, name]) => `
            <option value="${key}" ${key === selectedAwardKey ? "selected" : ""}>
                ${name}
            </option>
        `).join("")}
        <option value="custom" ${selectedAwardKey && !AWARD_PRESETS[selectedAwardKey] ? "selected" : ""}>
            Custom / Other
        </option>
    `;
}

function getTeamOptionsHtml(selectedTeamCode = "") {
    return `
        <option value="">Select team</option>
        ${Object.values(TEAMS)
            .sort((a, b) => a.name.full.localeCompare(b.name.full))
            .map(team => `
                <option value="${team.teamCode}" ${team.teamCode === selectedTeamCode ? "selected" : ""}>
                    ${team.name.full}
                </option>
            `).join("")}
    `;
}

function getTeamName(teamCode) {
    if (!teamCode) return "No team";

    return TEAMS?.[teamCode]?.name?.full || teamCode;
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

function checkForMigrationMode() {
    const params = new URLSearchParams(window.location.search);

    if (!params.has("migrationSeason")) return;

    migrationSeason = params.get("migrationSeason");
}

function renderMigrationEditor() {
    if (!migrationSeason) return;

    const legacyAwards = LEGACY_AWARDS[migrationSeason] || [];

    singleAwardPanel.hidden = true;
    migrationPanel.hidden = false;

    seasonInput.value = migrationSeason;
    migrationTitle.textContent = `${migrationSeason} Regular Season Awards Migration`;

    if (!legacyAwards.length) {
        migrationAwardsEditor.innerHTML = `<p>No legacy awards found for ${migrationSeason}.</p>`;
        return;
    }

    const convertedAwards = legacyAwards.map(legacyAward =>
        convertLegacyAwardToNewAward(migrationSeason, legacyAward)
    );

    migrationAwardsEditor.innerHTML = convertedAwards.map((award, index) => {
        return `
            <article class="award-card migration-award-card" data-index="${index}">
                <h3>${award.awardName}</h3>

                <div class="form-grid">
                    <label>
                        Award Preset
                        <select class="migration-award-preset">
                            ${getAwardPresetOptionsHtml(award.awardKey)}
                        </select>
                    </label>

                    <label>
                        Award Key
                        <input class="migration-award-key" value="${award.awardKey}">
                    </label>

                    <label>
                        Award Name
                        <input class="migration-award-name" value="${award.awardName}">
                    </label>

                    <label>
                        Recipient Name
                        <input class="migration-recipient-name" value="${award.recipient.playerName}">
                    </label>

                    <label>
                        Player ID
                        <input class="migration-player-id" value="${award.recipient.playerId}">
                    </label>

                    <label>
                        Team
                        <select class="migration-team-code">
                            ${getTeamOptionsHtml(award.recipient.teamCode)}
                        </select>
                    </label>
                </div>

                <label>
                    Notes
                    <textarea class="migration-notes" rows="3">${award.notes || ""}</textarea>
                </label>

                <p class="status-message">
                    Legacy: ${award.legacy.legacyAwardId || "none"} · 
                    ${award.legacy.legacyAwardName || "no legacy name"} · 
                    ${award.legacy.legacyType || "no type"}
                </p>
            </article>
        `;
    }).join("");

    migrationAwardsEditor.querySelectorAll(".migration-recipient-name").forEach(input => {
        input.addEventListener("input", event => {
            const card = event.target.closest(".migration-award-card");
            const playerIdInput = card.querySelector(".migration-player-id");
            playerIdInput.value = makeId(event.target.value);
        });
    });

    migrationAwardsEditor.querySelectorAll(".migration-award-key").forEach(input => {
        input.addEventListener("input", event => {
            event.target.value = makeId(event.target.value);
        });
    });

    migrationAwardsEditor.querySelectorAll(".migration-award-preset").forEach(select => {
        select.addEventListener("change", event => {
            const selectedAwardKey = event.target.value;
            const card = event.target.closest(".migration-award-card");

            const awardKeyInput = card.querySelector(".migration-award-key");
            const awardNameInput = card.querySelector(".migration-award-name");

            if (!selectedAwardKey || selectedAwardKey === "custom") {
                awardKeyInput.removeAttribute("readonly");
                awardNameInput.removeAttribute("readonly");
                return;
            }

            awardKeyInput.value = selectedAwardKey;
            awardNameInput.value = AWARD_PRESETS[selectedAwardKey] || "";

            awardKeyInput.setAttribute("readonly", "readonly");
            awardNameInput.setAttribute("readonly", "readonly");
        });
    });
}

function collectMigrationAwardsFromEditor() {
    const seasonId = String(migrationSeason);

    return Array.from(
        migrationAwardsEditor.querySelectorAll(".migration-award-card")
    ).map(card => {
        const awardKey = makeId(card.querySelector(".migration-award-key").value);
        const awardName = card.querySelector(".migration-award-name").value.trim();
        const playerName = card.querySelector(".migration-recipient-name").value.trim();
        const playerId = makeId(card.querySelector(".migration-player-id").value || playerName);
        const teamCode = card.querySelector(".migration-team-code").value;
        const notes = card.querySelector(".migration-notes").value.trim();

        return {
            awardId: `${seasonId}_${awardKey}`,
            season: Number(seasonId),
            seasonId,
            awardKey,
            awardName,
            recipient: {
                playerId,
                playerName,
                teamCode
            },
            notes,
            links: [],
            entryIds: []
        };
    });
}

async function saveMigrationSeason() {
    const awards = collectMigrationAwardsFromEditor();

    if (!awards.length) {
        statusMessage.textContent = "No migration awards to save.";
        return;
    }

    for (const awardData of awards) {
        if (!awardData.awardKey || !awardData.awardName || !awardData.recipient.playerName) {
            statusMessage.textContent = "Please fill in award key, award name, and recipient for every award.";
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
            statusMessage.textContent = result.error || `Save failed for ${awardData.awardName}.`;
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
    }

    statusMessage.textContent = `${awards.length} awards saved for ${migrationSeason}.`;
    renderSavedAwards();
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

saveMigrationSeasonBtn.addEventListener("click", saveMigrationSeason);

seasonInput.addEventListener("change", renderSavedAwards);
saveAwardBtn.addEventListener("click", saveAward);

async function init() {
    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    TEAMS = teamsData.teams || {};

    AWARDS_DATA = await loadJson(DATA_PATHS.awards, { seasons: {} });
    LEGACY_AWARDS = await loadJson(DATA_PATHS.legacyAwards, {});

    populateTeamSelect();
    checkForMigrationMode();
    applyUrlParams();

    if (migrationSeason) {
        renderMigrationEditor();
    }

    renderSavedAwards();
}

init();