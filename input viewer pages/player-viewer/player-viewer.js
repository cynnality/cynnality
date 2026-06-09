const DATA_PATHS = {
    players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json",
    colleges: "../../basketball_101_data_files/wnba_colleges.json",
    overseasTeams: "../../basketball_101_data_files/overseas_teams_data.json",
    overseasLeagues: "../../basketball_101_data_files/overseas_leagues_data.json",
    unrivaledTeams: "../../basketball_101_data_files/unrivaled_teams_data.json"
};

let playersData = {};
let teamsData = {};
let collegesData = {};
let overseasTeamsData = {};
let overseasLeaguesData = {};
let unrivaledTeamsData = {};

const playerReceiptGrid = document.getElementById("playerReceiptGrid");
const playerSearchInput = document.getElementById("playerSearchInput");
const statusFilter = document.getElementById("statusFilter");
const playerCount = document.getElementById("playerCount");

async function loadJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path}`);
    }

    return await response.json();
}

async function init() {
    try {
        playersData = await loadJson(DATA_PATHS.players);
        teamsData = await loadJson(DATA_PATHS.teams);
        playersData = await loadJson(DATA_PATHS.players);
        teamsData = await loadJson(DATA_PATHS.teams);
        collegesData = await loadJson(DATA_PATHS.colleges);
        overseasTeamsData = await loadJson(DATA_PATHS.overseasTeams);
        overseasLeaguesData = await loadJson(DATA_PATHS.overseasLeagues);
        unrivaledTeamsData = await loadJson(DATA_PATHS.unrivaledTeams);

        renderPlayers();

        playerSearchInput.addEventListener("input", renderPlayers);
        statusFilter.addEventListener("change", renderPlayers);
    } catch (error) {
        playerReceiptGrid.innerHTML = `
            <p>Could not load player viewer data.</p>
            <pre>${error.message}</pre>
        `;
    }
}

function normalizePlayerRecord(playerId, playerRecord) {
  const hasPlayerDataWrapper = !!playerRecord?.playerData;
  const hasQuickAddStatus = !!playerRecord?.dataStatus?.isQuickAdd;

  return {
    playerId,
    isQuickAdd: hasPlayerDataWrapper || hasQuickAddStatus,
    data: hasPlayerDataWrapper ? playerRecord.playerData : playerRecord
  };
}

function getTeamsObject() {
    return teamsData.teams || teamsData;
}

function getFilteredPlayers() {
    const players = playersData.players || {};
    const searchValue = playerSearchInput.value.trim().toLowerCase();
    const statusValue = statusFilter.value;

    return Object.entries(players)
        .map(([playerId, playerRecord]) => {
            const normalized = normalizePlayerRecord(playerId, playerRecord);

            return [
                playerId,
                normalized.data,
                normalized.isQuickAdd
            ];
        })
        .filter(([playerId, player]) => {
            const name = (player.playerName || "").toLowerCase();
            const id = playerId.toLowerCase();

            const matchesSearch =
                !searchValue ||
                name.includes(searchValue) ||
                id.includes(searchValue);

            const isActive = !!player.playerStatus?.isActive;

            const matchesStatus =
                statusValue === "all" ||
                (statusValue === "active" && isActive) ||
                (statusValue === "inactive" && !isActive);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const nameA = a[1].playerName || a[0];
            const nameB = b[1].playerName || b[0];

            return nameA.localeCompare(nameB);
        });
}

function renderPlayers() {
    const filteredPlayers = getFilteredPlayers();
    const teams = getTeamsObject();
    const colleges = collegesData.colleges || {};
    const overseasTeams = overseasTeamsData.teams || overseasTeamsData || {};
    const overseasLeagues = overseasLeaguesData.leagues || overseasLeaguesData || {};
    const unrivaledTeams = unrivaledTeamsData.teams || unrivaledTeamsData || {};

    playerReceiptGrid.innerHTML = "";
    playerCount.textContent = `${filteredPlayers.length} players`;

    filteredPlayers.forEach(([playerId, player, isQuickAdd]) => {
        const receipt = PlayerReceiptRenderer.createReceipt({
            playerId,
            player,
            teams,
            colleges,
            overseasTeams,
            overseasLeagues,
            unrivaledTeams,
            compact: true,
            isQuickAdd
        });

        receipt.addEventListener("click", () => {
            PlayerReceiptRenderer.openPlayerModal({
                playerId,
                player,
                teams,
                colleges,
                overseasTeams,
                overseasLeagues,
                unrivaledTeams
            });
        });

        playerReceiptGrid.appendChild(receipt);
    });
}

init();