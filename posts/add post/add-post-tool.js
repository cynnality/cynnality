// ======================================================
// ADD POST TOOL
// Phase 1 V2
//
// - Saves post metadata
// - Saves post markdown/html file
// - Saves post-specific CSS file
// - Loads existing pages from pages_data.json
// - Does NOT save or edit page metadata/CSS
// ======================================================


// ======================================================
// ELEMENTS
// ======================================================

const pageSelect = document.getElementById("pageSelect");

const postTitleInput = document.getElementById("postTitleInput");
const postIdInput = document.getElementById("postIdInput");
const slugInput = document.getElementById("slugInput");

const statusInput = document.getElementById("statusInput");
const tagsInput = document.getElementById("tagsInput");
const contentTypeInput = document.getElementById("contentTypeInput");

const contentFileInput = document.getElementById("contentFileInput");
const styleFileInput = document.getElementById("styleFileInput");

const contentInput = document.getElementById("contentInput");
const styleInput = document.getElementById("styleInput");

const wrapClassInput = document.getElementById("wrapClassInput");
const wrapClassBtn = document.getElementById("wrapClassBtn");

const classNameInput = document.getElementById("classNameInput");
const classBackgroundInput = document.getElementById("classBackgroundInput");
const classColorInput = document.getElementById("classColorInput");
const addClassStyleBtn = document.getElementById("addClassStyleBtn");

const openMarkerPanelBtn = document.getElementById("openMarkerPanelBtn");
const markerPanel = document.getElementById("markerPanel");
const markerPills = document.getElementById("markerPills");

let MARKERS = [];

const backgroundOpacityBtn = document.getElementById("backgroundOpacityBtn");
const backgroundOpacityPanel = document.getElementById("backgroundOpacityPanel");
const backgroundOpacitySlider = document.getElementById("backgroundOpacitySlider");
const backgroundOpacityValue = document.getElementById("backgroundOpacityValue");

const previewStyle = document.getElementById("previewStyle");
const postPreview = document.getElementById("postPreview");

const generatePreviewBtn = document.getElementById("generatePreviewBtn");
const savePostBtn = document.getElementById("savePostBtn");

const statusMessage = document.getElementById("statusMessage");
const jsonPreview = document.getElementById("jsonPreview");


// ======================================================
// post system UPGRADE
// box builder
// =============
// with visual-builder-core.js
// ======================================================
const boxClassInput = document.getElementById("boxClassInput");
const boxTagInput = document.getElementById("boxTagInput");
const boxBackgroundInput = document.getElementById("boxBackgroundInput");
const boxColorInput = document.getElementById("boxColorInput");
const boxBorderInput = document.getElementById("boxBorderInput");
const boxBorderRadiusInput = document.getElementById("boxBorderRadiusInput");
const boxPaddingInput = document.getElementById("boxPaddingInput");
const boxMarginInput = document.getElementById("boxMarginInput");
const boxWidthInput = document.getElementById("boxWidthInput");
const boxMinHeightInput = document.getElementById("boxMinHeightInput");
const boxDisplayInput = document.getElementById("boxDisplayInput");
const boxGapInput = document.getElementById("boxGapInput");
const createBoxBtn = document.getElementById("createBoxBtn");


let selectedPreviewElement = null;

const selectedTag =
    document.getElementById("selectedTag");

const selectedClass =
    document.getElementById("selectedClass");

const selectedId =
    document.getElementById("selectedId");

const selectedText =
    document.getElementById("selectedText");

const selectedCssBlock =
    document.getElementById("selectedCssBlock");

const inspectBackgroundInput = document.getElementById("inspectBackgroundInput");
const inspectColorInput = document.getElementById("inspectColorInput");
const inspectBorderInput = document.getElementById("inspectBorderInput");
const inspectBorderRadiusInput = document.getElementById("inspectBorderRadiusInput");
const inspectPaddingInput = document.getElementById("inspectPaddingInput");
const inspectMarginInput = document.getElementById("inspectMarginInput");
const applyInspectorStylesBtn = document.getElementById("applyInspectorStylesBtn");

let selectedCssSelector = "";

const togglePreviewGridBtn =
    document.getElementById("togglePreviewGridBtn");

// =updrage-indication-end=====================================================

const DATA_PATHS = {
    posts: "../post data/posts_data.json",
    pages: "../post data/pages_data.json"
};

let POSTS_DATA = { posts: {} };
let PAGES_DATA = { pages: {} };


// ======================================================
// HELPERS
// ======================================================

function makeId(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "_");
}

function makeSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/_+/g, "-");
}

function splitTags(value) {
    return value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
}

function getSelectedPage() {
    return pageSelect.value || "general";
}

function buildContentFilePath() {
    const page = getSelectedPage();
    const postId = postIdInput.value.trim();

    if (!page || !postId) return "";

    return `posts/post data/text/${page}/${postId}.md`;
}

function buildStyleFilePath() {
    const page = getSelectedPage();
    const postId = postIdInput.value.trim();

    if (!page || !postId) return "";

    return `posts/post data/styles/${page}/${postId}.css`;
}

function populatePageSelect() {
    pageSelect.innerHTML = "";

    Object.values(PAGES_DATA.pages || {})
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        .forEach(page => {
            const option = document.createElement("option");
            option.value = page.pageId;
            option.textContent = page.title || page.pageId;
            pageSelect.appendChild(option);
        });

    if (PAGES_DATA.pages?.general) {
        pageSelect.value = "general";
    }
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

        if (!response.ok) {
            console.warn("Could not load text file:", safePath, response.status);
            return "";
        }

        return await response.text();

    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return "";
    }
}

function renderSimpleMarkdown(value) {
    return value
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        .replace(/__(.*?)__/gim, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        .replace(/_(.*?)_/gim, "<em>$1</em>")
        .replace(/\n\n/gim, "</p><p>");
}


// ======================================================
// GENERATED FIELDS
// ======================================================

function updateGeneratedPostFields() {
    if (!postIdInput.dataset.manual) {
        postIdInput.value = makeId(postTitleInput.value);
    }

    if (!slugInput.dataset.manual) {
        slugInput.value = makeSlug(postTitleInput.value);
    }

    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }

    if (!styleFileInput.dataset.manual) {
        styleFileInput.value = buildStyleFilePath();
    }
}


// ======================================================
// BUILD POST OBJECT
// ======================================================

function buildPostObject() {
    const now = new Date().toISOString();

    const existingPost =
        POSTS_DATA.posts?.[postIdInput.value.trim()];

    return {
        postId: postIdInput.value.trim(),
        title: postTitleInput.value.trim(),
        slug: slugInput.value.trim(),
        page: getSelectedPage(),
        status: statusInput.value,
        tags: splitTags(tagsInput.value),
        contentType: contentTypeInput.value,
        contentFile: contentFileInput.value.trim(),
        styleFile: styleFileInput.value.trim(),
        createdAt: existingPost?.createdAt || now,
        updatedAt: now
    };
}


// ======================================================
// LOAD POST FOR EDITING
// ======================================================

async function loadPostForEditing(postId) {
    const post = POSTS_DATA.posts?.[postId];

    if (!post) {
        statusMessage.textContent = `Post not found: ${postId}`;
        return;
    }

    postTitleInput.value = post.title || "";
    postIdInput.value = post.postId || "";
    slugInput.value = post.slug || "";
    statusInput.value = post.status || "draft";
    tagsInput.value = (post.tags || []).join(", ");
    contentTypeInput.value = post.contentType || "markdown-html";
    contentFileInput.value = post.contentFile || "";
    styleFileInput.value = post.styleFile || "";

    pageSelect.value = post.page || "general";

    postIdInput.dataset.manual = "true";
    slugInput.dataset.manual = "true";
    contentFileInput.dataset.manual = "true";
    styleFileInput.dataset.manual = "true";

    contentInput.value = await loadText(post.contentFile);
    styleInput.value = await loadText(post.styleFile);

    loadMarkersFromCurrentCss();

    statusMessage.textContent = `Editing post: ${post.title}`;
    updatePreview();
}


// ======================================================
// PREVIEW
// ======================================================

function updatePreview() {
    updateGeneratedPostFields();

    const post = buildPostObject();

    jsonPreview.textContent =
        JSON.stringify(post, null, 4);

    previewStyle.textContent =
        styleInput.value;

    const renderedContent =
        renderSimpleMarkdown(contentInput.value);

    postPreview.innerHTML =
        renderedContent
            ? `<div class="post-preview-content">${renderedContent}</div>`
            : `<p>Post preview will appear here.</p>`;

    bindPreviewSelection();
}


// ======================================================
// INIT
// ======================================================

async function init() {
    POSTS_DATA = await loadJson(DATA_PATHS.posts, { posts: {} });
    PAGES_DATA = await loadJson(DATA_PATHS.pages, { pages: {} });

    populatePageSelect();
    renderMarkerPills();

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("postId");

    if (postId) {
        await loadPostForEditing(postId);
    } else {
        updatePreview();
    }
}

init();


// ======================================================
// COLLAPSIBLE JSON PANEL
// ======================================================

document.querySelectorAll(".panel-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const panel = button.closest(".collapsible-panel");

        panel.classList.toggle("collapsed");

        button.textContent = panel.classList.contains("collapsed")
            ? button.dataset.closedLabel
            : button.dataset.openLabel;
    });
});


// ======================================================
// MARKER MANAGEMENT
// ======================================================

function wrapSelectionWithTag(tagName) {
    const result = VisualBuilder.wrapSelectionWithTag(contentInput, tagName);

    statusMessage.textContent = result.message;

    if (result.ok) {
        updatePreview();
    }
}

function wrapSelectionWithClass() {
    const result = VisualBuilder.wrapSelectionWithClass(
        contentInput,
        wrapClassInput.value,
        "mark"
    );

    statusMessage.textContent = result.message;

    if (result.ok) {
        updatePreview();
    }
}

function wrapSelectionWithMarker(className) {
    const result = VisualBuilder.wrapSelectionWithClass(
        contentInput,
        className,
        "mark"
    );

    statusMessage.textContent = result.ok
        ? `Wrapped selection with marker: ${className}.`
        : result.message;

    if (result.ok) {
        updatePreview();
    }
}

function createMarkerObject() {
    const marker = VisualBuilder.createMarkerObject({
        className: classNameInput.value,
        background: classBackgroundInput.value,
        color: classColorInput.value
    });

    if (!marker) {
        statusMessage.textContent = "Enter a marker name first.";
        return null;
    }

    return marker;
}

function addMarkerStyleToCss(marker) {
    const markerBlock = VisualBuilder.buildMarkerStyleBlock(marker);
    const existingCss = styleInput.value.trim();

    styleInput.value = existingCss
        ? `${existingCss}\n\n${markerBlock}`
        : markerBlock;
}

function renderMarkerPills() {
    markerPills.innerHTML = "";

    if (!MARKERS.length) {
        markerPills.innerHTML = `<p class="helper-note">No markers yet.</p>`;
        return;
    }

    MARKERS.forEach(marker => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "marker-pill";
        button.textContent = marker.className;

        if (marker.background) {
            button.style.background = marker.background;
        }

        if (marker.color) {
            button.style.color = marker.color;
        }

        button.addEventListener("click", () => {
            wrapSelectionWithMarker(marker.className);
        });

        markerPills.appendChild(button);
    });
}

function addMarker() {
    const marker = createMarkerObject();

    if (!marker) return;

    MARKERS.push(marker);
    addMarkerStyleToCss(marker);
    renderMarkerPills();

    classNameInput.value = "";
    classBackgroundInput.value = "";
    classColorInput.value = "";
    markerPanel.classList.add("hidden");

    statusMessage.textContent = `Added marker: ${marker.className}.`;
    updatePreview();
}

// ======================================================
// loading existing markers when pulling up existing posts
// ======================================================

function loadMarkersFromCurrentCss() {
    MARKERS = VisualBuilder.extractMarkersFromCss(styleInput.value);
    renderMarkerPills();
}

// ======================================================
// BACKGROUND OPACITY
// ======================================================

function updateBackgroundOpacityButton() {
    const value = classBackgroundInput.value.trim();

    backgroundOpacityBtn.disabled =
        !VisualBuilder.isSixDigitHex(value);
}

function applyBackgroundOpacity() {
    const value = classBackgroundInput.value.trim();

    if (!VisualBuilder.isSixDigitHex(value)) {
        statusMessage.textContent = "Enter a 6-digit hex color first, like #7ea7ff.";
        return;
    }

    const updatedColor = VisualBuilder.applyHexOpacity(
        value,
        backgroundOpacitySlider.value
    );

    classBackgroundInput.value = updatedColor;
    backgroundOpacityValue.textContent = `${backgroundOpacitySlider.value}%`;

    updatePreview();
}

// ======================================================
// post system UPGRADE
// ====================
// box builder
// ======================================================
function appendGeneratedCode({ html, css }) {
    const existingContent = contentInput.value.trim();
    const existingCss = styleInput.value.trim();

    contentInput.value = existingContent
        ? `${existingContent}\n\n${html}`
        : html;

    styleInput.value = existingCss
        ? `${existingCss}\n\n${css}`
        : css;

    updatePreview();
}

function createBoxFromInputs() {
    const result = VisualBuilder.createBox({
        tag: boxTagInput.value,
        className: boxClassInput.value,
        background: boxBackgroundInput.value.trim(),
        color: boxColorInput.value.trim(),
        border: boxBorderInput.value.trim(),
        borderRadius: boxBorderRadiusInput.value.trim(),
        padding: boxPaddingInput.value.trim(),
        margin: boxMarginInput.value.trim(),
        width: boxWidthInput.value.trim(),
        minHeight: boxMinHeightInput.value.trim(),
        display: boxDisplayInput.value.trim(),
        gap: boxGapInput.value.trim()
    });

    statusMessage.textContent = result.message;

    if (!result.ok) return;

    appendGeneratedCode({
        html: result.html,
        css: result.css
    });

    boxClassInput.value = "";
}

// ======================================================
// post system UPGRADE
// ====================
// SELECTED ELEMENT
// ======================================================
function getElementLabel(element) {
    const tag = element.tagName.toLowerCase();
    const classes = [...element.classList]
        .filter(className => className !== "builder-selected-element")
        .join(".");

    return classes
        ? `${tag}.${classes}`
        : tag;
}
// SELECTION CLICK HANDLER
function bindPreviewSelection() {
    postPreview.querySelectorAll("*").forEach(element => {
        element.addEventListener("click", event => {
            event.stopPropagation();

            if (selectedPreviewElement) {
                selectedPreviewElement.classList.remove("builder-selected-element");
            }

            selectedPreviewElement = element;
            selectedPreviewElement.classList.add("builder-selected-element");

            selectedTag.textContent =
                element.tagName.toLowerCase();

            selectedClass.textContent =
                [...element.classList]
                    .filter(className => className !== "builder-selected-element")
                    .join(" ") || "(none)";

            selectedId.textContent =
                element.id || "(none)";

            selectedText.textContent =
                element.textContent.trim().slice(0, 80) || "(empty)";

            const primarySelector = getPrimaryClassSelector(element);
            const cssBlock = findCssBlockForSelector(styleInput.value, primarySelector);

            selectedCssBlock.textContent =
                cssBlock || "No matching class CSS block found.";

            selectedCssSelector = primarySelector;

            if (cssBlock) {
                populateStyleInspector(cssBlock);
            } else {
                clearStyleInspector();
            }
        });
    });
}

// ======================================================
// post system UPGRADE
// ====================
// CLASS STYLE BUILDER
// ======================================================
function findCssBlockForSelector(cssText, selector) {
    if (!selector) return "";

    const escapedSelector = selector.replace(".", "\\.");
    const regex = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, "m");
    const match = cssText.match(regex);

    return match
        ? `${selector} {${match[1]}}`
        : "";
}

function getPrimaryClassSelector(element) {
    const className = [...element.classList]
        .find(className => className !== "builder-selected-element");

    return className
        ? `.${className}`
        : "";
}

// ======================================================
// post system UPGRADE
// ====================
// INSPECTOR
// ======================================================
function getCssPropertyValue(cssBlock, propertyName) {
    const regex = new RegExp(`${propertyName}\\s*:\\s*([^;]+);`, "i");
    const match = cssBlock.match(regex);

    return match ? match[1].trim() : "";
}

function populateStyleInspector(cssBlock) {
    inspectBackgroundInput.value =
        getCssPropertyValue(cssBlock, "background");

    inspectColorInput.value =
        getCssPropertyValue(cssBlock, "color");

    inspectBorderInput.value =
        getCssPropertyValue(cssBlock, "border");

    inspectBorderRadiusInput.value =
        getCssPropertyValue(cssBlock, "border-radius");

    inspectPaddingInput.value =
        getCssPropertyValue(cssBlock, "padding");

    inspectMarginInput.value =
        getCssPropertyValue(cssBlock, "margin");
}

function clearStyleInspector() {
    inspectBackgroundInput.value = "";
    inspectColorInput.value = "";
    inspectBorderInput.value = "";
    inspectBorderRadiusInput.value = "";
    inspectPaddingInput.value = "";
    inspectMarginInput.value = "";
}

// ======================================================
// post system UPGRADE
// ====================
// INSPECTOR STYLE APPLICATION
// ======================================================
function replaceCssBlock(cssText, selector, newBlock) {
    if (!selector) return cssText;

    const escapedSelector = selector.replace(".", "\\.");
    const regex = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`, "m");

    if (regex.test(cssText)) {
        return cssText.replace(regex, newBlock);
    }

    return cssText.trim()
        ? `${cssText.trim()}\n\n${newBlock}`
        : newBlock;
}

function applyInspectorStyles() {
    if (!selectedCssSelector) {
        statusMessage.textContent = "Select an element first.";
        return;
    }

    const newCssBlock = VisualBuilder.buildCssBlock({
        selector: selectedCssSelector,
        styles: {
            background: inspectBackgroundInput.value.trim(),
            color: inspectColorInput.value.trim(),
            border: inspectBorderInput.value.trim(),
            "border-radius": inspectBorderRadiusInput.value.trim(),
            padding: inspectPaddingInput.value.trim(),
            margin: inspectMarginInput.value.trim()
        }
    });

    styleInput.value = replaceCssBlock(
        styleInput.value,
        selectedCssSelector,
        newCssBlock
    );

    statusMessage.textContent =
        `Updated styles for ${selectedCssSelector}.`;

    updatePreview();
}

applyInspectorStylesBtn.addEventListener("click", applyInspectorStyles);

// ======================================================
// post system UPGRADE
// ====================
// grid
// ======================================================
togglePreviewGridBtn.addEventListener("click", () => {
    postPreview.classList.toggle("show-builder-grid");
});


// ======================================================
// EVENTS
// ======================================================

postTitleInput.addEventListener("input", () => {
    updateGeneratedPostFields();
    updatePreview();
});

postIdInput.addEventListener("input", () => {
    postIdInput.dataset.manual = "true";
    updateGeneratedPostFields();
    updatePreview();
});

slugInput.addEventListener("input", () => {
    slugInput.dataset.manual = "true";
    updatePreview();
});

contentFileInput.addEventListener("input", () => {
    contentFileInput.dataset.manual = "true";
    updatePreview();
});

styleFileInput.addEventListener("input", () => {
    styleFileInput.dataset.manual = "true";
    updatePreview();
});

document.querySelectorAll("[data-wrap-tag]").forEach(button => {
    button.addEventListener("click", () => {
        wrapSelectionWithTag(button.dataset.wrapTag);
    });
});

wrapClassBtn.addEventListener("click", wrapSelectionWithClass);

openMarkerPanelBtn.addEventListener("click", () => {
    markerPanel.classList.toggle("hidden");
});

addClassStyleBtn.addEventListener("click", addMarker);

classBackgroundInput.addEventListener("input", () => {
    updateBackgroundOpacityButton();
    updatePreview();
});

backgroundOpacityBtn.addEventListener("click", () => {
    backgroundOpacityPanel.classList.toggle("hidden");
});

backgroundOpacitySlider.addEventListener("input", () => {
    backgroundOpacityValue.textContent = `${backgroundOpacitySlider.value}%`;
    applyBackgroundOpacity();
});

pageSelect.addEventListener("change", () => {
    if (!contentFileInput.dataset.manual) {
        contentFileInput.value = buildContentFilePath();
    }

    if (!styleFileInput.dataset.manual) {
        styleFileInput.value = buildStyleFilePath();
    }

    updatePreview();
});

styleInput.addEventListener("blur", () => {
    loadMarkersFromCurrentCss();
});

// ======================================================
// post system UPGRADE
// ====================
// box builder
// ======================================================
createBoxBtn.addEventListener("click", createBoxFromInputs);

document
    .querySelectorAll("input, select, textarea")
    .forEach(element => {
        element.addEventListener("input", updatePreview);
    });

generatePreviewBtn.addEventListener("click", updatePreview);


// ======================================================
// SAVE
// ======================================================

async function savePost() {
    const post = buildPostObject();

    if (!post.postId) {
        statusMessage.textContent = "Post ID is required.";
        return;
    }

    if (!post.title) {
        statusMessage.textContent = "Post title is required.";
        return;
    }

    if (!post.contentFile) {
        statusMessage.textContent = "Content file path is required.";
        return;
    }

    if (!post.styleFile) {
        statusMessage.textContent = "Style file path is required.";
        return;
    }

    try {
        statusMessage.textContent = "Saving post...";

        const postResponse = await fetch("http://127.0.0.1:8787/save-post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(post)
        });

        if (!postResponse.ok) {
            throw new Error("Post metadata save failed.");
        }

        const contentResponse = await fetch("http://127.0.0.1:8787/save-post-content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentFile: post.contentFile,
                content: contentInput.value
            })
        });

        if (!contentResponse.ok) {
            throw new Error("Post content save failed.");
        }

        const styleResponse = await fetch("http://127.0.0.1:8787/save-post-style", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                styleFile: post.styleFile,
                css: styleInput.value
            })
        });

        if (!styleResponse.ok) {
            throw new Error("Post style save failed.");
        }

        POSTS_DATA.posts[post.postId] = post;

        statusMessage.textContent = "Post saved successfully.";
        updatePreview();

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Save failed. Check console and local server.";
    }
}

savePostBtn.addEventListener("click", savePost);