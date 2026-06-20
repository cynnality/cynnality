const board = document.getElementById("workBoard");
const folderField = document.getElementById("folderField");

const archiveFilters = document.getElementById("archiveFilters");

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
    } catch (error) {
        console.error(error);
        PROJECTS = {};
    }
}

function getFolderSvg() {
    return `
        <svg class="folder-icon" viewBox="0 0 120 90" aria-hidden="true">
            <path d="M8 24 H45 L54 34 H112 V80 H8 Z" fill="#f2d46b" stroke="#111" stroke-width="4"/>
            <path d="M8 34 H112 V80 H8 Z" fill="#f7df86" stroke="#111" stroke-width="4"/>
        </svg>
    `;
}

function renderFolders() {
    folderField.innerHTML = "";

    const allProjects = Object.values(PROJECTS);

    const filteredProjects = allProjects.filter(project => {
        if (activeFilter === "all") return true;

        return (
            project.category === activeFilter ||
            (project.projectTypes || []).includes(activeFilter)
        );
    });

    filteredProjects.forEach(project => {
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

async function openProject(projectId) {
    const project = PROJECTS[projectId];

    if (!project) return;

    projectPaneTitle.textContent = project.title;

    const markdownText = await loadProjectText(project.textFile);
    const renderedText = renderProjectMarkdown(markdownText, project);

    projectPaneContent.innerHTML = `
        <div class="project-tags">
            <span class="project-tag">${project.category}</span>
            ${(project.projectTypes || []).map(type => `<span class="project-tag">${type}</span>`).join("")}
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
        .map(block => {
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

    (project.assets || []).forEach(asset => {
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

    projectPaneContent.querySelectorAll("[data-asset-id]").forEach(button => {
        button.addEventListener("click", () => {
            const asset = (project.assets || []).find(item => item.assetId === button.dataset.assetId);
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
        `[data-side-asset-id="${asset.assetId}"]`
    );

    if (existingCard) {
        return;
    }

    const media =
        asset.assetType === "video"
            ? `<video controls src="${asset.src}"></video>`
            : `<img src="${asset.src}" alt="${asset.caption || asset.label}" />`;

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

    const sideAssetsInJsonOrder = (project.assets || [])
        .filter(item => item.displayMode === "side")
        .map(item => item.assetId);

    const clickedAssetIndex = sideAssetsInJsonOrder.indexOf(asset.assetId);

    const existingCards = Array.from(
        projectSideDisplay.querySelectorAll(".side-asset-card")
    );

    const nextCard = existingCards.find(cardElement => {
        const existingIndex = sideAssetsInJsonOrder.indexOf(
            cardElement.dataset.sideAssetId
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
        offsetY: event.pageY - (rect.top + window.scrollY)
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
    projectPane.addEventListener("mousedown", event => {
        startDrag(event, projectWindow);
    });

    window.addEventListener("mousemove", moveActivePane);
    window.addEventListener("mouseup", stopDrag);

    closeProjectPaneBtn.addEventListener("click", () => {
        projectWindow.classList.add("hidden");
    });

    closeAssetViewerBtn.addEventListener("click", () => {
        assetViewer.classList.add("hidden");
    });
}

function bindFilters() {
    archiveFilters.addEventListener("click", event => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;

        activeFilter = button.dataset.filter;
        renderFolders();
    });
}

async function init() {
    await loadProjects();

    bindPaneEvents();
    bindFilters();
    renderFolders();
}

init();