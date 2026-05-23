/* ================================
   PUSHING APPLES - LOOK / UI

   This file handles:
   button clicks, screen updates, and visuals.

   The actual game rules live in logic.js.
================================ */


/* ================================
   DOM REFERENCES
================================ */

const worldElement = document.querySelector(".game-world");

const moneyDisplay = document.getElementById("moneyDisplay");
const appleStorageDisplay = document.getElementById("appleStorageDisplay");

const shakeTreeBtn = document.getElementById("shakeTreeBtn");
const buyJuiceFactoryBtn = document.getElementById("buyJuiceFactoryBtn");
const diversionSelect = document.getElementById("diversionSelect");

const factoryArea = document.getElementById("factoryArea");
const factoryInputBelt = document.getElementById("factoryInputBelt");
const factoryOutputBelt = document.getElementById("factoryOutputBelt");


/* ================================
   BUTTON / INPUT EVENTS
================================ */

shakeTreeBtn.addEventListener("click", () => {
  shakeAppleTree();
});

buyJuiceFactoryBtn.addEventListener("click", () => {
  buyMachine("appleJuiceFactory");
});

diversionSelect.addEventListener("change", () => {
  game.diversionRate = Number(diversionSelect.value);
});


/* ================================
   BASIC SCREEN UPDATES
================================ */

function renderMoney() {
  moneyDisplay.textContent = `$${game.money}`;
}

function renderStorage() {
  appleStorageDisplay.textContent = game.appleStorage;
}


/* ================================
   POSITION HELPERS
================================ */

function getItemPosition(item) {
  const route = ROUTES[item.routeId];

  if (!route || !route.points) {
    return { x: 0, y: 0 };
  }

  const points = route.points;
  const segmentCount = points.length - 1;

  const scaledProgress = item.progress * segmentCount;

  const segmentIndex = Math.min(
    Math.floor(scaledProgress),
    segmentCount - 1
  );

  const segmentProgress = scaledProgress - segmentIndex;

  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];

  const x = start.x + (end.x - start.x) * segmentProgress;
  const y = start.y + (end.y - start.y) * segmentProgress;

  return { x, y };
}


/* ================================
   ITEM RENDERING
================================ */

function renderItems() {
  document.querySelectorAll(".item").forEach(item => item.remove());

  game.items.forEach(item => {
    const product = PRODUCTS[item.productId];
    const position = getItemPosition(item);

    const itemElement = document.createElement("div");

    itemElement.classList.add("item");
    itemElement.textContent = product.emoji;

    itemElement.style.left = `${position.x}px`;
    itemElement.style.top = `${position.y}px`;

    worldElement.appendChild(itemElement);
  });
}


/* ================================
   MACHINE / BELT RENDERING
================================ */

function renderMachines() {
  factoryArea.innerHTML = "";

  const hasJuiceFactory = game.machines.some(machine => {
    return machine.machineId === "appleJuiceFactory";
  });

  if (hasJuiceFactory) {
    const machineElement = document.createElement("div");
    machineElement.classList.add("machine");
    machineElement.textContent = MACHINES.appleJuiceFactory.label;

    factoryArea.appendChild(machineElement);

    factoryInputBelt.classList.remove("hidden");
    factoryOutputBelt.classList.remove("hidden");
  } else {
    factoryInputBelt.classList.add("hidden");
    factoryOutputBelt.classList.add("hidden");
  }
}


/* ================================
   FULL RENDER
================================ */

function renderGame() {
  renderMoney();
  renderStorage();
  renderItems();
  renderMachines();
}


/* ================================
   GAME LOOP

   updateGame() changes the game state.
   renderGame() shows the updated state.
================================ */

function gameLoop(timestamp) {
  updateGame(timestamp);
  renderGame();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);