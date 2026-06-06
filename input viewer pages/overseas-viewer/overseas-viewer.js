const DATA_PATHS = {
    leagues: "../../basketball_101_data_files/overseas_leagues_data.json",
    teams: "../../basketball_101_data_files/overseas_teams_data.json",
    players: "../../basketball_101_data_files/wnba_olympic_players_v2.json"
};

const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const countryFilter = document.getElementById("countryFilter");
const summaryPanel = document.getElementById("summaryPanel");
const viewerOutput = document.getElementById("viewerOutput");

let leaguesData = { leagues: {} };
let teamsData = { teams: {} };
let playersData = { players: {} };

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(path);
        return await response.json();
    } catch (error) {
        console.warn("Could not load:", path);
        return fallback;
    }
}

function normalizeLeagues(data) {
    return data?.leagues ? data.leagues : data || {};
}

function normalizeTeams(data) {
    return data?.teams ? data.teams : data || {};
}

function normalizePlayers(data) {
    return data?.players ? data.players : data || {};
}

function unwrapPlayer(playerRecord) {
    return playerRecord?.playerData || playerRecord;
}

function getLeagueName(league) {
    return league?.name?.display || league?.name?.full || league?.name?.official || league?.leagueCode || "Unknown League";
}

function getTeamName(team) {
    return team?.name?.display || team?.name?.full || team?.name?.official || team?.teamCode || "Unknown Team";
}

function getPlayersForTeam(teamCode) {
    return Object.values(normalizePlayers(playersData))
        .map(unwrapPlayer)
        .filter(player => {
            const overseasTeams = player?.careerDetails?.overseasTeams || [];
            return overseasTeams.some(entry => entry.teamCode === teamCode);
        })
        .map(player => player.playerName || player.playerId || "Unknown Player")
        .sort((a, b) => a.localeCompare(b));
}

function getTeamsForLeague(leagueCode) {
    return Object.values(normalizeTeams(teamsData))
        .filter(team => team?.league?.leagueCode === leagueCode)
        .sort((a, b) => getTeamName(a).localeCompare(getTeamName(b)));
}

function populateFilters() {
    const leagues = Object.values(normalizeLeagues(leaguesData));

    const regions = [...new Set(leagues.map(league => league.location?.region).filter(Boolean))].sort();
    const countries = [...new Set(leagues.map(league => league.location?.country).filter(Boolean))].sort();

    regions.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

function renderSummary() {
    const leagues = Object.values(normalizeLeagues(leaguesData));
    const teams = Object.values(normalizeTeams(teamsData));

    const connectedTeamCodes = new Set();

    Object.values(normalizePlayers(playersData)).forEach(record => {
        const player = unwrapPlayer(record);
        (player?.careerDetails?.overseasTeams || []).forEach(entry => {
            if (entry.teamCode) connectedTeamCodes.add(entry.teamCode);
        });
    });

    summaryPanel.innerHTML = `
        <article class="summary-card">
            <span class="summary-number">${leagues.length}</span>
            <span class="summary-label">Leagues</span>
        </article>

        <article class="summary-card">
            <span class="summary-number">${teams.length}</span>
            <span class="summary-label">Teams</span>
        </article>

        <article class="summary-card">
            <span class="summary-number">${connectedTeamCodes.size}</span>
            <span class="summary-label">Teams with WNBA Players</span>
        </article>

        <article class="summary-card">
            <span class="summary-number">${Object.keys(normalizePlayers(playersData)).length}</span>
            <span class="summary-label">Players Checked</span>
        </article>
    `;
}

function itemMatchesSearch(league, teams, search) {
    if (!search) return true;

    const teamText = teams.map(team => {
        const players = getPlayersForTeam(team.teamCode).join(" ");

        return [
            getTeamName(team),
            team.teamCode,
            team.location?.display,
            team.location?.country,
            team.location?.subRegion,
            players
        ].join(" ");
    }).join(" ");

    const text = [
        getLeagueName(league),
        league.leagueCode,
        league.location?.country,
        league.location?.region,
        teamText
    ].join(" ").toLowerCase();

    return text.includes(search);
}

function renderViewer() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedRegion = regionFilter.value;
    const selectedCountry = countryFilter.value;

    const leagues = Object.values(normalizeLeagues(leaguesData))
        .filter(league => {
            if (selectedRegion && league.location?.region !== selectedRegion) return false;
            if (selectedCountry && league.location?.country !== selectedCountry) return false;

            const teams = getTeamsForLeague(league.leagueCode);
            return itemMatchesSearch(league, teams, search);
        })
        .sort((a, b) => {
            const regionCompare = String(a.location?.region || "").localeCompare(String(b.location?.region || ""));
            if (regionCompare !== 0) return regionCompare;
            return getLeagueName(a).localeCompare(getLeagueName(b));
        });

    viewerOutput.innerHTML = "";

    if (!leagues.length) {
        viewerOutput.innerHTML = `<section class="panel"><p>No overseas data found.</p></section>`;
        return;
    }

    let currentRegion = null;

    leagues.forEach(league => {
        const region = league.location?.region || "Unsorted Region";

        if (region !== currentRegion) {
            currentRegion = region;

            const heading = document.createElement("h2");
            heading.className = "region-heading";
            heading.textContent = currentRegion;
            viewerOutput.appendChild(heading);
        }

        const teams = getTeamsForLeague(league.leagueCode);

        const panel = document.createElement("section");
        panel.className = "league-panel";

        panel.innerHTML = `
            <div class="league-header">
                <div>
                    <h3 class="league-title">${getLeagueName(league)}</h3>
                    <div class="meta-line">${league.leagueCode || ""}</div>
                    <div class="meta-line">${league.location?.country || ""}</div>
                </div>

                <div>
                    <div class="meta-line">Teams entered: ${teams.length}</div>
                    <div class="meta-line">Sponsor: ${league.name?.currentSponsor || "—"}</div>
                </div>
            </div>

            <div class="team-grid"></div>
        `;

        const teamGrid = panel.querySelector(".team-grid");

        if (!teams.length) {
            teamGrid.innerHTML = `<p class="empty-note">No teams entered for this league yet.</p>`;
        } else {
            teams.forEach(team => {
                const players = getPlayersForTeam(team.teamCode);

                const card = document.createElement("article");
                card.className = "team-card";

                card.innerHTML = `
                    <h4 class="team-title">${getTeamName(team)}</h4>
                    <div class="meta-line">${team.teamCode || ""}</div>
                    <div class="meta-line">${team.location?.display || ""}</div>
                    <div class="meta-line">Club: ${team.name?.club || "—"}</div>
                    <div class="meta-line">Sponsor: ${team.name?.currentSponsor || "—"}</div>

                    <div class="player-list">
                        <strong>WNBA Players:</strong>
                        <div>
                            ${
                                players.length
                                    ? players.map(name => `<span class="player-pill">${name}</span>`).join("")
                                    : `<span class="empty-note">No connected players yet.</span>`
                            }
                        </div>
                    </div>
                `;

                teamGrid.appendChild(card);
            });
        }

        viewerOutput.appendChild(panel);
    });
}

async function init() {
    leaguesData = await loadJson(DATA_PATHS.leagues, { leagues: {} });
    teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });
    playersData = await loadJson(DATA_PATHS.players, { players: {} });

    populateFilters();
    renderSummary();
    renderViewer();
}

searchInput.addEventListener("input", renderViewer);
regionFilter.addEventListener("change", renderViewer);
countryFilter.addEventListener("change", renderViewer);

init();