const board = document.getElementById("workBoard");
const folderField = document.getElementById("folderField");

const archiveFilters = document.getElementById("archiveFilters");

// description of "types" of projects: print, personal, website
const typeContextPane = document.getElementById("typeContextPane");
const typeContextTitle = document.getElementById("typeContextTitle");
const typeContextContent = document.getElementById("typeContextContent");
const closeTypeContextBtn = document.getElementById("closeTypeContextBtn");

let PROJECT_TYPES = {};

const projectWindow = document.getElementById("projectWindow");
const projectPane = document.getElementById("projectPane");
const projectPaneTitle = document.getElementById("projectPaneTitle");
const projectPaneContent = document.getElementById("projectPaneContent");
const projectAssetsDock = document.getElementById("projectAssetsDock");
const closeProjectPaneBtn = document.getElementById("closeProjectPaneBtn");

const assetViewer = document.getElementById("assetViewer");

const projectSideDisplay = document.getElementById("projectSideDisplay");

const assetViewerContent = document.getElementById("assetViewerContent");
const closeAssetViewerBtn = document.getElementById("closeAssetViewerBtn");

let highestZIndex = 10;
let activeDrag = null;
let activeFilter = "all";

let PROJECTS = {};

async function loadProjects() {
  try {
    const response = await fetch("data/work-projects.json");
    if (!response.ok) throw new Error("Could not load work-projects.json");

    const data = await response.json();

    PROJECTS = data.projects || {};
    PROJECT_TYPES = data.projectTypes || {};
  } catch (error) {
    console.error(error);
    PROJECTS = {};
  }
}

function getFolderSvg() {
  return `
        <svg
            class="folder-icon"
            viewBox="0 0 117.76928 88.500488"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="m 116.50853,33.731631 a 6.5676439,6.5676439 0 0 0 -5.38488,-2.756458 h -9.34808 V 19.912611 A 6.6451427,6.6451427 0 0 0 95.13804,13.275074 H 56.787726 A 2.2271813,2.2271813 0 0 1 55.460274,12.832682 L 40.120151,1.3274526 A 6.6793425,6.6793425 0 0 0 36.137795,2.2986575e-8 H 6.637537 A 6.6451427,6.6451427 0 0 0 -4.773618e-8,6.6375372 V 86.287982 c 0,0.0087 0.0024399977362,0.01648 0.0024399977362,0.02511 a 2.2204664,2.2204664 0 0 0 0.038625,0.382703 c 0.00515,0.02782 0.011346,0.05482 0.017559,0.08211 a 2.1995194,2.1995194 0 0 0 0.1110009,0.357592 c 0.00703,0.01676 0.01593,0.03213 0.023231,0.04889 a 2.2356774,2.2356774 0 0 0 0.1620674,0.29844 c 0.013505,0.02052 0.025387,0.04214 0.039432,0.06239 0.00837,0.0119 0.01485,0.02455 0.023231,0.03645 a 2.2077555,2.2077555 0 0 0 0.2109357,0.24712 c 0.017559,0.01808 0.035919,0.03485 0.054288,0.05211 a 2.168417,2.168417 0 0 0 0.282506,0.233082 c 0.00458,0.0033 0.00863,0.0073 0.013222,0.01028 a 2.1773556,2.1773556 0 0 0 0.32923245,0.178526 c 0.025926,0.0119 0.051585,0.02379 0.078323,0.03458 a 2.2233482,2.2233482 0 0 0 0.3519169,0.109381 c 0.024846,0.0055 0.049963,0.0089 0.075082,0.0135 a 2.2089502,2.2089502 0 0 0 0.3994171,0.04024 H 99.563062 a 2.2127336,2.2127336 0 0 0 2.099068,-1.513 l 15.75875,-47.275709 a 6.5682025,6.5682025 0 0 0 -0.91235,-5.980155 z M 6.637537,4.4250248 h 29.500258 a 2.2271813,2.2271813 0 0 1 1.327452,0.4423909 L 52.80537,16.372646 a 6.6793425,6.6793425 0 0 0 3.982356,1.327452 H 95.13804 a 2.2150457,2.2150457 0 0 1 2.212513,2.212513 V 30.975173 H 23.102009 A 6.6289747,6.6289747 0 0 0 16.80505,35.513632 L 4.4250246,72.6537 V 6.6375372 A 2.2150457,2.2150457 0 0 1 6.637537,4.4250248 Z M 113.22272,38.312223 97.968498,84.07547 H 5.2822617 L 21.003204,36.913197 a 2.2091051,2.2091051 0 0 1 2.098805,-1.513 h 88.021641 a 2.2124681,2.2124681 0 0 1 2.09907,2.912026 z"
                fill="currentColor"
            />
        </svg>
    `;
}

function renderFolders() {
  folderField.innerHTML = "";

  const allProjects = Object.values(PROJECTS);

  const filteredProjects = allProjects.filter((project) => {
    if (activeFilter === "all") return true;

    return (
      project.category === activeFilter ||
      (project.projectTypes || []).includes(activeFilter)
    );
  });

  filteredProjects.forEach((project) => {
    const button = document.createElement("button");
    button.className = "folder-button";
    button.type = "button";

    button.innerHTML = `
            ${getFolderSvg()}
            <span class="folder-label">${project.title}</span>
            <span class="folder-meta">${project.category}</span>
        `;

    button.addEventListener("click", () => {
      openProject(project.projectId);
    });

    folderField.appendChild(button);
  });
}

// description of "types" of projects: print, personal, website
function renderTypeContextButtons() {
  archiveFilters.innerHTML = `
        <button type="button" data-filter="all">All</button>
    `;

  Object.values(PROJECT_TYPES).forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.filter = type.typeId;
    button.dataset.contextType = type.typeId;
    button.textContent = type.title;

    archiveFilters.appendChild(button);
  });
}

async function openProject(projectId) {
  const project = PROJECTS[projectId];

  if (!project) return;

  projectPaneTitle.textContent = project.title;

  const markdownText = await loadProjectText(project.textFile);
  const renderedText = renderProjectMarkdown(markdownText, project);

  projectPaneContent.innerHTML = `
        <div class="project-tags">
            <span class="project-tag">${project.category}</span>
            ${(project.projectTypes || []).map((type) => `<span class="project-tag">${type}</span>`).join("")}
            ${project.year ? `<span class="project-tag">${project.year}</span>` : ""}
        </div>

        <div class="project-description">
            ${renderedText}
        </div>
    `;

  renderAssetDock(project);

  projectWindow.classList.remove("hidden");
  bringPaneForward(projectWindow);
}

async function loadProjectText(textFile) {
  if (!textFile) return "<p>No description file added yet.</p>";

  try {
    const response = await fetch(textFile);
    if (!response.ok) throw new Error("Could not load text file.");
    return await response.text();
  } catch (error) {
    return "No description file could be loaded.";
  }
}

function renderProjectMarkdown(markdownText, project) {
  let html = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html
    .replace(/\[([^\]]+)\]\(asset:([^)]+)\)/g, (match, label, assetId) => {
      return `<button class="asset-ref-btn" type="button" data-asset-id="${assetId}">${label}</button>`;
    })
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^---$/gm, "<hr>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>");

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();

      if (
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }

      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

function renderAssetDock(project) {
  projectAssetsDock.innerHTML = "";

  if (projectSideDisplay) {
    projectSideDisplay.innerHTML = "";
  }

  (project.assets || []).forEach((asset) => {
    const button = document.createElement("button");
    button.className = "asset-icon-btn";
    button.type = "button";
    button.dataset.assetId = asset.assetId;
    button.innerHTML = `
            <span>${asset.assetType === "video" ? "▣" : "▧"}</span>
            <span>${asset.label}</span>
        `;

    button.addEventListener("click", () => {
      handleAssetOpen(asset, project);
    });

    projectAssetsDock.appendChild(button);
  });

  projectPaneContent.querySelectorAll("[data-asset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const asset = (project.assets || []).find(
        (item) => item.assetId === button.dataset.assetId,
      );
      if (asset) handleAssetOpen(asset, project);
    });
  });
}

function handleAssetOpen(asset, project) {
  if (asset.displayMode === "side") {
    renderSideAsset(asset, project);
    return;
  }

  openAssetViewer(asset);
}

// description of "types" of projects: print, personal, website
async function openTypeContext(typeId) {
  const type = PROJECT_TYPES[typeId];
  if (!type) return;

  typeContextTitle.textContent = type.title;

  const markdownText = await loadProjectText(type.textFile);
  typeContextContent.innerHTML = `
        <div class="project-description">
            ${renderProjectMarkdown(markdownText, { assets: [] })}
        </div>
    `;

  typeContextPane.classList.remove("hidden");
  bringPaneForward(typeContextPane);
}

function openAssetViewer(asset) {
  const media =
    asset.assetType === "video"
      ? `<video controls src="${asset.src}"></video>`
      : `<img src="${asset.src}" alt="${asset.caption || asset.label}" />`;

  assetViewerContent.innerHTML = `
        ${media}
        <p class="asset-caption">
            <strong>${asset.label}</strong><br>
            ${asset.stage || ""}<br>
            ${asset.caption || ""}
        </p>
    `;

  assetViewer.classList.remove("hidden");
}

function renderSideAsset(asset, project) {
  const existingCard = projectSideDisplay.querySelector(
    `[data-side-asset-id="${asset.assetId}"]`,
  );

  if (existingCard) return;

  const media =
    asset.assetType === "video"
      ? `<video controls src="${asset.src}"></video>`
      : `
                <button class="side-asset-media-btn" type="button" aria-label="Inspect ${asset.label}">
                    <img src="${asset.src}" alt="${asset.caption || asset.label}" />
                </button>
            `;

  const card = document.createElement("div");
  card.className = "side-asset-card";
  card.dataset.sideAssetId = asset.assetId;

  card.innerHTML = `
        ${media}
        <p class="asset-caption">
            <strong>${asset.label}</strong><br>
            ${asset.caption || ""}
        </p>
    `;

  const imageButton = card.querySelector(".side-asset-media-btn");
  if (imageButton) {
    imageButton.addEventListener("click", () => {
      openAssetViewer(asset);
    });
  }

  const sideAssetsInJsonOrder = (project.assets || [])
    .filter((item) => item.displayMode === "side")
    .map((item) => item.assetId);

  const clickedAssetIndex = sideAssetsInJsonOrder.indexOf(asset.assetId);

  const existingCards = Array.from(
    projectSideDisplay.querySelectorAll(".side-asset-card"),
  );

  const nextCard = existingCards.find((cardElement) => {
    const existingIndex = sideAssetsInJsonOrder.indexOf(
      cardElement.dataset.sideAssetId,
    );

    return existingIndex > clickedAssetIndex;
  });

  if (nextCard) {
    projectSideDisplay.insertBefore(card, nextCard);
  } else {
    projectSideDisplay.appendChild(card);
  }
}

function bringPaneForward(pane) {
  highestZIndex += 1;
  pane.style.zIndex = highestZIndex;
}

function startDrag(event, pane) {
  if (!event.target.closest("[data-drag-handle]")) return;

  bringPaneForward(pane);

  const rect = pane.getBoundingClientRect();

  activeDrag = {
    pane,
    offsetX: event.pageX - (rect.left + window.scrollX),
    offsetY: event.pageY - (rect.top + window.scrollY),
  };
}

function moveActivePane(event) {
  if (!activeDrag) return;

  activeDrag.pane.style.left = `${event.pageX - activeDrag.offsetX}px`;
  activeDrag.pane.style.top = `${event.pageY - activeDrag.offsetY}px`;
}

function stopDrag() {
  activeDrag = null;
}

function bindPaneEvents() {
  projectPane.addEventListener("mousedown", (event) => {
    startDrag(event, projectWindow);
  });

  window.addEventListener("mousemove", moveActivePane);
  window.addEventListener("mouseup", stopDrag);

  typeContextPane.addEventListener("mousedown", (event) => {
    startDrag(event, typeContextPane);
  });

  closeTypeContextBtn.addEventListener("click", () => {
    typeContextPane.classList.add("hidden");
  });

  closeProjectPaneBtn.addEventListener("click", () => {
    projectWindow.classList.add("hidden");
  });

  closeAssetViewerBtn.addEventListener("click", () => {
    assetViewer.classList.add("hidden");
  });
}

function bindFilters() {
  archiveFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    activeFilter = button.dataset.filter;
    renderFolders();

    if (button.dataset.contextType) {
      openTypeContext(button.dataset.contextType);
    }
  });
}

async function init() {
  await loadProjects();

  bindPaneEvents();
  bindFilters();
  renderTypeContextButtons();
  renderFolders();
}

init();
