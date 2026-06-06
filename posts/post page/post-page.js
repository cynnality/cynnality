const DATA_PATHS = {
    posts: "../post%20data/posts_data.json",
    pages: "../post%20data/pages_data.json"
};

let POSTS = [];
let PAGES_DATA = { pages: {} };
let ACTIVE_PAGE = "";

const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const pageStyle = document.getElementById("pageStyle");
const pagePostsList = document.getElementById("pagePostsList");

const readerPanel = document.getElementById("readerPanel");
const readerMeta = document.getElementById("readerMeta");
const readerTitle = document.getElementById("readerTitle");
const readerStyle = document.getElementById("readerStyle");
const readerContent = document.getElementById("readerContent");
const closeReaderBtn = document.getElementById("closeReaderBtn");

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
        if (!response.ok) return "";

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

function renderPageHeader() {
    const page = PAGES_DATA.pages?.[ACTIVE_PAGE];

    if (!page) {
        pageTitle.textContent = "Page not found";
        pageDescription.textContent = `No page record found for: ${ACTIVE_PAGE}`;
        return;
    }

    pageTitle.textContent = page.title || page.pageId;
    pageDescription.textContent = page.description || "";
    document.title = page.title || "Post Page";
}

function renderPosts() {
    const posts = POSTS.filter(post => post.page === ACTIVE_PAGE);

    pagePostsList.innerHTML = "";

    if (!posts.length) {
        pagePostsList.innerHTML = `<p>No posts found for this page.</p>`;
        return;
    }

    posts.forEach(post => {
        const card = document.createElement("article");
        card.className = "post-card";

        const tags = post.tags || [];

        card.innerHTML = `
            <div class="post-card-title">${post.title || "Untitled Post"}</div>
            <div class="post-card-meta">
                ${post.status || "draft"} · ${post.updatedAt || ""}
            </div>
            <div class="post-card-tags">
                ${tags.map(tag => `<span class="post-tag">${tag}</span>`).join("")}
            </div>
        `;

        card.addEventListener("click", () => {
            openPost(post);
        });

        pagePostsList.appendChild(card);
    });
}

async function openPost(post) {
    readerPanel.classList.remove("hidden");

    readerMeta.textContent =
        `${post.page || "no-page"} · ${post.status || "draft"}`;

    readerTitle.textContent =
        post.title || "Untitled Post";

    const page = PAGES_DATA.pages?.[post.page];

    const pageCss = await loadText(page?.styleFile);
    const postCss = await loadText(post.styleFile);
    const content = await loadText(post.contentFile);

    readerStyle.textContent = `${pageCss}\n\n${postCss}`;

    readerContent.innerHTML = content
        ? renderSimpleMarkdown(content)
        : `<p>No content found.</p>`;
}

closeReaderBtn.addEventListener("click", () => {
    readerPanel.classList.add("hidden");
});

async function init() {
    const params = new URLSearchParams(window.location.search);
    ACTIVE_PAGE = params.get("page") || "";

    const postsData = await loadJson(DATA_PATHS.posts, { posts: {} });
    PAGES_DATA = await loadJson(DATA_PATHS.pages, { pages: {} });

    POSTS = Object.values(postsData.posts || {})
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    renderPageHeader();

    const page = PAGES_DATA.pages?.[ACTIVE_PAGE];
    pageStyle.textContent = await loadText(page?.styleFile);

    renderPosts();
}

init();