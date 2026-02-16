(function () {
  let SITE_DATA_PROMISE = null;
  let SITE_DATA = null;

  // Reuse existing cache if present (jax-ball.js defines this)
  const GAME_STATS_CACHE = window.GAME_STATS_BY_ID || {};

  function loadSiteData() {
    if (SITE_DATA_PROMISE) return SITE_DATA_PROMISE;

    SITE_DATA_PROMISE = fetch("/courts/jax-ball-data/site_data.json")
      .then(res => res.json())
      .then(json => {
        SITE_DATA = json;
        return SITE_DATA;
      });

    return SITE_DATA_PROMISE;
  }

  function loadGameStats(gameId) {
    if (GAME_STATS_CACHE[gameId]) {
      return Promise.resolve(GAME_STATS_CACHE[gameId]);
    }

    return fetch(`/courts/jax-ball-data/game_stats_json/${gameId}.json`)
      .then(res => res.json())
      .then(stats => {
        GAME_STATS_CACHE[gameId] = stats;
        return stats;
      });
  }

  function loadAllGameStats(games) {
    const gamesWithStats = games.filter(g => g.has_stats);

    return Promise.all(
      gamesWithStats.map(game =>
        loadGameStats(game.game_id).catch(() => {
          console.warn("Missing stats for game:", game.game_id);
        })
      )
    );
  }

  window.DataLoader = {
    loadSiteData,
    loadGameStats,
    loadAllGameStats
  };
})();

window.loadGameStats = function (gameId) {
  return DataLoader.loadGameStats(gameId);
};
