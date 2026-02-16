(function () {

  const { normalizePlayerId, normalizeJersey } = window.Normalization;

  // ─────────────────────────────
  // Local helpers (pure)
  // ─────────────────────────────
  function num(val) {
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : n;
  }

    function getRebounds(p) {
    /*
        @TECH-DEBT
        TEMP DATA COMPATIBILITY SHIM

        Rebound fields differ by team/source:
        - JU: total_reb
        - Others: reb
        - Some box scores: trb

        Remove once Python build step
        outputs a unified `reb` field.
    */
    return num(
        p.total_reb ??
        p.reb ??
        p.trb ??
        0
    );
    }

  function buildPlayerSeasonStats({ DATA, DataLoader, PLAYER_BY_ID }) {
    const PLAYER_SEASON_STATS = {};

    const statFetches = DATA.games
      .filter(game => game.has_stats)
      .map(game =>
        DataLoader.loadGameStats(game.game_id)
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

    return Promise.all(statFetches).then(() => PLAYER_SEASON_STATS);
  }

  window.PlayerSeasonStats = {
    buildPlayerSeasonStats
  };

})();
