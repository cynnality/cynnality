/* ================================
   GLOBAL STATE
================================ */

let TEAMS = {};
let SEASON_STATS = {};
let REG_SEASON_AWARDS = {};

let selectedYear = 1997;

/* ================================
   AWARD HELPERS
================================ */

function getAward(year, awardId){

  const awards = REG_SEASON_AWARDS[String(year)];

  if(!awards) return null;

  return awards.find(a => a.id === awardId) || null;

}

function getAwardTeamName(award){

  if(!award) return "";

  const team = TEAMS[award.teamCode];

  if(!team) return "";

  return `${team.teamNameCity} ${team.teamName}`;

}

function injectAward(prefix,index,awardId){

  const award = getAward(selectedYear,awardId);

  if(!award) return;

  const team = TEAMS[award.teamCode];

  const winnerEl =
    document.getElementById(`${prefix}-${index}-winner`);

  const teamEl =
    document.getElementById(`${prefix}-${index}-team`);

  if(winnerEl)
    winnerEl.textContent = award.winner;

  if(teamEl && team)
    teamEl.textContent =
      ` ${team.teamName}`;

}

/* ================================
   AWARD RENDERING
================================ */

function populateAwardSection(list,prefix,maxSlots){

  for(let i=1;i<=maxSlots;i++){

    const award = list[i-1];

    const titleEl =
      document.getElementById(`${prefix}-${i}-title`);

    const winnerEl =
      document.getElementById(`${prefix}-${i}-winner`);

    const teamEl =
      document.getElementById(`${prefix}-${i}-team`);

    const container =
      document.getElementById(`${prefix}-${i}-container`);

    if(!titleEl || !winnerEl || !teamEl) continue;

    /* ---- NO AWARD THIS YEAR ---- */

    if(!award){

      if(container) container.style.opacity = 0.25;

      titleEl.textContent = "";
      winnerEl.textContent = "";
      teamEl.textContent = "";

      continue;

    }

    const team = TEAMS[award.teamCode];

    titleEl.textContent = award.award;
    winnerEl.textContent = award.winner;

    if(team){
      teamEl.textContent = team.teamName;
    }

    if(container) container.style.opacity = 1;

  }

}


/* =============================
LOAD DATA
============================= */

Promise.all([
  fetch("wnba-cluster-data.json").then(r => r.json()),
  fetch("wnba-season-stats.json").then(r => r.json()),
  fetch("wnba-reg-season-awards.json").then(r => r.json())
])
.then(([teamData, seasonStats, awards]) => {

  /* convert team data into teamCode lookup */
  Object.values(teamData).forEach(team => {
    TEAMS[team.teamCode] = team;
  });

  SEASON_STATS = seasonStats;
  REG_SEASON_AWARDS = awards;

  init();

});



/* ================================
   initializing the page
================================ */
function init(){

  initYearNavigation();
  initYearSquares();

  displayYear(selectedYear);

}

function getTeamDisplayName(teamCode){

  const team = TEAMS[teamCode];

  if(!team) return teamCode;

  return `${team.teamNameCity} ${team.teamName}`;

}

/* ================================
   TIMELINE CLICK EVENTS
================================ */

function initYearSquares(){

  const startYear = 1997;

  const squares =
    document.querySelectorAll(".season-square");

  squares.forEach((square, index)=>{

    const year = startYear + index;

    square.addEventListener("click",()=>{
      displayYear(year);
    });

  });

}


/* ================================
   YEAR NAVIGATION
================================ */

function initYearNavigation(){

  const minYear = 1997;
  const maxYear = 2025;

  const plus =
    document.getElementById("plus-one-year-icon-container");

  const minus =
    document.getElementById("minus-one-year-icon-container");

  plus.addEventListener("click",()=>{
    if(selectedYear < maxYear){
      displayYear(selectedYear + 1);
    }
  });

  minus.addEventListener("click",()=>{
    if(selectedYear > minYear){
      displayYear(selectedYear - 1);
    }
  });

}


/* ================================
   DISPLAY YEAR
================================ */

function displayYear(year){

  selectedYear = year;

  document.getElementById("year-selected-text")
    .textContent = year;

  updateActiveYearSquare(year);

  renderMiniTimeline(year);

  updateSeasonIntro(year);

  updateYearToggleVisibility();

}


/* ================================
   ACTIVE YEAR HIGHLIGHT
================================ */

function updateActiveYearSquare(year){

  const startYear = 1997;

  const squares =
    document.querySelectorAll(".season-square");

  const labels =
    document.querySelectorAll(".season-square-label");

  squares.forEach(s=>s.classList.remove("active"));
  labels.forEach(l=>l.classList.remove("active"));

  const index = year - startYear;

  if(squares[index]) squares[index].classList.add("active");
  if(labels[index]) labels[index].classList.add("active");

}


/* ================================
   MINI TIMELINE
================================ */

function renderMiniTimeline(year){

  const season = SEASON_STATS[String(year)];

  if(!season) return;

  const seasonNum =
    document.getElementById("season-num-label");

  seasonNum.textContent =
    `SEASON ${year-1996}`;

}

/* ================================
   INTRO PANEL
================================ */

function updateSeasonIntro(year){

  const season =
    SEASON_STATS[String(year)];

  if(!season) return;

  const seasonInfo = season.seasonInfo;

  const teams =
    Object.keys(season)
      .filter(k=>k!=="seasonInfo" && k!=="playoffs");

    /* ---- SEASON DATES ---- */

    const startDate =
      new Date(seasonInfo.startDate);

    const endDate =
      new Date(seasonInfo.endDate);

    const startEl =
      document.getElementById("teams-timeline-season-start-date");

    const endEl =
      document.getElementById("teams-timeline-season-end-date");

    if(startEl)
      startEl.textContent =
        startDate.toLocaleDateString("en-US",{month:"short",day:"numeric"});

    if(endEl)
      endEl.textContent =
        endDate.toLocaleDateString("en-US",{month:"short",day:"numeric"});


  /* ---- SEASON NUMBERS ---- */

  document.getElementById("season-teams-num")
    .textContent = `${teams.length}`;

  document.getElementById("season-games-num")
    .textContent =
      `${seasonInfo.regSeasonGames}`;

/* ---- CONFERENCE WIN LEADERS ---- */

let eastLeader = null;
let westLeader = null;

teams.forEach(teamCode => {

  const teamStats = season[teamCode];

  if(!teamStats) return;

  const conf = teamStats.conference;
  const wins = teamStats.wins;

  if(conf === "East"){

    if(!eastLeader || wins > eastLeader.wins){
      eastLeader = {teamCode, wins, losses: teamStats.losses};
    }

  }

  if(conf === "West"){

    if(!westLeader || wins > westLeader.wins){
      westLeader = {teamCode, wins, losses: teamStats.losses};
    }

  }

});


  /* ---- INJECT EAST LEADER ---- */

  if(eastLeader){

    const team = TEAMS[eastLeader.teamCode];

    document.getElementById("east-conference-most-game-wins")
      .querySelector("tspan")
      .textContent = `${team.teamName}`;

    document.getElementById("east-conference-most-game-wins-win-num")
      .textContent = `${eastLeader.wins} WINS`;

    document.getElementById("east-conference-most-game-wins-loss-num")
      .textContent = `${eastLeader.losses} LOSSES`;

  }

  /* ---- INJECT WEST LEADER ---- */

  if(westLeader){

    const team = TEAMS[westLeader.teamCode];

    document.getElementById("west-conference-most-game-wins")
      .querySelector("tspan")
      .textContent = `${team.teamName}`;

    document.getElementById("west-conference-most-game-wins-win-num")
      .textContent = `${westLeader.wins} WINS`;

    document.getElementById("west-conference-most-game-wins-loss-num")
      .textContent = `${westLeader.losses} LOSSES`;

  }

  /* ---- TOP DRAFT PICK ---- */

  const draft = getAward(year,"topDraftPick");

  if(draft){

    const team = TEAMS[draft.teamCode];

    document.getElementById("top-draft-pick-winner")
      .textContent = draft.winner;

    if(team){
      document.getElementById("top-draft-pick-teamname")
        .textContent =
        `${team.teamName}`;
      /* document.getElementById("top-draft-pick-teamloc")
        .textContent =
        `${team.teamNameCity}`; */
    }

  }


  /* ---- FINALS MATCHUP ---- */

  const finalsRound =
    season.playoffs.bracket.rounds
      .find(r=>r.id==="FINALS");

  if(finalsRound){

    const matchup = finalsRound.matchups[0];

    const teamA = TEAMS[matchup.teamA.code];
    const teamB = TEAMS[matchup.teamB.code];

    if(teamA){
      document.getElementById("playoff-finals-teamname1")
        .textContent =
        `${teamA.teamName}`;
      /* document.getElementById("playoff-finals-teamloc1")
        .textContent =
        `${teamA.teamNameCity}`; */
    }

    if(teamB){
      document.getElementById("playoff-finals-teamname2")
        .textContent =
        `${teamB.teamName}`;
      /* document.getElementById("playoff-finals-teamloc2")
        .textContent =
        `${teamB.teamNameCity}`; */
    }

    document.getElementById("playoff-finals-matchup-label")
      .textContent =
      `${year} PLAYOFFS`;

  }


  /* ---- PLAYOFF STRUCTURE ---- */

  const playoffTeams =
    teams.filter(t=>season[t].madePlayoffs);

    document.getElementById("ps-num-label")
      .textContent = playoffTeams.length;

    const structure = season.playoffs.structureType;

    if(structure === "overall-bracket"){

      document.getElementById("pstr-type-label")
        .textContent = "overall";

    }

    if(structure === "conference-bracket"){

      document.getElementById("pstr-type-label")
        .textContent = "conference";

    }

  const roundCount =
    season.playoffs.bracket.rounds.length;

  document.getElementById("pr-num-label")
    .textContent = roundCount;

  /* ---- AWARDS ---- */

  const awards = REG_SEASON_AWARDS[String(year)] || [];

  const voted =
    awards.filter(a => a.type === "voted-value-player");

  const stat =
    awards.filter(a => a.type === "stat-leader-player");

  populateAwardSection(voted,"vvp-award",6);
  populateAwardSection(stat,"ssl-award",3);


}


/* ================================
   TOGGLE VISIBILITY
================================ */

function updateYearToggleVisibility(){

  const minYear = 1997;
  const maxYear = 2025;

  const plus =
    document.getElementById("plus-one-year-icon-container");

  const minus =
    document.getElementById("minus-one-year-icon-container");

  plus.style.visibility =
    selectedYear === maxYear ? "hidden":"visible";

  minus.style.visibility =
    selectedYear === minYear ? "hidden":"visible";

}

document.querySelectorAll('.descrip-type-button').forEach(button => {
  
  button.addEventListener('click', () => {
    button.classList.toggle('active'); 
  });

});