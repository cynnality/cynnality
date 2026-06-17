const API_BASE = "https://post-office-api.yesandcynn.workers.dev";

const titleInput = document.getElementById("letterTitleInput");
const descriptionInput = document.getElementById("letterDescriptionInput");
const contentInput = document.getElementById("letterContentInput");
const sendLetterBtn = document.getElementById("sendLetterBtn");
const statusMessage = document.getElementById("statusMessage");

sendLetterBtn.addEventListener("click", sendLetter);

// =====================================================================
// POPUP SYSTEM
// =====================================================================

function closeAllPopups() {
    document.querySelectorAll(".tooltip-popup").forEach(popup => {
        popup.classList.add("hidden");
    });
}

document.querySelectorAll(".info-icon").forEach(button => {
    button.addEventListener("click", () => {
        const popupId = button.dataset.popup;
        const popup = document.getElementById(popupId);

        if (!popup) return;

        // makes only 1 popup open at a time
        closeAllPopups();
        popup.classList.remove("hidden");
    });
});

document.querySelectorAll(".close-pop").forEach(button => {
    button.addEventListener("click", () => {
        const popup = button.closest(".tooltip-popup");

        if (!popup) return;

        popup.classList.add("hidden");
    });
});

async function sendLetter() {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        statusMessage.textContent = "Please add a title and letter content before sending.";
        return;
    }

    sendLetterBtn.disabled = true;
    statusMessage.textContent = "Sending letter...";

    try {
        const response = await fetch(`${API_BASE}/send-letter`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description,
                content
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                data.arena?.title ||
                data.arenaResponse?.title ||
                JSON.stringify(data)
            );
        }

        statusMessage.textContent = "Letter sent successfully.";

        titleInput.value = "";
        descriptionInput.value = "";
        contentInput.value = "";
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    } finally {
        sendLetterBtn.disabled = false;
    }
}