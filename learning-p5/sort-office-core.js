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
import { dockStatus } from './sort-office-ui.js';
import { enableHudFauxScroll } from './sort-office-ui.js';
import { enableHudFauxDrag } from './sort-office-ui.js';

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
let diffStroke = '#000000ff';    // stroke color for difference lines (default)
// === Diff overlay helpers (globals) ===
let origPos = new Map(); // rgbKey -> { r, c }, built from originalRGB
function rgbKey(rgb){ return rgb ? `${rgb[0]},${rgb[1]},${rgb[2]}` : null; }

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

// === line-mode move session (for drag + arrow keys) ===
let lineMoveSession = null;      // { srcLine, dr, dc }

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
// ===== Legacy status adapters (preserve your existing call sites) =====
(() => {
  // 1) Single-line, replaceable "now" message (what your old coresetstatus did)
  const TRANSIENT_KEY = 'now';
  if (typeof window.coreSetStatus !== 'function') {
    window.coreSetStatus = function(text, color) {
      Status.setFlag(TRANSIENT_KEY, text, color);
    };
  }
  if (typeof window.coreClearStatus !== 'function') {
    window.coreClearStatus = function() {
      Status.clearFlag(TRANSIENT_KEY);
    };
  }

  // 2) Mode/feature flags that should stay while active (X, L, D, etc.)
  // Use a namespaced key so each flag is independent and doesn't overwrite others
  if (typeof window.coreSetStatusFlag !== 'function') {
    window.coreSetStatusFlag = function(key, text, color) {
      // e.g., key = 'X' | 'L' | 'D' | 'inspect' | 'lightness' ...
      Status.setFlag(`flag:${key}`, text, color);
    };
  }
  if (typeof window.coreClearStatusFlag !== 'function') {
    window.coreClearStatusFlag = function(key) {
      Status.clearFlag(`flag:${key}`);
    };
  }

  // 3) (Optional) Simple helpers if you already toggle by letter:
  //    Use these only if it matches how your code already behaves.
  if (typeof window.coreToggleFlag !== 'function') {
    window.coreToggleFlag = function(key, onText, offText = '', colorOn = '#000', colorOff = '#000') {
      const k = `flag:${key}`;
      if (Status.flags.has(k)) Status.clearFlag(k);
      else Status.setFlag(k, onText, colorOn);
    };
  }
})();

// ----- Status (core owns simple state; UI renders it)
// ===== Simplified Status Manager (persistent stacked lines only) =====
const Status = {
  // key → { text?, html?, color? }
  flags: new Map(),

  setFlag(key, text, color = '#000') {
    if (text != null) this.flags.set(key, { text: String(text), color });
    else this.flags.delete(key);
    this.render();
  },

  setHTML(key, html, color = '#000') {
    if (html != null) this.flags.set(key, { html: String(html), color });
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
     const items = [];
     let i = 0;
     for (const [key, data] of this.flags.entries()) {
       if (!data) continue;
       const { text, html, color } = data;
       items.push({ key, text, html, color, _i: i++ }); // capture insertion index
     }
     // Lightweight priority: welcome first; everything else keeps insertion order
     const weight = (k) => (k === 'welcome' ? -100 : 0);
     items.sort((a, b) => (weight(a.key) - weight(b.key)) || (a._i - b._i));
     UI?.HUD?.setStatusList?.(items);
  }
};

// Back-compat helper for old `setStatus(...)` calls.
// (They just become a one-line “flag” under the key "flash".)
const ConstStatus = (() => {
  // Tracks which constant lines were manually dismissed for the *current* content.
  // Map<key, contentSignature> — if content changes, we allow it to show again.
  const dismissed = new Map();

  function signatureFrom(content) {
    // Simple, stable signature for comparison
    return String(content || '');
  }

  function set(key, text, color = '#000') {
    const sig = signatureFrom(text);
    const last = dismissed.get(key);
    if (last && last === sig) return;   // still dismissed for same content
    Status.setFlag(key, text, color);
  }

  function setHTML(key, html, color = '#000') {
    const sig = signatureFrom(html);
    const last = dismissed.get(key);
    if (last && last === sig) return;   // still dismissed for same content
    Status.setHTML(key, html, color);
  }

  function dismiss(key) {
    const data = Status.flags.get(key);
    const sig = signatureFrom(data?.html ?? data?.text ?? '');
    dismissed.set(key, sig);
    Status.clearFlag(key);
  }

  // Wire a single document-level click handler for [data-status-x]
  function wire() {
    if (wire._wired) return;
    wire._wired = true;

    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest?.('[data-status-x]');
      if (!btn) return;
      const key = btn.getAttribute('data-status-x');
      if (!key) return;
      dismiss(key);
    });
  }

  return { set, setHTML, dismiss, wire };
})();
function showWelcomeStatus() {
  
  const html = `
    <div class="welcome-block">
      <div class="welcome-title"><strong><em>WELCOME TO SORT OFFICE</em></strong></div>

      <div class="welcome-body">
      <div class="w-tip intro-w">get a grid of colors and sort it! 
      <br><br>
      press and hold V to see the correct sort for the grid you got
      <br><br>
      press C to take squares off the grid (right click to put squares back)
      </div>

      <br>

        <div class="w-tip soft-open">
          <div class="soft-body">click the rectangles at the top of the page for more tools</div>
         </div>
      <br>
        <div class="w-tip contact-sug">
        if at any point you feel confused, find something wrong, or have any suggestions - i'd love 
           to hear from you! :)
        </div>

        <div class="email-sug">• email me at <a href="mailto:yesandcynn@gmail.com">yesandcynn@gmail.com</a></div>
        <br>
        <div class="tips">tip: close this out with the red x at the top</div>
      </div>
    </div>
  `;
  // Permanent/dismissible constant line
  ConstStatus.setHTML('welcome', html, '#222');
}
// --- Constant "Guides" status line (always visible & dismissible)
function reflectGuideFlag() {
  const text =
    guideMode === 0 ? 'LOCKS ARE OFF' :
    guideMode === 1 ? 'CORNERS ARE LOCKED' :
                      'BORDERS ARE LOCKED                       (press 2 again to correct the borders if they lock incorrectly!)';

  // Use the ConstStatus wrapper so it can be dismissed with ×
  ConstStatus.set('guides', text);
}

function reflectInspectFlags() {
  Status.setFlag('inspect', inspect ? 'Inspect: ON' : null);
  Status.setFlag('inspectL', (inspect && inspectLightness) ? 'Inspect lightness: ON' : null);
}

function toggleInspect() {
  inspect = !inspect;
  if (!inspect) inspectLightness = false;
  reflectInspectFlags();
  // optional one-off toast:
  // coreSetStatus(inspect ? 'Inspect ON' : 'Inspect OFF');
  refreshAllUI();
  redraw();
}

function toggleLightness() {
  if (!inspect) { coreSetStatus('Press X to enter Inspect first.', '#B00020'); return false; }
  inspectLightness = !inspectLightness;
  reflectInspectFlags();
  // optional toast:
  // coreSetStatus(inspectLightness ? 'Inspect: lightness bands ON' : 'Inspect: lightness bands OFF');
  refreshAllUI();
  redraw();
  return true;
}



// to post status at most once per animation frame 
let _statusRAF = 0;
function coreSetStatusLive(text, color){
  if (_statusRAF) return;                 // already queued this frame
  _statusRAF = requestAnimationFrame(() => {
    _statusRAF = 0;
    coreSetStatus(text, color);
  });
}


// need to make sure all updateHUD() and refreshHUDKeys() are replaced with UI.HUD.refreshAll() or reflectHUD()
function reflectHUD(){
  UI.HUD.refreshAll({
    mode,
    guideMode,
    queueLen: popQueue.length,
    inspect,
    inspectLightness,
    showDiff,
    peek,
  });

  Status.render();        // still paints the stack
  reflectGuideFlag();     // keep constant "Guides" line synced
  showWelcomeStatus();    // calling the welcome message here
  


  Status.setFlag('diff', showDiff ? 'difference lines are ON!' : null);
}

function refreshUIElements() {
  reflectHUD();                // numbers + active key glows
  updateQueueHeaderByMode?.(); // (this forwards to UI.updateQueueHeader)
  renderQueueDOM?.();          // (this forwards to UI.renderQueueUI)
  refreshPanel?.();            // (QueuePanel.renderInfo + pills/hints)
}

// Allow UI (HUD + Legend) to synthesize p5 key presses
window.fireKeyDown = function(k) {
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyPressed === 'function') keyPressed();
  } finally {
    window.key = prev;
  }
};

window.fireKeyUp = function(k) {
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyReleased === 'function') keyReleased();
  } finally {
    window.key = prev;
  }
};


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
    const r0 = r;
    const c0 = c;
    const c1 = c + srcLine.len - 1;

    // block if any endpoint would be out of bounds
    if (r0 < 0 || r0 >= ROWS) return null;
    if (c0 < 0 || c1 >= COLS) return null;

    return { axis:'h', r0, c0, r1:r0, c1, len: srcLine.len };
  } else {
    const c0 = c;
    const r0 = r;
    const r1 = r + srcLine.len - 1;

    if (c0 < 0 || c0 >= COLS) return null;
    if (r0 < 0 || r1 >= ROWS) return null;

    return { axis:'v', r0, c0, r1, c1:c0, len: srcLine.len };
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

  // Commit a line move using per-step nudges so overlap is allowed.
  // Returns true if we progressed to the target; false if blocked.
  function commitLineMoveWithOverlap(srcLine, dstLine){
    if (!srcLine || !dstLine) return false;

    // current vs target starts
    let cur = lineStart(srcLine);
    const tgt = { r: dstLine.r0, c: dstLine.c0 };

    let progressed = false;

    // Move vertically first (same order you used before), then horizontally.
    while (cur.r !== tgt.r) {
      const step = (tgt.r > cur.r) ? 1 : -1;
      if (nudgeLineBy(srcLine, step, 0)) {
        cur = { r: cur.r + step, c: cur.c };
        // keep 'srcLine' aligned to its new spot
        srcLine = makeDstLineFromStart(srcLine, cur.r, cur.c);
        progressed = true;
      } else {
        // blocked vertically; stop trying vertical
        break;
      }
    }

    while (cur.c !== tgt.c) {
      const step = (tgt.c > cur.c) ? 1 : -1;
      if (nudgeLineBy(srcLine, 0, step)) {
        cur = { r: cur.r, c: cur.c + step };
        srcLine = makeDstLineFromStart(srcLine, cur.r, cur.c);
        progressed = true;
      } else {
        // blocked horizontally; stop trying horizontal
        break;
      }
    }

    return progressed && cur.r === tgt.r && cur.c === tgt.c;
  }


// transient state while dragging the locked line to move it
let eLineMove = null;       // truthy while you're dragging the locked line
let eLineMoveGhost = null;  // the candidate destination line (preview)

// Nudge a locked line by (dr, dc) exactly one step, allowing overlap.
// Blocks only at canvas borders or when destination touches locked cells.
function nudgeLineBy(srcLine, dr, dc) {
  if (!srcLine || (dr === 0 && dc === 0)) return false;

  // Build destination line with same axis/len, shifted by (dr,dc)
  const start = lineStart(srcLine);
  const dst = makeDstLineFromStart(srcLine, start.r + dr, start.c + dc);
  if (!dst) { coreSetStatus('Out of bounds.', '#B00020'); return false; }

  const srcCells = iterCells(srcLine);
  const dstCells = iterCells(dst);

  // Do not cross guides
  if (touchesLocked(dstCells)) {
    coreSetStatus('Touches locked guide.', '#B00020');
    return false;
  }

  // To handle overlap safely, iterate from the "far end" in the direction of travel
  // so we don't clobber values we still need to read.
  const L = srcCells.length;
  const idxs = [...Array(L).keys()];
  // moving right/down → process from end to start; left/up → start to end
  const movingPositive = (dc > 0) || (dr > 0);
  if (movingPositive) idxs.reverse();

  for (const i of idxs) {
    const s = srcCells[i], d = dstCells[i];
    const ks = keyFor(s.r, s.c), kd = keyFor(d.r, d.c);

    if (holes.has(kd)) {
      // MOVE into empty: destination takes source color; source becomes hole
      gridRGB[d.r][d.c] = gridRGB[s.r][s.c];
      holes.delete(kd);
      holes.add(ks);
    } else {
      // SWAP with filled
      const tmp = gridRGB[d.r][d.c];
      gridRGB[d.r][d.c] = gridRGB[s.r][s.c];
      gridRGB[s.r][s.c] = tmp;
    }
  }

  return true;
}

function cancelActiveSelection(reason = 'Selection cleared.', { keepLocked = false } = {}) {
  let changed = false;

  // DRAG (single cell)
  if (dragging) { dragging = null; changed = true; }

  // CLICK source
  if (eClickSrc) { eClickSrc = null; changed = true; }

  // LINE sizing ghost
  if (eLineAnchor || eLineDrag) { eLineAnchor = null; eLineDrag = null; changed = true; }

  // LINE move session + move ghost (arrow/drag previews)
  if (eLineMove || eLineMoveGhost || lineMoveSession) {
    eLineMove = null;
    eLineMoveGhost = null;
    lineMoveSession = null;
    changed = true;
  }

  // Locked source line (the actual selection)
  if (!keepLocked && eLineSrc) { eLineSrc = null; changed = true; }

  if (changed) {
    refreshPanel?.();
    refreshNonPanelUI?.();
    redraw?.();
    coreSetStatus?.(reason);
  } else {
    coreSetStatus?.('Nothing to cancel.');
  }
}

/* =========== added diff lines logic ============ */
  function rebuildOrigPos(){
    origPos = new Map();
    for (let r = 0; r < ROWS; r++){
      for (let c = 0; c < COLS; c++){
        const rgb = originalRGB?.[r]?.[c];
        if (!rgb) continue;
        origPos.set(rgbKey(rgb), { r, c });
      }
    }
  }
  function hasCell(r,c){
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return false;
    if (holes.has(keyFor(r,c))) return false;
    return !!gridRGB?.[r]?.[c];
  }

  function isAbsolutelyCorrect(r,c){
    if (!hasCell(r,c)) return false;
    const orig = origPos.get(rgbKey(gridRGB[r][c]));
    return !!orig && orig.r === r && orig.c === c;
  }

  // Are (r1,c1) and (r2,c2) the correct relative neighbors, i.e. their
  // original delta equals their current delta?
  function isRelativelyAdjacent(r1,c1,r2,c2){
    if (!hasCell(r1,c1) || !hasCell(r2,c2)) return false;

    const a = origPos.get(rgbKey(gridRGB[r1][c1]));
    const b = origPos.get(rgbKey(gridRGB[r2][c2]));
    if (!a || !b) return false;

    const drNow = r2 - r1, dcNow = c2 - c1;
    const drWas = b.r - a.r, dcWas = b.c - a.c;
    return (drNow === drWas) && (dcNow === dcWas);
  }

  // Interior = wrong absolute spot, but has correct relative neighbor on both sides
  // along either axis (vertical run OR horizontal run).
  function isInteriorOfRelativeRun(r,c){
    if (!hasCell(r,c)) return false;
    if (isAbsolutelyCorrect(r,c)) return false;

    // vertical run interior?
    const vUp   = isRelativelyAdjacent(r, c, r-1, c);
    const vDown = isRelativelyAdjacent(r, c, r+1, c);
    if (vUp && vDown) return true;

    // horizontal run interior?
    const hLeft  = isRelativelyAdjacent(r, c, r, c-1);
    const hRight = isRelativelyAdjacent(r, c, r, c+1);
    if (hLeft && hRight) return true;

    return false;
  }

// Draw perimeter-only differences per edge (no interior seams)
function drawDifferencesOverlay(){
  noFill();
  stroke(diffStroke); // was '#111 changed to give user option to change diff lines stroke coloe in queue panel !!
  strokeWeight(2);

  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      if (!hasCell(r,c)) continue;

      // Only consider misplaced cells
      if (isAbsolutelyCorrect(r,c)) continue;

      drawCellEdges(r, c);
    }
  }
}
function drawCellEdges(r, c){
  const x = c * LENGTH;
  const y = r * LENGTH;

  // For each cardinal edge, draw iff the neighbor across that edge is NOT
  // a correct relative neighbor (i.e., it's boundary or mismatch).
  if (shouldDrawEdge(r, c, -1,  0)) line(x,       y,        x+LENGTH, y);              // top
  if (shouldDrawEdge(r, c,  1,  0)) line(x,       y+LENGTH, x+LENGTH, y+LENGTH);       // bottom
  if (shouldDrawEdge(r, c,  0, -1)) line(x,       y,        x,         y+LENGTH);      // left
  if (shouldDrawEdge(r, c,  0,  1)) line(x+LENGTH,y,        x+LENGTH,  y+LENGTH);      // right
}
function shouldDrawEdge(r, c, dr, dc){
  const nr = r + dr, nc = c + dc;

  // If the neighbor is off-grid or empty, this edge is on the outer boundary.
  if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return true;
  if (!hasCell(nr, nc)) return true;

  // Hide seams where neighbors are in the correct *relative* order.
  // (Interior of a correctly-ordered run.)
  if (isRelativelyAdjacent(r, c, nr, nc)) return false;

  // Otherwise, show the edge: it's between different blocks (or a correct vs. misplaced tile).
  return true;
}

  /* ======end===== added diff lines logic ============ */

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
    eSelectMode,
    showDiff,
    diffStroke,
  };
}


/* ============ Initialize Queue Panel ============ */
// once at startup (after DOM ready)
QueuePanel.init({
  readStateFn: readUIState,
  onSetESelectFn: (em) => UIState.setESelect(em),
  onSetDiffStrokeFn: (c) => UIState.setDiffStroke(c),
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

    QueuePanel?.renderInfo?.();
    QueuePanel?.refreshEPillsActive?.();

    updateQueueHeaderByMode?.();
    renderQueueDOM?.();
    reflectHUD?.();
  },

  setDiffStroke(color){
    if (!color) return;
    diffStroke = color;
    redraw(); // update overlay immediately
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
    if (!rgb) return; // guard against OOB or missing cells
    let [h,s,v] = rgbToHSV(rgb[0], rgb[1], rgb[2]);
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
  } /* else {
    coreSetStatus?.('Guides enforced by relocation.');
  } */
 //commented out the above status for guides !! was used to test whether or not the guides forced the reltocation of cells bc they were previously 
 //duplicating instead of moving !!

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
  UI.HUD.init();                 // cache HUD nodes and prep hotkey target
  renderHUDContent();            // wrapper → UI.renderHUDLists()
  enableHudCollapsers();         // collapsible HUD sections
  enableHudExtraPanels();        // collapsible status + slider subpanels
  dockStatus('auto'); // auto menas data-nodock=true is tagged in html status div !!!!! otherwise behaves like 'queue'
  enableHudFauxScroll();
  enableHudFauxDrag();           // press + drag to scroll

  // 2) Canvas
  pixelDensity(1);
  noSmooth();
  const cnv = createCanvas(COLS * LENGTH, ROWS * LENGTH);
  cnv.parent('canvas-holder');
  cnv.elt.tabIndex = 0;
  cnv.elt.focus();
  cnv.elt.addEventListener('contextmenu', (e) => e.preventDefault());
  noLoop();

  // Queue CSS vars (tile size & rows)
  syncQueueCSSVars(); // wrapper → UI.syncQueueCSSVars(LENGTH, ROWS)

  // 3) Initial state
  mode = 'move';
  guideMode = 0; // off by default

  // 4) Theme + board (recomputes thresholds & enforces guides)
  applyThemeFlow({ reuseTheme:false, preserveLayout:false });

  // NEW: build lookup from original board
  rebuildOrigPos();

  // 5) Queue side panel (pills + hints)
  QueuePanel.init({
    readStateFn: readUIState,
    onSetESelectFn: (em) => UIState.setESelect(em),

    onSetDiffStrokeFn: (c) => UIState.setDiffStroke(c),
  });

    ConstStatus.wire('#hud-status');
    showWelcomeStatus();    // calling the welcome message here
    // After guideMode or theme are set
    reflectGuideFlag();
    
    

  // 6) HUD hotkeys (V hold, X/L toggles, etc.)
  UI.HUD.wireHotkeys({
    onKeyDownShot: (k) => fireKeyDown(k),
    onKeyUpShot:   (k) => fireKeyUp(k),

    onToggleInspect:   () => toggleInspect(),
    onToggleLightness: () => toggleLightness(),

    onRefreshUI: () => { refreshAllUI(); refreshPanel(); },
    onRedraw:    () => redraw(),
    onStatus:    (msg, color) => coreSetStatus(msg, color),
  });

  // 6.5) Sync legend labels from HUD, then wire the legend buttons
  UI.Legend?.syncLabelsFromHUD?.();

  // Wire the legend (buttons call into the same callbacks as HUD)
    UI.Legend?.wire?.({
      onKeyDownShot: (k) => fireKeyDown(k),
      onKeyUpShot:   (k) => fireKeyUp(k),

      // ✅ Call the shared helpers so flags update too
      onToggleInspect:   () => { toggleInspect(); return true; },
      onToggleLightness: () => { return toggleLightness(); }, // returns false if not in Inspect

      onRefreshUI: () => { refreshNonPanelUI?.(); refreshPanel(); },
      onRedraw:    () => redraw(),
      onStatus:    (m, c) => coreSetStatus(m, c)
    });

  // If your checkbox isn’t pre-checked in HTML, the bands stay hidden.
  // Either check it in HTML, or force the classes here on first load:
  const legendHost = document.getElementById('key-legend'); //ASK
  const labelToggle = document.getElementById('legend-label-toggle'); //ASK

  // Respect checkbox state (or force both classes in dev)
if (legendHost && labelToggle && labelToggle.checked) {
  legendHost.classList.add('show-labels', 'diagram');
}

  UI.Legend?.observeResize?.();

  // Build the diagram AFTER layout settles (double rAF)
if (legendHost && legendHost.classList.contains('show-labels')) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => UI.Legend?.refreshDiagram?.());
  });
}

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
      // build lookup from original board
      rebuildOrigPos();
    }
  });

  // 8) First paint of HUD + queue + panel
  refreshAllUI();   // HUD numbers/labels + key glows + queue header/tiles
  refreshPanel();   // panel markup + active pill
}

function draw(){
  // for now - just setting the background to the same as
  // ==== --bg-slate: #E5E5E5; === (in css) - just gotta make sure i 
  // keep coming back to update whenever needed or fix in future
  background('#E5E5E5');

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

// diff outlines (group-aware: hide interior seams)
if (showDiff && !peek){
  drawDifferencesOverlay();
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


  // === Right-click places from queue (with drag support) ===  
  if (window.mouseButton === window.RIGHT) {
    const k = keyFor(r, c);
    if (lockedCells.has(k))   { coreSetStatus('Destination locked (guide).', '#B00020'); return; }
    if (!holes.has(k))        { coreSetStatus('Pick an empty cell to place.', '#B00020'); return; }
    if (popQueue.length === 0){ coreSetStatus('Queue empty.', '#B00020'); return; }

    // begin right-drag-to-place session
    pDragging = true;
    pVisited  = new Set();
    pPlacedCount = 0;

    // attempt initial placement
    const key = keyFor(r, c);
    if (!pVisited.has(key)) {
      pVisited.add(key);
      if (placeCellAt(r, c)) {
        pPlacedCount++;
      }
    }
    // 🔹 LIVE status (placing)
    const sP = pPlacedCount === 1 ? '' : 's';
    coreSetStatusLive(`Placing ${pPlacedCount} cell${sP}… Queue: ${popQueue.length}`);

    // live visual + queue panel feedback
    redraw();
    requestQueueLive?.();
    return; // consume right-click
  }

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

    // 🔹 LIVE status (collecting)
    const sC = gCollectedCount === 1 ? '' : 's';
    coreSetStatusLive(`Collecting ${gCollectedCount} cell${sC}… Queue: ${popQueue.length}`);

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

    // If a source line is locked, allow grabbing it to move (live translate)
    if (mode === 'move' && eSelectMode === 'line' && eLineSrc){
      const [rr, cc] = [r, c];
      let inSrc = false;
      for (const cell of iterCells(eLineSrc)) {
        if (cell.r === rr && cell.c === cc) { inSrc = true; break; }
      }
      if (inSrc) {
        const start = lineStart(eLineSrc);
        // Make sure we don't show both sizing + moving previews at once
        eLineAnchor = null;
        eLineDrag   = null;

        eLineMove = {
          started: true,
          moved: false,              // track whether we actually moved cells
          lastStart: { r: start.r, c: start.c }
        };
        // Seed the ghost with the current source so user sees what's “selected”
        eLineMoveGhost = { ...eLineSrc };
        // Reset any arrow-nudge accumulation from previous moves
        lineMoveSession = null;
        coreSetStatus('Drag to reposition line; release to apply. Use arrow keys to nudge.');
        redraw();
        return;
      }
    }

    // LINE: picking source (start sizing on press)
    if (eSelectMode === 'line'){
      if (isHoleOrLocked){ coreSetStatus('Pick a filled, unlocked tile.', '#B00020'); return; }
      // Starting to size a new line: clear any prior move ghost/session
      eLineMove       = null;
      eLineMoveGhost  = null;
      lineMoveSession = null;
      eLineAnchor = {r,c};
      eLineDrag   = {r,c};
      return;
    }
  }
}

function mouseDragged() {

  // right-drag-to-place
    //continue placing while right-dragging ===
  if (pDragging && window.mouseButton === window.RIGHT) {
    const [r,c] = mouseRC();
    if (!inBounds(r,c)) return;

    const key = keyFor(r, c);
    if (!pVisited) pVisited = new Set();
    if (pVisited.has(key)) return;

    // Only place into empty, unlocked cells and while queue has items
    if (!lockedCells.has(key) && holes.has(key) && popQueue.length > 0) {
      pVisited.add(key);
      if (placeCellAt(r, c)) {
        pPlacedCount++;

        // 🔹 LIVE status (placing)
        const sP = pPlacedCount === 1 ? '' : 's';
        coreSetStatusLive(`Placing ${pPlacedCount} cell${sP}… Queue: ${popQueue.length}`);

        // live updates
        redraw();
        requestQueueLive?.();
      }
    }
    return; // consume right-drag
  }

  // collect-mode drag-to-collect
  if (mode === 'collect' && gDragging) {
    const [r, c] = mouseRC();
    if (!inBounds(r, c)) return;
    const key = keyFor(r, c);
    if (!gVisited) gVisited = new Set();
    if (gVisited.has(key)) return;

      gVisited.add(key);
      if (collectCellAt(r, c)) {
        gCollectedCount++;

        // 🔹 LIVE status (collecting)
        const sC = gCollectedCount === 1 ? '' : 's';
        coreSetStatusLive(`Collecting ${gCollectedCount} cell${sC}… Queue: ${popQueue.length}`);
      }

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

  // LINE: while dragging a locked source line → update GHOST ONLY (no grid writes)
  if (mode === 'move' && eSelectMode === 'line' && eLineMove?.started) {
    const [rr, cc] = mouseRC();
    if (!inBounds(rr, cc)) return;
    const ghost = makeDstLineFromStart(eLineSrc, rr, cc);
    if (!ghost) return; // out of bounds → ignore
    eLineMoveGhost = ghost;              // visual preview only
    eLineMove.moved = true;
    coreSetStatus?.(`Pending move: ${ghost.r0 - eLineMove.lastStart.r},${ghost.c0 - eLineMove.lastStart.c}`);
    redraw?.();
    return;
  }
}

function mouseReleased() {

    // === finish right-drag placement ===
  if (pDragging) {
    pDragging = false;
    pVisited  = null;

    // queue + HUD refresh (one last pass is fine)
    refreshQueueLive?.();
    reflectHUD?.();   // calls UI.HUD.refreshAll({ …state })

    if (pPlacedCount > 0) {
      coreSetStatus(`Placed ${pPlacedCount} cell${pPlacedCount>1?'s':''}. Queue: ${popQueue.length}`);
    } else {
      coreSetStatus(popQueue.length === 0 ? 'Queue empty.' : 'No placements (try empty, unlocked cells).');
    }
    pPlacedCount = 0;
    return; // consume release
  }

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

   // LINE: commit drag-to-move in one shot (use ghost if present)
   if (eSelectMode === 'line' && eLineMove?.started) {
     // Prefer the ghost (matches what the user saw). If none, compute from pointer.
     let dst = eLineMoveGhost;
     if (!dst) {
       const [rr, cc] = mouseRC();
       if (!inBounds(rr, cc)) {
         eLineMove = null;
         eLineMoveGhost = null;
         redraw?.();
         return coreSetStatus('Canceled (outside board).');
       }
       dst = makeDstLineFromStart(eLineSrc, rr, cc);
     }
    if (dst) {
      const ok = commitLineMoveWithOverlap(eLineSrc, dst);
      coreSetStatus?.(ok ? 'Line moved.' : 'Move blocked.', ok ? undefined : '#B00020');
      if (ok) eLineSrc = dst;
      refreshNonPanelUI?.();
      redraw?.();
      } else {
        coreSetStatus('Move blocked.', '#B00020');
        redraw?.();
      }
      // Clear session either way
      eLineMove = null;
      eLineMoveGhost = null;
      return;
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

function keyIs(k, ...alts) {
  // Exact compare for special keys; case-insensitive for letters.
  if (!k) return false;
  for (const a of alts) {
    if (!a) continue;
    if (a.length === 1 && k.length === 1) { // letter-like
      if (k.toLowerCase() === a.toLowerCase()) return true;
    } else {
      if (k === a) return true; // exact for 'Escape', 'ArrowUp', '[', ']'
    }
  }
  return false;
}

function keyPressed() {
  const k = window.key; // p5 sets 'Escape', 'ArrowUp', '[', 'A', etc.
  // Mode switches
  if (keyIs(k,'C')) { UIState.setMode('collect'); return; }
  if (keyIs(k,'M')) { UIState.setMode('move');  coreSetStatus('press q to cycle through selection types');  return; }

  // Cycle move selection modes
  if (keyIs(k,'Q')){
    if (mode !== 'move') return;
    const order = ['drag','click','line'];
    const next = order[(order.indexOf(eSelectMode)+1) % order.length];
    UIState.setESelect(next);
    refreshAllUI();
    redraw();
    coreSetStatus(`Edit selection: ${next}`);
    UI.Keys.pulseKeyAll('Q');      // <-- pulse HUD + legend "Q"
    return;
  }

  // Peek (V)
  if (keyIs(k,'V')){
    peek = true;
    refreshAllUI();  // update HUD immediately
    return redraw();
  }

// Inspect toggle (X)
if (keyIs(k,'X')) {
  toggleInspect();
  return;
}

// Lightness layer (L) — only meaningful while inspect is ON
if (keyIs(k,'L')) {
  toggleLightness();  // handles the “press X first” message and returns
  return;
}

  // Diff (D)
  if (k==='d'||k==='D'){
    showDiff = !showDiff;
    refreshAllUI();   // HUD / key glows / statuses
    refreshPanel();   // 🔹 add this — rebuilds Queue Panel contents
    redraw();
    return;
  }

  // Zoom out
  if (keyIs(k,'[')) {
    zoomOut = true;
    refreshAllUI();
    const next = Math.max(LENGTH_MIN, LENGTH - ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars(); // wrapper → UI.syncQueueCSSVars(LENGTH, ROWS)
      coreSetStatus(`Zoom: ${LENGTH}px/cell`);
      UI.Keys.pulseKeyAll('[');
    }
    return;
  }

  // Zoom in
  if (keyIs(k,']')) {
    zoomIn = true;
    refreshAllUI();
    const next = Math.min(MAX_LENGTH, LENGTH + ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars();
      coreSetStatus(`Zoom: ${LENGTH}px/cell`);
      UI.Keys.pulseKeyAll(']');
    }
    return;
  }

  // Shuffle (S)
  if (keyIs(k,'S')){
    shuffle = true;
    gridRGB = deepCopyGridRGB(originalRGB);
    boardPerm = buildShuffledPerm();
    gridRGB = applyPermToGrid(originalRGB, boardPerm);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
     // Queue + grid changed, but don’t rebuild E-panel here
    refreshNonPanelUI();
    redraw(); // <— force repaint for HUD clicks
    coreSetStatus('Shuffled current from ORIGINAL.');
    UI.Keys.pulseKeyAll('S');
    return;
  }

  // Check (T)
  if (keyIs(k,'T')){
    checkme = true;
    if (popQueue.length>0) return coreSetStatus(`Not solved: queue ${popQueue.length}.`,'#B00020');
    if (holes.size>0)     return coreSetStatus(`Not solved: ${holes.size} empty cells.`,'#B00020');
    let mism=0;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
      if(!colorsEqual(gridRGB[r][c],originalRGB[r][c])) mism++;
    coreSetStatus(mism===0 ? '✅ Correct!' : '❌ Not yet: '+mism+' mismatches.',
                  mism===0 ? '#1B5E20' : '#B00020');
    UI.Keys.pulseKeyAll('T');
    return;
  }

  // Reset to original (A)
  if (keyIs(k,'A')){
    answerit = true;
    gridRGB = deepCopyGridRGB(originalRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    refreshNonPanelUI();
    redraw(); 
    coreSetStatus('Reset to ORIGINAL.');
    UI.Keys.pulseKeyAll('A');
    return;
  }

  // New Flow (F)
  if (keyIs(k,'F')){
    applyThemeFlow();  // already refreshes UI + panel + redraw
    // build lookup from original board
    rebuildOrigPos();
    refreshNonPanelUI();
    redraw();
    coreSetStatus('u just got fresh paint');
    UI.Keys.pulseKeyAll('F');        // <— add pulse for HUD feedback
    return;
  }

  // Guides: 0 Off, 1 Corners, 2 Borders
  if (k==='0'){ guideMode=0; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return /* coreSetStatus('guides: OFF'); */ }
  if (k==='1'){ guideMode=1; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return /* coreSetStatus('guides: corners'); */ }
  if (k==='2'){ guideMode=2; recomputeLockedCells(); enforceGuides(); refreshAllUI(); return /* coreSetStatus('guides: borders'); */ }

  // Arrow key nudging for locked source line — ghost only; commit on keyReleased
  if (mode === 'move' && eSelectMode === 'line' && eLineSrc) {
    let dr = 0, dc = 0;
    if (keyIs(k, 'ArrowUp'))    dr = -1;
    if (keyIs(k, 'ArrowDown'))  dr =  1;
    if (keyIs(k, 'ArrowLeft'))  dc = -1;
    if (keyIs(k, 'ArrowRight')) dc =  1;

    // Start / update an accumulated move session
    if (dr !== 0 || dc !== 0) {
      if (!lineMoveSession) {
        lineMoveSession = { srcLine: eLineSrc, dr: 0, dc: 0 };
      }
      lineMoveSession.dr += dr;
      lineMoveSession.dc += dc;

      const s = lineMoveSession.srcLine; // canonical start is s.r0/s.c0
      const ghost = makeDstLineFromStart(s, s.r0 + lineMoveSession.dr, s.c0 + lineMoveSession.dc);
      if (ghost) {
        // ensure move mode preview is active
        eLineMove = { started: true, moved: true, lastStart: { r: s.r0, c: s.c0 } };
        eLineMoveGhost = ghost;             // visual only; no grid mutation here
        coreSetStatus?.(`Pending move: ${lineMoveSession.dr},${lineMoveSession.dc}`);
        redraw?.();
      } else {
        // boundary hit → undo this step so ghost stays valid
        lineMoveSession.dr -= dr;
        lineMoveSession.dc -= dc;
      }
      return false; // prevent page scroll
    }
  }

    // Escape cancels E selections
  if (keyIs(k, 'Escape')) {
    cancelActiveSelection('Selection cleared.');
    coreSetStatus?.('let go of selection');  
    UI.Keys?.pulseKeyAll?.('Escape'); // optional visual feedback
    return false; // prevent default
  }

}

function keyReleased(){
  const k = window.key;

  // === Commit accumulated arrow nudges for line mode (single swap) ===
if (mode === 'move' && eSelectMode === 'line' && lineMoveSession){
  const { srcLine, dr, dc } = lineMoveSession;
  const dst = makeDstLineFromStart(srcLine, srcLine.r0 + dr, srcLine.c0 + dc);
  if (dst) {
    const ok = commitLineMoveWithOverlap(srcLine, dst);
    if (ok) {
      eLineSrc = dst;                // so you can keep nudging from the new spot
      coreSetStatus?.('Line moved.');
    } else {
      coreSetStatus?.('Move blocked.', '#B00020');
    }
  }
  lineMoveSession = null;
  eLineMove = null;
  eLineMoveGhost = null;
  refreshNonPanelUI?.();
  redraw?.();
  return false;
}

  // Your existing peek toggle release
  if (keyIs(k,'V')){
    peek = false;
    refreshNonPanelUI?.();
    redraw?.();
    return false;
  }

  redraw?.();
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

