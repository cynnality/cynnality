/* ============ imports ============ */
import { UI } from './sort-office-ui.js';
import { initSliders } from './sort-office-ui.js';
import {
  updateQueueHeader,
  renderQueueUI,
  syncQueueCSSVars as uiSyncQueueCSSVars, // 👈 alias to avoid name clash
  QueuePanel
} from './sort-office-ui.js';
import { renderHUDLists } from './sort-office-ui.js';
import { enableHudCollapsers } from './sort-office-ui.js';
import { enableHudExtraPanels } from './sort-office-ui.js';

// ===== p5 global shims for ES modules =====
const _p5 = () => window;

const pixelDensity = (...a) => _p5().pixelDensity?.(...a);
const noSmooth     = (...a) => _p5().noSmooth?.(...a);
const createCanvas = (...a) => _p5().createCanvas?.(...a);
const noLoop       = (...a) => _p5().noLoop?.(...a);
const resizeCanvas = (...a) => _p5().resizeCanvas?.(...a);
const background   = (...a) => _p5().background?.(...a);
const noStroke     = (...a) => _p5().noStroke?.(...a);
const stroke       = (...a) => _p5().stroke?.(...a);
const strokeWeight = (...a) => _p5().strokeWeight?.(...a);
const rect         = (...a) => _p5().rect?.(...a);
const fill         = (...a) => _p5().fill?.(...a);
const colorMode    = (...a) => _p5().colorMode?.(...a);
const color        = (...a) => _p5().color?.(...a);
const lerpColor    = (...a) => _p5().lerpColor?.(...a);
const red          = (...a) => _p5().red?.(...a);
const green        = (...a) => _p5().green?.(...a);
const blue         = (...a) => _p5().blue?.(...a);

/* ============ board geometry and zoom math ============ */
const ROWS = 10, COLS = 10;
const BASE_LENGTH = 72;        // initial cell size at load
let LENGTH = BASE_LENGTH;      // current cell size
const ZOOM_STEP = 2;           // delta per zoom
const MAX_ZOOM_IN_STEPS = 3;   // user may zoom in at most 3 steps above BASE_LENGTH
const LENGTH_MIN = 24;         // absolute zoom-out floor
// for the absolute zoom-in ceiling
const MAX_LENGTH = BASE_LENGTH + MAX_ZOOM_IN_STEPS * ZOOM_STEP;

// --- DOM helper ---
function byId(id){ return document.getElementById(id); }

/* ============ state arrays/sets and mode flags ============ */
let originalRGB = [];
let gridRGB     = [];
let holes = new Set();       // Set("r,c")
let popQueue = [];           // FIFO [R,G,B]
let mode = 'move';           // default: move
let dragging = null;

let guideMode = 1;           // 0 off, 1 corners, 2 border
let lockedCells = new Set();
/*============== view toggles and tools ==============*/ 
let peek = false;            // hold V
let inspect = false;         // toggle X
let inspectLightness = false; // L sub-toggle while inspect is on
let showDiff = false;        // toggle D
/*============== action flags ==============*/
let zoomIn = false;
let zoomOut = false;
let shuffle = false;
let checkme = false;
let answerit = false;
/*===== cell selection subsystem mode / state =====*/
let eSelectMode = 'drag'; // 'drag' | 'click' | 'line'
let eClickSrc   = null;   // {r,c} for click->click
let eLineAnchor = null;   // {r,c} drag start for line
let eLineDrag   = null;   // {r,c} live drag point for line
let eLineSrc    = null;  // locked source line after mouseup: {axis:'h'|'v', r0,c0,r1,c1,len}

function clearETransient() {
  dragging   = null;   
  eClickSrc  = null;
  eLineAnchor= null;
  eLineDrag  = null;
}

/*===== collect and place modes / states =====*/
// --- drag to collect state ---
let gDragging = false;
let gVisited = null;   // Set of "r,c" visited during this drag 
let gCollectedCount = 0;
// --- drag-to-place state ---
let pDragging = false;
let pVisited  = null;  // Set<string> of "r,c" visited on this drag
let pPlacedCount = 0;  // how many cells placed in this drag

/*===== theme and permutation =====*/
let themeIndex = 0;
// keep current theme so gen-time tweaks don't randomize colors 
// !! check later to make sure i still need let themeIndex = 0; above
let THEME_LATEST = null;
// Linear permutation of board cells: destIndex -> sourceIndex (from ORIGINAL)
let boardPerm = null; // null means “no shuffle yet” (identity)

/*==================== rendering / generator knobs ========================*/ 
/* ===== live perception controls (render-time only) ===== */
let SAT_SCALE = 1.00;     // 0.5 .. 1.8
let VAL_GAMMA = 1.00;     // 0.6 .. 1.6
// gen-time knobs (defaults = no-op / original look)
let GEN_V_COL_SPAN_MIN = 0;     // e.g. 10..16 to add vertical contrast
let GEN_V_BAND_MIN = 0;         // tiny per-band V bump (min)
let GEN_V_BAND_MAX = 0;         // tiny per-band V bump (max)
let GEN_V_CONTRAST = 1.00;      // >1.0 increases global V contrast slightly (try 1.08..1.12)
let GEN_V_GAMMA_GEN = 1.00;     // gamma on generator V (not your render-time VAL_GAMMA)
// generation-time 
let GEN_MIN_DELTA = 1.30; // minimum brightness step down the column
let GEN_BANDS     = 2;    // subtle band variety across columns

/* ============ UI bridge functions ============ */
// ----- Status (core owns simple state; UI renders it)
// ===== Simplified Status Manager (persistent stacked lines only) =====
const Status = {
  flags: new Map(),   // key → { text, color? }

  setFlag(key, text, color = '#000000') {
    if (text) this.flags.set(key, { text, color });
    else this.flags.delete(key);
    this.render();
  },

  clearFlag(key) {
    this.flags.delete(key);
    this.render();
  },

  clearAll() {
    this.flags.clear();
    this.render();
  },

  render() {
    const lines = [];
    for (const { text } of this.flags.values()) {
      if (text) lines.push(text);
    }
    UI.HUD.setStatusList?.(lines);
  }
};

// Back-compat helper for old `setStatus(...)` calls.
// (They just become a one-line “flag” under the key "flash".)
function coreSetStatus(msg, col = '#000000') {
  if (!msg) { Status.clearFlag('flash'); return; }
  Status.setFlag('flash', msg, col);
}

// need to make sure all updateHUD() and refreshHUDKeys() are replaced with UI.HUD.refreshAll() or reflectHUD()
function reflectHUD(){
  UI.HUD.refreshAll({
    mode,
    guideMode,
    queueLen: popQueue.length,
    inspect,
    inspectLightness,
    showDiff
  });
    // Make sure stacked status lines are painted too
  Status.render();
}

function refreshUIElements() {
  reflectHUD();                // numbers + active key glows
  updateQueueHeaderByMode?.(); // (this forwards to UI.updateQueueHeader)
  renderQueueDOM?.();          // (this forwards to UI.renderQueueUI)
  refreshPanel?.();            // (QueuePanel.renderInfo + pills/hints)
}

function fireKeyDown(k){
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyPressed === 'function') keyPressed();
  } finally {
    window.key = prev;
  }
}
function fireKeyUp(k){
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyReleased === 'function') keyReleased();
  } finally {
    window.key = prev;
  }
}

/* ===== Utils (module-safe) ===== */
const keyFor     = (r,c) => `${r},${c}`;
const rcFromKey  = k => k.split(',').map(Number);
const inBounds   = (r,c) => r>=0 && r<ROWS && c>=0 && c<COLS;

// IMPORTANT: use window.mouseX/Y in modules
const mouseRC = () => [
  Math.floor(window.mouseY / LENGTH),
  Math.floor(window.mouseX / LENGTH),
];

const colorsEqual = (a,b)=> a[0]===b[0] && a[1]===b[1] && a[2]===b[2];
const deepCopyGridRGB = src => src.map(row=>row.map(rgb=>[rgb[0],rgb[1],rgb[2]]));

/* ===== Board permutation helpers (HOISTED) ===== */
function idxOf(r, c){ return r * COLS + c; }
function rcOf(idx){ return [ Math.floor(idx / COLS), idx % COLS ]; }

function buildShuffledPerm(){
  const n = ROWS * COLS;
  const perm = Array.from({ length: n }, (_, i) => i);
  // Fisher–Yates
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  return perm;
}

function applyPermToGrid(srcGrid, perm){
  const out = Array.from({ length: ROWS }, () => Array(COLS));
  for (let dest = 0; dest < perm.length; dest++) {
    const src = perm[dest];
    const dr = Math.floor(dest / COLS), dc = dest % COLS;
    const sr = Math.floor(src / COLS), sc = src % COLS;
    out[dr][dc] = srcGrid[sr][sc];
  }
  return out;
}


function collectCellAt(r, c) {
  const k = keyFor(r, c);
  if (lockedCells.has(k)) return false; // guides are protected
  if (holes.has(k)) return false;       // already removed

  const rgb = gridRGB[r][c];
  popQueue.push([rgb[0], rgb[1], rgb[2]]);
  holes.add(k);

  // keep UI in sync (header + tiles + HUD pills), no panel rebuild needed
  refreshNonPanelUI?.();
  redraw?.();
  return true;
}

// Try to place one cell from the queue at (r,c)
// Returns true if placed, false otherwise.
function placeCellAt(r, c){
  if (!inBounds(r, c)) return false;
  const k = keyFor(r, c);
  if (lockedCells.has(k)) return false;   // respect guides
  if (!holes.has(k))      return false;   // must be empty to place
  if (popQueue.length === 0) return false;

  const rgb = popQueue.shift();      // take from front of queue
  gridRGB[r][c] = rgb;               // fill the hole
  holes.delete(k);                   // it’s no longer a hole

  // reflect queue/HUD; panel markup unchanged
  refreshNonPanelUI?.();
  redraw?.();
  return true;
}

function clamp(val, lo, hi){ return Math.max(lo, Math.min(hi, val)); }

// Build a normalized line from two points (snaps to row or column, keeps in-bounds)
function makeLineFromDrag(a, b){
  const dr = b.r - a.r, dc = b.c - a.c;
  if (Math.abs(dc) >= Math.abs(dr)) {
    const c1 = clamp(b.c, 0, COLS-1);
    const c0 = Math.min(a.c, c1), cE = Math.max(a.c, c1);
    return { axis:'h', r0:a.r, c0, r1:a.r, c1:cE, len: (cE - c0 + 1) };
  } else {
    const r1 = clamp(b.r, 0, ROWS-1);
    const r0 = Math.min(a.r, r1), rE = Math.max(a.r, r1);
    return { axis:'v', r0, c0:a.c, r1:rE, c1:a.c, len: (rE - r0 + 1) };
  }
}

function iterCells(line){
  const arr = [];
  if (line.axis === 'h'){
    for (let c=line.c0; c<=line.c1; c++) arr.push({r:line.r0, c});
  } else {
    for (let r=line.r0; r<=line.r1; r++) arr.push({r, c:line.c0});
  }
  return arr;
}

const allHoles  = (cells) => cells.every(({r,c}) => holes.has(keyFor(r,c)));
const allFilled = (cells) => cells.every(({r,c}) => !holes.has(keyFor(r,c)));

function touchesLocked(cells){
  return cells.some(({r,c}) => lockedCells.has(keyFor(r,c)));
}

// Build destination line with same axis/length, starting at clicked (r,c)
function makeDstLineFromStart(srcLine, r, c){
  if (srcLine.axis === 'h'){
    const c1 = c + srcLine.len - 1;
    if (c1 >= COLS) return null;
    return { axis:'h', r0:r, c0:c, r1:r, c1, len: srcLine.len };
  } else {
    const r1 = r + srcLine.len - 1;
    if (r1 >= ROWS) return null;
    return { axis:'v', r0:r, c0:c, r1, c1:c, len: srcLine.len };
  }
}

function linesOverlap(a, b){
  const A = new Set(iterCells(a).map(p=>keyFor(p.r,p.c)));
  return iterCells(b).some(p => A.has(keyFor(p.r,p.c)));
}

// Move/swap operation for same-length lines
function applyLineMoveSwap(srcLine, dstLine){
  const srcCells = iterCells(srcLine);
  const dstCells = iterCells(dstLine);

  if (touchesLocked(srcCells) || touchesLocked(dstCells)){
    coreSetStatus?.('Touches locked guide.', '#B00020');
    return false;
  }
  if (linesOverlap(srcLine, dstLine)){
    coreSetStatus?.('Source/destination overlap.', '#B00020');
    return false;
  }

  if (allHoles(dstCells)){
    // MOVE into empty
    for (let i=0;i<srcCells.length;i++){
      const s=srcCells[i], d=dstCells[i];
      const ks=keyFor(s.r,s.c), kd=keyFor(d.r,d.c);
      gridRGB[d.r][d.c] = gridRGB[s.r][s.c];
      holes.delete(kd); holes.add(ks);
    }
    coreSetStatus?.(`Moved source line ${srcLine.r0 ?? srcLine.r},${srcLine.c0 ?? srcLine.c} into empty destination.`);
    refreshNonPanelUI?.();
    redraw?.();
    return true;
  }

  if (allFilled(dstCells)){
    // SWAP with filled
    for (let i=0;i<srcCells.length;i++){
      const s=srcCells[i], d=dstCells[i];
      const tmp = gridRGB[d.r][d.c];
      gridRGB[d.r][d.c] = gridRGB[s.r][s.c];
      gridRGB[s.r][s.c] = tmp;
    }
    coreSetStatus?.('Swapped line with destination.');
    refreshNonPanelUI?.();
    redraw?.();
    return true;
  }

  coreSetStatus?.('Destination must be all empty (move) or all filled (swap).', '#B00020');
  return false;
}

// return the first cell of a line (canonical "start")
function lineStart(line){
  for (const cell of iterCells(line)) return cell;
  return null;
}

// transient state while dragging the locked line to move it
let eLineMove = null;       // truthy while you're dragging the locked line
let eLineMoveGhost = null;  // the candidate destination line (preview)

function updateQueueHeaderByMode(){
  updateQueueHeader(mode, popQueue.length);
}

function renderQueueDOM(){
  renderQueueUI(popQueue); // HUD count is handled by reflectHUD()
}

function syncQueueCSSVars(){
  // forward to UI helper with the derived values
  uiSyncQueueCSSVars(LENGTH, ROWS);
}

function readUIState(){
  return {
    mode,
    popQueueLen: popQueue.length,
    eClickSrc,
    eLineSrc,
    eSelectMode
  };
}

// once at startup (after DOM ready)
QueuePanel.init({
  readStateFn: readUIState,
  onSetESelectFn: (em) => UIState.setESelect(em)
});

const UIState = {
  setMode(newMode){
    if (mode === newMode) return;
    mode = newMode;
    clearETransient?.();
    coreSetStatus?.(`${newMode === 'move' ? `Move mode (${eSelectMode})` : `${newMode} mode`}.`);

    // rebuild info pane for new mode
    refreshPanel();
    // reflect HUD/header/queue
    refreshNonPanelUI?.();
    redraw();

    if (mode === 'move') {
      QueuePanel?.renderInfo?.();
      QueuePanel?.refreshEPillsActive?.();
    }

    // keep legacy calls (internally these now hit UI)
    updateQueueHeaderByMode?.();
    renderQueueDOM?.();
    reflectHUD?.();          // calls UI.HUD.refreshAll(...)
  },

  setESelect(sel){
    if (eSelectMode === sel){
      QueuePanel?.renderInfo?.();
      QueuePanel?.refreshEPillsActive?.();
      return;
    }
    eSelectMode = sel;
    clearETransient?.();
    coreSetStatus?.(`Edit selection: ${eSelectMode}`);

    QueuePanel?.renderInfo?.();
    QueuePanel?.refreshEPillsActive?.();

    updateQueueHeaderByMode?.();
    renderQueueDOM?.();
    reflectHUD?.();
  },

  setHudKeyActive(keyName, on){
    // optional: delegate to UI.HUD.setKeyActive if you exported it
    const el = document.querySelector(`.hud-key[data-key="${keyName}"]`);
    if (el) el.classList.toggle('active', !!on);
  }
};

function refreshNonPanelUI(){
  refreshAllUI();
}

function refreshPanel(){
  QueuePanel?.renderInfo?.();
  if (mode === 'move') QueuePanel?.refreshEPillsActive?.();
}


// Live queue-only refresh (header + queue tiles), throttled to rAF
let _queueRaf = null;

function refreshQueueLive(){
  updateQueueHeaderByMode?.(); // wrapper → UI.updateQueueHeader(mode, popQueue.length)
  renderQueueDOM?.();          // wrapper → UI.renderQueueUI(popQueue, hudQueueEl)
}

function requestQueueLive(){
  if (_queueRaf) return;
  if (typeof requestAnimationFrame === 'function') {
    _queueRaf = requestAnimationFrame(() => {
      _queueRaf = null;
      refreshQueueLive();
    });
  } else {
    setTimeout(() => refreshQueueLive(), 0);
  }
}

/* ============ RGB/HSV + render adjustments ============ */
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

  // color bump factors for lightness bands
  // perceived luminance (0..255) from an rgb [r,g,b]
  function relLuma(rgb){ 
    // standard Rec.709 luma
    return 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2];
  }

      //!! to make them dynamic later
    // 3 bands using simple fixed thresholds (tweak later or make percentile-based)
    const LIGHTNESS_THRESHOLDS = [85, 170];
    function lightnessBandFromRGB(rgb){
      const L = relLuma(rgb);
      if (L < LIGHTNESS_THRESHOLDS[0]) return 0;
      if (L < LIGHTNESS_THRESHOLDS[1]) return 1;
      return 2;
    }

    // Factors for the three bands: dark / mid / light
    // Tweak to taste; these give a clear but not wild separation.
    const LIGHTNESS_FACTORS = [0.72, 1.0, 1.28];
    // Adjust brightness of a base categorical color by a factor, clamp 0..255
    function adjustBrightness(rgb, factor){
      const out = [0,0,0];
      for (let i=0;i<3;i++){
        let v = rgb[i] * factor;
        out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      return out;
    }

  function computeLightnessThresholdsFromTheme(){
    const vals = [];
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        vals.push(relLuma(originalRGB[r][c])); // sample from the generated theme
      }
    }
    vals.sort((a,b)=>a-b);
    LIGHTNESS_THRESHOLDS[0] = vals[Math.floor(vals.length*0.33)]|0;
    LIGHTNESS_THRESHOLDS[1] = vals[Math.floor(vals.length*0.66)]|0;
  }

  const guideModeLabel = () =>
  guideMode === 0 ? 'Off' : (guideMode === 1 ? 'corners' : 'borders');

   /* ============ Theme apply ============ */
  function applyThemeFlow(opts = { reuseTheme:false, preserveLayout:false }){
  const theme = (opts.reuseTheme && THEME_LATEST) ? THEME_LATEST : GradientGen.generateTheme();
  THEME_LATEST = theme;

  originalRGB = GradientGen.precompute(
    ROWS, COLS,
    theme.topA, theme.topB, theme.botA, theme.botB,
    {
      genMinDelta: GEN_MIN_DELTA,
      genBands: GEN_BANDS,
      vColSpanMin: GEN_V_COL_SPAN_MIN,
      vBandStepRange: [GEN_V_BAND_MIN, GEN_V_BAND_MAX],
      vContrast: GEN_V_CONTRAST,
      vGamma: GEN_V_GAMMA_GEN
    }
  );

  computeLightnessThresholdsFromTheme();

  // Build working board depending on intent
  if (opts.preserveLayout && boardPerm) {
    // keep current arrangement; recolor using the same permutation
    gridRGB = applyPermToGrid(originalRGB, boardPerm);
  } else {
    // new board: reset and shuffle once
    holes.clear(); popQueue.length = 0; dragging = null;
    boardPerm = buildShuffledPerm();
    gridRGB = applyPermToGrid(originalRGB, boardPerm);
  }

  recomputeLockedCells();
  enforceGuides(); // (patched below to use coreSetStatus + non-panel UI refresh)

  coreSetStatus?.(`Theme: ${theme.name} --- guides: ${guideModeLabel()} --- Press C to check`);
  // reflect UI (no heavy panel rebuild unless you explicitly need it)
  refreshNonPanelUI?.();  // header + queue + HUD
  refreshPanel?.();       // rebuild mode panel markup (pills/hints) for current mode
  redraw?.();
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

function colorKey(rgb){ return `${rgb[0]},${rgb[1]},${rgb[2]}`; }
function colorsEq(a,b){ return a[0]===b[0] && a[1]===b[1] && a[2]===b[2]; }
function indexOfColorInQueue(rgb){
  const k = colorKey(rgb);
  for (let i=0;i<popQueue.length;i++){
    if (colorKey(popQueue[i]) === k) return i;
  }
  return -1;
}

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
    coreSetStatus?.(`Guides enforced; ${missing} target(s) missing their tile.`, '#B00020');
  } else {
    coreSetStatus?.('Guides enforced by relocation.');
  }

  // reflect queue/HUD; no need to rebuild pills/hints panel here
  refreshNonPanelUI?.();
  redraw?.();
}

function refreshAllUI(){
  // HUD numbers + key glows
  reflectHUD?.();                 // calls UI.HUD.refreshAll({ ...state })

  // Queue header + tiles
  updateQueueHeaderByMode?.();    // wrapper → UI.updateQueueHeader(mode, popQueue.length)
  renderQueueDOM?.();             // wrapper → UI.renderQueueUI(popQueue, hudQueueEl)
}

function renderHUDContent(){
  renderHUDLists(); // identical output, now owned by UI
}

function setup(){

  /* ============ HUD init and wiring ============ */
    // 1) HUD help lists + HUD module ==== on DOM ready / before wiring:
    UI.HUD.init(); // cache HUD nodes and prep hotkey target
    renderHUDContent();     // wrapper → UI.renderHUDLists()
    enableHudCollapsers();      // <-- (imported from sort-office-ui.js)
    enableHudExtraPanels();  // <-- NEW: status + slider subpanels collapsible

  // 2) Canvas
  pixelDensity(1);
  noSmooth();
  const cnv = createCanvas(COLS * LENGTH, ROWS * LENGTH);
  cnv.parent('canvas-holder');
  cnv.elt.tabIndex = 0;
  cnv.elt.focus();
  noLoop();

  // Queue CSS vars (tile size & rows)
  syncQueueCSSVars();     // wrapper → UI.syncQueueCSSVars(LENGTH, ROWS)

  // 3) Initial state
  mode = 'move';
  guideMode = 0; // off by default

  // 4) Theme + board (this already recomputes thresholds & enforces guides)
  applyThemeFlow({ reuseTheme:false, preserveLayout:false });

  // 5) Build the queue side panel (pills + hints)
  QueuePanel.init({
    readStateFn: readUIState,                 // defined below
    onSetESelectFn: (em) => UIState.setESelect(em),
  });

  // 6) wire HUD hotkeys (V hold, X/L toggles, etc.)
  UI.HUD.wireHotkeys({
    onKeyDownShot: (k) => fireKeyDown(k),
    onKeyUpShot:   (k) => fireKeyUp(k),

    onToggleInspect: () => {
      inspect = !inspect;
      if (!inspect) inspectLightness = false;
      coreSetStatus(inspect ? 'Inspect ON' : 'Inspect OFF');
    },

    onToggleLightness: () => {
      if (!inspect) return false;
      inspectLightness = !inspectLightness;
      coreSetStatus(inspectLightness ? 'Inspect: lightness bands ON'
                                     : 'Inspect: lightness bands OFF');
      return true;
    },

    onRefreshUI: () => refreshAllUI(),
    onRedraw:    () => redraw(),
    onStatus:    (msg, color) => coreSetStatus(msg, color),
  });

  // 7) Sliders (render-time vs gen-time)
initSliders({
  onRenderChange: (name, value) => {
    if (name === 'SAT_SCALE') SAT_SCALE = value;
    if (name === 'VAL_GAMMA') VAL_GAMMA = value;
    redraw(); // render-time change → repaint only
  },
  onGenChange: (name, value) => {
    if (name === 'GEN_MIN_DELTA')      GEN_MIN_DELTA = value;
    if (name === 'GEN_BANDS')          GEN_BANDS     = value;
    if (name === 'GEN_V_COL_SPAN_MIN') GEN_V_COL_SPAN_MIN = value;
    if (name === 'GEN_V_BAND_MIN')     GEN_V_BAND_MIN     = value;
    if (name === 'GEN_V_BAND_MAX')     GEN_V_BAND_MAX     = value;
    if (name === 'GEN_V_CONTRAST')     GEN_V_CONTRAST     = value;
    if (name === 'GEN_V_GAMMA_GEN')    GEN_V_GAMMA_GEN    = value;

    // generation-time change → regenerate with SAME theme/layout
    applyThemeFlow({ reuseTheme: true, preserveLayout: true });
  }
});

  // 8) First paint of HUD + queue + panel
  refreshAllUI();   // HUD numbers/labels + key glows + queue header/tiles
  refreshPanel();   // panel markup + active pill
}

function draw(){
  background('#F9F5E9');

  // board
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

  // peek or inspect overlays
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

          // 1) Categorize the PIECE (so categories move with the piece)
          const pieceRGB = gridRGB[r][c];                // <-- piece's generator color
          const catIdx   = categorizeRGB(pieceRGB);
          const base     = CATS[catIdx].rgb;             // categorical base color (e.g., blue/green)

          // lightness layer: ALSO piece-based
          // 2) Optional lightness band — also from the PIECE (not the board position)
          let col = base;
          if (inspectLightness){
            const band   = lightnessBandFromRGB(pieceRGB); // 0/1/2 from the piece's color
            const factor = LIGHTNESS_FACTORS[band];         // e.g., [0.72, 1.00, 1.28]
            col = adjustBrightness(base, factor);           // dark/mid/light version of the category color
          }

          fill(col[0], col[1], col[2]);
          rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH);
        }
      }
    }

  // guides
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

  // diff outlines
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

  // === E-mode overlays ===
  if (mode === 'move') {
    // drag: highlight current drag source
    if (eSelectMode === 'drag' && dragging) {
      noFill(); stroke('#fff'); strokeWeight(3);
      rect(dragging.c * LENGTH, dragging.r * LENGTH, LENGTH, LENGTH);
    }

    // click: highlight source
    if (eSelectMode === 'click' && eClickSrc) {
      noFill(); stroke('#fff'); strokeWeight(3);
      rect(eClickSrc.c * LENGTH, eClickSrc.r * LENGTH, LENGTH, LENGTH);
    }

      // LIVE sizing (while dragging to size)
      if (eLineAnchor && eLineDrag){
        const live = makeLineFromDrag(eLineAnchor, eLineDrag);
        const cells = iterCells(live);
        noFill(); stroke('#fff'); strokeWeight(3);
        for (const {r,c} of cells){ rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH); }
      }

      // DRAG-TO-MOVE ghost (preferred if present)
      if (eLineMoveGhost){
        const cells = iterCells(eLineMoveGhost);
        noFill(); stroke('#fff'); strokeWeight(3);
        for (const {r,c} of cells){ rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH); }
      }
      // Otherwise, show the locked source line
      else if (eLineSrc){
        const cells = iterCells(eLineSrc);
        noFill(); stroke('#fff'); strokeWeight(3);
        for (const {r,c} of cells){ rect(c*LENGTH, r*LENGTH, LENGTH, LENGTH); }
      }
    }
  }

function mousePressed(){
  const [r,c] = mouseRC(); if (!inBounds(r,c)) return;
  const k = keyFor(r,c);

  // -------- C MODE --------
  if (mode === 'collect') {
    gDragging = true;
    gVisited = new Set();
    gCollectedCount = 0;

    const key = keyFor(r,c);
    if (!gVisited.has(key)) {
      gVisited.add(key);
      if (collectCellAt(r, c)) gCollectedCount++;
    }
    redraw();
    requestQueueLive();
  }

  // -------- P MODE --------
  if (mode === 'P'){
    pDragging = true;
    pVisited  = new Set();
    pPlacedCount = 0;

    const key = keyFor(r, c);
    if (!pVisited.has(key)) {
      pVisited.add(key);
      if (placeCellAt(r, c)) pPlacedCount++;
    }
    redraw();
    requestQueueLive();
  }

  // -------- move MODE --------
  if (mode === 'move') {
    const isHoleOrLocked = holes.has(k) || lockedCells.has(k);

    // DRAG start
    if (eSelectMode === 'drag') {
      if (holes.has(k))       return coreSetStatus('Cannot drag an empty cell.', '#B00020');
      if (lockedCells.has(k)) return coreSetStatus('Cell is locked by guide.', '#B00020');

      dragging = { r, c, rgb: [ gridRGB[r][c][0], gridRGB[r][c][1], gridRGB[r][c][2] ] };
      return coreSetStatus('Dragging: drop on empty to move, on filled to swap. ESC to cancel.');
    }

    // CLICK–CLICK
    if (eSelectMode === 'click') {
      if (!eClickSrc) {
        if (holes.has(k))       return coreSetStatus('Source cannot be an empty cell.', '#B00020');
        if (lockedCells.has(k)) return coreSetStatus('Source is locked (guide).', '#B00020');

        eClickSrc = { r, c };
        refreshPanel();
        redraw();
        return coreSetStatus(`Source picked (${r},${c}). Click a destination.`);
      } else {
        if (eClickSrc.r === r && eClickSrc.c === c) {
          eClickSrc = null;
          refreshPanel();
          redraw();
          return coreSetStatus('Canceled source.');
        }

        const src = eClickSrc;
        const srcK = keyFor(src.r, src.c);
        const dstK = keyFor(r, c);
        if (lockedCells.has(dstK)) return coreSetStatus('Destination locked (guide).', '#B00020');

        if (holes.has(dstK)) {
          gridRGB[r][c] = gridRGB[src.r][src.c];
          holes.delete(dstK); holes.add(srcK);
          eClickSrc = null;

          refreshAllUI();
          refreshPanel();
          redraw();

          return coreSetStatus('Moved.');
        }

        // swap
        const tmp = gridRGB[r][c];
        gridRGB[r][c] = gridRGB[src.r][src.c];
        gridRGB[src.r][src.c] = tmp;
        eClickSrc = null;

        refreshAllUI();
        refreshPanel();
        redraw();

        return coreSetStatus('Swapped.');
      }
    }

    // LINE: if a source line is already locked, clicking can (a) grab to move, or (b) choose destination
    if (eSelectMode === 'line' && eLineSrc){
      // allow grabbing the locked source line to move
      let inSrc = false;
      for (const cell of iterCells(eLineSrc)) {
        if (cell.r === r && cell.c === c) { inSrc = true; break; }
      }
      if (inSrc) {
        eLineMove = { grab: { r, c } };
        eLineMoveGhost = eLineSrc; // preview starts as current line
        coreSetStatus('Drag to reposition line; release to apply. Use arrow keys to nudge.');
        redraw();
        return;
      }

      const dst = makeDstLineFromStart(eLineSrc, r, c);
      if (!dst){ coreSetStatus('Destination out of bounds.', '#B00020'); return; }

      if (applyLineMoveSwap(eLineSrc, dst)) {
        eLineSrc = null;
        refreshPanel();
        refreshAllUI();
        redraw();
      }
      return;
    }

    // LINE: picking source (start sizing on press)
    if (eSelectMode === 'line'){
      if (isHoleOrLocked){ coreSetStatus('Pick a filled, unlocked tile.', '#B00020'); return; }
      eLineAnchor = {r,c};
      eLineDrag   = {r,c};
      return;
    }
  }
}

function mouseDragged() {
  // collect-mode drag-to-collect
  if (mode === 'collect' && gDragging) {
    const [r, c] = mouseRC();
    if (!inBounds(r, c)) return;
    const key = keyFor(r, c);
    if (!gVisited) gVisited = new Set();
    if (gVisited.has(key)) return;

    gVisited.add(key);
    if (collectCellAt(r, c)) gCollectedCount++;

    redraw();
    requestQueueLive();
  }

  // --- P MODE: drag-to-place ---
  if (mode === 'P' && pDragging){
    const [r,c] = mouseRC();
    if (!inBounds(r,c)) return;
    const key = keyFor(r, c);
    if (!pVisited) pVisited = new Set();
    if (pVisited.has(key)) return;

    pVisited.add(key);
    if (placeCellAt(r, c)) pPlacedCount++;

    redraw();
    requestQueueLive();
  }

  // move-mode ghosts/previews
  if (mode === 'move') {
    if (eSelectMode === 'drag' && dragging) {
      redraw();
      return;
    }
    if (eSelectMode === 'line' && eLineAnchor){
      const [rr,cc] = mouseRC();
      if (!inBounds(rr,cc)) return;
      eLineDrag = { r: rr, c: cc };
      redraw();
      return;
    }
  }

  // dragging a locked source line → update ghost
  if (mode === 'move' && eSelectMode === 'line' && eLineMove){
    const [rr, cc] = mouseRC();
    if (!inBounds(rr, cc)) return;
    const ghost = makeDstLineFromStart(eLineSrc, rr, cc);
    if (ghost) {
      eLineMoveGhost = ghost;
      redraw();
    }
    return;
  }
}

function mouseReleased() {
  // Finish collect-mode drag session
  if (mode === 'collect' && gDragging) {
    gDragging = false;
    gVisited = null;

    redraw();
    requestQueueLive();

    coreSetStatus(
      gCollectedCount > 0
        ? `Collected ${gCollectedCount} cell${gCollectedCount>1?'s':''}. Queue: ${popQueue.length}`
        : 'No cells collected.'
    );
    gCollectedCount = 0;
    return;
  }

  // --- P MODE: finish drag-to-place ---
  if (mode === 'P' && pDragging){
    pDragging = false;
    pVisited = null;

    // live updates happened during drag; one final consolidated UI refresh
    refreshAllUI();

    coreSetStatus(
      pPlacedCount > 0
        ? `Placed ${pPlacedCount} cell${pPlacedCount>1?'s':''}. Queue: ${popQueue.length}`
        : (popQueue.length === 0
            ? 'Queue empty.'
            : 'No placements (try empty, unlocked cells).')
    );
    pPlacedCount = 0;
    return;
  }

  if (mode === 'move') {
    // DRAG drop
    if (eSelectMode === 'drag' && dragging) {
      const [dr, dc] = mouseRC();
      if (!inBounds(dr, dc)) { dragging = null; return coreSetStatus('Canceled (outside board).'); }
      const srcK = keyFor(dragging.r, dragging.c);
      if (lockedCells.has(srcK)) { dragging = null; return coreSetStatus('Source locked (guide).', '#B00020'); }

      const dstK = keyFor(dr, dc);
      if (lockedCells.has(dstK)) { dragging = null; return coreSetStatus('Destination locked (guide).', '#B00020'); }
      if (dragging.r === dr && dragging.c === dc) { dragging = null; return coreSetStatus('No move.'); }

      if (holes.has(dstK)) {
        gridRGB[dr][dc] = dragging.rgb;
        holes.delete(dstK); holes.add(srcK);
        dragging = null;

        refreshAllUI();
        redraw();
        return coreSetStatus('Moved.');
      }

      // swap
      const tmp = gridRGB[dr][dc];
      gridRGB[dr][dc] = dragging.rgb;
      gridRGB[dragging.r][dragging.c] = tmp;
      dragging = null;

      refreshAllUI();
      redraw();
      return coreSetStatus('Swapped.');
    }

    // DRAGGING a locked source line → release
    if (eSelectMode === 'line' && eLineMove){
      eLineMove = null;
      const dst = eLineMoveGhost; 
      eLineMoveGhost = null;

      if (dst && applyLineMoveSwap(eLineSrc, dst)) {
        eLineSrc = dst; // keep the selection locked at the new location
        refreshAllUI();
        redraw();
        return coreSetStatus('Moved line.');
      } else {
        redraw();
        return coreSetStatus('Cannot move line there.', '#B00020');
      }
    }

    // Finish sizing the source line (lock it; don’t move/swap yet)
    if (eSelectMode === 'line' && eLineAnchor){
      const line = makeLineFromDrag(eLineAnchor, eLineDrag || eLineAnchor);

      const cells = iterCells(line);
      if (touchesLocked(cells) || !allFilled(cells)){
        eLineAnchor = eLineDrag = null;
        coreSetStatus('Source must be filled and unlocked.', '#B00020');
        redraw();
        return;
      }

      eLineSrc = line;
      eLineAnchor = eLineDrag = null;
      coreSetStatus('Source line set. Click a destination start cell.');

      refreshPanel();
      redraw();
      return;
    }
  }
}

function keyPressed(){
  const k = window.key;
  // Mode switches
  if (k==='c'||k==='C'){ UIState.setMode('collect'); return; }
  if (k==='p'||k==='P'){ UIState.setMode('P');       return; }
  if (k==='m'||k==='M'){ UIState.setMode('move');    return; }

  // Cycle move selection modes
  if (k==='q'||k==='Q'){
    if (mode !== 'move') return;
    const order = ['drag','click','line'];
    const next = order[(order.indexOf(eSelectMode)+1)%order.length];
    UIState.setESelect(next);                // rebuilds pills + active + non-panel UI
    return;
  }

  // Peek (V)
  if (k==='v'||k==='V'){
    peek = true;
    refreshAllUI();  // update HUD immediately
    return redraw();
  }

  // Inspect toggle (X)
  if (k === 'x' || k === 'X') {
    inspect = !inspect;
    if (!inspect) inspectLightness = false; // turn off L when exiting Inspect

    // === new stacked-status updates ===
    Status.setFlag('inspect', inspect ? 'Inspect: ON' : null);
    Status.setFlag('inspectL', (inspect && inspectLightness) ? 'Inspect lightness: ON' : null);

    refreshAllUI();
    redraw();
    coreSetStatus(inspect ? 'Inspect ON' : 'Inspect OFF'); // optional flash
    return;
  }

  // Lightness layer (L) — only meaningful while inspect is ON
  if (k==='l'||k==='L'){
    if (!inspect) { coreSetStatus('Press X to enter Inspect first.', '#B00020'); return; }
    inspectLightness = !inspectLightness;
    Status.setFlag('inspectL', inspectLightness ? 'Inspect lightness: ON' : null);

    refreshAllUI(); 
    redraw();
    coreSetStatus(inspectLightness ? 'Inspect: lightness bands ON' : 'Inspect: lightness bands OFF');
    return;
  }

  // Diff (D)
  if (k==='d'||k==='D'){
    showDiff = !showDiff;
    refreshAllUI();
    return redraw();
  }

  // Zoom out
  if (k === '[' || k === '{') {
    zoomOut = true;
    refreshAllUI();
    const next = Math.max(LENGTH_MIN, LENGTH - ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars();                    // wrapper → UI.syncQueueCSSVars(LENGTH, ROWS)
      coreSetStatus(`Zoom: ${LENGTH}px/cell`);
      UI.HUD.pulseKey('[');
    }
    return;
  }

  // Zoom in
  if (k === ']' || k === '}') {
    zoomIn = true;
    refreshAllUI();
    const next = Math.min(MAX_LENGTH, LENGTH + ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars();
      coreSetStatus(`Zoom: ${LENGTH}px/cell`);
      UI.HUD.pulseKey(']');
    }
    return;
  }

  // Shuffle (S)
  if (k==='s'||k==='S'){
    shuffle = true;
    gridRGB = deepCopyGridRGB(originalRGB);
    boardPerm = buildShuffledPerm();
    gridRGB = applyPermToGrid(originalRGB, boardPerm);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    refreshAllUI();                           // queue + HUD changed; no panel rebuild
    coreSetStatus('Shuffled current from ORIGINAL.');
    UI.HUD.pulseKey('S');
    return;
  }

  // Check (T)
  if (k==='t'||k==='T'){
    checkme = true;
    if (popQueue.length>0) return coreSetStatus(`Not solved: queue ${popQueue.length}.`,'#B00020');
    if (holes.size>0)     return coreSetStatus(`Not solved: ${holes.size} empty cells.`,'#B00020');
    let mism=0;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
      if(!colorsEqual(gridRGB[r][c],originalRGB[r][c])) mism++;
    coreSetStatus(mism===0 ? '✅ Correct!' : '❌ Not yet: '+mism+' mismatches.',
                  mism===0 ? '#1B5E20' : '#B00020');
    UI.HUD.pulseKey('T');
    return;
  }

  // Reset to original (A)
  if (k==='a'||k==='A'){
    answerit = true;
    gridRGB = deepCopyGridRGB(originalRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    refreshAllUI();
    coreSetStatus('Reset to ORIGINAL.');
    UI.HUD.pulseKey('A');
    return;
  }

  // New Flow (F)
  if (k==='f'||k==='F'){
    applyThemeFlow();  // already refreshes UI + panel + redraw
    return;
  }

  // Guides: 0 Off, 1 Corners, 2 Borders
  if (k==='0'){ guideMode=0; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return coreSetStatus('guides: OFF'); }
  if (k==='1'){ guideMode=1; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return coreSetStatus('guides: corners'); }
  if (k==='2'){ guideMode=2; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return coreSetStatus('guides: borders'); }

  // Arrow key nudging for locked source line in move / line
  if (mode === 'move' && eSelectMode === 'line' && eLineSrc) {
    let dr = 0, dc = 0;
    if (k === 'ArrowUp')    dr = -1;
    if (k === 'ArrowDown')  dr = +1;
    if (k === 'ArrowLeft')  dc = -1;
    if (k === 'ArrowRight') dc = +1;

    if (dr !== 0 || dc !== 0) {
      const start = lineStart(eLineSrc);
      if (start) {
        const dst = makeDstLineFromStart(eLineSrc, start.r + dr, start.c + dc);
        if (dst && applyLineMoveSwap(eLineSrc, dst)) {
          eLineSrc = dst;                         // keep selection at new location
          refreshAllUI();                         // HUD/header/queue tiles
          redraw();
          return coreSetStatus('Moved line.');
        } else {
          return coreSetStatus('Blocked.', '#B00020');
        }
      }
    }
  }

  // Escape cancels transient E selections
  if (k === 'Escape'){
    if (dragging || eLineAnchor || eLineSrc){
      dragging = null; eLineAnchor = null; eLineDrag = null; eLineSrc = null;
      coreSetStatus('Selection canceled.');
      refreshPanel();                            // pills/hints copy changes
      redraw();
      return;
    }
  }
}

function keyReleased(){
  const k = window.key;
  if (k==='v'||k==='V'){
    peek = false;
    refreshAllUI();
  }
  redraw();
}

/* ============ p5 helpers ============ */
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

// Let p5 (global mode) see these handlers when using ES modules
Object.assign(window, {
  setup,
  draw,
  mousePressed,
  mouseDragged,
  mouseReleased,
  keyPressed,
  keyReleased,
});

