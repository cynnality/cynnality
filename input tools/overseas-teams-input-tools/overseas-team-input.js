const DATA_PATHS = {
    leagues: [
        "../../basketball_101_data_files/overseas_leagues_data.json",
        "../basketball_101_data_files/overseas_leagues_data.json",
        "/basketball_101_data_files/overseas_leagues_data.json"
    ],
    teams: [
        "../../basketball_101_data_files/overseas_teams_data.json",
        "../basketball_101_data_files/overseas_teams_data.json",
        "/basketball_101_data_files/overseas_teams_data.json"
    ]
};

const teamNameInput = document.getElementById("teamName");
const displayNameInput = document.getElementById("displayName");
const clubNameInput = document.getElementById("clubName");
const localNameInput = document.getElementById("localName");
const currentSponsorInput = document.getElementById("currentSponsor");
const teamCodeInput = document.getElementById("teamCode");
const leagueCodeInput = document.getElementById("leagueCode");

const locationInput = document.getElementById("locationInput");
const cityInput = document.getElementById("cityInput");
const subRegionInput = document.getElementById("subRegionInput");
const countryInput = document.getElementById("countryInput");

const arenaInput = document.getElementById("arenaInput");
const foundedYearInput = document.getElementById("foundedYear");
const defunctYearInput = document.getElementById("defunctYear");

const commonNamesList = document.getElementById("commonNamesList");
const abbreviationsList = document.getElementById("abbreviationsList");
const englishTranslationsList = document.getElementById("englishTranslationsList");
const nameHistoryList = document.getElementById("nameHistoryList");
const linksList = document.getElementById("linksList");

const addCommonNameBtn = document.getElementById("addCommonNameBtn");
const addAbbreviationBtn = document.getElementById("addAbbreviationBtn");
const addEnglishTranslationBtn = document.getElementById("addEnglishTranslationBtn");
const addNameHistoryBtn = document.getElementById("addNameHistoryBtn");
const addLinkBtn = document.getElementById("addLinkBtn");

const metaNotesInput = document.getElementById("metaNotes");
const lastUpdatedInput = document.getElementById("lastUpdated");

const jsonPreview = document.getElementById("jsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const saveJsonBtn = document.getElementById("saveJsonBtn");

const newTeamBtn = document.getElementById("newTeamBtn");
const teamCardsList = document.getElementById("teamCardsList");
const teamSearchInput = document.getElementById("teamSearchInput");
const teamLeagueFilter = document.getElementById("teamLeagueFilter");

const utilityEntriesList = document.getElementById("utilityEntriesList");
const reloadUtilityEntriesBtn = document.getElementById("reloadUtilityEntriesBtn");

let openUtilityEntries = [];
let activeUtilityEntryId = null;

let teamCodeEdited = false;
let activeTeamCode = null;

let overseasLeaguesData = { leagues: {} };
let overseasTeamsData = { teams: {} };

function makeCode(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function parseYear(value) {
    const trimmed = String(value || "").trim();

    if (!trimmed) return null;
    if (trimmed.toLowerCase() === "present") return "present";

    const numberValue = Number(trimmed);
    return Number.isNaN(numberValue) ? trimmed : numberValue;
}

function parseLocation(value) {
    const parts = String(value || "")
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    const country = parts.length > 1 ? parts[parts.length - 1] : "";
    const area = parts[0] || "";
    const subRegion = parts.length > 2 ? parts.slice(1, -1).join(", ") : "";

    return {
        area,
        city: cityInput.value.trim() || area,
        subRegion: subRegionInput.value.trim() || subRegion,
        country: countryInput.value.trim() || country,
        parts,
        display: parts.join(", ")
    };
}

function syncLocationFieldsFromDisplay() {
    const parts = locationInput.value
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    if (!parts.length) {
        cityInput.value = "";
        subRegionInput.value = "";
        countryInput.value = "";
        return;
    }

    cityInput.value = parts[0] || "";
    subRegionInput.value = parts.length > 2 ? parts.slice(1, -1).join(", ") : "";
    countryInput.value = parts.length > 1 ? parts[parts.length - 1] : "";
}

function rebuildLocationDisplayFromFields() {
    const parts = [
        cityInput.value.trim(),
        subRegionInput.value.trim(),
        countryInput.value.trim()
    ].filter(Boolean);

    locationInput.value = parts.join(", ");
}

async function loadUtilityEntries() {
    const data = await UtilityEntryService.loadEntries();

    openUtilityEntries = Object.values(data.openEntries || {})
        .filter(entry =>
            entry.category === "overseas-reference" &&
            (entry.wires || []).includes("overseas-team-input-tool")
        );

    renderUtilityEntries();
}

function renderUtilityEntries() {
    utilityEntriesList.innerHTML = "";

    if (!openUtilityEntries.length) {
        utilityEntriesList.innerHTML = `<p>No open overseas utility entries.</p>`;
        return;
    }

    openUtilityEntries.forEach(entry => {
        const request = entry.referenceRequest || {};

        const card = document.createElement("article");
        card.className = "record-card utility-entry-card";

        card.innerHTML = `
            <div class="record-card-title">${request.teamName || entry.title || "Unnamed Utility Entry"}</div>
            <div class="record-card-meta">League: ${request.leagueName || "—"}</div>
            <div class="record-card-meta">Location: ${[request.city, request.country].filter(Boolean).join(", ") || "—"}</div>
            <div class="record-card-meta">From: ${entry.createdFrom?.tool || "—"}</div>

            <div class="button-row">
                <button type="button" class="load-utility-entry-btn">Load Into Form</button>
                <button type="button" class="resolve-utility-entry-btn">Mark Resolved</button>
            </div>
        `;

        card.querySelector(".load-utility-entry-btn").addEventListener("click", () => {
            loadUtilityEntryIntoTeamForm(entry);
        });

        card.querySelector(".resolve-utility-entry-btn").addEventListener("click", () => {
            resolveUtilityEntryForTeam(entry);
        });

        utilityEntriesList.appendChild(card);
    });
}

function findLeagueCodeByName(leagueName) {
    const cleanName = String(leagueName || "").trim().toLowerCase();

    if (!cleanName) return "";

    const match = Object.values(overseasLeaguesData.leagues || {}).find(league => {
        const names = [
            league.name?.full,
            league.name?.official,
            league.name?.display,
            ...(league.name?.commonNames || [])
        ];

        return names
            .filter(Boolean)
            .some(name => String(name).trim().toLowerCase() === cleanName);
    });

    return match?.leagueCode || "";
}

function loadUtilityEntryIntoTeamForm(entry) {
    const request = entry.referenceRequest || {};

    activeUtilityEntryId = entry.entryId;

    if (request.teamName) {
        teamNameInput.value = request.teamName;
        displayNameInput.value = request.teamName;

        if (!teamCodeEdited) {
            teamCodeInput.value = makeCode(request.teamName);
        }
    }

    const matchedLeagueCode =
        request.leagueCode || findLeagueCodeByName(request.leagueName);

    if (matchedLeagueCode) {
        leagueCodeInput.value = matchedLeagueCode;
    }

    cityInput.value = request.city || "";
    countryInput.value = request.country || "";
    rebuildLocationDisplayFromFields();

    metaNotesInput.value = [
        metaNotesInput.value,
        `Utility entry: ${entry.entryId}`,
        request.leagueName ? `Requested league: ${request.leagueName}` : "",
        request.season ? `Related season: ${request.season}` : "",
        entry.notes ? `Entry notes: ${entry.notes}` : ""
    ].filter(Boolean).join("\n");

    renderJson();
}

async function resolveUtilityEntryForTeam(entry) {
    const teamObject = getTeamObject();

    const resolvedEntry = UtilityEntryService.resolveEntry(
        entry,
        {
            teamCode: teamObject.teamCode,
            leagueCode: teamObject.league?.leagueCode || ""
        },
        "overseas-team-input-tool"
    );

    await UtilityEntryService.saveEntry(resolvedEntry);
    activeUtilityEntryId = null;
    await loadUtilityEntries();
}

async function fetchFirstWorkingJson(paths) {
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (response.ok) return await response.json();
        } catch (error) {
            console.warn(`Could not load ${path}`, error);
        }
    }

    return {};
}

function normalizeLeaguesData(data) {
    return data?.leagues ? data : { leagues: data || {} };
}

function normalizeTeamsData(data) {
    return data?.teams ? data : { teams: data || {} };
}

function getLeagueDisplayName(leagueCode) {
    const league = overseasLeaguesData.leagues?.[leagueCode];

    return (
        league?.name?.display ||
        league?.name?.full ||
        league?.name?.official ||
        leagueCode ||
        "Unknown League"
    );
}

function getTeamDisplayName(team) {
    return (
        team?.name?.display ||
        team?.name?.full ||
        team?.name?.official ||
        team?.teamCode ||
        "Unnamed Team"
    );
}

async function loadAllData() {
    const leaguesData = await fetchFirstWorkingJson(DATA_PATHS.leagues);
    const teamsData = await fetchFirstWorkingJson(DATA_PATHS.teams);

    overseasLeaguesData = normalizeLeaguesData(leaguesData);
    overseasTeamsData = normalizeTeamsData(teamsData);

    populateLeagueOptions();
    populateTeamLeagueFilter();
    renderTeamCards();
}

function populateLeagueOptions() {
    leagueCodeInput.innerHTML = `<option value="">-- Select league --</option>`;

    Object.entries(overseasLeaguesData.leagues || {})
        .sort(([, a], [, b]) => getLeagueDisplayName(a.leagueCode).localeCompare(getLeagueDisplayName(b.leagueCode)))
        .forEach(([leagueCode, league]) => {
            const option = document.createElement("option");
            option.value = league.leagueCode || leagueCode;
            option.textContent = `${getLeagueDisplayName(option.value)} (${option.value})`;
            leagueCodeInput.appendChild(option);
        });
}

function populateTeamLeagueFilter() {
    teamLeagueFilter.innerHTML = `<option value="">All leagues</option>`;

    Object.entries(overseasLeaguesData.leagues || {})
        .sort(([, a], [, b]) => getLeagueDisplayName(a.leagueCode).localeCompare(getLeagueDisplayName(b.leagueCode)))
        .forEach(([leagueCode, league]) => {
            const option = document.createElement("option");
            option.value = league.leagueCode || leagueCode;
            option.textContent = getLeagueDisplayName(option.value);
            teamLeagueFilter.appendChild(option);
        });
}

function renderTeamCards() {
    const search = teamSearchInput.value.trim().toLowerCase();
    const selectedLeague = teamLeagueFilter.value;

    const teams = Object.values(overseasTeamsData.teams || {})
        .sort((a, b) => getTeamDisplayName(a).localeCompare(getTeamDisplayName(b)))
        .filter(team => {
            const teamLeagueCode = team.league?.leagueCode || "";
            if (selectedLeague && teamLeagueCode !== selectedLeague) return false;

            const text = [
                getTeamDisplayName(team),
                team.teamCode,
                teamLeagueCode,
                getLeagueDisplayName(teamLeagueCode),
                team.location?.display,
                team.location?.country,
                team.location?.subRegion,
                team.location?.city,
                team.location?.area
            ].join(" ").toLowerCase();

            return text.includes(search);
        });

    teamCardsList.innerHTML = "";

    if (!teams.length) {
        teamCardsList.innerHTML = `<p>No teams found.</p>`;
        return;
    }

    teams.forEach(team => {
        const card = document.createElement("article");
        card.className = "record-card";

        if (team.teamCode === activeTeamCode) {
            card.classList.add("active");
        }

        const leagueCode = team.league?.leagueCode || "";

        card.innerHTML = `
            <div class="record-card-title">${getTeamDisplayName(team)}</div>
            <div class="record-card-meta">${team.teamCode || ""}</div>
            <div class="record-card-meta">${getLeagueDisplayName(leagueCode)}</div>
            <div class="record-card-meta">${team.location?.display || ""}</div>
        `;

        card.addEventListener("click", () => {
            loadTeamIntoForm(team.teamCode);
        });

        teamCardsList.appendChild(card);
    });
}

function createCommonNameRow(value = "") {
    const row = document.createElement("div");
    row.className = "dynamic-row common-name-row";

    row.innerHTML = `
        <label>
            Common Name
            <input class="common-name-input" autocomplete="off" placeholder="ex: Fenerbahçe">
        </label>
        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector("input").value = value;

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelector("input").addEventListener("input", renderJson);
    commonNamesList.appendChild(row);
}

function createAbbreviationRow(value = "") {
    const row = document.createElement("div");
    row.className = "dynamic-row abbreviation-row";

    row.innerHTML = `
        <label>
            Abbreviation
            <input class="abbreviation-input" autocomplete="off" placeholder="ex: WKBL">
        </label>
        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector("input").value = value;

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelector("input").addEventListener("input", renderJson);
    abbreviationsList.appendChild(row);
}

function createEnglishTranslationRow(entry = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-row translation-row";

    row.innerHTML = `
        <label>
            Original / non-English name
            <input class="translation-name-input" autocomplete="off" placeholder="ex: Fenerbahçe Opet">
        </label>

        <label>
            English translation
            <input class="translation-english-input" autocomplete="off" placeholder="ex: Fenerbahce Opet">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".translation-name-input").value = entry.name || "";
    row.querySelector(".translation-english-input").value =
        entry.translation || entry.englishTranslation || "";

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", renderJson);
    });

    englishTranslationsList.appendChild(row);
}

function createNameHistoryRow(entry = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-row history-row";

    row.innerHTML = `
        <label>
            Team Name
            <input class="history-name-input" autocomplete="off" placeholder="ex: Fenerbahçe Opet">
        </label>

        <label>
            Start Year
            <input class="history-start-input" autocomplete="off" placeholder="ex: 2018">
        </label>

        <label>
            End Year
            <input class="history-end-input" autocomplete="off" placeholder="ex: present">
        </label>

        <label>
            Sponsor Name
            <input class="history-sponsor-input" autocomplete="off" placeholder="optional">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".history-name-input").value = entry.name || "";
    row.querySelector(".history-start-input").value = entry.startYear || "";
    row.querySelector(".history-end-input").value = entry.endYear || "";
    row.querySelector(".history-sponsor-input").value = entry.sponsorName || "";

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", renderJson);
    });

    nameHistoryList.appendChild(row);
}

function createLinkRow(link = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-row link-row";

    row.innerHTML = `
        <label>
            Label
            <input class="link-label-input" autocomplete="off" placeholder="ex: Official Website">
        </label>

        <label>
            URL
            <input class="link-url-input" autocomplete="off" placeholder="https://">
        </label>

        <label>
            Type
            <input class="link-type-input" autocomplete="off" placeholder="official / reference">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".link-label-input").value = link.label || "";
    row.querySelector(".link-url-input").value = link.url || "";
    row.querySelector(".link-type-input").value = link.type || "";

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", renderJson);
    });

    linksList.appendChild(row);
}

function getCommonNames() {
    return [...document.querySelectorAll(".common-name-input")]
        .map(input => input.value.trim())
        .filter(Boolean);
}

function getAbbreviations() {
    return [...document.querySelectorAll(".abbreviation-input")]
        .map(input => input.value.trim())
        .filter(Boolean);
}

function getEnglishTranslations() {
    return [...document.querySelectorAll(".translation-row")]
        .map(row => ({
            name: row.querySelector(".translation-name-input").value.trim(),
            translation: row.querySelector(".translation-english-input").value.trim()
        }))
        .filter(entry => entry.name || entry.translation);
}

function getNameHistory() {
    return [...document.querySelectorAll(".history-row")]
        .map(row => {
            const name = row.querySelector(".history-name-input").value.trim();

            return {
                name,
                nameSlug: makeCode(name),
                startYear: parseYear(row.querySelector(".history-start-input").value),
                endYear: parseYear(row.querySelector(".history-end-input").value),
                sponsorName: row.querySelector(".history-sponsor-input")?.value.trim() || ""
            };
        })
        .filter(entry => entry.name);
}

function getLinks() {
    return [...document.querySelectorAll(".link-row")]
        .map(row => ({
            label: row.querySelector(".link-label-input").value.trim(),
            url: row.querySelector(".link-url-input").value.trim(),
            type: row.querySelector(".link-type-input").value.trim()
        }))
        .filter(link => link.label || link.url);
}

function getTeamObject() {
    const teamName = teamNameInput.value.trim();
    const teamCode = teamCodeInput.value.trim() || "team_code_here";
    const location = parseLocation(locationInput.value.trim());

    return {
        teamCode,

        name: {
            full: teamName,
            official: teamName,
            display: displayNameInput.value.trim() || teamName,
            club: clubNameInput.value.trim(),
            local: localNameInput.value.trim(),
            currentSponsor: currentSponsorInput.value.trim(),
            abbreviations: getAbbreviations(),
            englishTranslations: getEnglishTranslations(),
            commonNames: getCommonNames()
        },

        location,

        league: {
            leagueCode: leagueCodeInput.value.trim(),
            leagueName: getLeagueDisplayName(leagueCodeInput.value.trim())
        },

        details: {
            arena: arenaInput.value.trim(),
            founded: parseYear(foundedYearInput.value),
            defunct: parseYear(defunctYearInput.value)
        },

        nameHistory: getNameHistory(),
        links: getLinks(),

        meta: {
            notes: metaNotesInput.value.trim(),
            lastUpdated: lastUpdatedInput.value.trim()
        }
    };
}

function buildTeamObject() {
    const teamObject = getTeamObject();
    return `"${teamObject.teamCode}": ${JSON.stringify(teamObject, null, 2)}`;
}

function renderJson() {
    jsonPreview.textContent = buildTeamObject();
}

function resetFormOnLoad() {
    activeTeamCode = null;

    teamNameInput.value = "";
    displayNameInput.value = "";
    clubNameInput.value = "";
    localNameInput.value = "";
    currentSponsorInput.value = "";
    teamCodeInput.value = "";
    leagueCodeInput.value = "";

    locationInput.value = "";
    cityInput.value = "";
    subRegionInput.value = "";
    countryInput.value = "";

    arenaInput.value = "";
    foundedYearInput.value = "";
    defunctYearInput.value = "";

    abbreviationsList.innerHTML = "";
    englishTranslationsList.innerHTML = "";
    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    metaNotesInput.value = "";
    lastUpdatedInput.value = "";

    teamCodeEdited = false;

    createCommonNameRow();
    createNameHistoryRow();
    createLinkRow();

    renderTeamCards();
    renderJson();
}

function loadTeamIntoForm(teamCode) {
    const team = overseasTeamsData.teams?.[teamCode];
    if (!team) return;

    activeTeamCode = teamCode;
    teamCodeEdited = true;

    teamNameInput.value = team.name?.official || team.name?.full || "";
    displayNameInput.value = team.name?.display || team.name?.full || "";
    clubNameInput.value = team.name?.club || "";
    localNameInput.value = team.name?.local || "";
    currentSponsorInput.value = team.name?.currentSponsor || "";
    teamCodeInput.value = team.teamCode || teamCode;
    leagueCodeInput.value = team.league?.leagueCode || "";

    locationInput.value = team.location?.display || "";
    cityInput.value = team.location?.city || team.location?.area || "";
    subRegionInput.value = team.location?.subRegion || "";
    countryInput.value = team.location?.country || "";

    arenaInput.value = team.details?.arena || "";
    foundedYearInput.value = team.details?.founded || "";
    defunctYearInput.value = team.details?.defunct || "";

    abbreviationsList.innerHTML = "";
    englishTranslationsList.innerHTML = "";
    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    (team.name?.abbreviations || []).forEach(createAbbreviationRow);
    (team.name?.englishTranslations || []).forEach(createEnglishTranslationRow);
    (team.name?.commonNames || []).forEach(createCommonNameRow);
    (team.nameHistory || []).forEach(createNameHistoryRow);
    (team.links || []).forEach(createLinkRow);

    if (!document.querySelector(".common-name-input")) createCommonNameRow();
    if (!document.querySelector(".history-row")) createNameHistoryRow();
    if (!document.querySelector(".link-row")) createLinkRow();

    metaNotesInput.value = team.meta?.notes || "";
    lastUpdatedInput.value = team.meta?.lastUpdated || "";

    renderTeamCards();
    renderJson();
}

teamNameInput.addEventListener("input", () => {
    if (!teamCodeEdited) {
        teamCodeInput.value = makeCode(teamNameInput.value);
    }

    if (!displayNameInput.value.trim()) {
        displayNameInput.value = teamNameInput.value;
    }

    renderJson();
});

teamCodeInput.addEventListener("input", () => {
    teamCodeEdited = true;
    teamCodeInput.value = makeCode(teamCodeInput.value);
    renderJson();
});

locationInput.addEventListener("input", () => {
    syncLocationFieldsFromDisplay();
    renderJson();
});

[
    cityInput,
    subRegionInput,
    countryInput
].forEach(input => {
    input.addEventListener("input", () => {
        rebuildLocationDisplayFromFields();
        renderJson();
    });
});

[
    displayNameInput,
    clubNameInput,
    localNameInput,
    currentSponsorInput,
    leagueCodeInput,
    arenaInput,
    foundedYearInput,
    defunctYearInput,
    metaNotesInput,
    lastUpdatedInput
].forEach(input => {
    input.addEventListener("input", renderJson);
    input.addEventListener("change", renderJson);
});

addAbbreviationBtn.addEventListener("click", () => createAbbreviationRow());
addEnglishTranslationBtn.addEventListener("click", () => createEnglishTranslationRow());
addCommonNameBtn.addEventListener("click", () => createCommonNameRow());
addNameHistoryBtn.addEventListener("click", () => createNameHistoryRow());
addLinkBtn.addEventListener("click", () => createLinkRow());

newTeamBtn.addEventListener("click", resetFormOnLoad);
teamSearchInput.addEventListener("input", renderTeamCards);
teamLeagueFilter.addEventListener("change", renderTeamCards);

copyJsonBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(jsonPreview.textContent);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
        copyJsonBtn.textContent = "Copy JSON";
    }, 1000);
});

saveJsonBtn.addEventListener("click", async () => {
    const teamObject = getTeamObject();

    try {
        const response = await fetch("http://127.0.0.1:8787/save-overseas-team", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(teamObject)
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Save failed");
        }

        overseasTeamsData.teams[teamObject.teamCode] = teamObject;
        activeTeamCode = teamObject.teamCode;

        if (activeUtilityEntryId) {
            const entry = openUtilityEntries.find(item => item.entryId === activeUtilityEntryId);

            if (entry) {
                const resolvedEntry = UtilityEntryService.resolveEntry(
                    entry,
                    {
                        teamCode: teamObject.teamCode,
                        leagueCode: teamObject.league?.leagueCode || ""
                    },
                    "overseas-team-input-tool"
                );

                await UtilityEntryService.saveEntry(resolvedEntry);
                activeUtilityEntryId = null;
                await loadUtilityEntries();
            }
        }

        renderTeamCards();
        renderJson();

        saveJsonBtn.textContent = "Saved!";

        setTimeout(() => {
            saveJsonBtn.textContent = "Save Team";
        }, 1200);
    } catch (error) {
        console.error(error);
        alert("Save failed. Make sure the local save server is running.");
    }
});

resetFormOnLoad();
loadAllData(); 
loadUtilityEntries();