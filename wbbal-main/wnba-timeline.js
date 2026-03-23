let TEAMS = {};
let TIMELINE = {};

let activeList = null;

Promise.all([
  fetch("wnba-cluster-data.json").then(res => res.json()),
  fetch("wnba-timeline.json").then(res => res.json())
])
.then(([teamsData, timelineData]) => {

  // normalize teams by teamCode
  Object.values(teamsData).forEach(team => {
    TEAMS[team.teamCode] = team;
  });

  TIMELINE = timelineData;

  document
    .getElementById("toggle-finals-mvp-btn")
    .addEventListener("click", () => {
      toggleList("finalsMVP");
    });

  colorChampionshipSquares();
  addSquareClickListeners();
});

function getContrastColor(hex) {

  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#000000" : "#FFFFFF";
}

function applyAutoContrast(containerEl, textEl, bgColor) {

  containerEl.style.fill = bgColor;

  const contrast = getContrastColor(bgColor);

  textEl.style.fill = contrast;
}

function toggleList(type) {

  const isSame = activeList === type;

  clearAllLists();
  resetSVGHeight();

  if (!isSame) {

    if (type === "finalsMVP") {
      generateFinalsMVPList();
      document
        .getElementById("finals-mvp-section")
        .setAttribute("visibility", "visible");
    }

    activeList = type;

  } else {
    activeList = null;
  }

  updateButtonStates();
}

function updateButtonStates() {

  const btn = document.getElementById("toggle-finals-mvp-btn");
  const rect = btn.querySelector("rect");
  const text = btn.querySelector("text");   // 

  const isActive = activeList === "finalsMVP";

  rect.setAttribute("fill", isActive ? "#000" : "#fff");
  rect.setAttribute("stroke-width", isActive ? "4" : "2");

  text.setAttribute("fill", isActive ? "#fff" : "#000");  // 
}

function clearAllLists() {

  // clear generated rows
  document.getElementById("finals-mvp-list").innerHTML = "";

  // hide sections
  document.getElementById("finals-mvp-section")
    .setAttribute("visibility", "hidden");

  document.getElementById("team-appearances-section")
    ?.setAttribute("visibility", "hidden");
}

function resetSVGHeight() {
  document
    .getElementById("playoffs-timeline")
    .setAttribute("viewBox", "0 0 1920 750");
}

function generateFinalsMVPList() {

  const template = document.getElementById("finals-mvp-row-template");
  const listContainer = document.getElementById("finals-mvp-list");

  // clear list in case you regenerate later
  listContainer.innerHTML = "";

  const startX = 150;     // adjust horizontal placement
  const startY = 750;     // adjust vertical placement
  const rowHeight = 60;

  const years = Object.keys(TIMELINE)
    .map(Number)
    .sort((a, b) => a - b);

  years.forEach((year, index) => {

    const data = TIMELINE[year];
    if (!data) return;

    const champTeam = TEAMS[data.champion];
    if (!champTeam) return;

    const clone = template.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.display = "block";

    // position row
    clone.setAttribute(
      "transform",
      `translate(${startX}, ${startY + index * rowHeight})`
    );

    // populate text
    clone.querySelector(".mvp-year-label").textContent = year;
    clone.querySelector(".mvp-name-label").textContent =
      data["finals-mvp"].toUpperCase();

    clone.querySelector(".mvp-team-label").textContent =
      (champTeam.teamNameCity + " " + champTeam.teamName).toUpperCase();

    // apply team color
    const teamRect = clone.querySelector(".mvp-team-container");
    const teamText = clone.querySelector(".mvp-team-label");

    applyAutoContrast(teamRect, teamText, champTeam.colors.color1);

    listContainer.appendChild(clone);
  });

    const totalHeight = startY + (years.length * rowHeight) + 200;

    const svg = document.getElementById("playoffs-timeline");
    svg.setAttribute("viewBox", `0 0 1920 ${totalHeight}`);

    // ===== Position Description Relative To List =====
    const descriptionGroup =
      document.getElementById("finals-mvp-description-group");

    const descX = 900;           // horizontal placement
    const descY = startY;        // align with top of list

    descriptionGroup.setAttribute(
      "transform",
      `translate(${descX}, ${descY})`
    );
}

function colorChampionshipSquares() {

  const startYear = 1997;
  const squares = document.querySelectorAll(".season-square");

  Object.keys(TIMELINE).forEach(year => {

    const index = year - startYear;
    const square = squares[index];
    if (!square) return;

    const championCode = TIMELINE[year].champion;
    const championTeam = TEAMS[championCode];
    if (!championTeam) return;

    square.style.fill = championTeam.colors.color1;
    square.style.stroke = "#000";
    square.style.strokeWidth = "2";
  });
}

function addSquareClickListeners() {

  const startYear = 1997;
  const squares = document.querySelectorAll(".season-square");

  squares.forEach((square, index) => {

    square.addEventListener("click", () => {

        const year = startYear + index;

        populateFinalsReport(year);

        if (year === 1997) {
            loadYearExplainer(1997);
        }

    });

  });
}

function populateFinalsReport(year) {

  const data = TIMELINE[year];
  if (!data) return;

  const champTeam = TEAMS[data.champion];
  const runnerTeam = TEAMS[data.runnerUp];
  if (!champTeam || !runnerTeam) return;

  // ===== YEAR =====
    document
    .querySelector("#playoff-year-label tspan")
    .textContent = year;


  // ===== TEAM NAMES =====
  document.getElementById("winning-team-label").textContent =
    (champTeam.teamNameCity + " " + champTeam.teamName).toUpperCase();

  document.getElementById("runner-up-team-label").textContent =
    (runnerTeam.teamNameCity + " " + runnerTeam.teamName).toUpperCase();

  // ===== COACHES =====
  document.getElementById("winning-team-coach-label").textContent =
    data["champ-coach"];

  document.getElementById("runner-up-team-coach-label").textContent =
    data.runnerUpCoach;

  // ===== FINALS MVP =====
  document.getElementById("finals-mvp-name-label").textContent =
    data["finals-mvp"].toUpperCase();

  // ===== COLOR REPORT CARD INDICATORS (AUTO CONTRAST) =====
  const champContainer = document.getElementById("winning-team-label-container");
  const champText = document.getElementById("winning-team-label");

  applyAutoContrast(
    champContainer,
    champText,
    champTeam.colors.color1
  );

  const runnerContainer = document.getElementById("runner-up-team-label-container");
  const runnerText = document.getElementById("runner-up-team-label");

  applyAutoContrast(
    runnerContainer,
    runnerText,
    runnerTeam.colors.color1
  );
}