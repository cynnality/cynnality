const leagueNameInput = document.getElementById("leagueName");
const leagueCodeInput = document.getElementById("leagueCode");
const countryInput = document.getElementById("countryInput");
const regionInput = document.getElementById("regionInput");

const commonNamesList = document.getElementById("commonNamesList");
const nameHistoryList = document.getElementById("nameHistoryList");
const linksList = document.getElementById("linksList");

const addCommonNameBtn = document.getElementById("addCommonNameBtn");
const addNameHistoryBtn = document.getElementById("addNameHistoryBtn");
const addLinkBtn = document.getElementById("addLinkBtn");

const jsonPreview = document.getElementById("jsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");

let leagueCodeEdited = false;

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
            <input class="common-name-input" autocomplete="off" placeholder="ex: KBSL">
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

function buildLeagueObject() {
    const leagueName = leagueNameInput.value.trim();
    const leagueCode = leagueCodeInput.value.trim() || "league_code_here";

    const leagueObject = {
        leagueCode,

        name: {
            full: leagueName,
            commonNames: getCommonNames()
        },

        location: {
            country: countryInput.value.trim(),
            region: regionInput.value.trim()
        },

        nameHistory: getNameHistory(),

        links: getLinks(),

        meta: {
            notes: "",
            lastUpdated: ""
        }
    };

    return `"${leagueCode}": ${JSON.stringify(leagueObject, null, 2)}`;
}

function renderJson() {
    jsonPreview.textContent = buildLeagueObject();
}

function resetFormOnLoad() {
    leagueNameInput.value = "";
    leagueCodeInput.value = "";
    countryInput.value = "";
    regionInput.value = "";

    commonNamesList.innerHTML = "";
    nameHistoryList.innerHTML = "";
    linksList.innerHTML = "";

    leagueCodeEdited = false;
}

leagueNameInput.addEventListener("input", () => {
    if (!leagueCodeEdited) {
        leagueCodeInput.value = makeCode(leagueNameInput.value);
    }

    renderJson();
});

leagueCodeInput.addEventListener("input", () => {
    leagueCodeEdited = true;
    leagueCodeInput.value = makeCode(leagueCodeInput.value);
    renderJson();
});

[
    countryInput,
    regionInput
].forEach(input => {
    input.addEventListener("input", renderJson);
});

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

resetFormOnLoad();

createCommonNameRow();
createNameHistoryRow();
createLinkRow();
renderJson();