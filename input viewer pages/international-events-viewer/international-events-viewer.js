const DATA_PATHS = {
  players: "../../basketball_101_data_files/wnba_olympic_players_v2.json"
};

let ALL_EVENTS = [];
let activeEventType = "all";
let activeFormat = "all";

const eventsTimeline = document.getElementById("eventsTimeline");
const eventCountText = document.getElementById("eventCountText");
const filterButtons = document.querySelectorAll(".filter-btn");

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) return fallback;
    return await response.json();
  } catch (error) {
    console.warn(`Could not load ${path}`, error);
    return fallback;
  }
}

function normalizePlayerRecord(playerId, playerRecord) {
  const player = playerRecord.playerData || playerRecord;

  return {
    playerId,
    playerName: player.playerName || playerRecord.playerName || playerId,
    data: player
  };
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getEventType(medal) {
  if (medal.eventType) return medal.eventType;

  const competition = String(medal.competition || "").toLowerCase();

  if (competition.includes("olympic")) return "Olympics";
  if (
    competition.includes("world cup") ||
    competition.includes("americup") ||
    competition.includes("pan american")
  ) {
    return "FIBA";
  }

  return "Unknown";
}

function getCompetitionName(medal) {
  if (medal.competition) return medal.competition;
  if (medal.eventType === "Olympics") return "Olympic Games";
  return "International Event";
}

function createEventKey(medal) {
  const eventType = normalizeKey(getEventType(medal));
  const format = normalizeKey(medal.format || "unknown");
  const year = normalizeKey(medal.year || "unknown");
  const competition = normalizeKey(getCompetitionName(medal));
  const medalType = normalizeKey(medal.medal || "unknown");

  return `${eventType}_${format}_${year}_${competition}_${medalType}`;
}

function collectInternationalEvents(playersData) {
  const events = {};

  Object.entries(playersData.players || {}).forEach(([playerId, playerRecord]) => {
    const normalized = normalizePlayerRecord(playerId, playerRecord);
    const player = normalized.data;
    const medals = player?.careerDetails?.teamUsaMedals || [];

    medals.forEach(medal => {
      if (!medal.year && !medal.competition && !medal.eventType) return;

      const eventId = createEventKey(medal);
      const eventType = getEventType(medal);
      const competition = getCompetitionName(medal);

      if (!events[eventId]) {
        events[eventId] = {
          eventId,
          eventType,
          format: medal.format || "Unknown",
          year: medal.year || "Unknown",
          competition,
          medal: medal.medal || "Unknown",
          players: []
        };
      }

      const alreadyAdded = events[eventId].players.some(
        playerItem => playerItem.playerId === normalized.playerId
      );

      if (!alreadyAdded) {
        events[eventId].players.push({
          playerId: normalized.playerId,
          playerName: normalized.playerName
        });
      }
    });
  });

  return Object.values(events).sort((a, b) => {
    const yearCompare = Number(b.year) - Number(a.year);
    if (yearCompare !== 0) return yearCompare;

    return a.competition.localeCompare(b.competition);
  });
}

function getFilteredEvents() {
  return ALL_EVENTS.filter(event => {
    const eventTypeMatch =
      activeEventType === "all" || event.eventType === activeEventType;

    const formatMatch =
      activeFormat === "all" || event.format === activeFormat;

    return eventTypeMatch && formatMatch;
  });
}

function renderEvents() {
  const events = getFilteredEvents();

  eventCountText.textContent =
    `${events.length} grouped event${events.length === 1 ? "" : "s"} found`;

  if (!events.length) {
    eventsTimeline.innerHTML = `<p>No matching events found.</p>`;
    return;
  }

  eventsTimeline.innerHTML = events.map(event => {
    const players = event.players
      .sort((a, b) => a.playerName.localeCompare(b.playerName))
      .map(player => `<span class="player-chip">${player.playerName}</span>`)
      .join("");

    return `
      <article class="event-card">
        <div class="event-year">${event.year}</div>

        <div class="event-main">
          <h2>${event.competition}</h2>

          <div class="event-meta">
            <span class="pill">${event.eventType}</span>
            <span class="pill">${event.format}</span>
            <span class="pill">${event.medal}</span>
            <span class="pill">${event.players.length} player${event.players.length === 1 ? "" : "s"}</span>
          </div>

          <div class="player-list">
            ${players}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function bindFilters() {
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const eventFilter = button.dataset.filter;
      const formatFilter = button.dataset.format;

      if (eventFilter) {
        activeEventType = eventFilter;
        activeFormat = "all";
      }

      if (formatFilter) {
        activeFormat = formatFilter;
      }

      filterButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      renderEvents();
    });
  });
}

async function init() {
  const playersData = await loadJson(DATA_PATHS.players, { players: {} });

  ALL_EVENTS = collectInternationalEvents(playersData);

  bindFilters();
  renderEvents();
}

init();