let DATA = null;

let SITE_DATA = null;
let TEAM_BY_ID = {};
let GAMES_BY_DATE = {};

let TEAM_SELECTOR_EL = null;

const TEAM_RECORD_CACHE = {};

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

fetch("/courts/jax-ball-data/site_data.json")
  .then(res => res.json())
  .then(json => {
    DATA = json;

  loadAllGameStats().then(() => {
    buildSeasonTotals();
    buildTeamLeaders();

    populateAllTeamCards();
  });

    TEAM_SELECTOR_EL = document.querySelector(".team-selector");

    clearTeamRecordCache();
    buildTeamMap();
    buildPlayerMap();
    buildGamesByDate();

    syncPlayerViewForPage();
    // wireTeamButtons(); // commenting out for now to get the static team card view
    renderCalendar();
    autoShowTeamIfPresent();

    // ✅ ensure game detail is hidden on load
    const gameDetail = document.getElementById("game-detail");
    if (gameDetail) {
      gameDetail.classList.add("hidden");
      gameDetail.innerHTML = ""; // optional: ensure no stale markup
    }
  });

function formatDateLabel(dateStr, variant = "full") {
  if (!dateStr) return "";

  const d = new Date(dateStr + "T00:00:00");

  switch (variant) {
    case "day":
      // SUN
      return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

    case "day-date":
      // SUN · JAN 12
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      }).toUpperCase().replace(",", " ·");

    case "month":
      // JANUARY 2026
      return d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      }).toUpperCase();

    case "numeric":
      // JAN 12
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }).toUpperCase();

    case "full":
    default:
      // SUNDAY · JANUARY 12
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).toUpperCase().replace(",", " ·");
  }
}
function formatCalendarDayLabel(dateStr) {
  if (!dateStr) return "";

  const d = new Date(dateStr + "T00:00:00");

  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    date: d.getDate()
  };
}

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
    showTeam(teamId, body);
    card.classList.add("expanded");

    // ✅ THIS LINE is what fixes the layout reset issue
    TEAM_SELECTOR_EL?.classList.add("has-active");
  }
}

function showTeam(teamId, container) {
  const team = DATA.teams[teamId];
  if (!team || !container) return;

  container.dataset.team = teamId;

  const record = getTeamRecord(teamId);

  const recordClass =
    record.wins > record.losses ? "winning" :
    record.losses > record.wins ? "losing" : "";

  // Full school name (fallback to team name if needed)
  const schoolName =
    team.school_name ||
    team.school ||
    team.team_name;

  // Link to individual team page
  const teamPageUrl = `/courts/jax-ball-data/main_courts/${teamId}_maincourt.html`;

  container.innerHTML = `
    <div class="team-details-inner">

      <!-- School name + record -->
      <div class="team-title-row">
        <span class="team-school-name">
          ${schoolName}
        </span>

        <span class="team-record ${recordClass}">
          ${record.wins}–${record.losses}
        </span>
      </div>

      <!-- Link to team page -->
      <div class="team-page-link">
        <a href="${teamPageUrl}">
          View full team page →
        </a>
      </div>

      <!-- Team colors -->
      <div class="team-colors">
        <span class="color-swatch primary"></span>
        <span class="color-swatch secondary"></span>
        <span class="color-swatch accent"></span>
      </div>

      <!-- Coaching staff -->
      <ul class="coaching-list">
        <li>
          <strong>Head Coach:</strong>
          <em>${team.coaching_staff.head_coach.name}</em>
        </li>
        ${
          team.coaching_staff.assistant_coaches
            .map(c => `<li>Assistant Coach: <em>${c.name}</em></li>`)
            .join("")
        }
      </ul>

    </div>
  `;
}

// static team card view 
function populateAllTeamCards() {
  document.querySelectorAll(".team-card").forEach(card => {
    const teamId = card.dataset.team;
    const body = card.querySelector(".team-card-body");
    if (!teamId || !body) return;

    showTeamStatic(teamId, body);
  });
}
function showTeamStatic(teamId, container) {
  const team = DATA.teams[teamId];
  if (!team || !container) return;

  const record = getTeamRecord(teamId);
  const leaders = TEAM_LEADERS[teamId];

  const recordClass =
    record.wins > record.losses ? "winning" :
    record.losses > record.wins ? "losing" : "";

  const schoolName =
    SCHOOL_NAME_BY_TEAM[teamId] ||
    team.school_name ||
    team.school ||
    team.team_name;

  const teamPageUrl = `/courts/jax-ball-data/main_courts/${teamId}_maincourt.html`;

  container.innerHTML = `
    <div class="team-details-inner">

      <!-- Team name + record -->
      <div class="team-title-row">
        <span class="team-school-name">
          ${schoolName}
        </span>
        <span class="team-record ${recordClass}">
          ${record.wins}–${record.losses}
        </span>
      </div>

      <!-- Team leaders -->
      ${
        leaders
          ? `
        <div class="team-leaders">
          <div class="leader-row">
            <span class="leader-label">PTS</span>
            <span class="leader-name">${formatPlayer(leaders.pts)}</span>
            <span class="leader-value">${leaders.pts.totals.pts}</span>
          </div>

          <div class="leader-row">
            <span class="leader-label">REB</span>
            <span class="leader-name">${formatPlayer(leaders.reb)}</span>
            <span class="leader-value">${leaders.reb.totals.reb}</span>
          </div>

          <div class="leader-row">
            <span class="leader-label">AST</span>
            <span class="leader-name">${formatPlayer(leaders.ast)}</span>
            <span class="leader-value">${leaders.ast.totals.ast}</span>
          </div>
        </div>
        `
          : `<em class="no-leaders">Stats pending</em>`
      }

      <!-- Team page link -->
      <div class="team-page-link">
        <a href="${teamPageUrl}" target="_blank">
          View team page →
        </a>
      </div>

    </div>
  `;
}

function getTeamRecord(teamId) {
  if (TEAM_RECORD_CACHE[teamId]) {
    return TEAM_RECORD_CACHE[teamId];
  }

  let wins = 0;
  let losses = 0;

  DATA.games.forEach(game => {
    if (game.team_id !== teamId) return;

    // Only count completed games
    if (game.team_score == null || game.opp_score == null) return;

    if (game.team_score > game.opp_score) wins++;
    else if (game.team_score < game.opp_score) losses++;
  });

  const record = { wins, losses };
  TEAM_RECORD_CACHE[teamId] = record;
  return record;
}

function clearTeamRecordCache() {
  Object.keys(TEAM_RECORD_CACHE).forEach(k => delete TEAM_RECORD_CACHE[k]);
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

function formatPlayer(p) {
  if (!p || !p.player_id) return "Unknown Player";

  // 1️⃣ Exact ID match
  let info = PLAYER_BY_ID[p.player_id];

  // 2️⃣ Fallback: team + raw jersey
  if (!info && p.jersey && p.player_id.includes("_")) {
    const teamId = p.player_id.split("_")[0];
    info = PLAYER_BY_ID[`${teamId}_${p.jersey}`];
  }

  // 3️⃣ FINAL fallback: team + normalized jersey (EWU fix)
  if (!info && p.jersey && p.player_id.includes("_")) {
    const teamId = p.player_id.split("_")[0];
    const normalizedJersey = normalizeJersey(p.jersey);
    info = PLAYER_BY_ID[`${teamId}_${normalizedJersey}`];
  }

  if (!info) return p.player_id;

  return `#${info.number} ${info.name}`;
}

function num(val) {
  if (val == null || val === "") return 0;
  return Number(val);
}

function getPlayerReb(p) {
  if (p.total_reb != null) return num(p.total_reb);
  if (p.reb != null) return num(p.reb);
  return 0;
}

function getStatValue(p, stat) {
  switch (stat) {
    case "pts":
      return num(p.pts);
    case "reb":
      return num(p.total_reb ?? p.reb);
    case "ast":
      return num(p.ast);
    default:
      return 0;
  }
}
function loadAllGameStats() {
  const gamesWithStats = DATA.games.filter(g => g.has_stats);

  return Promise.all(
    gamesWithStats.map(game =>
      fetch(`/courts/jax-ball-data/game_stats_json/${game.game_id}.json`)
        .then(res => res.json())
        .then(stats => {
          GAME_STATS_BY_ID[game.game_id] = stats;
        })
        .catch(() => {
          console.warn("Missing stats for game:", game.game_id);
        })
    )
  );
}

function buildSeasonTotals() {
  TEAM_PLAYER_TOTALS = {};

  DATA.games
    .filter(g => g.has_stats)
    .forEach(game => {
      const stats = GAME_STATS_BY_ID[game.game_id];
      if (!stats?.players?.home) return;

      const teamId = game.team_id;
      TEAM_PLAYER_TOTALS[teamId] ??= {};

      stats.players.home.forEach(p => {
        const pid = normalizePlayerId(p.player_id);
        if (!pid) return;

        TEAM_PLAYER_TOTALS[teamId][pid] ??= {
          player_id: pid,
          team_id: teamId,
          totals: { pts: 0, reb: 0, ast: 0 }
        };

        TEAM_PLAYER_TOTALS[teamId][pid].totals.pts += num(p.pts);
        TEAM_PLAYER_TOTALS[teamId][pid].totals.reb += getPlayerReb(p);
        TEAM_PLAYER_TOTALS[teamId][pid].totals.ast += num(p.ast);
      });
    });
}

function buildTeamLeaders() {
  TEAM_LEADERS = {};

  Object.entries(TEAM_PLAYER_TOTALS).forEach(([teamId, players]) => {
    const list = Object.values(players);

    const maxBy = stat =>
      list.reduce(
        (best, p) =>
          !best || p.totals[stat] > best.totals[stat] ? p : best,
        null
      );

    TEAM_LEADERS[teamId] = {
      pts: maxBy("pts"),
      reb: maxBy("reb"),
      ast: maxBy("ast")
    };
  });
}


function buildGamesByDate() {
  GAMES_BY_DATE = {};

  const games = getGamesForCurrentPage();

  games.forEach(game => {
    if (!game.date) return;

    if (!GAMES_BY_DATE[game.date]) {
      GAMES_BY_DATE[game.date] = [];
    }

    GAMES_BY_DATE[game.date].push(game);
  });
}

function getMonthKey(dateStr) {
  return dateStr.slice(0, 7); // "2025-11"
}
function groupDatesByMonth() {
  const byMonth = {};

  Object.keys(GAMES_BY_DATE).forEach(date => {
    const monthKey = getMonthKey(date);
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(date);
  });

  return byMonth;
}


function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const datesByMonth = groupDatesByMonth();
  const monthKeys = Object.keys(datesByMonth).sort();

  monthKeys.forEach(monthKey => {
    const [year, month] = monthKey.split("-").map(Number);
    renderMonth(grid, year, month - 1);
  });
}

function buildGameLinks(game) {
  if (!game.links) return "";

  return Object.entries(game.links)
    .map(([key, url]) => `<a href="${url}" target="_blank">${key}</a>`)
    .join(" • ");
}

function renderMonth(parent, year, month) {
  const monthEl = document.createElement("div");
  monthEl.className = "calendar-month";

  const isOctober = month === 9; // October (0-based)

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const datesInThisMonth = Object.keys(GAMES_BY_DATE)
    .filter(d => d.startsWith(monthKey))
    .sort();

  const title = document.createElement("h3");
  title.className = "calendar-month-title";
  title.textContent = formatDateLabel(
    `${year}-${String(month + 1).padStart(2, "0")}-01`,
    "month"
  );

  monthEl.appendChild(title);

  // Weekdays (keep for consistency)
// Weekdays — skip for October
if (!isOctober) {
  const weekdays = document.createElement("div");
  weekdays.className = "calendar-weekdays";

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d =>
    weekdays.appendChild(
      Object.assign(document.createElement("div"), { textContent: d })
    )
  );

  monthEl.appendChild(weekdays);
}

  // Grid
  const grid = document.createElement("div");
  grid.className = "calendar-month-grid";

  

// ✅ OCTOBER: render ONLY days that have games
if (isOctober) {
  datesInThisMonth.forEach(dateKey => {
    const gamesForDay = GAMES_BY_DATE[dateKey] || [];
    if (!gamesForDay.length) return;

    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day has-games";

    const label = formatCalendarDayLabel(dateKey);
    const labelEl = document.createElement("div");
    labelEl.className = "calendar-day-label";
    labelEl.innerHTML = `
      <span class="day-name">${label.day}</span>
      <span class="day-num">${label.date}</span>
    `;

    dayCell.appendChild(labelEl);

    gamesForDay.forEach(game => {
      dayCell.appendChild(createGameSquare(game));
    });

    // ✅ ADD CLICK HANDLER (this was missing)
    dayCell.addEventListener("click", () => {
      populateDayDetail(dateKey, gamesForDay);
    });

    grid.appendChild(dayCell);
  });
   monthEl.classList.add("is-october");
}
  // ✅ ALL OTHER MONTHS: full calendar
  else {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-day empty";
      grid.appendChild(empty);
    }

    // Full month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayCell = document.createElement("div");
      dayCell.className = "calendar-day";

      const label = formatCalendarDayLabel(dateKey);
      const labelEl = document.createElement("div");
      labelEl.className = "calendar-day-label";
      labelEl.innerHTML = `
        <span class="day-name">${label.day}</span>
        <span class="day-num">${label.date}</span>
      `;

      dayCell.appendChild(labelEl);

      const gamesForDay = GAMES_BY_DATE[dateKey] || [];

    gamesForDay.forEach(game => {
      const square = createGameSquare(game);
      dayCell.appendChild(square);
    });

    // 👇 CLICK THE WHOLE DAY
    if (gamesForDay.length) {
      dayCell.classList.add("has-games");
      dayCell.addEventListener("click", () => {
        populateDayDetail(dateKey, gamesForDay);
      });
    }

      grid.appendChild(dayCell);
    }
  }

  monthEl.appendChild(grid);
  parent.appendChild(monthEl);
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

  header.textContent = `GAMES · ${formatDateLabel(dateKey, "full")}`;

  detail.appendChild(header);

  /* ---------- GAME ROW ---------- */
  const gamesRow = document.createElement("div");
  gamesRow.className = "game-day-games";

  games.forEach(game => {
    gamesRow.appendChild(buildSingleGameDetail(game));
  });

  detail.appendChild(gamesRow);
}

function buildSingleGameDetail(game) {
  const team = TEAM_BY_ID[game.team_id];

  const wrap = document.createElement("section");
  wrap.className = "game-detail-block";
  wrap.dataset.team = game.team_id;

  const teamName = team.team_name;
  const opponentName = game.opponent;

  const matchupHTML = `
    <span class="game-team">${teamName}</span>
    <span class="vs">vs</span>
    <span class="game-opponent">${opponentName}</span>
  `;

  const dateText = formatDateLabel(game.date, "day-date");

  const scoreText =
    game.team_score && game.opp_score
      ? `${game.result || ""} ${game.team_score}–${game.opp_score}`
      : "Upcoming game";

  // 🔹 SCORE BAR MATH
  const teamScore = Number(game.team_score) || 0;
  const oppScore  = Number(game.opp_score) || 0;
  const totalScore = teamScore + oppScore;

  const teamPct = totalScore ? (teamScore / totalScore) * 100 : 0;
  const oppPct  = totalScore ? (oppScore / totalScore) * 100 : 0;

  const locationText =
    [game.arena, game.location_city, game.location_state]
      .filter(Boolean)
      .join(", ");

  wrap.innerHTML = `
    <div class="game-matchup">
      ${matchupHTML}
    </div>

    <div class="game-date">
      ${dateText}${game.venue ? ` • ${game.venue.toUpperCase()}` : ""}
    </div>

    <div class="game-score">
      ${scoreText}
    </div>

    ${
      totalScore
        ? `
    <div class="score-bar"
         data-team="${game.team_id}"
         style="--team-pct:${teamPct}%; --opp-pct:${oppPct}%">

      <div class="score-bar-team"></div>
      <div class="score-bar-opponent"></div>
    </div>
    `
        : ""
    }

    ${locationText ? `<div class="game-location">${locationText}</div>` : ""}

    <div class="game-links">
      ${buildGameLinks(game)}
    </div>

    <div class="game-stats-shell" id="stats-${game.game_id}">
      ${
        game.has_stats
          ? `<button onclick="loadGameStats('${game.game_id}')">Load stats</button>`
          : `<em>No stats available</em>`
      }
    </div>
  `;

  return wrap;
}

function createGameSquare(game) {
  const team = TEAM_BY_ID[game.team_id];

  const square = document.createElement("div");
  square.className = "calendar-game";
  square.dataset.gameId = game.game_id;

  // color by team
  if (team?.branding?.colors?.secondary) {
    square.dataset.team = game.team_id;

  }

  // label for the calendar team gameday squares (to add back in if i want....)
 // square.textContent = team.team_name;

  // visual flag if stats exist
  if (game.has_stats) {
    square.classList.add("has-stats");
  }

/* COMMENTED OUT TO DISABLE SINGLE GAME (with color block on gameday, specific to team)
  square.addEventListener("click", () => {
    onGameSelected(game);
  });
*/

  return square;
}

/* COMMENTED OUT TO DISABLE SINGLE GAME (with color block on gameday, specific to team)
function onGameSelected(game) {
  populateGameDetail(game);
}
*/

/* COMMENTED OUT TO DISABLE SINGLE GAME (with color block on gameday, specific to team)
function populateGameDetail(game) {
  const team = TEAM_BY_ID[game.team_id];
  const detail = document.getElementById("game-detail");

  if (!team || !detail) return;

  detail.classList.remove("hidden");
  detail.dataset.team = game.team_id;

  const title = detail.querySelector("#game-title");
  const meta = detail.querySelector("#game-meta");
  const location = detail.querySelector("#game-location");
  const result = detail.querySelector("#game-result");

  if (!title || !meta || !result) {
    console.warn("Game detail DOM missing required elements");
    return;
  }

  title.textContent =
    game.venue === "home"
      ? `${team.team_name} vs ${game.opponent}`
      : `${game.opponent} vs ${team.team_name}`;

  meta.textContent = `${game.date} • ${game.venue?.toUpperCase() || ""}`;

  location.textContent =
    [game.arena, game.location_city, game.location_state]
      .filter(Boolean)
      .join(", ");

  result.textContent =
    game.result && game.team_score != null
      ? `${game.result}: ${game.team_score} – ${game.opp_score}`
      : "Future game";

    const statsContainer = document.getElementById("game-stats-container");
    const loadBtn = document.getElementById("load-game-stats");
    const statsContent = document.getElementById("game-stats-content");

    // Reset state
    statsContent.innerHTML = "";
    statsContent.dataset.loaded = "false";

    // Reset previous game styling
    statsContainer.style.backgroundColor = "";
    statsContainer.style.color = "";
    statsContainer.classList.add("hidden");

    if (game.has_stats) {
        statsContainer.classList.remove("hidden");

        loadBtn.onclick = () => {
        loadGameStats(game);
        };
    }
}
*/
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

  fetch(`/courts/jax-ball-data/game_stats_json/${gameId}.json`)
    .then(res => res.json())
    .then(stats => {
      renderGameStatsInto(stats, statsShell);
    })
    .catch(err => {
      console.error("Failed to load game stats:", err);
      statsShell.innerHTML = "<em>Game stats unavailable.</em>";
    });
}


function renderGameStatsInto(stats, container) {
  container.innerHTML = "";

  /* --- Score by period commented out to disable for now --- */
/*const score = document.createElement("div");
  score.className = "stats-score";
  score.textContent = "Score by Period";
  container.appendChild(score);

  const sbp = stats.score_by_period || {};

  if (sbp.away) {
    container.appendChild(
      Object.assign(document.createElement("div"), {
        textContent: `Opponent: ${sbp.away.join(" / ")}`
      })
    );
  }

  if (sbp.home) {
    container.appendChild(
      Object.assign(document.createElement("div"), {
        textContent: `Team: ${sbp.home.join(" / ")}`
      })
    );
  } */

  /* --- Player stats table --- */
  const table = document.createElement("table");
  table.className = "stats-table";

table.innerHTML = `
  <thead>
    <tr>
      <th data-stat="Player">Player</th>
      <th data-stat="Points">PTS</th>
      <th data-stat="Rebounds">REB</th>
      <th data-stat="Assists">AST</th>
      <th data-stat="Minutes">MIN</th>
    </tr>
  </thead>
  <tbody></tbody>
`;

  stats.players?.home?.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatPlayer(p)}</td>
      <td>${num(p.pts)}</td>
      <td>${getPlayerReb(p)}</td>
      <td>${num(p.ast)}</td>
      <td>${num(p.minutes)}</td>
    `;
    table.querySelector("tbody").appendChild(row);
  });

  container.appendChild(table);

  /* --- Leaders --- */
  const leaders = getStatLeaders(stats.players?.home);
  if (leaders) {
    const leadersSection = document.createElement("div");
    leadersSection.className = "stats-leaders";

    leadersSection.innerHTML = `
      <strong>Leaders</strong><br>
      ${leaders.topScorer ? `PTS: ${formatPlayer(leaders.topScorer)}` : ""}
      ${leaders.topRebounder ? `<br>REB: ${formatPlayer(leaders.topRebounder)}` : ""}
      ${leaders.topAssists ? `<br>AST: ${formatPlayer(leaders.topAssists)}` : ""}
    `;

    container.appendChild(leadersSection);
  }
}

function getStatLeaders(players) {
  if (!players || !players.length) return null;

  let topScorer = null;
  let topRebounder = null;
  let topAssists = null;

  players.forEach(p => {
    const pts = getStatValue(p, "pts");
    const reb = getStatValue(p, "reb");
    const ast = getStatValue(p, "ast");

    if (!topScorer || pts > getStatValue(topScorer, "pts")) {
      topScorer = p;
    }

    if (!topRebounder || reb > getStatValue(topRebounder, "reb")) {
      topRebounder = p;
    }

    if (!topAssists || ast > getStatValue(topAssists, "ast")) {
      topAssists = p;
    }
  });

  return { topScorer, topRebounder, topAssists };
}



