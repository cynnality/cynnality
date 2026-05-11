let PLAYERS = {};
let COLLEGES = {};
let ROSTERS = {};

let TEAMS = {};
let WNBA_TEAMS_BY_JERSEY = {};

let ROSTER_IMAGE_POSITIONS = {};

const OLYMPICS = {
  1996: "Atlanta Summer Games",
  2000: "Sydney Summer Games",
  2004: "Athens Summer Games",
  2008: "Beijing Summer Games",
  2012: "London Summer Games",
  2016: "Rio Summer Games",
  2020: "Tokyo Summer Games",
  2024: "Paris Summer Games"
};

async function init() {
  const [
    playersRes,
    collegesRes,
    rostersRes,
    teamsRes,
    wnbaMapRes,
    positionRes
  ] = await Promise.all([
    fetch("/w_players_data.json"),
    fetch("/w_colleges_data.json"),
    fetch("/w_bb_olympics/team_usa_olympic_rosters.json"),
    fetch("/wbbal-main/wnba-cluster-data.json"),
    fetch("/w_bb_olympics/wnba_olympic_team_map.json"),
    fetch("/w_bb_olympics_imgs/roster_image_positions.json")
  ]);

  const playersData = await playersRes.json();
  const collegesData = await collegesRes.json();
  const rostersData = await rostersRes.json();
  const teamsData = await teamsRes.json();
  const wnbaMapData = await wnbaMapRes.json();
  const positionsData = await positionRes.json();
  ROSTER_IMAGE_POSITIONS = positionsData;
  PLAYERS = playersData.players;
  COLLEGES = collegesData.colleges;
  ROSTERS = rostersData;

  // normalize teams by teamCode
  TEAMS = normalizeTeams(teamsData);

// jersey → team mapping
WNBA_TEAMS_BY_JERSEY = wnbaMapData;

// static 2024 page image, if present
initStaticParisRosterImage();

// dynamic roster page, if present
if (
  document.getElementById("roster") &&
  document.getElementById("title") &&
  document.getElementById("roster-img-container")
) {
  displayRoster(1996);
}
}

init();

function initStaticParisRosterImage() {
  const img = document.getElementById("roster-img-paris");
  const wrapper = document.getElementById("paris-roster-wrapper");

  if (!img || !wrapper) return;

  wrapper.querySelectorAll(".image-map").forEach(map => map.remove());

  function buildMap() {
    createSVGMap(2024, wrapper);

    document.dispatchEvent(new CustomEvent("parisRosterMapReady"));
  }

  if (img.complete) {
    buildMap();
  } else {
    img.onload = buildMap;
  }
}

function normalizeTeams(data) {
  const normalized = {};

  Object.values(data).forEach(team => {
    normalized[team.teamCode] = team;
  });

  return normalized;
}

function getWNBATeamForJersey(year, jersey) {
  const yearData = WNBA_TEAMS_BY_JERSEY[String(year)];
  if (!yearData) return null;

  return yearData[`wTeam${jersey}Id`] || null;
}



function displayRoster(year) {
  const container = document.getElementById("roster");
  const title = document.getElementById("title");

  container.innerHTML = "";
  title.textContent = `Team USA ${year}`;

  const roster = ROSTERS[String(year)];

  if (!roster) {
    container.textContent = "No data";
    return;
  }

  const keys = Object.keys(roster).sort((a, b) => {
    return parseInt(a.replace("player", "")) - parseInt(b.replace("player", ""));
  });

  keys.forEach(key => {
    const playerId = roster[key];
    const player = PLAYERS[playerId];

    if (!player) return;

    const jersey = parseInt(key.replace("player", ""));

    const college = COLLEGES[player.collegeId];

    const teamCode = getWNBATeamForJersey(year, jersey);
    const team = teamCode ? TEAMS[teamCode] : null;

    const teamName = team
      ? `${team.teamNameCity} ${team.teamName}`
      : "n/a";

    const row = document.createElement("div");
    row.classList.add("roster-row");
    row.dataset.playerId = playerId;

    const jerseyEl = document.createElement("div");
    jerseyEl.classList.add("col", "jersey");
    jerseyEl.textContent = `#${jersey}`;

    const nameEl = document.createElement("div");
    nameEl.classList.add("col", "player");
    nameEl.textContent = player.playerName;

    const collegeEl = document.createElement("div");
    collegeEl.classList.add("col", "college");
    collegeEl.textContent = college?.name || "Unknown College";

    const teamEl = document.createElement("div");
    teamEl.classList.add("col", "team");
    teamEl.textContent = teamName;

    row.appendChild(jerseyEl);
    row.appendChild(nameEl);
    row.appendChild(collegeEl);
    row.appendChild(teamEl);

row.addEventListener("click", () => {
  highlightRow(playerId);
  highlightRect(playerId);
});

    container.appendChild(row);
  });

  const imgContainer = document.getElementById("roster-img-container");

  // clear previous image
  imgContainer.innerHTML = "";

  // create image
  const img = document.createElement("img");

  // path based on year
  img.src = `/w_bb_olympics_imgs/${year}.png`;

  const wrapper = document.createElement("div");
  wrapper.classList.add("image-wrapper");
  

  wrapper.appendChild(img);
  imgContainer.appendChild(wrapper);

  img.onload = () => {
    createSVGMap(year, wrapper);
  };

  img.alt = `Team USA ${year} roster image`;

  // optional styling
  img.style.width = "100%";
  img.style.maxWidth = "800px";
  img.style.marginTop = "20px";



}

const BASE_OFFSET = 70;
const EXPANDED_HEIGHT = 70;

function layoutButtons(buttons) {
  let currentY = 0;

  buttons.forEach((btn, index) => {
    const x = index * 40;

    btn.style.left = x + "px";
    btn.style.top = currentY + "px";

    if (btn.classList.contains("active")) {
      currentY += EXPANDED_HEIGHT + 20;
    } else {
      currentY += BASE_OFFSET;
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {

  const buttons = document.querySelectorAll(".year-btn");

  // 🔥 inject Olympic text
  buttons.forEach(btn => {
    const year = btn.dataset.year;

    if (year && OLYMPICS[year]) {
      btn.innerHTML = `
        <div class="btn-content">
          <p class="btn-title">${year}</p>
          <p class="btn-sub">${OLYMPICS[year]}</p>
        </div>
      `;
    }
  });

  // 🔥 click behavior
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {

      const year = btn.dataset.year;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (year) {
        displayRoster(year);
      }

      // layoutButtons(buttons);
    });
  });

  // WHAT BUTTON IS ACTIVE FIRST / WHICH ROSTER IS SHOWING 
  const firstBtn = document.querySelector('[data-year="1996"]');
  if (firstBtn) firstBtn.classList.add("active");

  // layoutButtons(buttons);

});


function createSVGMap(year, wrapper) {
  const data = ROSTER_IMAGE_POSITIONS[String(year)];
  if (!data) return;

  const { width, height, positions } = data;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.classList.add("image-map");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  positions.forEach(pos => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.setAttribute("x", pos.x);
    rect.setAttribute("y", pos.y);
    rect.setAttribute("width", pos.width);
    rect.setAttribute("height", pos.height);

    rect.dataset.playerId = pos.playerId;

    rect.addEventListener("mouseenter", () => {
      highlightRow(pos.playerId);
      rect.classList.add("active");
    });

    rect.addEventListener("mouseleave", () => {
      clearHighlights();
    });

    rect.addEventListener("click", () => {
      highlightRow(pos.playerId);
      highlightRect(pos.playerId);
    });

    svg.appendChild(rect);
  });

  wrapper.appendChild(svg);
}
function highlightRow(playerId) {
  document.querySelectorAll(".roster-row").forEach(row => {
    row.classList.toggle("active", row.dataset.playerId === playerId);
  });
}

function highlightRect(playerId) {
  document.querySelectorAll(".image-map rect").forEach(rect => {
    rect.classList.toggle("active", rect.dataset.playerId === playerId);
  });
}

function clearHighlights() {
  document.querySelectorAll(".roster-row").forEach(r => r.classList.remove("active"));
  document.querySelectorAll(".image-map rect").forEach(r => r.classList.remove("active"));
}