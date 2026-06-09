const DATA_PATHS = {
  players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
  teams: "../../basketball_101_data_files/wnba_static_data_v2.json"
};

const championshipList = document.getElementById("championshipList");
const titleCount = document.getElementById("titleCount");
const playerCount = document.getElementById("playerCount");
const mvpCount = document.getElementById("mvpCount");

let playersData = {};
let teamsData = {};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function normalizePlayerRecord(playerId, playerRecord) {
  return {
    playerId,
    data: playerRecord?.playerData ? playerRecord.playerData : playerRecord
  };
}

function getTeamName(teamCode) {
  const team = teamsData?.teams?.[teamCode] || teamsData?.[teamCode];

  return (
    team?.name?.full ||
    team?.teamName ||
    team?.fullName ||
    team?.name ||
    teamCode
  );
}

function getPlayerName(player) {
  return player?.playerName || player?.name || "Unknown Player";
}

function buildChampionshipRows() {
  const grouped = {};

  Object.entries(playersData.players || {}).forEach(([playerId, playerRecord]) => {
    const normalized = normalizePlayerRecord(playerId, playerRecord);
    const player = normalized.data;
    const championships = player?.championships || [];

    championships.forEach(title => {
      if (!title?.year || !title?.teamCode) return;

      const key = `${title.year}_${title.teamCode}`;

      if (!grouped[key]) {
        grouped[key] = {
          year: String(title.year),
          teamCode: title.teamCode,
          teamName: getTeamName(title.teamCode),
          sourcePlayers: [],
          finalsMvps: []
        };
      }

      grouped[key].sourcePlayers.push({
        playerId,
        playerName: getPlayerName(player)
      });

      if (title.finalsMVP) {
        grouped[key].finalsMvps.push({
          playerId,
          playerName: getPlayerName(player)
        });
      }
    });
  });

  return Object.values(grouped).sort((a, b) => Number(b.year) - Number(a.year));
}

function uniqueNames(items) {
  return [...new Set(items.map(item => item.playerName))];
}

function renderRows(rows) {
  championshipList.innerHTML = "";

  if (!rows.length) {
    championshipList.innerHTML = `<div class="empty">No WNBA championship data found yet.</div>`;
    return;
  }

  rows.forEach(row => {
    const players = uniqueNames(row.sourcePlayers);
    const mvps = uniqueNames(row.finalsMvps);

    const card = document.createElement("article");
    card.className = "champ-card";

    card.innerHTML = `
      <div class="year">${row.year}</div>
      <div>
        <div class="team-name">${row.teamName}</div>
        <div class="meta">Players in file: ${players.join(", ")}</div>
        ${
          mvps.length
            ? `<div class="meta">Finals MVP in file: ${mvps.join(", ")}</div>`
            : ""
        }
      </div>
    `;

    championshipList.appendChild(card);
  });
}

async function init() {
  try {
    const [players, teams] = await Promise.all([
      loadJson(DATA_PATHS.players),
      loadJson(DATA_PATHS.teams)
    ]);

    playersData = players;
    teamsData = teams;

    const rows = buildChampionshipRows();

    titleCount.textContent = rows.length;
    playerCount.textContent = new Set(
      rows.flatMap(row => row.sourcePlayers.map(player => player.playerId))
    ).size;
    mvpCount.textContent = rows.reduce((sum, row) => sum + row.finalsMvps.length, 0);

    renderRows(rows);
  } catch (error) {
    championshipList.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

init();