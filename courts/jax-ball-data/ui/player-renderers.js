(function () {

  function clearAllColumns() {
    document.querySelectorAll(".player-card-grid").forEach(col => {
      col.innerHTML = "";
    });
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

    function renderAllPlayers(ctx) {
    const {
        PLAYER_SEASON_STATS,
        PLAYER_VIEW,
        getJerseyNumber,
        buildPlayerCard,
        buildExtendedPlayerCard
    } = ctx;
    const byTeam = {};

    Object.values(PLAYER_SEASON_STATS).forEach(player => {
      (byTeam[player.team_id] ??= []).push(player);
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
            ? buildExtendedPlayerCard(player, ctx)
            : buildPlayerCard(player, ctx);

        column.appendChild(card);
      });
    });
  }

function renderLeaders(ctx) {
  const {
    CURRENT_STAT,
    CURRENT_MODE,
    LAYOUT_MODE,
    PLAYER_VIEW,
    getTopPlayersByTeam,
    buildPlayerCard,
    buildExtendedPlayerCard
  } = ctx;
    if (LAYOUT_MODE === "global") return;

    const leadersByTeam = getTopPlayersByTeam(ctx);

    Object.entries(leadersByTeam).forEach(([teamId, players]) => {
      const column = document.querySelector(
        `.team-column[data-team="${teamId}"] .player-card-grid`
      );
      if (!column) return;

      players.forEach(player => {
        const card =
          PLAYER_VIEW === "extended"
            ? buildExtendedPlayerCard(player, ctx)
            : buildPlayerCard(player, ctx, true);

        column.appendChild(card);
      });
    });
  }

function renderGameLeaders(ctx) {
  const {
    PLAYER_SEASON_STATS,
    PLAYER_VIEW,
    hasAnyGameLeader,
    buildPlayerCard,
    buildExtendedPlayerCard
  } = ctx;

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
            ? buildExtendedPlayerCard(player, ctx)
            : buildPlayerCard(player, ctx, false, true);

        column.appendChild(card);
      });
    });
  }

  function renderGlobalPlayers(ctx) {
  const {
    VIEW_MODE,
    CURRENT_STAT,
    CURRENT_MODE,
    PLAYER_VIEW,
    PLAYER_SEASON_STATS,
    getPlayerValue,
    getJerseyNumber,
    hasAnyGameLeader,
    buildPlayerCard,
    buildExtendedPlayerCard,
    getActivePlayers
  } = ctx;

    const grid = document.querySelector("#global-player-grid");
    if (!grid) return;

    grid.innerHTML = "";

    const players = getActivePlayers(ctx);

    if (VIEW_MODE === "game-leaders") {
      players.sort((a, b) =>
        (b.leader_counts.pts + b.leader_counts.reb + b.leader_counts.ast) -
        (a.leader_counts.pts + a.leader_counts.reb + a.leader_counts.ast)
      );
    } else if (VIEW_MODE === "leaders") {
      players.sort((a, b) =>
        getPlayerValue(b, CURRENT_STAT, CURRENT_MODE) -
        getPlayerValue(a, CURRENT_STAT, CURRENT_MODE)
      );
    } else {
      players.sort((a, b) => getJerseyNumber(a) - getJerseyNumber(b));
    }

    players.forEach(player => {
      const card =
        PLAYER_VIEW === "extended"
          ? buildExtendedPlayerCard(player, ctx)
          : buildPlayerCard(
              player,
              ctx,
              VIEW_MODE === "leaders",
              VIEW_MODE === "game-leaders"
            );

      grid.appendChild(card);
    });
  }

  function renderPlayerCards(ctx) {
    clearAllColumns();

    if (ctx.LAYOUT_MODE === "global") {
      showGlobalLayout();
      renderGlobalPlayers(ctx);
      return;
    }

    showTeamLayout();

    if (ctx.VIEW_MODE === "all") {
      renderAllPlayers(ctx);
    } else if (ctx.VIEW_MODE === "leaders") {
      renderLeaders(ctx);
    } else if (ctx.VIEW_MODE === "game-leaders") {
      renderGameLeaders(ctx);
    }
  }

  window.PlayerRenderers = {
    renderPlayerCards
  };

})();
