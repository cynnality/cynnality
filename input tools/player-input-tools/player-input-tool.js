console.log("New Player Input Tool loaded");

// =======================================================
// Data paths
// =======================================================
const PLAYERS_PATH = "../../basketball_101_data_files/wnba_olympic_players_v2.json";
const WNBA_TEAMS_PATH = "../../basketball_101_data_files/wnba_static_data_v2.json";
const COLLEGES_PATH = "../../basketball_101_data_files/wnba_colleges.json";

let PLAYERS = {};
let WNBA_TEAMS = {};
let COLLEGES = {};

let playerIdManualMode = false;

// =======================================================
// Main DOM refs
// =======================================================
const playerSelect = document.getElementById("playerSelect");
const playerNameInput = document.getElementById("playerName");
const playerIdInput = document.getElementById("playerId");
const editPlayerIdBtn = document.getElementById("editPlayerIdBtn");

const saveJsonBtn = document.getElementById("saveJsonBtn");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const jsonPreview = document.getElementById("jsonPreview");

// Summary
const summaryName = document.getElementById("summaryName");
const summaryId = document.getElementById("summaryId");
const summaryStatus = document.getElementById("summaryStatus");
const summaryDraft = document.getElementById("summaryDraft");
const summaryCollege = document.getElementById("summaryCollege");
const summaryWnba = document.getElementById("summaryWnba");

// College refs
const collegeSelect = document.getElementById("collegeSelect");
const collegeIdInput = document.getElementById("collegeId");
const collegeStartInput = document.getElementById("collegeStartYear");
const collegeEndInput = document.getElementById("collegeEndYear");

const ncaaChampionships = [];
const championships = [];
const playerImages = [];

// Draft refs
const draftYearInput = document.getElementById("draftYear");
const draftPickInput = document.getElementById("draftPick");
const draftedBySelect = document.getElementById("draftedBySelect");
const draftedByInput = document.getElementById("draftedBy");
const acquiredBySelect = document.getElementById("acquiredBySelect");
const acquiredByInput = document.getElementById("acquiredBy");
const transactionNoteInput = document.getElementById("transactionNote");

const draftDayTradeWrapper = document.getElementById("draftDayTradeWrapper");

// WNBA timeline refs
const playerActiveYesInput = document.getElementById("playerActiveYes");
const playerActiveNoInput = document.getElementById("playerActiveNo");
const retiredYearWrapper = document.getElementById("retiredYearWrapper");
const retiredYearInput = document.getElementById("retiredYear");

const wnbaTimelineEl = document.getElementById("wnbaTimeline");
const selectedSeasonLabel = document.getElementById("selectedSeasonLabel");
const prevSeasonBtn = document.getElementById("prevSeasonBtn");
const nextSeasonBtn = document.getElementById("nextSeasonBtn");
const copyPreviousSeasonBtn = document.getElementById("copyPreviousSeasonBtn");
const saveSeasonBtn = document.getElementById("saveSeasonBtn");
const addSeasonTeamEntryBtn = document.getElementById("addSeasonTeamEntryBtn");
const addSeasonSitOutEntryBtn = document.getElementById("addSeasonSitOutEntryBtn");
const seasonEntriesList = document.getElementById("seasonEntriesList");

// Images
const imageFileNameInput = document.getElementById("imageFileName");
const imageAltInput = document.getElementById("imageAlt");
const imageSourceLinkInput = document.getElementById("imageSourceLink");
const addImageBtn = document.getElementById("addImageBtn");
const imagesList = document.getElementById("imagesList");

// NCAA championships
const ncaaChampionshipsWrapper = document.getElementById("ncaaChampionshipsWrapper");
const ncaaChampionshipYearInput = document.getElementById("ncaaChampionshipYear");
const addNcaaChampionshipBtn = document.getElementById("addNcaaChampionshipBtn");
const ncaaChampionshipsList = document.getElementById("ncaaChampionshipsList");

// WNBA championships
const championshipYearInput = document.getElementById("championshipYear");
const championshipTeamSelect = document.getElementById("championshipTeamSelect");
const championshipTeamCodeInput = document.getElementById("championshipTeamCode");
const finalsMvpInput = document.getElementById("finalsMvp");
const addChampionshipBtn = document.getElementById("addChampionshipBtn");
const championshipsList = document.getElementById("championshipsList");
const wnbaChampionshipsWrapper = document.getElementById("wnbaChampionshipsWrapper");

const OVERSEAS_TEAMS_PATH = "/basketball_101_data_files/overseas_teams_data.json";
const UNRIVALED_TEAMS_PATH = "/basketball_101_data_files/unrivaled_teams_data.json";

let OVERSEAS_TEAMS = {};
let UNRIVALED_TEAMS = {};

const overseasTeams = [];
const unrivaledTeams = [];
const teamUsaMedals = [];

// =======================================================
// WNBA timeline state
// =======================================================
let wnbaSeasonTimeline = [];
let selectedTimelineYear = null;

let editingOverseasIndex = null;
let editingUnrivaledIndex = null;
let editingOlympicIndex = null;
let editingFibaIndex = null;

// Overseas
const overseasExperienceWrapper = document.getElementById("overseasExperienceWrapper");
const overseasTeamSelect = document.getElementById("overseasTeamSelect");
const overseasTeamInput = document.getElementById("overseasTeam");
const overseasSeasonInput = document.getElementById("overseasSeason");
const overseasNoteInput = document.getElementById("overseasNote");
const copyPreviousOverseasBtn = document.getElementById("copyPreviousOverseasBtn");
const addOverseasBtn = document.getElementById("addOverseasBtn");
const saveOverseasEditBtn = document.getElementById("saveOverseasEditBtn");
const cancelOverseasEditBtn = document.getElementById("cancelOverseasEditBtn");
const overseasList = document.getElementById("overseasList");

const overseasExistingReferenceFields = document.getElementById("overseasExistingReferenceFields");
const overseasUtilityEntryFields = document.getElementById("overseasUtilityEntryFields");

const utilityLeagueNameInput = document.getElementById("utilityLeagueNameInput");
const utilityTeamNameInput = document.getElementById("utilityTeamNameInput");
const utilityCountryInput = document.getElementById("utilityCountryInput");
const utilityCityInput = document.getElementById("utilityCityInput");
const utilityEntryNotesInput = document.getElementById("utilityEntryNotesInput");
const utilityEntryStatusMessage = document.getElementById("utilityEntryStatusMessage");

// Unrivaled
const unrivaledExperienceWrapper = document.getElementById("unrivaledExperienceWrapper");
const unrivaledTeamSelect = document.getElementById("unrivaledTeamSelect");
const unrivaledTeamInput = document.getElementById("unrivaledTeam");
const unrivaledYearInput = document.getElementById("unrivaledYear");
const addUnrivaledBtn = document.getElementById("addUnrivaledBtn");
const saveUnrivaledEditBtn = document.getElementById("saveUnrivaledEditBtn");
const cancelUnrivaledEditBtn = document.getElementById("cancelUnrivaledEditBtn");
const unrivaledList = document.getElementById("unrivaledList");

// National team
const nationalTeamWrapper = document.getElementById("nationalTeamWrapper");
const teamUsaJerseyWrapper = document.getElementById("teamUsaJerseyWrapper");
const teamUsaJerseyInput = document.getElementById("teamUsaJersey");

const olympicFormatInput = document.getElementById("olympicFormat");
const olympicMedalYearInput = document.getElementById("olympicMedalYear");
const olympicMedalTypeInput = document.getElementById("olympicMedalType");
const addOlympicMedalBtn = document.getElementById("addOlympicMedalBtn");
const saveOlympicEditBtn = document.getElementById("saveOlympicEditBtn");
const cancelOlympicEditBtn = document.getElementById("cancelOlympicEditBtn");
const olympicMedalList = document.getElementById("olympicMedalList");

const fibaFormatInput = document.getElementById("fibaFormat");
const fibaMedalYearInput = document.getElementById("fibaMedalYear");
const fibaCompetitionInput = document.getElementById("fibaCompetition");
const fibaMedalTypeInput = document.getElementById("fibaMedalType");
const addFibaMedalBtn = document.getElementById("addFibaMedalBtn");
const saveFibaEditBtn = document.getElementById("saveFibaEditBtn");
const cancelFibaEditBtn = document.getElementById("cancelFibaEditBtn");
const fibaMedalList = document.getElementById("fibaMedalList");

// =======================================================
// General helpers
// =======================================================
function createPlayerIdFromName(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("_");
}

function getRadioBoolean(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  if (!selected) return false;
  return selected.value === "true";
}

function setRadioBoolean(name, value) {
  const input = document.querySelector(
    `input[name="${name}"][value="${value ? "true" : "false"}"]`
  );

  if (input) input.checked = true;
}

function bindConditionalBoolean(name, wrapperEl, onNo = null) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      const isYes = getRadioBoolean(name);

      if (wrapperEl) {
        wrapperEl.style.display = isYes ? "block" : "none";
      }

      if (!isYes && typeof onNo === "function") {
        onNo();
      }

      updateAll();
    });
  });
}

function syncSelectToInput(selectEl, inputEl) {
  selectEl.addEventListener("change", () => {
    inputEl.value = selectEl.value;
    updateAll();
  });
}

// =======================================================
// WNBA timeline helpers
// =======================================================
function getCareerEndYear() {
  if (playerActiveYesInput.checked) return 2026;

  if (playerActiveNoInput.checked && retiredYearInput.value) {
    return Number(retiredYearInput.value);
  }

  return null;
}

function getTeamColor(teamCode) {
  return WNBA_TEAMS[teamCode]?.branding?.colors?.color1 || "#eee";
}

function ensureSeasonEntries(season) {
  if (!season.entries) {
    season.entries = [];

    if (season.status === "played" && season.teamCode) {
      season.entries.push({
        type: "team",
        teamCode: season.teamCode,
        note: season.note || ""
      });
    }

    if (season.status === "missed") {
      season.entries.push({
        type: "sit_out",
        teamCode: season.teamCode || "",
        reason: season.reason || "",
        note: season.note || ""
      });
    }

    (season.segments || []).forEach((segment) => {
      if (segment.type === "team") {
        season.entries.push({
          type: "team",
          teamCode: segment.teamCode || "",
          note: segment.movementNote || segment.note || ""
        });
      }

      if (segment.type === "sit_out") {
        season.entries.push({
          type: "sit_out",
          teamCode: season.teamCode || "",
          reason: segment.reason || "",
          note: segment.note || ""
        });
      }
    });
  }

  return season.entries;
}

function getSelectedSeason() {
  return wnbaSeasonTimeline.find((season) => season.year === selectedTimelineYear);
}

function getSelectedSeasonIndex() {
  return wnbaSeasonTimeline.findIndex((season) => season.year === selectedTimelineYear);
}

function syncActivePlayerUI() {
  const isActive = getRadioBoolean("playerActive2026");

  retiredYearWrapper.style.display = isActive ? "none" : "block";

  if (isActive) {
    retiredYearInput.value = "";
  }

  updateAll();
}

function syncTimelineFromCareerInputs() {
  generateWnbaSeasonTimeline();
}

function generateWnbaSeasonTimeline() {
  const startYear = Number(draftYearInput.value);
  const endYear = getCareerEndYear();

  if (!startYear || !endYear || endYear < startYear) {
    renderWnbaTimeline();
    updateAll();
    return;
  }

  const existingByYear = new Map(
    wnbaSeasonTimeline.map((season) => [season.year, season])
  );

  const nextTimeline = [];

  for (let year = startYear; year <= endYear; year++) {
    const existingSeason = existingByYear.get(year);

    if (existingSeason) {
      nextTimeline.push(existingSeason);
    } else {
      nextTimeline.push({
        year,
        seasonType: "full",
        status: "played",
        teamCode: "",
        segments: [],
        entries: [],
        reason: "",
        note: ""
      });
    }
  }

  wnbaSeasonTimeline = nextTimeline;

  if (
    selectedTimelineYear &&
    !wnbaSeasonTimeline.some((season) => season.year === selectedTimelineYear)
  ) {
    selectedTimelineYear = null;
    selectedSeasonLabel.textContent = "Select a year on the timeline to add info";
    seasonEntriesList.innerHTML = "";
  }

  renderWnbaTimeline();
  updateAll();
}

function renderWnbaTimeline() {
  wnbaTimelineEl.innerHTML = "";

  wnbaSeasonTimeline.forEach((season) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `timeline-year-card ${season.status}`;

    if (season.year === selectedTimelineYear) {
      card.classList.add("selected");
    }

    const entries = ensureSeasonEntries(season);

    const colors = entries
      .filter((entry) => entry.type === "team" && entry.teamCode)
      .map((entry) => getTeamColor(entry.teamCode));

    const squareStyle = colors.length > 1
      ? `background: linear-gradient(90deg, ${colors.map((color, index) => {
          const start = (index / colors.length) * 100;
          const end = ((index + 1) / colors.length) * 100;
          return `${color} ${start}%, ${color} ${end}%`;
        }).join(", ")});`
      : `background: ${colors[0] || "#eee"};`;

    card.innerHTML = `
      <div class="year-label">${season.year}</div>
      <div class="year-square" style="${squareStyle}"></div>
      <div class="team-label">${
        entries
          .filter((entry) => entry.type === "team" && entry.teamCode)
          .map((entry) => {
            const team = WNBA_TEAMS[entry.teamCode];
            const name = team?.name?.short || entry.teamCode;

            return name.length >= 4
              ? name.slice(0, 4).toUpperCase()
              : name.toUpperCase();
          })
          .join("/") || "—"
      }</div>
    `;

    card.addEventListener("click", () => {
      selectedTimelineYear = season.year;
      openSeasonEditor(season.year);
      renderWnbaTimeline();
    });

    wnbaTimelineEl.appendChild(card);
  });
}

function openSeasonEditor(year) {
  const season = wnbaSeasonTimeline.find((item) => item.year === year);
  if (!season) return;

  selectedSeasonLabel.textContent = `Editing ${year}`;
  ensureSeasonEntries(season);
  renderSeasonEntriesList(season);
}

function addSeasonEntry(type) {
  const season = getSelectedSeason();
  if (!season) return;

  ensureSeasonEntries(season);

  season.entries.push({
    type,
    teamCode: "",
    reason: "",
    note: ""
  });

  renderSeasonEntriesList(season);
  renderWnbaTimeline();
  updateAll();
}

function copyPreviousSeasonEntries() {
  const currentIndex = getSelectedSeasonIndex();
  if (currentIndex <= 0) return;

  const currentSeason = wnbaSeasonTimeline[currentIndex];
  const previousSeason = wnbaSeasonTimeline[currentIndex - 1];

  const previousEntries = ensureSeasonEntries(previousSeason);

  currentSeason.entries = previousEntries.map((entry) => ({ ...entry }));

  renderSeasonEntriesList(currentSeason);
  renderWnbaTimeline();
  updateAll();
}

function renderSeasonEntriesList(season) {
  seasonEntriesList.innerHTML = "";

  const entries = ensureSeasonEntries(season);

  if (!entries.length) {
    seasonEntriesList.innerHTML = `<p class="empty-note">No entries yet. Add a team or sit-out.</p>`;
    return;
  }

  entries.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "season-entry-card";

    card.innerHTML = `
      <div class="season-entry-card-header">
        <strong>Entry ${index + 1}: ${entry.type === "sit_out" ? "Sit Out" : "Team"}</strong>
        <button type="button" class="remove-season-entry-btn">Remove</button>
      </div>

      <label>Team</label>
      <select class="entry-team-select wnba-team-select">
        <option value="">WNBA teams menu</option>
      </select>

      ${
        entry.type === "sit_out"
          ? `<label>Reason</label><input class="entry-reason" placeholder="Reason" value="${entry.reason || ""}">`
          : ""
      }

      <label>Note/details</label>
      <textarea class="entry-note" placeholder="Note/details">${entry.note || ""}</textarea>
    `;

    const teamSelect = card.querySelector(".entry-team-select");
    populateSingleWnbaTeamSelect(teamSelect);
    teamSelect.value = entry.teamCode || "";

    teamSelect.addEventListener("change", () => {
      entry.teamCode = teamSelect.value;
      renderWnbaTimeline();
      updateAll();
    });

    const reasonInput = card.querySelector(".entry-reason");
    if (reasonInput) {
      reasonInput.addEventListener("input", () => {
        entry.reason = reasonInput.value;
        updateAll();
      });
    }

    const noteInput = card.querySelector(".entry-note");
    noteInput.addEventListener("input", () => {
      entry.note = noteInput.value;
      updateAll();
    });

    card.querySelector(".remove-season-entry-btn").addEventListener("click", () => {
      entries.splice(index, 1);
      renderSeasonEntriesList(season);
      renderWnbaTimeline();
      updateAll();
    });

    seasonEntriesList.appendChild(card);
  });
}

function goToAdjacentSeason(direction) {
  const currentIndex = getSelectedSeasonIndex();
  if (currentIndex === -1) return;

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= wnbaSeasonTimeline.length) return;

  selectedTimelineYear = wnbaSeasonTimeline[nextIndex].year;
  openSeasonEditor(selectedTimelineYear);
  renderWnbaTimeline();
}

function populateSingleWnbaTeamSelect(select) {
  select.innerHTML = `<option value="">WNBA teams menu</option>`;

  Object.entries(WNBA_TEAMS)
    .sort((a, b) => (a[1].name?.full || "").localeCompare(b[1].name?.full || ""))
    .forEach(([teamCode, team]) => {
      const option = document.createElement("option");
      option.value = teamCode;
      option.textContent = `${team.name?.full || teamCode} (${teamCode})`;
      select.appendChild(option);
    });
}

function buildWnbaTeamsFromTimeline() {
  const teamSeasons = [];

  wnbaSeasonTimeline.forEach((season) => {
    const entries = ensureSeasonEntries(season);

    entries
      .filter((entry) => entry.type === "team" && entry.teamCode)
      .forEach((entry) => {
        teamSeasons.push({
          year: season.year,
          teamCode: entry.teamCode,
          note: entry.note || ""
        });
      });
  });

  if (!teamSeasons.length) return [];

  const spans = [];

  let currentSpan = {
    teamCode: teamSeasons[0].teamCode,
    startYear: String(teamSeasons[0].year),
    endYear: String(teamSeasons[0].year)
  };

  if (teamSeasons[0].note) {
    currentSpan.note = teamSeasons[0].note;
  }

  for (let i = 1; i < teamSeasons.length; i++) {
    const season = teamSeasons[i];
    const previous = teamSeasons[i - 1];

    const sameTeam = season.teamCode === currentSpan.teamCode;
    const consecutive = season.year === previous.year + 1;

    if (sameTeam && consecutive) {
      currentSpan.endYear = String(season.year);

      if (season.note) {
        currentSpan.note = currentSpan.note
          ? `${currentSpan.note}; ${season.year}: ${season.note}`
          : `${season.year}: ${season.note}`;
      }
    } else {
      spans.push(currentSpan);

      currentSpan = {
        teamCode: season.teamCode,
        startYear: String(season.year),
        endYear: String(season.year)
      };

      if (season.note) {
        currentSpan.note = season.note;
      }
    }
  }

  spans.push(currentSpan);

  if (playerActiveYesInput.checked && spans.length) {
    spans[spans.length - 1].endYear = "present";
  }

  return spans;
}

function buildMissedSeasonsFromTimeline() {
  const missed = [];

  wnbaSeasonTimeline.forEach((season) => {
    const entries = ensureSeasonEntries(season);

    entries
      .filter((entry) => entry.type === "sit_out")
      .forEach((entry) => {
        const missedEntry = {
          year: String(season.year),
          teamCode: entry.teamCode || "",
          reason: entry.reason || ""
        };

        if (entry.note) {
          missedEntry.note = entry.note;
        }

        const hasTeamEntry = entries.some(
          (item) => item.type === "team" && item.teamCode
        );

        if (hasTeamEntry) {
          missedEntry.partialSeason = true;
        }

        missed.push(missedEntry);
      });
  });

  return missed;
}

function buildWnbaSeasonsFromTimeline() {
  return wnbaSeasonTimeline
    .map((season) => {
      const entries = ensureSeasonEntries(season)
        .filter((entry) => entry.teamCode || entry.reason || entry.note)
        .map((entry) => {
          const cleanEntry = {
            type: entry.type
          };

          if (entry.teamCode) cleanEntry.teamCode = entry.teamCode;
          if (entry.reason) cleanEntry.reason = entry.reason;
          if (entry.note) cleanEntry.note = entry.note;

          return cleanEntry;
        });

      return {
        year: String(season.year),
        entries
      };
    })
    .filter((season) => season.entries.length);
}

function normalizeYearValue(value) {
  if (value === "present") return 2026;
  return Number(value);
}

function addTimelineEntryForYear(year, entry) {
  let season = wnbaSeasonTimeline.find((item) => item.year === year);

  if (!season) {
    season = {
      year,
      seasonType: "full",
      status: "played",
      teamCode: "",
      segments: [],
      entries: [],
      reason: "",
      note: ""
    };

    wnbaSeasonTimeline.push(season);
  }

  ensureSeasonEntries(season);
  season.entries.push(entry);
}

function loadWnbaTimelineFromPlayer(player) {
  wnbaSeasonTimeline = [];
  selectedTimelineYear = null;
  seasonEntriesList.innerHTML = "";
  selectedSeasonLabel.textContent = "Select a year on the timeline to add info";

  const draftYear = Number(player.careerDetails?.draftDetails?.year || player.draft?.year);
  const isActive = Boolean(player.playerStatus?.isActive);

  let endYear = isActive ? 2026 : null;

  const wnbaTeams = player.wnbaTeams || [];
  const missedSeasons = player.careerDetails?.missedWnbaSeasons || [];
  const wnbaSeasons = player.wnbaSeasons || [];

  wnbaTeams.forEach((teamSpan) => {
    const startYear = Number(teamSpan.startYear);
    const spanEndYear = normalizeYearValue(teamSpan.endYear);

    if (!endYear || spanEndYear > endYear) {
      endYear = spanEndYear;
    }

    for (let year = startYear; year <= spanEndYear; year++) {
      addTimelineEntryForYear(year, {
        type: "team",
        teamCode: teamSpan.teamCode || "",
        note: teamSpan.note || teamSpan.transactionNote || ""
      });
    }
  });

  missedSeasons.forEach((missed) => {
    const year = Number(missed.year);

    if (!endYear || year > endYear) {
      endYear = year;
    }

    addTimelineEntryForYear(year, {
      type: "sit_out",
      teamCode: missed.teamCode || "",
      reason: missed.reason || "",
      note: missed.note || ""
    });
  });

  // Newer detailed season shape gets priority when present.
  // It can include multiple entries inside one season.
  if (wnbaSeasons.length) {
    wnbaSeasons.forEach((seasonEntry) => {
      const year = Number(seasonEntry.year);

      if (!endYear || year > endYear) {
        endYear = year;
      }

      if (!wnbaSeasonTimeline.some((item) => item.year === year)) {
        wnbaSeasonTimeline.push({
          year,
          seasonType: "full",
          status: "played",
          teamCode: "",
          segments: [],
          entries: [],
          reason: "",
          note: ""
        });
      }

      const season = wnbaSeasonTimeline.find((item) => item.year === year);
      season.entries = (seasonEntry.entries || []).map((entry) => ({
        type: entry.type || "team",
        teamCode: entry.teamCode || "",
        reason: entry.reason || "",
        note: entry.note || ""
      }));
    });
  }

  if (!draftYear || !endYear) {
    renderWnbaTimeline();
    updateAll();
    return;
  }

  const byYear = new Map(
    wnbaSeasonTimeline.map((season) => [season.year, season])
  );

  const fullTimeline = [];

  for (let year = draftYear; year <= endYear; year++) {
    if (byYear.has(year)) {
      fullTimeline.push(byYear.get(year));
    } else {
      fullTimeline.push({
        year,
        seasonType: "full",
        status: "played",
        teamCode: "",
        segments: [],
        entries: [],
        reason: "",
        note: ""
      });
    }
  }

  wnbaSeasonTimeline = fullTimeline;

  renderWnbaTimeline();
  updateAll();
}

function replaceArrayContents(targetArray, sourceArray = []) {
  targetArray.length = 0;
  targetArray.push(...sourceArray);
}

// =======================================================
// list helpers
// =======================================================
function populateOverseasTeamSelect() {
  overseasTeamSelect.innerHTML = `<option value="">Overseas teams menu</option>`;

  Object.entries(OVERSEAS_TEAMS)
    .sort(([, a], [, b]) => {
      const nameA = a.name?.full || a.teamCode || "";
      const nameB = b.name?.full || b.teamCode || "";
      return nameA.localeCompare(nameB);
    })
    .forEach(([teamCode, team]) => {
      const option = document.createElement("option");
      option.value = team.teamCode || teamCode;

      const country = team.location?.country ? ` — ${team.location.country}` : "";
      option.textContent = `${team.name?.full || option.value}${country} (${option.value})`;

      overseasTeamSelect.appendChild(option);
    });
}

function populateUnrivaledTeamSelect() {
  unrivaledTeamSelect.innerHTML = `<option value="">Unrivaled teams menu</option>`;

  Object.entries(UNRIVALED_TEAMS)
    .sort(([, a], [, b]) => {
      const nameA = a.name?.full || a.teamCode || "";
      const nameB = b.name?.full || b.teamCode || "";
      return nameA.localeCompare(nameB);
    })
    .forEach(([teamCode, team]) => {
      const option = document.createElement("option");
      option.value = team.teamCode || teamCode;
      option.textContent = `${team.name?.full || option.value} (${option.value})`;
      unrivaledTeamSelect.appendChild(option);
    });
}

function renderOverseasList() {
  overseasList.innerHTML = "";

  overseasTeams.forEach((entry, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>
        ${entry.season} - ${entry.teamCode || entry.teamName || "Utility Entry"}
        ${entry.utilityEntryId ? ` — utility: ${entry.utilityEntryStatus || "open"}` : ""}
        ${entry.note ? ` — ${entry.note}` : ""}
      </span>
      <button type="button" data-index="${index}" class="edit-overseas-btn">Edit</button>
      <button type="button" data-index="${index}" class="remove-overseas-btn">Remove</button>
    `;

    overseasList.appendChild(li);
  });

  document.querySelectorAll(".edit-overseas-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const entry = overseasTeams[index];

      editingOverseasIndex = index;
      overseasSeasonInput.value = entry.season || "";
      overseasTeamInput.value = entry.teamCode || "";
      overseasTeamSelect.value = entry.teamCode || "";
      overseasNoteInput.value = entry.note || "";

      addOverseasBtn.style.display = "none";
      saveOverseasEditBtn.style.display = "inline-block";
      cancelOverseasEditBtn.style.display = "inline-block";
    });
  });

  document.querySelectorAll(".remove-overseas-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      overseasTeams.splice(Number(btn.dataset.index), 1);
      renderOverseasList();
      updateAll();
    });
  });
}

function renderUnrivaledList() {
  unrivaledList.innerHTML = "";

  unrivaledTeams.forEach((entry, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${entry.year} - ${entry.teamCode}</span>
      <button type="button" data-index="${index}" class="edit-unrivaled-btn">Edit</button>
      <button type="button" data-index="${index}" class="remove-unrivaled-btn">Remove</button>
    `;

    unrivaledList.appendChild(li);
  });

  document.querySelectorAll(".edit-unrivaled-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const entry = unrivaledTeams[index];

      editingUnrivaledIndex = index;
      unrivaledYearInput.value = entry.year || "";
      unrivaledTeamInput.value = entry.teamCode || "";
      unrivaledTeamSelect.value = entry.teamCode || "";

      addUnrivaledBtn.style.display = "none";
      saveUnrivaledEditBtn.style.display = "inline-block";
      cancelUnrivaledEditBtn.style.display = "inline-block";
    });
  });

  document.querySelectorAll(".remove-unrivaled-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      unrivaledTeams.splice(Number(btn.dataset.index), 1);
      renderUnrivaledList();
      updateAll();
    });
  });
}

function renderMedalList() {
  olympicMedalList.innerHTML = "";
  fibaMedalList.innerHTML = "";

  teamUsaMedals.forEach((entry, index) => {
    const li = document.createElement("li");

    if (entry.eventType === "Olympics") {
      li.innerHTML = `
        <span>${entry.year} - ${entry.format || ""} Olympics (${entry.medal})</span>
        <button type="button" data-index="${index}" class="edit-olympic-medal-btn">Edit</button>
        <button type="button" data-index="${index}" class="remove-medal-btn">Remove</button>
      `;
      olympicMedalList.appendChild(li);
    }

    if (entry.eventType === "FIBA") {
      li.innerHTML = `
        <span>${entry.year} - ${entry.format || ""} ${entry.competition || "FIBA"} (${entry.medal})</span>
        <button type="button" data-index="${index}" class="edit-fiba-medal-btn">Edit</button>
        <button type="button" data-index="${index}" class="remove-medal-btn">Remove</button>
      `;
      fibaMedalList.appendChild(li);
    }
  });

  document.querySelectorAll(".edit-olympic-medal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingOlympicIndex = Number(btn.dataset.index);
      const entry = teamUsaMedals[editingOlympicIndex];

      olympicFormatInput.value = entry.format || "";
      olympicMedalYearInput.value = entry.year || "";
      olympicMedalTypeInput.value = entry.medal || "";

      addOlympicMedalBtn.style.display = "none";
      saveOlympicEditBtn.style.display = "inline-block";
      cancelOlympicEditBtn.style.display = "inline-block";
    });
  });

  document.querySelectorAll(".edit-fiba-medal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingFibaIndex = Number(btn.dataset.index);
      const entry = teamUsaMedals[editingFibaIndex];

      fibaFormatInput.value = entry.format || "";
      fibaMedalYearInput.value = entry.year || "";
      fibaCompetitionInput.value = entry.competition || "";
      fibaMedalTypeInput.value = entry.medal || "";

      addFibaMedalBtn.style.display = "none";
      saveFibaEditBtn.style.display = "inline-block";
      cancelFibaEditBtn.style.display = "inline-block";
    });
  });

  document.querySelectorAll(".remove-medal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      teamUsaMedals.splice(Number(btn.dataset.index), 1);
      renderMedalList();
      updateAll();
    });
  });
}

function resetOlympicInputs() {
  editingOlympicIndex = null;

  olympicFormatInput.value = "";
  olympicMedalYearInput.value = "";
  olympicMedalTypeInput.value = "";

  addOlympicMedalBtn.style.display = "inline-block";
  saveOlympicEditBtn.style.display = "none";
  cancelOlympicEditBtn.style.display = "none";
}

function resetFibaInputs() {
  editingFibaIndex = null;

  fibaFormatInput.value = "";
  fibaMedalYearInput.value = "";
  fibaCompetitionInput.value = "";
  fibaMedalTypeInput.value = "";

  addFibaMedalBtn.style.display = "inline-block";
  saveFibaEditBtn.style.display = "none";
  cancelFibaEditBtn.style.display = "none";
}

// =======================================================
// Image helpers
// =======================================================
const IMAGE_BASE_PATH = "/season30/connection-imgs/";

function getSelectedImageFileType() {
  const selected = document.querySelector(`input[name="imageFileType"]:checked`);
  return selected ? selected.value : "";
}

function buildImageSrc(fileName, fileType) {
  const cleanName = fileName.trim().replace(/\.(jpg|png|avif|webp)$/i, "");
  return `${IMAGE_BASE_PATH}${cleanName}${fileType}`;
}

function renderImagesList() {
  imagesList.innerHTML = "";

  playerImages.forEach((image, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${image.src}</span>
      <button type="button" data-index="${index}" class="remove-image-btn">Remove</button>
    `;

    imagesList.appendChild(li);
  });

  document.querySelectorAll(".remove-image-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playerImages.splice(Number(btn.dataset.index), 1);
      renderImagesList();
      updateAll();
    });
  });
}

// =======================================================
// overseas helpers
// =======================================================
function getOverseasReferenceMode() {
  return document.querySelector(
    'input[name="overseasReferenceMode"]:checked'
  )?.value || "select";
}

function updateOverseasReferenceModeUI() {
  const mode = getOverseasReferenceMode();

  overseasExistingReferenceFields.style.display =
    mode === "select" ? "block" : "none";

  overseasUtilityEntryFields.style.display =
    mode === "utility" ? "block" : "none";

  updateAll();
}

async function createPlayerOverseasUtilityEntry() {
  const playerId = getPlayerId();
  const playerName = playerNameInput.value.trim();
  const teamName = utilityTeamNameInput.value.trim();

  if (!teamName) {
    alert("Please enter the overseas team name.");
    return null;
  }

  const entry = UtilityEntryService.buildUtilityEntry({
    title: teamName,

    category: "overseas-reference",

    createdFrom: {
      tool: "player-input-tool",
      contextType: "player-overseas-career",
      contextId: playerId
    },

    task: {
      taskType: "create-or-connect-reference",
      targetDataType: "overseas-team",
      actionNeeded: "Create or connect overseas team reference."
    },

    referenceRequest: {
      playerId,
      playerName,
      leagueName: utilityLeagueNameInput.value.trim(),
      teamName,
      country: utilityCountryInput.value.trim(),
      city: utilityCityInput.value.trim(),
      season: overseasSeasonInput.value.trim()
    },

    wires: [
      "player-input-tool",
      "overseas-league-input-tool",
      "overseas-team-input-tool"
    ],

    attachedTo: [
      {
        type: "player",
        id: playerId
      },
      {
        type: "player-overseas-career",
        id: `${playerId}_${overseasSeasonInput.value.trim()}_${UtilityEntryService.slugify(teamName)}`
      }
    ],

    notes: utilityEntryNotesInput.value.trim()
  });

  await UtilityEntryService.saveEntry(entry);

  if (utilityEntryStatusMessage) {
    utilityEntryStatusMessage.textContent = "Utility entry saved.";
  }

  return entry;
}

// =======================================================
// NCAA championship list
// =======================================================
function renderNcaaChampionshipsList() {
  ncaaChampionshipsList.innerHTML = "";

  ncaaChampionships.forEach((entry, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${entry.year} - ${entry.collegeId}</span>
      <button type="button" data-index="${index}" class="remove-ncaa-btn">Remove</button>
    `;

    ncaaChampionshipsList.appendChild(li);
  });

  document.querySelectorAll(".remove-ncaa-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      ncaaChampionships.splice(Number(btn.dataset.index), 1);
      renderNcaaChampionshipsList();
      updateAll();
    });
  });
}

// =======================================================
// WNBA championship list
// =======================================================
function renderChampionshipsList() {
  championshipsList.innerHTML = "";

  championships.forEach((entry, index) => {
    const li = document.createElement("li");
    const mvpText = entry.finalsMVP ? " — Finals MVP" : "";

    li.innerHTML = `
      <span>${entry.year} - ${entry.teamCode}${mvpText}</span>
      <button type="button" data-index="${index}" class="remove-championship-btn">Remove</button>
    `;

    championshipsList.appendChild(li);
  });

  document.querySelectorAll(".remove-championship-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      championships.splice(Number(btn.dataset.index), 1);
      renderChampionshipsList();
      updateAll();
    });
  });
}

// =======================================================
// Panel collapse behavior
// =======================================================
function setupPanels() {
  document.querySelectorAll(".panel").forEach((panel) => {
    const header = panel.querySelector(".panel-header");
    const toggle = panel.querySelector(".panel-toggle");

    if (!header || !toggle) return;

    header.addEventListener("click", () => {
      panel.classList.toggle("open");
      toggle.textContent = panel.classList.contains("open") ? "−" : "+";
    });
  });
}

// =======================================================
// Loading data
// =======================================================
async function loadJson(path, fallback = {}) {
  try {
    const res = await fetch(path);

    if (!res.ok) {
      throw new Error(`${path} returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Could not load ${path}:`, error);
    return fallback;
  }
}

async function loadAllData() {
  const [playersData, teamsData, collegesData, overseasData, unrivaledData] = await Promise.all([
    loadJson(PLAYERS_PATH, { players: {} }),
    loadJson(WNBA_TEAMS_PATH, { teams: {} }),
    loadJson(COLLEGES_PATH, { colleges: {} }),
    loadJson(OVERSEAS_TEAMS_PATH, { teams: {} }),
    loadJson(UNRIVALED_TEAMS_PATH, { teams: {} })
  ]);

  PLAYERS = playersData.players || {};
  WNBA_TEAMS = teamsData.teams || {};
  COLLEGES = collegesData.colleges || {};
  OVERSEAS_TEAMS = overseasData.teams || overseasData || {};
  UNRIVALED_TEAMS = unrivaledData.teams || unrivaledData || {};

  populatePlayerSelect();
  populateWnbaTeamSelects();
  populateCollegeSelect();
  populateOverseasTeamSelect();
  populateUnrivaledTeamSelect();
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);

  const mode = params.get("mode");
  const playerName = params.get("playerName");
  const playerId = params.get("playerId");

  if (mode !== "create") return;

  if (playerSelect) {
    playerSelect.value = "";
  }

  if (playerName) {
    playerNameInput.value = playerName;
  }

  if (playerId) {
    playerIdInput.value = playerId;
    playerIdManualMode = true;
  }

  updateAll();
}

// =======================================================
// Menus
// =======================================================
function populatePlayerSelect() {
  playerSelect.innerHTML = `<option value="">Player menu</option>`;

  Object.entries(PLAYERS)
    .sort((a, b) => (a[1].playerName || "").localeCompare(b[1].playerName || ""))
    .forEach(([playerId, player]) => {
      const option = document.createElement("option");
      option.value = playerId;
      option.textContent = `${player.playerName || playerId} (${playerId})`;
      playerSelect.appendChild(option);
    });
}

function populateWnbaTeamSelects() {
  document.querySelectorAll(".wnba-team-select").forEach((select) => {
    select.innerHTML = `<option value="">WNBA teams menu</option>`;

    Object.entries(WNBA_TEAMS)
      .sort((a, b) => (a[1].name?.full || "").localeCompare(b[1].name?.full || ""))
      .forEach(([teamCode, team]) => {
        const option = document.createElement("option");
        option.value = teamCode;
        option.textContent = `${team.name?.full || teamCode} (${teamCode})`;
        select.appendChild(option);
      });
  });
}

function populateCollegeSelect() {
  collegeSelect.innerHTML = `<option value="">College menu</option>`;

  Object.entries(COLLEGES)
    .sort((a, b) => (a[1].name || "").localeCompare(b[1].name || ""))
    .forEach(([collegeId, college]) => {
      const option = document.createElement("option");
      option.value = collegeId;
      option.textContent = `${college.name || collegeId} (${collegeId})`;
      collegeSelect.appendChild(option);
    });
}

// =======================================================
// Player data build
// =======================================================
function getPlayerId() {
  return playerIdInput.value.trim() || "player_id_here";
}

function getDraftDetails() {
  const draftDetails = {
    year: draftYearInput.value.trim(),
    pick: draftPickInput.value.trim(),
    draftedBy: draftedByInput.value.trim()
  };

  if (getRadioBoolean("wasDraftDayTrade")) {
    if (acquiredByInput.value.trim()) {
      draftDetails.acquiredBy = acquiredByInput.value.trim();
    }

    if (transactionNoteInput.value.trim()) {
      draftDetails.transactionNote = transactionNoteInput.value.trim();
    }
  }

  return draftDetails;
}

function getPlayerData() {
  return {
    playerName: playerNameInput.value.trim(),
    teamUsaJersey: getRadioBoolean("hasOlympicExperience") ? teamUsaJerseyInput.value.trim() : "",

    playerStatus: {
      isActive: getRadioBoolean("playerActive2026"),
      hasNcaaChampionships: getRadioBoolean("hasNcaaChampionships"),
      wasDraftDayTrade: getRadioBoolean("wasDraftDayTrade"),
      hasWnbaChampionships: getRadioBoolean("hasWnbaChampionships"),
        hasOverseasExperience: getRadioBoolean("hasOverseasExperience"),
        hasUnrivaledExperience: getRadioBoolean("hasUnrivaledExperience"),
        hasNationalTeamExperience: getRadioBoolean("hasNationalTeamExperience"),
        hasOlympicExperience: getRadioBoolean("hasOlympicExperience")
    },

    careerDetails: {
      collegeCareer: {
        collegeId: collegeIdInput.value.trim(),
        startYear: collegeStartInput.value.trim(),
        endYear: collegeEndInput.value.trim(),
        ncaaChampionships: getRadioBoolean("hasNcaaChampionships") ? ncaaChampionships : []
      },

      draftDetails: getDraftDetails(),

        missedWnbaSeasons: buildMissedSeasonsFromTimeline(),
        overseasTeams: getRadioBoolean("hasOverseasExperience") ? overseasTeams : [],
        unrivaledTeams: getRadioBoolean("hasUnrivaledExperience") ? unrivaledTeams : [],
        teamUsaMedals: getRadioBoolean("hasNationalTeamExperience") ? teamUsaMedals : []
    },

    image: playerImages.length ? playerImages[0] : null,
    images: playerImages,

    wnbaSeasons: buildWnbaSeasonsFromTimeline(),
    wnbaTeams: buildWnbaTeamsFromTimeline(),
    championships: getRadioBoolean("hasWnbaChampionships") ? championships : []
  };
}

// =======================================================
// Summary + preview
// =======================================================
function getCollegeDisplayName(collegeId) {
  if (!collegeId) return "—";

  const college = COLLEGES[collegeId];

  return (
    college?.name?.full ||
    college?.name ||
    college?.schoolName ||
    collegeId
  );
}

function getTeamDisplayName(teamCode) {
  if (!teamCode) return "—";

  const team = WNBA_TEAMS[teamCode];

  return (
    team?.name?.full ||
    team?.name?.short ||
    teamCode
  );
}

function updateSummary() {
  const name = playerNameInput.value.trim();
  const playerId = getPlayerId();
  const isActive = getRadioBoolean("playerActive2026");
  const draftedBy = draftedByInput.value.trim();

  summaryName.textContent = name || "No player selected";
  summaryId.textContent = playerId || "—";
  summaryStatus.textContent = isActive ? "Active as of 2026" : "Inactive / unknown";

  summaryDraft.textContent = draftYearInput.value
    ? `${draftYearInput.value}${draftPickInput.value ? `, pick ${draftPickInput.value}` : ""}`
    : "—";

  summaryCollege.textContent = getCollegeDisplayName(collegeIdInput.value.trim());
  summaryWnba.textContent = getTeamDisplayName(draftedBy);
}

function updateJSONPreview() {
  jsonPreview.textContent = `"${getPlayerId()}": ${JSON.stringify(getPlayerData(), null, 2)}`;
}

function updateAll() {
  updateSummary();
  updateJSONPreview();
}

// =======================================================
// Fill form from existing player
// Starter version — timeline/extra lists come next
// =======================================================
function fillFormFromPlayer(playerId) {
  const player = PLAYERS[playerId];
  if (!player) return;

  playerIdManualMode = true;

  playerIdInput.value = playerId;
  playerNameInput.value = player.playerName || "";

  const isActive =
    player.playerStatus?.isActive ??
    player.wnbaTeams?.some((team) => {
      if (team.endYear === "present") return true;
      return Number(team.endYear) >= 2026;
    });

  setRadioBoolean("playerActive2026", Boolean(isActive));

  const collegeCareer = player.careerDetails?.collegeCareer || {};
  collegeIdInput.value = collegeCareer.collegeId || player.collegeId || "";
  collegeStartInput.value = collegeCareer.startYear || "";
  collegeEndInput.value = collegeCareer.endYear || "";
  collegeSelect.value = collegeIdInput.value;

  const draft = player.careerDetails?.draftDetails || player.draft || {};
  draftYearInput.value = draft.year || "";
  draftPickInput.value = draft.pick || "";
  draftedByInput.value = draft.draftedBy || draft.teamCode || "";
  draftedBySelect.value = draftedByInput.value;

  acquiredByInput.value = draft.acquiredBy || "";
  acquiredBySelect.value = acquiredByInput.value;
  transactionNoteInput.value = draft.transactionNote || "";

  setRadioBoolean("wasDraftDayTrade", Boolean(draft.acquiredBy));
  draftDayTradeWrapper.style.display = getRadioBoolean("wasDraftDayTrade")
    ? "block"
    : "none";

  // =======================================================
  // Restore images, championships, overseas, unrivaled,
  // and national team entries from existing player data
  // =======================================================

  replaceArrayContents(
    playerImages,
    player.images?.length ? player.images : player.image ? [player.image] : []
  );

  replaceArrayContents(
    ncaaChampionships,
    player.careerDetails?.collegeCareer?.ncaaChampionships || []
  );

  replaceArrayContents(
    championships,
    player.championships || []
  );

  replaceArrayContents(
    overseasTeams,
    player.careerDetails?.overseasTeams || []
  );

  replaceArrayContents(
    unrivaledTeams,
    player.careerDetails?.unrivaledTeams || []
  );

  replaceArrayContents(
    teamUsaMedals,
    player.careerDetails?.teamUsaMedals || []
  );

  setRadioBoolean("hasNcaaChampionships", Boolean(ncaaChampionships.length));
  setRadioBoolean("hasWnbaChampionships", Boolean(championships.length));
  setRadioBoolean("hasOverseasExperience", Boolean(overseasTeams.length));
  setRadioBoolean("hasUnrivaledExperience", Boolean(unrivaledTeams.length));
  setRadioBoolean("hasNationalTeamExperience", Boolean(teamUsaMedals.length));

  setRadioBoolean(
    "hasOlympicExperience",
    Boolean(player.playerStatus?.hasOlympicExperience || player.teamUsaJersey)
  );

  teamUsaJerseyInput.value = player.teamUsaJersey || "";

  ncaaChampionshipsWrapper.style.display = getRadioBoolean("hasNcaaChampionships")
    ? "block"
    : "none";

  wnbaChampionshipsWrapper.style.display = getRadioBoolean("hasWnbaChampionships")
    ? "block"
    : "none";

  overseasExperienceWrapper.style.display = getRadioBoolean("hasOverseasExperience")
    ? "block"
    : "none";

  unrivaledExperienceWrapper.style.display = getRadioBoolean("hasUnrivaledExperience")
    ? "block"
    : "none";

  nationalTeamWrapper.style.display = getRadioBoolean("hasNationalTeamExperience")
    ? "block"
    : "none";

  teamUsaJerseyWrapper.style.display = getRadioBoolean("hasOlympicExperience")
    ? "block"
    : "none";

  renderImagesList();
  renderNcaaChampionshipsList();
  renderChampionshipsList();
  renderOverseasList();
  renderUnrivaledList();
  renderMedalList();
  loadWnbaTimelineFromPlayer(player);

  updateAll();
}

// =======================================================
// Save / copy
// =======================================================
async function savePlayer() {
  const payload = {
    playerId: getPlayerId(),
    playerData: getPlayerData()
  };

  try {
    const response = await fetch("http://127.0.0.1:8787/save-player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Save failed");
    }

    saveJsonBtn.textContent = "Saved!";

    setTimeout(() => {
      saveJsonBtn.textContent = "Save Player";
    }, 1200);
  } catch (error) {
    console.error(error);
    alert("Save failed. Make sure the local save server is running.");
  }
}

async function copyJsonPreview() {
  try {
    await navigator.clipboard.writeText(jsonPreview.textContent);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
      copyJsonBtn.textContent = "Copy JSON";
    }, 1200);
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Copy failed. You can still manually select and copy the JSON.");
  }
}

// =======================================================
// Event listeners
// =======================================================
function bindLiveInputs() {
  document.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", updateAll);
    field.addEventListener("change", updateAll);
  });

  playerNameInput.addEventListener("input", () => {
    if (!playerIdManualMode) {
      playerIdInput.value = createPlayerIdFromName(playerNameInput.value);
    }

    updateAll();
  });

  editPlayerIdBtn.addEventListener("click", () => {
    playerIdManualMode = true;
    playerIdInput.readOnly = false;
    playerIdInput.focus();
    editPlayerIdBtn.textContent = "Confirm ID";
  });

  playerIdInput.addEventListener("blur", confirmPlayerIdEdit);

  playerIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      confirmPlayerIdEdit();
    }
  });

  playerSelect.addEventListener("change", () => {
    fillFormFromPlayer(playerSelect.value);
  });

  collegeSelect.addEventListener("change", () => {
    collegeIdInput.value = collegeSelect.value;
    updateAll();
  });

  addImageBtn.addEventListener("click", () => {
    const fileName = imageFileNameInput.value.trim();
    const fileType = getSelectedImageFileType();

    if (!fileName || !fileType) {
      alert("Enter an image file name and choose a file type.");
      return;
    }

    const newImage = {
      src: buildImageSrc(fileName, fileType),
      alt: imageAltInput.value.trim()
    };

    if (imageSourceLinkInput.value.trim()) {
      newImage.sourceLink = imageSourceLinkInput.value.trim();
    }

    playerImages.push(newImage);

    imageFileNameInput.value = "";
    imageAltInput.value = "";
    imageSourceLinkInput.value = "";

    document.querySelectorAll(`input[name="imageFileType"]`).forEach((input) => {
      input.checked = false;
    });

    renderImagesList();
    updateAll();
  });

  addNcaaChampionshipBtn.addEventListener("click", () => {
    if (!ncaaChampionshipYearInput.value.trim()) return;

    ncaaChampionships.push({
      year: ncaaChampionshipYearInput.value.trim(),
      collegeId: collegeIdInput.value.trim()
    });

    ncaaChampionshipYearInput.value = "";

    renderNcaaChampionshipsList();
    updateAll();
  });

  addChampionshipBtn.addEventListener("click", () => {
    if (!championshipYearInput.value.trim()) return;

    const newEntry = {
      year: championshipYearInput.value.trim(),
      teamCode: championshipTeamCodeInput.value.trim()
    };

    if (finalsMvpInput.checked) {
      newEntry.finalsMVP = true;
    }

    championships.push(newEntry);

    championshipYearInput.value = "";
    championshipTeamCodeInput.value = "";
    championshipTeamSelect.value = "";
    finalsMvpInput.checked = false;

    renderChampionshipsList();
    updateAll();
  });

  syncSelectToInput(championshipTeamSelect, championshipTeamCodeInput);

  bindConditionalBoolean("hasNcaaChampionships", ncaaChampionshipsWrapper, () => {
    ncaaChampionships.length = 0;
    renderNcaaChampionshipsList();
  });

  bindConditionalBoolean("hasWnbaChampionships", wnbaChampionshipsWrapper, () => {
    championships.length = 0;
    renderChampionshipsList();
  });

  syncSelectToInput(draftedBySelect, draftedByInput);
  syncSelectToInput(acquiredBySelect, acquiredByInput);

  bindConditionalBoolean("wasDraftDayTrade", draftDayTradeWrapper, () => {
    acquiredByInput.value = "";
    acquiredBySelect.value = "";
    transactionNoteInput.value = "";
  });

  // =======================================================
  // Overseas section buttons
  // =======================================================
  syncSelectToInput(overseasTeamSelect, overseasTeamInput);

  copyPreviousOverseasBtn.addEventListener("click", () => {
    if (!overseasTeams.length) return;

    const previous = overseasTeams[overseasTeams.length - 1];

    overseasTeamInput.value = previous.teamCode || "";
    overseasTeamSelect.value = previous.teamCode || "";
    overseasNoteInput.value = previous.note || "";

    updateAll();
  });

    addOverseasBtn.addEventListener("click", async () => {
      const mode = getOverseasReferenceMode();

      let utilityEntry = null;

      if (mode === "utility") {
        utilityEntry = await createPlayerOverseasUtilityEntry();

        if (!utilityEntry) return;

        overseasTeams.push({
          season: overseasSeasonInput.value.trim(),
          referenceMode: "utility",
          teamCode: "",
          leagueName: utilityLeagueNameInput.value.trim(),
          teamName: utilityTeamNameInput.value.trim(),
          country: utilityCountryInput.value.trim(),
          city: utilityCityInput.value.trim(),
          utilityEntryId: utilityEntry.entryId,
          utilityEntryStatus: "open",
          note: overseasNoteInput.value.trim()
        });
      } else {
        overseasTeams.push({
          season: overseasSeasonInput.value.trim(),
          referenceMode: "select",
          teamCode: overseasTeamInput.value.trim(),
          note: overseasNoteInput.value.trim()
        });
      }

      overseasSeasonInput.value = "";
      overseasTeamInput.value = "";
      overseasTeamSelect.value = "";
      overseasNoteInput.value = "";

      utilityLeagueNameInput.value = "";
      utilityTeamNameInput.value = "";
      utilityCountryInput.value = "";
      utilityCityInput.value = "";
      utilityEntryNotesInput.value = "";

      renderOverseasList();
      updateAll();

      await savePlayer();
    });

  saveOverseasEditBtn.addEventListener("click", () => {
    if (editingOverseasIndex === null) return;

    overseasTeams[editingOverseasIndex] = {
      ...overseasTeams[editingOverseasIndex],
      season: overseasSeasonInput.value.trim(),
      teamCode: overseasTeamInput.value.trim(),
      note: overseasNoteInput.value.trim()
    };

    editingOverseasIndex = null;

    overseasSeasonInput.value = "";
    overseasTeamInput.value = "";
    overseasTeamSelect.value = "";
    overseasNoteInput.value = "";

    addOverseasBtn.style.display = "inline-block";
    saveOverseasEditBtn.style.display = "none";
    cancelOverseasEditBtn.style.display = "none";

    renderOverseasList();
    updateAll();
  });

  cancelOverseasEditBtn.addEventListener("click", () => {
    editingOverseasIndex = null;

    overseasSeasonInput.value = "";
    overseasTeamInput.value = "";
    overseasTeamSelect.value = "";
    overseasNoteInput.value = "";

    addOverseasBtn.style.display = "inline-block";
    saveOverseasEditBtn.style.display = "none";
    cancelOverseasEditBtn.style.display = "none";
  });

  document
    .querySelectorAll('input[name="overseasReferenceMode"]')
    .forEach((radio) => {
      radio.addEventListener("change", updateOverseasReferenceModeUI);
    });

  bindConditionalBoolean("hasOverseasExperience", overseasExperienceWrapper, () => {
    overseasTeams.length = 0;
    renderOverseasList();
  });

  // =======================================================
  // Unrivaled section buttons
  // =======================================================
  syncSelectToInput(unrivaledTeamSelect, unrivaledTeamInput);

  addUnrivaledBtn.addEventListener("click", () => {
    unrivaledTeams.push({
      year: Number(unrivaledYearInput.value),
      teamCode: unrivaledTeamInput.value.trim()
    });

    unrivaledYearInput.value = "";
    unrivaledTeamInput.value = "";
    unrivaledTeamSelect.value = "";

    renderUnrivaledList();
    updateAll();
  });

  saveUnrivaledEditBtn.addEventListener("click", () => {
    if (editingUnrivaledIndex === null) return;

    unrivaledTeams[editingUnrivaledIndex] = {
      year: Number(unrivaledYearInput.value),
      teamCode: unrivaledTeamInput.value.trim()
    };

    editingUnrivaledIndex = null;

    unrivaledYearInput.value = "";
    unrivaledTeamInput.value = "";
    unrivaledTeamSelect.value = "";

    addUnrivaledBtn.style.display = "inline-block";
    saveUnrivaledEditBtn.style.display = "none";
    cancelUnrivaledEditBtn.style.display = "none";

    renderUnrivaledList();
    updateAll();
  });

  cancelUnrivaledEditBtn.addEventListener("click", () => {
    editingUnrivaledIndex = null;

    unrivaledYearInput.value = "";
    unrivaledTeamInput.value = "";
    unrivaledTeamSelect.value = "";

    addUnrivaledBtn.style.display = "inline-block";
    saveUnrivaledEditBtn.style.display = "none";
    cancelUnrivaledEditBtn.style.display = "none";
  });

  bindConditionalBoolean("hasUnrivaledExperience", unrivaledExperienceWrapper, () => {
    unrivaledTeams.length = 0;
    renderUnrivaledList();
  });

  // =======================================================
  // National team / Olympics / FIBA section buttons
  // =======================================================
  bindConditionalBoolean("hasNationalTeamExperience", nationalTeamWrapper, () => {
    teamUsaMedals.length = 0;
    renderMedalList();

    setRadioBoolean("hasOlympicExperience", false);
    teamUsaJerseyInput.value = "";
    teamUsaJerseyWrapper.style.display = "none";
  });

  bindConditionalBoolean("hasOlympicExperience", teamUsaJerseyWrapper, () => {
    teamUsaJerseyInput.value = "";
  });

  addOlympicMedalBtn.addEventListener("click", () => {
    teamUsaMedals.push({
      eventType: "Olympics",
      format: olympicFormatInput.value,
      year: olympicMedalYearInput.value,
      medal: olympicMedalTypeInput.value
    });

    resetOlympicInputs();
    renderMedalList();
    updateAll();
  });

  saveOlympicEditBtn.addEventListener("click", () => {
    if (editingOlympicIndex === null) return;

    teamUsaMedals[editingOlympicIndex] = {
      eventType: "Olympics",
      format: olympicFormatInput.value,
      year: olympicMedalYearInput.value,
      medal: olympicMedalTypeInput.value
    };

    resetOlympicInputs();
    renderMedalList();
    updateAll();
  });

  cancelOlympicEditBtn.addEventListener("click", resetOlympicInputs);

  addFibaMedalBtn.addEventListener("click", () => {
    teamUsaMedals.push({
      eventType: "FIBA",
      format: fibaFormatInput.value,
      year: fibaMedalYearInput.value,
      competition: fibaCompetitionInput.value,
      medal: fibaMedalTypeInput.value
    });

    resetFibaInputs();
    renderMedalList();
    updateAll();
  });

  saveFibaEditBtn.addEventListener("click", () => {
    if (editingFibaIndex === null) return;

    teamUsaMedals[editingFibaIndex] = {
      eventType: "FIBA",
      format: fibaFormatInput.value,
      year: fibaMedalYearInput.value,
      competition: fibaCompetitionInput.value,
      medal: fibaMedalTypeInput.value
    };

    resetFibaInputs();
    renderMedalList();
    updateAll();
  });

  cancelFibaEditBtn.addEventListener("click", resetFibaInputs);

  // =======================================================
  // WNBA timeline buttons + career timeline triggers
  // =======================================================
  draftYearInput.addEventListener("input", syncTimelineFromCareerInputs);

  playerActiveYesInput.addEventListener("change", () => {
    syncActivePlayerUI();
    syncTimelineFromCareerInputs();
  });

  playerActiveNoInput.addEventListener("change", () => {
    syncActivePlayerUI();
    syncTimelineFromCareerInputs();
  });

  retiredYearInput.addEventListener("input", syncTimelineFromCareerInputs);

  prevSeasonBtn.addEventListener("click", () => goToAdjacentSeason(-1));
  nextSeasonBtn.addEventListener("click", () => goToAdjacentSeason(1));

  copyPreviousSeasonBtn.addEventListener("click", copyPreviousSeasonEntries);

  saveSeasonBtn.addEventListener("click", () => {
    renderWnbaTimeline();
    updateAll();
  });

  addSeasonTeamEntryBtn.addEventListener("click", () => {
    addSeasonEntry("team");
  });

  addSeasonSitOutEntryBtn.addEventListener("click", () => {
    addSeasonEntry("sit_out");
  });

  saveJsonBtn.addEventListener("click", savePlayer);
  copyJsonBtn.addEventListener("click", copyJsonPreview);
}

function confirmPlayerIdEdit() {
  if (!playerIdManualMode) return;

  playerIdManualMode = false;
  playerIdInput.readOnly = true;
  editPlayerIdBtn.textContent = "Edit ID";
  updateAll();
}

// =======================================================
// Init
// =======================================================
window.addEventListener("load", async () => {
  setupPanels();
  bindLiveInputs();

  await loadAllData();

  applyUrlParams();

  updateOverseasReferenceModeUI();
  updateAll();
});