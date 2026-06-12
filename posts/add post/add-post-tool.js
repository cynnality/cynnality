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
}


// ======================================================
// INIT
// ======================================================

async function init() {
    POSTS_DATA = await loadJson(DATA_PATHS.posts, { posts: {} });
    PAGES_DATA = await loadJson(DATA_PATHS.pages, { pages: {} });

    populatePageSelect();

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
// TEXT WRAPPING HELPERS
// ======================================================

function getSelectedContentText() {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;

    return {
        start,
        end,
        selectedText: contentInput.value.slice(start, end)
    };
}

function replaceSelectedContentText(newText, selectionStart, selectionEnd) {
    const before = contentInput.value.slice(0, selectionStart);
    const after = contentInput.value.slice(selectionEnd);

    contentInput.value = `${before}${newText}${after}`;

    const cursorPosition = selectionStart + newText.length;
    contentInput.focus();
    contentInput.setSelectionRange(cursorPosition, cursorPosition);

    updatePreview();
}

function wrapSelectionWithTag(tagName) {
    const { start, end, selectedText } = getSelectedContentText();

    if (!selectedText) {
        statusMessage.textContent = "Select text in the content editor first.";
        return;
    }

    const wrappedText = `<${tagName}>${selectedText}</${tagName}>`;

    replaceSelectedContentText(wrappedText, start, end);
    statusMessage.textContent = `Wrapped selection with <${tagName}>.`;
}

function cleanClassName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/_+/g, "-");
}

function wrapSelectionWithClass() {
    const className = cleanClassName(wrapClassInput.value);

    if (!className) {
        statusMessage.textContent = "Enter a mark class name first.";
        return;
    }

    const { start, end, selectedText } = getSelectedContentText();

    if (!selectedText) {
        statusMessage.textContent = "Select text in the content editor first.";
        return;
    }

    const wrappedText = `<mark class="${className}">${selectedText}</mark>`;

    replaceSelectedContentText(wrappedText, start, end);
    statusMessage.textContent = `Wrapped selection with mark.${className}.`;
}


// ======================================================
// CLASS STYLE BUILDER
// ======================================================
function buildClassStyleBlock() {
    const className = cleanClassName(classNameInput.value);
    const background = classBackgroundInput.value.trim();
    const color = classColorInput.value.trim();

    if (!className) {
        statusMessage.textContent = "Enter a mark class name first.";
        return "";
    }

    const lines = [
        `mark.${className} {`
    ];

    if (background) {
        lines.push(`    background: ${background};`);
    }

    if (color) {
        lines.push(`    color: ${color};`);
    }

    lines.push(`}`);

    return lines.join("\n");
}

function addClassStyleToCss() {
    const classBlock = buildClassStyleBlock();

    if (!classBlock) return;

    const existingCss = styleInput.value.trim();

    styleInput.value = existingCss
        ? `${existingCss}\n\n${classBlock}`
        : classBlock;

    statusMessage.textContent = "Mark style added to post CSS.";
    updatePreview();
}



// ======================================================
// BACKGROUND OPACITY
// ======================================================
function isSixDigitHex(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function applyHexOpacity(hex, opacityPercent) {
    const cleanHex = hex.trim().replace("#", "").slice(0, 6);

    if (cleanHex.length !== 6) return hex;

    const opacity = Number(opacityPercent) / 100;

    const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0");

    return `#${cleanHex}${alpha}`;
}

function updateBackgroundOpacityButton() {
    const value = classBackgroundInput.value.trim();

    backgroundOpacityBtn.disabled = !isSixDigitHex(value);
}

function applyBackgroundOpacity() {
    const value = classBackgroundInput.value.trim();

    if (!isSixDigitHex(value)) {
        statusMessage.textContent = "Enter a 6-digit hex color first, like #7ea7ff.";
        return;
    }

    const updatedColor = applyHexOpacity(value, backgroundOpacitySlider.value);

    classBackgroundInput.value = updatedColor;
    backgroundOpacityValue.textContent = `${backgroundOpacitySlider.value}%`;

    updatePreview();
}




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

addClassStyleBtn.addEventListener("click", addClassStyleToCss);

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