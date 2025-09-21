document.addEventListener("DOMContentLoaded", () => {
  // Utility: group matchups by date
  function groupByDate(matchups) {
    const groups = {};
    matchups.forEach(m => {
      const date = m.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }
 
  // Load JSON data
  Promise.all([
    fetch('jul19-w-matchups.json').then(res => res.json()),
    fetch('wnba-teams.json').then(res => res.json())
  ]).then(([matchupData, teamsData]) => {
    const matchupList = document.getElementById('matchup-list');
    matchupList.innerHTML = '';
    const grouped = groupByDate(matchupData.matchups);

    Object.entries(grouped).forEach(([date, matchups]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'date-group';
      groupDiv.innerHTML = `<div class="date-sticky">${date}</div>`;
      matchups.forEach(matchup => {
        groupDiv.innerHTML += `
          <div class="matchup-row" data-matchup-id="${matchup.id}">
            ${buildTicket(matchup.home, teamsData, true, matchup)}
            ${buildTicket(matchup.away, teamsData, false, matchup)}
          </div>
        `;
      });
      matchupList.appendChild(groupDiv);
    });
  });

  // Ticket builder
  function buildTicket(team, teamsData, isHome, matchup) {
    // Get team colors from teamsData
    const teamInfo = teamsData[team.teamName] || {};
    const colors = teamInfo.colors || {};
    // Fallbacks
    const primary = colors.primary || "#f3f1c9";
    const secondary = colors.secondary || "#222";
    const accent = colors.accent || "#222";

    // Format date as MM/DD/YY
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // fallback if parsing fails
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

    // Ticket type
    const ticketType = isHome ? "home" : "away";

    // Build facts list
    const factsHtml = (team.factsContent || []).map(fact => {
      let label = fact.label;
      if (label.includes('conference ranking')) label = 'conf. rank';
      if (label === 'overall ranking') label = 'overall rank';
      if (label === 'W/L') label = 'W/L';
      return `<div class="info ${label.replace(/\s+/g, '-').toLowerCase()}">
        <div class="info__detail">${label}: ${fact.value}</div>
      </div>`;
    }).join('');

    // Build ticket HTML
    return `
      <div class="ticket ${ticketType}" 
        data-team="${team.teamCode}" 
        data-conference="${team.conference}" 
        data-favorite="${team.favorite}"
        style="--team-primary:${primary};--team-secondary:${secondary};--team-accent:${accent};">
        <div class="ticket__main">
          <div class="ticket-header">
            ${isHome ? `
          <div class="team-home ticket-header-label"><div class="info__detail"><p>home game</p></div></div>
          <div class="team-name"><p>${team.teamName}</p></div>
        ` : `
          <div class="team-name"><p>${team.teamName}</p></div>
          <div class="team-away ticket-header-label"><div class="info__detail"><p>away game</p></div></div>
            `}
          </div>
          <div class="info-section">
            <div class="info date"><div class="info__detail">${matchup.date}</div></div>
            <div class="info time"><div class="info__detail">${matchup.time || ''}</div></div>
            <div class="info conference"><div class="info__detail">${team.conference}ern conference</div></div>
            <div class="info win-loss-record"><div class="info__detail">W/L ${team.wlRecord}</div></div>
          </div>
          <div class="logo-container">
            <div class="team-logo-block" data-team="${team.teamCode.toLowerCase()}">
              <img class="team-logo" src="/${team.defaultContent.img}" alt="${team.teamName} logo" />
            </div>
          </div>
          <div class="fineprint">
            <p>check the w-kit to find more info on where to watch games and content creators to watch for post-game commentary</p>
            <p>don't forget to eat and smile today</p>
          </div>
        </div>
        <div class="ticket__tearaway">
          <div class="logo">
            <div class="team-logo-block" data-team="${team.teamCode.toLowerCase()}">
              <img class="team-logo" src="/${team.defaultContent.img.replace('.svg', '-negative.svg')}" alt="${team.teamName} negative logo" />
            </div>
          </div>
                    ${isHome ? `
            <div class="team-home ticket-tearaway-label"><div class="info__detail"><p>home game</p></div></div>
          ` : `
            <div class="team-away ticket-tearaway-label"><div class="info__detail"><p>away game</p></div></div>
          `}
          <div class="info tearaway-team-name"><div class="info__detail">${team.wlRecord}</div></div>
          <div class="info tearaway-conference"><div class="info__detail">${team.conference}  #${team.conferenceRanking}</div></div>
          <div class="info tearaway-overall-rank-label"><div class="info__detail">league: #${team.overallRanking}</div></div>
          <div class="info tearaway-date"><div class="info__detail">${formatShortDate(matchup.date)}</div></div>          
          <div class="info tearaway-time"><div class="info__detail">${matchup.time || ''}</div></div>
        </div>
      </div>
    `;
  }
});