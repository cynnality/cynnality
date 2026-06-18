const board = document.getElementById("homeBoard");
const reopenTray = document.getElementById("reopenTray");

let highestZIndex = 10;
let activeDrag = null;

function bringPaneForward(pane) {
    highestZIndex += 1;
    pane.style.zIndex = highestZIndex;
}

function createReopenButton(pane) {
    const paneId = pane.dataset.paneId;
    const paneTitle = pane.dataset.paneTitle || paneId;

    if (!paneId || reopenTray.querySelector(`[data-reopen-pane="${paneId}"]`)) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "reopen-button";
    button.dataset.reopenPane = paneId;
    button.textContent = `+ ${paneTitle}`;

    button.addEventListener("click", () => {
        pane.hidden = false;
        button.remove();
        bringPaneForward(pane);
    });

    reopenTray.appendChild(button);
}

function closePane(pane) {
    pane.hidden = true;
    createReopenButton(pane);
}

function minimizePane(pane, button) {
    const isMinimized = pane.classList.toggle("is-minimized");

    button.textContent = isMinimized ? "+" : "−";
    button.setAttribute(
        "aria-label",
        isMinimized ? "Expand pane" : "Minimize pane"
    );
}

function startDrag(event, pane) {
    if (event.button !== 0) return;

    const target = event.target;

    if (target.closest("button, a, input, textarea, select")) {
        return;
    }

    const paneRect = pane.getBoundingClientRect();

    activeDrag = {
        pane,
        offsetX: event.pageX - (pane.offsetLeft || paneRect.left + window.scrollX),
        offsetY: event.pageY - (pane.offsetTop || paneRect.top + window.scrollY)
    };

    pane.classList.add("is-dragging");
    bringPaneForward(pane);

    event.preventDefault();
}

function moveActivePane(event) {
    if (!activeDrag) return;

    const { pane, offsetX, offsetY } = activeDrag;

    const nextLeft = Math.max(0, event.pageX - offsetX);
    const nextTop = Math.max(0, event.pageY - offsetY);

    pane.style.left = `${nextLeft}px`;
    pane.style.top = `${nextTop}px`;
}

function stopDrag() {
    if (!activeDrag) return;

    activeDrag.pane.classList.remove("is-dragging");
    activeDrag = null;
}

function setupPane(pane) {
    bringPaneForward(pane);

    const dragHandle = pane.querySelector("[data-drag-handle]");
    const closeButton = pane.querySelector(".pane-close");
    const minimizeButton = pane.querySelector(".pane-minimize-btn");

    if (dragHandle) {
        dragHandle.addEventListener("mousedown", event => {
            startDrag(event, pane);
        });
    }

    pane.addEventListener("mousedown", () => {
        bringPaneForward(pane);
    });

    if (closeButton && pane.dataset.closable === "true") {
        closeButton.addEventListener("click", event => {
            event.stopPropagation();
            closePane(pane);
        });
    }

    if (minimizeButton && pane.dataset.minimizable === "true") {
        minimizeButton.addEventListener("click", event => {
            event.stopPropagation();
            minimizePane(pane, minimizeButton);
        });
    }
}

function initPanes() {
    document.querySelectorAll(".pane").forEach(setupPane);
}

window.addEventListener("mousemove", moveActivePane);
window.addEventListener("mouseup", stopDrag);

initPanes();