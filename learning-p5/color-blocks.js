let sqSharp, sqRound, sqOblong;
let boxes, smallBoxes, bigBoxes;
let dots, ansDots;

const N = 14;          // number of dots/ansDots
const SPACING = 100;    // pixels between neighbors

let started = false;
let sortBeforeStart = false;

let redUntil = 0;           // timestamp in millis when red warning ends
const RED_MS = 1500;        // 1.5 seconds

let baseDotLayer = 100;  // any number you like
let zCounter = 0;        // increases each time a dot is released

let slots = [];          // [{x,y}, ...] length N
let slotOfDot = new Map(); // dot -> slotIndex
let dotAtSlot = new Array(N).fill(null); // index -> dot or null

let matchNow = []; // at top-level

let PALETTES = null;   // will be filled from palettes.json

function applyPalette(palette) {
  if (!palette || !Array.isArray(palette) || !palette.length || !dots || !ansDots) {
    console.warn('applyPalette skipped: invalid palette or groups not ready', palette);
    return;
  }
  const count = Math.min(N, dots.length || 0, ansDots.length || 0);
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    dots[i].color = c;
    dots[i].originalColor = c;
    ansDots[i].originalStroke = c;
    ansDots[i].stroke = 'white';
    ansDots[i].strokeWeight = 3;
    ansDots[i].color = 'transparent';
  }
}

let BOX_COLOR_STREAM = [];
let boxColorIdx = 0;

function nextBoxColor() {
  if (!BOX_COLOR_STREAM.length) return '#000000'; // fallback
  const c = BOX_COLOR_STREAM[boxColorIdx];
  boxColorIdx = (boxColorIdx + 1) % BOX_COLOR_STREAM.length;
  return c;
}


let lastCheckStatus = null; // 'correct' | 'wrong' | null

function resetFeedbackUI() {
  // reset button texts/colors
  sqSharp.text  = sqSharp.originalText;
  sqSharp.currentColor = sqSharp.originalColor;

  sqRound.text  = sqRound.originalText;
  sqRound.currentColor = sqRound.originalColor;

  sqOblong.text = sqOblong.originalText;
  sqOblong.currentColor = sqOblong.originalColor;

  // reset any ansDot stroke coloring back to baseline (white)
  for (const a of ansDots) {
    a.stroke = 'white';
  }
}

// compute a centered startX so the row spans the canvas without magic offsets
function centeredStartX(count, spacing) {
  return (width - (count - 1) * spacing) / 2;
}

function keepInView(dot) {
  const r = dot.diameter ? dot.diameter / 2 : Math.max(dot.w, dot.h) / 2;
  dot.x = constrain(dot.x, r, width  - r);
  dot.y = constrain(dot.y, r, height - r);
}

function shuffleDots() {
  const order = [...dots];
  shuffle(order, true);

  // 1) clear maps first (prevents any stale duplicates)
  slotOfDot.clear();
  dotAtSlot.fill(null);

  // 2) place and rebuild maps in one pass
  for (let i = 0; i < order.length; i++) {
    const d = order[i];
    const s = slots[i];

    d.x = s.x;
    d.y = s.y;

    dotAtSlot[i] = d;
    slotOfDot.set(d, i);
  }
}

function checkSortedNow() {
  // we rely on what draw() computed THIS frame
  if (!matchNow || matchNow.length !== ansDots.length) return false;
  return matchNow.every(Boolean);
}

function buildSlots() {
  slots = [];
  const startX = centeredStartX(N, SPACING);
  const rowY = dots ? dots.y : 400;
  for (let i = 0; i < N; i++) slots.push({ x: startX + i * SPACING, y: rowY });
}

function initSlotAssignments() {
  for (let i = 0; i < N; i++) {
    const d = dots[i], s = slots[i];
    d.x = s.x; d.y = s.y;
    slotOfDot.set(d, i);
    dotAtSlot[i] = d;
  }
}

function nearestSlotIndex(px, py) {
  let best = 0, bestD2 = Infinity;
  for (let i = 0; i < slots.length; i++) {
    const dx = px - slots[i].x, dy = py - slots[i].y;
    const d2 = dx*dx + dy*dy;
    if (d2 < bestD2) { bestD2 = d2; best = i; }
  }
  return best;
}

function snapDotToSlot(dot, slotIndex) {
  const t = slots[slotIndex];
  dot.x = t.x;
  dot.y = t.y;
  dot.velocity.x = 0;
  dot.velocity.y = 0;
}

function onDotReleased(dot) {
  const toIdx = nearestSlotIndex(dot.x, dot.y);
  const occupant = dotAtSlot[toIdx];
  const fromIdx = slotOfDot.get(dot);

  if (!occupant || occupant === dot) {
    if (fromIdx !== toIdx) {
      if (fromIdx != null) dotAtSlot[fromIdx] = null;
      dotAtSlot[toIdx] = dot;
      slotOfDot.set(dot, toIdx);
    }
    snapDotToSlot(dot, toIdx);
    return;
  }

  // robust swap: use occupant's true index from the map
  const occIdx = slotOfDot.get(occupant);
  if (occIdx == null) {
    // if somehow missing, just evict occupant back to its nearest slot
    const fallback = nearestSlotIndex(occupant.x, occupant.y);
    snapDotToSlot(occupant, fallback);
    dotAtSlot[fallback] = occupant;
    slotOfDot.set(occupant, fallback);
  }

  // swap between fromIdx and toIdx (only if fromIdx is valid)
  if (fromIdx != null) {
    snapDotToSlot(dot, toIdx);
    snapDotToSlot(occupant, fromIdx);

    dotAtSlot[toIdx]   = dot;
    dotAtSlot[fromIdx] = occupant;

    slotOfDot.set(dot, toIdx);
    slotOfDot.set(occupant, fromIdx);
  } else {
    // if fromIdx is missing (shouldn't happen after the Shift fix),
    // treat as simple move: vacate toIdx, place dot there, and re-place occupant at its own occIdx
    snapDotToSlot(dot, toIdx);
    dotAtSlot[toIdx] = dot;
    slotOfDot.set(dot, toIdx);

    const occIdx2 = slotOfDot.get(occupant);
    snapDotToSlot(occupant, occIdx2);
    dotAtSlot[occIdx2] = occupant;
  }
}

 // ===================CANVAS SETUP====================CANVAS SETUP===============CANVAS SETUP=======================
 async function setup() {
  new Canvas(1400, 700);
  world.gravity.y = 10;

  // --- load palettes.json (q5 needs async/await) ---
    try {
      const res = await fetch('palettes.json');
      PALETTES = await res.json();

      // Defensive normalization in case it ever comes in as an object-like
      if (!Array.isArray(PALETTES)) PALETTES = Object.values(PALETTES);

      // Optional hardening to avoid accidental mutation
      PALETTES = PALETTES.map(p => Object.freeze([...p]));
      Object.freeze(PALETTES);

    } catch (e) {
      console.error('Failed to load palettes.json', e);
      PALETTES = []; // fail-safe so the rest of the sketch still runs
    }

  // Build one long list of colors that cycles through all palettes then wraps
    if (PALETTES && PALETTES.length) {
      BOX_COLOR_STREAM = PALETTES.flat().slice(); // preserve order across palettes
      boxColorIdx = 0; // start from the very first color
    } else {
      BOX_COLOR_STREAM = [];
    }

 
  // boxes groups
    boxes = new Group();
    boxes.strokeWeight = 1;
    smallBoxes = new boxes.Group();
    smallBoxes.diameter = 20;
    smallBoxes.rotationSpeed = 13;
    smallBoxes.mass = 2;
    bigBoxes = new boxes.Group();
    bigBoxes.w = 70;
    bigBoxes.h = 50;
    bigBoxes.mass = 0.8;
    bigBoxes.bounciness = 0.5;
  // boxes group end
  
  // GRADIENT DOTS AND ANS DOTS
    // setting up ansDots group
      ansDots = new Group();
      ansDots.gravityScale = 0;
      //ansDots.textColor = "white";
      //ansDots.text = (i) => i;
      ansDots.w  = 80;
      ansDots.h = 300;
      //ansDots.shape = 'chain';

      ansDots.y = 400;
      ansDots.x = (i) => centeredStartX(N, SPACING) + i * SPACING;

      for (let i = 0; i < N; i++) new ansDots.Sprite();

    // setting up the gradient dots group
      dots = new Group();
      dots.gravityScale = 0;
      //dots.textColor = "white";
      //dots.text = (i) => i;
      dots.w  = 100;
      dots.h = 600;

      dots.y = 400;
      dots.x = (i) => centeredStartX(N, SPACING) + i * SPACING;
      dots.collider = 'kinematic';

      // giving styles to the individual dots within group
      for (let i = 0; i < N; i++) {
        const dot = new dots.Sprite();
        dot.layer = baseDotLayer;   // all dots start equal
        dot.stroke = "0";
        //dot.rotationSpeed = 10; // commenting out rotation speed until i mess around with gravity a bit more
    }
  // end of GRADIENT DOTS AND ANS DOTS

  // handling interacting, overlaps, and physics
    boxes.collides(dots);
    dots.overlaps(dots);
    dots.physics = KINEMATIC;
    dots.overlaps(ansDots);
    boxes.overlaps(ansDots);
    ansDots.overlaps(ansDots);
  // end of handling interacting, overlaps, and physics

  buildSlots();
  initSlotAssignments();

  const count = Math.min(N, dots.length, ansDots.length);

  // assigning ids to each dot and ansDot
    for (let i = 0; i < dots.length; i++) dots[i].id = i;
    for (let j = 0; j < ansDots.length; j++) ansDots[j].id = j;

  // ============SQUARES ====== BUTTONS ======= SHAPES ============
    // sharp square -- start/shuffle button
      sqSharp = new Sprite(250, 50, 100, 60);
      sqSharp.originalColor = '#5C00FF';
      sqSharp.currentColor = sqSharp.originalColor;
      sqSharp.textSize = 30;
      sqSharp.textColor = "#FFFFFF";
      sqSharp.text = "start";
      sqSharp.originalText = sqSharp.text;
      sqSharp.physics = STATIC;
      sqSharp.draw = () => {
        fill(sqSharp.currentColor);
        noStroke();
        textStyle(BOLD);
        rectMode(CENTER);
        rect(0, 0, sqSharp.w, sqSharp.h, 5);
      };

    // rounded square -- gr button
      sqRound = new Sprite(100, 50, 160, 60, 10);
      sqRound.originalColor = "#000000ff";
      sqRound.currentColor = sqRound.originalColor;
      sqRound.textSize = 30;
      sqRound.text = "grade!";
      sqRound.originalText = sqRound.text;
      sqRound.textColor = "#000000";
      sqRound.physics = STATIC;
      sqRound.draw = () => {
        noFill();
        stroke(sqRound.currentColor);
        strokeWeight(10);
        textStyle(BOLDITALIC);
        rectMode(CENTER);
        rect(0, 0, sqRound.w, sqRound.h, 10);
      };

    // oblong square -- check button
      sqOblong = new Sprite(360, 50, 80, 40);
      sqOblong.originalColor = "#4CAF50";
      sqOblong.currentColor = sqOblong.originalColor;
      sqOblong.textSize = 20;
      sqOblong.textColor = "#FFFFFF";
      sqOblong.text = "check";
      sqOblong.originalText = sqOblong.text;
      sqOblong.physics = STATIC;
      sqOblong.draw = () => {
        fill(sqOblong.currentColor);
        noStroke();
        textStyle(ITALIC);
        rectMode(CENTER);
        rect(0, 0, sqOblong.w, sqOblong.h, 10, 20, 5, 15);
      };
    // =====END=======SQUARES ====== BUTTONS ======= SHAPES ============

  //prints all id's of dots and ansDots in console (to confirm assignment worked)
    for (let i = 0; i < dots.length; i++) print("dot " + i + " id:", dots[i].id);
    for (let j = 0; j < ansDots.length; j++) print("ansDot " + j + " id:", ansDots[j].id);
  
  // apply a random palette at start
    if (PALETTES.length) {
      applyPalette(PALETTES[Math.floor(Math.random() * PALETTES.length)]);
    }
}

// ===================CANVAS UPDATE====================CANVAS UPDATE===============CANVAS UPDATE=======================
function update() {
  clear();

  mouse.cursor = 'default';
  background("#FFE499");

    // ----- if game not started, watch for dot press/drag and trigger shake
  if (!started) {
    let preStartTouchingDot = false;

    for (const dot of dots) {
      if (dot.mouse.pressing() || dot.mouse.dragging()) {
        preStartTouchingDot = true;
        redUntil = millis() + RED_MS;
      }
    }
    if (preStartTouchingDot) {
      if (!sortBeforeStart) print("Hint: Press START before sorting!");
      sortBeforeStart = true;
    }
  }

  let mouseOverDot = false;

  // ---------- sqSharp: Start / Shuffle ----------
  if (millis() < redUntil && !started) {
    // red wins during the timed warning (only before the game starts)
    sqSharp.currentColor = "red";
  } else if (sqSharp.mouse.pressing()) {
    mouseOverDot = true;
    sqSharp.currentColor = '#7D3CFF'; // hover feedback
  } else {
    sqSharp.currentColor = sqSharp.originalColor;
  }

  if (sqSharp.mouse.pressed()) {
    started = true;
    sortBeforeStart = false;
    redUntil = 0;

    resetFeedbackUI();   
    lastCheckStatus = null; 

    if (PALETTES && PALETTES.length) {
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      applyPalette(palette);
    } else {
      console.warn('Palettes not loaded; skipping applyPalette.');
    }

    shuffleDots();
    print("Game started: dots shuffled with new palette!");
  }

    // ---------- sqOblong: Check ----------
  if (sqOblong.mouse.pressing()) {
    sqOblong.currentColor = '#5EDC7A';
    mouseOverDot = true;
  } else {
    sqOblong.currentColor = sqOblong.originalColor;
  }

  if (sqOblong.mouse.pressed()) {
    const ok = checkSortedNow();
    print(ok ? "✅ Sorted correctly!" : "❌ Not sorted yet.");
    // Optional: show a quick UI hint via sqRound text/color
    sqRound.text = ok ? "Correct!" : "Try again";
    sqRound.currentColor = ok ? "#4CAF50" : "#E91E3A";

    lastCheckStatus = ok ? "correct" : "wrong";
  }

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];

    // makes sure that moouse pressing on a dot doesn't make a small/big box spawn
    if (dot.mouse.pressing()) mouseOverDot = true;

    //if the last check was wrong, the next dot touch resets feedback ---
    if (lastCheckStatus === 'wrong' && (dot.mouse.pressing() || dot.mouse.dragging())) {
      resetFeedbackUI();
      lastCheckStatus = null;
    }

    if (started) {
      if (dot.mouse.pressing()) {
        dot.stroke = 'white';
        dot.strokeWeight = 2;
      } else {
        dot.stroke = dot.originalColor;
      }

      if (dot.mouse.dragging()) {
        dot.moveTowards(mouse.x + dot.mouse.x, mouse.y + dot.mouse.y, 1);
        dot.layer = baseDotLayer + zCounter + 0.5;
      }
      if (dot.mouse.released()) {
        onDotReleased(dot);
        zCounter += 1;
        dot.layer = baseDotLayer + zCounter;
      }
      } else {
        // pre-start: keep dots visually neutral
        dot.stroke = dot.originalColor;
      }
  }

  if (!mouseOverDot) {
    if (mouse.presses("left")) {
      const s = new smallBoxes.Sprite(mouse.x, mouse.y);
      s.color = nextBoxColor();
      // optional: s.stroke = '0'; s.strokeWeight = 1;
    }
    if (mouse.presses("right")) {
      const b = new bigBoxes.Sprite(mouse.x, mouse.y);
      b.color = nextBoxColor();
      // optional: b.stroke = '0'; b.strokeWeight = 1;
    }
  }

  smallBoxes.applyTorque(1);

  for (const dot of dots) {
    // if you accumulate velocity elsewhere, zero it when not dragging:
    if (!dot.mouse.dragging()) { dot.velocity.x = 0; dot.velocity.y = 0; }
    keepInView(dot);
  }

   if (kb.presses(' ')) {
		boxes.deleteAll();
	}
}

function draw() {
  // reset strokes each frame (your existing code)
  for (const a of ansDots) a.stroke = 'white';

  // (re)build the per-frame truth table
  if (matchNow.length !== ansDots.length) matchNow = new Array(ansDots.length).fill(false);
  for (let i = 0; i < matchNow.length; i++) matchNow[i] = false;

  // highlight + mark correct pairs this frame
  dots.overlapping(ansDots, (dot, ansDot) => {
    const correct = (dot.id === ansDot.id);
    if (correct) matchNow[ansDot.id] = true;   // <-- record that THIS ansDot is correctly overlapped now
  });
}