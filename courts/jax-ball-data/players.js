(function () {

let DATA = null;
let TEAM_BY_ID = {};
let PLAYER_BY_ID = {};

const TEAM_DISPLAY_NAMES = {
  ju: "Dolphins",
  ewu: "Tigers",
  fscj: "Rays",
  unf: "Ospreys"
};

const STAT_LABELS = {
  pts: "points",
  reb: "rebounds",
  ast: "assists",
  stl: "steals"
};

DataLoader.loadSiteData().then(json => {
  DATA = json;

  buildTeamMap();
  buildPlayerMap();

  buildPlayerSeasonStats().then(() => {
    PlayerRenderers.renderPlayerCards(getPlayerUIContext());
    updateFilterDescription();
  });
});

function getPlayerUIContext() {
  const state = PlayerState.getState();

  return {
    // state
    ...state,

    // data
    PLAYER_SEASON_STATS,
    PLAYER_BY_ID,
    TEAM_BY_ID,

    // builders
    buildPlayerCard: PlayerBuilders.buildPlayerCard,
    buildExtendedPlayerCard: PlayerBuilders.buildExtendedPlayerCard,

    // selectors / logic
    getTopPlayersByTeam: PlayerSelectors.getTopPlayersByTeam,
    hasAnyGameLeader: PlayerSelectors.hasAnyGameLeader,
    getActivePlayers: PlayerSelectors.getActivePlayers,

    getPlayerValue,
    getJerseyNumber,

    // helpers
    getTeamDisplayName,
    formatShortDate,
    STAT_LABELS
  };
}

document.querySelectorAll("[data-stat]").forEach(btn => {
  btn.addEventListener("click", () => {
    PlayerState.setState({
      CURRENT_STAT: btn.dataset.stat,
      VIEW_MODE: "leaders"
    });
    setActive(btn, "[data-stat]");
    PlayerRenderers.renderPlayerCards(getPlayerUIContext());

    updateFilterDescription();
  });
});

document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    PlayerState.setState({
      CURRENT_MODE: btn.dataset.mode,
      VIEW_MODE: "leaders"
    });
    setActive(btn, "[data-mode]");
    PlayerRenderers.renderPlayerCards(getPlayerUIContext());

    updateFilterDescription();
  });
});

document.getElementById("show-all")?.addEventListener("click", () => {
  PlayerState.setState({
    VIEW_MODE: "all",
    LAYOUT_MODE: "by-team",
    CURRENT_STAT: "pts",
    CURRENT_MODE: "total"
  });

  // clear active states
  document.querySelectorAll(".active").forEach(b => b.classList.remove("active"));

  PlayerRenderers.renderPlayerCards(getPlayerUIContext());

  updateFilterDescription();
});

document.querySelectorAll("[data-player-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    PlayerState.setState({
      PLAYER_VIEW: btn.dataset.playerView
    });

    document
      .querySelectorAll("[data-player-view]")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    PlayerRenderers.renderPlayerCards(getPlayerUIContext());
  });
});

document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;

    PlayerState.setState({
      VIEW_MODE: view
    });

    if (view === "game-leaders") {
      PlayerState.resetStatFilters();
    }

    PlayerRenderers.renderPlayerCards(getPlayerUIContext());

    updateFilterDescription();
  });
});

document.querySelectorAll("[data-layout]").forEach(btn => {
  btn.addEventListener("click", () => {
    PlayerState.setState({
      LAYOUT_MODE: btn.dataset.layout
    });

    setActive(btn, "[data-layout]");
    PlayerRenderers.renderPlayerCards(getPlayerUIContext());
    updateFilterDescription();
  });
});

function setActive(activeBtn, selector) {
  document.querySelectorAll(selector).forEach(b => b.classList.remove("active"));
  activeBtn.classList.add("active");
}
// resets stat filters was here

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

      // ✅ exact ID
      PLAYER_BY_ID[player.player_id] = {
        name: player.name,
        number: player.number,
        team_id: teamId,
        position: player.position || "",
        hometown: player.hometown || "",
        high_school: player.high_school || ""
      };

      // ✅ fallback: team + jersey
      if (player.number) {
        PLAYER_BY_ID[`${teamId}_${player.number}`] = {
        name: player.name,
        number: player.number,
        team_id: teamId,
        position: player.position || "",
        hometown: player.hometown || "",
        high_school: player.high_school || ""
        };
      }
    });
  });

  console.log("PLAYER_BY_ID built:", Object.keys(PLAYER_BY_ID).length);
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";

  // Force local date (prevents timezone shift)
  const d = new Date(`${dateStr}T00:00:00`);

  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}



function formatPlayer(p) {
  if (!p || !p.player_id) return "Unknown Player";

  // 1️⃣ exact ID
  let info = PLAYER_BY_ID[p.player_id];

  // 2️⃣ fallback: team + raw jersey
  if (!info && p.jersey && p.player_id.includes("_")) {
    const teamId = p.player_id.split("_")[0];
    info = PLAYER_BY_ID[`${teamId}_${p.jersey}`];
  }

  // 3️⃣ FINAL fallback: team + normalized jersey
  if (!info && p.jersey && p.player_id.includes("_")) {
    const teamId = p.player_id.split("_")[0];
    const normalized = normalizeJersey(p.jersey);
    info = PLAYER_BY_ID[`${teamId}_${normalized}`];
  }

  if (!info) return p.player_id;

  return `#${info.number} ${info.name}`;
}

function getTeamDisplayName(teamId) {
  return TEAM_DISPLAY_NAMES[teamId] || TEAM_BY_ID[teamId]?.team_name || teamId;
}

function num(val) {
  if (val == null || val === "") return 0;
  return Number(val);
}

function getJerseyNumber(player) {
  const info = PLAYER_BY_ID[player.player_id];
  return info?.number ? Number(info.number) : 999;
}

function getRebounds(p) {
  // @TECH-DEBT: remove after data pipeline cleanup
  return num(
    p.total_reb ??
    p.reb ??
    p.trb ??
    0
  );
}

function getPlayerValue(player, stat, mode) {
  // ✅ Game Leaders / no stat context
  if (!stat) return 0;

  if (stat.endsWith("_leader")) {
    const key = stat.replace("_leader", "");
    return player.leader_counts?.[key] ?? 0;
  }

  const total = player.totals[stat] ?? 0;

  if (mode === "avg") {
    return player.games_played
      ? total / player.games_played
      : 0;
  }

  return total;
}

let PLAYER_SEASON_STATS = {};

// builderplayerseasonstats was here
function buildPlayerSeasonStats() {
  return PlayerSeasonStats
    .buildPlayerSeasonStats({
      DATA,
      DataLoader,
      PLAYER_BY_ID
    })
    .then(stats => {
      PLAYER_SEASON_STATS = stats;
    });
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
      renderGameStatsInto(stats, statsShell);
    })
    .catch(err => {
      console.error("Failed to load game stats:", err);
      statsShell.innerHTML = "<em>Game stats unavailable.</em>";
    });
}

const FILTER_DESCRIPTIONS = {
  pts: {
    total: `
      <strong>Points — Season Totals</strong><br>
      Showing the top 5 scorers on each team based on total points scored so far this season.
    `,
    avg: `
      <strong>Points — Per Game Average</strong><br>
      Showing the most efficient scorers on each team by average points per game.
    `
  },

  reb: {
    total: `
      <strong>Rebounds — Season Totals</strong><br>
      Players ranked by total rebounds collected so far this season.
    `,
    avg: `
      <strong>Rebounds — Per Game Average</strong><br>
      Players ranked by average rebounds per game.
    `
  },

  ast: {
    total: `
      <strong>Assists — Season Totals</strong><br>
      Players creating the most scoring opportunities this season.
    `,
    avg: `
      <strong>Assists — Per Game Average</strong><br>
      Players with the highest average assists per game.
    `
  },

    all: "All players with season totals so far.",
    leaders: "Top 5 players per team in the selected stat.",
    "game-leaders": "Players who have led their team in points, rebounds, or assists in at least one game."
};

FILTER_DESCRIPTIONS.layout = {
  "by-team": "Players grouped by team.",
  "global": "Players ranked across all teams."
};

function updateFilterDescription() {
    const {
      VIEW_MODE,
      CURRENT_STAT,
      CURRENT_MODE,
      LAYOUT_MODE
    } = PlayerState.getState();

  const box = document.getElementById("filter-description");
  if (!box) return;

  // ALL PLAYERS
  if (VIEW_MODE === "all") {
    box.innerHTML = FILTER_DESCRIPTIONS.all;
    box.classList.remove("hidden");
    return;
  }

  // GAME LEADERS
  if (VIEW_MODE === "game-leaders") {
    box.innerHTML = `
      <strong>Game Leaders</strong><br>
      Players ranked by total number of games where they led
      in points, rebounds, or assists.
    `;
    box.classList.remove("hidden");
    return;
  }

  // STAT LEADERS (pts / reb / ast)
  const html =
    FILTER_DESCRIPTIONS[CURRENT_STAT]?.[CURRENT_MODE];

  if (html) {
    box.innerHTML = html;
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
  if (LAYOUT_MODE === "global") {
    box.innerHTML = `
      <strong>Global View</strong><br>
      Showing players ranked across all teams by the selected filter.
    `;
    box.classList.remove("hidden");
  }
}

// ─────────────────────────────
// Expose player system to other scripts
// ─────────────────────────────
window.PlayerUI = {
  setPlayerView(view) {
    PlayerState.setState({ PLAYER_VIEW: view });
    PlayerRenderers.renderPlayerCards(getPlayerUIContext());
  },
  getPlayerView() {
    return PlayerState.getState().PLAYER_VIEW;
  }
};


})();
