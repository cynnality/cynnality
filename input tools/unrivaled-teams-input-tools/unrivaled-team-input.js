const UNRIVALED_TEAMS_DATA_PATH = "/basketball_101_data_files/unrivaled_teams_data.json";

const teamNameInput = document.getElementById("teamName");
const teamCodeInput = document.getElementById("teamCode");

const startYearInput = document.getElementById("startYear");
const endYearInput = document.getElementById("endYear");
const activeYearsInput = document.getElementById("activeYears");

const color1Input = document.getElementById("color1");
const color2Input = document.getElementById("color2");
const color3Input = document.getElementById("color3");

const preview1 = document.getElementById("preview1");
const preview2 = document.getElementById("preview2");
const preview3 = document.getElementById("preview3");

const championshipList = document.getElementById("championshipList");
const addChampionshipBtn = document.getElementById("addChampionshipBtn");

const jsonPreview = document.getElementById("jsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");

const saveJsonBtn = document.getElementById("saveJsonBtn");

let teamCodeEdited = false;

function makeTeamCode(value) {
    const cleanName = value
        .toLowerCase()
        .replace(/^club\s+/i, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return cleanName ? `bc_${cleanName}` : "";
}

function parseYear(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numberValue = Number(trimmed);
    return Number.isNaN(numberValue) ? trimmed : numberValue;
}

function getShortName(teamName) {
    return teamName.replace(/^Club\s+/i, "").trim();
}

function parseYearList(value) {
    return value
        .split(",")
        .map(year => year.trim())
        .filter(Boolean)
        .map(year => Number(year))
        .filter(year => !Number.isNaN(year));
}

function createChampionshipRow() {
    const row = document.createElement("div");
    row.className = "dynamic-row championship-row";

    row.innerHTML = `
        <label>
            Championship Year
            <input class="champ-year-input" autocomplete="off" placeholder="ex: 2025">
        </label>

        <button type="button" class="remove-row-btn">Remove</button>
    `;

    row.querySelector(".remove-row-btn").addEventListener("click", () => {
        row.remove();
        renderJson();
    });

    row.querySelector(".champ-year-input").addEventListener("input", renderJson);

    championshipList.appendChild(row);
}

function getChampionshipYears() {
    return [...document.querySelectorAll(".champ-year-input")]
        .map(input => parseYear(input.value))
        .filter(year => year !== null && year !== "");
}

function getColors() {
    const colors = {
        color1: color1Input.value.trim(),
        color2: color2Input.value.trim()
    };

    const color3 = color3Input.value.trim();

    if (color3) {
        colors.color3 = color3;
    }

    return colors;
}

function updateColorPreview(input, preview) {
    preview.style.background = input.value.trim() || "#eee";

    input.addEventListener("input", () => {
        preview.style.background = input.value.trim() || "#eee";
        renderJson();
    });
}

function getTeamObject() {
    const teamName = teamNameInput.value.trim();
    const teamCode = teamCodeInput.value.trim() || "bc_team_here";

    return {
        teamCode,

        name: {
            full: teamName,
            short: getShortName(teamName)
        },

        activeSeasons: {
            startYear: parseYear(startYearInput.value),
            endYear: parseYear(endYearInput.value) || "present",
            years: parseYearList(activeYearsInput.value)
        },

        branding: {
            colors: getColors()
        },

        championshipYears: getChampionshipYears(),

        meta: {
            notes: "",
            lastUpdated: ""
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
    teamNameInput.value = "";
    teamCodeInput.value = "";

    startYearInput.value = "";
    endYearInput.value = "";
    activeYearsInput.value = "";

    color1Input.value = "";
    color2Input.value = "";
    color3Input.value = "";

    championshipList.innerHTML = "";

    teamCodeEdited = false;
}

teamNameInput.addEventListener("input", () => {
    if (!teamCodeEdited) {
        teamCodeInput.value = makeTeamCode(teamNameInput.value);
    }

    renderJson();
});

teamCodeInput.addEventListener("input", () => {
    teamCodeEdited = true;
    teamCodeInput.value = makeTeamCode(teamCodeInput.value);
    renderJson();
});

[
    startYearInput,
    endYearInput,
    activeYearsInput
].forEach(input => {
    input.addEventListener("input", renderJson);
});

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
        const response = await fetch("http://127.0.0.1:8787/save-unrivaled-team", {
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

        saveJsonBtn.textContent = "Saved!";

        setTimeout(() => {
            saveJsonBtn.textContent = "Save JSON File";
        }, 1200);
    } catch (error) {
        console.error(error);
        alert("Save failed. Make sure the local save server is running.");
    }
});

addChampionshipBtn.addEventListener("click", createChampionshipRow);

resetFormOnLoad();

updateColorPreview(color1Input, preview1);
updateColorPreview(color2Input, preview2);
updateColorPreview(color3Input, preview3);

createChampionshipRow();
renderJson();