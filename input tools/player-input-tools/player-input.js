console.log("Player input tool loaded");

const playerSelect = document.getElementById("playerSelect");

let PLAYERS = {};
const PLAYERS_PATH = "../../basketball_101_data_files/wnba_olympic_players_v2.json";

const OVERSEAS_TEAMS_PATH = "/basketball_101_data_files/overseas_teams_data.json";
const UNRIVALED_TEAMS_PATH = "/basketball_101_data_files/unrivaled_teams_data.json";

let OVERSEAS_TEAMS = {};
let UNRIVALED_TEAMS = {};

const ncaaChampionships = [];

let wnbaSeasonTimeline = [];
let selectedTimelineYear = null;

const championships = [];
const overseasTeams = [];
const unrivaledTeams = [];
const teamUsaMedals = [];

// wrappers for yes/no areas and conditional fields/elements 
const teamUsaJerseyWrapper = document.getElementById("teamUsaJerseyWrapper");
const ncaaChampionshipsWrapper = document.getElementById("ncaaChampionshipsWrapper");
const draftDayTradeWrapper = document.getElementById("draftDayTradeWrapper");
const overseasExperienceWrapper = document.getElementById("overseasExperienceWrapper");
const unrivaledExperienceWrapper = document.getElementById("unrivaledExperienceWrapper");
const wnbaChampionshipsWrapper = document.getElementById("wnbaChampionshipsWrapper");
const nationalTeamWrapper = document.getElementById("nationalTeamWrapper");
const medalEventTypeInput = document.getElementById("medalEventType");

// TOOL / FUNCTIONAL INPUT/BUTTON REFERENCES
const copyJsonBtn = document.getElementById("copyJsonBtn");
const saveJsonBtn = document.getElementById("saveJsonBtn");

// college select
const collegeSelect = document.getElementById("collegeSelect");
let COLLEGES = {};

// player id input
const editPlayerIdBtn = document.getElementById("editPlayerIdBtn");
let playerIdManualMode = false;

// basic player info inputs
const playerIdInput = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const teamUsaJerseyInput = document.getElementById("teamUsaJersey");

// image inputs
const imageSrcInput = document.getElementById("imageSrc");
const imageAltInput = document.getElementById("imageAlt");

// college inputs
const collegeIdInput = document.getElementById("collegeId");
const collegeStartInput = document.getElementById("collegeStartYear");
const collegeEndInput = document.getElementById("collegeEndYear");

// college NCAA championship inputs
const ncaaChampionshipYearInput = document.getElementById("ncaaChampionshipYear");
const ncaaChampionshipCollegeIdInput = document.getElementById("ncaaChampionshipCollegeId");

const addNcaaChampionshipBtn = document.getElementById("addNcaaChampionshipBtn");
const ncaaChampionshipsList = document.getElementById("ncaaChampionshipsList");

// draft inputs
const draftYearInput = document.getElementById("draftYear");
const draftPickInput = document.getElementById("draftPick");
const draftedByInput = document.getElementById("draftedBy");
const acquiredByInput = document.getElementById("acquiredBy");
const transactionNoteInput = document.getElementById("transactionNote");

const draftedBySelect = document.getElementById("draftedBySelect");
const acquiredBySelect = document.getElementById("acquiredBySelect");

// wnba team inputs
let WNBA_TEAMS = {};
const WNBA_TEAMS_PATH = "../../basketball_101_data_files/wnba_static_data_v2.json";

const playerActiveYesInput = document.getElementById("playerActiveYes");
const playerActiveNoInput = document.getElementById("playerActiveNo");
const retiredYearWrapper = document.getElementById("retiredYearWrapper");
const retiredYearInput = document.getElementById("retiredYear");
const generateWnbaTimelineBtn = document.getElementById("generateWnbaTimelineBtn");

const wnbaTimelineEl = document.getElementById("wnbaTimeline");
const seasonEditor = document.getElementById("seasonEditor");
const selectedSeasonLabel = document.getElementById("selectedSeasonLabel");
const prevSeasonBtn = document.getElementById("prevSeasonBtn");
const nextSeasonBtn = document.getElementById("nextSeasonBtn");
const addSeasonTeamEntryBtn = document.getElementById("addSeasonTeamEntryBtn");
const addSeasonSitOutEntryBtn = document.getElementById("addSeasonSitOutEntryBtn");
const seasonEntriesList = document.getElementById("seasonEntriesList");

const copyPreviousSeasonBtn = document.getElementById("copyPreviousSeasonBtn");
const saveSeasonBtn = document.getElementById("saveSeasonBtn");

// wnba championship inputs
const championshipYearInput = document.getElementById("championshipYear");
const championshipTeamCodeInput = document.getElementById("championshipTeamCode");
const finalsMvpInput = document.getElementById("finalsMvp");

const addChampionshipBtn = document.getElementById("addChampionshipBtn");
const championshipsList = document.getElementById("championshipsList");

const championshipTeamSelect = document.getElementById("championshipTeamSelect");

// overseas team inputs
const seasonInput = document.getElementById("overseasSeason");
const overseasTeamSelect = document.getElementById("overseasTeamSelect");
const teamInput = document.getElementById("overseasTeam");
const addOverseasBtn = document.getElementById("addOverseasBtn");
const overseasList = document.getElementById("overseasList");

let editingOverseasIndex = null;

const saveOverseasEditBtn = document.getElementById("saveOverseasEditBtn");
const cancelOverseasEditBtn = document.getElementById("cancelOverseasEditBtn");

// unrivaled inputs
const unrivaledYearInput = document.getElementById("unrivaledYear");
const unrivaledTeamSelect = document.getElementById("unrivaledTeamSelect");
const unrivaledTeamInput = document.getElementById("unrivaledTeam");
const addUnrivaledBtn = document.getElementById("addUnrivaledBtn");
const unrivaledList = document.getElementById("unrivaledList");

let editingUnrivaledIndex = null;

const saveUnrivaledEditBtn = document.getElementById("saveUnrivaledEditBtn");
const cancelUnrivaledEditBtn = document.getElementById("cancelUnrivaledEditBtn");

// FIBA / national team play inputs
const medalYearInput = document.getElementById("medalYear");
const medalCompetitionInput = document.getElementById("medalCompetition");
const medalTypeInput = document.getElementById("medalType");
const addMedalBtn = document.getElementById("addMedalBtn");
const medalList = document.getElementById("medalList");

// =============================================================================
// ========== yes/no fields and conditional element helpers ====================
// =============================================================================
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
      wrapperEl.style.display = isYes ? "block" : "none";

      if (!isYes && typeof onNo === "function") {
        onNo();
      }

      updateJSONPreview();
    });
  });
}
// =============================================================================

// playerId creation 
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

function getCareerEndYear() {
  if (playerActiveYesInput.checked) return 2026;

  if (playerActiveNoInput.checked && retiredYearInput.value) {
    return Number(retiredYearInput.value);
  }

  return null;
}

function generateWnbaSeasonTimeline() {
  const startYear = Number(draftYearInput.value);
  const endYear = getCareerEndYear();

  if (!startYear || !endYear || endYear < startYear) {
    alert("Enter draft year and active/retired details first.");
    return;
  }

  wnbaSeasonTimeline = [];

  for (let year = startYear; year <= endYear; year++) {
    wnbaSeasonTimeline.push({
      year: year,
      seasonType: "full",
      status: "played",
      teamCode: "",
      segments: [],
      reason: "",
      note: ""
    });
  }

  renderWnbaTimeline();
  updateJSONPreview();
}

function getTeamColor(teamCode) {
  return WNBA_TEAMS[teamCode]?.branding?.colors?.color1 || "#eee";
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
          .map((entry) => entry.teamCode)
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

function getSelectedSeason() {
  return wnbaSeasonTimeline.find((season) => season.year === selectedTimelineYear);
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
  updateJSONPreview();
}

function copyPreviousSeasonEntries() {
  const currentIndex = getSelectedSeasonIndex();
  if (currentIndex <= 0) return;

  const currentSeason = wnbaSeasonTimeline[currentIndex];
  const previousSeason = wnbaSeasonTimeline[currentIndex - 1];

  const previousEntries = ensureSeasonEntries(previousSeason);

  currentSeason.entries = previousEntries.map(entry => ({ ...entry }));

  renderSeasonEntriesList(currentSeason);
  renderWnbaTimeline();
  updateJSONPreview();
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
        <option value="">-- Select team --</option>
      </select>

      ${
        entry.type === "sit_out"
          ? `<input class="entry-reason" placeholder="Reason" value="${entry.reason || ""}">`
          : ""
      }

      <textarea class="entry-note" placeholder="Note/details">${entry.note || ""}</textarea>
    `;

    const teamSelect = card.querySelector(".entry-team-select");
    populateSingleWnbaTeamSelect(teamSelect);
    teamSelect.value = entry.teamCode || "";

    teamSelect.addEventListener("change", () => {
      entry.teamCode = teamSelect.value;
      renderWnbaTimeline();
      updateJSONPreview();
    });

    const reasonInput = card.querySelector(".entry-reason");
    if (reasonInput) {
      reasonInput.addEventListener("input", () => {
        entry.reason = reasonInput.value;
        updateJSONPreview();
      });
    }

    const noteInput = card.querySelector(".entry-note");
    noteInput.addEventListener("input", () => {
      entry.note = noteInput.value;
      updateJSONPreview();
    });

    card.querySelector(".remove-season-entry-btn").addEventListener("click", () => {
      entries.splice(index, 1);
      renderSeasonEntriesList(season);
      renderWnbaTimeline();
      updateJSONPreview();
    });

    seasonEntriesList.appendChild(card);
  });
}

function getSelectedSeasonIndex() {
  return wnbaSeasonTimeline.findIndex((season) => season.year === selectedTimelineYear);
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

function replaceArrayContents(targetArray, sourceArray = []) {
  targetArray.length = 0;
  targetArray.push(...sourceArray);
}

function normalizeOverseasTeamEntry(entry) {
  return {
    season: entry.season || "",
    teamCode: entry.teamCode || entry.team || ""
  };
}

function normalizeUnrivaledTeamEntry(entry) {
  return {
    year: Number(entry.year),
    teamCode: entry.teamCode || entry.team || ""
  };
}

function loadWnbaTimelineFromPlayer(player) {
  wnbaSeasonTimeline = [];

  const wnbaTeams = player.wnbaTeams || [];
  const missedSeasons = player.careerDetails?.missedWnbaSeasons || [];

  wnbaTeams.forEach((span) => {
    const start = Number(span.startYear);
    const end = span.endYear === "present" ? 2026 : Number(span.endYear);

    for (let year = start; year <= end; year++) {
      let existingSeason = wnbaSeasonTimeline.find(item => item.year === year);

      if (!existingSeason) {
        wnbaSeasonTimeline.push({
          year,
          seasonType: "full",
          status: "played",
          teamCode: span.teamCode,
          segments: [],
          reason: "",
          note: ""
        });
      } else if (existingSeason.teamCode !== span.teamCode) {
        existingSeason.seasonType = "partial";
        existingSeason.segments.push({
          type: "team",
          teamCode: span.teamCode
        });
      }
    }
  });

  missedSeasons.forEach((missed) => {
    const year = Number(missed.year);
    let season = wnbaSeasonTimeline.find(item => item.year === year);

    if (!season) {
      season = {
        year,
        seasonType: "full",
        status: "missed",
        teamCode: missed.teamCode || "",
        segments: [],
        reason: missed.reason || "",
        note: missed.note || ""
      };

      wnbaSeasonTimeline.push(season);
    } else if (missed.partialSeason) {
      season.seasonType = "partial";
      season.segments.push({
        type: "sit_out",
        reason: missed.reason || "",
        note: missed.note || ""
      });
    } else {
      season.status = "missed";
      season.teamCode = missed.teamCode || "";
      season.reason = missed.reason || "";
      season.note = missed.note || "";
    }
  });

  wnbaSeasonTimeline.sort((a, b) => a.year - b.year);
  selectedTimelineYear = null;
}
//wnba championship yes/no button option helper
function syncActivePlayerUI() {
  const isActive = getRadioBoolean("playerActive2026");

  retiredYearWrapper.style.display = isActive ? "none" : "block";

  if (isActive) {
    retiredYearInput.value = "";
  }

  updateJSONPreview();
}
  
retiredYearInput.addEventListener("input", updateJSONPreview);
playerActiveYesInput.addEventListener("change", syncActivePlayerUI);
playerActiveNoInput.addEventListener("change", syncActivePlayerUI);

// ======== LIVE UPDATE LISTENERS ======================
// ======== LIVE UPDATE LISTENERS ======================
// ==============================================
[
  playerNameInput,
  teamUsaJerseyInput,
  imageSrcInput,
  imageAltInput,

  collegeIdInput,
  collegeStartInput,
  collegeEndInput,
  draftYearInput,
  draftPickInput,
  draftedByInput,
  acquiredByInput,
  transactionNoteInput
].forEach(input => {
  input.addEventListener("input", updateJSONPreview);
});


//========== JSON PREVIEW ================
const jsonPreview = document.getElementById("jsonPreview");


// ======== LIST RENDERERS ======================
// ======== LIST RENDERERS ======================
// ==============================================
// College NCAA championships LIST
function renderNcaaChampionshipsList() {
  ncaaChampionshipsList.innerHTML = "";

  ncaaChampionships.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.year} - ${entry.collegeId}`;
    ncaaChampionshipsList.appendChild(li);
  });
}

// WNBA championships LIST
function renderChampionshipsList() {
  championshipsList.innerHTML = "";

  championships.forEach((entry) => {
    const li = document.createElement("li");
    const mvpText = entry.finalsMVP ? " — Finals MVP" : "";
    li.textContent = `${entry.year} - ${entry.teamCode}${mvpText}`;
    championshipsList.appendChild(li);
  });
}


// overseas LIST
function renderOverseasList() {
  overseasList.innerHTML = "";

  overseasTeams.forEach((entry, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${entry.season} - ${entry.teamCode}</span>
      <button type="button" data-index="${index}" class="edit-overseas-btn">Edit</button>
    `;

    overseasList.appendChild(li);
  });

  document.querySelectorAll(".edit-overseas-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const entry = overseasTeams[index];

      editingOverseasIndex = index;

      seasonInput.value = entry.season || "";
      teamInput.value = entry.teamCode || "";
      overseasTeamSelect.value = entry.teamCode || "";

      addOverseasBtn.style.display = "none";
      saveOverseasEditBtn.style.display = "inline-block";
      cancelOverseasEditBtn.style.display = "inline-block";
    });
  });
}

// unrivaled LIST
function renderUnrivaledList() {
  unrivaledList.innerHTML = "";

  unrivaledTeams.forEach((entry, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${entry.year} - ${entry.teamCode}</span>
      <button type="button" data-index="${index}" class="edit-unrivaled-btn">Edit</button>
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
}

// FIBA / national team play LIST
function renderMedalList() {
  medalList.innerHTML = "";

  teamUsaMedals.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.year} - ${entry.competition} (${entry.medal})`;
    medalList.appendChild(li);
  });
}

function syncTeamSelectToInput(select, input) {
  select.addEventListener("change", () => {
    input.value = select.value;
    updateJSONPreview();
  });
}

// =======================================================================
//           selections -> entered into the data/json generated
// ========================================================================
syncTeamSelectToInput(draftedBySelect, draftedByInput);
syncTeamSelectToInput(acquiredBySelect, acquiredByInput);
syncTeamSelectToInput(championshipTeamSelect, championshipTeamCodeInput);
syncTeamSelectToInput(overseasTeamSelect, teamInput);
syncTeamSelectToInput(unrivaledTeamSelect, unrivaledTeamInput);
//========================================================================

// ================ JSON PREVIEW =================
function getPlayerId() {
  return playerIdInput.value || "player_id_here";
}

function getPlayerData() {
  const draftDetails = {
    year: draftYearInput.value,
    pick: draftPickInput.value,
    draftedBy: draftedByInput.value
  };

  if (getRadioBoolean("wasDraftDayTrade")) {
    if (acquiredByInput.value) {
      draftDetails.acquiredBy = acquiredByInput.value;
    }

    if (transactionNoteInput.value) {
      draftDetails.transactionNote = transactionNoteInput.value;
    }
  }

  return {
    playerName: playerNameInput.value,
    teamUsaJersey: getRadioBoolean("isOlympicPlayer") ? teamUsaJerseyInput.value : "",

    playerStatus: {
      isActive: getRadioBoolean("playerActive2026"),
      hasNcaaChampionships: getRadioBoolean("hasNcaaChampionships"),
      wasDraftDayTrade: getRadioBoolean("wasDraftDayTrade"),
      hasWnbaChampionships: getRadioBoolean("hasWnbaChampionships"),
      hasOverseasExperience: getRadioBoolean("hasOverseasExperience"),
      hasUnrivaledExperience: getRadioBoolean("hasUnrivaledExperience"),
      isOlympicPlayer: getRadioBoolean("hasOlympicExperience"),
      hasNationalTeamExperience: getRadioBoolean("hasNationalTeamExperience"),
      hasOlympicExperience: getRadioBoolean("hasOlympicExperience"),
    },

    careerDetails: {
      collegeCareer: {
        collegeId: collegeIdInput.value,
        startYear: collegeStartInput.value,
        endYear: collegeEndInput.value,
        ncaaChampionships: getRadioBoolean("hasNcaaChampionships") ? ncaaChampionships : []
      },

      draftDetails: draftDetails,

      missedWnbaSeasons: buildMissedSeasonsFromTimeline(),
      overseasTeams: getRadioBoolean("hasOverseasExperience") ? overseasTeams : [],
      unrivaledTeams: getRadioBoolean("hasUnrivaledExperience") ? unrivaledTeams : [],
      teamUsaMedals: getRadioBoolean("hasNationalTeamExperience") ? teamUsaMedals : []
    },

    image: {
      src: imageSrcInput.value,
      alt: imageAltInput.value
    },

    wnbaTeams: buildWnbaTeamsFromTimeline(),
    championships: getRadioBoolean("hasWnbaChampionships") ? championships : []
  };
}

function buildPlayerPreviewText() {
  const playerId = getPlayerId();
  const playerData = getPlayerData();

  return `"${playerId}": ${JSON.stringify(playerData, null, 2)}`;
}

function updateJSONPreview() {
  jsonPreview.textContent = buildPlayerPreviewText();
}
//==============================================

// ======== CLICK HANDLERS btns======================
// ==============================================
// college NCAA championship button
addNcaaChampionshipBtn.addEventListener("click", () => {
  const newEntry = {
    year: ncaaChampionshipYearInput.value,
    collegeId: ncaaChampionshipCollegeIdInput.value
  };

  ncaaChampionships.push(newEntry);

  renderNcaaChampionshipsList();
  updateJSONPreview();

  ncaaChampionshipYearInput.value = "";
  ncaaChampionshipCollegeIdInput.value = "";
});

// WNBA championship button
addChampionshipBtn.addEventListener("click", () => {
  const newEntry = {
    year: championshipYearInput.value,
    teamCode: championshipTeamCodeInput.value
  };

  if (finalsMvpInput.checked) {
    newEntry.finalsMVP = true;
  }

  championships.push(newEntry);

  renderChampionshipsList();
  updateJSONPreview();

  championshipYearInput.value = "";
  championshipTeamCodeInput.value = "";
  finalsMvpInput.checked = false;
});

// overseason button
addOverseasBtn.addEventListener("click", () => {
  const newEntry = {
    season: seasonInput.value,
    teamCode: teamInput.value
  };

  overseasTeams.push(newEntry);

  renderOverseasList();
  updateJSONPreview();

  seasonInput.value = "";
  teamInput.value = "";
  overseasTeamSelect.value = "";
});

// unrivaled button
addUnrivaledBtn.addEventListener("click", () => {
  const newEntry = {
    year: Number(unrivaledYearInput.value),
    teamCode: unrivaledTeamInput.value.trim()
  };

  unrivaledTeams.push(newEntry);

  renderUnrivaledList();
  updateJSONPreview();

  unrivaledYearInput.value = "";
  unrivaledTeamInput.value = "";
  unrivaledTeamSelect.value = "";
});

// FIBA / national team button
addMedalBtn.addEventListener("click", () => {
  const newEntry = {
    year: medalYearInput.value,
    competition: medalCompetitionInput.value,
    eventType: medalEventTypeInput.value,
    medal: medalTypeInput.value
  };

  teamUsaMedals.push(newEntry);

  renderMedalList();
  updateJSONPreview();

  medalYearInput.value = "";
  medalCompetitionInput.value = "";
  medalEventTypeInput.value = "";
  medalTypeInput.value = "";
});

// JSON COPY button
copyJsonBtn.addEventListener("click", async () => {
  const jsonText = jsonPreview.textContent;

  try {
    await navigator.clipboard.writeText(jsonText);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
      copyJsonBtn.textContent = "Copy JSON";
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Copy failed. You can still manually select and copy the JSON.");
  }
});

saveJsonBtn.addEventListener("click", async () => {
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
      saveJsonBtn.textContent = "Save JSON File";
    }, 1200);
  } catch (error) {
    console.error(error);
    alert("Save failed. Make sure the local save server is running.");
  }
});

// ================ PLAYERID editing buttons =================
playerNameInput.addEventListener("input", () => {
  if (!playerIdManualMode) {
    playerIdInput.value = createPlayerIdFromName(playerNameInput.value);
  }
  updateJSONPreview();
});
editPlayerIdBtn.addEventListener("click", () => {
  playerIdManualMode = true;
  playerIdInput.readOnly = false;
  playerIdInput.focus();
  editPlayerIdBtn.textContent = "Confirm playerId";
});
playerIdInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    confirmPlayerIdEdit();
  }
});
playerIdInput.addEventListener("blur", () => {
  if (playerIdManualMode) {
    confirmPlayerIdEdit();
  }
});
function confirmPlayerIdEdit() {
  playerIdManualMode = false;
  playerIdInput.readOnly = true;
  editPlayerIdBtn.textContent = "Edit playerId";
  updateJSONPreview();
} 

// collapse / expand panels 
document.querySelectorAll(".panel > h2").forEach((heading) => {
  const panel = heading.closest(".panel");

  if (panel.querySelector("#jsonPreview")) return;

  heading.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
  });
});

// =============================================================================
// ========== yes/mp no fields and conditional element =========================
// ==================== event listeners ========================================
bindConditionalBoolean("isOlympicPlayer", teamUsaJerseyWrapper, () => {
  teamUsaJerseyInput.value = "";
});

bindConditionalBoolean("hasNcaaChampionships", ncaaChampionshipsWrapper, () => {
  ncaaChampionships.length = 0;
  renderNcaaChampionshipsList();
});

bindConditionalBoolean("wasDraftDayTrade", draftDayTradeWrapper, () => {
  acquiredByInput.value = "";
  acquiredBySelect.value = "";
  transactionNoteInput.value = "";
});

bindConditionalBoolean("hasOverseasExperience", overseasExperienceWrapper, () => {
  overseasTeams.length = 0;
  renderOverseasList();
});

bindConditionalBoolean("hasUnrivaledExperience", unrivaledExperienceWrapper, () => {
  unrivaledTeams.length = 0;
  renderUnrivaledList();
});

bindConditionalBoolean("hasWnbaChampionships", wnbaChampionshipsWrapper, () => {
  championships.length = 0;
  renderChampionshipsList();

  championshipYearInput.value = "";
  championshipTeamCodeInput.value = "";
  championshipTeamSelect.value = "";
  finalsMvpInput.checked = false;
});

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
// =============================================================================

// forcing fresh preview on page load
window.addEventListener("load", () => {
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = false;
    } else {
      field.value = "";
    }
  });

  updateJSONPreview();
  loadPlayerMenu();
  loadCollegeMenu();
  loadWnbaTeamMenu();
  loadOverseasTeamMenu();
  loadUnrivaledTeamMenu();
});

// ======== PLAYER MENU / SELECT ======================
// ==============================================
async function loadPlayerMenu() {
  try {
    const res = await fetch(PLAYERS_PATH);
    const data = await res.json();

    PLAYERS = data.players || {};
    populatePlayerSelect();
  } catch (error) {
    console.error("Could not load players:", error);
  }
}

function populatePlayerSelect() {
  playerSelect.innerHTML = `<option value="">-- Select player --</option>`;

  Object.entries(PLAYERS)
    .sort((a, b) => a[1].playerName.localeCompare(b[1].playerName))
    .forEach(([playerId, player]) => {
      const option = document.createElement("option");
      option.value = playerId;
      option.textContent = `${player.playerName} (${playerId})`;
      playerSelect.appendChild(option);
    });

  playerSelect.value = "";
}

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

  setRadioBoolean("playerActive2026", isActive);
  syncActivePlayerUI();
  
  teamUsaJerseyInput.value = player.teamUsaJersey || "";

  imageSrcInput.value = player.image?.src || "";
  imageAltInput.value = player.image?.alt || "";

  setRadioBoolean("isOlympicPlayer", Boolean(player.teamUsaJersey));
  setRadioBoolean(
    "hasNcaaChampionships",
    Boolean(player.careerDetails?.collegeCareer?.ncaaChampionships?.length)
  );
  setRadioBoolean(
    "wasDraftDayTrade",
    Boolean(player.careerDetails?.draftDetails?.acquiredBy)
  );
  setRadioBoolean(
    "hasWnbaChampionships",
    Boolean(player.championships?.length)
  );
  setRadioBoolean(
    "hasOverseasExperience",
    Boolean(player.careerDetails?.overseasTeams?.length)
  );
  setRadioBoolean(
    "hasUnrivaledExperience",
    Boolean(player.careerDetails?.unrivaledTeams?.length)
  );

  teamUsaJerseyWrapper.style.display = getRadioBoolean("isOlympicPlayer") ? "block" : "none";
  ncaaChampionshipsWrapper.style.display = getRadioBoolean("hasNcaaChampionships") ? "block" : "none";
  draftDayTradeWrapper.style.display = getRadioBoolean("wasDraftDayTrade") ? "block" : "none";
  overseasExperienceWrapper.style.display = getRadioBoolean("hasOverseasExperience") ? "block" : "none";
  unrivaledExperienceWrapper.style.display = getRadioBoolean("hasUnrivaledExperience") ? "block" : "none";
  wnbaChampionshipsWrapper.style.display = getRadioBoolean("hasWnbaChampionships") ? "block" : "none";

  collegeIdInput.value = player.careerDetails?.collegeCareer?.collegeId || player.collegeId || "";
  collegeStartInput.value = player.careerDetails?.collegeCareer?.startYear || "";
  collegeEndInput.value = player.careerDetails?.collegeCareer?.endYear || "";

  draftYearInput.value = player.careerDetails?.draftDetails?.year || player.draft?.year || "";
  draftPickInput.value = player.careerDetails?.draftDetails?.pick || "";
  draftedByInput.value =
    player.careerDetails?.draftDetails?.draftedBy ||
    player.draft?.teamCode ||
    "";

  acquiredByInput.value = player.careerDetails?.draftDetails?.acquiredBy || "";
  transactionNoteInput.value = player.careerDetails?.draftDetails?.transactionNote || "";

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
      (player.careerDetails?.overseasTeams || []).map(normalizeOverseasTeamEntry)
    );

    replaceArrayContents(
      unrivaledTeams,
      (player.careerDetails?.unrivaledTeams || []).map(normalizeUnrivaledTeamEntry)
    );

    replaceArrayContents(
      teamUsaMedals,
      player.careerDetails?.teamUsaMedals || []
    );

    loadWnbaTimelineFromPlayer(player);

    renderNcaaChampionshipsList();
    renderChampionshipsList();
    renderOverseasList();
    renderUnrivaledList();
    renderMedalList();
    renderWnbaTimeline();

  updateJSONPreview();
}

playerSelect.addEventListener("change", () => {
  fillFormFromPlayer(playerSelect.value);
});

// ======== COLLEGE MENU / SELECT ======================
// ==============================================
async function loadCollegeMenu() {
  try {
    const res = await fetch("../../basketball_101_data_files/wnba_colleges.json");
    const data = await res.json();

    COLLEGES = data.colleges;

    populateCollegeSelect();
  } catch (error) {
    console.error("Could not load colleges:", error);
  }
}

function populateCollegeSelect() {
  collegeSelect.innerHTML = `<option value="">-- Select college --</option>`;

  Object.entries(COLLEGES)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([collegeId, college]) => {
      const option = document.createElement("option");
      option.value = collegeId;
      option.textContent = `${college.name} (${collegeId})`;
      collegeSelect.appendChild(option);
    });

    collegeSelect.value = "";
}

collegeSelect.addEventListener("change", () => {
  collegeIdInput.value = collegeSelect.value;
  updateJSONPreview();
});


// ======== WNBA TEAM MENU / SELECT ======================
// ==============================================
async function loadWnbaTeamMenu() {
  try {
    const res = await fetch(WNBA_TEAMS_PATH);
    const data = await res.json();

    WNBA_TEAMS = data.teams || {};
    populateWnbaTeamSelects();
  } catch (error) {
    console.error("Could not load WNBA teams:", error);
  }
}

function populateWnbaTeamSelects() {
  const selects = document.querySelectorAll(".wnba-team-select");

  selects.forEach((select) => {
    select.innerHTML = `<option value="">-- Select team --</option>`;

    Object.entries(WNBA_TEAMS)
      .sort((a, b) => a[1].name.full.localeCompare(b[1].name.full))
      .forEach(([teamCode, team]) => {
        const option = document.createElement("option");
        option.value = teamCode;
        option.textContent = `${team.name.full} (${teamCode})`;
        select.appendChild(option);
      });
  });
}

generateWnbaTimelineBtn.addEventListener("click", generateWnbaSeasonTimeline);

function populateSingleWnbaTeamSelect(select) {
  select.innerHTML = `<option value="">-- Select team --</option>`;

  Object.entries(WNBA_TEAMS)
    .sort((a, b) => a[1].name.full.localeCompare(b[1].name.full))
    .forEach(([teamCode, team]) => {
      const option = document.createElement("option");
      option.value = teamCode;
      option.textContent = `${team.name.full} (${teamCode})`;
      select.appendChild(option);
    });
}

prevSeasonBtn.addEventListener("click", () => goToAdjacentSeason(-1));
nextSeasonBtn.addEventListener("click", () => goToAdjacentSeason(1));

copyPreviousSeasonBtn.addEventListener("click", copyPreviousSeasonEntries);

addSeasonTeamEntryBtn.addEventListener("click", () => {
  addSeasonEntry("team");
});

addSeasonSitOutEntryBtn.addEventListener("click", () => {
  addSeasonEntry("sit_out");
});


// ======== overseas MENU / SELECT ======================
// ======== overseas TEAM MENU / SELECT ======================
// ==============================================

async function loadOverseasTeamMenu() {
  try {
    const res = await fetch(OVERSEAS_TEAMS_PATH);

    if (!res.ok) {
      throw new Error(`Could not load overseas teams: ${res.status}`);
    }

    const data = await res.json();
    OVERSEAS_TEAMS = data.teams || data;

    populateOverseasTeamSelect();
  } catch (error) {
    console.error("Could not load overseas teams:", error);
  }
}

function populateOverseasTeamSelect() {
  overseasTeamSelect.innerHTML = `<option value="">-- Select overseas team --</option>`;

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

  overseasTeamSelect.value = "";
}
saveOverseasEditBtn.addEventListener("click", () => {
  if (editingOverseasIndex === null) return;

  overseasTeams[editingOverseasIndex] = {
    season: seasonInput.value.trim(),
    teamCode: teamInput.value.trim()
  };

  editingOverseasIndex = null;

  seasonInput.value = "";
  teamInput.value = "";
  overseasTeamSelect.value = "";

  addOverseasBtn.style.display = "inline-block";
  saveOverseasEditBtn.style.display = "none";
  cancelOverseasEditBtn.style.display = "none";

  renderOverseasList();
  updateJSONPreview();
});

cancelOverseasEditBtn.addEventListener("click", () => {
  editingOverseasIndex = null;

  seasonInput.value = "";
  teamInput.value = "";
  overseasTeamSelect.value = "";

  addOverseasBtn.style.display = "inline-block";
  saveOverseasEditBtn.style.display = "none";
  cancelOverseasEditBtn.style.display = "none";
});

// ======== unrivaled MENU / SELECT ======================
// ======== unrivaled TEAM MENU / SELECT ======================
// ==============================================
async function loadUnrivaledTeamMenu() {
  try {
    const res = await fetch(UNRIVALED_TEAMS_PATH);

    if (!res.ok) {
      throw new Error(`Could not load Unrivaled teams: ${res.status}`);
    }

    const data = await res.json();
    UNRIVALED_TEAMS = data.teams || data;

    populateUnrivaledTeamSelect();
  } catch (error) {
    console.error("Could not load Unrivaled teams:", error);
  }
}

function populateUnrivaledTeamSelect() {
  unrivaledTeamSelect.innerHTML = `<option value="">-- Select Unrivaled team --</option>`;

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

  unrivaledTeamSelect.value = "";
}
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
  updateJSONPreview();
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