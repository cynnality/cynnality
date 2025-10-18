/**************************************************************
 * Gradient Sorter — Canvas-only visuals + E-mode default + 3-step max zoom-in
 * - Canvas draws ONLY: board, overlays (peek/inspect), guides, diff outlines, drag ghost, queue blocks
 *   (No text on canvas; all text/status goes to your GUI HUD)
 * - Default mode: E (drag to move/swap)
 * - Zoom: [ / ] with a hard cap of 3 zoom-in steps from default
 * - Guides relocate correct tiles (no duplicates)
 **************************************************************/

/* ============ CONFIG ============ */
const ROWS = 10, COLS = 10;

// Start big; allow exactly 3 steps of zoom-in
let LENGTH = 72;          // large default (what you liked previously)
const ZOOM_STEP = 2;
const LENGTH_MIN = 24;
// Let the absolute hard max be exactly 3 steps above default
const LENGTH_MAX = LENGTH + 3 * ZOOM_STEP;

// We’ll track relative zoom-in steps from the default LENGTH
let zoomInStepsFromDefault = 0; // 0..3

// Base UI spacing below the board (for queue blocks area space)
const EXTRA_ROWS_BELOW = 3;
let lastQueueRows = 0;

/* ============ STATE ============ */
let originalRGB = [];
let gridRGB     = [];
let holes = new Set();   // Set("r,c")
let popQueue = [];       // FIFO [R,G,B]

let mode = 'E';          // DEFAULT MODE: Edit
let dragging = null;

let guideMode = 1;       // 0 off, 1 corners, 2 border
let lockedCells = new Set();

let peek = false;        // hold V for original
let inspect = false;     // toggle I categorical overlay
let showDiff = false;    // toggle D outlines

let themeIndex = 0;

/* ===== live perception controls (HUD sliders) ===== */
let SAT_SCALE = 1.00;     // 0.5 .. 1.8 (render-time saturation multiplier)
let VAL_GAMMA = 1.00;     // 0.6 .. 1.6 (render-time gamma for value)
let GEN_MIN_DELTA = 1.20; // brightness Δ per neighbor (generation-time)
let GEN_BANDS = 2;        // 1..4 column bands (generation-time)

// Wire sliders if present in the HUD HTML
function wireContrastPanel(){
  const slSat = document.getElementById('sl-sat');
  const slGam = document.getElementById('sl-gam');
  const slMin = document.getElementById('sl-mind');
  const slBan = document.getElementById('sl-bands');
  const lbSat = document.getElementById('lbl-sat');
  const lbGam = document.getElementById('lbl-gam');
  const lbMin = document.getElementById('lbl-mind');
  const lbBan = document.getElementById('lbl-bands');
  if (!slSat || !slGam || !slMin || !slBan) return;

  const upd = () => {
    SAT_SCALE    = parseFloat(slSat.value);
    VAL_GAMMA    = parseFloat(slGam.value);
    GEN_MIN_DELTA= parseFloat(slMin.value);
    GEN_BANDS    = parseInt(slBan.value,10);
    if (lbSat) lbSat.textContent = SAT_SCALE.toFixed(2);
    if (lbGam) lbGam.textContent = VAL_GAMMA.toFixed(2);
    if (lbMin) lbMin.textContent = GEN_MIN_DELTA.toFixed(2);
    if (lbBan) lbBan.textContent = GEN_BANDS.toString();
    redraw(); // render-only changes reflect immediately
  };
  slSat.oninput = upd; slGam.oninput = upd; slMin.oninput = upd; slBan.oninput = upd;
  upd();
}

/* ============ HUD (DOM only; no text on canvas) ============ */
let hudModeEl = null, hudGuideEl = null, hudQueueEl = null, hudStatusEl = null;
let hudInspectEl = null, hudDiffEl = null;

let statusMsg = '';
let statusColor = '#444';
const guideModeLabel = () => guideMode===0 ? 'Off' : guideMode===1 ? 'Corners (Hard)' : 'Border (Easy)';

function updateHUD(){
  if (!hudModeEl) return;
  hudModeEl.textContent   = mode;
  hudGuideEl.textContent  = guideModeLabel();
  hudQueueEl.textContent  = popQueue.length;
  hudStatusEl.textContent = statusMsg;
  if (hudInspectEl) hudInspectEl.textContent = inspect ? 'On' : 'Off';
  if (hudDiffEl)    hudDiffEl.textContent    = showDiff ? 'On' : 'Off';
}
function setStatus(msg, col='#444'){ statusMsg=msg; statusColor=col; updateHUD(); redraw(); }

/* ============ UTILS ============ */
const keyFor = (r,c)=>`${r},${c}`;
const rcFromKey = k => k.split(',').map(Number);
const inBounds = (r,c)=> r>=0 && r<ROWS && c>=0 && c<COLS;
const mouseRC = ()=> [Math.floor(mouseY / LENGTH), Math.floor(mouseX / LENGTH)];
const colorsEqual = (a,b)=> a[0]===b[0] && a[1]===b[1] && a[2]===b[2];
const deepCopyGridRGB = src => src.map(row=>row.map(rgb=>[rgb[0],rgb[1],rgb[2]]));

function shuffleGridInPlace(grid){
  const flat=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) flat.push(grid[r][c]);
  for(let i=flat.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=flat[i]; flat[i]=flat[j]; flat[j]=t; }
  let k=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) grid[r][c]=flat[k++];
}

/* ============ RGB/HSV helpers (render-time adjustments) ============ */
function rgbToHSV(r,g,b){
  const rn=r/255, gn=g/255, bn=b/255;
  const max=Math.max(rn,gn,bn), min=Math.min(rn,gn,bn), d=max-min;
  let h=0;
  if (d!==0){
    if (max===rn) h=60*(((gn-bn)/d)%6);
    else if (max===gn) h=60*(((bn-rn)/d)+2);
    else h=60*(((rn-gn)/d)+4);
    if (h<0) h+=360;
  }
  const s = max===0 ? 0 : (d/max)*100;
  const v = max*100;
  return [h,s,v];
}
function hsvToRGB(h,s,v){
  s/=100; v/=100;
  const c=v*s, x=c*(1-Math.abs(((h/60)%2)-1)), m=v-c;
  let rp=0,gp=0,bp=0;
  if (0<=h&&h<60){rp=c; gp=x;}
  else if (60<=h&&h<120){rp=x; gp=c;}
  else if (120<=h&&h<180){gp=c; bp=x;}
  else if (180<=h&&h<240){gp=x; bp=c;}
  else if (240<=h&&h<300){rp=x; bp=c;}
  else {rp=c; bp=x;}
  return [Math.round((rp+m)*255), Math.round((gp+m)*255), Math.round((bp+m)*255)];
}
function fillAdjusted(rgb){
  let [h,s,v] = rgbToHSV(rgb[0],rgb[1],rgb[2]);
  s = constrain(s * SAT_SCALE, 0, 100);
  v = Math.pow(v/100, VAL_GAMMA) * 100;
  const [rr,gg,bb] = hsvToRGB(h,s,v);
  fill(rr,gg,bb);
}

/* ============ Flow-safe gradients (generation-time) ============ */
function hueLerp(h1, h2, t){
  let d=(h2-h1)%360; if (d<-180) d+=360; else if (d>180) d-=360;
  return (h1 + d*t + 360) % 360;
}
function HSBtoRGBArr(h, s, b){
  colorMode(HSB,360,100,100,255);
  const c = color(h, s, b);
  colorMode(RGB,255,255,255,255);
  return [Math.round(red(c)), Math.round(green(c)), Math.round(blue(c))];
}
function jitter(r,c,amp){ const n = (r*131 + c*733) % 1000; return (n/1000 - 0.5) * 2 * amp; }

// In your precomputeFlowGradientHSB_strong(...):
function precomputeFlowGradientHSB_strong(rows, cols, topA, topB, botA, botB, minBrightStep, bands){
  const out = Array.from({length: rows}, ()=>Array(cols));

  // Read extras (or default)
  const extras = window.__flowExtras || {};
  const bandHueStep = extras.bandHueStep ?? 12;
  const warpMode    = extras.warpMode ?? null;

  const bandW = Math.max(1, Math.floor(cols / Math.max(1,bands)));
  const jitterAmp   = 0.35;

  for (let r=0; r<rows; r++){
    const vRow = rows===1 ? 0 : r/(rows-1);

    const baseL_h  = hueLerp(topA[0],  botA[0],  vRow);
    const baseR_h  = hueLerp(topB[0],  botB[0],  vRow);
    const baseL_s  = lerp(topA[1],     botA[1],  vRow);
    const baseR_s  = lerp(topB[1],     botB[1],  vRow);
    let   baseL_b  = lerp(topA[2],     botA[2],  vRow);
    let   baseR_b  = lerp(topB[2],     botB[2],  vRow);

    if (cols>1){
      const span = baseR_b - baseL_b;
      const wantSpan = Math.sign(span||1) * Math.max(Math.abs(span), minBrightStep * (cols-1));
      baseR_b = baseL_b + wantSpan;
    }

    for (let c=0; c<cols; c++){
      // Warp horizontal interpolation sometimes for variety
      const uRaw = cols===1 ? 0 : c/(cols-1);
      const u    = warpU(uRaw, warpMode);

      const bandIdx = Math.min(bands-1, Math.floor(c / bandW));
      const hL = (baseL_h + bandIdx*bandHueStep) % 360;
      const hR = (baseR_h - bandIdx*bandHueStep) % 360;

      let h = hueLerp(hL, hR, u);
      let s = lerp(baseL_s, baseR_s, u);
      let b = lerp(baseL_b, baseR_b, u);

      b += jitter(r,c,jitterAmp);

      if (c>0){
        const bp = rgbToHSV(...out[r][c-1])[2];
        if (Math.abs(b - bp) < minBrightStep){
          b += Math.sign(b - bp || 1) * (minBrightStep - Math.abs(b - bp));
        }
      }
      if (r>0){
        const upv = rgbToHSV(...out[r-1][c])[2];
        if (Math.abs(b - upv) < minBrightStep){
          b += Math.sign(b - upv || 1) * (minBrightStep - Math.abs(b - upv));
        }
      }

      s = constrain(s, 0, 100);
      b = constrain(b, 1, 99);
      out[r][c] = HSBtoRGBArr(h, s, b);
    }
  }
  return out;
}


/* ================================================
 * VARIATION RECIPES for flow themes
 * - Each recipe defines ranges for: span, offset,
 *   saturation/brightness envelopes, bands, band hue step, minBrightStep,
 *   and optional horizontal warp (u → pow/curve).
 * - We keep the same gradient engine—just feed broader random params.
 * ================================================ */

// Helper: pick number within [min,max]
const R = (min, max) => min + Math.random() * (max - min);
// Helper: pick one of array
const R1 = arr => arr[Math.floor(Math.random() * arr.length)];

const FLOW_RECIPES = [
  {
    name: 'Wide Panorama',
    span: [140, 200],          // very wide hue travel
    offset: [-35, 35],         // top↔bottom hue shift
    topS:   [65, 85], topB: [78, 96],
    botS:   [55, 80], botB: [55, 78],
    bands:  [1, 3],            // 1–3 bands
    bandHueStep: [8, 16],      // per-band hue delta
    minBrightStep: [1.0, 1.6], // neighboring Δ in brightness
    warpU: R1([null, 'ease', 'power']) // horizontal interpolation style
  },
  {
    name: 'Contrasty Columns',
    span: [100, 150],
    offset: [-50, 50],
    topS:   [70, 95], topB: [80, 100],
    botS:   [60, 90], botB: [60, 85],
    bands:  [2, 4],           // more column contrast
    bandHueStep: [10, 18],
    minBrightStep: [1.2, 1.8],
    warpU: 'power'            // stronger shape
  },
  {
    name: 'Soft Drift',
    span: [90, 130],
    offset: [-25, 25],
    topS:   [55, 75], topB: [82, 95],
    botS:   [50, 70], botB: [60, 80],
    bands:  [1, 2],
    bandHueStep: [6, 12],
    minBrightStep: [0.9, 1.3],
    warpU: 'ease'
  },
  {
    name: 'Aurora Sweep',
    span: [120, 160],
    offset: [-40, 20],
    topS:   [60, 85], topB: [85, 100],
    botS:   [55, 80], botB: [60, 85],
    bands:  [2, 3],
    bandHueStep: [10, 16],
    minBrightStep: [1.1, 1.5],
    warpU: R1([null, 'ease'])
  },
  {
    name: 'Neo Pastels',
    span: [110, 170],
    offset: [-30, 30],
    topS:   [35, 65], topB: [85, 98],
    botS:   [30, 60], botB: [65, 85],
    bands:  [1, 3],
    bandHueStep: [6, 12],
    minBrightStep: [1.0, 1.4],
    warpU: 'power'
  }
];

// Optional: simple warps for horizontal interpolation feel
function warpU(u, mode){
  if (!mode) return u;
  if (mode === 'ease'){
    // Smoothstep-ish: u^2 * (3 - 2u)
    return u*u*(3 - 2*u);
  }
  if (mode === 'power'){
    // Slight S-curve via cubic mix
    const a = 0.65; // tweakable shape
    return Math.pow(u, a);
  }
  return u;
}

// Replace your existing generateFlowTheme() with this:
function generateFlowTheme(){
  const recipe = R1(FLOW_RECIPES);

  // Randomize base, span, offset
  const base   = Math.random() * 360;
  const span   = R(recipe.span[0], recipe.span[1]);
  const offset = R(recipe.offset[0], recipe.offset[1]);

  // Randomize saturation/brightness envelopes per corner
  const topA = [ (base+360)%360,                 R(recipe.topS[0], recipe.topS[1]), R(recipe.topB[0], recipe.topB[1]) ];
  const topB = [ (base+span)%360,                R(recipe.topS[0], recipe.topS[1]), R(recipe.topB[0], recipe.topB[1]) ];
  const botA = [ (base+offset+360)%360,          R(recipe.botS[0], recipe.botS[1]), R(recipe.botB[0], recipe.botB[1]) ];
  const botB = [ (base+offset+span+360)%360,     R(recipe.botS[0], recipe.botS[1]), R(recipe.botB[0], recipe.botB[1]) ];

  // Also randomize your global generation controls here (light-touch)
  GEN_BANDS      = Math.floor(R(recipe.bands[0], recipe.bands[1] + 0.999));
  GEN_MIN_DELTA  = R(recipe.minBrightStep[0], recipe.minBrightStep[1]);

  // Inject warp + bandHueStep into the gradient function by storing them on a global
  window.__flowExtras = {
    bandHueStep: R(recipe.bandHueStep[0], recipe.bandHueStep[1]),
    warpMode: recipe.warpU,
    name: recipe.name
  };

  return { topA, topB, botA, botB, name: recipe.name };
}


function applyThemeFlow(){
  const { topA, topB, botA, botB, name } = generateFlowTheme(); // now uses recipes
  originalRGB = precomputeFlowGradientHSB_strong(ROWS, COLS, topA, topB, botA, botB, GEN_MIN_DELTA, GEN_BANDS);
  gridRGB     = deepCopyGridRGB(originalRGB);
  holes.clear(); popQueue.length=0; dragging=null;
  shuffleGridInPlace(gridRGB);
  recomputeLockedCells();
  enforceGuides();
  setStatus(`Theme: ${name} • Guide: ${guideModeLabel()} • Press C to check`);
}


/* ============ Inspect (categorical) ============ */
const CATS = [
  {name:'Red',    rgb:[228,  50,  50], range:[345,360], alt:[0,15]},
  {name:'Orange', rgb:[255, 150,  40], range:[15,45]},
  {name:'Yellow', rgb:[250, 215,  60], range:[45,75]},
  {name:'Green',  rgb:[ 40, 175,  85], range:[75,165]},
  {name:'Blue',   rgb:[ 50, 110, 235], range:[165,255]},
  {name:'Purple', rgb:[170,  70, 205], range:[255,345]},
];
function categorizeRGB(rgb){
  const [h,s,v] = rgbToHSV(rgb[0], rgb[1], rgb[2]);
  if (s < 12){
    if (v < 30) return 4;
    if (v < 55) return 5;
    if (v < 75) return 3;
    return 2;
  }
  for (let i=0;i<CATS.length;i++){
    const [a,b] = CATS[i].range;
    if (a <= h && h < b) return i;
  }
  if (h >= CATS[0].alt[0] && h < CATS[0].alt[1]) return 0;
  return 0;
}

/* ============ Guides (selection) ============ */
function recomputeLockedCells(){
  lockedCells.clear();
  if (guideMode===0) return;
  if (guideMode===1){
    [[0,0],[0,COLS-1],[ROWS-1,0],[ROWS-1,COLS-1]].forEach(([r,c])=> lockedCells.add(keyFor(r,c)));
  } else {
    for (let c=0;c<COLS;c++){ lockedCells.add(keyFor(0,c)); lockedCells.add(keyFor(ROWS-1,c)); }
    for (let r=0;r<ROWS;r++){ lockedCells.add(keyFor(r,0)); lockedCells.add(keyFor(r,COLS-1)); }
  }
}

/* ====== relocation helpers ====== */
function colorKey(rgb){ return `${rgb[0]},${rgb[1]},${rgb[2]}`; }
function colorsEq(a,b){ return a[0]===b[0] && a[1]===b[1] && a[2]===b[2]; }
function indexOfColorInQueue(rgb){
  const k = colorKey(rgb);
  for (let i=0;i<popQueue.length;i++){
    if (colorKey(popQueue[i]) === k) return i;
  }
  return -1;
}

/** Enforce guides by relocating correct tiles (no painting). */
function enforceGuides(){
  if (guideMode === 0) return;

  const colorPos = new Map();
  const addPos = (rgb, r, c, locked) => {
    const k = colorKey(rgb);
    if (!colorPos.has(k)) colorPos.set(k, []);
    colorPos.get(k).push({ r, c, locked });
  };

  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      const krc = keyFor(r,c);
      if (holes.has(krc)) continue;
      addPos(gridRGB[r][c], r, c, lockedCells.has(krc));
    }
  }

  let missing = 0;

  for (const k of lockedCells){
    const [tr, tc] = rcFromKey(k);
    const want = originalRGB[tr][tc];
    const wantKey = colorKey(want);

    const targetWasHole = holes.has(k);

    if (!targetWasHole && colorsEq(gridRGB[tr][tc], want)) {
      continue;
    }

    // donor from board
    let donor = null, donorList = colorPos.get(wantKey);
    if (donorList && donorList.length){
      let idx = donorList.findIndex(p => !(p.r===tr && p.c===tc) && !p.locked);
      if (idx === -1) idx = donorList.findIndex(p => !(p.r===tr && p.c===tc));
      if (idx !== -1) {
        donor = donorList[idx];
        donorList.splice(idx, 1);
      }
    }

    if (donor){
      const donorK = keyFor(donor.r, donor.c);
      const donorColor = gridRGB[donor.r][donor.c];

      if (targetWasHole){
        gridRGB[tr][tc] = donorColor;
        holes.delete(k);
        holes.add(donorK);
      } else {
        const targetColor = gridRGB[tr][tc];
        gridRGB[tr][tc] = donorColor;
        gridRGB[donor.r][donor.c] = targetColor;
        addPos(targetColor, donor.r, donor.c, lockedCells.has(donorK));
      }
      continue;
    }

    // try queue
    const qIdx = indexOfColorInQueue(want);
    if (qIdx !== -1){
      const taken = popQueue.splice(qIdx, 1)[0];
      if (targetWasHole){
        gridRGB[tr][tc] = taken;
        holes.delete(k);
      } else {
        const displaced = gridRGB[tr][tc];
        gridRGB[tr][tc] = taken;
        popQueue.push(displaced);
      }
      continue;
    }

    missing++;
  }

  if (missing>0){
    setStatus(`Guides enforced; ${missing} target(s) missing their tile.`, '#B00020');
  } else {
    setStatus('Guides enforced by relocation.');
  }
}

/* ============ P5 ============ */
function setup(){
  pixelDensity(1);
  noSmooth();

  const cnv = createCanvas(COLS*LENGTH, (ROWS + EXTRA_ROWS_BELOW)*LENGTH);
  noLoop();
  cnv.parent('canvas-holder');
  cnv.elt.tabIndex = 0; cnv.elt.focus();

  // HUD hooks
  hudModeEl    = document.getElementById('hud-mode');
  hudGuideEl   = document.getElementById('hud-guide');
  hudQueueEl   = document.getElementById('hud-queue');
  hudStatusEl  = document.getElementById('hud-status');
  hudInspectEl = document.getElementById('hud-inspect');
  hudDiffEl    = document.getElementById('hud-diff');

  wireContrastPanel();

  // Default E mode reflected in HUD
  mode = 'E';
  updateHUD();

  guideMode = 1; // corners locked by default
  recomputeLockedCells();
  applyThemeFlow(); // builds + shuffles + relocates
}

function draw(){
  // dynamic height to fit queue rows (no text)
  const queueRows = Math.ceil(popQueue.length / COLS);
  if (queueRows !== lastQueueRows){
    lastQueueRows = queueRows;
    const newH = (ROWS + EXTRA_ROWS_BELOW + queueRows)*LENGTH;
    resizeCanvas(COLS*LENGTH, newH);
  }

  background('#F9F5E9');

  // 1) current board (no text)
  noStroke();
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      const k = keyFor(r,c);
      if (holes.has(k)) continue;
      const rgb = gridRGB[r][c];
      fillAdjusted(rgb);
      rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
    }
  }

  // 2) Peek original (100% opaque) OR Inspect categorical
  if (peek){
    noStroke();
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const k = keyFor(r,c);
        if (holes.has(k)) continue;
        const rgb = originalRGB[r][c];
        fill(rgb[0],rgb[1],rgb[2]);
        rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
      }
    }
  } else if (inspect){
    noStroke();
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const k = keyFor(r,c);
        if (holes.has(k)) continue;
        const idx = categorizeRGB(gridRGB[r][c]);
        const col = CATS[idx].rgb;
        fill(col[0], col[1], col[2]);
        rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
      }
    }
  }

  // 3) Guides
  if (guideMode!==0){
    noFill(); stroke(0); strokeWeight(2);
    if (guideMode===1){
      [[0,0],[0,COLS-1],[ROWS-1,0],[ROWS-1,COLS-1]].forEach(([r,c])=>{
        rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
      });
    } else {
      rect(0, 0, COLS*LENGTH, ROWS*LENGTH);
    }
  }

  // 4) Diff outlines (skip during peek)
  if (showDiff && !peek){
    noFill(); stroke('#111'); strokeWeight(2);
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const k = keyFor(r,c);
        if (holes.has(k)) continue;
        if (!colorsEqual(gridRGB[r][c], originalRGB[r][c])){
          rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
        }
      }
    }
  }

  // 5) Drag ghost on top
  if (mode==='E' && dragging){
    noFill(); stroke('#fff'); strokeWeight(3);
    rect(dragging.c*LENGTH, dragging.r*LENGTH, LENGTH, LENGTH);
    const gx = Math.floor(mouseX / LENGTH) * LENGTH;
    const gy = Math.floor(mouseY / LENGTH) * LENGTH;
    const rgb = dragging.rgb;
    stroke('#fff'); strokeWeight(3);
    fill(rgb[0],rgb[1],rgb[2], 220);
    rect(gx, gy, LENGTH, LENGTH);
  }

  // 6) Queue blocks (no labels)
  const yTop = (ROWS+1)*LENGTH;
  for (let i=0;i<popQueue.length;i++){
    const rr = Math.floor(i/COLS), cc = i%COLS, rgb=popQueue[i];
    fill(rgb[0],rgb[1],rgb[2]);
    rect(cc*LENGTH, yTop + rr*LENGTH, LENGTH, LENGTH);
  }
}

/* ============ MOUSE ============ */
function mousePressed(){
  const [r,c] = mouseRC(); if (!inBounds(r,c)) return;
  const k = keyFor(r,c);

  if (mode==='G'){
    if (lockedCells.has(k)) return setStatus('Locked guide cell.','#B00020');
    if (!holes.has(k)){
      const rgb=gridRGB[r][c]; popQueue.push([rgb[0],rgb[1],rgb[2]]); holes.add(k);
      return setStatus(`Collected. Queue: ${popQueue.length}`);
    }
    return;
  }

  if (mode==='P'){
    if (lockedCells.has(k)) return setStatus('Locked guide cell.','#B00020');
    if (holes.has(k) && popQueue.length>0){
      const rgb=popQueue.shift(); gridRGB[r][c]=rgb; holes.delete(k);
      updateHUD();
      return setStatus(`Placed. Queue: ${popQueue.length}`);
    }
    return;
  }

  if (mode==='E'){
    if (!holes.has(k) && !lockedCells.has(k)){
      dragging = { r, c, rgb: [ gridRGB[r][c][0], gridRGB[r][c][1], gridRGB[r][c][2] ] };
      return setStatus('Dragging: drop on empty to move, on filled to swap. ESC to cancel.');
    }
  }
}

function mouseReleased(){
  if (mode!=='E' || !dragging) return;
  const [dr,dc] = mouseRC();
  if (!inBounds(dr,dc)){ dragging=null; return setStatus('Canceled (outside board).'); }
  const srcK = keyFor(dragging.r, dragging.c);
  const dstK = keyFor(dr,dc);
  if (lockedCells.has(dstK)){ dragging=null; return setStatus('Destination locked (guide).','#B00020'); }
  if (dragging.r===dr && dragging.c===dc){ dragging=null; return setStatus('No move.'); }
  if (holes.has(dstK)){
    gridRGB[dr][dc] = dragging.rgb; holes.delete(dstK); holes.add(srcK);
    dragging=null; return setStatus('Moved.');
  }
  const tmp = gridRGB[dr][dc];
  gridRGB[dr][dc] = dragging.rgb;
  gridRGB[dragging.r][dragging.c] = tmp;
  dragging=null; return setStatus('Swapped.');
}

function mouseDragged(){ if (mode==='E' && dragging) redraw(); }

/* ============ KEYS ============ */
function keyPressed(){
  if (key==='g'||key==='G'){ mode='G'; dragging=null; updateHUD(); return setStatus('Collect mode (click filled → queue).'); }
  if (key==='p'||key==='P'){ mode='P'; dragging=null; updateHUD(); return setStatus('Place mode (click empty → from queue).'); }
  if (key==='e'||key==='E'){ mode='E'; dragging=null; updateHUD(); return setStatus('Edit mode: drag a filled cell to move/swap.'); }

  // Peek ORIGINAL (100% opaque)
  if (key==='v'||key==='V'){ peek=true; return redraw(); }

  // Inspect toggle
  if (key==='i'||key==='I'){ inspect=!inspect; updateHUD(); return redraw(); }

  // Diff outlines toggle
  if (key==='d'||key==='D'){ showDiff=!showDiff; updateHUD(); return redraw(); }

  // Zoom out (no special cap)
  if (key==='['||key==='{'){
    if (LENGTH > LENGTH_MIN){
      LENGTH -= ZOOM_STEP;
      // if we go below the default baseline, also reduce the "extra zoom-in" counter
      if (zoomInStepsFromDefault > 0) zoomInStepsFromDefault = Math.max(0, zoomInStepsFromDefault - 1);
      const newH = (ROWS + EXTRA_ROWS_BELOW + lastQueueRows)*LENGTH;
      resizeCanvas(COLS*LENGTH, newH);
      return setStatus(`Zoom: ${LENGTH}px/cell`);
    }
    return;
  }

  // Zoom in (cap at 3 steps from default)
  if (key===']'||key==='}'){
    if (zoomInStepsFromDefault < 3 && LENGTH + ZOOM_STEP <= LENGTH_MAX){
      LENGTH += ZOOM_STEP;
      zoomInStepsFromDefault++;
      const newH = (ROWS + EXTRA_ROWS_BELOW + lastQueueRows)*LENGTH;
      resizeCanvas(COLS*LENGTH, newH);
      return setStatus(`Zoom: ${LENGTH}px/cell`);
    }
    return;
  }

  // Shuffle / Check / Reset / Random corners / Flow theme
  if (key==='s'||key==='S'){
    gridRGB = deepCopyGridRGB(originalRGB);
    shuffleGridInPlace(gridRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    updateHUD();
    return setStatus('Shuffled current from ORIGINAL.');
  }
  if (key==='c'||key==='C'){
    if (popQueue.length>0) return setStatus(`Not solved: queue ${popQueue.length}.`,'#B00020');
    if (holes.size>0)     return setStatus(`Not solved: ${holes.size} empty cells.`,'#B00020');
    let mism=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(!colorsEqual(gridRGB[r][c],originalRGB[r][c])) mism++;
    return setStatus(mism===0?'✅ Correct!':'❌ Not yet: '+mism+' mismatches.', mism===0?'#1B5E20':'#B00020');
  }
  if (key==='m'||key==='M'){
    gridRGB = deepCopyGridRGB(originalRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    updateHUD();
    return setStatus('Reset to ORIGINAL.');
  }
  if (key==='x'||key==='X'){
    const randHex = ()=> `#${hex(Math.floor(Math.random()*196+60),2)}${hex(Math.floor(Math.random()*196+60),2)}${hex(Math.floor(Math.random()*196+60),2)}`;
    originalRGB = precomputeGradientRGB_HSB(ROWS, COLS, randHex(),randHex(),randHex(),randHex());
    gridRGB = deepCopyGridRGB(originalRGB);
    shuffleGridInPlace(gridRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    updateHUD();
    return setStatus('Random corners → ORIGINAL rebuilt → current shuffled.');
  }
  if (key==='f'||key==='F'){ applyThemeFlow(); updateHUD(); return; }

  // Guides
  if (key==='0'){ guideMode=0; recomputeLockedCells(); enforceGuides(); updateHUD(); return setStatus('Guide: Off'); }
  if (key==='1'){ guideMode=1; recomputeLockedCells(); enforceGuides(); updateHUD(); return setStatus('Guide: Corners (Hard)'); }
  if (key==='2'){ guideMode=2; recomputeLockedCells(); enforceGuides(); updateHUD(); return setStatus('Guide: Border (Easy)'); }

  if (key==='Escape'){ if (dragging){ dragging=null; return setStatus('Drag canceled.'); } }
}
function keyReleased(){
  if (key==='v'||key==='V'){ peek=false; redraw(); }
}

/* support: simple hex-corner gradient for X key */
function precomputeGradientRGB_HSB(rows, cols, c00Hex, c10Hex, c01Hex, c11Hex) {
  colorMode(HSB, 360, 100, 100);
  const c00=color(c00Hex), c10=color(c10Hex), c01=color(c01Hex), c11=color(c11Hex);
  const arr = Array.from({length: rows}, ()=>Array(cols));
  for (let r=0;r<rows;r++){
    const v = rows===1 ? 0 : r/(rows-1);
    const left  = lerpColor(c00,c01,v);
    const right = lerpColor(c10,c11,v);
    for (let c=0;c<cols;c++){
      const u = cols===1 ? 0 : c/(cols-1);
      const cc = lerpColor(left,right,u);
      arr[r][c] = [Math.round(red(cc)), Math.round(green(cc)), Math.round(blue(cc))];
    }
  }
  colorMode(RGB,255,255,255,255);
  return arr;
}
