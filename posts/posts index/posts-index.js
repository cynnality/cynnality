const DATA_PATHS = {
    posts: "../post data/posts_data.json"
};

const ADD_POST_TOOL_PATH =
    "../add post/add-post-tool.html";

let POSTS = [];

const searchInput = document.getElementById("searchInput");
const pageFilter = document.getElementById("pageFilter");
const statusFilter = document.getElementById("statusFilter");

const postsList = document.getElementById("postsList");

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
    try {
        const response = await fetch(`../../${path}`);
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

function populatePageFilter() {
    const pages = [...new Set(POSTS.map(post => post.page).filter(Boolean))]
        .sort();

    pages.forEach(page => {
        const option = document.createElement("option");
        option.value = page;
        option.textContent = page;
        pageFilter.appendChild(option);
    });
}

function getFilteredPosts() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const selectedPage = pageFilter.value;
    const selectedStatus = statusFilter.value;

    return POSTS.filter(post => {
        const title = post.title || "";
        const page = post.page || "";
        const status = post.status || "";
        const tags = post.tags || [];

        const matchesSearch =
            !searchValue ||
            title.toLowerCase().includes(searchValue) ||
            page.toLowerCase().includes(searchValue) ||
            tags.some(tag => tag.toLowerCase().includes(searchValue));

        const matchesPage =
            !selectedPage || page === selectedPage;

        const matchesStatus =
            !selectedStatus || status === selectedStatus;

        return matchesSearch && matchesPage && matchesStatus;
    });
}

function buildEditPostUrl(post) {
    const params = new URLSearchParams();
    params.set("postId", post.postId);

    return `${ADD_POST_TOOL_PATH}?${params.toString()}`;
}

function renderPosts() {
    const posts = getFilteredPosts();

    postsList.innerHTML = "";

    if (!posts.length) {
        postsList.innerHTML = `<p>No posts found.</p>`;
        return;
    }

    posts.forEach(post => {
        const card = document.createElement("article");
        card.className = "post-card";

        const tags = post.tags || [];

        card.innerHTML = `
            <div class="post-card-title">${post.title || "Untitled Post"}</div>

            <div class="post-card-meta">
                ${post.page || "no-page"} · ${post.status || "draft"} · ${post.updatedAt || ""}
            </div>

            <div class="post-card-tags">
                ${tags.map(tag => `<span class="post-tag">${tag}</span>`).join("")}
            </div>

            <div class="post-card-actions">
                <button class="edit-post-btn" type="button">Edit Post</button>
            </div>
        `;

        const editBtn = card.querySelector(".edit-post-btn");

        editBtn.addEventListener("click", event => {
            event.stopPropagation();
            window.location.href = buildEditPostUrl(post);
        });

        card.addEventListener("click", () => {
            openPost(post);
        });

        postsList.appendChild(card);
    });
}

async function openPost(post) {
    readerPanel.classList.remove("hidden");

    readerMeta.textContent =
        `${post.page || "no-page"} · ${post.status || "draft"}`;

    readerTitle.textContent =
        post.title || "Untitled Post";

    const content = await loadText(post.contentFile);
    const css = await loadText(post.styleFile);

    readerStyle.textContent = css;

    readerContent.innerHTML = content
        ? renderSimpleMarkdown(content)
        : `<p>No content found.</p>`;
}

closeReaderBtn.addEventListener("click", () => {
    readerPanel.classList.add("hidden");
});

[searchInput, pageFilter, statusFilter].forEach(input => {
    input.addEventListener("input", renderPosts);
});

async function init() {
    const postsData = await loadJson(DATA_PATHS.posts, { posts: {} });

    console.log("postsData loaded:", postsData);

    POSTS = Object.values(postsData.posts || {})
        .sort((a, b) => {
            return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        });

    populatePageFilter();
    renderPosts();
}

init();