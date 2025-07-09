Promise.all([
  fetch('teams-wnba.json').then(res => res.json()),
  fetch('../article-pages/articles-meta.json').then(res => res.json())
]).then(([teams, articles]) => {
  const menu = document.getElementById("teams-menu");
  const content = document.getElementById("team-content");

  teams.forEach((team, idx) => {
    const btn = document.createElement("button");
    btn.textContent = team.name;
    btn.addEventListener("click", () => showTeam(team, btn));
    if (idx === 0) btn.classList.add("active");
    menu.appendChild(btn);
  });

  // Show first team by default
  if (teams.length) showTeam(teams[0], menu.querySelector("button"));

  function showTeam(team, btn) {
    // Remove active from all
    menu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Find articles tagged with this team
    const teamArticles = articles.filter(article =>
      article.tags.some(tag =>
        tag.toLowerCase() === team.name.toLowerCase() ||
        tag.toLowerCase() === team.code.replace(/-/g, ' ')
      )
    );

    let articlesHtml = '';
    if (teamArticles.length) {
      articlesHtml = `
        <div class="team-articles">
          <h3>Related Articles</h3>
          <ul>
            ${teamArticles.map(a => `<li><a href="${a.url}">${a.title}</a></li>`).join('')}
          </ul>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="team-tab-bar">
        <span class="team-tab-name">${team.name}</span>
      </div>
      <div class="team-content-inner">
        <div class="team-logo-row">
          <img src="${team.logo}" alt="${team.name} Logo" class="team-logo" />
          <img src="${team.palette}" alt="${team.name} Color Palette" class="team-palette" />
        </div>
        <div class="team-court-row">
          <svg 
              class="team-court"
              viewBox="0 0 132.29 79.375"
              aria-label="Court"
              style="
                --court-main: ${team.courtColors?.main || '#fff'};
                --court-boundbox-lines: ${team.courtColors?.lines || '#000'};
                --court-main-lines: ${team.courtColors?.accent || '#000'};
              "
            >
              <use href="#court"></use>
          </svg>
        </div>
        ${articlesHtml}
      </div>
    `;
  }
});