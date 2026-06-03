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
        </div>
      </div>

      <section class="player-card__career-timeline player-card__section"></section>

    </article>
  `;
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
  renderCareerTimelineSection(card, player);
}

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

// ============ TIMELINE SECTION ===============
// =======================================================
// ============== COMBINED CAREER TIMELINE ===============
// =======================================================
//
// Main idea:
// Instead of rendering separate timeline systems for college,
// WNBA, overseas, Unrivaled, and medals, this builds one shared
// year axis and lets every row line up to that same axis.
//
// Row order:
// 1. College
// 2. Years
// 3. WNBA
// 4. One row for each overseas league
// 5. Unrivaled
// 6. Medals
//
// This keeps the structure general. If you later add awards,
// playoffs, injuries, coaching, Athletes Unlimited, etc., you can
// build another row object and pass it into the same renderer.

function renderCareerTimelineSection(card, player) {
  const section = card.querySelector(".player-card__career-timeline");
  if (!section) return;

  const years = buildCareerTimelineYears(player);
  const rows = buildCareerTimelineRows(player, years);

  section.innerHTML = `
    <h3 class="player-card__section-title">Career Timeline</h3>

    <div 
      class="player-career-timeline"
      style="--career-year-count: ${years.length};"
    >
      ${rows.map(row => renderTimelineRow(row, years)).join("")}
    </div>

    <div class="player-career-note" hidden></div>
  `;

  bindCareerTimelineInteractions(section);
}

// -------------------------------------------------------
// Build one shared year range for the whole card
// -------------------------------------------------------
//
// Start:
// Always starts at the player's college start year.
//
// End:
// If player is active, use CURRENT_DISPLAY_YEAR.
// If player is retired, use the latest meaningful year in their data.
// This allows Diana Taurasi to end around 2024 instead of forcing 2026.

function buildCareerTimelineYears(player) {
  const allYears = [];

  const collegeCareer = player.careerDetails?.collegeCareer;

  if (collegeCareer?.startYear) {
    allYears.push(Number(collegeCareer.startYear));
  }

  if (collegeCareer?.endYear) {
    allYears.push(Number(collegeCareer.endYear));
  }

  player.wnbaSeasons?.forEach(season => {
    allYears.push(Number(season.year));
  });

  player.wnbaTeams?.forEach(teamSpan => {
    allYears.push(Number(teamSpan.startYear));
    allYears.push(normalizeEndYear(teamSpan.endYear, player));
  });

  player.championships?.forEach(champ => {
    allYears.push(Number(champ.year));
  });

  player.careerDetails?.missedWnbaSeasons?.forEach(item => {
    allYears.push(Number(item.year));
  });

  player.careerDetails?.overseasTeams?.forEach(item => {
    const span = parseSeasonSpan(item.season);
    if (span.startYear) allYears.push(span.startYear);
    if (span.endYear) allYears.push(span.endYear);
  });

  player.careerDetails?.unrivaledTeams?.forEach(item => {
    allYears.push(Number(item.year));
  });

  player.careerDetails?.teamUsaMedals?.forEach(item => {
    allYears.push(Number(item.year));
  });

  if (!allYears.length) return [];

  const minYear = Math.min(...allYears);

  const maxYear = player.playerStatus?.isActive
    ? CURRENT_DISPLAY_YEAR
    : Math.max(...allYears);

  const years = [];

  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }

  return years;
}

// -------------------------------------------------------
// End year normalizer
// -------------------------------------------------------
//
// The JSON uses "present" for active spans.
// For active players, "present" becomes 2026.
// For inactive players, this function avoids forcing 2026 unless
// the player is actually active.

function normalizeEndYear(endYear, player = null) {
  if (endYear === "present") {
    return player?.playerStatus?.isActive
      ? CURRENT_DISPLAY_YEAR
      : CURRENT_DISPLAY_YEAR;
  }

  return Number(endYear);
}

// -------------------------------------------------------
// positioning helper
// -------------------------------------------------------
function getYearColumn(year, years) {
  return years.indexOf(Number(year)) + 2;
}

// -------------------------------------------------------
// Build all row objects for the shared grid
// -------------------------------------------------------

function buildCareerTimelineRows(player, years) {
  return [
    buildCollegeTimelineRow(player, years),
    buildYearLabelRow(years),
    buildWnbaTimelineRow(player, years),
    ...buildOverseasLeagueRows(player, years),
    buildUnrivaledTimelineRow(player, years),
    buildMedalsTimelineRow(player, years)
  ].filter(Boolean);
}

// -------------------------------------------------------
// College row
// -------------------------------------------------------

function buildCollegeTimelineRow(player, years) {
  const collegeCareer = player.careerDetails?.collegeCareer;
  if (!collegeCareer) return null;

  const college = COLLEGES[collegeCareer.collegeId];
  const collegeName = college?.name || collegeCareer.collegeId;

  const startYear = Number(collegeCareer.startYear);
  const endYear = Number(collegeCareer.endYear);

  const championshipsByYear = {};

  collegeCareer.ncaaChampionships?.forEach(champ => {
    championshipsByYear[Number(champ.year)] = champ;
  });

  const items = [];

  for (let year = startYear; year <= endYear; year++) {
    const champ = championshipsByYear[year];

    items.push({
      year,
      type: "college",
      classes: ["has-entry", champ ? "has-ring" : ""],
      text: "",
      style: "",
      ring: Boolean(champ),
      note: champ
        ? {
            title: `${year} NCAA Championship`,
            body: champ.champNote || `${player.playerName} won the ${year} NCAA championship with ${collegeName}.`
          }
        : {
            title: `${year} College Season`,
            body: `${player.playerName} played college basketball at ${collegeName}.`
          }
    });
  }

  return {
    label: "College",
    rowType: "college",
    items
  };
}
// -------------------------------------------------------
// Year label row
// -------------------------------------------------------

function buildYearLabelRow(years) {
  return {
    label: "",
    rowType: "years",
    items: years.map(year => ({
      year,
      type: "year-label",
      classes: ["is-year-label"],
      text: formatShortYear(year),
      style: "",
      note: null
    }))
  };
}

// -------------------------------------------------------
// WNBA row
// -------------------------------------------------------
//
// Uses player.wnbaSeasons first because that is your more detailed
// season-by-season structure. This lets the row display sit-out years,
// partial years, and season-specific notes more easily than wnbaTeams.

function buildWnbaTimelineRow(player, years) {
  const seasonsByYear = {};
  const championshipsByYear = {};

  player.wnbaSeasons?.forEach(season => {
    seasonsByYear[Number(season.year)] = season;
  });

  player.championships?.forEach(champ => {
    championshipsByYear[Number(champ.year)] = champ;
  });

  const items = years
    .map(year => {
      const season = seasonsByYear[year];
      const champ = championshipsByYear[year];

      if (!season && !champ) return null;

      const entries = season?.entries || [];
      const teamEntry = entries.find(entry => entry.type === "team");
      const sitOutEntry = entries.find(entry => entry.type === "sit_out");

      const teamCode = teamEntry?.teamCode || sitOutEntry?.teamCode || champ?.teamCode || "";
      const bgColor = teamCode ? getTeamColor(teamCode, "color1", "#ffffff") : "#ffffff";

      return {
        year,
        type: "wnba",
        classes: ["has-entry", champ ? "has-ring" : "", sitOutEntry ? "has-missed-season" : ""],
        text: sitOutEntry ? "×" : "",
        style: `background:${bgColor};`,
        ring: Boolean(champ),
        note: {
          title: champ ? `${year} WNBA Championship` : `${year} WNBA Season`,
          body: champ
            ? `${player.playerName} won the ${year} WNBA championship with the ${getTeamDisplayName(champ.teamCode, "full")}.`
            : sitOutEntry?.note || `${player.playerName} played for the ${getTeamDisplayName(teamCode, "full")}.`,
          tag: champ?.finalsMVP ? "Finals MVP" : ""
        }
      };
    })
    .filter(Boolean);

  return {
    label: "WNBA",
    rowType: "wnba",
    items
  };
}

// -------------------------------------------------------
// Overseas league rows
// -------------------------------------------------------
//
// Your player JSON stores overseas teams.
// The team lookup tells us which league that team belongs to.
// This groups overseas entries by league, then creates one row per league.

function buildOverseasLeagueRows(player, years) {
  const overseasItems = player.careerDetails?.overseasTeams || [];
  if (!overseasItems.length) return [];

  const itemsByLeagueCode = {};

  overseasItems.forEach(item => {
    const overseasTeam = getOverseasTeamByCode(item.teamCode);
    const leagueCode =
      overseasTeam?.league?.leagueCode ||
      "unknown_overseas_league";

    if (!itemsByLeagueCode[leagueCode]) {
      itemsByLeagueCode[leagueCode] = [];
    }

    itemsByLeagueCode[leagueCode].push(item);
  });

  return Object.entries(itemsByLeagueCode).map(([leagueCode, leagueItems]) => {
    const league = OVERSEAS_LEAGUES_BY_CODE[leagueCode];

    const leagueName =
      league?.name?.short ||
      league?.name?.full ||
      "Overseas";

    const itemsByStartYear = {};

    leagueItems.forEach(item => {
      const span = parseSeasonSpan(item.season);
      if (!span.startYear) return;

      if (!itemsByStartYear[span.startYear]) {
        itemsByStartYear[span.startYear] = [];
      }

      itemsByStartYear[span.startYear].push(item);
    });

    return {
      label: leagueName,
      rowType: "overseas",
      items: years.map(year => {
        const items = itemsByStartYear[year];

        if (!items?.length) {
          return null;
        }

        const item = items[0];
        const overseasTeam = getOverseasTeamByCode(item.teamCode);

        const teamName =
          overseasTeam?.name?.full ||
          item.team ||
          item.teamCode ||
          "Unknown overseas team";

        const country =
          overseasTeam?.location?.country ||
          item.country ||
          "";

        return {
          year,
          type: "overseas",
          classes: ["has-entry"],
          text: getTeamInitial(teamName),
          style: "",
          ring: false,
          note: {
            title: `${item.season} Overseas Season`,
            body: [
              teamName,
              leagueName,
              country,
              item.note
            ].filter(Boolean).join(" · ")
          }
        };
      }).filter(Boolean)
    };
  });
}

// -------------------------------------------------------
// Unrivaled row
// -------------------------------------------------------

function buildUnrivaledTimelineRow(player, years) {
  const unrivaledItems = player.careerDetails?.unrivaledTeams || [];

  const itemsByYear = {};

  unrivaledItems.forEach(item => {
    itemsByYear[Number(item.year)] = item;
  });

  return {
    label: "Unrivaled",
    rowType: "unrivaled",
    items: years.map(year => {
      const item = itemsByYear[year];

      if (!item) {
        return null;
      }

      const team = getUnrivaledTeamByCode(item.teamCode);

      const teamName =
        team?.name?.full ||
        team?.name?.short ||
        item.teamCode ||
        "Unknown Unrivaled team";

      const bgColor =
        team?.branding?.colors?.color1 ||
        "#ffffff";

      return {
        year,
        type: "unrivaled",
        classes: ["has-entry"],
        text: getTeamInitial(teamName),
        style: `background:${bgColor};`,
        ring: false,
        note: {
          title: `${year} Unrivaled`,
          body: `${player.playerName} played for ${teamName}.`
        }
      };
    }).filter(Boolean)
  };
}

// -------------------------------------------------------
// Medals row
// -------------------------------------------------------

function buildMedalsTimelineRow(player, years) {
  const medals = player.careerDetails?.teamUsaMedals || [];

  const medalsByYear = {};

  medals.forEach(medal => {
    const year = Number(medal.year);

    if (!medalsByYear[year]) {
      medalsByYear[year] = [];
    }

    medalsByYear[year].push(medal);
  });

  return {
    label: "Medals",
    rowType: "medals",
    items: years.map(year => {
      const yearMedals = medalsByYear[year];

      if (!yearMedals?.length) {
        return null;
      }

      const medalText = yearMedals
        .map(item => {
          const eventType = item.eventType || "International";
          const format = item.format ? ` ${item.format}` : "";
          const competition = item.competition ? ` ${item.competition}` : "";
          return `${item.medal} · ${eventType}${format}${competition}`;
        })
        .join("<br>");

      return {
        year,
        type: "medals",
        classes: ["has-entry"],
        text: yearMedals.length > 1 ? yearMedals.length : medalShortLabel(yearMedals[0].medal),
        style: "",
        ring: false,
        note: {
          title: `${year} Team USA Medal${yearMedals.length > 1 ? "s" : ""}`,
          body: medalText
        }
      };
    }).filter(Boolean)
  };
}

// ------------------------------------------------------- 
// Generic row renderer
// -------------------------------------------------------

function renderTimelineRow(row, years) {
  const labelHTML = row.rowType === "years"
    ? `<div class="player-career-row-label-spacer"></div>`
    : `<div class="player-career-row-label player-career-row-label--${row.rowType}">
        ${row.label}
      </div>`;

  return `
    <div class="player-career-row player-career-row--${row.rowType}">
      ${labelHTML}
      ${row.items.map(item => renderTimelineItem(item, years)).join("")}
    </div>
  `;
}
// -------------------------------------------------------
// Generic cell renderer
// -------------------------------------------------------
//
// Most cells use the same markup.
// Special styling should come from classes, not separate HTML systems.

function renderTimelineItem(item, years) {
  const classes = [
    "player-career-cell",
    `player-career-cell--${item.type}`,
    ...(item.classes || [])
  ].filter(Boolean).join(" ");

  const noteData = item.note
    ? encodeURIComponent(JSON.stringify(item.note))
    : "";

  const tagName = item.note ? "button" : "div";
  const typeAttr = item.note ? `type="button"` : "";

  return `
    <${tagName}
      class="${classes}"
      ${typeAttr}
      style="grid-column:${getYearColumn(item.year, years)}; ${item.style || ""}"
      data-year="${item.year}"
      ${item.note ? `data-note="${noteData}"` : ""}
      title="${item.year}"
    >
      ${item.ring ? `<span class="career-ring-marker"></span>` : ""}
      ${item.text ? `<span class="career-cell-text">${item.text}</span>` : ""}
    </${tagName}>
  `;
}

// -------------------------------------------------------
// Generic click handling for every interactive square
// -------------------------------------------------------

function bindCareerTimelineInteractions(section) {
  const noteBox = section.querySelector(".player-career-note");

  section.querySelectorAll(".player-career-cell[data-note]").forEach(cell => {
    cell.addEventListener("click", () => {
      const note = JSON.parse(decodeURIComponent(cell.dataset.note));

      section.querySelectorAll(".player-career-cell.is-open").forEach(openCell => {
        openCell.classList.remove("is-open");
      });

      cell.classList.add("is-open");

      noteBox.hidden = false;
      noteBox.innerHTML = `
        <strong>${note.title}</strong>
        <p>${note.body}</p>
        ${note.tag ? `<p class="career-note-tag">${note.tag}</p>` : ""}
      `;
    });
  });
}

// -------------------------------------------------------
// Lookup helpers for non-WNBA teams
// -------------------------------------------------------

function getOverseasTeamByCode(teamCode) {
  return OVERSEAS_TEAMS_BY_CODE?.[teamCode] || null;
}

function getUnrivaledTeamByCode(teamCode) {
  return UNRIVALED_TEAMS_BY_CODE?.[teamCode] || null;
}

// -------------------------------------------------------
// Small display helpers
// -------------------------------------------------------

function getTeamInitial(teamName) {
  if (!teamName) return "?";
  return String(teamName).trim().charAt(0).toUpperCase();
}

function medalShortLabel(medal) {
  if (!medal) return "M";
  return String(medal).charAt(0).toUpperCase();
}

function formatShortYear(year) {
  return `’${String(year).slice(-2)}`;
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
// ============ END === END === END ===============

// -------------------------------------------------------
// Start after page loads
// -------------------------------------------------------

document.addEventListener("DOMContentLoaded", initPlayerIndexCards);

window.renderPlayerCard = renderPlayerCard;

})();