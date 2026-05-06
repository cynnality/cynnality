let TEAMS = {};
let FRANCHISE_MAP = {};

let SEASON_TEAMS = {};
let SEASON_STATS = {};

function buildFranchiseMap() {
  Object.values(TEAMS).forEach(team => {
    const franchiseId = team.franchiseId || team.teamCode;

    // map current team
    FRANCHISE_MAP[team.teamCode] = franchiseId;

    // map lineage teams
    if (team.lineage) {
      team.lineage.forEach(entry => {
        FRANCHISE_MAP[entry.teamCode] = franchiseId;
      });
    }

    // map formerTeam if exists
    if (team.formerTeam) {
      FRANCHISE_MAP[team.formerTeam] = franchiseId;
    }
  });

  console.log("FRANCHISE_MAP:", FRANCHISE_MAP);
}

async function loadData() {
  const res = await fetch('/wbbal-main/wnba-cluster-data.json');
  const data = await res.json();

  Object.values(data).forEach(team => {
    TEAMS[team.teamCode] = team;
  });

  console.log("Mapped TEAMS:", TEAMS);
}

// loading the teams for each season json data - wnbbal-main folder -> wnba-team-timeline.json
async function loadSeasonTeams() {
  const res = await fetch('/wbbal-main/wnba-team-timeline.json'); 
  const data = await res.json();

  SEASON_TEAMS = data;

  console.log("SEASON_TEAMS:", SEASON_TEAMS);
}

// loading the stats for each season json data - wnbbal-main folder -> wnba-season-stats.json
async function loadSeasonStats() {
  const res = await fetch('/wbbal-main/wnba-season-stats.json');
  const data = await res.json();

  SEASON_STATS = data;

  console.log("SEASON_STATS:", SEASON_STATS);
}

function getTeamCode(el) {
  return [...el.classList].find(c =>
    c !== 'season-square' &&
    !c.startsWith('y_') &&
    c !== 'year-indicator'
  );
}

function getBarTeamCode(el) {
  return [...el.classList].find(c => c !== 'team-bar');
}

function applyTeamColors() {
  document.querySelectorAll('.season-square').forEach(el => {
    const teamCode = getTeamCode(el);
    if (!teamCode) return;

    const team = TEAMS[teamCode];
    if (!team) return;

    el.style.fill = team.colors.color1;
  });

  document.querySelectorAll('.team-bar').forEach(el => {
    const teamCode = getBarTeamCode(el);
    if (!teamCode) return;

    const team = TEAMS[teamCode];
    if (!team) return;

    el.style.fill = team.colors.color1;
  });
}

function extendYearBorder(year) {

  // resetting all borders 
  document.querySelectorAll('.y_border').forEach(el => {
    el.setAttribute("height", el.dataset.originalHeight);
  });

  // target selected year
  const border = document.querySelector(`.y_border.y_${year}`);
  if (!border) return;

  const baseHeight = parseFloat(border.dataset.originalHeight);
  const extra = 240; 

  border.setAttribute("height", baseHeight + extra);
}

function showFranchiseBars(teamCode) {
  const franchiseId = FRANCHISE_MAP[teamCode];
  if (!franchiseId) return;

  //  hide all bars + labels first
  document.querySelectorAll('.team-bar').forEach(el => {
    el.classList.remove('visible');
  });

  document.querySelectorAll('.team-name-label').forEach(el => {
    el.classList.remove('visible');
  });

  //  show matching franchise bars + labels
  document.querySelectorAll('.team-bar').forEach(el => {
    const code = getBarTeamCode(el);
    if (!code) return;

    if (FRANCHISE_MAP[code] === franchiseId) {
      el.classList.add('visible');

      //  also show matching label
      const label = document.querySelector(`.team-name-label.${code}`);
      if (label) {
        label.classList.add('visible');
      }
    }
  });
}

function initSquareClicks() {
  document.querySelectorAll('.season-square').forEach(el => {
    el.addEventListener('click', () => {

      resetView(); 

      const teamCode = getTeamCode(el);
      if (!teamCode) return;

      showFranchiseBars(teamCode);

      const year = [...el.classList].find(c => c.startsWith('y_'));

      console.log({
        teamCode,
        year,
        teamData: TEAMS[teamCode]
      });
    });
  });
}

function initYearClicks() {
  document.querySelectorAll('.year-indicator.season-square').forEach(el => {
    el.addEventListener('click', (e) => {

      e.stopPropagation();

      const yearClass = [...el.classList].find(c => c.startsWith('y_'));
      if (!yearClass) return;

      const year = yearClass.replace('y_', '');

      resetView(); // resetting to "refresh" instead of adding onto whena new yr indicator box is lcickied
      showYearView(year);
      extendYearBorder(year);

      console.log("YEAR CLICK:", year);

    });
  });
}

function showYearView(year) {
  const season = SEASON_TEAMS[year];
  if (!season) return;

  const teams = season.teams;

  // hiding everything first
  document.querySelectorAll('.team-bar').forEach(el => {
    el.classList.remove('visible');
  });

  document.querySelectorAll('.team-name-label').forEach(el => {
    el.classList.remove('visible');
  });

  document.querySelectorAll('.season-square').forEach(el => {
    el.style.opacity = 0.15;
  });

  // showing only teams from JSON
  teams.forEach(teamObj => {
    const teamCode = teamObj.teamCode;

    const stats = SEASON_STATS?.[year]?.[teamCode];
      if (!stats) return;

    // showing bars
    document.querySelectorAll(`.team-bar.${teamCode}`).forEach(el => {
      el.classList.add('visible');
    });

    // showing labels
    const label = document.querySelector(`.team-name-label.${teamCode}`);
    if (label) {
      label.classList.add('visible');
    }

    // highlighting squares
    document.querySelectorAll(`.season-square.${teamCode}.y_${year}`).forEach(el => {
      el.style.opacity = 1;
    });
  });
}

function resetView() {
  // only team squares
  document.querySelectorAll('.season-square:not(.year-indicator)').forEach(el => {
    el.style.opacity = 1;
  });

  document.querySelectorAll('.team-bar').forEach(el => {
    el.classList.remove('visible');
  });

  document.querySelectorAll('.team-name-label').forEach(el => {
    el.classList.remove('visible');
  });

  document.querySelectorAll('.y_border').forEach(el => {
    el.setAttribute("height", el.dataset.originalHeight);
  });
}

async function init() {
  const squares = document.querySelectorAll('.season-square');
  console.log("Squares:", squares.length);

  document.querySelectorAll('.y_border').forEach(el => {
    el.dataset.originalHeight = el.getAttribute("height");
  });

  await loadData();
  await loadSeasonTeams();
  await loadSeasonStats();
  buildFranchiseMap();
  applyTeamColors();

  initSquareClicks();   // franchise logic)
  initYearClicks();     // (year logic)

  console.log("INIT COMPLETE");
}

document.addEventListener('DOMContentLoaded', init);