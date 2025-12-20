(function () {

let DATA = null;
let TEAM_BY_ID = {};
let PLAYER_BY_ID = {};

let CURRENT_STAT = "pts";   // pts | reb | ast
let CURRENT_MODE = "total"; // total | avg

let VIEW_MODE = "all"; 
// "all" = show all players
// "leaders" = top 5 per team (filtered)
let PLAYER_VIEW = "compact"; // or "extended"


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

let LAYOUT_MODE = "by-team";
// "by-team" | "global"

fetch("/courts/jax-ball-data/site_data.json")
  .then(res => res.json())
  .then(json => {
    DATA = json;

    buildTeamMap();
    buildPlayerMap();

    buildPlayerSeasonStats().then(() => {
    console.log("Season totals built:", PLAYER_SEASON_STATS);
    renderPlayerCards();
    updateFilterDescription();
    });

  });

document.querySelectorAll("[data-stat]").forEach(btn => {
  btn.addEventListener("click", () => {
    CURRENT_STAT = btn.dataset.stat;
    VIEW_MODE = "leaders";
    setActive(btn, "[data-stat]");
    renderPlayerCards();
    updateFilterDescription();
  });
});

document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    CURRENT_MODE = btn.dataset.mode;
    VIEW_MODE = "leaders";
    setActive(btn, "[data-mode]");
    renderPlayerCards();
    updateFilterDescription();
  });
});

document.getElementById("show-all")?.addEventListener("click", () => {
  VIEW_MODE = "all";
  LAYOUT_MODE = "by-team";
  CURRENT_STAT = "pts";
  CURRENT_MODE = "total";

  // clear active states
  document.querySelectorAll(".active").forEach(b => b.classList.remove("active"));

  renderPlayerCards();
  updateFilterDescription();
});

document.querySelectorAll("[data-player-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    PLAYER_VIEW = btn.dataset.playerView;

    // visual active state
    document
      .querySelectorAll("[data-player-view]")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    renderPlayerCards();
  });
});


document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    VIEW_MODE = btn.dataset.view;

    if (VIEW_MODE === "game-leaders") {
      resetStatFilters(); // 🔑 important
    }

    renderPlayerCards();
    updateFilterDescription();
  });
});

document.querySelectorAll("[data-layout]").forEach(btn => {
  btn.addEventListener("click", () => {
    LAYOUT_MODE = btn.dataset.layout;
    setActive(btn, "[data-layout]");
    renderPlayerCards();
    updateFilterDescription();
  });
});

function setActive(activeBtn, selector) {
  document.querySelectorAll(selector).forEach(b => b.classList.remove("active"));
  activeBtn.classList.add("active");
}
function resetStatFilters() {
  CURRENT_STAT = null;
  CURRENT_MODE = null;

  // clear active states for stat + mode buttons
  document.querySelectorAll("[data-stat], [data-mode]")
    .forEach(b => b.classList.remove("active"));
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

function stylizePlayerName(name) {
  if (!name) return "";

  const parts = name.split(" ");

  // Single-name edge case
  if (parts.length === 1) {
    return `<span class="initial">${parts[0][0]}</span>${parts[0].slice(1)}`;
  }

  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1).join(" ");

  const styledFirst =
    `<span class="initial">${first[0]}</span>${first.slice(1)}`;

  const styledLast =
    `<span class="initial">${last[0]}</span>${last.slice(1)}`;

  return `
    ${styledFirst}
    ${middle ? " " + middle : ""}
    ${middle ? " " : " "}
    ${styledLast}
  `.trim();
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
  if (p.total_reb != null) return num(p.total_reb);
  if (p.reb != null) return num(p.reb);
  return 0;
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

function buildPlayerSeasonStats() {
  PLAYER_SEASON_STATS = {};

  const statFetches = DATA.games
    .filter(game => game.has_stats)
    .map(game =>
      fetch(`/courts/jax-ball-data/game_stats_json/${game.game_id}.json`)
        .then(res => res.json())
        .then(stats => {
          const players = stats.players?.home;
          if (!players || players.length === 0) return;

          // ─────────────────────────────
          // 1️⃣ Accumulate season totals
          // ─────────────────────────────
          players.forEach(p => {
            let id = normalizePlayerId(p.player_id);

            if (!PLAYER_BY_ID[id] && p.jersey) {
              id = `${game.team_id}_${normalizeJersey(p.jersey)}`;
            }

            if (!PLAYER_SEASON_STATS[id]) {
              PLAYER_SEASON_STATS[id] = {
                player_id: id,
                team_id: game.team_id,
                games_played: 0,
                totals: { pts: 0, reb: 0, ast: 0, stl: 0 },
                leader_counts: { pts: 0, reb: 0, ast: 0 },
                leader_games: []
              };
            }

            const ps = PLAYER_SEASON_STATS[id];
            ps.games_played += 1;
            ps.totals.pts += num(p.pts);
            ps.totals.reb += getRebounds(p);
            ps.totals.ast += num(p.ast);
            ps.totals.stl += num(p.stl);
          });

          // ─────────────────────────────
          // 2️⃣ Determine leaders ONCE
          // ─────────────────────────────
          const maxPts = Math.max(...players.map(p => num(p.pts)));
          const maxReb = Math.max(...players.map(p => getRebounds(p)));
          const maxAst = Math.max(...players.map(p => num(p.ast)));

          const leadersByPlayer = {};

          players.forEach(p => {
            let id = normalizePlayerId(p.player_id);

            if (!PLAYER_BY_ID[id] && p.jersey) {
              id = `${game.team_id}_${normalizeJersey(p.jersey)}`;
            }

            if (!leadersByPlayer[id]) {
              leadersByPlayer[id] = {
                categories: [],
                values: {}
              };
            }

            if (num(p.pts) === maxPts && maxPts > 0) {
              leadersByPlayer[id].categories.push("pts");
              leadersByPlayer[id].values.pts = num(p.pts);
            }

            if (getRebounds(p) === maxReb && maxReb > 0) {
              leadersByPlayer[id].categories.push("reb");
              leadersByPlayer[id].values.reb = getRebounds(p);
            }

            if (num(p.ast) === maxAst && maxAst > 0) {
              leadersByPlayer[id].categories.push("ast");
              leadersByPlayer[id].values.ast = num(p.ast);
            }
          });

          // ─────────────────────────────
          // 3️⃣ Commit ONE entry per game
          // ─────────────────────────────
          Object.entries(leadersByPlayer).forEach(([id, info]) => {
            if (info.categories.length === 0) return;

            const ps = PLAYER_SEASON_STATS[id];
            if (!ps) return;

            info.categories.forEach(cat => {
              ps.leader_counts[cat] += 1;
            });

            ps.leader_games.push({
              game_id: game.game_id,
              date: game.date,
              opponent: game.opponent,
              result: game.team_score > game.opp_score ? "W" : "L",
              categories: info.categories,
              values: info.values
            });
          });
        })
    );

  return Promise.all(statFetches);
}

function showGlobalLayout() {
  document.body.classList.add("global-view");

  document.querySelector(".team-columns")?.classList.add("hidden");
  document.getElementById("global-player-grid")?.classList.remove("hidden");
}

function showTeamLayout() {
  document.body.classList.remove("global-view");

  document.querySelector(".team-columns")?.classList.remove("hidden");
  document.getElementById("global-player-grid")?.classList.add("hidden");
}

function getTopPlayersByTeam(stat, mode) {
  const byTeam = {};

  Object.values(PLAYER_SEASON_STATS).forEach(player => {
    if (!byTeam[player.team_id]) {
      byTeam[player.team_id] = [];
    }
    byTeam[player.team_id].push(player);
  });

  Object.keys(byTeam).forEach(teamId => {
    byTeam[teamId] = byTeam[teamId]
      .filter(p => getPlayerValue(p, stat, mode) > 0)
      .sort((a, b) =>
        getPlayerValue(b, stat, mode) -
        getPlayerValue(a, stat, mode)
      )
      .slice(0, 5);
  });

  return byTeam;
}

function clearAllColumns() {
  document.querySelectorAll(".player-card-grid").forEach(col => {
    col.innerHTML = "";
  });
}

function buildPlayerCard(player, leadersMode = false, gameLeadersMode = false) {
  const info = PLAYER_BY_ID[player.player_id];
  const team = TEAM_BY_ID[player.team_id];

  const card = document.createElement("div");
  card.className = "player-card";
  card.dataset.team = player.team_id;

  const value =
  leadersMode && CURRENT_STAT
    ? getPlayerValue(player, CURRENT_STAT, CURRENT_MODE)
    : null;

  card.innerHTML = `
    <div class="player-header">
      <div class="player-name">
        <span class="name">
          ${stylizePlayerName(info?.name ?? player.player_id)}
        </span>
      </div>
      <div class="player-jersey">
        <span class="jersey">#${info?.number ?? "?"}</span>
      </div>
      <div class="player-team">
        ${getTeamDisplayName(player.team_id)}
      </div>
    </div>



    <div class="player-stats">
      ${
        leadersMode
          ? `
            <div class="receipt-block stat-summary">
              <div class="stat-title">
                ${STAT_LABELS[CURRENT_STAT]}
              </div>
              <div class="stat-value">
                ${CURRENT_MODE === "avg" ? value.toFixed(1) : value}
                <span class="stat-suffix">
                  ${CURRENT_MODE === "avg" ? "per game" : "total"}
                </span>
              </div>
            </div>
          `

          : `
            <div class="receipt-block player-stats">
              <div class="pstat"><div class="point-text pre">points:</div> <div class="point-text post">${player.totals.pts}</div></div>
              <div class="pstat"><div class="rebound-text pre">rebounds:</div> <div class="rebound-text post">${player.totals.reb}</div></div>
              <div class="pstat"><div class="assist-text pre">assists:</div> <div class="assist-text post">${player.totals.ast}</div></div>
              <div class="pstat"><div class="steal-text pre">steals:</div> <div class="steal-text post">${player.totals.stl}</div></div>
            `
      }
      <div class="pstat"><div class="games-text pre"># of games played:</div> <div class="games-text post">${player.games_played}</div></div>
    </div>
  `;

    if (gameLeadersMode) {
      const totalLeads =
        player.leader_counts.pts +
        player.leader_counts.reb +
        player.leader_counts.ast;

      const gamesHtml = player.leader_games
        .map(g => `
          <li>
            <strong>${formatShortDate(g.date)}</strong>
            vs ${g.opponent}
            —
            ${g.categories
              .map(cat => `${STAT_LABELS[cat]} (${g.values[cat]})`)
              .join(", ")}
          </li>
        `)
        .join("");

      card.innerHTML = `
        <div class="player-header">
          <div class="player-name">
            <span class="name">
              ${stylizePlayerName(info?.name ?? player.player_id)}
            </span>
          </div>
          <div class="player-jersey">
            <span class="jersey">#${info?.number ?? "?"}</span>
          </div>
          <div class="player-team">
            ${getTeamDisplayName(player.team_id)}
          </div>
        </div>

        <!-- SUMMARY RECEIPT -->
        <section class="receipt-block stat-summary">
          <div class="stat-title">Game Leader Appearances</div>
          <div class="stat-value">${totalLeads}</div>
          <div class="stat-suffix">games led</div>
        </section>

        <!-- CATEGORY BREAKDOWN -->
        <section class="receipt-block">
          <div>Led in points: ${player.leader_counts.pts}</div>
          <div>Led in rebounds: ${player.leader_counts.reb}</div>
          <div>Led in assists: ${player.leader_counts.ast}</div>
        </section>

        <!-- GAME LIST -->
        ${
          player.leader_games.length
            ? `
            <section class="receipt-block player-game-leads">
              <h4>Games Led Team</h4>
              <ul>
                ${gamesHtml}
              </ul>
            </section>
            `
            : ""
        }
      `;

      return card;
    }
  return card;
}

function renderAllPlayers() {
  const byTeam = {};

  Object.values(PLAYER_SEASON_STATS).forEach(player => {
    if (!byTeam[player.team_id]) {
      byTeam[player.team_id] = [];
    }
    byTeam[player.team_id].push(player);
  });

  Object.keys(byTeam).forEach(teamId => {
    byTeam[teamId].sort(
      (a, b) => getJerseyNumber(a) - getJerseyNumber(b)
    );

    const column = document.querySelector(
      `.team-column[data-team="${teamId}"] .player-card-grid`
    );
    if (!column) return;

    byTeam[teamId].forEach(player => {
      const card =
        PLAYER_VIEW === "extended"
          ? buildExtendedPlayerCard(player)
          : buildPlayerCard(player);

      column.appendChild(card);
    });
  });
}

function renderLeaders() {
  if (LAYOUT_MODE === "global") {
    renderGlobalPlayers();
    return;
  }

  const leadersByTeam = getTopPlayersByTeam(CURRENT_STAT, CURRENT_MODE);

  Object.entries(leadersByTeam).forEach(([teamId, players]) => {
    const column = document.querySelector(
      `.team-column[data-team="${teamId}"] .player-card-grid`
    );
    if (!column) return;

    players.forEach(player => {
      const card =
        PLAYER_VIEW === "extended"
          ? buildExtendedPlayerCard(player)
          : buildPlayerCard(player, true);

      column.appendChild(card);
    });
  });
}

function renderPlayerCards() {
  clearAllColumns();

  if (LAYOUT_MODE === "global") {
    showGlobalLayout();
    renderGlobalPlayers();
    return;
  }

  showTeamLayout();

  if (VIEW_MODE === "all") {
    renderAllPlayers();
    return;
  }

  if (VIEW_MODE === "leaders") {
    renderLeaders();
    return;
  }

  if (VIEW_MODE === "game-leaders") {
    renderGameLeaders();
    return;
  }
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

function hasAnyGameLeader(player) {
  const lc = player.leader_counts;
  if (!lc) return false;

  return (lc.pts + lc.reb + lc.ast) > 0;
}

function renderGameLeaders() {
  if (LAYOUT_MODE === "global") {
    renderGlobalPlayers();
    return;
  }

  const byTeam = {};

  Object.values(PLAYER_SEASON_STATS).forEach(player => {
    if (!hasAnyGameLeader(player)) return;
    (byTeam[player.team_id] ??= []).push(player);
  });

  Object.entries(byTeam).forEach(([teamId, players]) => {
    players.sort((a, b) => {
      const aTotal = a.leader_counts.pts + a.leader_counts.reb + a.leader_counts.ast;
      const bTotal = b.leader_counts.pts + b.leader_counts.reb + b.leader_counts.ast;
      return bTotal - aTotal;
    });

    const column = document.querySelector(
      `.team-column[data-team="${teamId}"] .player-card-grid`
    );
    if (!column) return;

    players.forEach(player => {
      const card =
        PLAYER_VIEW === "extended"
          ? buildExtendedPlayerCard(player)
          : buildPlayerCard(player, false, true);

      column.appendChild(card);
    });
  });
}

// added as a 'global' view, to filter stats according to all players (opposed to by team then players)
function getActivePlayers() {
  if (VIEW_MODE === "all") {
    return Object.values(PLAYER_SEASON_STATS);
  }

  if (VIEW_MODE === "leaders") {
    return Object.values(getTopPlayersByTeam(CURRENT_STAT, CURRENT_MODE))
      .flat();
  }

  if (VIEW_MODE === "game-leaders") {
    return Object.values(PLAYER_SEASON_STATS)
      .filter(hasAnyGameLeader);
  }

  return [];
}

function renderGlobalPlayers() {
  const grid = document.querySelector("#global-player-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const players = getActivePlayers();

  // ✅ GAME LEADERS SORT
  if (VIEW_MODE === "game-leaders") {
    players.sort((a, b) => {
      const aTotal =
        a.leader_counts.pts +
        a.leader_counts.reb +
        a.leader_counts.ast;

      const bTotal =
        b.leader_counts.pts +
        b.leader_counts.reb +
        b.leader_counts.ast;

      return bTotal - aTotal;
    });
  }
  // ✅ STAT LEADERS SORT
  else if (VIEW_MODE === "leaders") {
    players.sort((a, b) =>
      getPlayerValue(b, CURRENT_STAT, CURRENT_MODE) -
      getPlayerValue(a, CURRENT_STAT, CURRENT_MODE)
    );
  }
  // ✅ ALL PLAYERS DEFAULT SORT
  else {
    players.sort((a, b) => getJerseyNumber(a) - getJerseyNumber(b));
  }

  // ✅ render AFTER sorting
  players.forEach(player => {
    const card =
      PLAYER_VIEW === "extended"
        ? buildExtendedPlayerCard(player)
        : buildPlayerCard(
            player,
            VIEW_MODE === "leaders",
            VIEW_MODE === "game-leaders"
          );

    grid.appendChild(card);
  });
}

function getPlayerMeta(player) {
  const roster = PLAYER_BY_ID[player.player_id] || {};

  return {
    name: roster.name,
    number: roster.number,
    position: roster.position || "",
    hometown: roster.hometown || "",
    high_school: roster.high_school || "",
    team_id: player.team_id
  };
}

function getHighestScoringGame(player) {
  const games = player.leader_games || [];

  let max = null;

  games.forEach(g => {
    if (g.values?.pts > 20) {
      if (!max || g.values.pts > max.values.pts) {
        max = g;
      }
    }
  });

  return max;
}

function getTeamLeaders(teamId) {
  const players = Object.values(PLAYER_SEASON_STATS)
    .filter(p => p.team_id === teamId);

  const leaders = {
    pts: null,
    pts_avg: null,
    reb: null,
    reb_avg: null,
    ast: null,
    ast_avg: null
  };

  players.forEach(p => {
    const ptsAvg = p.games_played ? p.totals.pts / p.games_played : 0;
    const rebAvg = p.games_played ? p.totals.reb / p.games_played : 0;
    const astAvg = p.games_played ? p.totals.ast / p.games_played : 0;

    if (!leaders.pts || p.totals.pts > leaders.pts.totals.pts) leaders.pts = p;
    if (!leaders.reb || p.totals.reb > leaders.reb.totals.reb) leaders.reb = p;
    if (!leaders.ast || p.totals.ast > leaders.ast.totals.ast) leaders.ast = p;

    if (!leaders.pts_avg || ptsAvg > (leaders.pts_avg.totals.pts / leaders.pts_avg.games_played)) {
      leaders.pts_avg = p;
    }
    if (!leaders.reb_avg || rebAvg > (leaders.reb_avg.totals.reb / leaders.reb_avg.games_played)) {
      leaders.reb_avg = p;
    }
    if (!leaders.ast_avg || astAvg > (leaders.ast_avg.totals.ast / leaders.ast_avg.games_played)) {
      leaders.ast_avg = p;
    }
  });

  return leaders;
}

function buildExtendedPlayerCard(player) {
  const meta = getPlayerMeta(player);
  const teamLeaders = getTeamLeaders(player.team_id);
  const highGame = getHighestScoringGame(player);

  const isTeamLeader = stat =>
    teamLeaders[stat]?.player_id === player.player_id;

  const card = document.createElement("div");
  card.className = "player-card extended";
  card.dataset.team = player.team_id;

  card.innerHTML = `
    <header class="player-header">
      <span class="jersey">#${meta.number}</span>

      <h2 class="name">${meta.name}</h2>

      <div class="header-meta">
        <span class="position">${meta.position}</span>
        <span class="team-name">${getTeamDisplayName(meta.team_id)}</span>
      </div>
    </header>

    <section class="player-bio">
      ${meta.hometown ? `<div><strong>Hometown</strong> ${meta.hometown}</div>` : ""}
      ${meta.high_school ? `<div><strong>HS</strong> ${meta.high_school}</div>` : ""}
    </section>

    <section class="player-season player-stats">
      <div class="pstat">
        <div class="pre">pts</div>
        <div class="post">${player.totals.pts}</div>
      </div>
      <div class="pstat">
        <div class="pre">reb</div>
        <div class="post">${player.totals.reb}</div>
      </div>
      <div class="pstat">
        <div class="pre">ast</div>
        <div class="post">${player.totals.ast}</div>
      </div>
    </section>

    ${
      highGame
        ? `<section class="player-highlight">
            <strong>Highest Scoring Game (so far):</strong>
            ${highGame.values.pts} pts vs ${highGame.opponent}
          </section>`
        : ""
    }

    <section class="player-leaders">
      ${isTeamLeader("pts") ? `<div>TEAM LEADER - Points (${player.totals.pts})</div>` : ""}
      ${isTeamLeader("reb") ? `<div>TEAM LEADER - Rebounds (${player.totals.reb})</div>` : ""}
      ${isTeamLeader("ast") ? `<div>TEAM LEADER - Assists (${player.totals.ast})</div>` : ""}
    </section>

    ${
      player.leader_games.length
        ? `
        <section class="receipt-block player-game-leads">
          <h4>Games Led Team</h4>
          <ul>
            ${player.leader_games.map(g => `
              <li>
                <strong>${formatShortDate(g.date)}</strong>
                vs ${g.opponent}
                —
                ${g.categories
                  .map(c => `${STAT_LABELS[c]} (${g.values[c]})`)
                  .join(", ")}
              </li>
            `).join("")}
          </ul>
        </section>
        `
        : ""
    }


    <section class="player-links">
      <!-- future external links -->
    </section>
  `;

  return card;
}

// ─────────────────────────────
// Expose player system to other scripts
// ─────────────────────────────
window.PlayerUI = {
  buildPlayerCard,
  buildExtendedPlayerCard,
  PLAYER_SEASON_STATS,
  PLAYER_BY_ID,
  TEAM_BY_ID,
  setPlayerView(view) {
    PLAYER_VIEW = view;
  },
  getPlayerView() {
    return PLAYER_VIEW;
  }
};

})();
