// =======================================================
// PLAYER INDEX CARDS
// Reusable player card component
// File location: /plyr-index-cards.js
// =======================================================

const PLAYER_CARD_PATHS = {
  players: "/plyr-index-cards.json",
  colleges: "/w_colleges_data.json",
  teams: "/wbbal-main/wnba-cluster-data.json"
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

  Object.values(teamsData).forEach(team => {
    teamsByCode[team.teamCode] = team;

    if (team.formerTeam) {
      teamsByCode[team.formerTeam] = team;
    }

    if (team.lineage) {
      team.lineage.forEach(oldTeam => {
        teamsByCode[oldTeam.teamCode] = {
          ...team,
          teamCode: oldTeam.teamCode,
          isLineageTeam: true
        };
      });
    }
  });

  return teamsByCode;
}

// -------------------------------------------------------
// SVG template
// This gets inserted into each .player-index-card div
// -------------------------------------------------------

function getPlayerIndexCardSVG() {
  return `
<svg
   width="1000"
   height="460"
   viewBox="0 0 1200 460"
   version="1.1"
   class="player-index-card-svg"
   xmlns="http://www.w3.org/2000/svg">

  <g id="layer1" transform="translate(-1267.1353,-14.142135)">

    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:2"
       width="980"
       height="430"
       x="1292.1353"
       y="34.142132" />

    <rect
       style="fill:#ffffff;stroke:#000000;stroke-width:2"
       id="plyr-name-box"
       width="478"
       height="70"
       x="1620"
       y="54.142136" />

    <text
       style="font-style:italic;font-weight:600;font-size:38px;font-family:'Chivo Mono';text-anchor:left;letter-spacing:-1px;word-spacing:-3px;fill:#000000"
       x="1640"
       y="100"
       id="plyr-name-text">PLAYER NAME</text>

    <g id="plyr-team-key"></g>

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



    <g id="plyr-team-timeline"></g>

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
  const draftTeam = TEAMS_BY_CODE[player.draft.teamCode];

  setSVGText(svg, "#plyr-name-text", player.playerName.toUpperCase());

  setSVGText(
    svg,
    "#plyr-college-text",
    college ? college.name.toUpperCase() : "COLLEGE UNKNOWN"
  );

  const draftTeamName = draftTeam
    ? draftTeam.teamName
    : player.draft.teamCode;

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
      fill: team?.colors?.color1 || "#dddddd",
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

    label.textContent = team?.teamName || teamSpan.teamCode;

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

  const careerStart = Math.min(
    ...player.wnbaTeams.map(team => Number(team.startYear))
  );

  const careerEnd = Math.max(
    ...player.wnbaTeams.map(team => normalizeEndYear(team.endYear))
  );

  const timelineX = 1640;
  const timelineY = 320;
  const timelineWidth = 600;

  const tickHeight = 10;
  const unitSize = 18;
  const unitY = timelineY + 22;

  const totalYears = careerEnd - careerStart + 1;
  const yearWidth = timelineWidth / Math.max(totalYears - 1, 1);
  const yearLabelStep = getYearLabelStep(totalYears);

  // generic horizontal timeline line
  const baseLine = createSVGElement("line", {
    x1: timelineX,
    y1: timelineY,
    x2: timelineX + timelineWidth,
    y2: timelineY,
    stroke: "#000000",
    "stroke-width": 2
  });

  timeline.appendChild(baseLine);

  // draw year ticks
  for (let year = careerStart; year <= careerEnd; year++) {
    const yearIndex = year - careerStart;
    const x = timelineX + yearIndex * yearWidth;

    const tick = createSVGElement("line", {
      x1: x,
      y1: timelineY - tickHeight / 2,
      x2: x,
      y2: timelineY + tickHeight / 2,
      stroke: "#000000",
      "stroke-width": 2
    });

    timeline.appendChild(tick);

    const shouldShowYear =
    year === careerStart ||
    year === careerEnd ||
    (year - careerStart) % yearLabelStep === 0;

    if (shouldShowYear) {
    const yearText = createSVGElement("text", {
        x,
        y: timelineY - 12,
        "text-anchor": "middle",
        "font-size": 16,
        "font-family": "Chivo Mono",
        fill: "#000000"
    });

    yearText.textContent = formatShortYear(year);

    timeline.appendChild(yearText);
    }
  }

  // draw colored team-year units
  player.wnbaTeams.forEach(teamSpan => {
    const team = TEAMS_BY_CODE[teamSpan.teamCode];

    const startYear = Number(teamSpan.startYear);
    const endYear = normalizeEndYear(teamSpan.endYear);

    for (let year = startYear; year <= endYear; year++) {
      const yearIndex = year - careerStart;
      const x = timelineX + yearIndex * yearWidth;

      const square = createSVGElement("rect", {
        x: x - unitSize / 2,
        y: unitY,
        width: unitSize,
        height: unitSize,
        fill: team?.colors?.color1 || "#dddddd",
        stroke: "#000000",
        "stroke-width": 1
      });

      timeline.appendChild(square);
    }
  });

/*   // optional team span labels below the squares
  player.wnbaTeams.forEach(teamSpan => {
    const team = TEAMS_BY_CODE[teamSpan.teamCode];

    const startYear = Number(teamSpan.startYear);
    const endYear = normalizeEndYear(teamSpan.endYear);

    const startX = timelineX + (startYear - careerStart) * yearWidth;
    const endX = timelineX + (endYear - careerStart) * yearWidth;
    const centerX = (startX + endX) / 2;

    const teamText = createSVGElement("text", {
      x: centerX,
      y: unitY + 36,
      "text-anchor": "middle",
      "font-size": 11,
      "font-family": "Chivo Mono",
      fill: "#000000"
    });

    teamText.textContent = team?.teamName || teamSpan.teamCode;

    timeline.appendChild(teamText);
  }); */
} 

function normalizeEndYear(endYear) {
  if (endYear === "present") return CURRENT_DISPLAY_YEAR;
  return Number(endYear);
}

function renderTimelineYearLabels(
  timeline,
  careerStart,
  careerEnd,
  timelineX,
  timelineY,
  timelineWidth,
  yearWidth
) {
  const startText = createSVGElement("text", {
    x: timelineX,
    y: timelineY + 55,
    "text-anchor": "start",
    "font-size": 11,
    "font-family": "Chivo Mono",
    fill: "#000000"
  });

  startText.textContent = careerStart;

  const endText = createSVGElement("text", {
    x: timelineX + timelineWidth,
    y: timelineY + 55,
    "text-anchor": "end",
    "font-size": 11,
    "font-family": "Chivo Mono",
    fill: "#000000"
  });

  endText.textContent = careerEnd;

  timeline.appendChild(startText);
  timeline.appendChild(endText);
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

  const careerStart = Math.min(
    ...player.wnbaTeams.map(team => Number(team.startYear))
  );

  const careerEnd = Math.max(
    ...player.wnbaTeams.map(team => normalizeEndYear(team.endYear))
  );

  const timelineX = 1640;
  const timelineY = 320;
  const timelineWidth = 600;
  const timelineHeight = 34;
  const totalYears = careerEnd - careerStart + 1;
  const yearWidth = timelineWidth / Math.max(totalYears - 1, 1);

  const markerY = 400;

  championships.forEach(chip => {
    const chipYear = Number(chip.year);
    const team = TEAMS_BY_CODE[chip.teamCode];

    const chipX =
      timelineX + (chipYear - careerStart) * yearWidth;

    const connectorLine = createSVGElement("line", {
        x1: chipX,
        y1: timelineY + timelineHeight,
        x2: chipX,
        y2: markerY - 12,
        stroke: team?.colors?.color1 || "#000000",
        "stroke-width": 2,
        "stroke-dasharray": "4 3"
    });

    const ring = createSVGElement("circle", {
      cx: chipX,
      cy: markerY,
      r: 10,
      fill: "none",
      stroke: team?.colors?.color1 || "#000000",
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

    teamText.textContent = team?.teamName || chip.teamCode;

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