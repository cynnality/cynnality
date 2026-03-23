let TEAMS_BY_CODE = {};

fetch('wnba-cluster-data.json')
  .then(res => res.json())
  .then(data => {

    Object.values(data).forEach(team => {
      TEAMS_BY_CODE[team.teamCode] = team;
    });

    initTeamInteractions();
  });

const centerBackground = document.getElementById("center-court-container-background");
const tripletPieces = document.querySelectorAll(".triplet-piece");

function getContrastColor(hex) {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substr(0,2), 16);
  const g = parseInt(hex.substr(2,2), 16);
  const b = parseInt(hex.substr(4,2), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#000000" : "#FFFFFF";
}

// 🔹 NEW — reads SVG rect metrics
function getRectMetrics(rect) {
  return {
    x: parseFloat(rect.getAttribute("x")),
    y: parseFloat(rect.getAttribute("y")),
    width: parseFloat(rect.getAttribute("width")),
    height: parseFloat(rect.getAttribute("height"))
  };
}

const WNBA_START_YEAR = 1997;

function convertNumberToWord(num) {

  const words = [
    "one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen",
    "eighteen","nineteen","twenty","twentyone","twentytwo","twentythree",
    "twentyfour","twentyfive","twentysix","twentyseven","twentyeight","twentynine"
  ];

  return words[num - 1];
}

function resetYearSquares() {
  const squares = document.querySelectorAll('rect[id^="year-"]');

  squares.forEach(square => {
    square.style.fill = "#ffffff"; // default
    square.style.stroke = "#000000";
    square.style.strokeWidth = "2";
  });
}

function highlightYear(year, team, type = "champion") {

  const numericYear = parseInt(year);
  if (isNaN(numericYear)) return;

  const index = numericYear - WNBA_START_YEAR + 1;
  if (index < 1) return;

  const word = convertNumberToWord(index);
  if (!word) return;

  const square = document.getElementById(`year-${word}`);
  if (!square) return;

  if (type === "founded") {
    square.style.fill = team.colors.color3;
    square.style.stroke = team.colors.color1;
    square.style.strokeWidth = "2";
  }

  if (type === "champion") {
    square.style.fill = team.colors.color1;
    square.style.stroke = "none";
  }

  if (type === "finals") {
    square.style.fill = "none";
    square.style.stroke = team.colors.color1;
    square.style.strokeWidth = "3";
  }
}

function updateTeamInfo(team) {
  if (!team) return;

  resetYearSquares();

  // highlight founded
  highlightYear(parseInt(team.founded), team, "founded");

  // highlight championships
  if (team.championships) {
    team.championships.forEach(champ => {
      highlightYear(parseInt(champ.year), team, "champion");
    });
  }

// -------- TEAM TITLE ----------
const topicTitle = document.getElementById("topic-title-label-container-text");

if (topicTitle) {
  const fullName = `${team.teamNameCity} ${team.teamName}`;
  topicTitle.textContent = fullName.toUpperCase();

  const topicBox = document.getElementById("topic-title-label-container");

  if (topicBox) {
    topicBox.style.fill = team.colors.color1;
    topicTitle.style.fill = getContrastColor(team.colors.color1);
  }
}

  // -------- LOCATION ----------
  const cityLabel = document.getElementById("city-state-label");
  if (cityLabel) cityLabel.textContent = team.city;

  // -------- FOUNDED YEAR ----------
  const foundedText = document.getElementById("year-founded-text");
  if (foundedText) {
    foundedText.textContent = team.founded;
    foundedText.style.stroke = "none";
    foundedText.style.strokeWidth = "0";
  }
const foundedContainer = document.getElementById("year-founded-box");
if (foundedContainer) {
  foundedContainer.style.fill = team.colors.color3;
  foundedContainer.style.stroke = "#000000";
  foundedContainer.style.strokeWidth = "1";
}
const foundedLabelContainer = document.getElementById("founded-year-container");
if (foundedLabelContainer) {
  foundedLabelContainer.style.stroke = team.colors.color1;
}
  
  // -------- OG TEAM ----------
  const ogGroup = document.getElementById("og-team-group");
  if (ogGroup) {
    ogGroup.style.display = team.isOriginalTeam ? "block" : "none";
  }

  // -------- COLORS ----------
  const swatch1 = document.getElementById("swatch-color-1");
  const swatch2 = document.getElementById("swatch-color-2");
  const swatch3 = document.getElementById("swatch-color-3");

  if (swatch1) swatch1.style.fill = team.colors.color1;
  if (swatch2) swatch2.style.fill = team.colors.color2;
  if (swatch3) swatch3.style.fill = team.colors.color3;

  // -------- CHAMPIONSHIP RENDER ----------
  const champGroup = document.getElementById("championships-dynamic-group");
  if (!champGroup) return;

  champGroup.innerHTML = "";

  // Map each row to its existing SVG containers
  const rowRects = [
    {
      year: document.getElementById("yr-label-container"),
      coach: document.getElementById("coach-name-label-container"),
      mvp: document.getElementById("finals-mvp-placeholder-label-container"),
      opp: document.getElementById("rect1")
    },
    {
      year: document.getElementById("rect22"),
      coach: document.getElementById("rect20"),
      mvp: document.getElementById("rect21"),
      opp: document.getElementById("rect24")
    },
    {
      year: document.getElementById("rect28"),
      coach: document.getElementById("rect26"),
      mvp: document.getElementById("rect27"),
      opp: document.getElementById("rect29")
    },
    {
      year: document.getElementById("rect33"),
      coach: document.getElementById("rect31"),
      mvp: document.getElementById("rect32"),
      opp: document.getElementById("rect34")
    }
  ];

  // Hide all row containers initially
rowRects.forEach(row => {
  Object.values(row).forEach(rect => {
    if (!rect) return;
    rect.style.display = "none";
  });
  // Reset all championship row backgrounds
  if (row.year) {
    row.year.style.fill = "#ffffff";
    row.year.style.stroke = "#000000";
    row.year.style.strokeWidth = "1";
  }
});
  // STOP HERE if no championships
  if (!team.championships || team.championships.length === 0) {
    return;
  }

  team.championships.forEach((champ, index) => {

    const containers = rowRects[index];
    if (!containers) return;

    // Show this row's containers
    Object.values(containers).forEach(rect => {
      if (rect) rect.style.display = "block";
    });

    // Color the year background
    containers.year.style.fill = team.colors.color1;
    containers.year.style.stroke = team.colors.color2;
    containers.year.style.strokeWidth = "2";

    const contrastColor = getContrastColor(team.colors.color1);

    const opponent = TEAMS_BY_CODE[champ.opponent];
    const fullOpponentName = opponent
      ? `${opponent.teamNameCity} ${opponent.teamName}`
      : champ.opponent;

    const yrBox = getRectMetrics(containers.year);
    const coachBox = getRectMetrics(containers.coach);
    const mvpBox = getRectMetrics(containers.mvp);
    const oppBox = getRectMetrics(containers.opp);

    const rowMarkup = `
      <text
        x="${yrBox.x + yrBox.width / 2}"
        y="${yrBox.y + yrBox.height / 2 + 6}"
        text-anchor="middle"
        class="champ-label champ-yr"
        fill="${contrastColor}">
        ${champ.year}
      </text>

      <text
        x="${coachBox.x + 8}"
        y="${coachBox.y + coachBox.height / 2 + 6}"
        text-anchor="start"
        class="champ-label champ-coach">
        ${champ.coach}
      </text>

      <text
        x="${mvpBox.x + 8}"
        y="${mvpBox.y + mvpBox.height / 2 + 6}"
        text-anchor="start"
        class="champ-label champ-finals-mvp">
        ${champ["finals-mvp"]}
      </text>

      <text
        x="${oppBox.x + 8}"
        y="${oppBox.y + oppBox.height / 2 + 6}"
        text-anchor="start"
        class="champ-label champ-opp">
        ${fullOpponentName}
      </text>
    `;

    champGroup.insertAdjacentHTML("beforeend", rowMarkup);
  });

}

function initTeamInteractions() {

  document.querySelectorAll('.team-cyl').forEach(cyl => {

    const code = cyl.dataset.team;
    const team = TEAMS_BY_CODE[code];
    if (!team) return;

    const text = cyl.querySelector('.team-title');
    text.style.fill = team.colors.color1;
    text.style.stroke = "none";
    text.style.strokeWidth = "0";

    const ring = cyl.querySelector('.indicator-dashed-circle');
    const fill = cyl.querySelector('.indicator-half-circle');

    if (ring) {
      ring.style.stroke = "#000000";
      ring.style.fill = "none";
      ring.style.strokeDasharray = "6,3";
    }

    if (fill) {
      fill.style.stroke = "#000000";
      fill.style.fill = "none";
    }

    cyl.addEventListener('click', () => {

      const allCyls = document.querySelectorAll('.team-cyl');
      const wasActive = cyl.classList.contains('active');

      allCyls.forEach(other => {

        other.classList.remove('active');

        const otherPath = other.querySelector('.cyl-shape');
        const otherText = other.querySelector('.team-title');
        const otherRing = other.querySelector('.indicator-dashed-circle');
        const otherFill = other.querySelector('.indicator-half-circle');

        const otherCode = other.dataset.team;
        const otherTeam = TEAMS_BY_CODE[otherCode];
        if (!otherTeam) return;

        if (otherPath) 
          otherPath.style.fill = "#ffffff";
          otherPath.style.stroke = "#000000";
        if (otherText) {
          otherText.style.fill = otherTeam.colors.color1;
          otherText.style.stroke = "none";
          otherText.style.strokeWidth = "0";
        }

        if (otherRing) {
          otherRing.style.stroke = "#000000";
          otherRing.style.strokeDasharray = "6,3";
        }

        if (otherFill) {
          otherFill.style.fill = "none";
          otherFill.style.stroke = "#000000";
        }

        if (centerBackground) {
          centerBackground.style.fill = "#5091CD";
        }

        tripletPieces.forEach(piece => {
          piece.style.fill = "#ffffff";
          piece.style.stroke = "#000000";
          piece.style.strokeWidth = "3";
        });

      });

      if (!wasActive) {

        cyl.classList.add('active');

        const path = cyl.querySelector('.cyl-shape');
        const text = cyl.querySelector('.team-title');
        const ring = cyl.querySelector('.indicator-dashed-circle');
        const fill = cyl.querySelector('.indicator-half-circle');

        updateTeamInfo(team);

        if (centerBackground) {
          centerBackground.style.fill = team.colors.color1;
        }

        tripletPieces.forEach(piece => {
          piece.style.stroke = team.colors.color2;
          piece.style.strokeWidth = "3";
        });

        if (path) path.style.fill = team.colors.color1;
        if (path) path.style.stroke = "#ffffff";
        if (text) {
          text.style.fill = getContrastColor(team.colors.color1);
        }
        if (ring) ring.style.stroke = team.colors.color2;
        if (fill) fill.style.stroke = team.colors.color2;
      }

    });

  });

}