"use strict";

const PATHS = {
    svg: "./svgs/worldLow.svg",
    places: "./data/places.json"
};

const state = {
    places: [],
    placeBySvgId: new Map(),
    selectedPath: null,
    svg: null,
    originalViewBox: null,
    viewBox: null,
    drag: null
};

const svgMount = document.getElementById("svgMount");
const mapViewport = document.getElementById("mapViewport");
const mapTooltip = document.getElementById("mapTooltip");
const viewerStatus = document.getElementById("viewerStatus");
const placeSearchInput = document.getElementById("placeSearchInput");
const resetMapBtn = document.getElementById("resetMapBtn");

const emptyPlaceState = document.getElementById("emptyPlaceState");
const placeDetails = document.getElementById("placeDetails");

const selectedPlaceName = document.getElementById("selectedPlaceName");
const selectedPlaceCode = document.getElementById("selectedPlaceCode");
const placeType = document.getElementById("placeType");
const placeSummary = document.getElementById("placeSummary");
const placeLargerRegion = document.getElementById("placeLargerRegion");
const placePeople = document.getElementById("placePeople");
const placeReligions = document.getElementById("placeReligions");
const placeLanguages = document.getElementById("placeLanguages");
const placeCurrencies = document.getElementById("placeCurrencies");
const placeTimePeriods = document.getElementById("placeTimePeriods");
const placePosts = document.getElementById("placePosts");
const placeNotes = document.getElementById("placeNotes");

const regionDisplayNames =
    typeof Intl.DisplayNames === "function"
        ? new Intl.DisplayNames(["en"], { type: "region" })
        : null;

document.addEventListener("DOMContentLoaded", initializeViewer);

async function initializeViewer() {
    try {
        const [svgText, placesData] = await Promise.all([
            loadText(PATHS.svg),
            loadOptionalJson(PATHS.places)
        ]);

        mountSvg(svgText);
        normalizePlaces(placesData);
        connectPlaceDataToMap();
        bindViewerEvents();

        setStatus(
            `Ready. Loaded ${state.places.length} place record` +
            `${state.places.length === 1 ? "" : "s"}.`
        );
    } catch (error) {
        console.error(error);
        setStatus(error.message || "The viewer could not be loaded.", true);
    }
}

async function loadText(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path} (${response.status}).`);
    }

    return response.text();
}

async function loadOptionalJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path} (${response.status}).`);
    }

    const rawText = await response.text();

    /*
    This lets the viewer survive while places.json is still a truly empty file.
    Once data is added, the preferred starter shape is:
        { "places": [] }
    */
    if (!rawText.trim()) {
        return { places: [] };
    }

    try {
        return JSON.parse(rawText);
    } catch (error) {
        throw new Error(
            `${path} is not valid JSON. Use { "places": [] } as the empty starter value.`
        );
    }
}

function mountSvg(svgText) {
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(svgText, "image/svg+xml");

    const parserError = svgDocument.querySelector("parsererror");

    if (parserError) {
        throw new Error("worldLow.svg could not be parsed as SVG.");
    }

    const importedSvg = document.importNode(
        svgDocument.documentElement,
        true
    );

    importedSvg.removeAttribute("width");
    importedSvg.removeAttribute("height");
    importedSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    importedSvg.setAttribute("role", "img");
    importedSvg.setAttribute(
        "aria-label",
        "Interactive world map"
    );

    svgMount.replaceChildren(importedSvg);

    state.svg = importedSvg;

    const parsedViewBox = parseViewBox(
        importedSvg.getAttribute("viewBox")
    );

    if (!parsedViewBox) {
        throw new Error("The SVG does not contain a usable viewBox.");
    }

    state.originalViewBox = { ...parsedViewBox };
    state.viewBox = { ...parsedViewBox };

    prepareMapPaths();
}

function parseViewBox(value) {
    if (!value) return null;

    const values = value
        .trim()
        .split(/\s+/)
        .map(Number);

    if (
        values.length !== 4 ||
        values.some(number => !Number.isFinite(number))
    ) {
        return null;
    }

    return {
        x: values[0],
        y: values[1],
        width: values[2],
        height: values[3]
    };
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

    state.placeBySvgId = new Map(
        state.places
            .filter(place => place.svgId)
            .map(place => [place.svgId, place])
    );
}

function prepareMapPaths() {
    const countryPaths = state.svg.querySelectorAll(
        "#polygons .land[id], path.land[id]"
    );

    countryPaths.forEach(path => {
        const code = path.id.toUpperCase();

        path.dataset.mapCode = code;
        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute(
            "aria-label",
            getMapDisplayName(code)
        );

        path.addEventListener("click", event => {
            event.stopPropagation();
            selectMapPath(path);
        });

        path.addEventListener("keydown", event => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                selectMapPath(path);
            }
        });

        path.addEventListener("pointerenter", event => {
            showTooltipForPath(path, event);
        });

        path.addEventListener("pointermove", positionTooltip);

        path.addEventListener("pointerleave", hideTooltip);
    });
}

function connectPlaceDataToMap() {
    state.placeBySvgId.forEach((place, svgId) => {
        const path = state.svg.querySelector(
            `#${cssEscape(svgId)}`
        );

        if (!path) {
            console.warn(
                `No SVG path found for place "${place.name}" using svgId "${svgId}".`
            );
            return;
        }

        path.classList.add("has-place-data");
        path.dataset.placeId = place.placeId;
        path.setAttribute(
            "aria-label",
            `${place.name}, ${place.type || "place"}`
        );
    });
}

function bindViewerEvents() {
    resetMapBtn.addEventListener("click", resetMapView);

    placeSearchInput.addEventListener("input", handleSearch);

    mapViewport.addEventListener("wheel", handleMapWheel, {
        passive: false
    });

    mapViewport.addEventListener(
        "pointerdown",
        startMapDrag
    );

    window.addEventListener("pointermove", moveMapDrag);
    window.addEventListener("pointerup", endMapDrag);
    window.addEventListener("pointercancel", endMapDrag);
}

function selectMapPath(path) {
    if (state.selectedPath) {
        state.selectedPath.classList.remove("is-selected");
    }

    state.selectedPath = path;
    path.classList.add("is-selected");

    const code = path.dataset.mapCode || path.id;
    const place = state.placeBySvgId.get(
        String(code).toUpperCase()
    );

    renderPlace(place, code);
}

function renderPlace(place, mapCode) {
    emptyPlaceState.hidden = true;
    placeDetails.hidden = false;

    const fallbackName = getMapDisplayName(mapCode);

    selectedPlaceName.textContent =
        place?.name || fallbackName;

    selectedPlaceCode.textContent = mapCode || "—";

    placeType.textContent =
        place?.type || "Map place";

    placeSummary.textContent =
        place?.summary ||
        "This place exists on the map, but no detailed record has been added to places.json yet.";

    renderChipSection(
        placeLargerRegion,
        place?.largerRegion || place?.region
    );

    renderChipSection(
        placePeople,
        place?.people
    );

    renderChipSection(
        placeReligions,
        place?.religions
    );

    renderChipSection(
        placeLanguages,
        place?.languages
    );

    renderChipSection(
        placeCurrencies,
        place?.currencies
    );

    renderChipSection(
        placeTimePeriods,
        place?.timePeriods
    );

    renderPosts(placePosts, place?.posts);

    const notesValue =
        place?.notes ||
        place?.description ||
        "";

    placeNotes.textContent = notesValue;
    toggleDetailSection(
        placeNotes,
        Boolean(notesValue)
    );

    const recordMessage = place
        ? `Selected ${place.name}.`
        : `Selected ${fallbackName}. No place record exists yet.`;

    setStatus(recordMessage);
}

function renderChipSection(container, values) {
    container.replaceChildren();

    const items = normalizeSimpleList(values);

    items.forEach(item => {
        const chip = document.createElement("span");
        chip.className = "data-chip";
        chip.textContent = getItemLabel(item);
        container.appendChild(chip);
    });

    toggleDetailSection(container, items.length > 0);
}

function renderPosts(container, posts) {
    container.replaceChildren();

    const items = normalizeSimpleList(posts);

    items.forEach(item => {
        const label = getItemLabel(item);
        const href =
            typeof item === "object"
                ? item.href || item.url || ""
                : "";

        const element = href
            ? document.createElement("a")
            : document.createElement("div");

        element.className = "related-item";
        element.textContent = label;

        if (href) {
            element.href = href;
        }

        container.appendChild(element);
    });

    toggleDetailSection(container, items.length > 0);
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

function getItemLabel(item) {
    if (typeof item === "string") {
        return item;
    }

    return (
        item.label ||
        item.name ||
        item.title ||
        item.id ||
        "Untitled"
    );
}

function toggleDetailSection(childElement, shouldShow) {
    const section = childElement.closest(".detail-section");

    if (!section) return;

    section.classList.toggle("is-empty", !shouldShow);
}

function handleSearch() {
    const query = placeSearchInput.value
        .trim()
        .toLowerCase();

    if (!query) return;

    const matchingPlace = state.places.find(place => {
        const searchText = [
            place.name,
            place.placeId,
            place.svgId,
            place.type
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchText.includes(query);
    });

    if (matchingPlace) {
        const path = state.svg.querySelector(
            `#${cssEscape(matchingPlace.svgId)}`
        );

        if (path) {
            selectMapPath(path);
            focusPath(path);
        }

        return;
    }

    const matchingPath = Array.from(
        state.svg.querySelectorAll(".land[id]")
    ).find(path => {
        const code = path.id;
        const displayName = getMapDisplayName(code);

        return `${displayName} ${code}`
            .toLowerCase()
            .includes(query);
    });

    if (matchingPath) {
        selectMapPath(matchingPath);
        focusPath(matchingPath);
        return;
    }

    setStatus(`No map place matched “${placeSearchInput.value.trim()}”.`);
}

function getMapDisplayName(code) {
    const normalizedCode = String(code || "").toUpperCase();

    if (
        regionDisplayNames &&
        /^[A-Z]{2}$/.test(normalizedCode)
    ) {
        try {
            const displayName =
                regionDisplayNames.of(normalizedCode);

            if (
                displayName &&
                displayName !== normalizedCode
            ) {
                return displayName;
            }
        } catch (error) {
            // Fall through to the code.
        }
    }

    return normalizedCode || "Unknown place";
}

function showTooltipForPath(path, event) {
    const code = path.dataset.mapCode || path.id;
    const place = state.placeBySvgId.get(code);

    mapTooltip.textContent = place
        ? `${place.name}${place.type ? ` — ${place.type}` : ""}`
        : `${getMapDisplayName(code)} — no data record`;

    mapTooltip.hidden = false;
    positionTooltip(event);
}

function positionTooltip(event) {
    if (mapTooltip.hidden) return;

    const viewportRect = mapViewport.getBoundingClientRect();
    const tooltipWidth = mapTooltip.offsetWidth;
    const tooltipHeight = mapTooltip.offsetHeight;

    let left = event.clientX - viewportRect.left + 14;
    let top = event.clientY - viewportRect.top + 14;

    if (left + tooltipWidth > viewportRect.width - 8) {
        left =
            event.clientX -
            viewportRect.left -
            tooltipWidth -
            14;
    }

    if (top + tooltipHeight > viewportRect.height - 8) {
        top =
            event.clientY -
            viewportRect.top -
            tooltipHeight -
            14;
    }

    mapTooltip.style.left = `${Math.max(8, left)}px`;
    mapTooltip.style.top = `${Math.max(8, top)}px`;
}

function hideTooltip() {
    mapTooltip.hidden = true;
}

function handleMapWheel(event) {
    if (!state.svg || !state.viewBox) return;

    event.preventDefault();

    const zoomFactor = event.deltaY < 0 ? 0.86 : 1.16;

    const point = clientPointToSvg(
        event.clientX,
        event.clientY
    );

    if (!point) return;

    const minimumWidth =
        state.originalViewBox.width * 0.08;

    const maximumWidth =
        state.originalViewBox.width * 2.5;

    const nextWidth = clamp(
        state.viewBox.width * zoomFactor,
        minimumWidth,
        maximumWidth
    );

    const aspect =
        state.originalViewBox.height /
        state.originalViewBox.width;

    const nextHeight = nextWidth * aspect;

    const xRatio =
        (point.x - state.viewBox.x) /
        state.viewBox.width;

    const yRatio =
        (point.y - state.viewBox.y) /
        state.viewBox.height;

    state.viewBox.x =
        point.x - nextWidth * xRatio;

    state.viewBox.y =
        point.y - nextHeight * yRatio;

    state.viewBox.width = nextWidth;
    state.viewBox.height = nextHeight;

    applyViewBox();
}

function startMapDrag(event) {
    if (
        event.button !== 0 ||
        event.target.closest(".land")
    ) {
        return;
    }

    mapViewport.setPointerCapture?.(event.pointerId);

    state.drag = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startViewBoxX: state.viewBox.x,
        startViewBoxY: state.viewBox.y
    };

    mapViewport.classList.add("is-dragging");
}

function moveMapDrag(event) {
    if (
        !state.drag ||
        event.pointerId !== state.drag.pointerId
    ) {
        return;
    }

    const rect = mapViewport.getBoundingClientRect();

    const deltaX =
        (event.clientX - state.drag.startClientX) *
        (state.viewBox.width / rect.width);

    const deltaY =
        (event.clientY - state.drag.startClientY) *
        (state.viewBox.height / rect.height);

    state.viewBox.x =
        state.drag.startViewBoxX - deltaX;

    state.viewBox.y =
        state.drag.startViewBoxY - deltaY;

    applyViewBox();
}

function endMapDrag(event) {
    if (
        !state.drag ||
        event.pointerId !== state.drag.pointerId
    ) {
        return;
    }

    state.drag = null;
    mapViewport.classList.remove("is-dragging");
}

function resetMapView() {
    state.viewBox = { ...state.originalViewBox };
    applyViewBox();
    setStatus("Map view reset.");
}

function focusPath(path) {
    let box;

    try {
        box = path.getBBox();
    } catch (error) {
        return;
    }

    if (!box.width || !box.height) return;

    const paddingMultiplier = 1.7;
    const targetWidth = Math.max(
        box.width * paddingMultiplier,
        state.originalViewBox.width * 0.08
    );

    const targetHeight = Math.max(
        box.height * paddingMultiplier,
        state.originalViewBox.height * 0.08
    );

    const targetAspect =
        state.originalViewBox.width /
        state.originalViewBox.height;

    let width = targetWidth;
    let height = targetHeight;

    if (width / height > targetAspect) {
        height = width / targetAspect;
    } else {
        width = height * targetAspect;
    }

    state.viewBox = {
        x: box.x + box.width / 2 - width / 2,
        y: box.y + box.height / 2 - height / 2,
        width,
        height
    };

    applyViewBox();
}

function clientPointToSvg(clientX, clientY) {
    if (!state.svg?.createSVGPoint) return null;

    const point = state.svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const matrix = state.svg.getScreenCTM();

    if (!matrix) return null;

    return point.matrixTransform(matrix.inverse());
}

function applyViewBox() {
    state.svg.setAttribute(
        "viewBox",
        [
            state.viewBox.x,
            state.viewBox.y,
            state.viewBox.width,
            state.viewBox.height
        ].join(" ")
    );
}

function setStatus(message, isError = false) {
    viewerStatus.textContent = message;
    viewerStatus.classList.toggle("is-error", isError);
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

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function cssEscape(value) {
    if (window.CSS?.escape) {
        return window.CSS.escape(value);
    }

    return String(value).replace(
        /[^a-zA-Z0-9_-]/g,
        character => `\\${character}`
    );
}
