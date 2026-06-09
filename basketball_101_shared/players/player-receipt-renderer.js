const PlayerReceiptRenderer = (() => {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getImage(player) {
        if (Array.isArray(player.images) && player.images.length) {
            return player.images[0];
        }

        return player.image || null;
    }

    function getTeamName(teamCode, teams = {}) {
        const team = teams[teamCode];

        return (
            team?.name?.full ||
            team?.fullName ||
            team?.teamName ||
            teamCode ||
            ""
        );
    }

    function getCollegeName(collegeId, colleges = {}) {
        const college = colleges[collegeId];

        return (
            college?.name?.full ||
            college?.name ||
            college?.schoolName ||
            collegeId ||
            ""
        );
    }

    function getCollegeCareers(player, colleges = {}) {
        const career = player.careerDetails || {};
        const collegeCareers = career.collegeCareers || [];

        if (collegeCareers.length) {
            return collegeCareers;
        }

        const legacyCollege = career.collegeCareer || {};

        if (legacyCollege.collegeId || legacyCollege.collegeName) {
            return [
                {
                    collegeId: legacyCollege.collegeId || "",
                    collegeName: legacyCollege.collegeName || "",
                    startYear: legacyCollege.startYear || "",
                    endYear: legacyCollege.endYear || ""
                }
            ];
        }

        return [];
    }

    function getOverseasTeamName(entry, overseasTeams = {}) {
        const teamCode = entry.teamCode;
        const team = overseasTeams[teamCode];

        return (
            entry.teamName ||
            team?.name?.display ||
            team?.name?.full ||
            team?.name?.official ||
            team?.teamName ||
            teamCode ||
            ""
        );
    }

    function getOverseasLeagueName(entry, overseasLeagues = {}) {
        const leagueCode = entry.leagueCode;
        const league = overseasLeagues[leagueCode];

        return (
            entry.leagueName ||
            league?.name?.display ||
            league?.name?.full ||
            league?.name?.official ||
            league?.leagueName ||
            leagueCode ||
            ""
        );
    }

    function getUnrivaledTeamName(teamCode, unrivaledTeams = {}) {
        const team = unrivaledTeams[teamCode];

        return (
            team?.name?.full ||
            team?.name?.display ||
            team?.teamName ||
            teamCode ||
            ""
        );
    }

    function formatTeamSpan(team, teams) {
        const name = getTeamName(team.teamCode, teams);
        return `${name} (${team.startYear}–${team.endYear})`;
    }

    function renderLine(label, value) {
        if (!value && value !== 0) return "";

        return `
            <p class="receipt-line">
                <strong>${escapeHtml(label)}:</strong>
                ${escapeHtml(value)}
            </p>
        `;
    }

    function renderChips(items = [], getLabel) {
        if (!items.length) return `<p class="receipt-line">None listed</p>`;

        return `
            <div class="receipt-chip-row">
                ${items.map(item => `
                    <span class="receipt-chip">${escapeHtml(getLabel(item))}</span>
                `).join("")}
            </div>
        `;
    }

    function createReceipt({
        playerId,
        player,
        teams = {},
        colleges = {},
        overseasTeams = {},
        overseasLeagues = {},
        unrivaledTeams = {},
        compact = false,
        isQuickAdd = false
    } = {}) {
        if (!player) return document.createElement("div");

        const receipt = document.createElement("article");
        receipt.className = `player-receipt ${compact ? "compact" : "full"}`;

        const image = getImage(player);
        const status = player.playerStatus || {};
        const career = player.careerDetails || {};
        const college = career.collegeCareer || {};
        const collegeSpans = getCollegeCareers(player, colleges);
        const draft = career.draftDetails || {};

        receipt.innerHTML = `
            <div class="player-receipt-header">
                ${
                    image?.src
                        ? `<img class="player-receipt-img" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || player.playerName)}">`
                        : `<div class="player-receipt-placeholder">${escapeHtml((player.playerName || "?").charAt(0))}</div>`
                }

                <div>
                    <h3>${escapeHtml(player.playerName || playerId)}</h3>

                    <p class="player-receipt-id">
                        ${escapeHtml(playerId)}
                        ${isQuickAdd ? `<span class="quick-add-badge">quick add</span>` : ""}
                    </p>

                    <p class="receipt-line">
                        <strong>Status:</strong>
                        <span class="${status.isActive ? "active-status-badge" : ""}">
                            ${status.isActive ? "Active" : "Inactive / Retired"}
                        </span>
                    </p>
                    ${renderLine("Team USA Jersey", player.teamUsaJersey)}
                </div>
            </div>

            <section class="receipt-section">
                <h4>College</h4>

                ${renderChips(collegeSpans, item => {
                    const collegeName =
                        item.collegeName ||
                        getCollegeName(item.collegeId, colleges);

                    const years =
                        item.startYear && item.endYear
                            ? ` (${item.startYear}–${item.endYear})`
                            : "";

                    return `${collegeName}${years}`;
                })}

                ${renderLine(
                    "NCAA Titles",
                    (college.ncaaChampionships || [])
                        .map(title => {
                            const collegeName =
                                title.collegeName ||
                                getCollegeName(title.collegeId, colleges);

                            return collegeName
                                ? `${title.year} — ${collegeName}`
                                : title.year;
                        })
                        .join(", ")
                )}
            </section>

            <section class="receipt-section">
                <h4>Draft</h4>
                ${renderLine("Year", draft.year)}
                ${renderLine("Pick", draft.pick)}
                ${renderLine("Drafted By", getTeamName(draft.draftedBy, teams))}
                ${renderLine("Acquired By", getTeamName(draft.acquiredBy, teams))}
                ${renderLine("Note", draft.transactionNote)}
            </section>

            <section class="receipt-section">
                <h4>WNBA Teams</h4>
                ${renderChips(player.wnbaTeams || [], team => formatTeamSpan(team, teams))}
            </section>

            <section class="receipt-section">
                <h4>Championships</h4>
                ${renderChips(player.championships || [], title =>
                    `${title.year} ${getTeamName(title.teamCode, teams)}${title.finalsMVP ? " — Finals MVP" : ""}`
                )}
            </section>

            <section class="receipt-section">
                <h4>Overseas</h4>
                    ${renderChips(career.overseasTeams || [], item => {
                        const leagueName = getOverseasLeagueName(item, overseasLeagues);
                        const teamName = getOverseasTeamName(item, overseasTeams);

                        return `${item.season}: ${leagueName ? `${leagueName} — ` : ""}${teamName}${item.note ? ` — ${item.note}` : ""}`;
                    })}
            </section>

            <section class="receipt-section">
                <h4>Unrivaled</h4>
                ${renderChips(career.unrivaledTeams || [], item =>
                    `${item.year}: ${getUnrivaledTeamName(item.teamCode, unrivaledTeams)}`

                )}
            </section>

            <section class="receipt-section">
                <h4>National Team / Medals</h4>
                ${renderChips(career.teamUsaMedals || [], medal =>
                    `${medal.year} ${medal.competition || medal.eventType || ""} ${medal.format || ""} — ${medal.medal}`
                )}
            </section>
        `;

        return receipt;
    }

    function openPlayerModal({
        playerId,
        player,
        teams = {},
        colleges = {},
        overseasTeams = {},
        overseasLeagues = {},
        unrivaledTeams = {}
    }) {
        const backdrop = document.createElement("div");
        backdrop.className = "player-receipt-modal-backdrop";

        const modal = document.createElement("div");
        modal.className = "player-receipt-modal";

        const closeBtn = document.createElement("button");
        closeBtn.className = "player-receipt-close";
        closeBtn.type = "button";
        closeBtn.textContent = "Close";

        closeBtn.addEventListener("click", () => backdrop.remove());
        backdrop.addEventListener("click", event => {
            if (event.target === backdrop) backdrop.remove();
        });

        modal.appendChild(closeBtn);
        modal.appendChild(createReceipt({
            playerId,
            player,
            teams,
            colleges,
            overseasTeams,
            overseasLeagues,
            unrivaledTeams,
            compact: false
        }));
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
    }

    return {
        createReceipt,
        openPlayerModal
    };
})();