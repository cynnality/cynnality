"use strict";

const PATHS = {
    places: "../data/places.json",
    languages: "../data/languages.json",
    languageFamilies: "../data/language-families.json"
};

const SAVE_SERVER = "http://127.0.0.1:8787";

const state = {
    places: [],
    languages: [],
    languageFamilies: [],

    languageRegistry: [],
    languageById: new Map(),
    languageFamilyById: new Map()
};

let selectedLanguageId = "";
let selectedFamilyId = "";

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    bindEvents();

    try {
        const [
            placesData,
            languagesData,
            languageFamiliesData
        ] = await Promise.all([
            loadOptionalJson(PATHS.places, { places: [] }),
            loadOptionalJson(PATHS.languages, { languages: {} }),
            loadOptionalJson(PATHS.languageFamilies, {
                languageFamilies: {}
            })
        ]);

        normalizePlaces(placesData);
        normalizeLanguages(languagesData);
        normalizeLanguageFamilies(languageFamiliesData);
        rebuildLanguageRegistry();

        renderLanguagesList();
        renderLanguageFamilySelect();
        renderLanguageFamilyList();

        setStatus(
            "languageStatus",
            `Ready. Found ${state.languageRegistry.length} discovered language` +
            `${state.languageRegistry.length === 1 ? "" : "s"}.`
        );
    } catch (error) {
        console.error(error);
        setStatus(
            "languageStatus",
            error.message || "The language input tool could not be loaded.",
            true
        );
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

async function loadOptionalJson(path, emptyValue) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path} (${response.status}).`);
    }

    const rawText = await response.text();

    if (!rawText.trim()) {
        return emptyValue;
    }

    try {
        return JSON.parse(rawText);
    } catch (error) {
        throw new Error(`${path} is not valid JSON.`);
    }
}

function normalizePlaces(data) {
    let rawPlaces = [];

    if (Array.isArray(data)) {
        rawPlaces = data;
    } else if (Array.isArray(data?.places)) {
        rawPlaces = data.places;
    } else if (
        data?.places &&
        typeof data.places === "object"
    ) {
        rawPlaces = Object.values(data.places);
    }

    state.places = rawPlaces
        .filter(place => place && typeof place === "object")
        .map(place => {
            const svgId = String(
                place.svgId || place.mapId || ""
            )
                .trim()
                .toUpperCase();

            return {
                ...place,
                svgId,
                placeId:
                    place.placeId ||
                    slugify(place.name || svgId)
            };
        });
}

function normalizeLanguages(data) {
    let rawLanguages = [];

    if (Array.isArray(data)) {
        rawLanguages = data;
    } else if (Array.isArray(data?.languages)) {
        rawLanguages = data.languages;
    } else if (
        data?.languages &&
        typeof data.languages === "object"
    ) {
        rawLanguages = Object.values(data.languages);
    }

    state.languages = rawLanguages
        .filter(language => language && typeof language === "object")
        .map(language => ({
            ...language,
            languageId:
                language.languageId ||
                slugify(language.name || ""),
            familyId: language.familyId || ""
        }))
        .filter(language => language.languageId);
}

function normalizeLanguageFamilies(data) {
    let rawFamilies = [];

    if (Array.isArray(data)) {
        rawFamilies = data;
    } else if (Array.isArray(data?.languageFamilies)) {
        rawFamilies = data.languageFamilies;
    } else if (
        data?.languageFamilies &&
        typeof data.languageFamilies === "object"
    ) {
        rawFamilies = Object.values(data.languageFamilies);
    }

    state.languageFamilies = rawFamilies
        .filter(family => family && typeof family === "object")
        .map(family => {
            const familyId =
                family.familyId ||
                slugify(family.name || "");

            return {
                ...family,
                familyId,
                name: family.name || familyId,
                summary: family.summary || "",
                markdownFile:
                    family.markdownFile ||
                    (
                        familyId
                            ? `war/text/language-families/${familyId}.md`
                            : ""
                    )
            };
        })
        .filter(family => family.familyId);

    state.languageFamilyById = new Map(
        state.languageFamilies.map(family => [
            family.familyId,
            family
        ])
    );
}

function getDiscoveredLanguages() {
    const discovered = new Map();

    state.places.forEach(place => {
        const languages = normalizeSimpleList(place.languages);

        languages.forEach(languageName => {
            const normalizedName = String(languageName).trim();

            if (!normalizedName) return;

            const languageId = slugify(normalizedName);

            if (!languageId) return;

            if (!discovered.has(languageId)) {
                discovered.set(languageId, {
                    languageId,
                    name: normalizedName,
                    places: []
                });
            }

            const placeRecord = {
                placeId: place.placeId,
                name:
                    place.name ||
                    place.displayName ||
                    place.placeId ||
                    "Unknown Place"
            };

            const currentLanguage = discovered.get(languageId);
            const placeAlreadyAdded = currentLanguage.places.some(
                item => item.placeId === placeRecord.placeId
            );

            if (!placeAlreadyAdded) {
                currentLanguage.places.push(placeRecord);
            }
        });
    });

    return Array.from(discovered.values())
        .map(language => ({
            ...language,
            places: language.places.sort((a, b) =>
                a.name.localeCompare(b.name)
            )
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

function buildLanguageRegistry() {
    const discoveredLanguages = getDiscoveredLanguages();

    const savedLanguages = new Map(
        state.languages.map(language => [
            language.languageId,
            language
        ])
    );

    return discoveredLanguages.map(discovered => {
        const saved = savedLanguages.get(discovered.languageId);

        return {
            languageId: discovered.languageId,
            name: discovered.name,
            familyId: saved?.familyId || "",
            places: discovered.places
        };
    });
}

function rebuildLanguageRegistry() {
    state.languageRegistry = buildLanguageRegistry();

    state.languageById = new Map(
        state.languageRegistry.map(language => [
            language.languageId,
            language
        ])
    );
}

function getLanguageRecord(languageId) {
    return state.languageById.get(languageId) || null;
}

function renderLanguagesList() {
    const select = document.getElementById("languagesList");
    const searchValue = document
        .getElementById("languageSearchInput")
        .value
        .trim()
        .toLowerCase();

    select.replaceChildren();

    const filteredLanguages = state.languageRegistry.filter(language =>
        language.name.toLowerCase().includes(searchValue)
    );

    filteredLanguages.forEach(language => {
        const family = language.familyId
            ? state.languageFamilyById.get(language.familyId)
            : null;

        const option = document.createElement("option");

        option.value = language.languageId;
        option.textContent = family
            ? `${language.name} — ${family.name}`
            : `${language.name} — Unassigned`;

        option.selected =
            language.languageId === selectedLanguageId;

        select.appendChild(option);
    });

    if (
        selectedLanguageId &&
        !filteredLanguages.some(
            language => language.languageId === selectedLanguageId
        )
    ) {
        select.value = "";
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
        language.places
            .map(place => place.name)
            .join("\n");

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
    const currentLanguage = getLanguageRecord(selectedLanguageId);
    const previousValue =
        currentLanguage?.familyId || select.value;

    select.replaceChildren(
        new Option("Unassigned", "")
    );

    const families = [...state.languageFamilies]
        .sort((a, b) => a.name.localeCompare(b.name));

    families.forEach(family => {
        select.appendChild(
            new Option(family.name, family.familyId)
        );
    });

    if (
        previousValue &&
        state.languageFamilyById.has(previousValue)
    ) {
        select.value = previousValue;
    } else {
        select.value = "";
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

        const savedIndex = state.languages.findIndex(
            item => item.languageId === language.languageId
        );

        if (savedIndex >= 0) {
            state.languages[savedIndex] = {
                ...state.languages[savedIndex],
                ...payload
            };
        } else {
            state.languages.push(payload);
        }

        rebuildLanguageRegistry();
        renderLanguagesList();
        populateLanguageEditor();

        setStatus(
            "languageStatus",
            `Saved ${language.name}.`
        );
    } catch (error) {
        console.error(error);
        setStatus(
            "languageStatus",
            error.message || "The language could not be saved.",
            true
        );
    }
}

function renderLanguageFamilyList() {
    const select = document.getElementById("languageFamilyList");

    select.replaceChildren();

    const families = [...state.languageFamilies]
        .sort((a, b) => a.name.localeCompare(b.name));

    families.forEach(family => {
        const option = document.createElement("option");

        option.value = family.familyId;
        option.textContent = family.name;
        option.selected =
            family.familyId === selectedFamilyId;

        select.appendChild(option);
    });
}

function handleFamilySelection(event) {
    selectedFamilyId = event.target.value;
    populateFamilyEditor();
}

async function populateFamilyEditor() {
    const family =
        state.languageFamilyById.get(selectedFamilyId);

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
    } catch (error) {
        console.error(error);

        document.getElementById(
            "familyMarkdownContentInput"
        ).value = "";

        setStatus(
            "familyStatus",
            error.message || "The family Markdown could not be loaded.",
            true
        );

        return;
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

        const existingIndex =
            state.languageFamilies.findIndex(
                family => family.familyId === familyId
            );

        if (existingIndex >= 0) {
            state.languageFamilies[existingIndex] =
                familyPayload;
        } else {
            state.languageFamilies.push(familyPayload);
        }

        state.languageFamilyById.set(
            familyId,
            familyPayload
        );

        selectedFamilyId = familyId;

        renderLanguageFamilyList();
        renderLanguageFamilySelect();
        renderLanguagesList();
        populateLanguageEditor();

        document.getElementById("familyIdInput").readOnly = true;

        setStatus(
            "familyStatus",
            `Saved ${name}.`
        );
    } catch (error) {
        console.error(error);
        setStatus(
            "familyStatus",
            error.message || "The language family could not be saved.",
            true
        );
    }
}

async function loadText(relativePath) {
    if (!relativePath) return "";

    const browserPath = resolveBrowserPath(relativePath);
    const response = await fetch(browserPath);

    if (response.status === 404) {
        return "";
    }

    if (!response.ok) {
        throw new Error(
            `Could not load ${relativePath} (${response.status}).`
        );
    }

    return response.text();
}

function resolveBrowserPath(relativePath) {
    const normalized = String(relativePath || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "");

    if (normalized.startsWith("war/")) {
        return `../${normalized.slice(4)}`;
    }

    return normalized;
}

async function postJson(route, payload) {
    const response = await fetch(`${SAVE_SERVER}${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error(
            `The save server returned an invalid response for ${route}.`
        );
    }

    if (!response.ok || !result.ok) {
        throw new Error(
            result.error || `Unable to save through ${route}.`
        );
    }

    return result;
}

function normalizeSimpleList(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}

function setStatus(elementId, message, isError = false) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

function slugify(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
