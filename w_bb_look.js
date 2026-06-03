let TEAMS = {};
let FRANCHISES = {};
let SEASON_TEAMS = {};

const DATA_PATHS = {
  staticTeams: "basketball_101_data_files/wnba_static_data_v2.json",
  teamHistory: "basketball_101_data_files/wnba_teams_history.json"
};

const boardEl = document.getElementById("main_board");
const resetBtn = document.getElementById("resetTimelineBtn");

/* ============================================================
   SMALL DATA HELPERS
============================================================ */

function normalizeTeamCode(teamCode) {
  const aliases = {
    MIA_SOL: "MIAMI_SOL",
    POR_FIRE_OLD: "POR_FIRE_2000"
  };

  return aliases[teamCode] || teamCode;
}

function getYears() {
  return Object.keys(SEASON_TEAMS)
    .map(Number)
    .sort((a, b) => a - b);
}

function getShortYear(year) {
  return String(year).slice(-2);
}

function getTeam(teamCode) {
  return TEAMS[normalizeTeamCode(teamCode)];
}

function getTeamDisplayName(teamCode) {
  const team = getTeam(teamCode);

  if (!team) return teamCode;

  return team.name?.full || teamCode;
}

function getTeamShortName(teamCode) {
  const team = getTeam(teamCode);

  if (!team) return teamCode;

  return team.name?.short || team.name?.mascot || team.name?.full || teamCode;
}

function getTeamColor(teamCode) {
  const team = getTeam(teamCode);

  return team?.branding?.colors?.color1 || "#ffffff";
}

function getFranchiseIdForTeam(teamCode) {
  const cleanCode = normalizeTeamCode(teamCode);
  const team = getTeam(cleanCode);

  return team?.franchiseId || cleanCode;
}

/* 
  This controls visual rows.

  Normal relocated franchises stay together by franchiseId:
  UTA → SA → LVA

  Brand revivals can also stay together visually:
  POR_FIRE_2000 → POR_FIRE
*/
function getTimelineGroupId(teamCode) {
  const cleanCode = normalizeTeamCode(teamCode);
  const team = getTeam(cleanCode);

  if (!team) return cleanCode;

  const franchise = FRANCHISES[team.franchiseId];

  if (franchise?.timelineRowGroup?.length) {
    return franchise.timelineRowGroup.map(normalizeTeamCode).join("__");
  }

  if (franchise?.brandLineage?.includes(cleanCode)) {
    return franchise.brandLineage.map(normalizeTeamCode).join("__");
  }

  return team.franchiseId || cleanCode;
}

/* ============================================================
   LOAD DATA
============================================================ */

async function loadStaticData() {
  const res = await fetch(DATA_PATHS.staticTeams);
  const data = await res.json();

  TEAMS = data.teams || {};
  FRANCHISES = data.franchises || {};
}

async function loadTeamHistory() {
  const res = await fetch(DATA_PATHS.teamHistory);
  SEASON_TEAMS = await res.json();
}

/* ============================================================
   ROW BUILDING
============================================================ */

function getFranchiseRows() {
  const rowsByGroup = {};

  Object.values(SEASON_TEAMS).forEach(season => {
    if (!season.teams) return;

    season.teams.forEach(teamObj => {
      const teamCode = normalizeTeamCode(teamObj.teamCode);
      const timelineGroupId = getTimelineGroupId(teamCode);
      const franchiseId = getFranchiseIdForTeam(teamCode);

      if (!rowsByGroup[timelineGroupId]) {
        rowsByGroup[timelineGroupId] = {
          timelineGroupId,
          franchiseId,
          teamCodes: new Set()
        };
      }

      rowsByGroup[timelineGroupId].teamCodes.add(teamCode);
    });
  });

  return Object.values(rowsByGroup).map(row => ({
    timelineGroupId: row.timelineGroupId,
    franchiseId: row.franchiseId,
    teamCodes: [...row.teamCodes]
  }));
}

function getTeamCodeForRowYear(franchiseRow, year) {
  const season = SEASON_TEAMS[String(year)];

  if (!season || !season.teams) return null;

  const foundTeam = season.teams.find(teamObj => {
    const teamCode = normalizeTeamCode(teamObj.teamCode);
    return franchiseRow.teamCodes.includes(teamCode);
  });

  return foundTeam ? normalizeTeamCode(foundTeam.teamCode) : null;
}

function getRowDisplayName(franchiseRow) {
  const latestTeamCode = franchiseRow.teamCodes[franchiseRow.teamCodes.length - 1];

  return getTeamDisplayName(latestTeamCode);
}

/* ============================================================
   RENDERING
============================================================ */

function renderHeaderRow(years) {
  const row = document.createElement("div");
  row.className = "timeline-row timeline-row--header";

  const spacer = document.createElement("div");
  spacer.className = "timeline-team-label";
  spacer.textContent = "Team";
  row.appendChild(spacer);

  years.forEach(year => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "timeline-year-cell";
    button.dataset.year = year;
    button.textContent = getShortYear(year);

    button.addEventListener("click", () => {
      showYearView(year);
    });

    row.appendChild(button);
  });

  boardEl.appendChild(row);
}

function renderFranchiseRow(franchiseRow, years) {
  const row = document.createElement("div");

  row.className = "timeline-row";
  row.dataset.timelineGroupId = franchiseRow.timelineGroupId;
  row.dataset.franchiseId = franchiseRow.franchiseId;

  const label = document.createElement("div");
  label.className = "timeline-team-label";
  label.textContent = getRowDisplayName(franchiseRow);
  label.dataset.defaultLabel = getRowDisplayName(franchiseRow);
  row.appendChild(label);

  years.forEach(year => {
    const teamCode = getTeamCodeForRowYear(franchiseRow, year);

    const square = document.createElement("button");

    square.type = "button";
    square.className = "timeline-square";
    square.dataset.year = year;
    square.dataset.timelineGroupId = franchiseRow.timelineGroupId;
    square.dataset.franchiseId = franchiseRow.franchiseId;

    if (teamCode) {
      square.dataset.teamCode = teamCode;
      square.title = `${getTeamDisplayName(teamCode)} — ${year}`;
      square.style.backgroundColor = getTeamColor(teamCode);

      square.addEventListener("click", () => {
        showTimelineGroupView(teamCode);
      });
    } else {
      square.classList.add("is-empty");
      square.disabled = true;
    }

    row.appendChild(square);
  });

  boardEl.appendChild(row);
}

function renderTimeline() {
  const years = getYears();
  const franchiseRows = getFranchiseRows();

  boardEl.innerHTML = "";
  boardEl.style.setProperty("--year-count", years.length);

  renderHeaderRow(years);

  franchiseRows.forEach(franchiseRow => {
    renderFranchiseRow(franchiseRow, years);
  });
}

/* ============================================================
   INTERACTION
============================================================ */

function resetView() {
  document.querySelectorAll(".timeline-square").forEach(square => {
    square.classList.remove("is-muted", "is-highlighted", "is-franchise-match", "is-year-match");
  });

  document.querySelectorAll(".timeline-row").forEach(row => {
    row.classList.remove("is-franchise-match", "is-year-match");
  });

  document.querySelectorAll(".timeline-year-cell").forEach(cell => {
    cell.classList.remove("is-active");
  });

  document.querySelectorAll(".timeline-team-label").forEach(label => {
    label.classList.remove("is-muted");

    if (label.dataset.defaultLabel) {
      label.textContent = label.dataset.defaultLabel;
    }
  });
}

function showTimelineGroupView(teamCode) {
  resetView();

  const timelineGroupId = getTimelineGroupId(teamCode);

  document.querySelectorAll(".timeline-square:not(.is-empty)").forEach(square => {
    square.classList.add("is-muted");

    if (square.dataset.timelineGroupId === timelineGroupId) {
      square.classList.remove("is-muted");
      square.classList.add("is-franchise-match");
    }
  });

  document.querySelectorAll(".timeline-row").forEach(row => {
    if (row.dataset.timelineGroupId === timelineGroupId) {
      row.classList.add("is-franchise-match");
    }
  });
}

function showYearView(year) {
  resetView();

  document.querySelectorAll(".timeline-square:not(.is-empty)").forEach(square => {
    square.classList.add("is-muted");

    if (Number(square.dataset.year) === Number(year)) {
      square.classList.remove("is-muted");
      square.classList.add("is-year-match");
    }
  });

  document.querySelectorAll(".timeline-row").forEach(row => {
    const label = row.querySelector(".timeline-team-label");

    if (label && row.dataset.timelineGroupId) {
      label.classList.add("is-muted");
    }

    const activeSquare = row.querySelector(
      `.timeline-square:not(.is-empty)[data-year="${year}"]`
    );

    if (activeSquare) {
      row.classList.add("is-year-match");

      const teamCode = activeSquare.dataset.teamCode;

      if (label && teamCode) {
        label.textContent = getTeamDisplayName(teamCode);
        label.classList.remove("is-muted");
      }
    }
  });

  const activeYearCell = document.querySelector(`.timeline-year-cell[data-year="${year}"]`);

  if (activeYearCell) {
    activeYearCell.classList.add("is-active");
  }
}

/* ============================================================
   INIT
============================================================ */

async function init() {
  await loadStaticData();
  await loadTeamHistory();

  renderTimeline();

  if (resetBtn) {
    resetBtn.addEventListener("click", resetView);
  }

  console.log("WNBA team timeline loaded with new data files");
}

document.addEventListener("DOMContentLoaded", init);