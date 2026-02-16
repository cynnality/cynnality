// ==============================
// BASIC REFERENCES
// ==============================

const svg = document.getElementById("svg1");
const runtimeLayer = document.getElementById("board-runtime");

// ==============================
// INIT
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  mountFibaPiece();
});

// ==============================
// DEBUG CLICK LOGGER
// ==============================

function logPieceClick(event) {
  const piece = event.currentTarget;

  if (!piece) return;

  const pieceId = piece.id || piece.dataset.piece || "unknown-piece";

  console.log("Piece clicked:", pieceId);
}


// ==============================
// FIBA PIECE
// ==============================

function mountFibaPiece() {
  const slot = document.getElementById("fiba-org-slot");
  const template = document.getElementById("piece-fiba-org");

  if (!slot || !template) return;

  const piece = template.cloneNode(true);
  piece.removeAttribute("id");
  piece.classList.remove("is-flipped");

  runtimeLayer.appendChild(piece);

  placeElementInSlot(piece, slot, { center: true });

  // 👇 ADD THIS LINE HERE
  piece.addEventListener("click", logPieceClick);

  piece.addEventListener("click", () => {
    piece.classList.toggle("is-flipped");

    if (piece.classList.contains("is-flipped")) {
      showWorldCup();
    } else {
      hideWorldCup();
    }
  });
}

// ==============================
// WORLD CUP
// ==============================

let worldCupInstance = null;

function showWorldCup() {
  if (worldCupInstance) return;

  const template = document.getElementById("world-cup-piece");
  if (!template) return;

  worldCupInstance = template.cloneNode(true);
  worldCupInstance.removeAttribute("id");

  // 👇 ADD THIS LINE
  worldCupInstance.dataset.piece = "world-cup-piece";

  runtimeLayer.appendChild(worldCupInstance);

  worldCupInstance.addEventListener("click", logPieceClick);

  worldCupInstance.addEventListener("click", () => {
    showDescription("world-cup-piece");
  });
}

function hideWorldCup() {
  if (!worldCupInstance) return;

  worldCupInstance.remove();
  worldCupInstance = null;
}

// ==============================
// POSITIONING
// ==============================

function placeElementInSlot(element, slot, options = {}) {
  const { center = false } = options;

  const elementBox = element.getBBox();
  const slotBox = slot.getBBox();

  let dx = slotBox.x - elementBox.x;
  let dy = slotBox.y - elementBox.y;

  if (center) {
    dx += (slotBox.width - elementBox.width) / 2;
    dy += (slotBox.height - elementBox.height) / 2;
  }

  element.setAttribute(
    "transform",
    `translate(${dx}, ${dy})`
  );
}
