const DATA_PATHS = [
    "../../basketball_101_data_files/overseas_leagues_data.json",
    "../basketball_101_data_files/overseas_leagues_data.json",
    "basketball_101_data_files/overseas_leagues_data.json"
];

const leagueNameInput = document.getElementById("leagueName");
const displayNameInput = document.getElementById("displayName");
const localNameInput = document.getElementById("localName");
const currentSponsorInput = document.getElementById("currentSponsor");
const leagueCodeInput = document.getElementById("leagueCode");

const countryInput = document.getElementById("countryInput");
const regionInput = document.getElementById("regionInput");

const foundedYearInput = document.getElementById("foundedYear");
const defunctYearInput = document.getElementById("defunctYear");
const competitionTierInput = document.getElementById("competitionTier");
const genderInput = document.getElementById("genderInput");

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
const newLeagueBtn = document.getElementById("newLeagueBtn");

const leagueCardsList = document.getElementById("leagueCardsList");
const leagueSearchInput = document.getElementById("leagueSearchInput");

const utilityEntriesList = document.getElementById("utilityEntriesList");
const reloadUtilityEntriesBtn = document.getElementById("reloadUtilityEntriesBtn");

let openUtilityEntries = [];
let activeUtilityEntryId = null;

let leagueCodeEdited = false;
let overseasLeaguesData = { leagues: {} };
let activeLeagueCode = null;

function makeCode(value) {
    return value
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

async function loadUtilityEntries() {
    const data = await UtilityEntryService.loadEntries();

    openUtilityEntries = Object.values(data.openEntries || {})
        .filter(entry =>
            entry.category === "overseas-reference" &&
            (entry.wires || []).includes("overseas-league-input-tool")
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
            <div class="record-card-title">${request.leagueName || entry.title || "Unnamed Utility Entry"}</div>
            <div class="record-card-meta">Team: ${request.teamName || "—"}</div>
            <div class="record-card-meta">Country: ${request.country || "—"}</div>
            <div class="record-card-meta">From: ${entry.createdFrom?.tool || "—"}</div>

            <div class="button-row">
                <button type="button" class="load-utility-entry-btn">Load Into Form</button>
                <button type="button" class="resolve-utility-entry-btn">Mark Resolved</button>
            </div>
        `;

        card.querySelector(".load-utility-entry-btn").addEventListener("click", () => {
            loadUtilityEntryIntoLeagueForm(entry);
        });

        card.querySelector(".resolve-utility-entry-btn").addEventListener("click", () => {
            resolveUtilityEntryForLeague(entry);
        });

        utilityEntriesList.appendChild(card);
    });
}

function loadUtilityEntryIntoLeagueForm(entry) {
    const request = entry.referenceRequest || {};

    activeUtilityEntryId = entry.entryId;

    if (request.leagueName) {
        leagueNameInput.value = request.leagueName;
        displayNameInput.value = request.leagueName;

        if (!leagueCodeEdited) {
            leagueCodeInput.value = makeCode(request.leagueName);
        }
    }

    if (request.country) {
        countryInput.value = request.country;
    }

    if (request.region) {
        regionInput.value = request.region;
    }

    metaNotesInput.value = [
        metaNotesInput.value,
        `Utility entry: ${entry.entryId}`,
        request.teamName ? `Related team: ${request.teamName}` : "",
        entry.notes ? `Entry notes: ${entry.notes}` : ""
    ].filter(Boolean).join("\n");

    renderJson();
}

async function resolveUtilityEntryForLeague(entry) {
    const leagueObject = getLeagueObject();

    const resolvedEntry = UtilityEntryService.resolveEntry(
        entry,
        {
            leagueCode: leagueObject.leagueCode
        },
        "overseas-league-input-tool"
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

    return { leagues: {} };
}

function normalizeLeaguesData(data) {
    if (data?.leagues) return data;

    return {
        leagues: data || {}
    };
}

async function loadExistingLeagues() {
    const data = await fetchFirstWorkingJson(DATA_PATHS);
    overseasLeaguesData = normalizeLeaguesData(data);
    renderLeagueCards();
}

function getLeagueDisplayName(league) {
    return (
        league?.name?.display ||
        league?.name?.full ||
        league?.name?.official ||
        league?.leagueCode ||
        "Unnamed League"
    );
}

function renderLeagueCards() {
    const search = leagueSearchInput.value.trim().toLowerCase();
    const leagues = Object.values(overseasLeaguesData.leagues || {})
        .sort((a, b) => getLeagueDisplayName(a).localeCompare(getLeagueDisplayName(b)))
        .filter(league => {
            const text = [
                getLeagueDisplayName(league),
                league.leagueCode,
                league.location?.country,
                league.location?.region
            ].join(" ").toLowerCase();

            return text.includes(search);
        });

    leagueCardsList.innerHTML = "";

    if (!leagues.length) {
        leagueCardsList.innerHTML = `<p>No leagues found.</p>`;
        return;
    }

    leagues.forEach(league => {
        const card = document.createElement("article");
        card.className = "record-card";

        if (league.leagueCode === activeLeagueCode) {
            card.classList.add("active");
        }

        card.innerHTML = `
            <div class="record-card-title">${getLeagueDisplayName(league)}</div>
            <div class="record-card-meta">${league.leagueCode || ""}</div>
            <div class="record-card-meta">${league.location?.country || ""} ${league.location?.region ? "• " + league.location.region : ""}</div>
        `;

        card.addEventListener("click", () => {
            loadLeagueIntoForm(league.leagueCode);
        });

        leagueCardsList.appendChild(card);
    });
}

function createCommonNameRow(value = "") {
    const row = document.createElement("div");
    row.className = "dynamic-row common-name-row";

    row.innerHTML = `
        <label>
            Common Name
            <input class="common-name-input" autocomplete="off" placeholder="ex: KBSL">
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
            <input class="translation-name-input" autocomplete="off" placeholder="ex: Kadınlar Basketbol Süper Ligi">
        </label>

        <label>
            English translation
            <input class="translation-english-input" autocomplete="off" placeholder="ex: Women's Basketball Super League">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".translation-name-input").value = entry.name || "";
    row.querySelector(".translation-english-input").value = entry.translation || entry.englishTranslation || "";

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
            League Name
            <input class="history-name-input" autocomplete="off" placeholder="ex: Women's Basketball Super League">
        </label>

        <label>
            Start Year
            <input class="history-start-input" autocomplete="off" placeholder="ex: 1980">
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

function getLeagueObject() {
    const leagueName = leagueNameInput.value.trim();
    const leagueCode = leagueCodeInput.value.trim() || "league_code_here";

    return {
        leagueCode,

        name: {
            full: leagueName,
            official: leagueName,
            display: displayNameInput.value.trim() || leagueName,
            local: localNameInput.value.trim(),
            currentSponsor: currentSponsorInput.value.trim(),
            abbreviations: getAbbreviations(),
            englishTranslations: getEnglishTranslations(),
            commonNames: getCommonNames()
        },

        location: {
            country: countryInput.value.trim(),
            region: regionInput.value.trim()
        },

        details: {
            founded: parseYear(foundedYearInput.value),
            defunct: parseYear(defunctYearInput.value),
            competitionTier: competitionTierInput.value.trim(),
            gender: genderInput.value.trim() || "women"
        },

        nameHistory: getNameHistory(),
        links: getLinks(),

        meta: {
            notes: metaNotesInput.value.trim(),
            lastUpdated: lastUpdatedInput.value.trim()
        }
    };
}

function buildLeagueObject() {
    const leagueObject = getLeagueObject();
    return `"${leagueObject.leagueCode}": ${JSON.stringify(leagueObject, null, 2)}`;
}

function renderJson() {
    jsonPreview.textContent = buildLeagueObject();
}

function resetFormOnLoad() {
    activeLeagueCode = null;

    leagueNameInput.value = "";
    displayNameInput.value = "";
    localNameInput.value = "";
    currentSponsorInput.value = "";
    leagueCodeInput.value = "";

    countryInput.value = "";
    regionInput.value = "";

    foundedYearInput.value = "";
    defunctYearInput.value = "";
    competitionTierInput.value = "";
    genderInput.value = "women";

    abbreviationsList.innerHTML = "";
    englishTranslationsList.innerHTML = "";
    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    metaNotesInput.value = "";
    lastUpdatedInput.value = "";

    leagueCodeEdited = false;

    createCommonNameRow();
    createNameHistoryRow();
    createLinkRow();

    renderLeagueCards();
    renderJson();
}

function loadLeagueIntoForm(leagueCode) {
    const league = overseasLeaguesData.leagues?.[leagueCode];
    if (!league) return;

    activeLeagueCode = leagueCode;
    leagueCodeEdited = true;

    leagueNameInput.value = league.name?.official || league.name?.full || "";
    displayNameInput.value = league.name?.display || league.name?.full || "";
    localNameInput.value = league.name?.local || "";
    currentSponsorInput.value = league.name?.currentSponsor || "";
    leagueCodeInput.value = league.leagueCode || leagueCode;

    countryInput.value = league.location?.country || "";
    regionInput.value = league.location?.region || "";

    foundedYearInput.value = league.details?.founded || "";
    defunctYearInput.value = league.details?.defunct || "";
    competitionTierInput.value = league.details?.competitionTier || "";
    genderInput.value = league.details?.gender || "women";

    abbreviationsList.innerHTML = "";
    englishTranslationsList.innerHTML = "";
    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    (league.name?.abbreviations || []).forEach(createAbbreviationRow);
    (league.name?.englishTranslations || []).forEach(createEnglishTranslationRow);
    (league.name?.commonNames || []).forEach(createCommonNameRow);
    (league.nameHistory || []).forEach(createNameHistoryRow);
    (league.links || []).forEach(createLinkRow);

    if (!document.querySelector(".common-name-input")) createCommonNameRow();
    if (!document.querySelector(".history-row")) createNameHistoryRow();
    if (!document.querySelector(".link-row")) createLinkRow();

    metaNotesInput.value = league.meta?.notes || "";
    lastUpdatedInput.value = league.meta?.lastUpdated || "";

    renderLeagueCards();
    renderJson();
}

leagueNameInput.addEventListener("input", () => {
    if (!leagueCodeEdited) {
        leagueCodeInput.value = makeCode(leagueNameInput.value);
    }

    if (!displayNameInput.value.trim()) {
        displayNameInput.value = leagueNameInput.value;
    }

    renderJson();
});

leagueCodeInput.addEventListener("input", () => {
    leagueCodeEdited = true;
    leagueCodeInput.value = makeCode(leagueCodeInput.value);
    renderJson();
});

[
    displayNameInput,
    localNameInput,
    currentSponsorInput,
    countryInput,
    regionInput,
    foundedYearInput,
    defunctYearInput,
    competitionTierInput,
    genderInput,
    metaNotesInput,
    lastUpdatedInput
].forEach(input => {
    input.addEventListener("input", renderJson);
});

addAbbreviationBtn.addEventListener("click", () => createAbbreviationRow());
addEnglishTranslationBtn.addEventListener("click", () => createEnglishTranslationRow());
addCommonNameBtn.addEventListener("click", () => createCommonNameRow());
addNameHistoryBtn.addEventListener("click", () => createNameHistoryRow());
addLinkBtn.addEventListener("click", () => createLinkRow());

newLeagueBtn.addEventListener("click", resetFormOnLoad);
leagueSearchInput.addEventListener("input", renderLeagueCards);

copyJsonBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(jsonPreview.textContent);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
        copyJsonBtn.textContent = "Copy JSON";
    }, 1000);
});

saveJsonBtn.addEventListener("click", async () => {
    const leagueObject = getLeagueObject();

    try {
        const response = await fetch("http://127.0.0.1:8787/save-overseas-league", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(leagueObject)
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Save failed");
        }

        overseasLeaguesData.leagues[leagueObject.leagueCode] = leagueObject;
        activeLeagueCode = leagueObject.leagueCode;

        if (activeUtilityEntryId) {
            const entry = openUtilityEntries.find(item => item.entryId === activeUtilityEntryId);

            if (entry) {
                const resolvedEntry = UtilityEntryService.resolveEntry(
                    entry,
                    {
                        leagueCode: leagueObject.leagueCode
                    },
                    "overseas-league-input-tool"
                );

                await UtilityEntryService.saveEntry(resolvedEntry);
                activeUtilityEntryId = null;
                await loadUtilityEntries();
            }
        }

        renderLeagueCards();
        renderJson();

        saveJsonBtn.textContent = "Saved!";

        setTimeout(() => {
            saveJsonBtn.textContent = "Save League";
        }, 1200);
    } catch (error) {
        console.error(error);
        alert("Save failed. Make sure the local save server is running.");
    }
});

resetFormOnLoad();
loadExistingLeagues(); 
loadUtilityEntries();