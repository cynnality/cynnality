/* =========================
   OLYMPICS FOLDER — MODULE VERSION
========================= */

const olympicGames = [
  {
    year: 1932,
    city: "Berlin",
    country: "Germany",
    description: `
      <p>
        The 1932 Berlin Olympic Games were the first Olympic Games to feature
        basketball as an official medal sport.
      </p>
    `
  },
  {
    year: 1976,
    city: "Montreal",
    country: "Canada",
    description: `
      <p>
        Montreal hosted the first Olympic Games to include a women’s
        basketball tournament in 1976.
      </p>
    `
  },
  {
    year: 1992,
    city: "Barcelona",
    country: "Spain",
    description: `
      <p>
        The 1992 Barcelona Olympic Games marked the first time professional
        basketball players were allowed to compete.
      </p>
    `
  },
  {
    year: 2020,
    city: "Tokyo",
    country: "Japan",
    description: `
      <p>
        Held in 2021, the Tokyo Olympic Games introduced Olympic 3×3 basketball.
        Team USA won gold in the women’s tournament.
      </p>
    `
  }
];

let olympicFolderInitialized = false;

function initOlympicFolder() {

  if (olympicFolderInitialized) return;
  olympicFolderInitialized = true;

  const descriptionBox = document.getElementById("olympic-folder-text");
  const minimizer = document.getElementById("olympic-folder-minimizer");
  const template = document.getElementById("olympic-chip-template");

  const placeholderIds = [
    "olympic-chip-berlin-first",
    "olympic-chip-montreal-second",
    "olympic-chip-barcelona-third",
    "olympic-chip-tokyo-fourth"
  ];

  if (!template || !descriptionBox) {
    console.warn("Olympic folder not mounted yet.");
    return;
  }

  let chips = [];
  let activeIndex = null;

  /* =========================
     TEXT UPDATE
  ========================= */

  function updateOlympicsText(game) {
    descriptionBox.innerHTML = game.description;
  }

  /* =========================
     ACTIVE STATE
  ========================= */

  function setActiveChip(index) {
    activeIndex = index;

    chips.forEach((chip, i) => {
      chip.classList.toggle("chip-active", i === index);
    });

    updateOlympicsText(olympicGames[index]);
  }

  /* =========================
     CHIP CREATION
  ========================= */

  placeholderIds.forEach((id, index) => {

    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    const x = parseFloat(placeholder.getAttribute("x"));
    const y = parseFloat(placeholder.getAttribute("y"));
    const size = parseFloat(placeholder.getAttribute("width"));

    const parent = placeholder.parentNode;

    // Remove placeholder
    parent.removeChild(placeholder);

    // Clone template
    const chip = template.cloneNode(true);
    chip.removeAttribute("id");

    // Calculate scale (template is ~86 wide)
    const TEMPLATE_SIZE = 86;
    const scale = size / TEMPLATE_SIZE;

    chip.setAttribute(
      "transform",
      `translate(${x}, ${y}) scale(${scale})`
    );

    /* -------- Populate Text -------- */

    chip.querySelector(".chip-city").textContent =
      olympicGames[index].city.toUpperCase();

    chip.querySelector(".chip-country").textContent =
      olympicGames[index].country.toUpperCase();

    chip.querySelector(".chip-year").textContent =
      olympicGames[index].year;

    /* -------- Click Handler -------- */

    chip.addEventListener("click", () => {
      setActiveChip(index);
    });

    parent.appendChild(chip);
    chips.push(chip);
  });

  /* =========================
     MINIMIZER
  ========================= */

if (minimizer) {

  const wrapper = document.getElementById("olympic-folder-wrapper");

  const bg = document.getElementById("olympics-folder-container");
  const header = document.getElementById("olympic-folder-header-container");
  const title = document.getElementById("olympic-folder-title-container");
  const minimizerIcon = document.getElementById("olympic-folder-minimizer-icon");

  const originalWidth = parseFloat(bg.getAttribute("width"));
  const minimizedWidth = 350;

  const folderLeftX = parseFloat(bg.getAttribute("x"));

  const originalMinimizerX = parseFloat(minimizer.getAttribute("x"));
  const originalIconX = parseFloat(minimizerIcon.getAttribute("x"));

  minimizer.addEventListener("click", () => {

    if (!wrapper) return;

    const isMinimized = wrapper.classList.toggle("is-minimized");

    if (isMinimized) {

      bg.setAttribute("width", minimizedWidth);
      header.setAttribute("width", minimizedWidth);
      title.setAttribute("width", minimizedWidth - 150);

      // 🔥 MOVE MINIMIZER TO NEW RIGHT EDGE
      const newMinimizerX = folderLeftX + minimizedWidth - 50; 
      // 50 = minimizer width (40) + some padding

      minimizer.setAttribute("x", newMinimizerX);
      minimizerIcon.setAttribute("x", newMinimizerX + 6);

    } else {

      bg.setAttribute("width", originalWidth);
      header.setAttribute("width", originalWidth);
      title.setAttribute("width", 450);

      // 🔥 RESTORE ORIGINAL POSITIONS
      minimizer.setAttribute("x", originalMinimizerX);
      minimizerIcon.setAttribute("x", originalIconX);
    }

  });
}

  /* =========================
     DEFAULT SELECTION
  ========================= */

  setActiveChip(0);
}
