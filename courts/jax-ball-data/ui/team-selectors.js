(function () {

  // Internal cache (not global anymore)
  const TEAM_RECORD_CACHE = {};

  function clearTeamRecordCache() {
    Object.keys(TEAM_RECORD_CACHE).forEach(k => delete TEAM_RECORD_CACHE[k]);
  }

  function getTeamRecord({ DATA }, teamId) {
    if (!DATA || !DATA.games) {
      return { wins: 0, losses: 0 };
    }

    if (TEAM_RECORD_CACHE[teamId]) {
      return TEAM_RECORD_CACHE[teamId];
    }

    let wins = 0;
    let losses = 0;

    DATA.games.forEach(game => {
      if (game.team_id !== teamId) return;

      // Only completed games
      if (game.team_score == null || game.opp_score == null) return;

      if (game.team_score > game.opp_score) wins++;
      else if (game.team_score < game.opp_score) losses++;
    });

    const record = { wins, losses };
    TEAM_RECORD_CACHE[teamId] = record;
    return record;
  }

  window.TeamSelectors = {
    getTeamRecord,
    clearTeamRecordCache
  };

})();
