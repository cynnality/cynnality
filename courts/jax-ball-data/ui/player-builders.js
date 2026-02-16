(function () {

  function stylizePlayerName(name) {
    if (!name) return "";

    const parts = name.split(" ");

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

  function getPlayerMeta(player, PLAYER_BY_ID) {
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

  function getTeamLeaders(teamId, PLAYER_SEASON_STATS) {
    const players = Object.values(PLAYER_SEASON_STATS)
      .filter(p => p.team_id === teamId);

    const leaders = {
      pts: null,
      reb: null,
      ast: null
    };

    players.forEach(p => {
      if (!leaders.pts || p.totals.pts > leaders.pts.totals.pts) leaders.pts = p;
      if (!leaders.reb || p.totals.reb > leaders.reb.totals.reb) leaders.reb = p;
      if (!leaders.ast || p.totals.ast > leaders.ast.totals.ast) leaders.ast = p;
    });

    return leaders;
  }

  function buildPlayerCard(player, ctx, leadersMode = false, gameLeadersMode = false) {
    const {
      PLAYER_BY_ID,
      TEAM_BY_ID,
      STAT_LABELS,
      CURRENT_STAT,
      CURRENT_MODE,
      getPlayerValue,
      getTeamDisplayName,
      formatShortDate
    } = ctx;

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
                <div class="pstat"><div class="pre">points:</div><div class="post">${player.totals.pts}</div></div>
                <div class="pstat"><div class="pre">rebounds:</div><div class="post">${player.totals.reb}</div></div>
                <div class="pstat"><div class="pre">assists:</div><div class="post">${player.totals.ast}</div></div>
                <div class="pstat"><div class="pre">steals:</div><div class="post">${player.totals.stl}</div></div>
              </div>
            `
        }
        <div class="pstat">
          <div class="pre"># of games played:</div>
          <div class="post">${player.games_played}</div>
        </div>
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

      card.innerHTML += `
        <section class="receipt-block stat-summary">
          <div class="stat-title">Game Leader Appearances</div>
          <div class="stat-value">${totalLeads}</div>
          <div class="stat-suffix">games led</div>
        </section>

        ${
          gamesHtml
            ? `
            <section class="receipt-block player-game-leads">
              <h4>Games Led Team</h4>
              <ul>${gamesHtml}</ul>
            </section>
            `
            : ""
        }
      `;
    }

    return card;
  }

  function buildExtendedPlayerCard(player, ctx) {
    const {
      PLAYER_BY_ID,
      PLAYER_SEASON_STATS,
      getTeamDisplayName,
      formatShortDate,
      STAT_LABELS
    } = ctx;

    const meta = getPlayerMeta(player, PLAYER_BY_ID);
    const teamLeaders = getTeamLeaders(player.team_id, PLAYER_SEASON_STATS);
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
        <div class="pstat"><div class="pre">pts</div><div class="post">${player.totals.pts}</div></div>
        <div class="pstat"><div class="pre">reb</div><div class="post">${player.totals.reb}</div></div>
        <div class="pstat"><div class="pre">ast</div><div class="post">${player.totals.ast}</div></div>
      </section>

      ${
        highGame
          ? `<section class="player-highlight">
              <strong>Highest Scoring Game:</strong>
              ${highGame.values.pts} pts vs ${highGame.opponent}
            </section>`
          : ""
      }

      <section class="player-leaders">
        ${isTeamLeader("pts") ? `<div>TEAM LEADER - Points</div>` : ""}
        ${isTeamLeader("reb") ? `<div>TEAM LEADER - Rebounds</div>` : ""}
        ${isTeamLeader("ast") ? `<div>TEAM LEADER - Assists</div>` : ""}
      </section>
    `;

    return card;
  }

  window.PlayerBuilders = {
    buildPlayerCard,
    buildExtendedPlayerCard
  };

})();
