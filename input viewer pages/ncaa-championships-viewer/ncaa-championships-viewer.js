const DATA_PATHS = {
  players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
  colleges: "../../basketball_101_data_files/wnba_colleges.json"
};

const championshipList = document.getElementById("championshipList");
const titleCount = document.getElementById("titleCount");
const playerCount = document.getElementById("playerCount");

let playersData = {};
let collegesData = {};

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

function getPlayerName(player) {
  return player?.playerName || player?.name || "Unknown Player";
}

function getCollegeName(collegeId, fallback = "") {
  const college = collegesData?.colleges?.[collegeId] || collegesData?.[collegeId];

  return (
    college?.collegeName ||
    college?.name?.full ||
    college?.name ||
    college?.displayName ||
    fallback ||
    collegeId
  );
}

function getCollegeCareers(player) {
  const career = player?.careerDetails?.collegeCareer;

  if (Array.isArray(career)) return career;

  if (Array.isArray(player?.careerDetails?.collegeCareers)) {
    return player.careerDetails.collegeCareers;
  }

  if (Array.isArray(player?.careerDetails?.colleges)) {
    return player.careerDetails.colleges;
  }

  return career ? [career] : [];
}

function buildChampionshipRows() {
  const grouped = {};

  Object.entries(playersData.players || {}).forEach(([playerId, playerRecord]) => {
    const normalized = normalizePlayerRecord(playerId, playerRecord);
    const player = normalized.data;
    const collegeCareers = getCollegeCareers(player);

    collegeCareers.forEach(collegeCareer => {
      const titles = collegeCareer?.ncaaChampionships || [];

      titles.forEach(title => {
        if (!title?.year) return;

        const collegeId =
          title.collegeId ||
          collegeCareer.collegeId ||
          "unknown_college";

        const key = `${title.year}_${collegeId}`;

        if (!grouped[key]) {
          grouped[key] = {
            year: String(title.year),
            collegeId,
            collegeName: getCollegeName(collegeId, title.collegeName),
            sourcePlayers: []
          };
        }

        grouped[key].sourcePlayers.push({
          playerId,
          playerName: getPlayerName(player)
        });
      });
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
    championshipList.innerHTML = `<div class="empty">No NCAA championship data found yet.</div>`;
    return;
  }

  rows.forEach(row => {
    const players = uniqueNames(row.sourcePlayers);

    const card = document.createElement("article");
    card.className = "champ-card";

    card.innerHTML = `
      <div class="year">${row.year}</div>
      <div>
        <div class="team-name">${row.collegeName}</div>
        <div class="meta">Players in file: ${players.join(", ")}</div>
      </div>
    `;

    championshipList.appendChild(card);
  });
}

async function init() {
  try {
    const [players, colleges] = await Promise.all([
      loadJson(DATA_PATHS.players),
      loadJson(DATA_PATHS.colleges)
    ]);

    playersData = players;
    collegesData = colleges;

    const rows = buildChampionshipRows();

    titleCount.textContent = rows.length;
    playerCount.textContent = new Set(
      rows.flatMap(row => row.sourcePlayers.map(player => player.playerId))
    ).size;

    renderRows(rows);
  } catch (error) {
    championshipList.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

init();