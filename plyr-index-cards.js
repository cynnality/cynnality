// =======================================================
// PLAYER INDEX CARDS
// Reusable player card element
// File location: /plyr-index-cards.js
// =======================================================

(() => {

const PLAYER_CARD_PATHS = {
  players: "basketball_101_data_files/wnba_olympic_players.json",
  colleges: "basketball_101_data_files/wnba_colleges.json",
  teams: "basketball_101_data_files/wnba_static_data_v2.json"
};

const CURRENT_DISPLAY_YEAR = 2025;

let PLAYER_CARDS = {};
let COLLEGES = {};
let TEAMS_BY_CODE = {};

const SVG_NS = "http://www.w3.org/2000/svg";

// -------------------------------------------------------
// Load all required JSON files
// -------------------------------------------------------

async function loadPlayerIndexCardData() {
  const [playersRes, collegesRes, teamsRes] = await Promise.all([
    fetch(PLAYER_CARD_PATHS.players),
    fetch(PLAYER_CARD_PATHS.colleges),
    fetch(PLAYER_CARD_PATHS.teams)
  ]);

  const playersData = await playersRes.json();
  const collegesData = await collegesRes.json();
  const teamsData = await teamsRes.json();

  PLAYER_CARDS = playersData.players;
  COLLEGES = collegesData.colleges;
  TEAMS_BY_CODE = buildTeamsByCode(teamsData);

  console.log("PLAYER_CARDS:", PLAYER_CARDS);
  console.log("COLLEGES:", COLLEGES);
  console.log("TEAMS_BY_CODE:", TEAMS_BY_CODE);
}

// -------------------------------------------------------
// Convert WNBA cluster data into teamCode lookup
// -------------------------------------------------------

function buildTeamsByCode(teamsData) {
  const teamsByCode = {};

  Object.entries(teamsData.teams).forEach(([teamCode, team]) => {
    teamsByCode[teamCode] = team;
  });

  return teamsByCode;
}

function getTeamByCode(teamCode) {
  return TEAMS_BY_CODE?.[teamCode] || null;
}

function getTeamColor(teamCode, colorKey = "color1", fallback = "#dddddd") {
  const team = getTeamByCode(teamCode);
  return team?.branding?.colors?.[colorKey] || fallback;
}

function getTeamDisplayName(teamCode, nameType = "short") {
  const team = getTeamByCode(teamCode);

  if (!team) return teamCode;

  if (nameType === "full") return team.name?.full || teamCode;
  if (nameType === "city") return team.name?.city || teamCode;
  if (nameType === "mascot") return team.name?.mascot || teamCode;

  return team.name?.short || teamCode;
}

// -------------------------------------------------------
// SVG template
// This gets inserted into each .player-index-card div
// -------------------------------------------------------

function getPlayerIndexCardSVG() {
  return `
<svg
   width="999"
   height="640"
   viewBox="0 0 1000 660"
   version="1.1"
   class="player-index-card-svg"
   xmlns="http://www.w3.org/2000/svg">

  <g id="layer1" transform="translate(-1267.1353,-14.142135)">
    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:2"
       width="992"
       height="612"
       x="1286"
       y="28" />
    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:2"
       width="980"
       height="600"
       x="1292.1353"
       y="34.142132" />

    <text
       style="font-style:italic;font-weight:600;font-size:38px;font-family:'Chivo Mono';text-anchor:left;letter-spacing:-1px;word-spacing:-3px;fill:#000000"
       x="1640"
       y="100"
       id="plyr-name-text">PLAYER NAME</text>

    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:1.5"
       id="plyr-college-box"
       width="480"
       height="40"
       x="1620"
       y="170" />

    <text
       style="font-weight:300;font-size:18px;font-family:'Chivo Mono';letter-spacing:-1px;word-spacing:-3px;fill:#000000"
       x="1630"
       y="195"
       id="plyr-college-text">COLLEGE</text>

    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:1.5"
       id="plyr-draft-box"
       width="480"
       height="40"
       x="1620"
       y="210" />
    <text
       style="font-weight:300;font-size:18px;font-family:'Chivo Mono';text-anchor:left;letter-spacing:-1px;word-spacing:-3px;fill:#000000"
       x="1630"
       y="236"
       id="plyr-draft-text">DRAFT INFO</text>
    <text
       style="font-weight:300;font-size:22px;font-family:'Chivo Mono';text-anchor:middle;letter-spacing:-1px;word-spacing:-3px;fill:#000000"
       x="1906"
       y="456"
       id="plyr-chip-history-text">CHAMPIONSHIPS</text>
    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:2"
       id="plyr-image-container"
       width="312"
       height="397"
       x="1300"
       y="48" />


    <g id="plyr-team-key"></g>
    <g id="plyr-team-timeline"></g>
    <g id="plyr-image-layer"></g>

  </g>
</svg>
`;
}

// -------------------------------------------------------
// Render all cards on page
// -------------------------------------------------------

async function initPlayerIndexCards() {
  await loadPlayerIndexCardData();

  const cardContainers = document.querySelectorAll(".player-index-card");

  cardContainers.forEach(container => {
    const playerId = container.dataset.playerId;
    renderPlayerCard(container, playerId);
  });
}

// -------------------------------------------------------
// Render one player card
// -------------------------------------------------------

function renderPlayerCard(container, playerId) {
  const player = PLAYER_CARDS[playerId];

  if (!player) {
    console.warn(`No player found for playerId: ${playerId}`);
    container.innerHTML = `<p>Player not found: ${playerId}</p>`;
    return;
  }

  container.innerHTML = getPlayerIndexCardSVG();

  const svg = container.querySelector("svg");

  renderBasicPlayerInfo(svg, player);
  renderPlayerTeamKey(svg, player);
  renderPlayerImage(svg, player);
  renderPlayerTeamTimeline(svg, player);
  renderPlayerChampionships(svg, player);
}

// -------------------------------------------------------
// Basic text fields
// -------------------------------------------------------

function renderBasicPlayerInfo(svg, player) {
  const college = COLLEGES[player.collegeId];

  setSVGText(svg, "#plyr-name-text", player.playerName.toUpperCase());

  setSVGText(
    svg,
    "#plyr-college-text",
    college ? college.name.toUpperCase() : "COLLEGE UNKNOWN"
  );

  const draftTeamName = getTeamDisplayName(player.draft.teamCode, "short");

  setSVGText(
    svg,
    "#plyr-draft-text",
    `Drafted in ${player.draft.year} - Picked by the ${draftTeamName}`
  );
}

function setSVGText(svg, selector, text) {
  const el = svg.querySelector(selector);
  if (el) el.textContent = text;
}


// -------------------------------------------------------
// Player team history quick key / legend
// -------------------------------------------------------
function renderPlayerTeamKey(svg, player) {
  const keyLayer = svg.querySelector("#plyr-team-key");
  if (!keyLayer || !player.wnbaTeams) return;

  keyLayer.innerHTML = "";

  const startX = 1640;
  const startY = 150;

  const squareSize = 20;
  const itemGap = 120;

  player.wnbaTeams.forEach((teamSpan, index) => {
    const team = TEAMS_BY_CODE[teamSpan.teamCode];

    const x = startX + index * itemGap;
    const y = startY;

    const square = createSVGElement("rect", {
      x,
      y: y - squareSize + 5,
      width: squareSize,
      height: squareSize,
      fill: getTeamColor(teamSpan.teamCode, "color1", "#dddddd"),
      stroke: "#000000",
      "stroke-width": 1
    });

    const label = createSVGElement("text", {
      x: x + squareSize + 8,
      y,
      "text-anchor": "start",
      "font-size": 16,
      "font-family": "Chivo Mono",
      fill: "#000000"
    });

    label.textContent = getTeamDisplayName(teamSpan.teamCode, "short");

    keyLayer.appendChild(square);
    keyLayer.appendChild(label);
  });
}

// -------------------------------------------------------
// Player image
// -------------------------------------------------------

function renderPlayerImage(svg, player) {
  const imageLayer = svg.querySelector("#plyr-image-layer");

  if (!imageLayer || !player.image?.src) return;

  const img = document.createElementNS(SVG_NS, "image");

  img.setAttribute("href", player.image.src);
  img.setAttribute("x", "1306.6353");
  img.setAttribute("y", "54.142071");
  img.setAttribute("width", "300");
  img.setAttribute("height", "380");
  img.setAttribute("preserveAspectRatio", "xMidYMid slice");

  imageLayer.appendChild(img);
}
// -------------------------------------------------------
// Team timeline helpers
// -------------------------------------------------------

function formatShortYear(year) {
  return `’${String(year).slice(-2)}`;
}

function getYearLabelStep(totalYears) {
  if (totalYears <= 13) return 1;      // show every year
  if (totalYears <= 21) return 2;     // show every other year
  return 3;                           // long careers like Taurasi
}

// -------------------------------------------------------
// Team timeline
// -------------------------------------------------------

function renderPlayerTeamTimeline(svg, player) {
  const timeline = svg.querySelector("#plyr-team-timeline");
  if (!timeline || !player.wnbaTeams) return;

  timeline.innerHTML = "";

  const years = buildPlayerTimelineYears(player);

  const layout = {
    leftPad: 1400,
    topPad: 485,
    yearGap: 36,
    squareSize: 26,
    yearBoxSize: 28
  };

  renderPlayerTimelineYearHeader(timeline, years, layout);
  renderPlayerCareerSquares(timeline, player, years, layout);
}

function buildPlayerTimelineYears(player) {
  const allYears = [];

  if (player.draft?.year) {
    allYears.push(Number(player.draft.year));
  }

  player.wnbaTeams.forEach(team => {
    allYears.push(Number(team.startYear));

    if (team.endYear === "present") {
      allYears.push(CURRENT_DISPLAY_YEAR);
    } else {
      allYears.push(Number(team.endYear));
    }
  });

  player.championships.forEach(champ => {
    allYears.push(Number(champ.year));
  });

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears, CURRENT_DISPLAY_YEAR);

  const years = [];

  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }

  return years;
}

function getPlayerTimelineYearX(year, years, layout) {
  const index = years.indexOf(Number(year));
  return layout.leftPad + index * layout.yearGap;
}

function renderPlayerTimelineYearHeader(timeline, years, layout) {
  years.forEach(year => {
    const x = getPlayerTimelineYearX(year, years, layout);
    const y = layout.topPad;

    const rect = createSVGElement("rect", {
      x: x - layout.yearBoxSize / 2,
      y: y - layout.yearBoxSize / 2,
      width: layout.yearBoxSize,
      height: layout.yearBoxSize,
      fill: "#ffffff",
      stroke: "#000000",
      "stroke-width": 1,
      class: "player-card-year-box"
    });

    const text = createSVGElement("text", {
      x,
      y: y + 5,
      "text-anchor": "middle",
      "font-size": 13,
      "font-family": "Chivo Mono",
      fill: "#000000",
      class: "player-card-year-label"
    });

    text.textContent = `’${String(year).slice(-2)}`;

    timeline.appendChild(rect);
    timeline.appendChild(text);
  });
}

function renderPlayerCareerSquares(timeline, player, years, layout) {
  const squareSize = 26;
  const squareY = layout.topPad + 48;

  player.wnbaTeams.forEach(teamSpan => {
    const startYear = Number(teamSpan.startYear);
    const endYear = normalizeEndYear(teamSpan.endYear);

    for (let year = startYear; year <= endYear; year++) {
      const x = getPlayerTimelineYearX(year, years, layout);

      const square = createSVGElement("rect", {
        x: x - squareSize / 2,
        y: squareY - squareSize / 2,
        width: squareSize,
        height: squareSize,
        rx: 2,
        ry: 2,
        fill: getTeamColor(teamSpan.teamCode, "color1", "#dddddd"),
        stroke: "#000000",
        "stroke-width": 1,
        class: "player-card-career-square",
        "data-team-code": teamSpan.teamCode,
        "data-year": year
      });

      timeline.appendChild(square);
    }
  });
}

function normalizeEndYear(endYear) {
  if (endYear === "present") return CURRENT_DISPLAY_YEAR;
  return Number(endYear);
}

// -------------------------------------------------------
// Championships
// -------------------------------------------------------

function renderPlayerChampionships(svg, player) {
  const chipText = svg.querySelector("#plyr-chip-history-text");
  if (chipText) chipText.textContent = "";

  let chipLayer = svg.querySelector("#plyr-chip-markers");

  if (!chipLayer) {
    chipLayer = createSVGElement("g", {
      id: "plyr-chip-markers"
    });

    svg.querySelector("#layer1").appendChild(chipLayer);
  }

  chipLayer.innerHTML = "";

  const championships = player.championships || [];

  if (championships.length === 0) {
    if (chipText) chipText.textContent = "No WNBA championships";
    return;
  }

    const years = buildPlayerTimelineYears(player);

    const layout = {
      leftPad: 1400,
      topPad: 485,
      yearGap: 36,
      squareSize: 26,
      yearBoxSize: 28
    };

    const timelineY = layout.topPad + 48;
    const markerY = 585;

  championships.forEach(chip => {
    const chipYear = Number(chip.year);

    const chipX = getPlayerTimelineYearX(chipYear, years, layout);

    const connectorLine = createSVGElement("line", {
        x1: chipX,
        y1: timelineY,
        x2: chipX,
        y2: markerY - 12,
        stroke: getTeamColor(chip.teamCode, "color1", "#000000"),
        "stroke-width": 2,
        "stroke-dasharray": "4 3"
    });

    const ring = createSVGElement("circle", {
      cx: chipX,
      cy: markerY,
      r: 10,
      fill: "none",
      stroke: getTeamColor(chip.teamCode, "color1", "#000000"),
      "stroke-width": 3
    });

    const yearText = createSVGElement("text", {
      x: chipX,
      y: markerY + 28,
      "text-anchor": "middle",
      "font-size": 18,
      "font-family": "Chivo Mono",
      fill: "#000000"
    });

    yearText.textContent = chip.year;

    const teamText = createSVGElement("text", {
      x: chipX,
      y: markerY + 45,
      "text-anchor": "middle",
      "font-size": 14,
      "font-family": "Chivo Mono",
      fill: "#000000"
    });

    teamText.textContent = getTeamDisplayName(chip.teamCode, "short");

    chipLayer.appendChild(connectorLine);
    chipLayer.appendChild(ring);
    chipLayer.appendChild(yearText);
    chipLayer.appendChild(teamText);
  });
}

// -------------------------------------------------------
// SVG helper
// -------------------------------------------------------

function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

// -------------------------------------------------------
// Start after page loads
// -------------------------------------------------------

document.addEventListener("DOMContentLoaded", initPlayerIndexCards);

window.renderPlayerCard = renderPlayerCard;

})();