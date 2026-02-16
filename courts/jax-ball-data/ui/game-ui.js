(function () {

  function buildGameLinks(game) {
    if (!game.links) return "";

    return Object.entries(game.links)
      .map(([key, url]) => `<a href="${url}" target="_blank">${key}</a>`)
      .join(" • ");
  }

  function getStatLeaders(players, getStatValue) {
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

  function renderGameStatsInto({
    stats,
    container,
    PLAYER_BY_ID,
    normalizeJersey,
    getPlayerReb,
    getStatValue
  }) {
    container.innerHTML = "";

    const table = document.createElement("table");
    table.className = "stats-table";

    table.innerHTML = `
      <thead>
        <tr>
          <th>Player</th>
          <th>PTS</th>
          <th>REB</th>
          <th>AST</th>
          <th>MIN</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    stats.players?.home?.forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${
          Formatters.formatPlayer(p, {
            PLAYER_BY_ID,
            normalizeJersey
          })
        }</td>
        <td>${Formatters.num(p.pts)}</td>
        <td>${getPlayerReb(p)}</td>
        <td>${Formatters.num(p.ast)}</td>
        <td>${Formatters.num(p.minutes)}</td>
      `;

      table.querySelector("tbody").appendChild(row);
    });

    container.appendChild(table);

    const leaders = getStatLeaders(stats.players?.home, getStatValue);
    if (leaders) {
      const leadersSection = document.createElement("div");
      leadersSection.className = "stats-leaders";

      leadersSection.innerHTML = `
        <strong>Leaders</strong><br>
        ${
          leaders.topScorer
            ? `PTS: ${
                Formatters.formatPlayer(leaders.topScorer, {
                  PLAYER_BY_ID,
                  normalizeJersey
                })
              }`
            : ""
        }
        ${
          leaders.topRebounder
            ? `<br>REB: ${
                Formatters.formatPlayer(leaders.topRebounder, {
                  PLAYER_BY_ID,
                  normalizeJersey
                })
              }`
            : ""
        }
        ${
          leaders.topAssists
            ? `<br>AST: ${
                Formatters.formatPlayer(leaders.topAssists, {
                  PLAYER_BY_ID,
                  normalizeJersey
                })
              }`
            : ""
        }
      `;

      container.appendChild(leadersSection);
    }
  }

  function buildSingleGameDetail({
    game,
    TEAM_BY_ID,
    buildGameLinks
  }) {
    const team = TEAM_BY_ID[game.team_id];

    const wrap = document.createElement("section");
    wrap.className = "game-detail-block";
    wrap.dataset.team = game.team_id;

    const dateText = Formatters.formatDateLabel(game.date, "day-date");

    const scoreText =
      game.team_score && game.opp_score
        ? `${game.result || ""} ${game.team_score}–${game.opp_score}`
        : "Upcoming game";

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
        <span class="game-team">${team.team_name}</span>
        <span class="vs">vs</span>
        <span class="game-opponent">${game.opponent}</span>
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

  window.GameUI = {
    buildSingleGameDetail,
    renderGameStatsInto,
    buildGameLinks
  };

})();

// ui/game-ui.js

function getPlayerReb(p) {
  if (p.total_reb != null) return Formatters.num(p.total_reb);
  if (p.reb != null) return Formatters.num(p.reb);
  return 0;
}

function getStatValue(p, stat) {
  switch (stat) {
    case "pts": return Formatters.num(p.pts);
    case "reb": return Formatters.num(p.total_reb ?? p.reb);
    case "ast": return Formatters.num(p.ast);
    default: return 0;
  }
}

window.GameStatHelpers = {
  getPlayerReb,
  getStatValue
};

