/* =========================
   PRO LEAGUE — WNBA TEAMS
========================= */

const WNBA_TEAMS_JSON = "./pro-wnba-teams.json";

/* SVG containers */
const teamsListGroup = document.getElementById("teams-content-list");

/* Layout (matches your SVG geometry) */
const ROW_X = 880;
const ROW_START_Y = 380;
const ROW_WIDTH = 650;
const ROW_HEIGHT = 75;
const ROW_GAP = 12;

let scrollOffset = 0;
const SCROLL_STEP = 40;
let maxScroll = 0;

/* =========================
   LOAD + NORMALIZE
========================= */

async function loadWNBATeams() {
  const res = await fetch(WNBA_TEAMS_JSON);
  const data = await res.json();

  return Object.entries(data).map(([label, team]) => ({
    label,
    ...team
  }));
}

/* =========================
   RENDER HELPERS
========================= */

function clearTeamsList() {
  while (teamsListGroup.firstChild) {
    teamsListGroup.removeChild(teamsListGroup.firstChild);
  }
}

function createSVG(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/* =========================
   TEAM ROW
========================= */

function renderTeamRow(team, index) {
  const y = ROW_START_Y + index * (ROW_HEIGHT + ROW_GAP);

  const group = createSVG("g");

  /* --- Background row --- */
  const rect = createSVG("rect");
  rect.setAttribute("x", ROW_X);
  rect.setAttribute("y", y);
  rect.setAttribute("width", ROW_WIDTH);
  rect.setAttribute("height", ROW_HEIGHT);
  rect.classList.add("pro-teams-individual-items");

  rect.setAttribute("stroke", team.colors?.color1 || "#000");
  rect.setAttribute("fill", "#fff");

  /* --- Accent bar --- */
  const accent = createSVG("rect");
  accent.setAttribute("x", ROW_X + ROW_WIDTH - 10);
  accent.setAttribute("y", y);
  accent.setAttribute("width", 10);
  accent.setAttribute("height", ROW_HEIGHT);
  accent.setAttribute("fill", team.colors?.color1 || "#000");

  /* --- Single-line text container --- */
  const text = createSVG("text");
  text.setAttribute("x", ROW_X + 18);
  text.setAttribute("y", y + 48);
  text.classList.add("pro-team-row-text");

  /* CITY */
  const city = createSVG("tspan");
  city.textContent = team.teamNameCity.toUpperCase();
  city.classList.add("team-city");

  /* TEAM NAME */
  const name = createSVG("tspan");
  name.setAttribute("dx", 10);
  name.textContent = team.teamName.toUpperCase();
  name.classList.add("team-name");

  /* STATUS */
  const status = createSVG("tspan");
  status.setAttribute("dx", 20);
  status.textContent = team.isActive ? "ACTIVE" : "DEFUNCT";
  status.classList.add(
    team.isActive ? "team-status-active" : "team-status-defunct"
  );

  /* FOUNDED YEAR */
  const founded = createSVG("tspan");
  founded.setAttribute("dx", 20);
  founded.textContent = `FOUNDED ${team.founded}`;
  founded.classList.add("team-founded");

  text.append(city, name, status, founded);

  rect.addEventListener("click", () => {
    console.log("Selected team:", team.teamCode);
  });

  group.append(rect, accent, text);
  teamsListGroup.appendChild(group);
}

/* =========================
   MAIN RENDER
========================= */

async function renderProTeams() {
  if (!teamsListGroup) return;

  const teams = await loadWNBATeams();

  clearTeamsList();

    teams.forEach(renderTeamRow);

    /* calculate max scroll */
    const totalHeight =
    teams.length * (ROW_HEIGHT + ROW_GAP);

    const viewHeight = 650;
    maxScroll = Math.max(0, totalHeight - viewHeight);

    /* reset scroll */
    scrollOffset = 0;
    teamsListGroup.setAttribute(
    "transform",
    `translate(0, ${-scrollOffset})`
    );
}

teamsListGroup.addEventListener("wheel", e => {
  e.preventDefault();

  scrollOffset += e.deltaY > 0 ? SCROLL_STEP : -SCROLL_STEP;
  scrollOffset = Math.max(0, Math.min(scrollOffset, maxScroll));

  teamsListGroup.setAttribute(
    "transform",
    `translate(0, ${-scrollOffset})`
  );
}, { passive: false });

/* =========================
   INIT
========================= */

renderProTeams();
