(() => {
const CURRENT_DISPLAY_YEAR = 2025;

const DATA_PATHS = {
  players: "basketball_101_data_files/wnba_olympic_players.json",
  colleges: "basketball_101_data_files/wnba_colleges.json",
  seasons: "basketball_101_data_files/wnba_season_stats.json",
  teams: "basketball_101_data_files/wnba_static_data_v2.json",
  finals: "basketball_101_data_files/wnba_finals.json"
};

let DATA = {};

async function loadOverviewData() {
  const [playersRes, collegesRes, seasonsRes, teamsRes, finalsRes] = await Promise.all([
    fetch(DATA_PATHS.players),
    fetch(DATA_PATHS.colleges),
    fetch(DATA_PATHS.seasons),
    fetch(DATA_PATHS.teams),
    fetch(DATA_PATHS.finals)
  ]);

  DATA.players = await playersRes.json();
  DATA.colleges = await collegesRes.json();
  DATA.seasons = await seasonsRes.json();
  DATA.teams = await teamsRes.json();
  DATA.finals = await finalsRes.json();
  DATA.teamsByCode = buildTeamsByCode(DATA.teams);
}

// initializing the html element 
async function initOlympicOverview() {
  await loadOverviewData();

    renderOverview({
    rosterYear: getRosterYear(),
    view: "all"
    });

  setupOverviewControls();
}

document.addEventListener("DOMContentLoaded", () => {
  initOlympicOverview();
});

function getRosterYear() {
  const overview = document.querySelector(".olympic-overview");
  return Number(overview.dataset.rosterYear);
}

// rendering the overview
function renderOverview({ rosterYear, view }) {
  const container = document.getElementById("olympic-overview-viz");

  container.innerHTML = "";

  if (view === "all") {
    renderOverviewTimeline(container, rosterYear, {
      showCareerSquares: true,
      showCareerBars: false,
      showFinalsLosses: true,
      showChampionships: true,
      rowGap: 48
    });
  } else if (view === "championships") {
    renderOverviewTimeline(container, rosterYear, {
      showCareerSquares: false,
      showCareerBars: false,
      showFinalsLosses: true,
      showChampionships: true,
      rowGap: 48
    });
  } else if (view === "careerPaths") {
    renderOverviewTimeline(container, rosterYear, {
      showCareerSquares: false,
      showCareerBars: true,
      showFinalsLosses: false,
      showChampionships: false,
      rowGap: 75
    });
  } else {
    container.innerHTML = `<p>${view} coming soon</p>`;
  }
}

// rendering the timeline view
function renderOverviewTimeline(container, rosterYear, options = {}) {
  const playersObj = DATA.players.players;

  const players = Object.entries(playersObj)
    .map(([id, p]) => ({
      playerId: id,
      ...p
    }))
    .sort((a, b) => Number(a.draft.year) - Number(b.draft.year));

  const years = buildTimelineYearRange(players);

  const layout = {
    leftPad: 230,
    topPad: 60,
    yearGap: 52,
    rowGap: options.rowGap || 34,
    yearBoxSize: 40,
    dotRadius: 20
  };

  const width = layout.leftPad + years.length * layout.yearGap;
  const height = layout.topPad + players.length * layout.rowGap + 60;

  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "championship-svg"
  });

renderOverviewYearHeader(svg, years, layout);
renderOverviewPlayerRows(svg, players, years, layout);

if (options.showCareerSquares) {
  renderCareerSquares(svg, players, years, layout);
}

if (options.showCareerBars) {
  renderCareerBars(svg, players, years, layout);
}

if (options.showFinalsLosses || options.showChampionships) {
  renderChampionshipLines(svg, players, years, layout);
}

if (options.showFinalsLosses) {
  renderFinalsLossDots(svg, players, years, layout);
}

if (options.showChampionships) {
  renderChampionshipDots(svg, players, years, layout);
}

  container.appendChild(svg);
}

// rendering the timeline (general)
function buildTimelineYearRange(players) {
  const allYears = [];

  players.forEach(player => {
    if (player.draft?.year) {
      allYears.push(Number(player.draft.year));
    }

    player.wnbaTeams.forEach(team => {
      allYears.push(Number(team.startYear));

      if (team.endYear !== "present") {
        allYears.push(Number(team.endYear));
      } else {
        allYears.push(CURRENT_DISPLAY_YEAR);
      }
    });

    player.championships.forEach(champ => {
      allYears.push(Number(champ.year));
    });
  });

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears, CURRENT_DISPLAY_YEAR);

  const years = [];

  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }

  return years;
}

// helpers for career squares
function getPlayerTeamForYear(player, year) {
  return player.wnbaTeams.find(team => {
    const start = Number(team.startYear);
    const end = team.endYear === "present" ? CURRENT_DISPLAY_YEAR : Number(team.endYear);

    return year >= start && year <= end;
  });
}

function renderCareerSquares(svg, players, years, layout) {
  const squareSize = 30;

  players.forEach((player, playerIndex) => {
    const y = getPlayerY(playerIndex, layout);

    years.forEach(year => {
      const teamSeason = getPlayerTeamForYear(player, year);

      if (!teamSeason) return;

    const isChampionshipYear = player.championships.some(champ =>
    Number(champ.year) === Number(year)
    );

    const isFinalsLossYear = getFinalsLossForPlayerYear(player, year);

    if (isChampionshipYear || isFinalsLossYear) return;

      const color1 = getTeamColor(teamSeason.teamCode, "color1", "#ddd");

      const x = getYearX(year, years, layout);

      const square = createSvgElement("rect", {
        x: x - squareSize / 2,
        y: y - squareSize / 2,
        width: squareSize,
        height: squareSize,
        rx: 2,
        ry: 2,
        fill: color1,
        class: "career-square",
        "data-player-id": player.playerId,
        "data-team-code": teamSeason.teamCode,
        "data-year": year
      });

      svg.appendChild(square);
    });
  });
}

function renderCareerBars(svg, players, years, layout) {
  const barHeight = 32;

  players.forEach((player, playerIndex) => {
    const rowY = getPlayerY(playerIndex, layout);
    const barY = rowY;

    player.wnbaTeams.forEach(teamSpan => {
      const startYear = Number(teamSpan.startYear);
      const endYear = teamSpan.endYear === "present" ? CURRENT_DISPLAY_YEAR : Number(teamSpan.endYear);

      const x1 = getYearX(startYear, years, layout);
      const x2 = getYearX(endYear, years, layout);

      const color1 = getTeamColor(teamSpan.teamCode, "color1", "#ddd");
      const teamName = getTeamDisplayName(teamSpan.teamCode, "short"); 

      const bar = createSvgElement("rect", {
        x: x1 - layout.yearGap / 2,
        y: barY - barHeight / 2,
        width: x2 - x1 + layout.yearGap,
        height: barHeight,
        fill: color1,
        class: "career-bar",
        "data-player-id": player.playerId,
        "data-team-code": teamSpan.teamCode,
        "data-start-year": startYear,
        "data-end-year": endYear
      });

      const label = createSvgElement("text", {
        x: x1 + (x2 - x1) / 2,
        y: barY + 4,
        class: "career-bar-label",
        "text-anchor": "middle"
      });

      label.textContent = teamName; 

      svg.appendChild(bar);
      svg.appendChild(label);
    });
  });
}

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

function buildTeamsByCode(teamsData) {
  const teamsByCode = {};

  Object.entries(teamsData.teams).forEach(([teamCode, team]) => {
    teamsByCode[teamCode] = team;
  });

  return teamsByCode;
}

function getTeamByCode(teamCode) {
  return DATA.teamsByCode?.[teamCode] || null;
}

function getTeamColor(teamCode, colorKey = "color1", fallback = "#ddd") {
  const team = getTeamByCode(teamCode);
  return team?.branding?.colors?.[colorKey] || fallback;
}

function getTeamDisplayName(teamCode, nameType = "city") {
  const team = getTeamByCode(teamCode);

  if (!team) return teamCode;

  if (nameType === "full") return team.name?.full || teamCode;
  if (nameType === "short") return team.name?.short || teamCode;
  if (nameType === "mascot") return team.name?.mascot || teamCode;

  return team.name?.city || team.name?.short || teamCode;
}

function getYearX(year, years, layout) {
  const index = years.indexOf(Number(year));
  return layout.leftPad + index * layout.yearGap;
}

function getPlayerY(playerIndex, layout) {
  return layout.topPad + 70 + playerIndex * layout.rowGap;
}

// =====================================
// SVG rednering helper functions !!!!
// =====================================
function renderOverviewYearHeader(svg, years, layout) {
  years.forEach(year => {
    const x = getYearX(year, years, layout);
    const y = layout.topPad;

    const rect = createSvgElement("rect", {
      x: x - layout.yearBoxSize / 2,
      y: y - layout.yearBoxSize / 2,
      width: layout.yearBoxSize,
      height: layout.yearBoxSize,
      class: "year-box"
    });

    const text = createSvgElement("text", {
      x,
      y: y + 7,
      class: "year-label",
      "text-anchor": "middle"
    });

    text.textContent = `'${String(year).slice(-2)}`;

    svg.appendChild(rect);
    svg.appendChild(text);
  });
}

function renderOverviewPlayerRows(svg, players, years, layout) {
  players.forEach((player, index) => {
    const y = getPlayerY(index, layout);

    const name = createSvgElement("text", {
      x: 20,
      y: y + 6,
      class: "player-label clickable",
      "data-player-id": player.playerId
    });

    name.style.cursor = "pointer";

    name.addEventListener("click", () => {
      openPlayerCard(player.playerId);
    });

    name.textContent = player.playerName;

    const line = createSvgElement("line", {
      x1: layout.leftPad - 30,
      y1: y,
      x2: getYearX(years[years.length - 1], years, layout) + 25,
      y2: y,
      class: "player-row-line"
    });

    svg.appendChild(line);
    svg.appendChild(name);
  });
}

function openPlayerCard(playerId) {
  const container = document.getElementById("player-card-overlay");

  container.style.display = "block"; // show it

  container.innerHTML = `
    <div class="player-index-card" data-player-id="${playerId}"></div>
  `;

    container.innerHTML = `
    <div class="card-wrapper">
      <button class="close-card">✕</button>
      <div class="player-index-card" data-player-id="${playerId}"></div>
    </div>
  `;

      container.querySelector(".close-card").addEventListener("click", () => {
      container.style.display = "none";
      container.innerHTML = "";
    });

  renderPlayerCard(
    container.querySelector(".player-index-card"),
    playerId
  );
}

function renderChampionshipLines(svg, players, years, layout) {
  players.forEach((player, playerIndex) => {
    const y = getPlayerY(playerIndex, layout);

    player.championships.forEach(champ => {
      const x = getYearX(champ.year, years, layout);

      const verticalLine = createSvgElement("line", {
        x1: x,
        y1: layout.topPad + layout.yearBoxSize / 2,
        x2: x,
        y2: y,
        class: "championship-year-line"
      });

      svg.appendChild(verticalLine);
    });
  });
}

function renderChampionshipDots(svg, players, years, layout) {
  players.forEach((player, playerIndex) => {
    const y = getPlayerY(playerIndex, layout);

    player.championships.forEach(champ => {
      const x = getYearX(champ.year, years, layout);

      const color1 = getTeamColor(champ.teamCode, "color1", "#222");
      const color2 = getTeamColor(champ.teamCode, "color2", "#fff");

      const outerDot = createSvgElement("circle", {
        cx: x,
        cy: y,
        r: layout.dotRadius,
        class: "championship-dot-outer",
        fill: color1,
        stroke: "black",
        "stroke-width": 2,
        "data-player-id": player.playerId,
        "data-team-code": champ.teamCode,
        "data-year": champ.year
      });

      const innerDot = createSvgElement("circle", {
        cx: x,
        cy: y,
        r: layout.dotRadius * 0.45,
        class: "championship-dot-inner",
        fill: color2,
        stroke: "#ffffff",
        "stroke-width": 2,
        "data-player-id": player.playerId,
        "data-team-code": champ.teamCode,
        "data-year": champ.year
      });

      svg.appendChild(outerDot);
      svg.appendChild(innerDot);
    });
  });
}

function getFinalsLossForPlayerYear(player, year) {
  const finals = DATA.finals[String(year)];
  if (!finals?.runnerUp) return null;

  const playerTeam = getPlayerTeamForYear(player, year);
  if (!playerTeam) return null;

  if (playerTeam.teamCode === finals.runnerUp) {
    return playerTeam.teamCode;
  }

  return null;
}

function renderFinalsLossDots(svg, players, years, layout) {
  players.forEach((player, playerIndex) => {
    const y = getPlayerY(playerIndex, layout);

    years.forEach(year => {
      const losingTeamCode = getFinalsLossForPlayerYear(player, year);

      if (!losingTeamCode) return;

      const x = getYearX(year, years, layout);
      const color1 = getTeamColor(losingTeamCode, "color1", "#999");

      const dot = createSvgElement("circle", {
        cx: x,
        cy: y,
        r: layout.dotRadius * 0.7,
        class: "finals-loss-dot",
        fill: color1,
        "data-player-id": player.playerId,
        "data-team-code": losingTeamCode,
        "data-year": year
      });

      svg.appendChild(dot);
    });
  });
}

// wiring in the buttons
function setupOverviewControls() {
  const tabs = document.querySelectorAll(".overview-tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const view = tab.dataset.view;

      renderOverview({
        rosterYear: getRosterYear(),
        view
      });
    });
  });
}
})();