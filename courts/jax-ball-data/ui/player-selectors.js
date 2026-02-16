(function () {

  function hasAnyGameLeader(player) {
    const lc = player.leader_counts;
    return !!lc && (lc.pts + lc.reb + lc.ast) > 0;
  }

  function getTopPlayersByTeam(ctx) {
    const {
      PLAYER_SEASON_STATS,
      CURRENT_STAT,
      CURRENT_MODE,
      getPlayerValue
    } = ctx;

    if (!PLAYER_SEASON_STATS || !CURRENT_STAT) return {};

    const byTeam = {};

    Object.values(PLAYER_SEASON_STATS).forEach(player => {
      (byTeam[player.team_id] ??= []).push(player);
    });

    Object.keys(byTeam).forEach(teamId => {
      byTeam[teamId] = byTeam[teamId]
        .filter(p => getPlayerValue(p, CURRENT_STAT, CURRENT_MODE) > 0)
        .sort(
          (a, b) =>
            getPlayerValue(b, CURRENT_STAT, CURRENT_MODE) -
            getPlayerValue(a, CURRENT_STAT, CURRENT_MODE)
        )
        .slice(0, 5);
    });

    return byTeam;
  }

  function getActivePlayers(ctx) {
    const {
      VIEW_MODE,
      PLAYER_SEASON_STATS
    } = ctx;

    if (!PLAYER_SEASON_STATS) return [];

    if (VIEW_MODE === "all") {
      return Object.values(PLAYER_SEASON_STATS);
    }

    if (VIEW_MODE === "leaders") {
      return Object.values(getTopPlayersByTeam(ctx)).flat();
    }

    if (VIEW_MODE === "game-leaders") {
      return Object.values(PLAYER_SEASON_STATS).filter(hasAnyGameLeader);
    }

    return [];
  }

  window.PlayerSelectors = {
    hasAnyGameLeader,
    getTopPlayersByTeam,
    getActivePlayers
  };

})();
