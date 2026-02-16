let DATA = null;


let TEAM_BY_ID = {};

let TEAM_SELECTOR_EL = null;


let PLAYER_BY_ID = {};

let GAME_STATS_BY_ID = {};

let TEAM_PLAYER_TOTALS = {};
let TEAM_LEADERS = {};

const SCHOOL_NAME_BY_TEAM = {
  fscj: "Florida State College at Jacksonville",
  ju: "Jacksonville University",
  ewu: "Edward Waters University",
  unf: "University of North Florida"
};

DataLoader.loadSiteData().then(json => {
  DATA = json;

  DataLoader.loadAllGameStats(DATA.games).then(() => {
    buildSeasonTotalsAndLeaders();
    populateAllTeamCards();
  });

  TEAM_SELECTOR_EL = document.querySelector(".team-selector");

  TeamSelectors.clearTeamRecordCache();
  buildTeamMap();
  buildPlayerMap();

    // ✅ CALENDAR GOES HERE
  CalendarController.renderCalendar({
    container: document.getElementById("calendar-grid"),
    games: getGamesForCurrentPage(),
    onDaySelected: populateDayDetail
  });

  syncPlayerViewForPage();
  // wireTeamButtons(); // still intentionally disabled
  autoShowTeamIfPresent();

  // ✅ ensure game detail is hidden on load
  const gameDetail = document.getElementById("game-detail");
  if (gameDetail) {
    gameDetail.classList.add("hidden");
    gameDetail.innerHTML = "";
  }
});

function syncPlayerViewForPage() {
  if (!window.PlayerUI) return;

  const teamId = document.body.dataset.team;

  if (teamId) {
    // Individual team page
    window.PlayerUI.setPlayerView("extended");
  } else {
    // Main player index / hub
    window.PlayerUI.setPlayerView("compact");
  }
}

function wireTeamButtons() {
  document.querySelectorAll(".team-card").forEach(card => {
    card.addEventListener("click", () => {
      const teamId = card.dataset.team;
      toggleTeamCard(card, teamId);
    });
  });
}

function toggleTeamCard(card, teamId) {
  const body = card.querySelector(".team-card-body");
  const isExpanded = card.classList.contains("expanded");

  // Close all cards
  document.querySelectorAll(".team-card.expanded").forEach(open => {
    open.classList.remove("expanded");
  });

  // Reset container state
  TEAM_SELECTOR_EL?.classList.remove("has-active");

  if (!isExpanded) {
    TeamUI.renderExpandedTeam({
      teamId,
      container: body,
      DATA,
      TEAM_BY_ID,
      getTeamRecord: TeamSelectors.getTeamRecord,
      SCHOOL_NAME_BY_TEAM
    });

    card.classList.add("expanded");

    // ✅ THIS LINE is what fixes the layout reset issue
    TEAM_SELECTOR_EL?.classList.add("has-active");
  }
}



// static team card view 
function populateAllTeamCards() {
  document.querySelectorAll(".team-card").forEach(card => {
    const teamId = card.dataset.team;
    const body = card.querySelector(".team-card-body");
    if (!teamId || !body) return;

    TeamUI.renderStaticTeam({
      teamId,
      container: body,
      DATA,
      TEAM_LEADERS,
      getTeamRecord: TeamSelectors.getTeamRecord,
      SCHOOL_NAME_BY_TEAM,
      formatPlayer: p =>
        Formatters.formatPlayer(p, {
          PLAYER_BY_ID,
          normalizeJersey
        })
    });

  });
}

function autoShowTeamIfPresent() {
  const teamId = document.body.dataset.team;
  if (!teamId) return;

  const card = document.querySelector(`.team-card[data-team="${teamId}"]`);
  if (!card) return;

  toggleTeamCard(card, teamId);
}

function getGamesForCurrentPage() {
  const teamId = document.body.dataset.team;

  // If no team is specified, return ALL games (main calendar)
  if (!teamId) {
    return DATA.games;
  }

  // Otherwise, only games for this team
  return DATA.games.filter(game => game.team_id === teamId);
}

function normalizePlayerId(id) {
  if (!id) return id;

  return id
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/^0+/, "")
    .replace(/_0(\d)/g, "_$1");
}

function normalizeJersey(jersey) {
  if (jersey == null) return null;
  return String(parseInt(jersey, 10));
}

function buildTeamMap() {
  TEAM_BY_ID = {};

  Object.values(DATA.teams).forEach(team => {
    TEAM_BY_ID[team.team_id] = team;
  });
}

function buildPlayerMap() {
  PLAYER_BY_ID = {};

  if (!DATA.rosters) return;

  Object.entries(DATA.rosters).forEach(([teamId, roster]) => {
    roster.forEach(player => {
      if (!player.player_id) return;

      // ✅ Primary: exact ID match
      PLAYER_BY_ID[player.player_id] = {
        name: player.name,
        number: player.number,
        team_id: teamId
      };

      // ✅ Secondary: team + jersey (fallback)
      if (player.number) {
        PLAYER_BY_ID[`${teamId}_${player.number}`] = {
          name: player.name,
          number: player.number,
          team_id: teamId
        };
      }
    });
  });

  console.log("PLAYER_BY_ID built:", Object.keys(PLAYER_BY_ID).length);
}

function getPlayerReb(p) {
  if (p.total_reb != null) return Formatters.num(p.total_reb);
  if (p.reb != null) return Formatters.num(p.reb);
  return 0;
}

function getStatValue(p, stat) {
  switch (stat) {
    case "pts":
      return Formatters.num(p.pts);
    case "reb":
      return Formatters.num(p.total_reb ?? p.reb);
    case "ast":
      return Formatters.num(p.ast);
    default:
      return 0;
  }
}

// build season totals and leaders was here
function buildSeasonTotalsAndLeaders() {
  const result = TeamSeasonStats.buildTeamSeasonStats({
    DATA,
    GAME_STATS_BY_ID
  });

  TEAM_PLAYER_TOTALS = result.TEAM_PLAYER_TOTALS;
  TEAM_LEADERS = result.TEAM_LEADERS;
}

function populateDayDetail(dateKey, games) {
  const detail = document.getElementById("game-detail");
  if (!detail || !games.length) return;

  detail.classList.remove("hidden");

  // ✅ set team context for CSS
  detail.dataset.team = games[0].team_id;

  detail.innerHTML = "";

  /* ---------- HEADER ---------- */
  const dateObj = new Date(dateKey);

  const header = document.createElement("div");
  header.className = "game-day-header";

  header.textContent = `GAMES · ${Formatters.formatDateLabel(dateKey, "full")}`;

  detail.appendChild(header);

  /* ---------- GAME ROW ---------- */
  const gamesRow = document.createElement("div");
  gamesRow.className = "game-day-games";

  games.forEach(game => {
    gamesRow.appendChild(
    GameUI.buildSingleGameDetail({
      game,
      TEAM_BY_ID,
      buildGameLinks: GameUI.buildGameLinks
    })
  );
  });

  detail.appendChild(gamesRow);
}

//build single game detail was here


function createGameSquare(game) {
  const team = TEAM_BY_ID[game.team_id];

  const square = document.createElement("div");
  square.className = "calendar-game";
  square.dataset.gameId = game.game_id;

  // color by team
  if (team?.branding?.colors?.secondary) {
    square.dataset.team = game.team_id;

  }

  // visual flag if stats exist
  if (game.has_stats) {
    square.classList.add("has-stats");
  }
  return square;
}

function loadGameStats(gameId) {
  
  const statsShell = document.getElementById(`stats-${gameId}`);
  if (!statsShell) {
    console.warn("Stats shell not found for game:", gameId);
    return;
  }

  // Prevent double-load
  if (statsShell.dataset.loaded === "true") return;
  statsShell.dataset.loaded = "true";

  statsShell.innerHTML = "<em>Loading stats…</em>";

    DataLoader.loadGameStats(gameId)
      .then(stats => {
      GameUI.renderGameStatsInto({
        stats,
        container: statsShell,
        PLAYER_BY_ID,
        normalizeJersey,
        getPlayerReb: GameStatHelpers.getPlayerReb,
        getStatValue: GameStatHelpers.getStatValue
      });
      })

    .catch(err => {
      console.error("Failed to load game stats:", err);
      statsShell.innerHTML = "<em>Game stats unavailable.</em>";
    });
}

// rendergamestatsinto was here

// getstatleaders was here