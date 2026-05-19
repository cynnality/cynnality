// A REWORKED UPDATED VERSION OF PLAYER INDEX CARDS
// =================================================
// plyr-index-cards.js

// =======================================================
// Reusable player card element
// File location: /hooper_cards.js
// =======================================================

(() => {

const PLAYER_CARD_PATHS = {
  players: "basketball_101_data_files/wnba_olympic_players_v2.json",
  colleges: "basketball_101_data_files/wnba_colleges.json",
  teams: "basketball_101_data_files/wnba_static_data_v2.json",
  overseasLeagues: "basketball_101_data_files/overseas_leagues_data.json",
  overseasTeams: "basketball_101_data_files/overseas_teams_data.json",
  unrivaledTeams: "basketball_101_data_files/unrivaled_teams_data.json"
};

const CURRENT_DISPLAY_YEAR = 2026;

let PLAYER_CARDS = {};
let COLLEGES = {};
let TEAMS_BY_CODE = {};

let OVERSEAS_LEAGUES_BY_CODE = {};
let OVERSEAS_TEAMS_BY_CODE = {};
let UNRIVALED_TEAMS_BY_CODE = {};

// -------------------------------------------------------
// Load all required JSON files
// -------------------------------------------------------

async function loadPlayerIndexCardData() {
const [
  playersRes,
  collegesRes,
  teamsRes,
  overseasLeaguesRes,
  overseasTeamsRes,
  unrivaledTeamsRes
] = await Promise.all([
  fetch(PLAYER_CARD_PATHS.players),
  fetch(PLAYER_CARD_PATHS.colleges),
  fetch(PLAYER_CARD_PATHS.teams),
  fetch(PLAYER_CARD_PATHS.overseasLeagues),
  fetch(PLAYER_CARD_PATHS.overseasTeams),
  fetch(PLAYER_CARD_PATHS.unrivaledTeams)
]);

const playersData = await playersRes.json();
const collegesData = await collegesRes.json();
const teamsData = await teamsRes.json();
const overseasLeaguesData = await overseasLeaguesRes.json();
const overseasTeamsData = await overseasTeamsRes.json();
const unrivaledTeamsData = await unrivaledTeamsRes.json();

PLAYER_CARDS = playersData.players;
COLLEGES = collegesData.colleges;
TEAMS_BY_CODE = buildTeamsByCode(teamsData);

OVERSEAS_LEAGUES_BY_CODE = overseasLeaguesData.leagues;
OVERSEAS_TEAMS_BY_CODE = overseasTeamsData.teams;
UNRIVALED_TEAMS_BY_CODE = unrivaledTeamsData.teams;

  console.log("PLAYER_CARDS:", PLAYER_CARDS);
  console.log("COLLEGES:", COLLEGES);
  console.log("TEAMS_BY_CODE:", TEAMS_BY_CODE);
  console.log("OVERSEAS_LEAGUES_BY_CODE:", OVERSEAS_LEAGUES_BY_CODE);
  console.log("OVERSEAS_TEAMS_BY_CODE:", OVERSEAS_TEAMS_BY_CODE);
  console.log("UNRIVALED_TEAMS_BY_CODE:", UNRIVALED_TEAMS_BY_CODE);
}

// -------------------------------------------------------
// teamCode lookup
// -------------------------------------------------------
function buildTeamsByCode(teamsData) {
  const teamsByCode = {};

  Object.entries(teamsData.teams).forEach(([teamCode, team]) => {
    teamsByCode[teamCode] = team;
  });

  return teamsByCode;
}

function getTeamByCode(teamCode) {
  return TEAMS_BY_CODE?.[teamCode] || null;
}

// -------------------------------------------------------
// team colors & names (as text)
// -------------------------------------------------------
function getTeamColor(teamCode, colorKey = "color1", fallback = "#dddddd") {
  const team = getTeamByCode(teamCode);
  return team?.branding?.colors?.[colorKey] || fallback;
}

function getTeamDisplayName(teamCode, nameType = "short") {
  const team = getTeamByCode(teamCode);

  if (!team) return teamCode;

  if (nameType === "full") return team.name?.full || teamCode;
  if (nameType === "city") return team.name?.city || teamCode;
  if (nameType === "mascot") return team.name?.mascot || teamCode;

  return team.name?.short || teamCode;
}

// -------------------------------------------------------
// ============== HTML template ===============
// -------------------------------------------------------
function getPlayerIndexCardHTML() {
  return `
    <article class="player-card">

      <div class="player-card__top">
        <div class="player-card__image"></div>

        <div class="player-card__content">
          <header class="player-card__header">
            <p class="player-card__jersey"></p>
            <h2 class="player-card__name"></h2>
          </header>

          <section class="player-card__basic">
            <p class="player-card__college"></p>
            <p class="player-card__draft"></p>
          </section>

          <section class="player-card__college player-card__section"></section>
        </div>
      </div>

      <section class="player-card__pro-careers player-card__section"></section>

      <section class="player-card__team-usa player-card__section"></section>

    </article>
  `;
}

// -------------------------------------------------------
// Render all cards on page
// -------------------------------------------------------
async function initPlayerIndexCards() {
  await loadPlayerIndexCardData();

  const cardContainers = document.querySelectorAll(".player-index-card");

  cardContainers.forEach(container => {
    const playerId = container.dataset.playerId;
    renderPlayerCard(container, playerId);
  });
}

// -------------------------------------------------------
// MAIN CARD RENDERER
// -------------------------------------------------------
function renderPlayerCard(container, playerId) {
  const player = PLAYER_CARDS[playerId];

  if (!player) {
    console.warn(`No player found for playerId: ${playerId}`);
    container.innerHTML = `<p>Player not found: ${playerId}</p>`;
    return;
  }

  container.innerHTML = getPlayerIndexCardHTML();
  const card = container.querySelector(".player-card");

  renderBasicPlayerInfo(card, player);
  renderPlayerImage(card, player);
  //renderCollegeCareerTimeline(card, player);
  //renderPlayerTeamKey(card, player);
  //renderPlayerTeamTimeline(card, player);
  //renderExtraCareerTimelines(card, player);

  renderCollegeSection(card, player);
  renderProCareerSection(card, player);
  renderTeamUsaSection(card, player);
}

// -------------------------------------------------------
// Basic info section
// -------------------------------------------------------
function renderBasicPlayerInfo(card, player) {
  const college =
    COLLEGES[player.careerDetails?.collegeCareer?.collegeId || player.collegeId];

  // NAME
  card.querySelector(".player-card__name").textContent = player.playerName;

  // JERSEY
  card.querySelector(".player-card__jersey").textContent =
    `Team USA #${player.teamUsaJersey}`;

  // COLLEGE
  card.querySelector(".player-card__college").textContent =
    college ? college.name : "College unknown";

  // DRAFT (UPDATED)
  const draft = player.careerDetails?.draftDetails || player.draft;

  if (draft) {
    const draftedTeamCode = draft.draftedBy || draft.teamCode;
    const teamName = getTeamDisplayName(draftedTeamCode, "short");

    const pickText = draft.pick ? ` · #${draft.pick} Overall pick` : "";

    let draftText = `${pickText} in ${draft.year} draft ··· Picked by the ${teamName}`;

    // draft-day trade / acquired by
    if (draft.acquiredBy) {
      draftText += ` → ${getTeamDisplayName(draft.acquiredBy, "short")}`;
    }

    // extra note (like "Draft day trade")
    if (draft.transactionNote) {
      draftText += ` · ${draft.transactionNote}`;
    }

    card.querySelector(".player-card__draft").textContent = draftText;
  }
}

// =======================================================
// ======= NEW SECTIONING for grouped timelines ===========
// =======================================================
function renderCollegeSection(card, player) {
  const section = card.querySelector(".player-card__college");
  const collegeCareer = player.careerDetails?.collegeCareer;

  if (!section || !collegeCareer) return;

  const college = COLLEGES[collegeCareer.collegeId];
  const startYear = Number(collegeCareer.startYear);
  const endYear = Number(collegeCareer.endYear);

  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  const ncaaChampsByYear = {};

  collegeCareer.ncaaChampionships?.forEach(champ => {
    ncaaChampsByYear[Number(champ.year)] = champ;
  });

  section.innerHTML = `
    <h3 class="player-card__section-title">College</h3>

    <div class="player-card__college-inner">
      <p class="player-card__section-subtitle">
        ${college ? college.name : collegeCareer.collegeId}
      </p>

      <div 
        class="player-mini-timeline"
        style="grid-template-columns: repeat(${years.length}, 34px);"
      >
        ${years.map(year => `
          <div class="player-mini-year">${formatShortYear(year)}</div>
        `).join("")}

        ${years.map(year => {
          const champ = ncaaChampsByYear[year];

          return `
            <button
              class="player-mini-square ${champ ? "has-ncaa-championship" : ""}"
              type="button"
              data-year="${year}"
              title="${year}"
            >
              ${champ ? `<span class="college-champ-marker"></span>` : ""}
            </button>
          `;
        }).join("")}
      </div>

      <div class="player-card__college-note" hidden></div>
    </div>
  `;

  section.querySelectorAll(".has-ncaa-championship").forEach(square => {
    square.addEventListener("click", () => {
      const year = Number(square.dataset.year);
      const champ = ncaaChampsByYear[year];
      const noteBox = section.querySelector(".player-card__college-note");

      section.querySelectorAll(".has-ncaa-championship").forEach(el => {
        el.classList.remove("is-open");
      });

      square.classList.add("is-open");

      noteBox.hidden = false;
      noteBox.innerHTML = `
        <strong>${year} NCAA Championship</strong>
        <p>${champ?.champNote || `${player.playerName} won the ${year} NCAA championship with ${college ? college.name : "their college team"}.`}</p>
      `;
    });
  });
}

function renderProCareerSection(card, player) {
  const section = card.querySelector(".player-card__pro-careers");
  if (!section) return;

  const years = buildProCareerYears(player);
  const yearToWnbaTeam = {};
  const champsByYear = {};
  const missedByYear = {};

  player.wnbaTeams?.forEach(teamSpan => {
    const start = Number(teamSpan.startYear);
    const end = normalizeEndYear(teamSpan.endYear);

    for (let year = start; year <= end; year++) {
      yearToWnbaTeam[year] = teamSpan.teamCode;
    }
  });

  player.championships?.forEach(champ => {
    champsByYear[Number(champ.year)] = champ;
  });

  player.careerDetails?.missedWnbaSeasons?.forEach(item => {
    missedByYear[Number(item.year)] = item;
  });

  section.innerHTML = `
    <h3 class="player-card__section-title">Pro Careers</h3>

    <div class="player-card__pro-timeline">

<div 
  class="player-pro-grid"
  style="grid-template-columns: 90px repeat(${years.length}, 46px);"
>

  <div class="player-pro-row-label">WNBA</div>

  ${years.map(year => {
    const teamCode = yearToWnbaTeam[year];
    const champ = champsByYear[year];
    const missed = missedByYear[year];

    return `
      <button
        class="player-pro-square ${champ ? "has-championship" : ""} ${missed ? "has-missed-season" : ""}"
        style="background:${teamCode ? getTeamColor(teamCode, "color1", "#fff") : "#fff"};"
        data-year="${year}"
        type="button"
        title="${year} ${teamCode ? getTeamDisplayName(teamCode, "short") : "No WNBA team"}"
      >
        ${champ ? `
          <span 
            class="champ-marker"
            style="border-color:${getTeamColor(champ.teamCode, "color1", "#000")};"
          ></span>
        ` : ""}

        ${missed ? `<span class="missed-season-marker">×</span>` : ""}
      </button>
    `;
  }).join("")}

  <div class="player-pro-row-label"></div>

  ${years.map(year => `
    <div class="player-pro-year">${formatShortYear(year)}</div>
  `).join("")}

  <div class="player-pro-row-label">Offseason</div>

  ${renderOffseasonTimelineItems(player, years)}

</div>

        <div class="player-card__champ-note" hidden></div>
        <div class="player-card__offseason-note" hidden></div>

    </div>
  `;

  section.querySelectorAll(".has-championship").forEach(square => {
    square.addEventListener("click", () => {
      const year = Number(square.dataset.year);
      const champ = champsByYear[year];
      const noteBox = section.querySelector(".player-card__champ-note");

      section.querySelectorAll(".has-championship").forEach(el => {
        el.classList.remove("is-open");
      });

      square.classList.add("is-open");

      noteBox.hidden = false;
      noteBox.innerHTML = `
        <strong>${champ.year} WNBA Championship</strong>
        <p>
          ${champ.champNote || `${player.playerName} won the ${champ.year} WNBA championship with the ${getTeamDisplayName(champ.teamCode, "full")}.`}
        </p>
        ${champ.finalsMVP ? `<p class="champ-note-tag">Finals MVP</p>` : ""}
      `;
    });
  });

    section.querySelectorAll(".player-offseason-square").forEach(square => {
    square.addEventListener("click", () => {
        const noteBox = section.querySelector(".player-card__offseason-note");

        section.querySelectorAll(".player-offseason-square").forEach(el => {
        el.classList.remove("is-open");
        });

        square.classList.add("is-open");

        const type = square.dataset.offseasonType;
        const season = square.dataset.season;
        const team = square.dataset.team;
        const country = square.dataset.country;
        const league = square.dataset.league;

        noteBox.hidden = false;
        noteBox.innerHTML = `
          <strong>${type} · ${season}</strong>
          <p>${team}</p>
          ${league ? `<p>${league}</p>` : ""}
          ${country ? `<p>${country}</p>` : ""}
        `;
    });
    });

}

function getTeamInitial(teamName) {
  if (!teamName) return "?";
  return String(teamName).trim().charAt(0).toUpperCase();
}

function renderOffseasonTimelineItems(player, years) {
  const details = player.careerDetails;
  if (!details) return renderEmptyOffseasonCells(years);

  const items = [];

  details.overseasTeams?.forEach(item => {
    const overseasTeam = item.teamCode
      ? OVERSEAS_TEAMS_BY_CODE[item.teamCode]
      : null;

    const league = overseasTeam
      ? OVERSEAS_LEAGUES_BY_CODE[overseasTeam?.league?.leagueCode]
      : null;

    const span = parseSeasonSpan(item.season);
    const startYear = span.startYear;
    const startIndex = years.indexOf(startYear) + 2;

    if (startIndex < 2) return;

    const teamName =
      overseasTeam?.name?.full ||
      item.team ||
      item.teamCode ||
      "Unknown Team";

    const country =
      overseasTeam?.location?.country ||
      item.country ||
      "";

    const leagueName =
      league?.name?.full ||
      "";

    items.push(`
      <button
        class="player-offseason-square player-offseason-square--overseas"
        style="
          grid-column: ${startIndex} / ${startIndex + 1};
          transform: translateX(calc(var(--pro-year-col) / 2));
        "
        type="button"
        data-offseason-type="Overseas"
        data-season="${item.season}"
        data-team="${teamName}"
        data-country="${country}"
        data-league="${leagueName}"
        title="Overseas ${item.season}: ${teamName}"
      >
        ${getTeamInitial(teamName)}
      </button>
    `);
  });

  details.unrivaledTeams?.forEach(item => {
    const unrivaledTeam = item.teamCode
      ? UNRIVALED_TEAMS_BY_CODE[item.teamCode]
      : null;

    const year = Number(item.year);
    const startIndex = years.indexOf(year) + 2;

    if (startIndex < 2) return;

    const teamName =
      unrivaledTeam?.name?.short ||
      unrivaledTeam?.name?.full ||
      item.team ||
      item.teamCode ||
      "Unknown";

    const color =
      unrivaledTeam?.branding?.colors?.color1 ||
      "#fff";

    items.push(`
      <button
        class="player-offseason-square player-offseason-square--unrivaled"
        style="
          grid-column: ${startIndex} / ${startIndex + 1};
          transform: translateX(calc(var(--pro-year-col) / 2));
          background: ${color};
        "
        type="button"
        data-offseason-type="Unrivaled"
        data-season="${item.year}"
        data-team="${teamName}"
        data-country=""
        data-league="Unrivaled"
        title="Unrivaled ${item.year}: ${teamName}"
      >
        ${getTeamInitial(teamName)}
      </button>
    `);
  });

  if (!items.length) {
    return renderEmptyOffseasonCells(years);
  }

  return items.join("");
}

function renderEmptyOffseasonCells(years) {
  return years.map(year => `
    <div class="player-pro-offseason-cell" data-year="${year}"></div>
  `).join("");
}

function renderTeamUsaSection(card, player) {
  const section = card.querySelector(".player-card__team-usa");
  if (!section) return;

  section.innerHTML = `
    <h3 class="player-card__section-title">Team USA / International</h3>
    <div class="player-card__team-usa-timeline"></div>
  `;
}

// -------------------------------------------------------
// Player team history quick key / legend
// -------------------------------------------------------
function renderPlayerTeamKey(card, player) {
  const keyContainer = card.querySelector(".player-card__team-key");
  if (!keyContainer || !player.wnbaTeams?.length) return;

  const uniqueTeamCodes = [...new Set(player.wnbaTeams.map(team => team.teamCode))];

  keyContainer.innerHTML = `
    <h3 class="player-card__section-title">WNBA Teams</h3>

    <div class="player-card__team-key-list">
      ${uniqueTeamCodes.map(teamCode => `
        <div class="player-card__team-key-item">
          <span 
            class="player-card__team-color"
            style="background:${getTeamColor(teamCode, "color1", "#ddd")};"
          ></span>
          <span>${getTeamDisplayName(teamCode, "short")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// -------------------------------------------------------
// Player image
// -------------------------------------------------------
function renderPlayerImage(card, player) {
  const container = card.querySelector(".player-card__image");

  if (!player.image?.src) return;

  container.innerHTML = `
    <img src="${player.image.src}" alt="${player.image.alt}">
  `;
}

// -------------------------------------------------------
// Team timeline helpers
// -------------------------------------------------------
function formatShortYear(year) {
  return `’${String(year).slice(-2)}`;
}

// -------------------------------------------------------
// pro career timeline helpers
// -------------------------------------------------------

function normalizeEndYear(endYear) {
  if (endYear === "present") return CURRENT_DISPLAY_YEAR;
  return Number(endYear);
}

function buildProCareerYears(player) {
  const allYears = [];

  const draftYear =
    player.careerDetails?.draftDetails?.year ||
    player.draft?.year;

  if (draftYear) allYears.push(Number(draftYear));

  player.wnbaTeams?.forEach(team => {
    allYears.push(Number(team.startYear));
    allYears.push(normalizeEndYear(team.endYear));
  });

  player.championships?.forEach(champ => {
    allYears.push(Number(champ.year));
  });

  player.careerDetails?.missedWnbaSeasons?.forEach(item => {
    allYears.push(Number(item.year));
  });

  player.careerDetails?.unrivaledTeams?.forEach(item => {
    allYears.push(Number(item.year));
  });

  player.careerDetails?.overseasTeams?.forEach(item => {
    const span = parseSeasonSpan(item.season);
    if (span.startYear) allYears.push(span.startYear);
    if (span.endYear) allYears.push(span.endYear);
  });

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears, CURRENT_DISPLAY_YEAR);

  const years = [];

  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }

  return years;
}

function parseSeasonSpan(season) {
  if (!season) return {};

  const seasonText = String(season);

  if (!seasonText.includes("-")) {
    const year = Number(seasonText);
    return {
      startYear: year,
      endYear: year
    };
  }

  const [startRaw, endRaw] = seasonText.split("-");
  const startYear = Number(startRaw);

  let endYear;

  if (endRaw.length === 2) {
    const century = String(startYear).slice(0, 2);
    endYear = Number(`${century}${endRaw}`);
  } else {
    endYear = Number(endRaw);
  }

  return { startYear, endYear };
}

// -------------------------------------------------------
// Championships
// -------------------------------------------------------



// -------------------------------------------------------
// Start after page loads
// -------------------------------------------------------

document.addEventListener("DOMContentLoaded", initPlayerIndexCards);

window.renderPlayerCard = renderPlayerCard;

})();