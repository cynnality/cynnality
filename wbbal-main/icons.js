// ==============================
// BASIC REFERENCES
// ==============================

const icons = document.querySelectorAll(".icon");
const svg = document.querySelector("svg");

const orgsIcon = document.getElementById("orgs-icon");

// Entire FIBA cluster (card + boxes + lines + description)
const fibaCluster = document.getElementById("fiba-cluster");
const fibaOrg = document.getElementById("fiba-org");

// FIBA icon slot inside the card
const fibaIconContainer = document.getElementById("fiba-icon-container");

// Hide FIBA cluster on load
if (fibaCluster) {
  fibaCluster.classList.remove("is-active");
}

// ==============================
// ICON ACTIVE STATE HANDLING
// ==============================

icons.forEach(icon => {
  icon.addEventListener("click", () => {
    // Reset all icon active states
    icons.forEach(i => i.classList.remove("is-active"));
    icon.classList.add("is-active");

    console.log("Icon clicked:", icon.id);

    if (icon.id === "orgs-icon") {
      showFibaOrg();
    } else {
      hideFibaOrg();
    }
  });
});

// ==============================
// FIBA CLUSTER VISIBILITY
// ==============================

function showFibaOrg() {
  fibaCluster.classList.add("is-active");
  populateFibaIcon();
}

function hideFibaOrg() {
  fibaCluster.classList.remove("is-active");
  clearFibaIcon();
}

// ==============================
// ICON SLOT POPULATION
// ==============================

function populateFibaIcon() {
  if (!fibaIconContainer) return;

  // Remove any existing icon in the slot
  fibaIconContainer
    .querySelectorAll(".icon")
    .forEach(el => el.remove());

  // Clone the ORGs icon
  const clone = orgsIcon.cloneNode(true);

  // Strip ID + labels for reuse
  clone.removeAttribute("id");
  clone.classList.add("icon--no-labels");

  // Append first so getBBox() works correctly
  fibaIconContainer.appendChild(clone);

  // Position it properly inside the slot
  placeIconInSlot(clone, fibaIconContainer, {
    center: true
  });
}

function clearFibaIcon() {
  if (!fibaIconContainer) return;

  fibaIconContainer
    .querySelectorAll(".icon")
    .forEach(el => el.remove());
}

// ==============================
// GENERIC ICON SLOT PLACEMENT
// ==============================

function placeIconInSlot(icon, slot, options = {}) {
  const {
    scale = 1,
    center = false
  } = options;

  const iconBox = icon.getBBox();
  const slotBox = slot.getBBox();

  let dx = slotBox.x - iconBox.x;
  let dy = slotBox.y - iconBox.y;

  if (center) {
    dx += (slotBox.width - iconBox.width) / 2;
    dy += (slotBox.height - iconBox.height) / 2;
  }

  icon.setAttribute(
    "transform",
    `translate(${dx}, ${dy}) scale(${scale})`
  );
}
