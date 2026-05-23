/* ================================
   PUSHING APPLES - LOGIC

   This file controls the game rules:
   money, storage, movement, machines, and selling.

   It does not directly create HTML elements.
================================ */


/* ================================
   GAME STATE

   This is the main object that keeps track of
   what is currently happening in the game.
================================ */

const game = {
  money: 0,

  appleStorage: 0,

  storageReleaseRate: 1200,
  lastStorageReleaseTime: 0,

  itemSpeed: 1.4,

  diversionRate: 0.5,
  diversionCounter: 0,

  items: [],
  machines: []
};


/* ================================
   ROUTE POSITIONS

   Each route is now made from points.
   This lets items move in straight sections,
   like up → right, instead of diagonal.
================================ */

const ROUTES = {
  mainBelt: {
    points: [
      { x: 190, y: 280 },
      { x: 790, y: 280 }
    ]
  },

  factoryInput: {
    points: [
      { x: 360, y: 280 }, // starts on main belt
      { x: 360, y: 160 }, // moves straight up
      { x: 455, y: 160 }  // then moves right into factory
    ]
  },

  factoryOutput: {
    points: [
      { x: 530, y: 160 }, // leaves factory to the right
      { x: 650, y: 160 },
      { x: 650, y: 280 }  // then moves down to main belt
    ]
  }
};


/* ================================
   TREE + STORAGE LOGIC
================================ */

// Clicking the tree adds apples to storage.
// The apples do not appear on the belt instantly.
function shakeAppleTree() {
  game.appleStorage += 1;
}

// Storage slowly sends apples out.
// If a factory exists, some apples can be diverted.
function releaseAppleFromStorage(timestamp) {
  const timeSinceLastRelease = timestamp - game.lastStorageReleaseTime;

  if (timeSinceLastRelease < game.storageReleaseRate) return;
  if (game.appleStorage <= 0) return;

  game.lastStorageReleaseTime = timestamp;
  game.appleStorage -= 1;

  const route = chooseAppleRoute();

  createItem("apple", route);
}

// Decides whether an apple goes straight to market
// or gets sent through the apple juice factory.
function chooseAppleRoute() {
  const hasJuiceFactory = game.machines.some(machine => {
    return machine.machineId === "appleJuiceFactory";
  });

  if (!hasJuiceFactory) {
    return "mainBelt";
  }

  if (game.diversionRate === 0) {
    return "mainBelt";
  }

  if (game.diversionRate === 1) {
    return "factoryInput";
  }

  // For 50%, every other apple goes to the factory.
  game.diversionCounter += 1;

  if (game.diversionCounter % 2 === 1) {
    return "factoryInput";
  }

  return "mainBelt";
}


/* ================================
   ITEM LOGIC
================================ */

// Creates a new moving item.
// progress starts at 0 and moves toward 1.
function createItem(productId, routeId) {
  const product = PRODUCTS[productId];

  game.items.push({
    id: crypto.randomUUID(),
    productId: product.id,
    value: product.value,
    routeId: routeId,
    progress: 0
  });
}

// Moves items along their current route.
function moveItems() {
  game.items.forEach(item => {
    item.progress += game.itemSpeed / 300;

    if (item.progress > 1) {
      item.progress = 1;
    }
  });
}


/* ================================
   FACTORY LOGIC
================================ */

// Buys and places a machine.
// For now, only one apple juice factory is allowed.
function buyMachine(machineId) {
  const machineDef = MACHINES[machineId];

  const alreadyOwnsMachine = game.machines.some(machine => {
    return machine.machineId === machineId;
  });

  if (alreadyOwnsMachine) return;

  if (game.money < machineDef.price) return;

  game.money -= machineDef.price;

  game.machines.push({
    machineId: machineDef.id
  });
}

// When an apple reaches the factory,
// it becomes apple juice and switches routes.
function processFactoryItems() {
  game.items.forEach(item => {
    if (item.routeId !== "factoryInput") return;
    if (item.progress < 1) return;

    const machineDef = MACHINES.appleJuiceFactory;
    const outputProduct = PRODUCTS[machineDef.output];

    item.productId = outputProduct.id;
    item.value = outputProduct.value;
    item.routeId = "factoryOutput";
    item.progress = 0;
  });
}


/* ================================
   MARKET / SELLING LOGIC
================================ */

// Items are sold when they reach the end of the main belt.
// Factory output items enter the main belt first.
function handleCompletedRoutes() {
  game.items.forEach(item => {
    if (item.routeId === "factoryOutput" && item.progress >= 1) {
      item.routeId = "mainBelt";
      item.progress = 0.78;
    }
  });

  game.items = game.items.filter(item => {
    const reachedMarket = item.routeId === "mainBelt" && item.progress >= 1;

    if (reachedMarket) {
      game.money += item.value;
      return false;
    }

    return true;
  });
}


/* ================================
   MAIN UPDATE FUNCTION

   This runs every frame from look.js.
================================ */

function updateGame(timestamp) {
  releaseAppleFromStorage(timestamp);
  moveItems();
  processFactoryItems();
  handleCompletedRoutes();
}