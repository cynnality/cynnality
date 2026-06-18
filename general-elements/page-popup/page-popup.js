function closeAllPagePopups() {
    document.querySelectorAll(".page-popup").forEach(popup => {
        popup.classList.add("hidden");
    });
}

function openPagePopup(popupId) {
    closeAllPagePopups();

    const popup = document.getElementById(popupId);
    if (!popup) return;

    popup.classList.remove("hidden");
}

function closePagePopup(popup) {
    popup.classList.add("hidden");
}

document.querySelectorAll("[data-popup-open]").forEach(button => {
    button.addEventListener("click", () => {
        openPagePopup(button.dataset.popupOpen);
    });
});

document.querySelectorAll(".page-popup").forEach(popup => {
    const closeBtn = popup.querySelector(".page-popup-close");

    closeBtn?.addEventListener("click", () => {
        closePagePopup(popup);
    });

    popup.addEventListener("click", event => {
        if (event.target === popup) {
            closePagePopup(popup);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAllPagePopups();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const loadPopup = document.querySelector(".page-popup[data-show-on-load='true']");

    if (loadPopup) {
        loadPopup.classList.remove("hidden");
    }
});