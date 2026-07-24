const PATHS = {
    places: "../data/places.json",
    languages: "../data/languages.json",
    languageFamilies: "../data/language-families.json"
};

const SAVE_SERVER = "http://127.0.0.1:8787";

const state = {
    places: [],
    discoveredLanguages: [],
    savedLanguages: new Map(),
    languageFamilies: new Map()
};

let selectedLanguageId = "";
let selectedFamilyId = "";

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    bindEvents();

    try {
        const [placesData, languagesData, familiesData] = await Promise.all([
            loadJson(PATHS.places),
            loadJson(PATHS.languages),
            loadJson(PATHS.languageFamilies)
        ]);

        normalizePlaces(placesData);
        normalizeLanguages(languagesData);
        normalizeLanguageFamilies(familiesData);

        discoverLanguages();

        renderLanguagesList();
        renderLanguageFamilySelect();
        renderLanguageFamilyList();
    } catch (error) {
        setStatus("languageStatus", error.message, true);
    }
}

function bindEvents() {
    document
        .getElementById("languageSearchInput")
        .addEventListener("input", renderLanguagesList);

    document
        .getElementById("languagesList")
        .addEventListener("change", handleLanguageSelection);

    document
        .getElementById("saveLanguageBtn")
        .addEventListener("click", saveSelectedLanguage);

    document
        .getElementById("languageFamilyList")
        .addEventListener("change", handleFamilySelection);

    document
        .getElementById("newFamilyBtn")
        .addEventListener("click", startNewFamily);

    document
        .getElementById("familyNameInput")
        .addEventListener("input", handleFamilyNameInput);

    document
        .getElementById("saveFamilyBtn")
        .addEventListener("click", saveSelectedFamily);
}

async function loadJson(filePath) {
    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`Unable to load ${filePath}`);
    }

    return response.json();
}

function normalizePlaces(data) {
    state.places = Array.isArray(data?.places)
        ? data.places
        : [];
}

function normalizeLanguages(data) {
    state.savedLanguages.clear();

    const languages =
        data?.languages && typeof data.languages === "object"
            ? Object.values(data.languages)
            : [];

    for (const language of languages) {
        if (!language?.languageId) continue;

        state.savedLanguages.set(language.languageId, {
            languageId: language.languageId,
            familyId: language.familyId || ""
        });
    }
}

function normalizeLanguageFamilies(data) {
    state.languageFamilies.clear();

    const families =
        data?.languageFamilies &&
        typeof data.languageFamilies === "object"
            ? Object.values(data.languageFamilies)
            : [];

    for (const family of families) {
        if (!family?.familyId) continue;

        state.languageFamilies.set(family.familyId, {
            familyId: family.familyId,
            name: family.name || family.familyId,
            summary: family.summary || "",
            markdownFile:
                family.markdownFile ||
                `war/text/language-families/${family.familyId}.md`
        });
    }
}

function discoverLanguages() {
    const discovered = new Map();

    for (const place of state.places) {
        const placeName =
            place.name ||
            place.displayName ||
            place.placeId ||
            "Unknown Place";

        const languages = Array.isArray(place.languages)
            ? place.languages
            : [];

        for (const languageValue of languages) {
            const name = String(languageValue).trim();

            if (!name) continue;

            const languageId = slugify(name);

            if (!languageId) continue;

            if (!discovered.has(languageId)) {
                discovered.set(languageId, {
                    languageId,
                    name,
                    usedIn: []
                });
            }

            const language = discovered.get(languageId);

            if (!language.usedIn.includes(placeName)) {
                language.usedIn.push(placeName);
            }
        }
    }

    state.discoveredLanguages = Array.from(discovered.values())
        .map(language => ({
            ...language,
            usedIn: language.usedIn.sort((a, b) => a.localeCompare(b))
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

function getLanguageRecord(languageId) {
    const discovered = state.discoveredLanguages.find(
        language => language.languageId === languageId
    );

    if (!discovered) return null;

    const saved = state.savedLanguages.get(languageId);

    return {
        ...discovered,
        familyId: saved?.familyId || ""
    };
}

function renderLanguagesList() {
    const select = document.getElementById("languagesList");
    const searchValue = document
        .getElementById("languageSearchInput")
        .value
        .trim()
        .toLowerCase();

    select.innerHTML = "";

    const filteredLanguages = state.discoveredLanguages.filter(language =>
        language.name.toLowerCase().includes(searchValue)
    );

    for (const language of filteredLanguages) {
        const saved = state.savedLanguages.get(language.languageId);
        const family = saved?.familyId
            ? state.languageFamilies.get(saved.familyId)
            : null;

        const option = document.createElement("option");

        option.value = language.languageId;
        option.textContent = family
            ? `${language.name} — ${family.name}`
            : `${language.name} — Unassigned`;

        if (language.languageId === selectedLanguageId) {
            option.selected = true;
        }

        select.appendChild(option);
    }
}

function handleLanguageSelection(event) {
    selectedLanguageId = event.target.value;
    populateLanguageEditor();
}

function populateLanguageEditor() {
    const language = getLanguageRecord(selectedLanguageId);

    if (!language) {
        clearLanguageEditor();
        return;
    }

    document.getElementById("languageNameInput").value =
        language.name;

    document.getElementById("languageIdInput").value =
        language.languageId;

    document.getElementById("languageUsedInInput").value =
        language.usedIn.join("\n");

    document.getElementById("languageFamilySelect").value =
        language.familyId || "";

    setStatus("languageStatus", "");
}

function clearLanguageEditor() {
    document.getElementById("languageNameInput").value = "";
    document.getElementById("languageIdInput").value = "";
    document.getElementById("languageUsedInInput").value = "";
    document.getElementById("languageFamilySelect").value = "";
}

function renderLanguageFamilySelect() {
    const select = document.getElementById("languageFamilySelect");
    const previousValue = select.value;

    select.innerHTML = "";

    select.appendChild(new Option("Unassigned", ""));

    const families = Array.from(state.languageFamilies.values())
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const family of families) {
        select.appendChild(
            new Option(family.name, family.familyId)
        );
    }

    if (
        previousValue &&
        state.languageFamilies.has(previousValue)
    ) {
        select.value = previousValue;
    }
}

async function saveSelectedLanguage() {
    const language = getLanguageRecord(selectedLanguageId);

    if (!language) {
        setStatus(
            "languageStatus",
            "Select a discovered language first.",
            true
        );
        return;
    }

    const familyId =
        document.getElementById("languageFamilySelect").value;

    const payload = {
        languageId: language.languageId,
        familyId
    };

    try {
        await postJson("/save-war-language", payload);

        state.savedLanguages.set(language.languageId, payload);

        renderLanguagesList();
        setStatus(
            "languageStatus",
            `Saved ${language.name}.`
        );
    } catch (error) {
        setStatus("languageStatus", error.message, true);
    }
}

function renderLanguageFamilyList() {
    const select = document.getElementById("languageFamilyList");

    select.innerHTML = "";

    const families = Array.from(state.languageFamilies.values())
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const family of families) {
        const option = document.createElement("option");

        option.value = family.familyId;
        option.textContent = family.name;

        if (family.familyId === selectedFamilyId) {
            option.selected = true;
        }

        select.appendChild(option);
    }
}

function handleFamilySelection(event) {
    selectedFamilyId = event.target.value;
    populateFamilyEditor();
}

async function populateFamilyEditor() {
    const family = state.languageFamilies.get(selectedFamilyId);

    if (!family) {
        clearFamilyEditor();
        return;
    }

    document.getElementById("familyNameInput").value =
        family.name;

    document.getElementById("familyIdInput").value =
        family.familyId;

    document.getElementById("familySummaryInput").value =
        family.summary;

    document.getElementById("familyMarkdownInput").value =
        family.markdownFile;

    document.getElementById("familyIdInput").readOnly = true;

    try {
        const markdown = await loadText(family.markdownFile);

        document.getElementById(
            "familyMarkdownContentInput"
        ).value = markdown;
    } catch {
        document.getElementById(
            "familyMarkdownContentInput"
        ).value = "";
    }

    setStatus("familyStatus", "");
}

function startNewFamily() {
    selectedFamilyId = "";

    clearFamilyEditor();

    document.getElementById("familyIdInput").readOnly = false;
    document.getElementById("familyNameInput").focus();

    setStatus(
        "familyStatus",
        "Enter the new family information, then save."
    );
}

function clearFamilyEditor() {
    document.getElementById("familyNameInput").value = "";
    document.getElementById("familyIdInput").value = "";
    document.getElementById("familySummaryInput").value = "";
    document.getElementById("familyMarkdownInput").value = "";
    document.getElementById("familyMarkdownContentInput").value = "";
}

function handleFamilyNameInput() {
    if (selectedFamilyId) return;

    const name = document
        .getElementById("familyNameInput")
        .value;

    const familyIdInput =
        document.getElementById("familyIdInput");

    familyIdInput.value = slugify(name);

    document.getElementById("familyMarkdownInput").value =
        familyIdInput.value
            ? `war/text/language-families/${familyIdInput.value}.md`
            : "";
}

async function saveSelectedFamily() {
    const name = document
        .getElementById("familyNameInput")
        .value
        .trim();

    const familyId = document
        .getElementById("familyIdInput")
        .value
        .trim();

    const summary = document
        .getElementById("familySummaryInput")
        .value
        .trim();

    const markdownFile = document
        .getElementById("familyMarkdownInput")
        .value
        .trim();

    const markdownContent = document
        .getElementById("familyMarkdownContentInput")
        .value;

    if (!name || !familyId) {
        setStatus(
            "familyStatus",
            "Family name and family ID are required.",
            true
        );
        return;
    }

    if (
        !markdownFile.startsWith(
            "war/text/language-families/"
        ) ||
        !markdownFile.endsWith(".md")
    ) {
        setStatus(
            "familyStatus",
            "Markdown file must be inside war/text/language-families/ and end in .md.",
            true
        );
        return;
    }

    const familyPayload = {
        familyId,
        name,
        summary,
        markdownFile
    };

    try {
        await postJson(
            "/save-war-language-family",
            familyPayload
        );

        await postJson("/save-war-markdown", {
            markdownFile,
            content: markdownContent
        });

        state.languageFamilies.set(familyId, familyPayload);
        selectedFamilyId = familyId;

        renderLanguageFamilyList();
        renderLanguageFamilySelect();
        renderLanguagesList();

        document.getElementById("familyIdInput").readOnly = true;

        setStatus(
            "familyStatus",
            `Saved ${name}.`
        );
    } catch (error) {
        setStatus("familyStatus", error.message, true);
    }
}

async function loadText(relativePath) {
    if (!relativePath) return "";

    const browserPath = relativePath.startsWith("war/")
        ? `../${relativePath.slice(4)}`
        : relativePath;

    const response = await fetch(browserPath);

    if (response.status === 404) {
        return "";
    }

    if (!response.ok) {
        throw new Error(`Unable to load ${relativePath}`);
    }

    return response.text();
}

async function postJson(route, payload) {
    const response = await fetch(`${SAVE_SERVER}${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            result.error || `Unable to save through ${route}`
        );
    }

    return result;
}

function setStatus(elementId, message, isError = false) {
    const element = document.getElementById(elementId);

    element.textContent = message;
    element.classList.toggle("error", isError);
}

function slugify(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
