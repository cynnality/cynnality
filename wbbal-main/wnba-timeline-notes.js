/*====================================
season specific notes for expansions, 
relocations, and final seasons based 
on the season data in wnba-teams-timeline.json
======================================*/
const SEASON_SPECIFIC_NOTES = {
  "1998": [
    {
      type: "conference-change",
      title: "Conference Changes",
      items: [
        "Houston Comets moved from the Eastern Conference to the Western Conference"
      ]
    }
  ],
  "2002": [
    {
      type: "something",
      title: "Something Something",
      items: [
        "something something something something and one more thing"
      ]
    }
  ],
  "2008": [
    {
      type: "highlight",
      title: "MVP ROOKIE",
      items: [
        "Candace Parker was the top draft pick of the 2008 WNBA draft, rookie of the year, and also won the season MVP title, becoming the 3rd athlete in pro basketball history to win both awards in the same year"
      ]
    }
  ]
};

function createWrappedText(parent, textString, x, y, maxWidth, lineHeight, className) {

  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");

  textEl.setAttribute("x", x);
  textEl.setAttribute("y", y);

  if (className) textEl.setAttribute("class", className);

  // attach early so browser can measure text width
  parent.appendChild(textEl);

  const words = textString.split(" ");
  let line = [];
  let lineCount = 0;

  let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
  tspan.setAttribute("x", x);
  tspan.setAttribute("dy", 0);

  textEl.appendChild(tspan);

  words.forEach(word => {

    line.push(word);
    tspan.textContent = line.join(" ");

    if (tspan.getComputedTextLength() > maxWidth && line.length > 1) {

      line.pop();
      tspan.textContent = line.join(" ");

      line = [word];

      tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

      tspan.setAttribute("x", x);
      tspan.setAttribute("dy", lineHeight);
      tspan.textContent = word;

      textEl.appendChild(tspan);

      lineCount++;

    }

  });

  return lineCount + 1;
}
/*====================================
utility for team loc + team name
======================================*/
function getTeamDisplayName(teamCode) {

  const team = TEAMS[teamCode];

  if (!team) return teamCode;

  return `${team.teamNameCity} ${team.teamName}`;
}

/*=========================================
    BUILDING notes for expansions, relocations,
    and final seasons based on the season data 
    in wnba-teams-timeline.json
===========================================*/

function buildSeasonNotes(year, seasonData, prevSeasonData, nextSeasonData) {

  const notes = [];

  // -----------------------------
  // 1997: league launch note
  // -----------------------------
  if (year === "1997") {

    const foundingTeams = seasonData.teams
      .map(t => getTeamDisplayName(t.teamCode));

    notes.push({
      type: "league-start",
      title: "The WNBA launched with 8 teams",
      items: foundingTeams
    });

    return notes;
  }

  const teams = seasonData?.teams || [];
  const prevTeams = prevSeasonData?.teams || [];
  const nextTeams = nextSeasonData?.teams || [];

  // -----------------------------
  // build quick lookup sets
  // -----------------------------
  const prevFranchiseIds = new Set(prevTeams.map(t => t.franchiseId).filter(Boolean));
  const prevTeamCodes = new Set(prevTeams.map(t => t.teamCode));

  // -----------------------------
  // relocation debuts (new identity, same franchise)
  // -----------------------------
  const relocationDebuts = teams
    .filter(t => t.franchiseId && prevFranchiseIds.has(t.franchiseId))
    .filter(t => {
      const prev = prevTeams.find(p => p.franchiseId === t.franchiseId);
      return prev && prev.teamCode !== t.teamCode;
    });

  if (relocationDebuts.length > 0) {

    const items = relocationDebuts.map(t => {

      const prev = prevTeams.find(p => p.franchiseId === t.franchiseId);

      const fromName = prev ? getTeamDisplayName(prev.teamCode) : "Unknown";
      const toName = getTeamDisplayName(t.teamCode);

      return `${toName} began play after relocating from ${fromName}`;

    });

    notes.push({
      type: "relocation-debut",
      title: relocationDebuts.length === 1
        ? "First Season After Relocation"
        : "First Seasons After Relocation",
      items
    });

  }

  // -----------------------------
  // TRUE expansions
  // - not present last year by franchiseId (if present)
  // - else fallback: not present last year by teamCode
  // - excludes relocation debuts
  // -----------------------------
  const relocationDebutCodes = new Set(relocationDebuts.map(t => t.teamCode));

  const expansions = teams
    .filter(t => !relocationDebutCodes.has(t.teamCode))
    .filter(t => {

      if (t.franchiseId) {
        return !prevFranchiseIds.has(t.franchiseId);
      }

      // fallback for null franchiseId
      return !prevTeamCodes.has(t.teamCode);

    })
    .map(t => getTeamDisplayName(t.teamCode));

  if (expansions.length > 0) {

    const title =
      expansions.length === 1
        ? "League expanded with 1 new team"
        : `League expanded with ${expansions.length} new teams`;

    notes.push({
      type: "expansion",
      title,
      items: expansions
    });

  }

  // -----------------------------
  // final seasons (keep your flag)
  // -----------------------------
  const finals = teams
    .filter(t => t.isFinalSeason)
    .map(t => getTeamDisplayName(t.teamCode));

  if (finals.length > 0) {
    notes.push({
      type: "finalSeason",
      title: finals.length === 1 ? "Final Season" : "Final Seasons",
      items: finals
    });
  }

  // -----------------------------
  // relocations (old-year note: "X relocated to Y")
  // uses your existing isRelocatingNextYear flag
  // -----------------------------
    const relocating = teams.filter(t => t.isRelocatingNextYear);
    const relocationItems = [];

    relocating.forEach(team => {
      const nextVersion = nextTeams.find(t =>
        t.franchiseId &&
        team.franchiseId &&
        t.franchiseId === team.franchiseId &&
        (t.isFirstSeasonAfterRelocation || t.teamCode !== team.teamCode)
      );

      if (nextVersion) {
        const fromName = getTeamDisplayName(team.teamCode);
        const toName = getTeamDisplayName(nextVersion.teamCode);
        relocationItems.push(`${fromName} relocated to ${toName}`);
      }
    });

    if (relocationItems.length > 0) {
      notes.push({
        type: "relocation",
        title: relocationItems.length === 1 ? "Relocation" : "Relocations",
        items: relocationItems
      });
    }

  return notes;
}

// rendering the notes for the expansions, relocations, and final seasons
function renderSeasonNotes(year, data) {
  const container = document.getElementById("season-notes-container");
  container.innerHTML = "";

  const seasonData = data[year];
  if (!seasonData?.teams) return;

  const prevSeasonData = data[String(parseInt(year) - 1)];
  const nextSeasonData = data[String(parseInt(year) + 1)];

  const autoNotes = buildSeasonNotes(year, seasonData, prevSeasonData, nextSeasonData);
  const manualNotes = SEASON_SPECIFIC_NOTES[year] || [];

  const notes = [...autoNotes, ...manualNotes];

  const svg = document.getElementById("season-notes-svg");
  const boxWidth = svg.viewBox.baseVal.width - 20;
  const padding = 12;

  let currentY = 0;

  notes.forEach(note => {

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("season-note", `note-${note.type}`);

    const items = note.items || [];

    // ---- create HTML container ----

    const foreign = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");

    foreign.setAttribute("x", padding);
    foreign.setAttribute("y", currentY + padding);
    foreign.setAttribute("width", boxWidth - padding * 2);

    const div = document.createElement("div");
    div.classList.add("season-note-content");

    const title = document.createElement("div");
    title.classList.add("season-note-title");
    title.textContent = note.title;

    div.appendChild(title);

    if (items.length) {

      const list = document.createElement("ul");
      list.classList.add("season-note-list");

      items.forEach(item => {

        const li = document.createElement("li");
        li.textContent = item;

        list.appendChild(li);

      });

      div.appendChild(list);
    }

    foreign.appendChild(div);

    group.appendChild(foreign);

    container.appendChild(group);

    // ---- measure HTML height ----

    const height = div.offsetHeight + padding * 2;

    foreign.setAttribute("height", height - padding);

    // ---- background rect ----

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.setAttribute("x", 0);
    rect.setAttribute("y", currentY);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", 6);

    rect.classList.add("season-note-box");

    group.insertBefore(rect, foreign);

    currentY += height + 20;

  });

}