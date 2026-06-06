// WNBA Season Hub Viewer
// These paths assume this HTML/CSS/JS file is a direct child of your main project folder.

const DATA_PATHS = {
    seasonInfo: "basketball_101_data_files/wnba_season_general_info_data.json",
    teams: "basketball_101_data_files/wnba_static_data_v2.json",
    teamHistory: "basketball_101_data_files/wnba_teams_history.json",
    awards: "basketball_101_data_files/wnba_regular_season_awards_data.json",
    drafts: "basketball_101_data_files/wnba_drafts_data.json",
    calendarFolder: "basketball_101_data_files/wnba_calendar_data",
    teamSeasonRosters: "basketball_101_data_files/wnba_team_season_rosters_data.json",
    entries: "entries/entry data/wnba/wnba_entries_data.json"
};

const TOOL_PATHS = {
    seasonGeneralInfo: "input tools/season-general-info-input-tools/season-general-info-input.html",
    seasonCalendar: "input tools/season-calendar-input-tools/season-calendar-input.html",
    awards: "input tools/regular-season-awards-input-tools/regular-season-awards-input-tool.html",
    drafts: "input tools/draft-input-tools/draft-input-tool.html"
};

const state = {
    seasonInfoData: null,
    teamsData: null,
    teamHistoryData: null,
    awardsData: null,
    draftsData: null,
    gamedayData: null,
    teamSeasonRostersData: null,
    selectedSeason: null,
    entriesData: null
};

const els = {
    seasonSelect: document.getElementById("seasonSelect"),
    seasonRail: document.getElementById("seasonRail"),
    statusMessage: document.getElementById("statusMessage"),
    seasonHero: document.getElementById("seasonHero"),
    seasonPanels: document.getElementById("seasonPanels"),
    seasonEditorLink: document.getElementById("seasonEditorLink"),
    calendarEditorLink: document.getElementById("calendarEditorLink")
};

async function loadJson(path, options = {}) {
    const { optional = false } = options;

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Could not load ${path}`);
        }
        return response.json();
    } catch (error) {
        if (optional) {
            console.warn(`Optional data file skipped: ${path}`);
            return null;
        }
        throw error;
    }
}

async function init() {
    try {
        const [
            seasonInfoData,
            teamsData,
            teamHistoryData,
            awardsData,
            draftsData,
            entriesData,
            teamSeasonRostersData
        ] = await Promise.all([
            loadJson(DATA_PATHS.seasonInfo),
            loadJson(DATA_PATHS.teams),
            loadJson(DATA_PATHS.teamHistory),
            loadJson(DATA_PATHS.awards),
            loadJson(DATA_PATHS.drafts),
            loadJson(DATA_PATHS.entries, { optional: true }),
            loadJson(DATA_PATHS.teamSeasonRosters, { optional: true })
        ]);

        state.seasonInfoData = seasonInfoData;
        state.teamsData = teamsData;
        state.teamHistoryData = teamHistoryData;
        state.awardsData = awardsData;
        state.draftsData = draftsData;
        state.entriesData = entriesData;
        state.teamSeasonRostersData = teamSeasonRostersData;

        buildSeasonSelect();
        buildSeasonRail();

        EntriesRenderer.setupEntryModal();
        EntriesRenderer.setupEntriesPanelToggle();

        await loadGamedayForSeason(state.selectedSeason);

        renderSelectedSeason();

        els.statusMessage.textContent = "Season data loaded.";
    } catch (error) {
        console.error(error);
        els.statusMessage.textContent = "Could not load one or more required data files. Check DATA_PATHS.";
    }
}

function getSeasonList(order = "desc") {
    const seasons = Object.keys(state.seasonInfoData?.seasons || {})
        .sort((a, b) => Number(a) - Number(b));

    return order === "desc" ? seasons.reverse() : seasons;
}

function buildSeasonSelect() {
    const seasons = getSeasonList("desc");

    els.seasonSelect.innerHTML = seasons.map(season => {
        return `<option value="${season}">${season}</option>`;
    }).join("");

    state.selectedSeason = seasons[0] || null;
    els.seasonSelect.value = state.selectedSeason;

    els.seasonSelect.addEventListener("change", () => {
        setSelectedSeason(els.seasonSelect.value);
    });
}

function buildSeasonRail() {
    const firstSeason = 1997;
    const lastSeason = getLastSeasonYear();

    els.seasonRail.innerHTML = "";

    for (let year = firstSeason; year <= lastSeason; year++) {
        const season = String(year);
        const record = getSeasonRecord(season);
        const flags = record?.flags || {};

        const button = document.createElement("button");
        button.type = "button";
        button.className = "season-cell";
        button.dataset.season = season;

        if (record) {
            button.classList.add("has-data");
        }

        button.innerHTML = `
            <span class="season-year">${season}</span>
            <span class="season-node"></span>
            <span class="season-markers">
                ${getSeasonMarkers(flags)}
            </span>
        `;

        button.addEventListener("click", () => {
            setSelectedSeason(season);
        });

        els.seasonRail.appendChild(button);
    }

    updateSeasonRailActiveState();
}

async function setSelectedSeason(season) {
    state.selectedSeason = season;
    els.seasonSelect.value = season;

    await loadGamedayForSeason(season);

    renderSelectedSeason();
}

function getCalendarPathForSeason(seasonId) {
    return `${DATA_PATHS.calendarFolder}/wnba_${seasonId}_calendar_data.json`;
}

async function loadGamedayForSeason(seasonId) {
    const data = await loadJson(
        getCalendarPathForSeason(seasonId),
        { optional: true }
    );

    state.gamedayData = data || {
        season: Number(seasonId),
        seasonId,
        games: {}
    };
}

function updateSeasonRailActiveState() {
    if (!els.seasonRail) return;

    els.seasonRail.querySelectorAll(".season-cell").forEach(button => {
        const isActive = button.dataset.season === String(state.selectedSeason);

        button.classList.toggle("selected", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function getLastSeasonYear() {
    const seasonYears = Object.keys(state.seasonInfoData?.seasons || {})
        .map(Number)
        .filter(Boolean);

    if (!seasonYears.length) return 2026;

    return Math.max(...seasonYears, 2026);
}

function getSeasonMarkers(flags) {
    const markers = [];

    if (flags.isExpansionYear || flags.hasExpansionDraft) {
        markers.push(`<span class="season-marker expansion" title="Expansion season">E</span>`);
    }

    if (flags.hasRelocations || flags.hasFoldedTeams) {
        markers.push(`<span class="season-marker relocation" title="Relocation / folded team season">R</span>`);
    }

    if (flags.isCbaSeason) {
        markers.push(`<span class="season-marker cba" title="CBA season">C</span>`);
    }

    if (flags.hasCollegeDraft || flags.hasExpansionDraft || flags.hasDispersalDraft) {
        markers.push(`<span class="season-marker draft" title="Draft data">D</span>`);
    }

    return markers.join("");
}

function renderSelectedSeason() {
    const season = state.selectedSeason;
    const seasonRecord = getSeasonRecord(season);

    if (!seasonRecord) {
        els.seasonHero.innerHTML = `<p class="empty-state">No season record found.</p>`;
        els.seasonPanels.innerHTML = "";
        return;
    }

    updateSeasonRailActiveState();
    updateEditorLinks(seasonRecord);
    renderHero(seasonRecord);
    renderPanels(seasonRecord);
    bindEntryModalButtons();
}

function bindEntryModalButtons() {
    document.querySelectorAll("[data-entry-id]").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();

            const entryId = button.dataset.entryId;
            const entry = state.entriesData?.entries?.[entryId];

            if (!entry) return;

            EntriesRenderer.openEntryModal(entry);
        });
    });
}

function updateEditorLinks(seasonRecord) {
    const season = encodeURIComponent(seasonRecord.seasonId || seasonRecord.season);
    els.seasonEditorLink.href = `${TOOL_PATHS.seasonGeneralInfo}?season=${season}`;
    els.calendarEditorLink.href = `${TOOL_PATHS.seasonCalendar}?season=${season}`;
}

function getSeasonRecord(season) {
    return state.seasonInfoData?.seasons?.[season] || null;
}

function getTeam(teamCode) {
    return state.teamsData?.teams?.[teamCode] || null;
}

function getTeamName(teamCode) {
    if (!teamCode) return "Unknown team";
    return getTeam(teamCode)?.name?.full || teamCode;
}

function getTeamShort(teamCode) {
    if (!teamCode) return "—";
    return getTeam(teamCode)?.name?.short || getTeamName(teamCode);
}

function getTeamColor(teamCode) {
    return getTeam(teamCode)?.branding?.colors?.color1 || "#ddd";
}

function formatDate(value) {
    if (!value) return "—";
    return value;
}

function renderHero(seasonRecord) {
    const flags = seasonRecord.flags || {};
    const activeFlagCount = Object.values(flags).filter(Boolean).length;
    const awardsCount = getAwardsForSeason(seasonRecord).length;
    const draftsCount = getDraftsForSeason(seasonRecord).length;
    const gamesCount = getGamesForSeason(seasonRecord).length;

    els.seasonHero.innerHTML = `
        <div class="hero-title-row">
            <h2>${seasonRecord.season} Season</h2>
            <span class="chip">${activeFlagCount} active season flags</span>
        </div>

        <div class="stat-grid">
            <div class="stat-group">
                ${statCard("Start", formatDate(seasonRecord.startDate))}
                ${statCard("End", formatDate(seasonRecord.endDate))}
            </div>
            <div class="stat-group">
                ${statCard("Awards", awardsCount)}
                ${statCard("Drafts", draftsCount)}
            </div>
            <div class="stat-group">
                ${statCard("Teams", seasonRecord.numTeams ?? "—")}
                ${statCard("Games per Team", seasonRecord.regularSeasonGamesPerTeam ?? seasonRecord.regularSeasonGames ?? "—")}
            </div>
            <div class="stat-group">
                ${statCard("Saved Games", gamesCount)}
                ${statCard("Team Slots", seasonRecord.regularSeasonTeamGameSlots ?? "—")}
            </div>
        </div>
    `;
}

function statCard(label, value) {
    return `
        <article class="stat-card">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
        </article>
    `;
}

function renderPanels(seasonRecord) {
    els.seasonPanels.innerHTML = `
        ${viewerPanel("Season Overview", renderSeasonOverview(seasonRecord), true)}
        ${viewerPanel("Teams In This Season", renderTeamsPanel(seasonRecord), true)}
        ${viewerPanel("Regular Season Awards", renderAwardsPanel(seasonRecord), true)}
        ${viewerPanel("Drafts", renderDraftsPanel(seasonRecord), false)}
        ${viewerPanel("Schedule / Games", renderSchedulePanel(seasonRecord), false)}
        ${viewerPanel("Team Season Details", renderTeamSeasonDetailsPanel(seasonRecord), false)}
        ${viewerPanel("Entries + Notes", renderEntriesPlaceholder(seasonRecord), false)}
    `;
}

function viewerPanel(title, body, open = false) {
    return `
        <details class="viewer-panel" ${open ? "open" : ""}>
            <summary class="panel-summary">${title}</summary>
            <div class="panel-body">${body}</div>
        </details>
    `;
}

function nestedPanel(title, body, open = false) {
    return `
        <details class="nested-panel" ${open ? "open" : ""}>
            <summary>${title}</summary>
            <div class="nested-body">${body}</div>
        </details>
    `;
}

function renderSeasonOverview(seasonRecord) {
    const flags = seasonRecord.flags || {};
    const flagChips = Object.entries(flags)
        .map(([key, value]) => `<span class="chip ${value ? "positive" : "muted"}">${value ? "✓" : "—"} ${key}</span>`)
        .join("");

    const links = Array.isArray(seasonRecord.links) ? seasonRecord.links : [];

    return `
        <div class="nested-stack">

            ${nestedPanel("Season Flags", `<div class="chip-list">${flagChips || "No flags found."}</div>`, true)}

            ${nestedPanel("Details", `
                <div class="item-card">
                    ${metaRow("Season ID", seasonRecord.seasonId)}
                    ${metaRow("Regular season team game slots", seasonRecord.regularSeasonTeamGameSlots ?? "—")}
                    ${metaRow("Special season type", seasonRecord.specialSeasonType || "none")}
                    ${metaRow("CBA season", seasonRecord.flags?.isCbaSeason ? "yes" : "no")}
                </div>
            `, true)}

            ${nestedPanel("Notes + Links", `
                <div class="item-list">
                    <article class="item-card">
                        <div class="item-title">Notes</div>
                        <p class="small-meta">${seasonRecord.notes || "No season notes yet."}</p>
                    </article>
                    ${links.length ? links.map(link => `
                        <article class="item-card">
                            <div class="item-title">${link.label || link.title || "Source"}</div>
                            <div class="small-meta">${link.url || "No URL"}</div>
                        </article>
                    `).join("") : `<p class="empty-state">No links saved for this season yet.</p>`}
                </div>
            `)}
        </div>
    `;
}

function metaRow(label, value) {
    return `<div class="meta-row"><strong>${label}</strong><span>${value}</span></div>`;
}

function renderTeamsPanel(seasonRecord) {
    const seasonTeams = state.teamHistoryData?.[seasonRecord.seasonId]?.teams || [];

    if (!seasonTeams.length) {
        return `<p class="empty-state">No team history record found for ${seasonRecord.season}.</p>`;
    }

    const cards = seasonTeams.map(teamSeason => {
        const team = getTeam(teamSeason.teamCode);
        const color = getTeamColor(teamSeason.teamCode);
        const name = team?.name?.full || teamSeason.teamCode;
        const conference = team?.league?.conference || "unknown conference";

        const statusBits = [];
        if (teamSeason.isExpansion) statusBits.push("Expansion");
        if (teamSeason.isFinalSeason) statusBits.push("Final season");
        if (teamSeason.isRelocatingNextYear) statusBits.push("Relocating next year");
        if (teamSeason.isFirstSeasonAfterRelocation) statusBits.push("First season after relocation");

        return `
            <article class="team-card">
                <div class="team-color-bar" style="background:${color}"></div>
                <div class="team-name">${name}</div>
                <div class="team-meta">${teamSeason.teamCode} • ${conference}</div>
                <div class="chip-list" style="margin-top:10px;">
                    ${(statusBits.length ? statusBits : ["standard season"]).map(bit => `<span class="chip">${bit}</span>`).join("")}
                </div>
            </article>
        `;
    }).join("");

    return `<div class="team-grid">${cards}</div>`;
}

function getAwardsForSeason(seasonRecord) {
    const awards = state.awardsData?.seasons?.[seasonRecord.seasonId]?.awards || {};
    return Object.values(awards);
}

function renderAwardsPanel(seasonRecord) {
    const awards = getAwardsForSeason(seasonRecord);

    if (!awards.length) {
        return `<p class="empty-state">No awards saved for ${seasonRecord.season} yet.</p>`;
    }

    return `
        <div class="awards-table">
            <div class="awards-table-header">
                <span>Award</span>
                <span>Recipient</span>
                <span>Team</span>
            </div>

            ${awards.map(renderAwardRow).join("")}
        </div>
    `;
}

function renderAwardRow(award) {
    const recipient = award.recipient || {};
    const teamCode = recipient.teamCode || "";
    const attachedEntries = getEntriesForAward(award);

    return `
        <article class="award-row">
            <div class="award-row-main">
                <div class="award-name">${award.awardName || "Unnamed award"}</div>
                <div class="award-recipient">${recipient.playerName || "No recipient"}</div>
                <div class="award-team">
                    ${teamCode ? `
                        <span class="team-pill" style="border-color:${getTeamColor(teamCode)}">
                            ${getTeamName(teamCode)}
                        </span>
                    ` : "—"}
                </div>
            </div>

            ${attachedEntries.length ? `
                <div class="award-attached-entries">
                    ${attachedEntries.map(renderAttachedEntryPreview).join("")}
                </div>
            ` : ""}
        </article>
    `;
}

function getEntriesForAward(award) {
    const entries = Object.values(state.entriesData?.entries || {});

    return entries.filter(entry => {
        const attachedTo = Array.isArray(entry.attachedTo) ? entry.attachedTo : [];

        return attachedTo.some(target => {
            if (target.type !== "award") return false;

            return (
                target.id === award.awardKey ||
                target.id === award.awardId ||
                target.id === `${award.seasonId}_${award.awardKey}`
            );
        });
    });
}

function renderAttachedEntryPreview(entry) {
    return `
        <button class="attached-entry-card" type="button" data-entry-id="${entry.entryId}">
            <div class="attached-entry-label">Attached Entry</div>
            <div class="attached-entry-title">${entry.title || entry.entryId}</div>
            <div class="attached-entry-meta">
                ${entry.category || entry.entryType || "entry"}
            </div>
        </button>
    `;
}

function renderAwardCard(award) {
    const recipient = award.recipient || {};
    const teamCode = recipient.teamCode;
    const editUrl = `${TOOL_PATHS.awards}?season=${encodeURIComponent(award.seasonId || award.season || "")}&awardKey=${encodeURIComponent(award.awardKey || "")}&awardName=${encodeURIComponent(award.awardName || "")}&recipientName=${encodeURIComponent(recipient.playerName || "")}&playerId=${encodeURIComponent(recipient.playerId || "")}&teamCode=${encodeURIComponent(teamCode || "")}`;

    return `
        <article class="award-card">
            <div class="award-title">${award.awardName || award.awardKey}</div>
            <div class="award-meta">${recipient.playerName || "No recipient"}</div>
            <div class="chip-list" style="margin-top:10px;">
                <span class="chip">${award.awardKey || "award"}</span>
                ${teamCode ? `<span class="chip" style="border-color:${getTeamColor(teamCode)}">${getTeamShort(teamCode)}</span>` : ""}
            </div>
            <div style="margin-top:12px;">
                <a class="small-link" href="${editUrl}">Open Award Editor</a>
            </div>
        </article>
    `;
}

function getDraftsForSeason(seasonRecord) {
    return Object.values(state.draftsData?.drafts || {})
        .filter(draft => String(draft.seasonId || draft.season) === String(seasonRecord.seasonId));
}

function renderDraftsPanel(seasonRecord) {
    const drafts = getDraftsForSeason(seasonRecord);

    if (!drafts.length) {
        return `<p class="empty-state">No draft records connected to ${seasonRecord.season} yet.</p>`;
    }

    return `<div class="nested-stack">${drafts.map(draft => {
        const pickCount = countDraftPicks(draft);
        const draftSetup = renderDraftSetup(draft);

        const roundPanels = Object.values(draft.rounds || {}).map(round => {
            const picks = Object.values(round.picks || {}).sort((a, b) => Number(a.overallPick) - Number(b.overallPick));
            const pickCards = picks.length ? picks.map(renderPickCard).join("") : `<p class="empty-state">No picks entered for this round.</p>`;
            return nestedPanel(`Round ${round.roundNumber}`, `<div class="item-list">${pickCards}</div>`);
        }).join("");

        return nestedPanel(`${draft.draftName || draft.draftId} (${pickCount} picks)`, `
            <div class="nested-stack">
                ${nestedPanel("Draft Setup", draftSetup, true)}
                ${roundPanels}
            </div>
        `, true);
    }).join("")}</div>`;
}

function countDraftPicks(draft) {
    return Object.values(draft.rounds || {}).reduce((total, round) => {
        return total + Object.keys(round.picks || {}).length;
    }, 0);
}

function renderDraftSetup(draft) {
    const expansionTeams = draft.specialTeams?.expansionTeams || [];
    const dispersalTeams = draft.specialTeams?.dispersalTeams || [];

    return `
        <div class="item-card">
            ${metaRow("Draft ID", draft.draftId)}
            ${metaRow("Draft type", draft.draftType)}
            ${metaRow("Rounds", draft.roundsCount ?? "—")}
            ${metaRow("Draft date", draft.draftDate || "—")}
            ${metaRow("Expansion teams", expansionTeams.map(team => team.teamName || getTeamName(team.teamCode)).join(", ") || "—")}
            ${metaRow("Dispersal teams", dispersalTeams.map(team => team.teamName || getTeamName(team.teamCode)).join(", ") || "—")}
        </div>
    `;
}

function renderPickCard(pick) {
    const player = pick.player || {};
    const college = pick.college;
    const overseas = pick.overseas;

    return `
        <article class="item-card">
            <div class="item-title">#${pick.overallPick} ${player.playerName || "Unknown Player"}</div>
            <div class="small-meta">Round ${pick.round}, Pick ${pick.roundPick}</div>
            <div class="chip-list" style="margin-top:10px;">
                <span class="chip" style="border-color:${getTeamColor(pick.team?.teamCode)}">${pick.team?.teamName || getTeamName(pick.team?.teamCode)}</span>
                ${pick.previousTeam ? `<span class="chip warning">from ${pick.previousTeam.teamName || getTeamName(pick.previousTeam.teamCode)}</span>` : ""}
                ${college ? `<span class="chip">${college.collegeName || college.collegeId}</span>` : ""}
                ${overseas ? `<span class="chip">${overseas.country || "overseas"}</span>` : ""}
            </div>
            ${pick.notes ? `<p class="small-meta" style="margin-top:10px;">${pick.notes}</p>` : ""}
        </article>
    `;
}

function getGamesForSeason(seasonRecord) {
    const data = state.gamedayData;

    if (!data?.games) {
        return [];
    }

    return Object.values(data.games)
        .filter(game => String(game.seasonId || game.season) === String(seasonRecord.seasonId));
}

function renderSchedulePanel(seasonRecord) {
    const games = getGamesForSeason(seasonRecord)
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

    if (!state.gamedayData) {
        return `<p class="empty-state">No gameday calendar file loaded yet. Once you add wnba_gameday_calendar_data.json, this panel will show saved games.</p>`;
    }

    if (!games.length) {
        return `<p class="empty-state">No games saved for ${seasonRecord.season} yet.</p>`;
    }

    const gamesByDate = groupBy(games, game => game.date || "NO_DATE");

    return `<div class="nested-stack">${Object.entries(gamesByDate).map(([date, dateGames]) => {
        return nestedPanel(`${date} (${dateGames.length} games)`, `<div class="game-grid">${dateGames.map(renderGameCard).join("")}</div>`);
    }).join("")}</div>`;
}

function renderGameCard(game) {
    const away = game.awayTeam || game.awayTeamCode || game.away?.teamCode;
    const home = game.homeTeam || game.homeTeamCode || game.home?.teamCode;

    const score = game.score || {};

    const isFinal =
        game.status === "final" ||
        score.isFinal === true;

    const awayIsWinner =
        isFinal && score.winner === away;

    const homeIsWinner =
        isFinal && score.winner === home;

    return `
        <article class="game-card ${isFinal ? "is-final" : ""}">
            <div class="game-title-row">
                <span class="game-title">
                    ${getTeamShort(away)} ${isFinal ? "vs" : "at"} ${getTeamShort(home)}
                </span>

                ${isFinal ? `<span class="final-chip">Final</span>` : ""}
            </div>

            <div class="game-meta">${game.gameId || game.entryId || "No game ID"}</div>

            <div class="game-score-row">
                <span class="game-team-chip ${awayIsWinner ? "winner-team-chip" : ""}" style="border-color:${getTeamColor(away)}">
                    ${getTeamShort(away)}
                    ${isFinal ? `<strong>${score.awayScore ?? "—"}</strong>` : ""}
                </span>

                <span class="game-team-chip ${homeIsWinner ? "winner-team-chip" : ""}" style="border-color:${getTeamColor(home)}">
                    ${getTeamShort(home)}
                    ${isFinal ? `<strong>${score.homeScore ?? "—"}</strong>` : ""}
                </span>
            </div>

            <div class="chip-list" style="margin-top:10px;">
                <span class="chip">${game.specialGame?.label || game.gameType || "game"}</span>
                <span class="chip ${isFinal ? "positive" : "muted"}">${isFinal ? "final score saved" : (game.status || "scheduled")}</span>
            </div>
        </article>
    `;
}

function renderTeamSeasonDetailsPanel(seasonRecord) {
    const data = state.teamSeasonRostersData;

    if (!data) {
        return `<p class="empty-state">No team season roster/details file loaded yet. This panel is ready for wnba_team_season_rosters_data.json.</p>`;
    }

    const records = Object.values(data.teamSeasons || {})
        .filter(record => String(record.seasonId || record.season) === String(seasonRecord.seasonId));

    if (!records.length) {
        return `<p class="empty-state">No team-season detail records saved for ${seasonRecord.season} yet.</p>`;
    }

    return `<div class="team-grid">${records.map(record => `
        <article class="team-card">
            <div class="team-color-bar" style="background:${getTeamColor(record.teamCode)}"></div>
            <div class="team-name">${getTeamName(record.teamCode)}</div>
            <div class="team-meta">${record.players?.length || 0} saved players</div>
            <div class="small-meta">${record.notes || "No notes yet."}</div>
        </article>
    `).join("")}</div>`;
}

function renderEntriesPlaceholder(seasonRecord) {
    return `
        <div class="nested-stack">
            ${nestedPanel("Season Attachments", `
                <p class="empty-state">
                    Entries can plug in here later by matching attachedTo: { type: "season", id: "${seasonRecord.seasonId}" }
                    or wires: ["wnba-season-viewer"].
                </p>
            `, true)}
            ${nestedPanel("Future Entry Types", `
                <div class="chip-list">
                    <span class="chip">season notes</span>
                    <span class="chip">award definitions</span>
                    <span class="chip">draft context</span>
                    <span class="chip">team history notes</span>
                    <span class="chip">game recaps</span>
                </div>
            `)}
        </div>
    `;
}

function groupBy(items, getKey) {
    return items.reduce((groups, item) => {
        const key = getKey(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {});
}


init();
