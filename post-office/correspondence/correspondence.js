const API_BASE = "https://post-office-api.yesandcynn.workers.dev";

const loadCorrespondenceBtn = document.getElementById("loadCorrespondenceBtn");
const statusMessage = document.getElementById("statusMessage");
const correspondenceList = document.getElementById("correspondenceList");

loadCorrespondenceBtn.addEventListener("click", loadCorrespondence);
window.addEventListener("DOMContentLoaded", loadCorrespondence);

async function loadCorrespondence() {
    statusMessage.textContent = "Loading correspondence...";
    correspondenceList.innerHTML = "";

    try {
        const response = await fetch(`${API_BASE}/correspondence`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Could not load correspondence.");
        }

        renderCorrespondence(data.correspondence);
        statusMessage.textContent = `Loaded ${data.correspondence.length} correspondence item(s).`;
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
}

function renderCorrespondence(items) {
    if (!items.length) {
        correspondenceList.innerHTML = `<p>No correspondence found.</p>`;
        return;
    }

    correspondenceList.innerHTML = items.map(item => {
        const title = getTitle(item);
        const createdAt = item.created_at || "";
        const blockId = item.id;
        const html = item.content?.html || "";

        return `
            <article class="correspondence-card">
                <h2>${escapeHtml(title)}</h2>
                <p class="correspondence-meta">Block ID: ${blockId} · ${escapeHtml(createdAt)}</p>
                <div class="correspondence-content">
                    ${html}
                </div>
            </article>
        `;
    }).join("");
}

function getTitle(item) {
    const plain = item.content?.plain || "";
    const firstLine = plain.split("\n").find(line => line.trim());

    return firstLine || `Correspondence ${item.id}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}