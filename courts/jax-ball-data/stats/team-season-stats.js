(function () {

  const { normalizePlayerId } = window.Normalization;

  // Local helpers (kept here intentionally)
  function num(val) {
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : n;
  }

  function getPlayerReb(p) {
    /*
      @TECH-DEBT
      TEMP DATA COMPATIBILITY SHIM

      Rebound fields differ by team/source.
      Remove once Python build step outputs unified `reb`.
    */
    return num(
      p.total_reb ??
      p.reb ??
      p.trb ??
      0
    );
  }

  function buildTeamSeasonStats({
    DATA,
    GAME_STATS_BY_ID
  }) {
    const TEAM_PLAYER_TOTALS = {};
    const TEAM_LEADERS = {};

    // ─────────────────────────────
    // 1️⃣ Build team player totals
    // ─────────────────────────────
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

          const totals = TEAM_PLAYER_TOTALS[teamId][pid].totals;
          totals.pts += num(p.pts);
          totals.reb += getPlayerReb(p);
          totals.ast += num(p.ast);
        });
      });

    // ─────────────────────────────
    // 2️⃣ Determine team leaders
    // ─────────────────────────────
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

    return {
      TEAM_PLAYER_TOTALS,
      TEAM_LEADERS
    };
  }

  window.TeamSeasonStats = {
    buildTeamSeasonStats
  };

})();
