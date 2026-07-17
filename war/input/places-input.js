"use strict";

const state = {
    places: {},
    currentPlaceId: null,
    writingSections: []
};

const els = {
    newPlaceBtn: document.getElementById("newPlaceBtn"),
    savePlaceBtn: document.getElementById("savePlaceBtn"),
    statusMessage: document.getElementById("statusMessage"),
    placeCount: document.getElementById("placeCount"),
    placeSearchInput: document.getElementById("placeSearchInput"),
    placesList: document.getElementById("placesList"),
    editModeBadge: document.getElementById("editModeBadge"),
    placeIdOptions: document.getElementById("placeIdOptions"),

    placeNameInput: document.getElementById("placeNameInput"),
    placeIdInput: document.getElementById("placeIdInput"),
    placeTypeInput: document.getElementById("placeTypeInput"),
    svgIdInput: document.getElementById("svgIdInput"),
    parentInput: document.getElementById("parentInput"),
    summaryInput: document.getElementById("summaryInput"),
    largerRegionInput: document.getElementById("largerRegionInput"),
    peopleInput: document.getElementById("peopleInput"),
    languagesInput: document.getElementById("languagesInput"),
    religionsInput: document.getElementById("religionsInput"),
    currenciesInput: document.getElementById("currenciesInput"),
    relatedPlacesInput: document.getElementById("relatedPlacesInput"),
    relatedTimePeriodsInput: document.getElementById("relatedTimePeriodsInput"),
    postsInput: document.getElementById("postsInput"),

    addWritingBtn: document.getElementById("addWritingBtn"),
    writingList: document.getElementById("writingList"),
    jsonPreview: document.getElementById("jsonPreview"),

    writingDialog: document.getElementById("writingDialog"),
    writingDialogTitle: document.getElementById("writingDialogTitle"),
    writingIndexInput: document.getElementById("writingIndexInput"),
    writingTitleInput: document.getElementById("writingTitleInput"),
    writingFileInput: document.getElementById("writingFileInput"),
    writingContentInput: document.getElementById("writingContentInput"),
    closeWritingDialogBtn: document.getElementById("closeWritingDialogBtn"),
    cancelWritingBtn: document.getElementById("cancelWritingBtn"),
    saveWritingBtn: document.getElementById("saveWritingBtn"),
    deleteWritingBtn: document.getElementById("deleteWritingBtn")
};

init();

async function init() {
    bindEvents();
    resetForm();

    try {
        setStatus("Loading places...");
        const data = await WarPlaceData.loadPlaces();
        state.places = data.places;
        renderAll();
        setStatus("Places loaded.", "success");
    } catch (error) {
        state.places = {};
        renderAll();
        setStatus(`${error.message}. The tool can still create the first record.`, "error");
    }
}

function bindEvents() {
    els.newPlaceBtn.addEventListener("click", resetForm);
    els.savePlaceBtn.addEventListener("click", saveCurrentPlace);
    els.placeSearchInput.addEventListener("input", renderPlacesList);
    els.addWritingBtn.addEventListener("click", () => openWritingDialog(-1));

    els.closeWritingDialogBtn.addEventListener("click", closeWritingDialog);
    els.cancelWritingBtn.addEventListener("click", closeWritingDialog);
    els.saveWritingBtn.addEventListener("click", saveWritingSectionFromDialog);
    els.deleteWritingBtn.addEventListener("click", deleteWritingSectionFromDialog);

    els.placeNameInput.addEventListener("input", () => {
        if (!state.currentPlaceId && !els.placeIdInput.dataset.manualEdit) {
            els.placeIdInput.value = WarPlaceData.slugify(els.placeNameInput.value);
        }
        syncSvgIdFromPlaceName();
        updateSuggestedWritingPath();
        updateJsonPreview();
    });

    els.placeIdInput.addEventListener("input", () => {
        els.placeIdInput.dataset.manualEdit = "true";
        updateSuggestedWritingPath();
        updateJsonPreview();
    });

    els.placeTypeInput.addEventListener("change", () => {
        syncSvgIdFromPlaceName();
        updateJsonPreview();
    });

    els.svgIdInput.addEventListener("input", () => {
        els.svgIdInput.dataset.manualEdit = "true";
        updateJsonPreview();
    });

    document.querySelectorAll("input, select, textarea").forEach(input => {
        if (!input.closest("dialog")) {
            input.addEventListener("input", updateJsonPreview);
            input.addEventListener("change", updateJsonPreview);
        }
    });
}

function syncSvgIdFromPlaceName() {
    if (els.svgIdInput.dataset.manualEdit === "true") return;

    if (els.placeTypeInput.value !== "country") {
        els.svgIdInput.value = "";
        return;
    }

    els.svgIdInput.value = WarPlaceData.getCountrySvgId(els.placeNameInput.value);
}

function resetForm() {
    state.currentPlaceId = null;
    state.writingSections = [];

    els.placeNameInput.value = "";
    els.placeIdInput.value = "";
    els.placeIdInput.readOnly = false;
    delete els.placeIdInput.dataset.manualEdit;
    els.placeTypeInput.value = "country";
    els.svgIdInput.value = "";
    delete els.svgIdInput.dataset.manualEdit;
    els.parentInput.value = "";
    els.summaryInput.value = "";
    els.largerRegionInput.value = "";
    els.peopleInput.value = "";
    els.languagesInput.value = "";
    els.religionsInput.value = "";
    els.currenciesInput.value = "";
    els.relatedPlacesInput.value = "";
    els.relatedTimePeriodsInput.value = "";
    els.postsInput.value = "";

    els.editModeBadge.textContent = "New";
    renderWritingList();
    renderPlacesList();
    updateJsonPreview();
    els.placeNameInput.focus();
}

async function loadPlace(placeId) {
    const place = state.places[placeId];
    if (!place) return;

    state.currentPlaceId = placeId;
    state.writingSections = (place.notes || place.writing || []).map(section => ({
        title: section.title || "Untitled",
        markdownFile: section.markdownFile || section.contentFile || "",
        content: null
    }));

    els.placeNameInput.value = place.name || "";
    els.placeIdInput.value = place.placeId || "";
    els.placeIdInput.readOnly = true;
    els.placeIdInput.dataset.manualEdit = "true";
    els.placeTypeInput.value = place.type || "other";
    els.svgIdInput.value = place.svgId || "";
    if (place.svgId) {
        els.svgIdInput.dataset.manualEdit = "true";
    } else {
        delete els.svgIdInput.dataset.manualEdit;
        syncSvgIdFromPlaceName();
    }
    els.parentInput.value = place.parent || "";
    els.summaryInput.value = place.summary || "";
    els.largerRegionInput.value = place.largerRegion || place.region || "";
    els.peopleInput.value = WarPlaceData.arrayToLines(place.people);
    els.languagesInput.value = WarPlaceData.arrayToLines(place.languages);
    els.religionsInput.value = WarPlaceData.arrayToLines(place.religions);
    els.currenciesInput.value = WarPlaceData.arrayToLines(place.currencies);
    els.relatedPlacesInput.value = WarPlaceData.arrayToLines(place.relatedPlaces);
    els.relatedTimePeriodsInput.value = WarPlaceData.arrayToLines(place.relatedTimePeriods);
    els.postsInput.value = WarPlaceData.arrayToLines(place.posts);

    els.editModeBadge.textContent = "Editing";
    renderWritingList();
    renderPlacesList();
    updateJsonPreview();
    setStatus(`Loaded ${place.name || placeId}.`, "success");
}

function buildPlaceFromForm() {
    return {
        placeId: els.placeIdInput.value.trim(),
        name: els.placeNameInput.value.trim(),
        type: els.placeTypeInput.value,
        svgId: els.svgIdInput.value.trim(),
        parent: els.parentInput.value.trim() || null,
        summary: els.summaryInput.value.trim(),
        largerRegion: els.largerRegionInput.value.trim(),
        people: WarPlaceData.linesToArray(els.peopleInput.value),
        languages: WarPlaceData.linesToArray(els.languagesInput.value),
        religions: WarPlaceData.linesToArray(els.religionsInput.value),
        currencies: WarPlaceData.linesToArray(els.currenciesInput.value),
        relatedPlaces: WarPlaceData.linesToArray(els.relatedPlacesInput.value),
        relatedTimePeriods: WarPlaceData.linesToArray(els.relatedTimePeriodsInput.value),
        posts: WarPlaceData.linesToArray(els.postsInput.value),
        notes: state.writingSections.map(section => ({
            title: section.title,
            markdownFile: section.markdownFile
        }))
    };
}

async function saveCurrentPlace() {
    syncSvgIdFromPlaceName();
    const place = buildPlaceFromForm();

    if (!place.name) {
        setStatus("Place name is required.", "error");
        els.placeNameInput.focus();
        return;
    }

    if (!place.placeId) {
        setStatus("Place ID is required.", "error");
        els.placeIdInput.focus();
        return;
    }

    try {
        setStatus("Saving place and markdown sections...");

        for (const section of state.writingSections) {
            if (section.content !== null) {
                await WarPlaceData.saveMarkdown(section.markdownFile, section.content);
            }
        }

        await WarPlaceData.savePlace(place);

        if (state.currentPlaceId && state.currentPlaceId !== place.placeId) {
            delete state.places[state.currentPlaceId];
        }

        state.places[place.placeId] = place;
        state.currentPlaceId = place.placeId;
        state.writingSections.forEach(section => {
            if (section.content !== null) section.content = null;
        });

        els.editModeBadge.textContent = "Editing";
        renderAll();
        setStatus(`Saved ${place.name}.`, "success");
    } catch (error) {
        setStatus(error.message, "error");
    }
}

function renderAll() {
    renderPlacesList();
    renderPlaceIdOptions();
    renderWritingList();
    updateJsonPreview();
    els.placeCount.textContent = Object.keys(state.places).length;
}

function renderPlacesList() {
    const query = els.placeSearchInput.value.trim().toLowerCase();
    const places = Object.values(state.places)
        .filter(place => {
            const haystack = [place.name, place.placeId, place.type, place.svgId]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        })
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    els.placesList.innerHTML = "";

    if (!places.length) {
        els.placesList.innerHTML = '<div class="empty-state">No matching places.</div>';
        return;
    }

    places.forEach(place => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-button";
        if (place.placeId === state.currentPlaceId) button.classList.add("is-active");

        button.innerHTML = `
            <span class="record-title">${escapeHtml(place.name || place.placeId)}</span>
            <span class="record-meta">${escapeHtml(place.type || "unknown")} · ${escapeHtml(place.placeId || "")} · SVG ${escapeHtml(place.svgId || "—")}</span>
        `;

        button.addEventListener("click", () => loadPlace(place.placeId));
        els.placesList.appendChild(button);
    });
}

function renderPlaceIdOptions() {
    els.placeIdOptions.innerHTML = Object.values(state.places)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .map(place => `<option value="${escapeHtml(place.placeId)}">${escapeHtml(place.name || "")}</option>`)
        .join("");
}

function renderWritingList() {
    els.writingList.innerHTML = "";

    if (!state.writingSections.length) {
        els.writingList.innerHTML = '<div class="empty-state">No writing sections yet.</div>';
        return;
    }

    state.writingSections.forEach((section, index) => {
        const card = document.createElement("article");
        card.className = "writing-card";
        card.innerHTML = `
            <div>
                <span class="writing-title">${escapeHtml(section.title)}</span>
                <span class="writing-file">${escapeHtml(section.markdownFile)}</span>
            </div>
            <div class="writing-card-actions">
                <button type="button" data-action="edit">Edit</button>
            </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener("click", () => openWritingDialog(index));
        els.writingList.appendChild(card);
    });
}

async function openWritingDialog(index) {
    els.writingIndexInput.value = String(index);
    els.deleteWritingBtn.classList.toggle("hidden", index < 0);

    if (index < 0) {
        els.writingDialogTitle.textContent = "Add Writing Section";
        els.writingTitleInput.value = "";
        els.writingFileInput.value = "";
        els.writingContentInput.value = "";
        updateSuggestedWritingPath();
    } else {
        const section = state.writingSections[index];
        els.writingDialogTitle.textContent = `Edit ${section.title}`;
        els.writingTitleInput.value = section.title;
        els.writingFileInput.value = section.markdownFile;

        try {
            setStatus(`Loading ${section.title}...`);
            const content = section.content !== null
                ? section.content
                : await WarPlaceData.loadMarkdown(section.markdownFile);
            els.writingContentInput.value = content;
            setStatus("Markdown loaded.", "success");
        } catch (error) {
            els.writingContentInput.value = "";
            setStatus(error.message, "error");
        }
    }

    els.writingDialog.showModal();
    els.writingTitleInput.focus();
}

function closeWritingDialog() {
    els.writingDialog.close();
}

function updateSuggestedWritingPath() {
    if (!els.writingDialog.open) return;
    if (Number(els.writingIndexInput.value) >= 0) return;

    const placeId = els.placeIdInput.value.trim() || WarPlaceData.slugify(els.placeNameInput.value) || "place";
    const titleId = WarPlaceData.slugify(els.writingTitleInput.value) || "note";
    els.writingFileInput.value = `war/text/${placeId}/${titleId}.md`;
}

els.writingTitleInput.addEventListener("input", updateSuggestedWritingPath);

function saveWritingSectionFromDialog() {
    const index = Number(els.writingIndexInput.value);
    const title = els.writingTitleInput.value.trim();
    const markdownFile = normalizeMarkdownPath(els.writingFileInput.value.trim());
    const content = els.writingContentInput.value;

    if (!title) {
        setStatus("Writing section title is required.", "error");
        return;
    }

    if (!markdownFile) {
        setStatus("Markdown file path is required.", "error");
        return;
    }

    const section = { title, markdownFile, content };

    if (index >= 0) {
        state.writingSections[index] = section;
    } else {
        state.writingSections.push(section);
    }

    closeWritingDialog();
    renderWritingList();
    updateJsonPreview();
    setStatus(`Staged markdown section: ${title}. Save the place to write it to disk.`, "success");
}

function deleteWritingSectionFromDialog() {
    const index = Number(els.writingIndexInput.value);
    if (index < 0) return;

    state.writingSections.splice(index, 1);
    closeWritingDialog();
    renderWritingList();
    updateJsonPreview();
    setStatus("Writing reference removed. Existing markdown file was not deleted.", "success");
}

function normalizeMarkdownPath(value) {
    if (!value) return "";
    let result = value.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!result.startsWith("war/")) result = `war/${result}`;
    if (!result.endsWith(".md")) result += ".md";
    return result;
}

function updateJsonPreview() {
    els.jsonPreview.textContent = JSON.stringify(buildPlaceFromForm(), null, 2);
}

function setStatus(message, type = "") {
    els.statusMessage.textContent = message;
    els.statusMessage.className = `status-message ${type}`.trim();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
