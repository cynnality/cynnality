const reloadEntriesBtn = document.getElementById("reloadEntriesBtn");
const openEntriesList = document.getElementById("openEntriesList");
const resolvedEntriesList = document.getElementById("resolvedEntriesList");
const selectedEntryDetails = document.getElementById("selectedEntryDetails");
const jsonPreview = document.getElementById("jsonPreview");
const resolveSelectedBtn = document.getElementById("resolveSelectedBtn");
const reopenSelectedBtn = document.getElementById("reopenSelectedBtn");

let allUtilityEntries = {
    openEntries: {},
    resolvedEntries: {}
};

let selectedEntry = null;

function formatValue(value) {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function renderObjectFields(object = {}) {
    const entries = Object.entries(object);

    if (!entries.length) {
        return `<p class="muted">No reference data.</p>`;
    }

    return entries.map(([key, value]) => {
        return `
            <div class="detail-row">
                <strong>${key}</strong>
                <span>${formatValue(value)}</span>
            </div>
        `;
    }).join("");
}

function selectEntry(entry) {
    selectedEntry = entry;

    selectedEntryDetails.innerHTML = `
        <h3>${entry.title || "Untitled Utility Entry"}</h3>

        <div class="detail-row">
            <strong>Status</strong>
            <span>${entry.status || "open"}</span>
        </div>

        <div class="detail-row">
            <strong>Category</strong>
            <span>${entry.category || "—"}</span>
        </div>

        <div class="detail-row">
            <strong>Created From</strong>
            <span>${entry.createdFrom?.tool || "—"}</span>
        </div>

        <div class="detail-row">
            <strong>Context</strong>
            <span>${entry.createdFrom?.contextType || "—"} / ${entry.createdFrom?.contextId || "—"}</span>
        </div>

        <h4>Reference Request</h4>
        ${renderObjectFields(entry.referenceRequest)}

        <h4>Wires</h4>
        <p>${(entry.wires || []).join(", ") || "—"}</p>

        <h4>Attached To</h4>
        <p>${(entry.attachedTo || []).map(item => `${item.type}: ${item.id}`).join(", ") || "—"}</p>

        <h4>Notes</h4>
        <p>${entry.notes || "—"}</p>
    `;

    jsonPreview.textContent = JSON.stringify(entry, null, 2);

    resolveSelectedBtn.disabled = entry.status === "resolved";
    reopenSelectedBtn.disabled = entry.status !== "resolved";
}

function createEntryCard(entry) {
    const card = document.createElement("article");
    card.className = "utility-entry-card";
    card.type = "button";

    card.innerHTML = `
        <h3>${entry.title || "Untitled Entry"}</h3>
        <p><strong>Category:</strong> ${entry.category || "—"}</p>
        <p><strong>From:</strong> ${entry.createdFrom?.tool || "—"}</p>
        <p><strong>Status:</strong> ${entry.status || "open"}</p>
    `;

    card.addEventListener("click", () => {
        selectEntry(entry);
    });

    return card;
}

function renderEntryList(container, entries, emptyMessage) {
    container.innerHTML = "";

    if (!entries.length) {
        container.innerHTML = `<p>${emptyMessage}</p>`;
        return;
    }

    entries.forEach(entry => {
        container.appendChild(createEntryCard(entry));
    });
}

async function renderUtilityEntries() {
    allUtilityEntries = await UtilityEntryService.loadEntries();

    const openEntries = Object.values(allUtilityEntries.openEntries || {});
    const resolvedEntries = Object.values(allUtilityEntries.resolvedEntries || {});

    renderEntryList(
        openEntriesList,
        openEntries,
        "No open utility entries."
    );

    renderEntryList(
        resolvedEntriesList,
        resolvedEntries,
        "No resolved utility entries."
    );
}

async function resolveSelectedEntry() {
    if (!selectedEntry) return;

    const resolvedEntry = UtilityEntryService.resolveEntry(selectedEntry);

    await UtilityEntryService.saveEntry(resolvedEntry);
    selectedEntry = resolvedEntry;

    await renderUtilityEntries();
    selectEntry(resolvedEntry);
}

async function reopenSelectedEntry() {
    if (!selectedEntry) return;

    const reopenedEntry = {
        ...selectedEntry,
        status: "open",
        updatedAt: new Date().toISOString(),
        resolved: {
            ...(selectedEntry.resolved || {}),
            isResolved: false,
            resolvedAt: "",
            resolvedByTool: "",
            resolvedIds: {}
        }
    };

    await UtilityEntryService.saveEntry(reopenedEntry);
    selectedEntry = reopenedEntry;

    await renderUtilityEntries();
    selectEntry(reopenedEntry);
}

reloadEntriesBtn.addEventListener("click", renderUtilityEntries);
resolveSelectedBtn.addEventListener("click", resolveSelectedEntry);
reopenSelectedBtn.addEventListener("click", reopenSelectedEntry);

resolveSelectedBtn.disabled = true;
reopenSelectedBtn.disabled = true;

renderUtilityEntries();