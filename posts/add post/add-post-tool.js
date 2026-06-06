// ======================================================
// ADD POST TOOL
// Phase 1
//
// - Generates post metadata
// - Auto-builds content/style file paths
// - Renders live markdown/html preview
// - Injects custom CSS into preview 
// ======================================================


// ======================================================
// ELEMENTS
// ======================================================

const pageSelect = document.getElementById("pageSelect");
const newPageInput = document.getElementById("newPageInput");

const pageTitleInput = document.getElementById("pageTitleInput");
const pageDescriptionInput = document.getElementById("pageDescriptionInput");
const pageStyleFileInput = document.getElementById("pageStyleFileInput");
const pageStyleInput = document.getElementById("pageStyleInput");

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
    const newPage = newPageInput.value.trim();

    if (newPage) {
        return makeSlug(newPage);
    }

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

function buildPageStyleFilePath() {
    const page = getSelectedPage();

    if (!page) return "";

    return `posts/post data/page styles/${page}.css`;
}

function buildPageObject() {
    const pageId = getSelectedPage();

    return {
        pageId,
        title: pageTitleInput.value.trim() || pageId,
        slug: pageId,
        description: pageDescriptionInput.value.trim(),
        styleFile: pageStyleFileInput.value.trim() || buildPageStyleFilePath()
    };
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

    if (!pageSelect.value && PAGES_DATA.pages?.general) {
        pageSelect.value = "general";
    }
}

function fillPageFieldsFromSelectedPage() {
    const pageId = pageSelect.value;
    const page = PAGES_DATA.pages?.[pageId];

    if (!page || newPageInput.value.trim()) return;

    pageTitleInput.value = page.title || "";
    pageDescriptionInput.value = page.description || "";
    pageStyleFileInput.value = page.styleFile || buildPageStyleFilePath();
}

function updateGeneratedPageFields() {
    if (newPageInput.value.trim()) {
        pageTitleInput.value = newPageInput.value.trim();
    }

    if (!pageStyleFileInput.dataset.manual) {
        pageStyleFileInput.value = buildPageStyleFilePath();
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

// Simple markdown support for preview.
// Real HTML typed into the content box will still render as HTML.
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

    updateGeneratedPageFields();
}


// ======================================================
// BUILD POST OBJECT
// ======================================================

function buildPostObject() {
    const now = new Date().toISOString();

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
        createdAt: "",
        updatedAt: now
    };
}

// ======================================================
// loaders
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
    fillPageFieldsFromSelectedPage();

    postIdInput.dataset.manual = "true";
    slugInput.dataset.manual = "true";
    contentFileInput.dataset.manual = "true";
    styleFileInput.dataset.manual = "true";

    console.log("Loading post content file:", post.contentFile);
    console.log("Loading post style file:", post.styleFile);

    contentInput.value = await loadText(post.contentFile);
    styleInput.value = await loadText(post.styleFile);
    pageStyleInput.value = await loadText(pageStyleFileInput.value);

    console.log("Loaded CSS:", styleInput.value);

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
        `${pageStyleInput.value}\n\n${styleInput.value}`;

    const renderedContent =
        renderSimpleMarkdown(contentInput.value);

    postPreview.innerHTML =
        renderedContent
            ? `<div class="post-preview-content">${renderedContent}</div>`
            : `<p>Post preview will appear here.</p>`;
}

async function init() {
    POSTS_DATA = await loadJson(DATA_PATHS.posts, { posts: {} });
    PAGES_DATA = await loadJson(DATA_PATHS.pages, { pages: {} });

    populatePageSelect();
    fillPageFieldsFromSelectedPage();

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

pageSelect.addEventListener("change", () => {
    fillPageFieldsFromSelectedPage();
    updatePreview();
});

newPageInput.addEventListener("input", () => {
    updateGeneratedPageFields();
    updatePreview();
});

pageStyleFileInput.addEventListener("input", () => {
    pageStyleFileInput.dataset.manual = "true";
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

        await fetch("http://127.0.0.1:8787/save-post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(post)
        });

        await fetch("http://127.0.0.1:8787/save-post-content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentFile: post.contentFile,
                content: contentInput.value
            })
        });

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

        const page = buildPageObject();

        await fetch("http://127.0.0.1:8787/save-post-page", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(page)
        });

        await fetch("http://127.0.0.1:8787/save-post-page-style", {
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
            throw new Error("Style file save failed.");
        }

        statusMessage.textContent = "Post saved successfully.";
        updatePreview();

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Save failed. Check console and local server.";
    }
}

savePostBtn.addEventListener("click", savePost);
