// ======================================================
// ADD ENTRY TOOL
// Phase 1
//
// Generates entry metadata JSON
// Updates live preview
//
// Future:
// - Save metadata JSON
// - Save markdown file
// - Edit existing entries
// - Render markdown preview
// ======================================================


// ======================================================
// ELEMENTS
// ======================================================

const entryTitleInput = document.getElementById("entryTitleInput");
const entryIdInput = document.getElementById("entryIdInput");

const collectionInput = document.getElementById("collectionInput");
const categoryInput = document.getElementById("categoryInput");

const entryTypeInput = document.getElementById("entryTypeInput");
const contentTypeInput = document.getElementById("contentTypeInput");

const descriptionInput = document.getElementById("descriptionInput");

const contentFileInput = document.getElementById("contentFileInput");
const markdownInput = document.getElementById("markdownInput");

const wireInput = document.getElementById("wireInput");

const attachedTypeInput = document.getElementById("attachedTypeInput");
const attachedIdInput = document.getElementById("attachedIdInput");

const tagsInput = document.getElementById("tagsInput");

const referencesInput = document.getElementById("referencesInput");
const linksInput = document.getElementById("linksInput");

const generatePreviewBtn =
    document.getElementById("generatePreviewBtn");

const saveEntryBtn =
    document.getElementById("saveEntryBtn");

const jsonPreview =
    document.getElementById("jsonPreview");

const statusMessage =
    document.getElementById("statusMessage");

const contentPreview = document.getElementById("contentPreview");

document.querySelectorAll(".panel-toggle").forEach(button => {

    button.addEventListener("click", () => {

        const panel =
            button.closest(".collapsible-panel");

        panel.classList.toggle("collapsed");

        const isCollapsed =
            panel.classList.contains("collapsed");

        button.textContent = isCollapsed
            ? button.dataset.closedLabel
            : button.dataset.openLabel;

    });

});


// ======================================================
// HELPERS
// ======================================================

// Creates a clean entry id from title.
function makeEntryId(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "_");
}


// Converts comma separated text into array.
function splitTags(value) {
    return value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
}


// Converts line separated text into array.
function splitLines(value) {
    return value
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
}

// markdown preview helper
function renderSimpleMarkdown(value) {
    return value
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        .replace(/\n\n/gim, "</p><p>");
}

// auto generate entry id and file path
function getTextFolderForCategory(category) {
    return category || "general";
}

function buildContentFilePath() {
    const collection = collectionInput.value;
    const category = getTextFolderForCategory(categoryInput.value);
    const entryId = entryIdInput.value.trim();

    if (!collection || !category || !entryId) {
        return "";
    }

    return `entries/entry data/${collection}/text/${category}/${entryId}.md`;
}

// ======================================================
// AUTO ENTRY ID
// ======================================================

function updateGeneratedEntryFields() {
    if (!entryIdInput.dataset.manual) {
        entryIdInput.value = makeEntryId(entryTitleInput.value);
    }

    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }
}

entryTitleInput.addEventListener("input", () => {
    updateGeneratedEntryFields();
    updatePreview();
});

entryIdInput.addEventListener("input", () => {
    entryIdInput.dataset.manual = "true";

    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }

    updatePreview();
});

contentFileInput.addEventListener("input", () => {
    contentFileInput.dataset.manual = "true";
});

collectionInput.addEventListener("input", () => {
    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }

    updatePreview();
});

categoryInput.addEventListener("input", () => {
    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }

    updatePreview();
});

// ======================================================
// BUILD ENTRY OBJECT
// ======================================================

function buildEntryObject() {

    const entryId =
        entryIdInput.value.trim();

    const wireValue =
        wireInput.value.trim();

    const attachedType =
        attachedTypeInput.value.trim();

    const attachedId =
        attachedIdInput.value.trim();

    const attachedTo = [];

    if (attachedType && attachedId) {

        attachedTo.push({
            type: attachedType,
            id: attachedId
        });

    }

    return {

        entryId,

        title:
            entryTitleInput.value.trim(),

        description:
            descriptionInput.value.trim(),

        collection:
            collectionInput.value,

        category:
            categoryInput.value,

        entryType:
            entryTypeInput.value,

        contentType:
            contentTypeInput.value,

        contentFile:
            contentFileInput.value.trim(),

        tags:
            splitTags(tagsInput.value),

        wires:
            wireValue
                ? [wireValue]
                : [],

        attachedTo,

        references:
            splitLines(referencesInput.value),

        links:
            splitLines(linksInput.value),

        assets: []

    };

}


// ======================================================
// PREVIEW
// ======================================================

function updatePreview() {
    const entry = buildEntryObject();

    jsonPreview.textContent =
        JSON.stringify(entry, null, 4);

    const renderedMarkdown =
        renderSimpleMarkdown(markdownInput.value);

    contentPreview.innerHTML =
        renderedMarkdown
            ? `<div class="entry-content">${renderedMarkdown}</div>`
            : `<p class="empty-preview">Entry content preview will appear here.</p>`;
}

generatePreviewBtn.addEventListener(
    "click",
    updatePreview
);

// ======================================================
// LIVE PREVIEW
// ======================================================

document
    .querySelectorAll("input, select, textarea")
    .forEach(element => {

    element.addEventListener("input", () => {
        updateGeneratedEntryFields();
        updatePreview();
    });

    });


// ======================================================
// SAVE
// ======================================================

async function saveEntry() {
    const entry = buildEntryObject();

    if (!entry.entryId) {
        statusMessage.textContent = "Entry ID is required.";
        return;
    }

    if (!entry.title) {
        statusMessage.textContent = "Entry title is required.";
        return;
    }

    if (entry.contentType === "markdown" && !entry.contentFile) {
        statusMessage.textContent = "Markdown file path is required.";
        return;
    }

    try {
        statusMessage.textContent = "Saving entry...";

        await fetch("http://localhost:8787/save-wnba-entry", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry)
        });

        if (entry.contentType === "markdown") {
            await fetch("http://localhost:8787/save-wnba-entry-markdown", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contentFile: entry.contentFile,
                    markdownContent: markdownInput.value
                })
            });
        }

        statusMessage.textContent = "Entry saved successfully.";
        updatePreview();

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Save failed. Check console and local server.";
    }
}

saveEntryBtn.addEventListener("click", saveEntry);


// ======================================================
// INITIAL PREVIEW
// ======================================================

updateGeneratedEntryFields();
updatePreview();