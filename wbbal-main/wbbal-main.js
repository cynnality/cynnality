/* =========================
   VIEW HANDLING (TOP MENU)
========================= */

const views = {
  about: document.getElementById("view-about"),
  medals: document.getElementById("view-medals"),
  helper: document.getElementById("view-helper")
};

const buttons = {
  about: document.getElementById("menu-about-container"),
  medals: document.getElementById("menu-medals-container"),
  helper: document.getElementById("menu-helper-container")
};

function showView(name) {
  Object.values(views).forEach(v => {
    if (!v) return;
    v.classList.remove("view-active");
  });

  Object.values(buttons).forEach(b => {
    if (!b) return;
    b.classList.remove("menu-active");
  });

  views[name]?.classList.add("view-active");
  buttons[name]?.classList.add("menu-active");
}

buttons.about?.addEventListener("click", () => showView("about"));
buttons.medals?.addEventListener("click", () => showView("medals"));
buttons.helper?.addEventListener("click", () => showView("helper"));

/* default view */
showView("about");


/* =========================
   FOLDER VISIBILITY (GLOBAL)
========================= */

function minimizeFolder(folderEl) {
  if (!folderEl) return;
  folderEl.classList.add("is-minimized");
}

function expandFolder(folderEl) {
  if (!folderEl) return;
  folderEl.classList.remove("is-minimized");
}


/* =========================
   DOM REFS
========================= */

/* SVG root (shared utility) */
const svg = document.getElementById("svg1");

/* OLYMPICS FOLDER (no behavior here) */
const olympicsCell = document.getElementById("folder-olympics-cell");
const olympicsFolder = document.getElementById("about-olympics");
const olympicsMinimizer = document.getElementById("about-olympics-minimizer");

/* PRO LEAGUE FOLDER */
const proLeagueCell = document.getElementById("folder-pro-league-cell");
const proLeagueFolder = document.getElementById("pro-league-folder");
const proLeagueMinimizer = document.getElementById("pro-league-minimizer");


/* =========================
   INITIAL STATE
========================= */

expandFolder(olympicsFolder);
expandFolder(proLeagueFolder);


/* =========================
   FOLDER EVENTS
========================= */

/* Olympics */
olympicsMinimizer?.addEventListener("click", e => {
  e.stopPropagation();
  minimizeFolder(olympicsFolder);
});

olympicsCell?.addEventListener("click", () => {
  expandFolder(olympicsFolder);
});

/* Pro League */
proLeagueMinimizer?.addEventListener("click", e => {
  e.stopPropagation();
  minimizeFolder(proLeagueFolder);
});

proLeagueCell?.addEventListener("click", () => {
  expandFolder(proLeagueFolder);
});


/* =========================
   PRO LEAGUE VIEW TOGGLES
========================= */

const teamsBtn = document.getElementById("teams-button");
const champsBtn = document.getElementById("champs-button");

const teamsContent = document.getElementById("pro-teams-content");
const champsContent = document.getElementById("pro-champs-content");

function showProContent(which) {
  teamsContent?.classList.remove("is-active");
  champsContent?.classList.remove("is-active");

  teamsBtn?.classList.remove("is-active");
  champsBtn?.classList.remove("is-active");

  if (which === "teams") {
    teamsContent?.classList.add("is-active");
    teamsBtn?.classList.add("is-active");
  }

  if (which === "champs") {
    champsContent?.classList.add("is-active");
    champsBtn?.classList.add("is-active");
  }
}

teamsBtn?.addEventListener("click", e => {
  e.stopPropagation();
  showProContent("teams");
});

champsBtn?.addEventListener("click", e => {
  e.stopPropagation();
  showProContent("champs");
});

/* default pro view */
showProContent("teams");
