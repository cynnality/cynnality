const DATA_PATHS = {
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    colleges: "../../basketball_101_data_files/wnba_colleges.json",
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json",
    overseasLeagues: "../../basketball_101_data_files/overseas_leagues_data.json",
    overseasTeams: "../../basketball_101_data_files/overseas_teams_data.json",
};

const utilityLeagueNameInput =
    document.getElementById("utilityLeagueNameInput");

const utilityTeamNameInput =
    document.getElementById("utilityTeamNameInput");

const utilityCountryInput =
    document.getElementById("utilityCountryInput");

const utilityCityInput =
    document.getElementById("utilityCityInput");

const utilityOverseasSeasonInput =
    document.getElementById("utilityOverseasSeasonInput");

const utilityEntryNotesInput =
    document.getElementById("utilityEntryNotesInput");

const saveOverseasUtilityEntryBtn =
    document.getElementById("saveOverseasUtilityEntryBtn");

const utilityEntryStatusMessage =
    document.getElementById("utilityEntryStatusMessage");

const overseasExistingReferenceFields =
    document.getElementById("overseasExistingReferenceFields");

const overseasUtilityEntryFields =
    document.getElementById("overseasUtilityEntryFields");

const utilityReferenceScopeInput = document.getElementById("utilityReferenceScopeInput");
const utilityExistingLeagueField = document.getElementById("utilityExistingLeagueField");
const utilityExistingLeagueCodeInput = document.getElementById("utilityExistingLeagueCodeInput");
const utilityLeagueNameField = document.getElementById("utilityLeagueNameField");

const SAVE_URL = "http://127.0.0.1:8787/save-draft";

let DRAFTS = {};

let TEAMS = {};
let COLLEGES = {};
let currentDraft = null;

let OVERSEAS_LEAGUES = {};
let OVERSEAS_TEAMS = {};

let URL_PARAMS = {};

const draftYearInput = document.getElementById("draftYearInput");
const draftDateField = document.getElementById("draftDateField");
const draftDateInput = document.getElementById("draftDateInput");
const draftTypeInput = document.getElementById("draftTypeInput");
const roundsCountInput = document.getElementById("roundsCountInput");
const draftNameInput = document.getElementById("draftNameInput");
const buildDraftBtn = document.getElementById("buildDraftBtn");

const draftStartPanel = document.getElementById("draftStartPanel");
const startNewDraftBtn = document.getElementById("startNewDraftBtn");
const pullExistingDraftBtn = document.getElementById("pullExistingDraftBtn");
const existingDraftPicker = document.getElementById("existingDraftPicker");
const existingDraftSelect = document.getElementById("existingDraftSelect");
const loadExistingDraftBtn = document.getElementById("loadExistingDraftBtn");
const finalizeDraftBtn = document.getElementById("finalizeDraftBtn");

const pickRoundInput = document.getElementById("pickRoundInput");
const roundPickInput = document.getElementById("roundPickInput");
const overallPickInput = document.getElementById("overallPickInput");
const playerNameInput = document.getElementById("playerNameInput");
const playerIdInput = document.getElementById("playerIdInput");
const collegeNameInput = document.getElementById("collegeNameInput");
const collegeOptions = document.getElementById("collegeOptions");

const isOverseasPlayerInput = document.getElementById("isOverseasPlayerInput");
const collegeOriginSection = document.getElementById("collegeOriginSection");
const overseasOriginSection = document.getElementById("overseasOriginSection");
const overseasCountryInput = document.getElementById("overseasCountryInput");
const overseasLeagueNameInput = document.getElementById("overseasLeagueNameInput");
const overseasTeamCodeInput = document.getElementById("overseasTeamCodeInput");

const teamCodeInput = document.getElementById("teamCodeInput");
const pickNotesInput = document.getElementById("pickNotesInput");
const addPickBtn = document.getElementById("addPickBtn");

const expansionSetupSection = document.getElementById("expansionSetupSection");
const expansionTeamCountInput = document.getElementById("expansionTeamCountInput");
const expansionTeamsList = document.getElementById("expansionTeamsList");

const dispersalSetupSection = document.getElementById("dispersalSetupSection");
const dispersalTeamCountInput = document.getElementById("dispersalTeamCountInput");
const dispersalTeamsList = document.getElementById("dispersalTeamsList");

const previousTeamField = document.getElementById("previousTeamField");
const previousTeamCodeInput = document.getElementById("previousTeamCodeInput");

let selectedExpansionTeams = [];
let selectedDispersalTeams = [];

const pickStatusInput = document.getElementById("pickStatusInput");
const cancelPickEditBtn = document.getElementById("cancelPickEditBtn");

let editingPickId = null;
let editingPickRound = null;

const picksList = document.getElementById("picksList");
const jsonPreview = document.getElementById("jsonPreview");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const statusMessage = document.getElementById("statusMessage");

function makeId(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        year: params.get("year"),
        type: params.get("type"),
        draftId: params.get("draftId"),
        pickId: params.get("pickId"),
        mode: params.get("mode")
    };
}

function applyUrlParamsToForm() {
    URL_PARAMS = getUrlParams();

    if (URL_PARAMS.year) {
        draftYearInput.value = URL_PARAMS.year;
    }

    if (URL_PARAMS.type) {
        draftTypeInput.value = URL_PARAMS.type;
    }

    updateDraftTypeUI();
}

function getOverseasReferenceMode() {
    return document.querySelector(
        'input[name="overseasReferenceMode"]:checked'
    )?.value || "select";
}

function updateOverseasReferenceModeUI() {

    const mode = getOverseasReferenceMode();

    overseasExistingReferenceFields.classList.toggle(
        "hidden",
        mode !== "select"
    );

    overseasUtilityEntryFields.classList.toggle(
        "hidden",
        mode !== "utility"
    );
}

function getTeamName(teamCode) {
    return TEAMS?.[teamCode]?.name?.full || teamCode || "";
}

function createDraftId(year, draftType) {
    return `${year}_${draftType}`;
}

function createPickId({ year, draftType, round, roundPick }) {
    return `${year}_${draftType}_r${round}_p${roundPick}`;
}

function getLeagueDisplayNameByCode(leagueCode) {
    const league = OVERSEAS_LEAGUES?.[leagueCode];

    return (
        league?.name?.display ||
        league?.name?.full ||
        league?.name?.official ||
        leagueCode ||
        ""
    );
}

function populateUtilityExistingLeagueSelect() {
    utilityExistingLeagueCodeInput.innerHTML = `<option value="">Select existing league</option>`;

    Object.entries(OVERSEAS_LEAGUES || {})
        .sort(([, a], [, b]) => {
            return getLeagueDisplayNameByCode(a.leagueCode)
                .localeCompare(getLeagueDisplayNameByCode(b.leagueCode));
        })
        .forEach(([leagueCode, league]) => {
            const option = document.createElement("option");
            option.value = league.leagueCode || leagueCode;
            option.textContent = `${getLeagueDisplayNameByCode(option.value)} (${option.value})`;
            utilityExistingLeagueCodeInput.appendChild(option);
        });
}

function updateUtilityReferenceScopeUI() {
    const scope = utilityReferenceScopeInput.value;

    utilityExistingLeagueField.classList.toggle("hidden", scope !== "team-only");
    utilityLeagueNameField.classList.toggle("hidden", scope === "team-only");
}

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return await response.json();
    } catch (error) {
        console.warn(error);
        return fallback;
    }
}

async function init() {
    const draftsData = await loadJson(DATA_PATHS.drafts, { drafts: {} });
    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    const collegesData = await loadJson(DATA_PATHS.colleges, { colleges: {} });
    const overseasLeaguesData = await loadJson(DATA_PATHS.overseasLeagues, { leagues: {} });
    const overseasTeamsData = await loadJson(DATA_PATHS.overseasTeams, { teams: {} });
    DRAFTS = draftsData.drafts || {};
    TEAMS = teamsData.teams || {};
    COLLEGES = collegesData.colleges || {};
    OVERSEAS_LEAGUES = overseasLeaguesData.leagues || {};
    OVERSEAS_TEAMS = overseasTeamsData.teams || {};

    populateTeamSelect();
    populatePreviousTeamSelect();
    populateCollegeOptions();
    populateOverseasCountrySelect();

    populateUtilityExistingLeagueSelect();
    updateUtilityReferenceScopeUI();

    bindEvents();

    buildExpansionTeamFields();
    buildDispersalTeamFields();

    applyUrlParamsToForm();
    updateOriginUI();
    updateOverseasReferenceModeUI();

    populateExistingDraftSelect();
    showStartOnly();
    renderPreview();

    if (URL_PARAMS.draftId && DRAFTS[URL_PARAMS.draftId]) {
        loadExistingDraftById(URL_PARAMS.draftId);

        if (URL_PARAMS.mode === "pick" && URL_PARAMS.pickId) {
            loadPickIntoForm(URL_PARAMS.pickId);
        }
    }
}

async function createOverseasUtilityEntry() {

    const referenceScope = utilityReferenceScopeInput.value;
    const existingLeagueCode = utilityExistingLeagueCodeInput.value;
    const leagueName = referenceScope === "team-only"
        ? getLeagueDisplayNameByCode(existingLeagueCode)
        : utilityLeagueNameInput.value.trim();

    const entry = UtilityEntryService.buildUtilityEntry({

        title:
            utilityTeamNameInput.value.trim(),

        category:
            "overseas-reference",

        createdFrom: {

            tool:
                "draft-input-tool",

            contextType:
                "draft-overseas-player",

            contextId:
                currentDraft?.draftId || ""

        },

        task: {
            taskType: "create-or-connect-reference",
            targetDataType: referenceScope === "team-only"
                ? "overseas-team"
                : "overseas-league-and-team",
            actionNeeded: referenceScope === "team-only"
                ? "Create overseas team under existing league."
                : "Create overseas league and team reference."
        },

        referenceRequest: {
            leagueCode: referenceScope === "team-only" ? existingLeagueCode : "",
            leagueName,
            teamName: utilityTeamNameInput.value.trim(),
            country: utilityCountryInput.value.trim(),
            city: utilityCityInput.value.trim(),
            season: utilityOverseasSeasonInput.value.trim()
        },

        wires: UtilityEntryService.getOverseasUtilityWires(
        referenceScope,
        "player-input-tool"
        ),

        attachedTo: [
            {
                type: "draft",
                id: currentDraft?.draftId || ""
            },
            {
                type: "draft-pick",
                id: createPickId({
                    year: Number(draftYearInput.value),
                    draftType: draftTypeInput.value,
                    round: Number(pickRoundInput.value),
                    roundPick: Number(roundPickInput.value)
                })
            }
        ],

        notes:
            utilityEntryNotesInput.value.trim()

    });

    await UtilityEntryService.saveEntry(entry);

    utilityEntryStatusMessage.textContent =
        "Utility entry saved.";

    return entry;
}

function getAllPicksFromDraft(draft) {
    return Object.values(draft?.rounds || {})
        .flatMap(round => Object.values(round.picks || {}));
}

function findPickById(pickId) {
    return getAllPicksFromDraft(currentDraft).find(pick => pick.pickId === pickId);
}

function loadPickIntoForm(pickId) {
    const pick = findPickById(pickId);

    if (!pick) {
        statusMessage.textContent = `Pick not found: ${pickId}`;
        return;
    }

    editingPickId = pickId;

    editingPickRound = String(pick.round || 1);
    addPickBtn.textContent = "Save Pick Edit";

    if (cancelPickEditBtn) {
        cancelPickEditBtn.classList.remove("hidden");
    }

    if (pickStatusInput) {
        pickStatusInput.value = pick.pickStatus || "selection";
    }

    pickRoundInput.value = String(pick.round || 1);
    roundPickInput.value = pick.roundPick || 1;
    overallPickInput.value = pick.overallPick || 1;

    playerNameInput.value = pick.player?.playerName || "";
    playerIdInput.value = pick.player?.playerId || "";

    teamCodeInput.value = pick.team?.teamCode || "";
    previousTeamCodeInput.value = pick.previousTeam?.teamCode || "";

    pickNotesInput.value = pick.notes || "";

    if (pick.overseas) {
        isOverseasPlayerInput.checked = true;
        updateOriginUI();

        overseasCountryInput.value = pick.overseas.country || "";
        updateOverseasLeagueAndTeams();

        overseasTeamCodeInput.value = pick.overseas.teamCode || "";
        collegeNameInput.value = "";
    } else {
        isOverseasPlayerInput.checked = false;
        updateOriginUI();

        collegeNameInput.value = pick.college?.collegeName || "";
        overseasCountryInput.value = "";
        overseasLeagueNameInput.value = "";
        overseasTeamCodeInput.innerHTML = `<option value="">Select overseas team</option>`;
    }

    statusMessage.textContent = `Editing ${pickId}`;
}

function populateTeamSelect() {
    teamCodeInput.innerHTML = `<option value="">Select team</option>`;

    Object.values(TEAMS)
        .sort((a, b) => {
            const nameA = a?.name?.full || a.teamCode;
            const nameB = b?.name?.full || b.teamCode;
            return nameA.localeCompare(nameB);
        })
        .forEach(team => {
            const option = document.createElement("option");
            option.value = team.teamCode;
            option.textContent = team?.name?.full || team.teamCode;
            teamCodeInput.appendChild(option);
        });
}

function populatePreviousTeamSelect() {
    previousTeamCodeInput.innerHTML = `<option value="">Select previous team</option>`;

    Object.values(TEAMS)
        .sort((a, b) => {
            const nameA = a?.name?.full || a.teamCode;
            const nameB = b?.name?.full || b.teamCode;
            return nameA.localeCompare(nameB);
        })
        .forEach(team => {
            const option = document.createElement("option");
            option.value = team.teamCode;
            option.textContent = team?.name?.full || team.teamCode;
            previousTeamCodeInput.appendChild(option);
        });
}

function populateRoundSelect(roundsCount) {
    pickRoundInput.innerHTML = "";

    for (let round = 1; round <= roundsCount; round++) {
        const option = document.createElement("option");
        option.value = String(round);
        option.textContent = `Round ${round}`;
        pickRoundInput.appendChild(option);
    }
}

function populateExistingDraftSelect() {
    if (!existingDraftSelect) return;

    existingDraftSelect.innerHTML = `<option value="">Select draft</option>`;

    Object.values(DRAFTS)
        .sort((a, b) => {
            const seasonA = Number(a.season || 0);
            const seasonB = Number(b.season || 0);

            if (seasonA !== seasonB) {
                return seasonB - seasonA;
            }

            return String(a.draftName || "").localeCompare(String(b.draftName || ""));
        })
        .forEach(draft => {
            const option = document.createElement("option");
            option.value = draft.draftId;
            option.textContent = `${draft.season} — ${draft.draftName || draft.draftId}`;
            existingDraftSelect.appendChild(option);
        });
}

function showDraftEditor() {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.remove("hidden");
    });
}

function showStartOnly() {
    document.querySelectorAll(".panel").forEach(panel => {
        if (panel.id !== "draftStartPanel") {
            panel.classList.add("hidden");
        }
    });
}

function populateCollegeOptions() {
    collegeOptions.innerHTML = "";

    Object.entries(COLLEGES)
        .sort(([, a], [, b]) => {
            const nameA = a?.name || "";
            const nameB = b?.name || "";
            return nameA.localeCompare(nameB);
        })
        .forEach(([collegeId, college]) => {
            const option = document.createElement("option");
            option.value = college.name;
            option.dataset.collegeId = collegeId;
            collegeOptions.appendChild(option);
        });
}

function findCollegeByName(collegeName) {
    const normalizedInput = String(collegeName || "").trim().toLowerCase();

    return Object.entries(COLLEGES).find(([, college]) => {
        return String(college?.name || "").trim().toLowerCase() === normalizedInput;
    });
}

function buildCollegeObject(collegeName) {
    const cleanName = String(collegeName || "").trim();

    if (!cleanName) {
        return null;
    }

    const existingCollege = findCollegeByName(cleanName);

    if (existingCollege) {
        const [collegeId, collegeData] = existingCollege;

        return {
            collegeId,
            collegeName: collegeData.name,
            existsInCollegeFile: true
        };
    }

    return {
        collegeId: makeId(cleanName),
        collegeName: cleanName,
        existsInCollegeFile: false
    };
}

function findLeagueByCountry(country) {
    const cleanCountry = String(country || "").trim().toLowerCase();

    return Object.entries(OVERSEAS_LEAGUES).find(([, league]) => {
        return String(league?.location?.country || "").trim().toLowerCase() === cleanCountry;
    });
}

function getTeamsForLeague(leagueCode) {
    return Object.entries(OVERSEAS_TEAMS)
        .filter(([, team]) => team?.league?.leagueCode === leagueCode)
        .sort(([, a], [, b]) => {
            const nameA = a?.name?.full || "";
            const nameB = b?.name?.full || "";
            return nameA.localeCompare(nameB);
        });
}

function populateOverseasCountrySelect() {
    const countries = [...new Set(
        Object.values(OVERSEAS_LEAGUES)
            .map(league => league?.location?.country)
            .filter(Boolean)
    )].sort();

    overseasCountryInput.innerHTML = `<option value="">Select country</option>`;

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        overseasCountryInput.appendChild(option);
    });
}

function updateOriginUI() {
    const isOverseasPlayer = isOverseasPlayerInput.checked;

    collegeOriginSection.classList.toggle("hidden", isOverseasPlayer);
    overseasOriginSection.classList.toggle("hidden", !isOverseasPlayer);
}

function updateOverseasLeagueAndTeams() {
    const country = overseasCountryInput.value.trim();
    const matchedLeague = findLeagueByCountry(country);

    overseasTeamCodeInput.innerHTML = `<option value="">Select overseas team</option>`;

    if (!matchedLeague) {
        overseasLeagueNameInput.value = "";
        return;
    }

    const [leagueCode, league] = matchedLeague;

    overseasLeagueNameInput.value = league?.name?.full || leagueCode;

    getTeamsForLeague(leagueCode).forEach(([teamCode, team]) => {
        const option = document.createElement("option");
        option.value = teamCode;
        option.textContent = team?.name?.full || teamCode;
        overseasTeamCodeInput.appendChild(option);
    });
}

function buildOverseasObject() {
    if (!isOverseasPlayerInput.checked) {
        return null;
    }

    if (getOverseasReferenceMode() === "utility") {
        return {
            country: utilityCountryInput.value.trim(),
            leagueCode: null,
            leagueName: utilityLeagueNameInput.value.trim(),
            teamCode: null,
            teamName: utilityTeamNameInput.value.trim(),
            existsInOverseasData: false,
            referenceMode: "utility"
        };
    }

    const country = overseasCountryInput.value.trim();
    const matchedLeague = findLeagueByCountry(country);
    const overseasTeamCode = overseasTeamCodeInput.value;

    if (!country) {
        alert("Please enter the overseas player's country.");
        return false;
    }

    if (!matchedLeague) {
        return {
            country,
            leagueCode: null,
            leagueName: "",
            teamCode: overseasTeamCode || null,
            teamName: overseasTeamCode
                ? OVERSEAS_TEAMS?.[overseasTeamCode]?.name?.full || overseasTeamCode
                : "",
            existsInOverseasData: false
        };
    }

    const [leagueCode, league] = matchedLeague;

    return {
        country,
        leagueCode,
        leagueName: league?.name?.full || leagueCode,
        teamCode: overseasTeamCode || null,
        teamName: overseasTeamCode
            ? OVERSEAS_TEAMS?.[overseasTeamCode]?.name?.full || overseasTeamCode
            : "",
        existsInOverseasData: Boolean(overseasTeamCode)
    };
}

function setExpansionTeamFieldsFromDraft(draft) {
    const expansionTeams = draft?.specialTeams?.expansionTeams || [];

    expansionTeamCountInput.value = expansionTeams.length || 1;
    buildExpansionTeamFields();

    const selects = [...document.querySelectorAll(".expansion-team-select")];

    selects.forEach((select, index) => {
        select.value = expansionTeams[index]?.teamCode || "";
    });

    updatePickTeamOptions();
    autoSelectSingleExpansionTeam();
}

function getSelectedExpansionTeamCodes() {
    return [...document.querySelectorAll(".expansion-team-select")]
        .map(select => select.value)
        .filter(Boolean);
}

function updatePickTeamOptions() {
    const draftType = draftTypeInput.value;

    if (draftType !== "expansion") {
        populateTeamSelect();
        return;
    }

    let selectedCodes = [];

    if (currentDraft?.specialTeams?.expansionTeams?.length) {
        selectedCodes = currentDraft.specialTeams.expansionTeams
            .map(team => team.teamCode)
            .filter(Boolean);
    }

    if (!selectedCodes.length) {
        selectedCodes = getSelectedExpansionTeamCodes();
    }

    teamCodeInput.innerHTML = `<option value="">Select drafting team</option>`;

    selectedCodes.forEach(teamCode => {
        const option = document.createElement("option");
        option.value = teamCode;
        option.textContent = getTeamName(teamCode);
        teamCodeInput.appendChild(option);
    });

    autoSelectSingleExpansionTeam();
}

function autoSelectSingleExpansionTeam() {
    if (draftTypeInput.value !== "expansion") {
        return;
    }

    const options = [...teamCodeInput.options]
        .filter(option => option.value);

    if (options.length === 1) {
        teamCodeInput.value = options[0].value;
    }
}

function autoSelectSingleDispersalTeam() {
    if (draftTypeInput.value !== "dispersal") {
        return;
    }

    const options = [...previousTeamCodeInput.options]
        .filter(option => option.value);

    if (options.length === 1) {
        previousTeamCodeInput.value = options[0].value;
    }
}

function buildExpansionTeamFields() {
    const count = Number(expansionTeamCountInput.value) || 1;
    expansionTeamsList.innerHTML = "";

    for (let i = 1; i <= count; i++) {
        const label = document.createElement("label");
        label.innerHTML = `
            Expansion Team ${i}
            <select class="expansion-team-select">
                <option value="">Select expansion team</option>
                ${Object.values(TEAMS)
                    .sort((a, b) => {
                        const nameA = a?.name?.full || a.teamCode;
                        const nameB = b?.name?.full || b.teamCode;
                        return nameA.localeCompare(nameB);
                    })
                    .map(team => {
                        return `<option value="${team.teamCode}">${team?.name?.full || team.teamCode}</option>`;
                    })
                    .join("")}
            </select>
        `;

        expansionTeamsList.appendChild(label);
    }

    document.querySelectorAll(".expansion-team-select").forEach(select => {
        select.addEventListener("change", updatePickTeamOptions);
    });

    updatePickTeamOptions();
}

function collectExpansionTeams() {
    const selects = [...document.querySelectorAll(".expansion-team-select")];

    selectedExpansionTeams = selects
        .map(select => select.value)
        .filter(Boolean)
        .map(teamCode => {
            return {
                teamCode,
                teamName: getTeamName(teamCode)
            };
        });

    return selectedExpansionTeams;
}

function buildDispersalTeamFields() {
    const count = Number(dispersalTeamCountInput.value) || 1;
    dispersalTeamsList.innerHTML = "";

    for (let i = 1; i <= count; i++) {
        const label = document.createElement("label");

        label.innerHTML = `
            Dispersal Team ${i}
            <select class="dispersal-team-select">
                <option value="">Select dispersal team</option>
                ${Object.values(TEAMS)
                    .sort((a, b) => {
                        const nameA = a?.name?.full || a.teamCode;
                        const nameB = b?.name?.full || b.teamCode;
                        return nameA.localeCompare(nameB);
                    })
                    .map(team => {
                        return `<option value="${team.teamCode}">${team?.name?.full || team.teamCode}</option>`;
                    })
                    .join("")}
            </select>
        `;

        dispersalTeamsList.appendChild(label);
    }

    document.querySelectorAll(".dispersal-team-select").forEach(select => {
        select.addEventListener("change", updatePreviousTeamOptions);
    });

    updatePreviousTeamOptions();
}

function collectDispersalTeams() {
    const selects = [...document.querySelectorAll(".dispersal-team-select")];

    selectedDispersalTeams = selects
        .map(select => select.value)
        .filter(Boolean)
        .map(teamCode => {
            return {
                teamCode,
                teamName: getTeamName(teamCode)
            };
        });

    return selectedDispersalTeams;
}

function getSelectedDispersalTeamCodes() {
    return [...document.querySelectorAll(".dispersal-team-select")]
        .map(select => select.value)
        .filter(Boolean);
}

function setDispersalTeamFieldsFromDraft(draft) {
    const dispersalTeams = draft?.specialTeams?.dispersalTeams || [];

    dispersalTeamCountInput.value = dispersalTeams.length || 1;
    buildDispersalTeamFields();

    const selects = [...document.querySelectorAll(".dispersal-team-select")];

    selects.forEach((select, index) => {
        select.value = dispersalTeams[index]?.teamCode || "";
    });

    updatePreviousTeamOptions();
    autoSelectSingleDispersalTeam();
}

function updatePreviousTeamOptions() {
    const draftType = draftTypeInput.value;

    if (draftType !== "dispersal") {
        populatePreviousTeamSelect();
        return;
    }

    const selectedCodes = getSelectedDispersalTeamCodes();

    previousTeamCodeInput.innerHTML = `<option value="">Select previous team</option>`;

    selectedCodes.forEach(teamCode => {
        const option = document.createElement("option");
        option.value = teamCode;
        option.textContent = getTeamName(teamCode);
        previousTeamCodeInput.appendChild(option);
    });
}

function updateDraftTypeUI() {
    const draftType = draftTypeInput.value;

    expansionSetupSection.classList.toggle("hidden", draftType !== "expansion");
    dispersalSetupSection.classList.toggle("hidden", draftType !== "dispersal");

    previousTeamField.classList.toggle(
        "hidden",
        draftType !== "expansion" && draftType !== "dispersal"
    );

    draftDateField.classList.toggle("hidden", draftType === "college");

    if (draftType === "college") {
        draftNameInput.value = `${draftYearInput.value} WNBA College Draft`;
        draftDateInput.value = "";
    }

    if (draftType === "expansion") {
        draftNameInput.value = `${draftYearInput.value} WNBA Expansion Draft`;
    }

    if (draftType === "dispersal") {
        draftNameInput.value = `${draftYearInput.value} WNBA Dispersal Draft`;
    }

    updatePickTeamOptions();
    updatePreviousTeamOptions();
}

function loadExistingDraftById(draftId) {
    const draft = DRAFTS[draftId];

    if (!draft) {
        statusMessage.textContent = `Draft not found: ${draftId}`;
        return;
    }

    currentDraft = cloneData(draft);

    draftYearInput.value = currentDraft.season || "";
    draftTypeInput.value = currentDraft.draftType || "college";
    roundsCountInput.value = currentDraft.roundsCount || 1;
    draftNameInput.value = currentDraft.draftName || "";

    draftDateInput.value = currentDraft.draftDate
        ? String(currentDraft.draftDate).slice(0, 10)
        : "";

    updateDraftTypeUI();
    populateRoundSelect(Number(currentDraft.roundsCount) || 1);

    if (currentDraft.draftType === "expansion") {
        setExpansionTeamFieldsFromDraft(currentDraft);
        updatePickTeamOptions();
        autoSelectSingleExpansionTeam();
    } else if (currentDraft.draftType === "dispersal") {
        setDispersalTeamFieldsFromDraft(currentDraft);
    } else {
        populateTeamSelect();
        populatePreviousTeamSelect();
    }

    showDraftEditor();
    renderAll();

    statusMessage.textContent = `Loaded ${currentDraft.draftId}`;
}

function buildDraft() {
    showDraftEditor();
    const year = Number(draftYearInput.value);
    const draftType = draftTypeInput.value;
    const roundsCount = Number(roundsCountInput.value) || 1;
    const draftId = createDraftId(year, draftType);
        if (DRAFTS[draftId]) {
            currentDraft = cloneData(DRAFTS[draftId]);

            draftNameInput.value = currentDraft.draftName || "";
            draftTypeInput.value = currentDraft.draftType || draftType;

            updateDraftTypeUI();

            draftDateInput.value = currentDraft.draftDate
                ? String(currentDraft.draftDate).slice(0, 10)
                : "";
            roundsCountInput.value = currentDraft.roundsCount || 1;

            populateRoundSelect(Number(currentDraft.roundsCount) || 1);

            if (currentDraft.draftType === "expansion") {
                setExpansionTeamFieldsFromDraft(currentDraft);
            } else if (currentDraft.draftType === "dispersal") {
                setDispersalTeamFieldsFromDraft(currentDraft);
            } else {
                populateTeamSelect();
                populatePreviousTeamSelect();
            }

            renderAll();

            statusMessage.textContent = `Loaded existing ${draftId}`;
            return;
        }
    const expansionTeams = draftType === "expansion" ? collectExpansionTeams() : [];
    const dispersalTeams = draftType === "dispersal" ? collectDispersalTeams() : [];

    updatePickTeamOptions();
    updatePreviousTeamOptions();

    if (!draftNameInput.value.trim()) {
        if (draftType === "expansion") {
            draftNameInput.value = `${year} WNBA Expansion Draft`;
        } else if (draftType === "dispersal") {
            draftNameInput.value = `${year} WNBA Dispersal Draft`;
        } else {
            draftNameInput.value = `${year} WNBA College Draft`;
        }
    }

    currentDraft = {
        draftId,
        season: year,
        seasonId: String(year),
        draftType,
        draftName: draftNameInput.value.trim(),
        draftDate: draftDateInput.value || null,
        roundsCount,
        specialTeams: {
            expansionTeams,
            dispersalTeams
        },
        rounds: {},
        notes: "",
        links: [],
        entryIds: [],
        status: {
            isFinalized: false,
            finalizedAt: null
        },
    };

    for (let round = 1; round <= roundsCount; round++) {
        currentDraft.rounds[String(round)] = {
            roundNumber: round,
            picks: {}
        };
    }

    populateRoundSelect(roundsCount);
    renderAll();
}

function buildPickFromForm(utilityEntry = null) {
    const year = Number(draftYearInput.value);
    const draftType = draftTypeInput.value;
    const round = Number(pickRoundInput.value);
    const roundPick = Number(roundPickInput.value);
    const overallPick = Number(overallPickInput.value);
    const playerName = playerNameInput.value.trim();
    const playerId = playerIdInput.value.trim() || makeId(playerName);
    const overseas = buildOverseasObject();
    if (overseas === false) return null;

    const college = isOverseasPlayerInput.checked
        ? null
        : buildCollegeObject(collegeNameInput.value);
    const teamCode = teamCodeInput.value;

    const previousTeamCode = previousTeamCodeInput.value;
    const previousTeam =
        (draftType === "expansion" || draftType === "dispersal") && previousTeamCode
            ? {
                teamCode: previousTeamCode,
                teamName: getTeamName(previousTeamCode)
            }
            : null;

    if (!currentDraft) {
        alert("Build the draft first.");
        return null;
    }

    const pickStatus = pickStatusInput?.value || "selection";

    if (!teamCode) {
        alert("Please select the drafting team.");
        return null;
    }

    if (pickStatus === "selection" && (!playerName || !playerId)) {
        alert("Please add player name and player ID.");
        return null;
    }

    if (
        pickStatus === "selection" &&
        (draftType === "expansion" || draftType === "dispersal") &&
        !previousTeamCode
    ) {
        alert("Please select the player's previous team.");
        return null;
    }

    const pickId = createPickId({
        year,
        draftType,
        round,
        roundPick
    });

    return {
        pickId,
        overallPick,
        round,
        roundPick,
        pickStatus,
        player: pickStatus === "selection"
            ? { playerId, playerName }
            : null,
        college: pickStatus === "selection" ? college : null,
        overseas: pickStatus === "selection"
            ? {
                ...overseas,
                utilityEntryId: utilityEntry?.entryId || "",
                utilityEntryStatus: utilityEntry ? "open" : ""
            }
            : null,
        team: {
            teamCode,
            teamName: getTeamName(teamCode)
        },
        previousTeam,
        notes: pickNotesInput.value.trim(),
        links: [],
        entryIds: utilityEntry?.entryId ? [utilityEntry.entryId] : []
    };
}

async function addOrUpdatePick() {
    let utilityEntry = null;

    const isUtilityMode =
        isOverseasPlayerInput.checked &&
        getOverseasReferenceMode() === "utility";

    if (isUtilityMode) {
        if (!utilityTeamNameInput.value.trim()) {
            alert("Please enter the overseas team name for the utility entry.");
            return;
        }

        utilityEntry = await createOverseasUtilityEntry();
    }

    const pick = buildPickFromForm(utilityEntry);
    if (!pick) return;

    const roundKey = String(pick.round);

    if (!currentDraft.rounds[roundKey]) {
        currentDraft.rounds[roundKey] = {
            roundNumber: pick.round,
            picks: {}
        };
    }

    if (editingPickId && editingPickRound) {
        delete currentDraft.rounds[editingPickRound]?.picks?.[editingPickId];
    }

    currentDraft.rounds[roundKey].picks[pick.pickId] = pick;

    editingPickId = null;
    editingPickRound = null;

    clearPickFormAfterAdd();
    renderAll();

    await saveDraft();
}

function clearPickFormAfterAdd() {
    editingPickId = null;

    const nextOverall = Number(overallPickInput.value || 0) + 1;
    const nextRoundPick = Number(roundPickInput.value || 0) + 1;

    overallPickInput.value = nextOverall;
    roundPickInput.value = nextRoundPick;

    playerNameInput.value = "";
    draftDateInput.value = currentDraft.draftDate || "";
    playerIdInput.value = "";
    collegeNameInput.value = "";
    isOverseasPlayerInput.checked = false;
    overseasCountryInput.value = "";
    overseasLeagueNameInput.value = "";
    overseasTeamCodeInput.innerHTML = `<option value="">Select overseas team</option>`;
    updateOriginUI();
    teamCodeInput.value = "";
    pickNotesInput.value = "";
    previousTeamCodeInput.value = "";

    editingPickRound = null;
    addPickBtn.textContent = "Save Pick";

    if (cancelPickEditBtn) {
        cancelPickEditBtn.classList.add("hidden");
    }

    if (pickStatusInput) {
        pickStatusInput.value = "selection";
    }

    updatePickTeamOptions();
    autoSelectSingleExpansionTeam();
    autoSelectSingleDispersalTeam();
}

function renderPicksList() {
    picksList.innerHTML = "";

    if (!currentDraft) {
        picksList.textContent = "No draft built yet.";
        return;
    }

    Object.values(currentDraft.rounds).forEach(round => {
        const roundTitle = document.createElement("h3");
        roundTitle.textContent = `Round ${round.roundNumber}`;
        picksList.appendChild(roundTitle);

        const picks = Object.values(round.picks).sort(
            (a, b) => a.overallPick - b.overallPick
        );

        if (!picks.length) {
            const empty = document.createElement("p");
            empty.textContent = "No picks added yet.";
            picksList.appendChild(empty);
            return;
        }

        picks.forEach(pick => {
            const card = document.createElement("div");
            card.className = "pick-card";

            card.innerHTML = `
                <div class="pick-card-title">
                    #${pick.overallPick} — ${pick.player?.playerName || "No Pick"}
                </div>
                <div class="pick-card-meta">
                    Round ${pick.round}, Pick ${pick.roundPick} • ${pick.team.teamName}
                </div>
                <div class="pick-card-meta">
                    Player ID: ${pick.player?.playerId || "—"}
                </div>
                <div class="pick-card-meta">
                    College: ${pick.college?.collegeName || "—"}
                </div>
                <div class="pick-card-meta">
                    Overseas: ${pick.overseas?.teamName || pick.overseas?.country || "—"}
                </div>
            `;

            card.style.cursor = "pointer";
            card.addEventListener("click", () => {
                loadPickIntoForm(pick.pickId);
            });

            picksList.appendChild(card);
        });
    });
}

function renderPreview() {
    jsonPreview.textContent = JSON.stringify(currentDraft || {}, null, 2);
}

function renderAll() {
    renderPicksList();
    renderPreview();
}

function finalizeDraft() {
    if (!currentDraft) {
        alert("Load or build a draft first.");
        return;
    }

    currentDraft.status = {
        ...(currentDraft.status || {}),
        isFinalized: true,
        finalizedAt: new Date().toISOString()
    };

    renderAll();
    statusMessage.textContent = `${currentDraft.draftId} marked as finalized. Save draft to keep this change.`;
}

async function saveDraft() {
    if (!currentDraft) {
        alert("Build the draft first.");
        return;
    }

    currentDraft.draftName = draftNameInput.value.trim();
    currentDraft.draftDate = draftDateInput.value || null;
    currentDraft.roundsCount = Number(roundsCountInput.value) || 1;

    currentDraft.specialTeams = {
        expansionTeams: currentDraft.draftType === "expansion"
            ? collectExpansionTeams()
            : [],
        dispersalTeams: currentDraft.draftType === "dispersal"
            ? collectDispersalTeams()
            : []
    };

    currentDraft.status = currentDraft.status || {
        isFinalized: false,
        finalizedAt: null
    };

    try {
        const response = await fetch(SAVE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(currentDraft)
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
            throw new Error(result.error || "Save failed.");
        }

        statusMessage.textContent = result.message;
        DRAFTS[currentDraft.draftId] = cloneData(currentDraft);
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
}

function bindEvents() {

    document
        .querySelectorAll(
            'input[name="overseasReferenceMode"]'
        )
        .forEach(radio => {

            radio.addEventListener(
                "change",
                updateOverseasReferenceModeUI
            );

        });

    if (startNewDraftBtn) {
        startNewDraftBtn.addEventListener("click", () => {
            showDraftEditor();
            currentDraft = null;
            buildDraft();
        });
    }

    if (pullExistingDraftBtn) {
        pullExistingDraftBtn.addEventListener("click", () => {
            existingDraftPicker.classList.toggle("hidden");
        });
    }

    if (loadExistingDraftBtn) {
        loadExistingDraftBtn.addEventListener("click", () => {
            loadExistingDraftById(existingDraftSelect.value);
        });
    }

    if (finalizeDraftBtn) {
        finalizeDraftBtn.addEventListener("click", finalizeDraft);
    }

    buildDraftBtn.addEventListener("click", buildDraft);
    addPickBtn.addEventListener("click", addOrUpdatePick);
    saveDraftBtn.addEventListener("click", saveDraft);

    expansionTeamCountInput.addEventListener("input", buildExpansionTeamFields);
    dispersalTeamCountInput.addEventListener("input", buildDispersalTeamFields);

    isOverseasPlayerInput.addEventListener("change", updateOriginUI);
    overseasCountryInput.addEventListener("change", updateOverseasLeagueAndTeams);

    utilityReferenceScopeInput.addEventListener("change", updateUtilityReferenceScopeUI);

    playerNameInput.addEventListener("input", () => {
        playerIdInput.value = makeId(playerNameInput.value);
    });

    draftYearInput.addEventListener("input", () => {
        updateDraftTypeUI();
    });

    draftTypeInput.addEventListener("change", () => {
        updateDraftTypeUI();
        buildExpansionTeamFields();
        buildDispersalTeamFields();
        buildDraft();
    });

    if (cancelPickEditBtn) {
        cancelPickEditBtn.addEventListener("click", clearPickFormAfterAdd);
    }

}

init();