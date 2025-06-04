document.addEventListener("DOMContentLoaded", () => {



  document.querySelectorAll('.team-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const cardBody = this.closest('.card-body');
      if (cardBody) {
        if (this.checked) {
          cardBody.classList.add('show-facts');
        } else {
          cardBody.classList.remove('show-facts');
        }
      }
    });
  });



  // Wpage navigation
  const wpageButtons = document.querySelectorAll(".wpage[data-content]");
  const contentSections = document.querySelectorAll(".tablewindow .content");

  // Only show content when a wpage is clicked (none visible at first)
  contentSections.forEach(section => section.classList.add("hidden"));
  wpageButtons.forEach(btn => btn.classList.remove("active"));

  wpageButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const contentId = btn.getAttribute("data-content");
      contentSections.forEach(section => {
        section.classList.add("hidden");
        section.classList.remove("visible");
      });
      const contentToShow = document.getElementById(contentId);
      if (contentToShow) {
        contentToShow.classList.remove("hidden");
        contentToShow.classList.add("visible");
      }
      wpageButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  if (wpageButtons.length > 0) wpageButtons[0].click();

  // Group matchups by date
function groupByDate(matchups) {
  const groups = {};
  matchups.forEach(m => {
    const date = m.date; // Add 'date' to each matchup in your JSON if not present
    if (!groups[date]) groups[date] = [];
    groups[date].push(m);
  });
  return groups;
}

let matchupData = null;
let matchupBlurbs = null;

Promise.all([
  fetch('app/wnba-2025-week-05.json').then(res => res.json()),
  fetch('app/matchup-blurbs-week-2025-05.json').then(res => res.json())
]).then(([data, blurbs]) => {
  matchupData = data;
  matchupBlurbs = blurbs;

  // Merge blurbs into matchups
  matchupData.matchups.forEach(m => {
    if (matchupBlurbs[m.id]) {
      m.pregame = matchupBlurbs[m.id].pregame;
      m.postgame = matchupBlurbs[m.id].postgame;
    }
  });

// Rendering
  fetch('app/wnba-2025-week-05.json')
    .then(res => res.json())
    .then(data => {
      const matchupList = document.getElementById('matchup-list');
      matchupList.innerHTML = '';
      const grouped = groupByDate(data.matchups);
      Object.entries(grouped).forEach(([date, matchups]) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'date-group';
        groupDiv.innerHTML = `<div class="date-sticky">${date}</div>`;
        matchups.forEach(matchup => {
          groupDiv.innerHTML += `
            <div class="matchup-row" data-matchup-id="${matchup.id}">
              ${buildTeamBlock(matchup.home, true)}
              ${buildTeamBlock(matchup.away, false)}
              <button class="toggle-pregame-btn">Pre-Game</button>
              <button class="game-update-btn">Post-Game</button>
              <div class="matchup-extra hidden"></div>
            </div>
          `;
        });
        matchupList.appendChild(groupDiv);
      });
    });

  document.addEventListener('click', function(e) {
  // Pregame/Postgame faux window logic
  if (e.target.classList.contains('toggle-pregame-btn') || e.target.classList.contains('game-update-btn')) {
    const matchupRow = e.target.closest('.matchup-row');
    if (!matchupRow) return;
    const matchupId = matchupRow.getAttribute('data-matchup-id');
    // Use your loaded JSON data (assume it's in a variable called matchupData)
    const matchup = matchupData.matchups.find(m => m.id === matchupId);
    const container = matchupRow.querySelector('.matchup-extra');
    if (!container || !matchup) return;
    if (e.target.classList.contains('toggle-pregame-btn')) {
      container.innerHTML = `
        <div class="faux-window pregame">
          <div class="faux-window-bar">
            <span class="faux-window-title">${matchup.pregame?.title || "Pre-Game"}</span>
            <button class="faux-window-close" aria-label="Close">&bull;</button>
          </div>
          <div class="faux-window-content">
            <p>${matchup.pregame?.content || "No pregame info available."}</p>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="faux-window postgame">
          <div class="faux-window-bar">
            <span class="faux-window-title">${matchup.postgame?.title || "Post-Game"}</span>
            <button class="faux-window-close" aria-label="Close">&bull;</button>
          </div>
          <div class="faux-window-content">
            <p>${matchup.postgame?.content || "No postgame info available."}</p>
          </div>
        </div>
      `;
    }
    container.classList.remove('hidden');
  }

  // Faux window close logic
  if (e.target.classList.contains('faux-window-close')) {
    const fauxWindow = e.target.closest('.faux-window');
    if (fauxWindow && fauxWindow.parentElement.classList.contains('matchup-extra')) {
      fauxWindow.parentElement.classList.add('hidden');
      fauxWindow.parentElement.innerHTML = '';
    }
  }
});




function buildTeamBlock(team, isHome, isFavorite) {
  const teamClass = team.teamName.toLowerCase().replace(/\s+/g, '-');
  const logoPath = team.defaultContent?.img || `assets/logos-wnba/${teamClass}-logo.svg`;
  // Icon paths
  const confIcon = team.conference === "east"
    ? "assets/icons/east.svg"
    : "assets/icons/west.svg";
  const homeAwayIcon = isHome
    ? "assets/icons/home.svg"
    : "assets/icons/visitor.svg";
  const favoriteIcon = team.favorite
    ? "assets/icons/favorite.svg"
    : null;

  // Tooltip text
  const confTip = team.conference === "east" ? "eastern conference" : "western conference";
  const homeAwayTip = isHome ? "home team" : "visiting team";
  const favoriteTip = "a fav of mine";

  return `
    <div class="team-card team-block ${teamClass}" data-team="${team.teamCode}" data-conference="${team.conference}"${team.favorite ? ' data-favorite="true"' : ''}>
      <div class="team-topbar">
        <img src="${confIcon}" class="icon conf-icon" alt="${confTip}" title="${confTip}">
        <img src="${homeAwayIcon}" class="icon homeaway-icon" alt="${homeAwayTip}" title="${homeAwayTip}">
        ${favoriteIcon ? `<img src="${favoriteIcon}" class="icon favorite-icon" alt="${favoriteTip}" title="${favoriteTip}">` : ""}
      </div>
      <div class="app">
        <div class="card-body">
          <div class="team-default-content">
            <img src="${logoPath}" alt="${team.defaultContent?.alt || team.teamName + ' Logo'}" class="team-logo" />
          </div>
          <div class="team-facts-content">
            <ul class="team-facts">
              ${team.factsContent.map(fact => {
                // Customize label display here
                let label = fact.label;
                if (label.includes('conference ranking')) label = 'conf. rank';
                if (label === 'overall ranking') label = 'overall rank';
                if (label === 'W/L') label = 'W/L';
                return `<li>${label}: ${fact.value}</li>`;
              }).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

  // Theme toggling
const greenSheet = document.getElementById('theme-greenmono');
const pinkSheet = document.getElementById('theme-pinknpurple');
document.querySelectorAll('input[name="theme"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.value === 'greenmono') {
      greenSheet.disabled = false;
      pinkSheet.disabled = true;
    } else if (this.value === 'pinknpurple') {
      greenSheet.disabled = true;
      pinkSheet.disabled = false;
    }
  });
});




  // Filtering logic
  document.addEventListener("click", function(e) {
    // Sport filter
    if (e.target.classList.contains("sport-btn")) {
      const selectedSport = e.target.getAttribute("data-sport");
      const currentContent = document.querySelector(".content.visible");
      if (!currentContent) return;
      // Highlight active sport button
      currentContent.querySelectorAll(".sport-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      // Filter matchups
      currentContent.querySelectorAll(".matchup-row").forEach(row => {
        const rowSport = row.getAttribute("data-sport");
        if (selectedSport === "all" || rowSport === selectedSport) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    }
    // Wday filter
    if (e.target.classList.contains("wday")) {
      const selectedWday = e.target.getAttribute("data-wday");
      const currentContent = document.querySelector(".content.visible");
      if (!currentContent) return;
      // Highlight active wday
      currentContent.querySelectorAll(".wday").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      // Filter matchups
      currentContent.querySelectorAll(".matchup-row").forEach(row => {
        const rowWday = row.getAttribute("data-wday");
        if (selectedWday === "all" || rowWday === selectedWday) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    }
  });
});
});
