console.log("Player input tool loaded");

const playerSelect = document.getElementById("playerSelect");

let PLAYERS = {};
const PLAYERS_PATH = "../../basketball_101_data_files/wnba_olympic_players.json";

const ncaaChampionships = [];

let wnbaSeasonTimeline = [];
let selectedTimelineYear = null;

const championships = [];
const overseasTeams = [];
const unrivaledTeams = [];
const teamUsaMedals = [];

// TOOL / FUNCTIONAL INPUT/BUTTON REFERENCES
const copyJsonBtn = document.getElementById("copyJsonBtn");

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
const copyPreviousTeamBtn = document.getElementById("copyPreviousTeamBtn");

const seasonFullInput = document.getElementById("seasonFull");
const seasonPartialInput = document.getElementById("seasonPartial");

const playedSeasonOptions = document.getElementById("playedSeasonOptions");
const missedSeasonOptions = document.getElementById("missedSeasonOptions");
const partialSeasonOptions = document.getElementById("partialSeasonOptions");

const missedTimelineTeamSelect = document.getElementById("missedTimelineTeamSelect");

const addPartialTeamBtn = document.getElementById("addPartialTeamBtn");
const addPartialSitOutBtn = document.getElementById("addPartialSitOutBtn");
const partialSegmentsList = document.getElementById("partialSegmentsList");

const seasonTeamSelect = document.getElementById("seasonTeamSelect");
const seasonPlayedInput = document.getElementById("seasonPlayed");
const seasonMissedInput = document.getElementById("seasonMissed");
const seasonReasonInput = document.getElementById("seasonReason");
const seasonNoteInput = document.getElementById("seasonNote");
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
const teamInput = document.getElementById("overseasTeam");
const countryInput = document.getElementById("overseasCountry");
const addOverseasBtn = document.getElementById("addOverseasBtn");
const overseasList = document.getElementById("overseasList");

// unrivaled inputs
const unrivaledYearInput = document.getElementById("unrivaledYear");
const unrivaledTeamInput = document.getElementById("unrivaledTeam");
const addUnrivaledBtn = document.getElementById("addUnrivaledBtn");
const unrivaledList = document.getElementById("unrivaledList");

// FIBA / national team play inputs
const medalYearInput = document.getElementById("medalYear");
const medalCompetitionInput = document.getElementById("medalCompetition");
const medalTypeInput = document.getElementById("medalType");
const addMedalBtn = document.getElementById("addMedalBtn");
const medalList = document.getElementById("medalList");


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

      const colors = [];

      if (season.teamCode) {
        colors.push(getTeamColor(season.teamCode));
      }

      season.segments
        .filter((segment) => segment.type === "team" && segment.teamCode)
        .forEach((segment) => {
          colors.push(getTeamColor(segment.teamCode));
        });

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
      <div class="team-label">${season.secondTeamCode ? `${season.teamCode}/${season.secondTeamCode}` : season.teamCode || "—"}</div>
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

  seasonPlayedInput.checked = season.status === "played";
  seasonMissedInput.checked = season.status === "missed";

  seasonFullInput.checked = season.seasonType !== "partial";
  seasonPartialInput.checked = season.seasonType === "partial";

  seasonTeamSelect.value = season.teamCode || "";
  missedTimelineTeamSelect.value = season.teamCode || "";

  seasonReasonInput.value = season.reason || "";
  seasonNoteInput.value = season.note || "";

  renderPartialSegmentsList(season);
  syncSeasonEditorVisibility();
}

function saveSelectedSeason() {
  const season = wnbaSeasonTimeline.find((item) => item.year === selectedTimelineYear);
  if (!season) return;

  season.status = seasonMissedInput.checked ? "missed" : "played";
  season.seasonType = seasonPartialInput.checked ? "partial" : "full";

  if (season.status === "missed") {
    season.teamCode = missedTimelineTeamSelect.value;
    season.reason = seasonReasonInput.value;
    season.note = seasonNoteInput.value;
    season.segments = [];
  } else {
    season.teamCode = seasonTeamSelect.value;
    season.reason = "";
    season.note = "";

    if (season.seasonType === "full") {
      season.segments = [];
    }
  }

  renderWnbaTimeline();
  updateJSONPreview();
}

function buildWnbaTeamsFromTimeline() {
  const playedSeasons = wnbaSeasonTimeline.filter(
    (season) => season.status === "played" && season.teamCode
  );

  if (!playedSeasons.length) return [];

  const spans = [];
  let currentSpan = {
    teamCode: playedSeasons[0].teamCode,
    startYear: String(playedSeasons[0].year),
    endYear: String(playedSeasons[0].year)
  };

  for (let i = 1; i < playedSeasons.length; i++) {
    const season = playedSeasons[i];
    const previous = playedSeasons[i - 1];

    const sameTeam = season.teamCode === currentSpan.teamCode;
    const consecutive = season.year === previous.year + 1;

    if (sameTeam && consecutive) {
      currentSpan.endYear = String(season.year);
    } else {
      addMovementToSpan(currentSpan);
      spans.push(currentSpan);
      currentSpan = {
        teamCode: season.teamCode,
        startYear: String(season.year),
        endYear: String(season.year)
      };
    }
  }

    addMovementToSpan(currentSpan);
    spans.push(currentSpan);

  if (playerActiveYesInput.checked && spans.length) {
    spans[spans.length - 1].endYear = "present";
  }

  return spans;
}

function addMovementToSpan(span) {
  const startSeason = wnbaSeasonTimeline.find(
    (season) => String(season.year) === span.startYear && season.teamCode === span.teamCode
  );

  if (!startSeason) return;

  if (startSeason.movementType) {
    span.movementType = startSeason.movementType;
  }

  if (startSeason.movementNote) {
    span.movementNote = startSeason.movementNote;
  }

  if (startSeason.secondTeamCode) {
    span.secondTeamCode = startSeason.secondTeamCode;
  }
}

function buildMissedSeasonsFromTimeline() {
  const missed = [];

  wnbaSeasonTimeline.forEach((season) => {
    if (season.status === "missed") {
      const entry = {
        year: String(season.year),
        teamCode: season.teamCode,
        reason: season.reason
      };

      if (season.note) entry.note = season.note;

      missed.push(entry);
    }

    season.segments
      .filter((segment) => segment.type === "sit_out")
      .forEach((segment) => {
        const entry = {
          year: String(season.year),
          teamCode: season.teamCode,
          reason: segment.reason
        };

        if (segment.note) entry.note = segment.note;
        entry.partialSeason = true;

        missed.push(entry);
      });
  });

  return missed;
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

function copyPreviousSeasonTeam() {
  const currentIndex = getSelectedSeasonIndex();
  if (currentIndex <= 0) return;

  const previousSeason = wnbaSeasonTimeline[currentIndex - 1];

  seasonTeamSelect.value = previousSeason.teamCode || "";
  updateJSONPreview();
}

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



// JSON PREVIEW
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

  overseasTeams.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.season} - ${entry.team} (${entry.country})`;
    overseasList.appendChild(li);
  });
}

// unrivaled LIST
function renderUnrivaledList() {
  unrivaledList.innerHTML = "";

  unrivaledTeams.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.year} - ${entry.team}`;
    unrivaledList.appendChild(li);
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

syncTeamSelectToInput(draftedBySelect, draftedByInput);
syncTeamSelectToInput(acquiredBySelect, acquiredByInput);
syncTeamSelectToInput(championshipTeamSelect, championshipTeamCodeInput);


// ================ JSON PREVIEW =================
// ================ JSON PREVIEW =================
// ----------------------------------------------
function updateJSONPreview() {
  const playerId = playerIdInput.value || "player_id_here";

    const draftDetails = {
        year: draftYearInput.value,
        pick: draftPickInput.value,
        draftedBy: draftedByInput.value
    };

    if (acquiredByInput.value) {
        draftDetails.acquiredBy = acquiredByInput.value;
    }

    if (transactionNoteInput.value) {
        draftDetails.transactionNote = transactionNoteInput.value;
    }

  const output = {
    [playerId]: {
      playerName: playerNameInput.value,
      teamUsaJersey: teamUsaJerseyInput.value,

      careerDetails: {
        collegeCareer: {
          collegeId: collegeIdInput.value,
          startYear: collegeStartInput.value,
          endYear: collegeEndInput.value,
          ncaaChampionships: ncaaChampionships
        },

        draftDetails: draftDetails,

        missedWnbaSeasons: buildMissedSeasonsFromTimeline(),
        overseasTeams: overseasTeams,
        unrivaledTeams: unrivaledTeams,
        teamUsaMedals: teamUsaMedals
      },

      image: {
        src: imageSrcInput.value,
        alt: imageAltInput.value
      },

      wnbaTeams: buildWnbaTeamsFromTimeline(),
      championships: championships
    }
  };

  jsonPreview.textContent = JSON.stringify(output, null, 2);
}


// ======== CLICK HANDLERS ======================
// ======== CLICK HANDLERS ======================
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
    team: teamInput.value,
    country: countryInput.value
  };

  overseasTeams.push(newEntry);

  renderOverseasList();
  updateJSONPreview();

  seasonInput.value = "";
  teamInput.value = "";
  countryInput.value = "";
});

// unrivaled button
addUnrivaledBtn.addEventListener("click", () => {
  const newEntry = {
    year: unrivaledYearInput.value,
    team: unrivaledTeamInput.value
  };

  unrivaledTeams.push(newEntry);

  renderUnrivaledList();
  updateJSONPreview();

  unrivaledYearInput.value = "";
  unrivaledTeamInput.value = "";
});

// FIBA / national team button
addMedalBtn.addEventListener("click", () => {
  const newEntry = {
    year: medalYearInput.value,
    competition: medalCompetitionInput.value,
    medal: medalTypeInput.value
  };

  teamUsaMedals.push(newEntry);

  renderMedalList();
  updateJSONPreview();

  medalYearInput.value = "";
  medalCompetitionInput.value = "";
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

// playerId edit button
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
});

// ======== PLAYER MENU / SELECT ======================
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
  teamUsaJerseyInput.value = player.teamUsaJersey || "";

  imageSrcInput.value = player.image?.src || "";
  imageAltInput.value = player.image?.alt || "";

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

  updateJSONPreview();
}

playerSelect.addEventListener("change", () => {
  fillFormFromPlayer(playerSelect.value);
});

// ======== COLLEGE MENU / SELECT ======================
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

function syncSeasonEditorVisibility() {
  playedSeasonOptions.style.display = seasonPlayedInput.checked ? "block" : "none";
  missedSeasonOptions.style.display = seasonMissedInput.checked ? "block" : "none";

  partialSeasonOptions.style.display =
    seasonPlayedInput.checked && seasonPartialInput.checked ? "block" : "none";
}

function getSelectedSeason() {
  return wnbaSeasonTimeline.find((season) => season.year === selectedTimelineYear);
}

function addPartialTeamSegment() {
  const season = getSelectedSeason();
  if (!season) return;

  const teamCode = prompt("Enter teamCode for additional team segment:");
  if (!teamCode) return;

  const movementNote = prompt("Movement note, optional:") || "";

  season.seasonType = "partial";
  season.status = "played";
  season.segments.push({
    type: "team",
    teamCode: teamCode,
    movementNote: movementNote
  });

  seasonPartialInput.checked = true;
  renderPartialSegmentsList(season);
  renderWnbaTimeline();
  updateJSONPreview();
}

function addPartialSitOutSegment() {
  const season = getSelectedSeason();
  if (!season) return;

  const reason = prompt("Reason for sit-out segment:") || "";
  const note = prompt("Extra note/details, optional:") || "";

  season.seasonType = "partial";
  season.status = "played";
  season.segments.push({
    type: "sit_out",
    reason: reason,
    note: note
  });

  seasonPartialInput.checked = true;
  renderPartialSegmentsList(season);
  renderWnbaTimeline();
  updateJSONPreview();
}

function renderPartialSegmentsList(season) {
  partialSegmentsList.innerHTML = "";

  if (!season || !season.segments.length) {
    partialSegmentsList.innerHTML = `<p class="empty-note">No partial segments yet.</p>`;
    return;
  }

  season.segments.forEach((segment, index) => {
    const div = document.createElement("div");
    div.className = "partial-segment-card";

    if (segment.type === "team") {
      div.textContent = `Segment ${index + 1}: Team - ${segment.teamCode}`;
    }

    if (segment.type === "sit_out") {
      div.textContent = `Segment ${index + 1}: Sit-out - ${segment.reason}`;
    }

    partialSegmentsList.appendChild(div);
  });
}

[seasonPlayedInput, seasonMissedInput, seasonFullInput, seasonPartialInput].forEach((input) => {
  input.addEventListener("change", syncSeasonEditorVisibility);
});

addPartialTeamBtn.addEventListener("click", addPartialTeamSegment);
addPartialSitOutBtn.addEventListener("click", addPartialSitOutSegment);

playerActiveYesInput.addEventListener("change", () => {
  retiredYearWrapper.style.display = "none";
  retiredYearInput.value = "";
});

playerActiveNoInput.addEventListener("change", () => {
  retiredYearWrapper.style.display = "block";
});

generateWnbaTimelineBtn.addEventListener("click", generateWnbaSeasonTimeline);

prevSeasonBtn.addEventListener("click", () => goToAdjacentSeason(-1));
nextSeasonBtn.addEventListener("click", () => goToAdjacentSeason(1));
copyPreviousTeamBtn.addEventListener("click", copyPreviousSeasonTeam);

saveSeasonBtn.addEventListener("click", saveSelectedSeason);