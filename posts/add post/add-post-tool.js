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

pageSelect.addEventListener("input", updatePreview);
newPageInput.addEventListener("input", updatePreview);

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

        await fetch("http://localhost:8787/save-post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(post)
        });

        await fetch("http://localhost:8787/save-post-content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentFile: post.contentFile,
                content: contentInput.value
            })
        });

        await fetch("http://localhost:8787/save-post-style", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                styleFile: post.styleFile,
                css: styleInput.value
            })
        });

        statusMessage.textContent = "Post saved successfully.";
        updatePreview();

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Save failed. Check console and local server.";
    }
}

savePostBtn.addEventListener("click", savePost);


// ======================================================
// INITIAL PREVIEW
// ======================================================

updatePreview();