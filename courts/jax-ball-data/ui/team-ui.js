(function () {

  function renderExpandedTeam({
    teamId,
    container,
    DATA,
    TEAM_BY_ID,
    getTeamRecord,
    SCHOOL_NAME_BY_TEAM
  }) {
    const team = DATA.teams[teamId];
    if (!team || !container) return;

    container.dataset.team = teamId;

    const record = getTeamRecord(teamId);

    const recordClass =
      record.wins > record.losses ? "winning" :
      record.losses > record.wins ? "losing" : "";

    const schoolName =
      team.school_name ||
      team.school ||
      team.team_name;

    const teamPageUrl = `/courts/jax-ball-data/main_courts/${teamId}_maincourt.html`;

    container.innerHTML = `
      <div class="team-details-inner">

        <div class="team-title-row">
          <span class="team-school-name">
            ${schoolName}
          </span>

          <span class="team-record ${recordClass}">
            ${record.wins}–${record.losses}
          </span>
        </div>

        <div class="team-page-link">
          <a href="${teamPageUrl}">
            View full team page →
          </a>
        </div>

        <div class="team-colors">
          <span class="color-swatch primary"></span>
          <span class="color-swatch secondary"></span>
          <span class="color-swatch accent"></span>
        </div>

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

  function renderStaticTeam({
    teamId,
    container,
    DATA,
    TEAM_LEADERS,
    getTeamRecord,
    SCHOOL_NAME_BY_TEAM,
    formatPlayer
  }) {
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

        <div class="team-title-row">
          <span class="team-school-name">
            ${schoolName}
          </span>
          <span class="team-record ${recordClass}">
            ${record.wins}–${record.losses}
          </span>
        </div>

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

        <div class="team-page-link">
          <a href="${teamPageUrl}" target="_blank">
            View team page →
          </a>
        </div>

      </div>
    `;
  }

  window.TeamUI = {
    renderExpandedTeam,
    renderStaticTeam
  };

})();
