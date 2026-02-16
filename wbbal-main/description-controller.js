// =======================================
// DESCRIPTION CONTROLLER (HTML VERSION)
// =======================================

const titleElement = document.getElementById("description-title");
const bodyElement = document.getElementById("description-body");

function showDescription(key) {
  if (!DESCRIPTION_DATA[key]) return;

  const { title, body } = DESCRIPTION_DATA[key];

  titleElement.textContent = title;
  bodyElement.textContent = body;
}

function clearDescription() {
  titleElement.textContent = "";
  bodyElement.textContent = "";
}

