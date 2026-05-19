const OVERSEAS_LEAGUES_DATA_PATH = "/basketball_101_data_files/overseas_leagues_data.json";

const teamNameInput = document.getElementById("teamName");
const teamCodeInput = document.getElementById("teamCode");
const leagueCodeInput = document.getElementById("leagueCode");
const locationInput = document.getElementById("locationInput");

const commonNamesList = document.getElementById("commonNamesList");
const nameHistoryList = document.getElementById("nameHistoryList");
const linksList = document.getElementById("linksList");

const addCommonNameBtn = document.getElementById("addCommonNameBtn");
const addNameHistoryBtn = document.getElementById("addNameHistoryBtn");
const addLinkBtn = document.getElementById("addLinkBtn");

const jsonPreview = document.getElementById("jsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");

let teamCodeEdited = false;

function makeCode(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function parseLocation(value) {
    const parts = value.split(",").map(part => part.trim());

    const area = parts[0] || "";
    const country = parts[1] || "";

    return {
        area,
        country,
        display: country ? `${area}, ${country}` : area
    };
}

function parseYear(value) {
    const trimmed = value.trim();

    if (!trimmed) return null;
    if (trimmed.toLowerCase() === "present") return "present";

    const numberValue = Number(trimmed);
    return Number.isNaN(numberValue) ? trimmed : numberValue;
}

function createCommonNameRow() {
    const row = document.createElement("div");
    row.className = "dynamic-row common-name-row";

    row.innerHTML = `
        <label>
            Common Name
            <input class="common-name-input" placeholder="ex: Fenerbahçe">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelector("input").addEventListener("input", renderJson);

    commonNamesList.appendChild(row);
}

function createNameHistoryRow() {
    const row = document.createElement("div");
    row.className = "dynamic-row history-row";

    row.innerHTML = `
        <label>
            Team Name
            <input class="history-name-input" placeholder="ex: Fenerbahçe Opet">
        </label>

        <label>
            Start Year
            <input class="history-start-input" placeholder="ex: 2018">
        </label>

        <label>
            End Year
            <input class="history-end-input" placeholder="ex: present">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", renderJson);
    });

    nameHistoryList.appendChild(row);
}

function createLinkRow() {
    const row = document.createElement("div");
    row.className = "dynamic-row link-row";

    row.innerHTML = `
        <label>
            Label
            <input class="link-label-input" placeholder="ex: Official Website">
        </label>

        <label>
            URL
            <input class="link-url-input" placeholder="https://">
        </label>

        <label>
            Type
            <input class="link-type-input" placeholder="official / reference">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

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

function getNameHistory() {
    return [...document.querySelectorAll(".history-row")]
        .map(row => {
            return {
                name: row.querySelector(".history-name-input").value.trim(),
                startYear: parseYear(row.querySelector(".history-start-input").value),
                endYear: parseYear(row.querySelector(".history-end-input").value)
            };
        })
        .filter(entry => entry.name);
}

function getLinks() {
    return [...document.querySelectorAll(".link-row")]
        .map(row => {
            return {
                label: row.querySelector(".link-label-input").value.trim(),
                url: row.querySelector(".link-url-input").value.trim(),
                type: row.querySelector(".link-type-input").value.trim()
            };
        })
        .filter(link => link.label || link.url);
}

function buildTeamObject() {
    const teamName = teamNameInput.value.trim();
    const teamCode = teamCodeInput.value.trim() || "team_code_here";
    const location = parseLocation(locationInput.value.trim());

    const teamObject = {
        teamCode,

        name: {
            full: teamName,
            commonNames: getCommonNames()
        },

        location,

        league: {
            leagueCode: leagueCodeInput.value.trim()
        },

        nameHistory: getNameHistory(),

        links: getLinks(),

        meta: {
            notes: "",
            lastUpdated: ""
        }
    };

    return `"${teamCode}": ${JSON.stringify(teamObject, null, 2)}`;
}

async function loadLeagueOptions() {
    try {
        const response = await fetch(OVERSEAS_LEAGUES_DATA_PATH);

        if (!response.ok) {
            throw new Error(`Could not load leagues: ${response.status}`);
        }

        const data = await response.json();
        const leagues = data.leagues || data;

        Object.entries(leagues)
            .sort(([, a], [, b]) => {
                const nameA = a.name?.full || a.leagueCode || "";
                const nameB = b.name?.full || b.leagueCode || "";
                return nameA.localeCompare(nameB);
            })
            .forEach(([leagueCode, league]) => {
                const option = document.createElement("option");

                option.value = league.leagueCode || leagueCode;
                option.textContent = league.name?.full
                    ? `${league.name.full} (${option.value})`
                    : option.value;

                leagueCodeInput.appendChild(option);
            });

    } catch (error) {
        console.error(error);

        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Could not load leagues";
        leagueCodeInput.appendChild(option);
    }
}

function renderJson() {
    jsonPreview.textContent = buildTeamObject();
}

teamNameInput.addEventListener("input", () => {
    if (!teamCodeEdited) {
        teamCodeInput.value = makeCode(teamNameInput.value);
    }

    renderJson();
});

teamCodeInput.addEventListener("input", () => {
    teamCodeEdited = true;
    teamCodeInput.value = makeCode(teamCodeInput.value);
    renderJson();
});

leagueCodeInput.addEventListener("change", renderJson);
locationInput.addEventListener("input", renderJson);

addCommonNameBtn.addEventListener("click", createCommonNameRow);
addNameHistoryBtn.addEventListener("click", createNameHistoryRow);
addLinkBtn.addEventListener("click", createLinkRow);

copyJsonBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(jsonPreview.textContent);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
        copyJsonBtn.textContent = "Copy JSON";
    }, 1000);
});

function resetFormOnLoad() {
    teamNameInput.value = "";
    teamCodeInput.value = "";
    locationInput.value = "";

    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    teamCodeEdited = false;
}

resetFormOnLoad();

loadLeagueOptions();

createCommonNameRow();
createNameHistoryRow();
createLinkRow();
renderJson();