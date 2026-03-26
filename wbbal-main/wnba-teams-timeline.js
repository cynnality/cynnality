let TEAMS = {};
let SEASON_STATS = {};
let PLAYOFFS = {};
let selectedYear = 1997;

let TIMELINE_DATA = {};

let miniTimelineMode = false;

let REG_SEASON_AWARDS = {};

let playoffMode = true;

/*====================================
grid config for the team containers injection
======================================*/
const GRID_CONFIG = {
  columnsPerConference: 1,
  boxWidth: 300,
  boxHeight: 60,
  gapX: 8,
  gapY: 8,
  conferenceGap: -30 // space between East and West blocks
};

/*====================================
utility for team loc + team name
======================================*/
function getTeamDisplayName(teamCode) {

  const team = TEAMS[teamCode];

  if (!team) return teamCode;

  return `${team.teamNameCity} ${team.teamName}`;
}



Promise.all([
  fetch("wnba-cluster-data.json").then(res => res.json()),
  fetch("wnba-timeline.json").then(res => res.json()),
  fetch("wnba-season-stats.json").then(res => res.json()),
  fetch("wnba-team-timeline.json").then(res => res.json()),
  fetch("wnba-reg-season-awards.json").then(res => res.json()) // NEW
])
.then(([teamData, playoffData, seasonStats, timelineData, awardsData]) => {

  Object.values(teamData).forEach(team => {
    TEAMS[team.teamCode] = team;
  });

  PLAYOFFS = playoffData;
  SEASON_STATS = seasonStats;
  TIMELINE_DATA = timelineData;
  REG_SEASON_AWARDS = awardsData; // store awards

  initYearSquares();
  displayYear(selectedYear);
  renderMiniTimeline(selectedYear);

});

/* ====================================
   award slot configuration
==================================== */

const MVP_AWARD_CONFIG = {
  default: {
    season: "MVP",
    defensive: "defensivePlayerOfTheYear",
    sixth: "sixthPlayerOfTheYear",
    rookie: "rookieOfTheYear",
    "most-improved": "mostImprovedPlayer"
  },

  1997: {
    season: "MVP",
    defensive: "defensivePlayerOfTheYear"
  },

  1998: {
    season: "MVP",
    defensive: "defensivePlayerOfTheYear",
    sixth: "newcomerOfTheYear",
    rookie: "rookieOfTheYear"
  },

  1999: {
    season: "MVP",
    defensive: "defensivePlayerOfTheYear",
    sixth: "newcomerOfTheYear",
    rookie: "rookieOfTheYear"
  }
};

initYearNavigation();

/* =========================
   YEAR SQUARE SETUP
========================= */

function initYearSquares() {

  const startYear = 1997;
  const squares = document.querySelectorAll(".season-square");

  squares.forEach((square, index) => {

    const year = startYear + index;

    square.addEventListener("click", () => {
      displayYear(year);
    });

  });
}
/* ==============================================
    getting the teams by year // filtering out seasoninfo section in json
 ============================================== */
function getTeamsForYear(data, year) {
  const season = data[year];

  return Object.entries(season)
    .filter(([key]) => key !== "seasonInfo" && key !== "playoffs")
    .map(([teamCode, teamData]) => ({
      teamCode,
      ...teamData
    }));
}

function fitTextToWidth(textElement, maxWidth) {

  // reset font size first
  textElement.style.fontSize = "";

  let fontSize = parseFloat(
    window.getComputedStyle(textElement).fontSize
  );

  while (textElement.getBBox().width > maxWidth && fontSize > 12) {

    fontSize -= 1;
    textElement.style.fontSize = fontSize + "px";

  }

}

function wrapSVGText(textEl, maxWidth, containerRect, lineHeight = 46) {

  const rawLines = textEl.textContent.split("\n");

  const startX = textEl.getAttribute("x");

  const containerY = parseFloat(containerRect.getAttribute("y"));

  const paddingTop = 45; // spacing inside title box

  const startY = containerY + paddingTop;

  textEl.setAttribute("y", startY);

  textEl.textContent = "";

  let lines = [];

  rawLines.forEach(rawLine => {

    const words = rawLine.split(/\s+/);
    let line = [];

    const tempTspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );

    tempTspan.setAttribute("x", startX);
    textEl.appendChild(tempTspan);

    words.forEach(word => {

      line.push(word);
      tempTspan.textContent = line.join(" ");

      if (tempTspan.getBBox().width > maxWidth) {

      line.pop();

      const text = line.join(" ").trim();
      if (text) lines.push(text);

      line = [word];

      }

    });

    const text = line.join(" ").trim();
    if (text) lines.push(text);

  });

  textEl.textContent = "";

  lines.forEach((lineText, index) => {

    const tspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );

    tspan.setAttribute("x", startX);

    if (index === 0) {
      tspan.setAttribute("dy", 0);
    } else {
      tspan.setAttribute("dy", lineHeight);
    }
    tspan.textContent = lineText;

    if (
      lineText.includes("OF") ||
      lineText.includes("THE") ||
      lineText.includes("YEAR")
    ) {
      tspan.classList.add("oty-label");
    }

    textEl.appendChild(tspan);

  });

}

/* =========================
   separating the teams by conference when injecting the team boxes
========================= */
function splitByConference(teams) {
  const east = teams.filter(t => t.conference === "East");
  const west = teams.filter(t => t.conference === "West");

  return { east, west };
}

/* =========================
   sorting the teams according the season playoff seed type: overall or conference
========================= */
function sortTeams(teams, seedType) {

  return teams.sort((a, b) => {

    // If both made playoffs, sort by playoff seed
    if (a.madePlayoffs && b.madePlayoffs) {

      if (seedType === "Conference") {
        const seedA = parseInt(a.playoffSeed.substring(1));
        const seedB = parseInt(b.playoffSeed.substring(1));
        return seedA - seedB;
      }

      if (seedType === "Overall") {
        return a.playoffSeed - b.playoffSeed;
      }
    }

    // Playoff teams first
    if (a.madePlayoffs) return -1;
    if (b.madePlayoffs) return 1;

    // Then sort non-playoff teams by wins descending
    return b.wins - a.wins;
  });

}

/* =========================
   COLOR UTILITIES
========================= */

function getContrastColor(hex) {

  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0,2),16) / 255;
  const g = parseInt(hex.substring(2,4),16) / 255;
  const b = parseInt(hex.substring(4,6),16) / 255;

  const toLinear = c =>
    c <= 0.03928
      ? c / 12.92
      : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

/* =========================
   DISPLAY YEAR
========================= */
function displayYear(year) {

  selectedYear = year;

  document.getElementById("year-selected-text").textContent = year;

  updateActiveYearSquare(year);

  // always update mini timeline
  renderMiniTimeline(year);

  const seasonNumber = year - 1996;
  document.getElementById("season-num-label").textContent =
    `SEASON ${seasonNumber}`;

  const yearLabel = document.getElementById("mini-tl-year-label");
  if (yearLabel) yearLabel.textContent = year;

  // Always update team layout
  let teams = renderRegularSeasonView(year);

  document.getElementById("number-of-teams-text")
    .textContent = `in ${year} the league had ${teams.length} teams`;

  updateSeasonInfo(year);
  updateYearToggleVisibility();

  renderMVPSection(year);

  const season = SEASON_STATS[String(year)];

  if (playoffMode && season?.playoffs?.bracket) {
    renderBracketView(year);
  } else {
    clearBracketView();
  }
}

/* =========================
   TEAM FILTER LOGIC
========================= */

function teamExistedInYear(team, year) {

  const founded = team.founded;
  const folded = team.foldedYear;
  const relocated = team.relocatedYear;

  // active team
  if (!folded && !relocated) {
    return year >= founded;
  }

  // folded team
  if (folded) {
    return year >= founded && year <= folded;
  }

  // relocated team
  if (relocated) {
    return year >= founded && year <= relocated;
  }

  return false;
}


/* =========================
   year navigation
========================= */

function initYearNavigation() {

  const minYear = 1997;
  const maxYear = 2025;

  const plusContainer = document.getElementById("plus-one-year-icon-container");
  const minusContainer = document.getElementById("minus-one-year-icon-container");

  const plusIcon = document.getElementById("plus-icon");
  const minusIcon = document.getElementById("minus-icon");

  function goForward() {
    if (selectedYear < maxYear) {
      displayYear(selectedYear + 1);
    }
  }

  function goBackward() {
    if (selectedYear > minYear) {
      displayYear(selectedYear - 1);
    }
  }

  plusContainer.addEventListener("click", goForward);
  plusIcon.addEventListener("click", goForward);

  minusContainer.addEventListener("click", goBackward);
  minusIcon.addEventListener("click", goBackward);
}

function updateActiveYearSquare(year) {

  const startYear = 1997;
  const squares = document.querySelectorAll(".season-square");
  const labels = document.querySelectorAll(".season-square-label");

  // remove active from all
  squares.forEach(square => square.classList.remove("active"));
  labels.forEach(label => label.classList.remove("active"));

  // calculate index of active year
  const index = year - startYear;

  if (squares[index]) {
    squares[index].classList.add("active");
  }

  if (labels[index]) {
    labels[index].classList.add("active");
  }
}


function updateSeasonInfo(year) {

  const season = SEASON_STATS[String(year)];
  if (!season?.seasonInfo) return;

  const info = season.seasonInfo;

  const startEl = document.getElementById("teams-timeline-season-start-date");
  const endEl = document.getElementById("teams-timeline-season-end-date");
  const gamesEl = document.getElementById("team-timeline-season-total-games");

  function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  if (startEl) {
    startEl.textContent = formatDate(info.startDate);
  }

  if (endEl) {
    endEl.textContent = formatDate(info.endDate);
  }

  if (gamesEl) {
    gamesEl.textContent = info.regSeasonGames
      ? `and teams played ${info.regSeasonGames} games`
      : "—";
  }
}

function updateYearToggleVisibility() {

  const minYear = 1997;
  const maxYear = 2025;

  const plusContainer =
    document.getElementById("plus-one-year-icon-container");
  const plusIcon = 
    document.getElementById("plus-icon");
  const minusContainer =
    document.getElementById("minus-one-year-icon-container");
  const minusIcon = 
    document.getElementById("minus-icon");

  if (selectedYear === minYear) {
    minusContainer.setAttribute("visibility", "hidden");
    minusIcon.setAttribute("visibility", "hidden");
  } else {
    minusContainer.setAttribute("visibility", "visible");
    minusIcon.setAttribute("visibility", "visible");
  }

  if (selectedYear === maxYear) {
    plusContainer.setAttribute("visibility", "hidden");
    plusIcon.setAttribute("visibility", "hidden");
  } else {
    plusContainer.setAttribute("visibility", "visible");
    plusIcon.setAttribute("visibility", "visible");
  }
}

function toggleMVPAward(prefix, show) {

  const nodes = document.querySelectorAll(`.mvp-${prefix}`);

  nodes.forEach(n => {
    if (show) {
      n.removeAttribute("display");
    } else {
      n.setAttribute("display","none");
    }
  });

}

function setMVPAward(prefix, winner, teamCode) {

  const nameEl =
    document.getElementById(`mvp-${prefix}-name`);

  const teamName =
    document.getElementById(`mvp-${prefix}-teamname`);

  const teamLoc =
    document.getElementById(`mvp-${prefix}-teamloc`);

  if (nameEl) nameEl.textContent = winner.toUpperCase();

  const team = TEAMS[teamCode];

  if (team) {

    if (teamName)
      teamName.textContent = team.teamName.toUpperCase();

    if (teamLoc)
      teamLoc.textContent = team.teamNameCity.toUpperCase();

  }

}

function setMVPTitles(prefix, title, subscript) {

  const titleEl =
    document.getElementById(`mvp-${prefix}-title`);

  const subEl =
    document.getElementById(`mvp-${prefix}-subscript`);

  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subscript;

}

function setSeasonStar(prefix, playerName, teamCode) {

  const firstEl = document.getElementById(`${prefix}-firstname`);
  const lastEl  = document.getElementById(`${prefix}-lastname`);
  const teamEl  = document.getElementById(`${prefix}-teamname`);

  if (!firstEl || !lastEl || !teamEl) return;

  const parts = (playerName || "").trim().split(/\s+/);

  const firstName = parts.slice(0, -1).join(" ");
  const lastName  = parts.slice(-1).join(" ");

  firstEl.textContent = firstName.toUpperCase();
  lastEl.textContent  = lastName.toUpperCase();

  fitTextToWidth(firstEl, 240);
  fitTextToWidth(lastEl, 240);

  const team = TEAMS[teamCode];

  teamEl.textContent = team
    ? `${team.teamNameCity} ${team.teamName}`.toUpperCase()
    : "";

  fitTextToWidth(teamEl, 240);
}


/* =========================================================================================
  creating the team boxes with the team name, playoff seed, and champion star if applicable
============================================================================================ */
function createTeamBoxFromTemplate(
  team,
  teamSeasonData,
  x,
  y,
  year,
  isPlayoffView = false,
  containerId = "teams-container"
) {

  const container = document.getElementById(containerId);

  const template = document.getElementById("team-box-template");

  const clone = template.cloneNode(true);

  clone.removeAttribute("id"); // prevent duplicate IDs

  clone.setAttribute("transform", `translate(${x}, ${y})`);

  // --- Inject Data ---
const teamBoxBorderDetail = clone.querySelector(".team-box");
const locationEl = clone.querySelector(".team-timeline-team-location-text");
const nameEl = clone.querySelector(".team-timeline-team-name-text");
const startYearEl = clone.querySelector(".team-start-year-text");
const endYearEl = clone.querySelector(".team-end-year-text");
const color1El = clone.querySelector(".team-color1-container");
const color2El = clone.querySelector(".team-color2-container");
const color3El = clone.querySelector(".team-color3-container");

if (teamBoxBorderDetail) {
  teamBoxBorderDetail.setAttribute("stroke", "#000000");
  teamBoxBorderDetail.setAttribute('stroke-width', "2");
  teamBoxBorderDetail.setAttribute('fill', "#ffffff");
}

if (locationEl) {
  locationEl.textContent = (team.teamNameCity || "").toUpperCase();
}

if (nameEl) {
  nameEl.textContent = (team.teamName || "").toUpperCase();
}

if (startYearEl) {
  startYearEl.textContent = team.founded || "";
}

if (endYearEl) {
  endYearEl.textContent = team.foldedYear || "—";
}

if (color1El) {
  color1El.setAttribute("fill", team.colors.color1);
}

if (color2El && team.colors.color2) {
  color2El.setAttribute("fill", team.colors.color2);
}

if (color3El && team.colors.color3) {
  color3El.setAttribute("fill", team.colors.color3);
}

  container.appendChild(clone);
}

/* =========================
   RENDER TEAMS
========================= */

function renderRegularSeasonView(year) {

  const container = document.getElementById("teams-container");
  container.innerHTML = "";

  const season = SEASON_STATS[String(year)];
  if (!season) return [];

  const seedType = season.seasonInfo?.playoffSeedType || "Conference";

  // ✅ DEFINE FIRST
  let seasonTeams = getTeamsForYear(SEASON_STATS, year);

  // ---- Continue with split logic below ----

  const { east, west } = splitByConference(seasonTeams);

  const sortedEast = sortTeams(east, seedType);
  const sortedWest = sortTeams(west, seedType);

  const {
    columnsPerConference,
    boxWidth,
    boxHeight,
    gapX,
    gapY,
    conferenceGap
  } = GRID_CONFIG;

  const eastBlockWidth =
    columnsPerConference * boxWidth +
    (columnsPerConference - 1) * gapX;

  const westStartX = eastBlockWidth + conferenceGap;
// ---- RENDER WEST (LEFT COLUMN) ----
sortedWest.forEach((teamSeasonData, index) => {

  const team = TEAMS[teamSeasonData.teamCode];
  if (!team) return;

    const row = index;
    const x = 0;
    const y = row * (boxHeight + gapY);

    createTeamBoxFromTemplate(
      team,
      teamSeasonData,
      x,
      y,
      year,
      false,
      "teams-container"
    );
});

// ---- RENDER EAST (RIGHT COLUMN) ----
sortedEast.forEach((teamSeasonData, index) => {

  const team = TEAMS[teamSeasonData.teamCode];
  if (!team) return;

    const row = index;
    const x = westStartX;
    const y = row * (boxHeight + gapY);

    createTeamBoxFromTemplate(
      team,
      teamSeasonData,
      x,
      y,
      year,
      false,
      "teams-container"
    );
});

  return [...sortedEast, ...sortedWest];
}

function safeNum(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function parseSeed(seed) {
  // supports: 1, "1", "W3", "E2", etc.
  if (seed == null) return 99;
  const m = String(seed).match(/\d+/);
  return m ? parseInt(m[0], 10) : 99;
}

   function seededShuffle(arr, seed) {

      const a = [...arr];

      for (let i = a.length - 1; i > 0; i--) {

        const rand =
          Math.abs(Math.sin(seed * (i + 1) * 9999));

        const j = Math.floor(rand * (i + 1));

        [a[i], a[j]] = [a[j], a[i]];
      }

      return a;
    }

/**
 * Try to resolve champion + runnerUp teamCodes for the year.
 * Priority:
 * 1) season.seasonInfo (if you store it there)
 * 2) season.playoffs (if you store it there)
 * 3) PLAYOFFS[year] (if your other file has it)
 * Fallback: nulls (still works; just uses wins/seed uniqueness)
 */
function getFinalistsForYear(year) {

  const season = SEASON_STATS[String(year)];
  if (!season?.playoffs) return { champion: null, runnerUp: null };

  return {
    champion: season.playoffs.champion?.team || null,
    runnerUp: season.playoffs.runnerUp?.team || null
  };
}

/**
 * Binary treemap: fills the entire rectangle with no gaps.
 * Returns array of {x,y,w,h,item}
 */
function binaryTreemap(items, x, y, w, h, vertical) {

  if (items.length === 1) {
    return [{ x, y, w, h, item: items[0] }];
  }

  const total = items.reduce((s,i)=>s+i.area,0);

  let acc = 0;
  let index = 0;

  for (; index < items.length; index++) {

    if (acc + items[index].area > total/2 && index > 0) break;

    acc += items[index].area;
  }

  const groupA = items.slice(0,index);
  const groupB = items.slice(index);

  const ratio = acc / total;

  if (vertical) {

    const wA = w * ratio;

    return [
      ...binaryTreemap(groupA, x, y, wA, h, !vertical),
      ...binaryTreemap(groupB, x+wA, y, w-wA, h, !vertical)
    ];

  } else {

    const hA = h * ratio;

    return [
      ...binaryTreemap(groupA, x, y, w, hA, !vertical),
      ...binaryTreemap(groupB, x, y+hA, w, h-hA, !vertical)
    ];
  }
}

function getTeamSeasonWeight(teamSeason) {

  const wins = Number(teamSeason.wins || 0);

  // ensure every team has at least a tiny area
  return Math.max(1, wins);
}

function renderMiniTimeline(year) {

  if (!SEASON_STATS[year]) return;

  const gridRect = document.getElementById("season-team-colors-gridder");
  const gridLayer = document.getElementById("season-team-colors-gridder-layer");

  if (!gridRect || !gridLayer) return;

  gridLayer.innerHTML = "";

  const gridX = Number(gridRect.getAttribute("x"));
  const gridY = Number(gridRect.getAttribute("y"));
  const gridW = Number(gridRect.getAttribute("width"));
  const gridH = Number(gridRect.getAttribute("height"));

  const totalArea = gridW * gridH;

  const teams = getTeamsForYear(SEASON_STATS, year);

    const scored = teams.map(teamSeason => {

      const team = TEAMS[teamSeason.teamCode];
      if (!team) return null;

      const weight = getTeamSeasonWeight(teamSeason);

      return {
        team,
        teamSeason,
        weight
      };

    }).filter(Boolean);

    // shuffle teams deterministically
    const finalOrder = seededShuffle(scored, year);

    const totalWeight = finalOrder.reduce((sum,t)=>sum+t.weight,0);

    finalOrder.forEach(team => {
      team.area = (team.weight / totalWeight) * totalArea;
    });

  const splitVerticalFirst = Math.sin(year * 13.37) > 0;

  const rects = binaryTreemap(finalOrder, 0, 0, gridW, gridH, splitVerticalFirst);

  rects.forEach(r => {

    const tile = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );

   // const jitter = Math.sin(year * 0.7 + r.x * 0.3 + r.y * 0.2) * 1.8;

    tile.setAttribute("x", gridX + r.x /*+ jitter*/);
    tile.setAttribute("y", gridY + r.y /*+ jitter*/);
    tile.setAttribute("width", r.w);
    tile.setAttribute("height", r.h);
    tile.setAttribute("fill", r.item.team.colors.color1);
    tile.setAttribute("stroke", "#000");
    tile.setAttribute("stroke-width", "2");

    gridLayer.appendChild(tile);
  });
}

function renderBracketView(year) {

  const container = document.getElementById("playoff-bracket-container");

  const season = SEASON_STATS[String(year)];
  if (!season?.playoffs?.bracket?.rounds) return [];

  const rounds = season.playoffs.bracket.rounds;

  const {
    boxWidth,
    boxHeight
  } = GRID_CONFIG;

  const matchupSpacingX = 380;
  const teamGap = 10;

  rounds.forEach((round, roundIndex) => {

    // Find or create round row
    let roundGroup = document.getElementById(`round-${roundIndex}`);

    if (!roundGroup) {
      roundGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      roundGroup.setAttribute("id", `round-${roundIndex}`);
      roundGroup.setAttribute(
        "transform",
        `translate(0, ${roundIndex * 250})`
      );

      container.appendChild(roundGroup);
    }

    roundGroup.innerHTML = "";

    // --- Round label ---
    const header = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

    header.setAttribute("x", 0);
    header.setAttribute("y", -40);
    header.setAttribute("font-family", "Chivo Mono");
    header.setAttribute("font-size", "18");
    header.setAttribute("font-weight", "700");

    header.textContent = round.name.toUpperCase();

    roundGroup.appendChild(header);

    const totalMatchups = round.matchups.length;

    const rowWidth = totalMatchups * matchupSpacingX;

    // --- Render matchups ---
    round.matchups.forEach((matchup, matchupIndex) => {

      const teamA = TEAMS[matchup.teamA.code];
      const teamB = TEAMS[matchup.teamB.code];

      if (!teamA || !teamB) return;

      const x = matchupIndex * matchupSpacingX;

      const teamAData = {
        teamCode: matchup.teamA.code,
        playoffSeed: matchup.teamA.seed
      };

      const teamBData = {
        teamCode: matchup.teamB.code,
        playoffSeed: matchup.teamB.seed
      };

      // TEAM A (top)
      createTeamBoxFromTemplate(
        teamA,
        teamAData,
        x,
        0,
        year,
        true,
        `round-${roundIndex}`
      );

      // TEAM B (bottom)
      createTeamBoxFromTemplate(
        teamB,
        teamBData,
        x,
        boxHeight + teamGap,
        year,
        true,
        `round-${roundIndex}`
      );

    });

  });

  return [];
}

function clearBracketView() {
  const container = document.getElementById("playoff-bracket-container");
  if (container) container.innerHTML = "";
}

function toggleSeasonStar(prefix, show){

  const nodes = document.querySelectorAll(`.${prefix}`);

  nodes.forEach(node => {

    if(show){
      node.classList.remove("svg-hidden");
    }else{
      node.classList.add("svg-hidden");
    }

  });

}

function getCardPosition(prefix) {

  if (prefix === "rebounder") {
    return { x: 7.7306519, y: 13.505333 };
  }

  if (prefix === "scorer") {
    return { x: 177.429, y: 13.505333 };
  }

  if (prefix === "distributor") {
    return { x: 339.15235, y: 13.505333 };
  }

  return { x: 0, y: 0 };
}

function renderTemplatePeakCard(
  prefix,
  title,
  playerName,
  teamCode
) {

  const svg =
    document.getElementById("reg-season-peak-performers-svg");

  const template =
    document.getElementById("template-replacement-pp-card");

  if (!svg || !template) return;

  const pos = getCardPosition(prefix);

  const clone = template.cloneNode(true);

  clone.removeAttribute("id");

  clone.classList.add("pp-template-instance");

  clone.setAttribute(
    "transform",
    `translate(${pos.x}, ${pos.y})`
  );

  const parts = (playerName || "").split(" ");

  const first =
    parts.slice(0,-1).join(" ");

  const last =
    parts.slice(-1).join(" ");

  clone.querySelector(".pp-firstname").textContent =
    first.toUpperCase();

  clone.querySelector(".pp-lastname").textContent =
    last.toUpperCase();

  const team = TEAMS[teamCode];

  if(team){
    clone.querySelector(".pp-teamname").textContent =
      `${team.teamNameCity} ${team.teamName}`.toUpperCase();
  }

  clone.querySelector(".pp-category-title").textContent = title;

  svg.appendChild(clone);
}

function renderSeasonStars(year) {

  const awards = REG_SEASON_AWARDS[String(year)] || [];

  document
    .querySelectorAll(".pp-template-instance")
    .forEach(el => el.remove());

  toggleSeasonStar("scorer", false);
  toggleSeasonStar("rebounder", false);
  toggleSeasonStar("distributor", false);

  /* =========================
     1997
     center only
  ========================= */

    if (year === 1997) {

      toggleSeasonStar("scorer", false);
      toggleSeasonStar("rebounder", false);
      toggleSeasonStar("distributor", false);

      const east =
        awards.find(a => a.id === "shootingChampionsEast");

      const west =
        awards.find(a => a.id === "shootingChampionsWest");

      const star = east || west;

      if (star) {

      renderTemplatePeakCard(
        "scorer",
        "SHOOTING CHAMPION",
        star.winner,
        star.teamCode
      );

      }

      return;
    }

  /* =========================
    1998–2001
    FG% + FT%
    center + left cards
  ========================= */

if (year >= 1998 && year <= 2001) {

  toggleSeasonStar("scorer", false);
  toggleSeasonStar("rebounder", false);
  toggleSeasonStar("distributor", false);

  const fg =
    awards.find(a =>
      a.id === "shootingChampionsFieldGoalPercentage"
    );

  const ft =
    awards.find(a =>
      a.id === "shootingChampionsFreeThrowPercentage"
    );

  const topScorer =
    awards.find(a =>
      a.id === "topScorer"
    );

  if (fg) {

    renderTemplatePeakCard(
      "rebounder",
      "FIELD GOAL %",
      fg.winner,
      fg.teamCode
    );

  }

  if (ft) {

    renderTemplatePeakCard(
      "scorer",
      "FREE THROW %",
      ft.winner,
      ft.teamCode
    );

  }

  if (topScorer) {

    renderTemplatePeakCard(
      "distributor",
      "TOP SCORER",
      topScorer.winner,
      topScorer.teamCode
    );

  }

  return;
}

  /* =========================
    2002–2004
    center scorer + rebounder
  ========================= */

  if (year >= 2002 && year <= 2004) {

    const scorer = awards.find(a =>
      a.id === "peakPerformerScoring"
    );

    const rebounder = awards.find(a =>
      a.id === "peakPerformerRebounding"
    );

    toggleSeasonStar("scorer", true);
    toggleSeasonStar("rebounder", true);
    toggleSeasonStar("distributor", false);

    document.getElementById("scorer-card-title").textContent = "SCORER";
    document.getElementById("rebounder-card-title").textContent = "REBOUNDER";

    if (scorer)
      setSeasonStar("scorer", scorer.winner, scorer.teamCode);

    if (rebounder)
      setSeasonStar("rebounder", rebounder.winner, rebounder.teamCode);

    return;
  }

  /* =========================
     2005+
     full structure
  ========================= */

  const scorer = awards.find(a =>
    ["topScorer", "peakPerformerScoring"].includes(a.id)
  );

  const rebounder = awards.find(a =>
    a.id === "peakPerformerRebounding"
  );

  const distributor = awards.find(a =>
    a.id === "peakPerformerDishAndAssist"
  );

  toggleSeasonStar("scorer", true);
  toggleSeasonStar("rebounder", true);
  toggleSeasonStar("distributor", true);

  // titles
  document.getElementById("scorer-card-title").textContent = "SCORER";
  document.getElementById("rebounder-card-title").textContent = "REBOUNDER";
  document.getElementById("distributor-card-title").textContent = "DISTRIBUTOR";

  if (scorer) setSeasonStar("scorer", scorer.winner, scorer.teamCode);
  if (rebounder) setSeasonStar("rebounder", rebounder.winner, rebounder.teamCode);
  if (distributor) setSeasonStar("distributor", distributor.winner, distributor.teamCode);

}

function renderMVPSection(year) {

  const awards =
    REG_SEASON_AWARDS[String(year)] || [];

  const config =
    MVP_AWARD_CONFIG[year] || MVP_AWARD_CONFIG.default;

  // hide everything first
  ["season","defensive","sixth","rookie","mostImproved"]
    .forEach(p => toggleMVPAward(p,false));

  /* reset titles */
  setMVPTitles("sixth","SIXTH","PLAYER OF THE YEAR");
  setMVPTitles("rookie","ROOKIE","OF THE YEAR");
  setMVPTitles("defensive","DEFENSIVE","PLAYER OF THE YEAR");
  setMVPTitles("mostImproved","MOST IMPROVED","PLAYER OF THE YEAR");

  const sixthTitle = document.getElementById("mvp-sixth-title");
  const sixthSub = document.getElementById("mvp-sixth-subscript");

  if (sixthTitle) sixthTitle.setAttribute("x", 68.863701);
  if (sixthSub) sixthSub.setAttribute("x", 206.29619);

  const slots = [
    "season",
    "defensive",
    "sixth",
    "rookie",
    "most-improved"
  ];

  slots.forEach(prefix => {

    const awardId = config[prefix];

    if (!awardId) {
      toggleMVPAward(prefix,false);
      return;
    }

    const award =
      awards.find(a => a.id === awardId);

    if (!award) {
      toggleMVPAward(prefix,false);
      return;
    }

    toggleMVPAward(prefix,true);

    setMVPAward(
      prefix,
      award.winner,
      award.teamCode
    );

    /* newcomer override */

    if (
      prefix === "sixth" &&
      awardId === "newcomerOfTheYear"
    ) {

      setMVPTitles(
        "sixth",
        "NEWCOMER",
        "OF THE YEAR"
      );

      if (sixthTitle) sixthTitle.setAttribute("x",110);
      if (sixthSub) sixthSub.setAttribute("x",260);

    }

  });

}