const DATA_PATHS = {
    players: "../../basketball_101_data_files/wnba_olympic_players_v2.json",
    colleges: "../../basketball_101_data_files/wnba_colleges.json",
    awards: "../../basketball_101_data_files/wnba_regular_season_awards_data.json",
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json",
    teams: "../../basketball_101_data_files/wnba_static_data_v2.json"
};

const PLAYER_INPUT_TOOL_PATH =
    "../../input tools/player-input-tools/player-input-tool.html";

const DRAFT_INPUT_TOOL_PATH =
    "../../input tools/draft-input-tools/draft-input-tool.html";

const AWARDS_INPUT_TOOL_PATH =
    "../../input tools/regular-season-awards-input-tools/regular-season-awards-input-tool.html";

const COLLEGE_INPUT_TOOL_PATH =
    "../../input tools/college-input-tools/college-input.html";

const SAVE_PLAYER_URL = "http://127.0.0.1:8787/save-player";

let PLAYERS = {};
let COLLEGES = {};
let AWARDS_DATA = { seasons: {} };
let DRAFTS_DATA = { drafts: {} };
let TEAMS = {};

const runChecksBtn = document.getElementById("runChecksBtn");
const statusMessage = document.getElementById("statusMessage");

const missingPlayersCount = document.getElementById("missingPlayersCount");
const missingCollegesCount = document.getElementById("missingCollegesCount");
const teamMismatchCount = document.getElementById("teamMismatchCount");
const okCount = document.getElementById("okCount");

const missingPlayersList = document.getElementById("missingPlayersList");
const missingCollegesList = document.getElementById("missingCollegesList");
const quickAddPlayersCount = document.getElementById("quickAddPlayersCount");
const quickAddPlayersList = document.getElementById("quickAddPlayersList");
const missingImagesCount = document.getElementById("missingImagesCount");
const missingImagesList = document.getElementById("missingImagesList");
const teamMismatchList = document.getElementById("teamMismatchList");
const okList = document.getElementById("okList");

async function loadJson(path, fallback) {
    try {
        const cacheBustPath = `${path}?v=${Date.now()}`;

        const response = await fetch(cacheBustPath, {
            cache: "no-store"
        });

        if (!response.ok) return fallback;

        const text = await response.text();
        if (!text.trim()) return fallback;

        return JSON.parse(text);
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

function makeId(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getTeamName(teamCode) {
    return TEAMS[teamCode]?.name?.full || teamCode || "No team listed";
}

function playerHasImage(player) {
    if (!player) return false;

    const data = player.playerData || player;

    if (typeof data.image === "string" && data.image.trim() !== "") {
        return true;
    }

    if (typeof data.image?.src === "string" && data.image.src.trim() !== "") {
        return true;
    }

    if (typeof data.imagePath === "string" && data.imagePath.trim() !== "") {
        return true;
    }

    if (typeof data.imageSrc === "string" && data.imageSrc.trim() !== "") {
        return true;
    }

    if (Array.isArray(data.images)) {
        return data.images.some(image => {
            if (typeof image === "string") {
                return image.trim() !== "";
            }

            return typeof image?.src === "string" &&
                image.src.trim() !== "";
        });
    }

    return false;
}

async function loadAllData() {
    const playersData = await loadJson(DATA_PATHS.players, { players: {} });
    const collegesData = await loadJson(DATA_PATHS.colleges, { colleges: {} });
    const awardsData = await loadJson(DATA_PATHS.awards, { seasons: {} });
    const draftsData = await loadJson(DATA_PATHS.drafts, { drafts: {} });
    const teamsData = await loadJson(DATA_PATHS.teams, { teams: {} });

    PLAYERS = playersData.players || {};
    COLLEGES = collegesData.colleges || {};
    AWARDS_DATA = awardsData || { seasons: {} };
    DRAFTS_DATA = draftsData || { drafts: {} };
    TEAMS = teamsData.teams || {};
}

function collectAwardPlayerReferences() {
    const references = [];

    Object.values(AWARDS_DATA.seasons || {}).forEach(seasonData => {
        Object.values(seasonData.awards || {}).forEach(award => {
            const playerId = award.recipient?.playerId;
            const playerName = award.recipient?.playerName;

            if (!playerId && !playerName) return;

            references.push({
                entityType: "player",
                entityId: playerId || makeId(playerName),
                displayName: playerName || playerId,
                sourceType: "regular-season-award",
                sourceLabel: `${seasonData.seasonId} — ${award.awardName}`,
                teamCode: award.recipient?.teamCode || "",
                season: seasonData.season,
                awardId: award.awardId,
                awardKey: award.awardKey,
                awardName: award.awardName
            });
        });
    });

    return references;
}

function collectDraftPlayerReferences() {
    const references = [];

    Object.values(DRAFTS_DATA.drafts || {}).forEach(draft => {
        Object.values(draft.rounds || {}).forEach(round => {
            Object.values(round.picks || {}).forEach(pick => {
                if (!pick.player) return;

                const playerId = pick.player.playerId;
                const playerName = pick.player.playerName;

                references.push({
                    entityType: "player",
                    entityId: playerId || makeId(playerName),
                    displayName: playerName || playerId,
                    sourceType: "draft",
                    sourceLabel: `${draft.draftName} — Pick #${pick.overallPick}`,
                    teamCode: pick.team?.teamCode || "",
                    season: draft.season,
                    draftId: draft.draftId,
                    draftType: draft.draftType,
                    pickId: pick.pickId,
                    autofill: {
                        draftYear: draft.season,
                        draftPick: pick.overallPick,
                        draftRound: pick.round,
                        draftRoundPick: pick.roundPick,
                        draftedBy: pick.team?.teamCode || "",
                        collegeId: pick.college?.collegeId || "",
                        collegeName: pick.college?.collegeName || "",
                        previousTeamCode: pick.previousTeam?.teamCode || ""
                    }
                });
            });
        });
    });

    return references;
}

function collectDraftCollegeReferences() {
    const references = [];

    Object.values(DRAFTS_DATA.drafts || {}).forEach(draft => {
        Object.values(draft.rounds || {}).forEach(round => {
            Object.values(round.picks || {}).forEach(pick => {
                if (!pick.college) return;

                references.push({
                    entityType: "college",
                    entityId: pick.college.collegeId,
                    displayName: pick.college.collegeName,
                    sourceType: "draft",
                    sourceLabel: `${draft.draftName} — Pick #${pick.overallPick}`,
                    draftId: draft.draftId,
                    pickId: pick.pickId,
                    existsInCollegeFile: pick.college.existsInCollegeFile
                });
            });
        });
    });

    return references;
}

function buildIssues() {
    const issues = [];

    const playerRefs = [
        ...collectAwardPlayerReferences(),
        ...collectDraftPlayerReferences()
    ];

    playerRefs.forEach(ref => {
        const player = PLAYERS[ref.entityId];

        if (!player) {
            issues.push({
                issueType: "missing-player",
                entityType: "player",
                entityId: ref.entityId,
                displayName: ref.displayName,
                sources: [ref]
            });
            return;
        }

        if (player.dataStatus?.needsFullProfile) {
            issues.push({
                issueType: "quick-add-player",
                entityType: "player",
                entityId: ref.entityId,
                displayName: ref.displayName,
                sources: [ref]
            });
            return;
        }

        if (ref.entityId === "angel_reese") {
            console.log("Angel Reese player object:", player);
            console.log("Angel Reese has image?", playerHasImage(player));
        }

        if (!playerHasImage(player)) {
            issues.push({
                issueType: "missing-player-image",
                entityType: "player",
                entityId: ref.entityId,
                displayName: ref.displayName,
                sources: [ref]
            });
            return;
        }

        issues.push({
            issueType: "ok",
            entityType: "player",
            entityId: ref.entityId,
            displayName: ref.displayName,
            sources: [ref]
        });
    });

    const collegeRefs = collectDraftCollegeReferences();

    collegeRefs.forEach(ref => {
        const collegeExists = Boolean(COLLEGES[ref.entityId]);

        if (!collegeExists) {
            issues.push({
                issueType: "missing-college",
                entityType: "college",
                entityId: ref.entityId,
                displayName: ref.displayName,
                sources: [ref]
            });
        } else {
            issues.push({
                issueType: "ok",
                entityType: "college",
                entityId: ref.entityId,
                displayName: ref.displayName,
                sources: [ref]
            });
        }
    });

    return groupIssuesByEntity(issues);
}

function groupIssuesByEntity(issues) {
    const grouped = {};

    issues.forEach(issue => {
        const key = `${issue.issueType}::${issue.entityType}::${issue.entityId}`;

        if (!grouped[key]) {
            grouped[key] = {
                ...issue,
                sources: []
            };
        }

        grouped[key].sources.push(...issue.sources);
    });

    return Object.values(grouped);
}

function buildPlayerEditorUrl(issue) {
    const params = new URLSearchParams();

    params.set("mode", "create");
    params.set("playerId", issue.entityId || "");
    params.set("playerName", issue.displayName || "");

    const draftSource = issue.sources.find(source => source.sourceType === "draft");

    if (draftSource?.autofill) {
        Object.entries(draftSource.autofill).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, value);
            }
        });
    }

    return `${PLAYER_INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildCollegeEditorUrl(issue) {
    const params = new URLSearchParams();

    params.set("mode", "create");
    params.set("collegeId", issue.entityId || "");
    params.set("collegeName", issue.displayName || "");

    return `${COLLEGE_INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildDraftEditorUrl(source) {
    const params = new URLSearchParams();

    params.set("draftId", source.draftId || "");
    params.set("pickId", source.pickId || "");
    params.set("mode", source.pickId ? "pick" : "draft");

    return `${DRAFT_INPUT_TOOL_PATH}?${params.toString()}`;
}

function buildAwardEditorUrl(source) {
    const params = new URLSearchParams();

    params.set("season", source.season || "");
    params.set("awardId", source.awardId || "");
    params.set("awardKey", source.awardKey || "");
    params.set("awardName", source.awardName || "");

    return `${AWARDS_INPUT_TOOL_PATH}?${params.toString()}`;
}

function getIssueLabel(issueType) {
    const labels = {
        "missing-player": "Player needs to be added",
        "missing-college": "College needs to be added",
        "quick-add-player": "Quick-added player needs full profile",
        "missing-player-image": "Player image needs to be added",
        "team-mismatch": "Team history needs review",
        "ok": "Looks okay"
    };

    return labels[issueType] || issueType;
}

function buildQuickAddPlayer(issue) {
    const draftSource = issue.sources.find(source => source.sourceType === "draft");
    const awardSource = issue.sources.find(source => source.sourceType === "regular-season-award");

    const autofill = draftSource?.autofill || {};

    return {
        playerId: issue.entityId,
        playerName: issue.displayName,

        playerStatus: {
            isActive: true,
            hasNcaaChampionships: false,
            wasDraftDayTrade: false,
            hasWnbaChampionships: false,
            hasOverseasExperience: false,
            hasUnrivaledExperience: false,
            hasNationalTeamExperience: false,
            hasOlympicExperience: false
        },

        careerDetails: {
            collegeCareer: {
                collegeId: autofill.collegeId || "",
                collegeName: autofill.collegeName || "",
                startYear: "",
                endYear: "",
                ncaaChampionships: []
            },

            draftDetails: {
                year: autofill.draftYear || "",
                pick: autofill.draftPick || "",
                round: autofill.draftRound || "",
                roundPick: autofill.draftRoundPick || "",
                draftedBy: autofill.draftedBy || "",
                acquiredBy: "",
                transactionNote: ""
            },

            wnbaTeams: awardSource?.teamCode
                ? [
                    {
                        teamCode: awardSource.teamCode,
                        startYear: awardSource.season,
                        endYear: "",
                        transactionNote: "Quick-added from award reference."
                    }
                ]
                : [],

            missedWnbaSeasons: [],
            overseasTeams: [],
            unrivaledTeams: [],
            teamUsaMedals: []
        },

        wnbaSeasons: {},

        images: [],

        dataStatus: {
            isQuickAdd: true,
            needsFullProfile: true,
            quickAddSource: "command-center",
            quickAddReason: "missing-player-reference",
            quickAddedAt: new Date().toISOString()
        }
    };
}

function renderIssueList(container, issues) {
    container.innerHTML = "";

    if (!issues.length) {
        container.innerHTML = `<p class="empty-message">No issues found.</p>`;
        return;
    }

    issues.forEach(issue => {
        const card = document.createElement("article");
        card.className = `issue-card ${issue.issueType}`;

        const sourceList = issue.sources
            .map(source => `<li>${source.sourceLabel}</li>`)
            .join("");

        let primaryAction = "";

        if (issue.issueType === "missing-player") {
            primaryAction = `
                <button type="button" class="quick-add-player-btn">
                    Quick Add Player
                </button>

                <button class="secondary-btn" type="button" data-url="${buildPlayerEditorUrl(issue)}">
                    Start Full Player Profile
                </button>
            `;
        }

        if (issue.issueType === "missing-college") {
            primaryAction = `
                <button type="button" data-url="${buildCollegeEditorUrl(issue)}">
                    Start Adding College
                </button>
            `;
        }

        if (issue.issueType === "quick-add-player") {
            primaryAction = `
                <button type="button" data-url="${buildPlayerEditorUrl(issue)}">
                    Finish Full Player Profile
                </button>
            `;
        }

        if (issue.issueType === "missing-player-image") {
            primaryAction = `
                <button type="button" data-url="${buildPlayerEditorUrl(issue)}">
                    Open Player Editor
                </button>
            `;
        }

        const sourceActions = issue.sources
            .map(source => {
                if (source.sourceType === "draft") {
                    return `
                        <button class="secondary-btn" type="button" data-url="${buildDraftEditorUrl(source)}">
                            Open Draft Pick
                        </button>
                    `;
                }

                if (source.sourceType === "regular-season-award") {
                    return `
                        <button class="secondary-btn" type="button" data-url="${buildAwardEditorUrl(source)}">
                            Open Award
                        </button>
                    `;
                }

                return "";
            })
            .join("");

            card.innerHTML = `
                <div class="issue-title">${issue.displayName || issue.entityId}</div>

                <div class="issue-meta">
                    <div class="issue-row issue-type-row">
                        <span class="issue-label">Issue</span>
                        <span class="issue-value issue-type-text">${getIssueLabel(issue.issueType)}</span>
                    </div>

                    <div class="issue-row issue-id-row">
                        <span class="issue-label">ID</span>
                        <span class="issue-value">${issue.entityId}</span>
                    </div>

                    <div class="issue-row issue-source-row">
                        <span class="issue-label">Found In</span>
                        <ul class="issue-source-list">${sourceList}</ul>
                    </div>
                </div>

                <div class="issue-actions">
                    ${primaryAction}
                    ${sourceActions}
                </div>
            `;

        card.querySelectorAll("button[data-url]").forEach(button => {
            button.addEventListener("click", event => {
                window.location.href = event.currentTarget.dataset.url;
            });
        });

        const quickAddBtn = card.querySelector(".quick-add-player-btn");

        if (quickAddBtn) {
            quickAddBtn.addEventListener("click", () => {
                quickAddPlayer(issue);
            });
        }

        container.appendChild(card);
    });
}

function renderResults(issues) {
    const missingPlayers = issues.filter(issue => issue.issueType === "missing-player");
    const quickAddPlayers = issues.filter(issue => issue.issueType === "quick-add-player");
    const missingImages = issues.filter(issue => issue.issueType === "missing-player-image");
    const missingColleges = issues.filter(issue => issue.issueType === "missing-college");
    const teamMismatches = issues.filter(issue => issue.issueType === "team-mismatch");
    const okIssues = issues.filter(issue => issue.issueType === "ok");

    missingPlayersCount.textContent = missingPlayers.length;
    quickAddPlayersCount.textContent = quickAddPlayers.length;
    missingImagesCount.textContent = missingImages.length;
    missingCollegesCount.textContent = missingColleges.length;
    teamMismatchCount.textContent = teamMismatches.length;
    okCount.textContent = okIssues.length;

    renderIssueList(missingPlayersList, missingPlayers);
    renderIssueList(quickAddPlayersList, quickAddPlayers);
    renderIssueList(missingImagesList, missingImages);
    renderIssueList(missingCollegesList, missingColleges);
    renderIssueList(teamMismatchList, teamMismatches);
    renderIssueList(okList, okIssues);
}

function bindPanelToggles() {
    document.querySelectorAll(".issue-panel").forEach(panel => {
        const toggle = panel.querySelector(".panel-toggle");

        if (!toggle) return;

        toggle.addEventListener("click", () => {
            panel.classList.toggle("collapsed");

            const icon = panel.querySelector(".panel-toggle-icon");
            if (icon) {
                icon.textContent = panel.classList.contains("collapsed") ? "+" : "−";
            }
        });
    });
}

bindPanelToggles();

async function runChecks() {
    statusMessage.textContent = "Loading data...";

    await loadAllData();

    const issues = buildIssues();

    renderResults(issues);

    statusMessage.textContent = `Checked ${issues.length} grouped issue records.`;
}

async function quickAddPlayer(issue) {
    const playerPayload = buildQuickAddPlayer(issue);

    try {
        statusMessage.textContent = `Quick adding ${playerPayload.playerName}...`;

        const response = await fetch(SAVE_PLAYER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(playerPayload)
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
            throw new Error(result.error || "Quick add failed.");
        }

        PLAYERS[playerPayload.playerId] = playerPayload;

        statusMessage.textContent = `Quick added ${playerPayload.playerName}.`;

        runChecks();
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
}

runChecksBtn.addEventListener("click", runChecks);
runChecks();