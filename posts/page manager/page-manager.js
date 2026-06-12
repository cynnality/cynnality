const DATA_PATHS = {
    pages: "../post data/pages_data.json"
};

let PAGES_DATA = { pages: {} };
let ACTIVE_PAGE_ID = "";

const pagesList = document.getElementById("pagesList");
const newPageBtn = document.getElementById("newPageBtn");

const pageTitleInput = document.getElementById("pageTitleInput");
const pageIdInput = document.getElementById("pageIdInput");
const pageSlugInput = document.getElementById("pageSlugInput");
const pageStyleFileInput = document.getElementById("pageStyleFileInput");
const pageDescriptionInput = document.getElementById("pageDescriptionInput");
const pageStyleInput = document.getElementById("pageStyleInput");

const savePageBtn = document.getElementById("savePageBtn");
const statusMessage = document.getElementById("statusMessage");
const jsonPreview = document.getElementById("jsonPreview");

function makeId(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/_+/g, "-");
}

function buildPageStyleFilePath() {
    const pageId = pageIdInput.value.trim();

    if (!pageId) return "";

    return `posts/post data/page styles/${pageId}.css`;
}

function buildPageObject() {
    const pageId = pageIdInput.value.trim();

    return {
        pageId,
        title: pageTitleInput.value.trim() || pageId,
        slug: pageSlugInput.value.trim() || pageId,
        description: pageDescriptionInput.value.trim(),
        styleFile: pageStyleFileInput.value.trim() || buildPageStyleFilePath()
    };
}

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) return fallback;

        const text = await response.text();
        if (!text.trim()) return fallback;

        return JSON.parse(text);
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

async function loadText(path) {
    if (!path) return "";

    try {
        const safePath = path.replaceAll(" ", "%20");
        const response = await fetch(`../../${safePath}`);

        if (!response.ok) return "";

        return await response.text();
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return "";
    }
}

function updatePreview() {
    jsonPreview.textContent =
        JSON.stringify(buildPageObject(), null, 4);
}

function renderPagesList() {
    pagesList.innerHTML = "";

    const pages = Object.values(PAGES_DATA.pages || {})
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    if (!pages.length) {
        pagesList.innerHTML = `<p>No pages found.</p>`;
        return;
    }

    pages.forEach(page => {
        const card = document.createElement("article");
        card.className = "page-card";
        if (page.pageId === ACTIVE_PAGE_ID) {
            card.classList.add("active");
        }

        card.innerHTML = `
            <div class="page-card-title">${page.title || page.pageId}</div>
            <div class="page-card-meta">${page.pageId}</div>
        `;

        card.addEventListener("click", () => {
            loadPageIntoEditor(page.pageId);
        });

        pagesList.appendChild(card);
    });
}

async function loadPageIntoEditor(pageId) {
    const page = PAGES_DATA.pages?.[pageId];

    if (!page) return;

    ACTIVE_PAGE_ID = pageId;

    pageTitleInput.value = page.title || "";
    pageIdInput.value = page.pageId || "";
    pageSlugInput.value = page.slug || page.pageId || "";
    pageDescriptionInput.value = page.description || "";
    pageStyleFileInput.value = page.styleFile || buildPageStyleFilePath();

    pageStyleInput.value = await loadText(page.styleFile);

    pageIdInput.dataset.manual = "true";
    pageSlugInput.dataset.manual = "true";
    pageStyleFileInput.dataset.manual = "true";

    statusMessage.textContent = `Editing page: ${page.title || page.pageId}`;

    renderPagesList();
    updatePreview();
}

function clearEditorForNewPage() {
    ACTIVE_PAGE_ID = "";

    pageTitleInput.value = "";
    pageIdInput.value = "";
    pageSlugInput.value = "";
    pageDescriptionInput.value = "";
    pageStyleFileInput.value = "";
    pageStyleInput.value = "";

    delete pageIdInput.dataset.manual;
    delete pageSlugInput.dataset.manual;
    delete pageStyleFileInput.dataset.manual;

    statusMessage.textContent = "Creating new page.";

    renderPagesList();
    updatePreview();
}

function updateGeneratedFields() {
    if (!pageIdInput.dataset.manual) {
        pageIdInput.value = makeId(pageTitleInput.value);
    }

    if (!pageSlugInput.dataset.manual) {
        pageSlugInput.value = makeId(pageTitleInput.value);
    }

    if (!pageStyleFileInput.dataset.manual) {
        pageStyleFileInput.value = buildPageStyleFilePath();
    }
}

async function savePage() {
    updateGeneratedFields();

    const page = buildPageObject();

    if (!page.pageId) {
        statusMessage.textContent = "Page ID is required.";
        return;
    }

    if (!page.title) {
        statusMessage.textContent = "Page title is required.";
        return;
    }

    if (!page.styleFile) {
        statusMessage.textContent = "Page style file path is required.";
        return;
    }

    try {
        statusMessage.textContent = "Saving page...";

        const pageResponse = await fetch("http://127.0.0.1:8787/save-post-page", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(page)
        });

        if (!pageResponse.ok) {
            throw new Error("Page metadata save failed.");
        }

        const styleResponse = await fetch("http://127.0.0.1:8787/save-post-page-style", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                styleFile: page.styleFile,
                css: pageStyleInput.value
            })
        });

        if (!styleResponse.ok) {
            throw new Error("Page CSS save failed.");
        }

        PAGES_DATA.pages[page.pageId] = page;
        ACTIVE_PAGE_ID = page.pageId;

        statusMessage.textContent = "Page saved successfully.";

        renderPagesList();
        updatePreview();

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Save failed. Check console and local server.";
    }
}

pageTitleInput.addEventListener("input", () => {
    updateGeneratedFields();
    updatePreview();
});

pageIdInput.addEventListener("input", () => {
    pageIdInput.dataset.manual = "true";

    if (!pageStyleFileInput.dataset.manual) {
        pageStyleFileInput.value = buildPageStyleFilePath();
    }

    updatePreview();
});

pageSlugInput.addEventListener("input", () => {
    pageSlugInput.dataset.manual = "true";
    updatePreview();
});

pageStyleFileInput.addEventListener("input", () => {
    pageStyleFileInput.dataset.manual = "true";
    updatePreview();
});

pageDescriptionInput.addEventListener("input", updatePreview);
pageStyleInput.addEventListener("input", updatePreview);

newPageBtn.addEventListener("click", clearEditorForNewPage);
savePageBtn.addEventListener("click", savePage);

async function init() {
    PAGES_DATA = await loadJson(DATA_PATHS.pages, { pages: {} });

    renderPagesList();

    const firstPage = Object.keys(PAGES_DATA.pages || {})[0];

    if (firstPage) {
        await loadPageIntoEditor(firstPage);
    } else {
        clearEditorForNewPage();
    }
}

init();