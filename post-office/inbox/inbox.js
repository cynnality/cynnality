const API_BASE = "http://localhost:8788";

const loadLettersBtn = document.getElementById("loadLettersBtn");
const statusMessage = document.getElementById("statusMessage");
const lettersList = document.getElementById("lettersList");

let currentLetters = [];

loadLettersBtn.addEventListener("click", loadLetters);
window.addEventListener("DOMContentLoaded", loadLetters);

async function loadLetters() {
    statusMessage.textContent = "Loading letters...";
    lettersList.innerHTML = "";

    try {
        const response = await fetch(`${API_BASE}/letters`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Could not load letters.");
        }

        currentLetters = data.letters;
        renderLetters(currentLetters);
        statusMessage.textContent = `Loaded ${data.letters.length} letter(s).`;
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
}

function renderLetters(letters) {
    if (!letters.length) {
        lettersList.innerHTML = `<p>No letters found.</p>`;
        return;
    }

    lettersList.innerHTML = letters.map(letter => {
        const title = getLetterTitle(letter);
        const createdAt = letter.created_at || "";
        const plain = letter.content?.plain || "";
        const blockId = letter.id;

        return `
            <article class="letter-card">
                <h2>${escapeHtml(title)}</h2>
                <p class="letter-meta">Block ID: ${blockId} · ${escapeHtml(createdAt)}</p>
                <div class="letter-preview">${escapeHtml(plain)}</div>

                <button type="button" onclick="openResponseEditor(${blockId})">
                    Open / Respond
                </button>

                <div id="responseEditor_${blockId}" class="response-editor hidden">
                    <h3>Write Response</h3>

                    <textarea
                        id="responseInput_${blockId}"
                        placeholder="Write your response here. Markdown is okay."
                    ></textarea>

                    <button type="button" onclick="sendResponse(${blockId})">
                        Save and Send Response
                    </button>

                    <p id="responseStatus_${blockId}" class="response-status"></p>
                </div>
            </article>
        `;
    }).join("");
}

function openResponseEditor(blockId) {
    const editor = document.getElementById(`responseEditor_${blockId}`);
    editor.classList.toggle("hidden");
}

async function sendResponse(blockId) {
    const letter = currentLetters.find(item => item.id === blockId);
    const responseInput = document.getElementById(`responseInput_${blockId}`);
    const responseStatus = document.getElementById(`responseStatus_${blockId}`);

    const responseContent = responseInput.value.trim();

    if (!responseContent) {
        responseStatus.textContent = "Please write a response before sending.";
        return;
    }

    responseStatus.textContent = "Sending response...";

    try {
        const response = await fetch(`${API_BASE}/send-response`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                letterId: letter.id,
                letterTitle: getLetterTitle(letter),
                letterContent: letter.content?.markdown || letter.content?.plain || "",
                responseContent
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                data.arena?.title ||
                JSON.stringify(data)
            );
        }

        responseStatus.textContent = "Response sent successfully.";
        responseInput.value = "";
    } catch (error) {
        responseStatus.textContent = `Error: ${error.message}`;
    }
}

function getLetterTitle(letter) {
    if (letter.title) {
        return letter.title;
    }

    const plain = letter.content?.plain || "";
    const firstLine = plain.split("\n").find(line => line.trim());

    return firstLine || `Letter ${letter.id}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}