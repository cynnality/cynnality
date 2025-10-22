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

/* ============ state arrays/sets and mode flags ============= */
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
function idxOf(r, c){ return r * COLS + c; }
function rcOf(idx){ return [ Math.floor(idx / COLS), idx % COLS ]; }

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

function wireContrastPanel(){
  const slSat = document.getElementById('sl-sat');
  const slGam = document.getElementById('sl-gam');
  const slMin = document.getElementById('sl-mind');
  const slBan = document.getElementById('sl-bands');

  const lbSat = document.getElementById('lbl-sat');
  const lbGam = document.getElementById('lbl-gam');
  const lbMin = document.getElementById('lbl-mind');
  const lbBan = document.getElementById('lbl-bands');

  // NEW (all optional; wire only if present)
  const slColSpan = document.getElementById('sl-colspan');   // 0..20
  const slVBandLo = document.getElementById('sl-vband-min'); // -5..0
  const slVBandHi = document.getElementById('sl-vband-max'); // 0..5
  const slVConstr = document.getElementById('sl-vcontrast'); // 1.0..1.2
  const slVGammaG = document.getElementById('sl-vgamma-gen');// 0.8..1.2

  const lbColSpan = document.getElementById('lbl-colspan');
  const lbVBandLo = document.getElementById('lbl-vband-min');
  const lbVBandHi = document.getElementById('lbl-vband-max');
  const lbVConstr = document.getElementById('lbl-vcontrast');
  const lbVGammaG = document.getElementById('lbl-vgamma-gen');

  // If none of the original sliders exist, bail (same behavior as before)
  if (!slSat || !slGam || !slMin || !slBan) return;

  // render-time update (no regeneration)
  const updRender = () => {
    SAT_SCALE = parseFloat(slSat.value);
    VAL_GAMMA = parseFloat(slGam.value);
    if (lbSat) lbSat.textContent = SAT_SCALE.toFixed(2);
    if (lbGam) lbGam.textContent = VAL_GAMMA.toFixed(2);
    redraw();
  };

  // gen-time update (regenerate with SAME theme)
  const updGen = () => {
    GEN_MIN_DELTA = parseFloat(slMin.value);
    GEN_BANDS     = parseInt(slBan.value, 10);

    if (slColSpan) GEN_V_COL_SPAN_MIN = parseFloat(slColSpan.value);
    if (slVBandLo) GEN_V_BAND_MIN     = parseFloat(slVBandLo.value);
    if (slVBandHi) GEN_V_BAND_MAX     = parseFloat(slVBandHi.value);
    if (slVConstr) GEN_V_CONTRAST     = parseFloat(slVConstr.value);
    if (slVGammaG) GEN_V_GAMMA_GEN    = parseFloat(slVGammaG.value);

    if (lbMin)     lbMin.textContent     = GEN_MIN_DELTA.toFixed(2);
    if (lbBan)     lbBan.textContent     = GEN_BANDS.toString();
    if (lbColSpan) lbColSpan.textContent = GEN_V_COL_SPAN_MIN.toFixed(0);
    if (lbVBandLo) lbVBandLo.textContent = GEN_V_BAND_MIN.toFixed(1);
    if (lbVBandHi) lbVBandHi.textContent = GEN_V_BAND_MAX.toFixed(1);
    if (lbVConstr) lbVConstr.textContent = GEN_V_CONTRAST.toFixed(2);
    if (lbVGammaG) lbVGammaG.textContent = GEN_V_GAMMA_GEN.toFixed(2);

    applyThemeFlow({ reuseTheme: true, preserveLayout: true });
  };

  // wire events (same pattern you use)
  slSat.oninput = updRender;
  slGam.oninput = updRender;

  slMin.oninput = updGen;
  slBan.oninput = updGen;

  if (slColSpan) slColSpan.oninput = updGen;
  if (slVBandLo) slVBandLo.oninput = updGen;
  if (slVBandHi) slVBandHi.oninput = updGen;
  if (slVConstr) slVConstr.oninput = updGen;
  if (slVGammaG) slVGammaG.oninput = updGen;

  // initial sync
  updRender();

}

/* ============ HUD (DOM only) // instructions type panel stuff / populating from html ============ */
let hudModeEl = null, hudGuideEl = null, hudQueueEl = null, hudStatusEl = null;
let hudInspectEl = null, hudDiffEl = null;

let statusMsg = '';
let statusColor = '#000000';
const guideModeLabel = () => guideMode===0 ? 'Off' : guideMode===1 ? 'corners' : 'borders';

function updateHUD(){
  // wont break if things are missing in html 
  if (hudModeEl)    hudModeEl.textContent   = mode;
  if (hudGuideEl)   hudGuideEl.textContent  = guideModeLabel();
  if (hudQueueEl)   hudQueueEl.textContent  = popQueue.length;
  if (hudInspectEl) hudInspectEl.textContent = inspect ? 'On' : 'Off';
  if (hudDiffEl)    hudDiffEl.textContent    = showDiff ? 'On' : 'Off';
  if (hudStatusEl)  hudStatusEl.textContent  = statusMsg;

  refreshHUDKeys(); // to get active states in the GUI HUD / pills
}

function setStatus(msg, col='#000000'){
  statusMsg = msg;
  statusColor = col;  // (style #hud-status via CSS later)
  updateHUD();        // safe even if some nodes are missing !!
  redraw();
}

// --- tiny helper to draw a white highlight around a cell ---
function highlightCell(rc){
  if (!rc) return;
  noFill();
  stroke('#ffffff');
  strokeWeight(3);
  rect(rc.c * LENGTH, rc.r * LENGTH, LENGTH, LENGTH);
}

/* ============ UTILS ============ */
const keyFor = (r,c)=>`${r},${c}`;
const rcFromKey = k => k.split(',').map(Number);
const inBounds = (r,c)=> r>=0 && r<ROWS && c>=0 && c<COLS;
const mouseRC = ()=> [Math.floor(mouseY / LENGTH), Math.floor(mouseX / LENGTH)];
const colorsEqual = (a,b)=> a[0]===b[0] && a[1]===b[1] && a[2]===b[2];
const deepCopyGridRGB = src => src.map(row=>row.map(rgb=>[rgb[0],rgb[1],rgb[2]]));

function buildShuffledPerm(){
  const n = ROWS * COLS;
  const perm = Array.from({length:n}, (_,i)=> i);
  // Fisher-Yates
  for (let i=n-1; i>0; i--){
    const j = Math.floor(Math.random() * (i+1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  return perm;
}

function applyPermToGrid(srcGrid, perm){
  const out = Array.from({length:ROWS}, ()=> Array(COLS));
  for (let dest=0; dest<perm.length; dest++){
    const src = perm[dest];
    const [dr,dc] = rcOf(dest);
    const [sr,sc] = rcOf(src);
    out[dr][dc] = srcGrid[sr][sc];  // copy color at source -> dest cell
  }
  return out;
}

function setKeyActive(keyChar, on) { // hud data key active css state is toggled here
  const el = document.querySelector(`.hud-key[data-key="${String(keyChar).toUpperCase()}"]`);
  if (!el) return;
  el.classList.toggle('active', !!on);
}
// -----------HERE - we setup the active states for the HUD keys - this is not UI wiring or updated injected HTML text !!! -------
function refreshHUDKeys() {  // edit the html injection text in renderHUDContent() function right before setup !!!!
  // modes
  setKeyActive('C', mode === 'collect');
  setKeyActive('P', mode === 'P');
  setKeyActive('M', mode === 'move');

  // hinting 
  setKeyActive('V', peek);      //  hold to show  active while pressed
  setKeyActive('X', inspect);   // toggle
  setKeyActive('L', inspect && inspectLightness);
  setKeyActive('D', showDiff);  // toggle

  // guides
  setKeyActive('0', guideMode === 0);
  setKeyActive('1', guideMode === 1);
  setKeyActive('2', guideMode === 2);

}

// --- HUD hotkey click wiring  ---
// firing keyPressed() with a synthetic key value
function fireKeyDown(k) {
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyPressed === 'function') keyPressed();
  } finally {
    window.key = prev;
  }
}

// firing keyReleased() with a synthetic key value
function fireKeyUp(k) {
  const prev = window.key;
  try {
    window.key = k;
    if (typeof keyReleased === 'function') keyReleased();
  } finally {
    window.key = prev;
  }
}

// After any HUD click - all UI bits to reflect the new state
function refreshUIElements() {
  updateHUD?.();                 // numbers/labels in the status box
  refreshHUDKeys?.();            // glow the HUD keys
  updateQueueHeaderByMode?.();   // queue header text
  renderQueueDOM?.();            // queue tiles
  refreshPanel?.();              // pills/tips for current mode
}

// Bind clicks (like press/hold for V) to .hud-key[data-key]
function wireHUDHotkeys() {
  const hud = document.getElementById('hud');
  if (!hud) return;

  let vIsDown = false;

  // mousedown handles “press” (hold key like V)
  hud.addEventListener('mousedown', (ev) => {
    const btn = ev.target.closest('.hud-key[data-key]');
    if (!btn) return;
    const k = (btn.getAttribute('data-key') || '').toUpperCase();

    // “hold to peek” for V — press on mousedown, release on mouseup/leave
    if (k === 'V') {
      vIsDown = true;
      fireKeyDown('V');
      refreshUIElements();
      ev.preventDefault();
      return;
    }

    // --- Inspect (X) toggle ---
    if (k === 'X') {
      inspect = !inspect;
      if (!inspect) inspectLightness = false; // turn off L when leaving inspect
      refreshNonPanelUI();
      redraw();
      setStatus(inspect ? 'Inspect ON' : 'Inspect OFF');
      ev.preventDefault();
      return;
    }

    // --- Lightness (L) toggle ---
    if (k === 'L') {
      if (!inspect) {
        setStatus('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault();
        return;
      }
      inspectLightness = !inspectLightness;
      refreshNonPanelUI();
      redraw();
      setStatus(inspectLightness ? 'Inspect: lightness bands ON' : 'Inspect: lightness bands OFF');
      ev.preventDefault();
      return;
    }

    // Shuffle

    // other keys: single-shot on mousedown is fine
    fireKeyDown(k);
    refreshUIElements();
    ev.preventDefault();
  });

  // mouseup releases V if it was held
  hud.addEventListener('mouseup', (ev) => {
    if (!vIsDown) return;
    const btn = ev.target.closest('.hud-key[data-key]');
    // Only trigger if we were holding V
    vIsDown = false;
    fireKeyUp('V');
    refreshUIElements();
    ev.preventDefault();
  });

  // if pointer leaves the HUD while holding V, also release
  hud.addEventListener('mouseleave', () => {
    if (!vIsDown) return;
    vIsDown = false;
    fireKeyUp('V');
    refreshUIElements();
  });

 // keyboard accessibility: Enter/Space toggles focused HUD key
  hud.addEventListener('keydown', (ev) => {
    const btn = ev.target.closest('.hud-key[data-key]');
    if (!btn) return;
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const k = (btn.getAttribute('data-key') || '').toUpperCase();

    // Mirror same logic as clicks for X and L
    if (k === 'X') {
      inspect = !inspect;
      if (!inspect) inspectLightness = false;
      refreshNonPanelUI();
      redraw();
      setStatus(inspect ? 'Inspect ON' : 'Inspect OFF');
      ev.preventDefault();
      return;
    }

    if (k === 'L') {
      if (!inspect) {
        setStatus('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault();
        return;
      }
      inspectLightness = !inspectLightness;
      refreshNonPanelUI();
      redraw();
      setStatus(inspectLightness ? 'Inspect: lightness bands ON' : 'Inspect: lightness bands OFF');
      ev.preventDefault();
      return;
    }

    // Normal single-shot behavior for other keys
    fireKeyDown(k);
    refreshUIElements();
    ev.preventDefault();
  });
}

function pulseHUDKey(keyChar, ms = 160){
  const el = document.querySelector(`.hud-key[data-key="${String(keyChar).toUpperCase()}"]`);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), ms);
}

function collectCellAt(r, c) {
  const k = keyFor(r, c);
  if (lockedCells.has(k)) return false; // guides are protected
  if (holes.has(k)) return false; // already removed
  const rgb = gridRGB[r][c];
  popQueue.push([rgb[0], rgb[1], rgb[2]]);
  holes.add(k);
  // keep DOM + header in sync
  QueuePanel.refresh();
  return true;
}

// Try to place one cell from the queue at (r,c)
// Returns true if placed, false otherwise.
function placeCellAt(r, c){
  if (!inBounds(r, c)) return false;
  const k = keyFor(r, c);
  if (lockedCells.has(k)) return false;  // respect guides
  if (!holes.has(k))      return false;  // must be empty to place
  if (popQueue.length === 0) return false;

  const rgb = popQueue.shift();      // take from front of queue
  gridRGB[r][c] = rgb;               // fill the hole
  holes.delete(k);                   // it’s no longer a hole
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
    setStatus('Touches locked guide.', '#B00020'); return false;
  }
  if (linesOverlap(srcLine, dstLine)){
    setStatus('Source/destination overlap.', '#B00020'); return false;
  }

  if (allHoles(dstCells)){
    // MOVE into empty
    for (let i=0;i<srcCells.length;i++){
      const s=srcCells[i], d=dstCells[i];
      const ks=keyFor(s.r,s.c), kd=keyFor(d.r,d.c);
      gridRGB[d.r][d.c] = gridRGB[s.r][s.c];
      holes.delete(kd); holes.add(ks);
    }
    setStatus(`Moved source line ${srcLine.r},${srcLine.c} into empty destination.`);
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
    setStatus('Swapped line with destination.');
    return true;
  }

  setStatus('Destination must be all empty (move) or all filled (swap).', '#B00020');
  return false;
}

// return the first cell of a line (canonical "start")
// uses iterCells(line)
function lineStart(line){
  for (const cell of iterCells(line)) return cell;
  return null;
}

// transient state while dragging the locked line to move it
let eLineMove = null;       // truthy while you're dragging the locked line
let eLineMoveGhost = null;  // the candidate destination line (preview)

/* ===== Queue DOM (sidebar) ===== */
let qHolder = null, qNextWrap = null, qNextCell = null, qGrid = null;

// updating the queue header text depending on mode!
function updateQueueHeaderByMode() {
  const label = document.getElementById('queue-next-label'); 
  const hint  = document.getElementById('queue-help');     
  if (!label || !hint) return;

  if (mode === 'P') {
    if (popQueue.length > 0) { // P mode --- with queue
      label.textContent = 'click on an empty spot to place';
      hint.textContent  = 'this square';
    } 
    return;
  }

  if (mode === 'collect') {
    if (popQueue.length > 0) { // collect mode --- with queue
      label.textContent = 'you\'re collecting squares!';
      hint.textContent  = 'press P to start putting squares back on the grid';
    } else { // collect mode --- empty queue
      label.textContent = 'click on or drag mouse around grid to take squares off and collect them below';
      hint.textContent  = null;
    }
    return;
  }

  if (mode === 'move') {
    if (popQueue.length > 0) { // move mode --- with queue
      label.textContent = 'drag squares on the grid to move them around';
      hint.textContent  = null;
    } else { // move mode --- empty queue
      label.textContent = 'drag squares on the grid to move them around';
      hint.textContent  = 'check helper menu for more options!';
    }
    return;
  }
}

// keep CSS vars in sync when zoom changes
function syncQueueCSSVars(){
  const holder = document.getElementById('queue-holder');
  const grid   = document.getElementById('queue-grid');
  if (holder) holder.style.setProperty('--tile', `${LENGTH}px`);
  if (grid)   grid.style.setProperty('--rows', `${ROWS}`);
}

/** Render the queue into the DOM.
 *  - popQueue[0] → #queue-next .queue-cell
 *  - popQueue[1..] → #queue-grid (wrapping by CSS)
 */
function renderQueueDOM() {
  const nextWrap = document.getElementById('queue-next');
  const nextCell = nextWrap ? nextWrap.querySelector('.queue-cell') : null;
  const gridEl   = document.getElementById('queue-grid');
  if (!nextWrap || !gridEl) return;

  // Show/hide first tile
  if (popQueue.length > 0) {
    const [r,g,b] = popQueue[0];
    nextWrap.style.display = '';
    if (nextCell) {
      nextCell.style.background   = `rgb(${r} ${g} ${b})`;
      nextCell.style.border       = '1px solid #000';
      nextCell.style.borderRadius = '4px';
      nextCell.removeAttribute('data-empty');
    }
  } else {
    nextWrap.style.display = 'none';
    if (nextCell) {
      nextCell.style.background = 'transparent';
      nextCell.setAttribute('data-empty', 'true');
    }
  }

  // Rebuild remainder
  gridEl.textContent = '';
  if (popQueue.length > 1) {
    const frag = document.createDocumentFragment();
    for (let i = 1; i < popQueue.length; i++) {
      const [r,g,b] = popQueue[i];
      const d = document.createElement('div');
      d.className = 'queue-cell';
      d.style.background = `rgb(${r} ${g} ${b})`;
      frag.appendChild(d);
    }
    gridEl.appendChild(frag);
  }

  // HUD number
  if (hudQueueEl) hudQueueEl.textContent = popQueue.length;
}

/* ================= QueuePanel: mode-aware helper ================= */
/* ============ UI PANELS ============ */
const QueuePanel = (() => {
  let infoEl, nextWrap, nextCell, gridEl;
  let pillsBound = false; // ensure we attach click handler only once

  function init() {
    infoEl   = document.getElementById('queue-mode-info');
    nextWrap = document.getElementById('queue-next');
    nextCell = nextWrap?.querySelector('.queue-cell') || null;
    gridEl   = document.getElementById('queue-grid');

    // event delegation for selection-mode pills (bind once)
    if (infoEl && !pillsBound) {
      infoEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.emode-pill, .pill');
        if (!btn) return;
        const em = btn.dataset.emode;
        if (!em || mode !== 'move') return;
        UIState.setESelect(em);
      });

      pillsBound = true;
    }

    refresh();
  }

  function renderInfo() {
    if (!infoEl) return;

    if (mode === 'collect') {
      infoEl.innerHTML = `
        <div class="q-title">Collect mode</div>
        <div class="q-tip">click or drag across grid to take squares off the grid and collect them below</div>
      `;
      return;
    }

    if (mode === 'P') {
      const empty = popQueue.length === 0;
      infoEl.innerHTML = `
        <div class="q-title">Place mode</div>
        <div class="q-tip">${
          empty
            ? 'Queue is empty — press <span class="hud-key">G</span> and click a tile to collect.'
            : 'Click an empty spot on the grid to place the leftmost color.'
        }</div>
      `;
      return;
    }

    // move mode UI
    const srcPicked = eClickSrc
      ? `<div class="q-sub">source picked at <span class="q-pill">${eClickSrc.r},${eClickSrc.c}</span></div>`
      : '';
    const dstPicked = eLineSrc
      ? `<div class="q-sub">destination picked at <span class="q-pill">${eLineSrc.r},${eLineSrc.c}</span></div>`
      : '';

    // NOTE: keep your own hint copy; we only flip short sub-hints by active pill below.
    infoEl.innerHTML = `
      <div class="q-title">Edit mode</div>
      <div id="q-emode-pills" class="q-mode-toggle">
        <span class="emode-pill q-pill" data-emode="drag">drag</span>
        <span class="emode-pill q-pill" data-emode="click">click</span>
        <span class="emode-pill q-pill" data-emode="line">line</span>
      </div>
      <div id="q-emode-hints">
        <div class="q-tip emode-hint" data-emode="drag">Drag a tile to swap or move into a hole.</div>
        <div class="q-tip emode-hint" data-emode="click">Click a source tile, then click a destination (tile = swap, hole = move).</div>
        <div class="q-tip emode-hint" data-emode="line">Drag to size a row/column, then click a same-length destination line (all empty = move, all filled = swap).</div>
      </div>
      ${srcPicked}
      ${dstPicked}
    `;

    // reflect the active pill/hint now
    refreshEPillsActive();
  }

  // Toggle the active pill + its matching hint
  function refreshEPillsActive() {
    if (mode !== 'move' || !infoEl) return;
    const pills = infoEl.querySelectorAll('.emode-pill');
    const hints = infoEl.querySelectorAll('.emode-hint');
    pills.forEach(p => p.classList.toggle('active', p.dataset.emode === eSelectMode));
    hints.forEach(h => h.style.display = (h.dataset.emode === eSelectMode ? '' : 'none'));
  }

  function refresh() {
    renderInfo();               // helper text + pills + hints
    updateQueueHeaderByMode?.();// your header label/CTA
    renderQueueDOM?.();         // the actual colored queue tiles
  }

  return { init, refresh, renderInfo, refreshEPillsActive };
})();

/* ============ UI STATE FACADE ============ */
const UIState = {
  setMode(newMode){
    if (mode === newMode) return;
    mode = newMode;
    clearETransient?.();
    setStatus?.(`${newMode === 'move' ? `Move mode (${eSelectMode})` : `${newMode} mode`}.`);

    // ⬅️ Always rebuild the info pane for the new mode
    refreshPanel();
    // HUD/header/queue tiles (no panel rebuild here)
    refreshNonPanelUI?.();
    redraw();

    // If entering move, (re)build pills + hints before anything else
    if (mode === 'move') {
      QueuePanel?.renderInfo?.();
      QueuePanel?.refreshEPillsActive?.();
    }

    // Non-panel refreshers
    updateQueueHeaderByMode?.();
    renderQueueDOM?.();
    refreshHUDKeys?.();
    updateHUD?.();
  },

  setESelect(sel){
    if (eSelectMode === sel) {
      // Even if same, reflect pills (fixes “first click/Q press” edge)
      QueuePanel?.renderInfo?.();
      QueuePanel?.refreshEPillsActive?.();
      return;
    }
    eSelectMode = sel;
    clearETransient?.();
    setStatus?.(`Edit selection: ${eSelectMode}`);

    // Rebuild E-panel first, then reflect active pill
    QueuePanel?.renderInfo?.();
    QueuePanel?.refreshEPillsActive?.();

    // Non-panel refreshers
    updateQueueHeaderByMode?.();
    renderQueueDOM?.();
    refreshHUDKeys?.();
    updateHUD?.();
  },

  setHudKeyActive(keyName, on){
    const el = document.querySelector(`.hud-key[data-key="${keyName}"]`);
    if (el) el.classList.toggle('active', !!on);
  }
};

// Refresh HUD/labels/queue tiles, but DO NOT rebuild the E-mode panel markup
function refreshNonPanelUI(){
  updateQueueHeaderByMode?.();
  renderQueueDOM?.();
  refreshHUDKeys?.();
  updateHUD?.();
}

// Rebuild the move-mode panel (pills + hints), then reflect active pill
function refreshPanelMove(){
  if (mode !== 'move') return;
  QueuePanel?.renderInfo?.();
  QueuePanel?.refreshEPillsActive?.();
}

// Rebuild the queue-panel info for the *current* mode.
// If mode === 'move', also reflect the active E-selection pill.
function refreshPanel(){
  QueuePanel?.renderInfo?.();
  if (mode === 'move') {
    QueuePanel?.refreshEPillsActive?.();
  }
}

// Live queue-only refresh (header + queue tiles), throttled to rAF
let _queueRaf = null;
function refreshQueueLive(){
  updateQueueHeaderByMode?.();
  renderQueueDOM?.();
}
function requestQueueLive(){
  if (_queueRaf) return;
  if (typeof requestAnimationFrame === 'function') {
    _queueRaf = requestAnimationFrame(() => {
      _queueRaf = null;
      refreshQueueLive();
    });
  } else {
    // Fallback if rAF is unavailable
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
  enforceGuides();

  setStatus(`Theme: ${theme.name} --- guides: ${guideModeLabel()} --- Press C to check`);
  refreshNonPanelUI?.();
  refreshPanel?.();
  redraw();
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

/* ============ Guides (with relocation) ============ */
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
    setStatus(`Guides enforced; ${missing} target(s) missing their tile.`, '#B00020');
  } else {
    setStatus('Guides enforced by relocation.');
  }

  QueuePanel.refresh();
}

/* =====================MARKER FOR NEXT CODE BLOCK========================= */
// LETS ADD LITERALLY ALL APPLICABLE UI REFRESHERS HERE (rethink tomorrow)
function refreshAllUI() {
  updateHUD?.();                 // your existing HUD numbers/text
  refreshHUDKeys?.();            // your key “active” highlighting
  updateQueueHeaderByMode?.();   // your queue header label + hint
  renderQueueDOM?.();            // the colored tiles in the queue area
}

// !! to come back to ----- possible remove ?????
function emitUIRefresh(){
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(refreshAllUI);
  } else {
    setTimeout(refreshAllUI, 0);
  }
}

/* ============ P5 ============ */

/* ============ HUD DYNAMIC CONTENT ============ */
function renderHUDContent(){
  const sections = {
    modes: [
      {key:'M', label:'drag squares on the grid to move them around'},
      {key:'C', label:'click on squares to move them off the grid'},
      {key:'P', label:'after using C mode, place squares back onto the grid'},
    ],
    hinting: [
      {key:'V', label:'hold V to see solution'},
      {key:'X', label:'toggle categorical colors'},
      {key:'L', label:'toggle tinted categorical colors (while in X view)'},
      {key:'D', label:'toggle mismatch outlines'},
    ],
    guides: [
      {key:'0', label:'Off'},
      {key:'1', label:'locked corners'},
      {key:'2', label:'locked borders'},
    ],
    utility: [
      {key:']', label:'zoom in'},
      {key:'[', label:'zoom out'},
      {key:'S', label:'keeps current grid but shuffles all colors'},
      {key:'T', label:'checks to see if your sort is correct'},
      {key:'A', label:'answers the sort (RESETS MOVE / COLLECTIONS'},
      {key:'Esc', label:'cancel drag'},
      {key:'F', label:'new flow theme (WILL RESET PAGE AND LOSE ALL CHANGES!)'}
    ]
  };

  const renderList = (arr) => arr.map(item => `
    <div class="hud-item">
      <span class="hud-key" data-key="${item.key}">${item.key}</span>
      <span class="hud-item-label">${item.label}</span>
    </div>
  `).join('');

  const m = document.getElementById('hud-modes-list');
  const h = document.getElementById('hud-hinting-list');
  const g = document.getElementById('hud-guides-list');
  const u = document.getElementById('hud-utility-list');

  if (m) m.innerHTML = renderList(sections.modes);
  if (h) h.innerHTML = renderList(sections.hinting);
  if (g) g.innerHTML = renderList(sections.guides);
  if (u) u.innerHTML = renderList(sections.utility);
}
/*====================================================================*/
function setup(){
  // HUD text from schema
  renderHUDContent();

  // Canvas
  pixelDensity(1);
  noSmooth();
  const cnv = createCanvas(COLS * LENGTH, ROWS * LENGTH);
  cnv.parent('canvas-holder');
  cnv.elt.tabIndex = 0;
  cnv.elt.focus();
  noLoop();
  syncQueueCSSVars();

  // HUD hooks
  hudModeEl    = document.getElementById('hud-mode');
  hudGuideEl   = document.getElementById('hud-guide');
  hudQueueEl   = document.getElementById('hud-queue');
  hudStatusEl  = document.getElementById('hud-status');
  hudInspectEl = document.getElementById('hud-inspect');
  hudDiffEl    = document.getElementById('hud-diff');



  // Initial state
  mode = 'move';
  guideMode = 0; // off by default

  // *** IMPORTANT: initialize theme/grids FIRST ***
  // This creates originalRGB + gridRGB and clears holes/popQueue.
  applyThemeFlow();
  // sets custom thresholds
  computeLightnessThresholdsFromTheme(); 
  // Now it's safe to compute/lock guides against gridRGB
  recomputeLockedCells();
  enforceGuides();

  // Build QueuePanel once
  QueuePanel.init();

  // Non-panel UI first (HUD, header, queue tiles)
  refreshNonPanelUI?.();   // updateQueueHeaderByMode, renderQueueDOM, refreshHUDKeys, updateHUD

  // Build the panel for the current mode (E: pills; G/P: tips)
  refreshPanel?.();

  // Wire interactive controls
  wireHUDHotkeys();
  wireContrastPanel();

  syncQueueCSSVars();

  // Final pass so HUD/queue/panel reflect everything
  refreshNonPanelUI?.();
  refreshPanel?.();
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

  // ❌ Remove: QueuePanel.refresh() here
  // (rebuilding the panel from draw() causes pill active states to be lost)


/* ============ INPUT: MOUSE ============ */
function mousePressed(){
  const [r,c] = mouseRC(); if (!inBounds(r,c)) return;
  const k = keyFor(r,c);

  // -------- C MODE --------
  if (mode === 'collect') {
    // start drag-collect session
    gDragging = true;
    gVisited = new Set();
    gCollectedCount = 0;

    const key = keyFor(r,c);
    if (!gVisited.has(key)) {
      gVisited.add(key);
      if (collectCellAt(r, c)) gCollectedCount++;
    }
    // canvas + live queue feedback
    redraw();
    requestQueueLive();
  }

  // -------- P MODE --------
  // --- P MODE: start drag-to-place session ---
  if (mode === 'P'){
    // begin a drag-to-place session (batch UI until release)
    pDragging = true;
    pVisited  = new Set();
    pPlacedCount = 0;

    // attempt to place at the initial cell
    const key = keyFor(r, c);
    if (!pVisited.has(key)) {
      pVisited.add(key);
      if (placeCellAt(r, c)) {
        pPlacedCount++;
      }
    }

    // canvas + live queue feedback
    redraw();
    requestQueueLive();
  }

  // -------- move MODE --------
  if (mode === 'move') {
    const isHoleOrLocked = holes.has(k) || lockedCells.has(k);

    // DRAG start
    if (eSelectMode === 'drag') {
      if (holes.has(k))      return setStatus('Cannot drag an empty cell.', '#B00020');
      if (lockedCells.has(k)) return setStatus('Cell is locked by guide.', '#B00020');

      dragging = { r, c, rgb: [ gridRGB[r][c][0], gridRGB[r][c][1], gridRGB[r][c][2] ] };
      return setStatus('Dragging: drop on empty to move, on filled to swap. ESC to cancel.');
    }

    // CLICK–CLICK
    if (eSelectMode === 'click') {
      if (!eClickSrc) {
        if (holes.has(k))       return setStatus('Source cannot be an empty cell.', '#B00020');
        if (lockedCells.has(k)) return setStatus('Source is locked (guide).', '#B00020');

        eClickSrc = { r, c };

        // (was: QueuePanel.refresh(); redraw();)
        // We only need to rebuild the E panel (to show "source picked" line) and keep pills intact
        refreshPanel();
        redraw();

        return setStatus(`Source picked (${r},${c}). Click a destination.`);
      } else {
        if (eClickSrc.r === r && eClickSrc.c === c) {
          eClickSrc = null;

          // (was: QueuePanel.refresh(); redraw();)
          refreshPanel();
          redraw();

          return setStatus('Canceled source.');
        }

        const src = eClickSrc;
        const srcK = keyFor(src.r, src.c);
        const dstK = keyFor(r, c);
        if (lockedCells.has(dstK)) return setStatus('Destination locked (guide).', '#B00020');

        if (holes.has(dstK)) {
          gridRGB[r][c] = gridRGB[src.r][src.c];
          holes.delete(dstK); holes.add(srcK);
          eClickSrc = null;

          // grid+holes changed: update non-panel bits; panel text no longer needs "source"
          refreshNonPanelUI();
          refreshPanel();
          redraw();

          return setStatus('Moved.');
        }

        // swap
        const tmp = gridRGB[r][c];
        gridRGB[r][c] = gridRGB[src.r][src.c];
        gridRGB[src.r][src.c] = tmp;
        eClickSrc = null;

        refreshNonPanelUI();
        refreshPanel();
        redraw();

        return setStatus('Swapped.');
      }
    }

          // LINE: if a source line is already locked, this click chooses the destination
          if (eSelectMode === 'line' && eLineSrc){

            // If a source line is locked, allow grabbing it to move
      if (mode === 'move' && eSelectMode === 'line' && eLineSrc){
        const [rr, cc] = [r, c];
        // check if the click is inside the locked source line
        let inSrc = false;
        for (const cell of iterCells(eLineSrc)) {
          if (cell.r === rr && cell.c === cc) { inSrc = true; break; }
        }
        if (inSrc) {
          eLineMove = { grab: { r: rr, c: cc } };
          eLineMoveGhost = eLineSrc; // preview starts as current line
          setStatus('Drag to reposition line; release to apply. Use arrow keys to nudge.');
          redraw();
          return;
        }
      }

      const dst = makeDstLineFromStart(eLineSrc, r, c);
      if (!dst){ setStatus('Destination out of bounds.', '#B00020'); return; }

      if (applyLineMoveSwap(eLineSrc, dst)) {
        eLineSrc = null;

        // Update panel hint back to "drag to size …"
        refreshPanel();
        // Grid/holes may have changed -> non-panel UI
        refreshNonPanelUI();
        redraw();
      }
      return;
    }

    // LINE: picking source (start sizing on press)
    if (eSelectMode === 'line'){
      if (isHoleOrLocked){ setStatus('Pick a filled, unlocked tile.', '#B00020'); return; }
      eLineAnchor = {r,c};
      eLineDrag   = {r,c};  // start as 1-cell line
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

    // canvas + live queue feedback
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
    if (placeCellAt(r, c)) {
      pPlacedCount++;
    }
    // live visual + queue panel feedback
    redraw();
    requestQueueLive();
  }

  // move-mode ghosts/previews
  if (mode === 'move') {
    if (eSelectMode === 'drag' && dragging) {
      // draw() will show the white outline via highlightCell(dragging)
      redraw();
      return;
    }
    if (eSelectMode === 'line' && eLineAnchor){
      const [rr,cc] = mouseRC();
      if (!inBounds(rr,cc)) return;
      eLineDrag = { r: rr, c: cc };  // snapped in makeLineFromDrag() during draw()
      redraw();
      return;
    }
  }
  // If we are dragging a locked source line, update the ghost destination
  if (mode === 'move' && eSelectMode === 'line' && eLineMove){
    const [rr, cc] = mouseRC();
    if (!inBounds(rr, cc)) return;
    // Use your existing helper to make a same-length dst line from a new start
    const ghost = makeDstLineFromStart(eLineSrc, rr, cc);
    if (ghost) {
      eLineMoveGhost = ghost; // store for draw() preview and release
      redraw();
    }
    return;
  }

}

function mouseReleased() {
  // Finish collect-mode drag session (batch DOM updates here)
  if (mode === 'collect' && gDragging) {
    gDragging = false;
    gVisited = null;

    // canvas + live queue feedback
    redraw();
    requestQueueLive();
    
    setStatus(
      gCollectedCount > 0
        ? `Collected ${gCollectedCount} cell${gCollectedCount>1?'s':''}. Queue: ${popQueue.length}`
        : 'No cells collected.',
    );
    gCollectedCount = 0;
    return;
  }

    // --- P MODE: finish drag-to-place ---
  if (mode === 'P' && pDragging){
    pDragging = false;
    pVisited = null;

    // live updates were already applied during drag; one last paint is fine
    refreshQueueLive();
    // updateHUD here to be show things other than the queue in the panel / GUI 
    updateHUD?.();

    setStatus(
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
      if (!inBounds(dr, dc)) { dragging = null; return setStatus('Canceled (outside board).'); }
      const srcK = keyFor(dragging.r, dragging.c);
      if (lockedCells.has(srcK)) { dragging = null; return setStatus('Source locked (guide).', '#B00020'); }

      const dstK = keyFor(dr, dc);
      if (lockedCells.has(dstK)) { dragging = null; return setStatus('Destination locked (guide).', '#B00020'); }
      if (dragging.r === dr && dragging.c === dc) { dragging = null; return setStatus('No move.'); }

      if (holes.has(dstK)) {
        gridRGB[dr][dc] = dragging.rgb;
        holes.delete(dstK); holes.add(srcK);
        dragging = null;

        // grid/holes changed, but no panel text change -> non-panel only
        refreshNonPanelUI();
        redraw();
        return setStatus('Moved.');
      }

      // swap
      const tmp = gridRGB[dr][dc];
      gridRGB[dr][dc] = dragging.rgb;
      gridRGB[dragging.r][dragging.c] = tmp;
      dragging = null;

      refreshNonPanelUI();
      redraw();
      return setStatus('Swapped.');
    }

    // If we were dragging the locked source line, attempt the move/swap on release
      if (mode === 'move' && eSelectMode === 'line' && eLineMove){
        eLineMove = null;
        const dst = eLineMoveGhost; 
        eLineMoveGhost = null;

        if (dst && applyLineMoveSwap(eLineSrc, dst)) {
          // Keep the selection locked at the new location for further moves
          eLineSrc = dst;

          // Grid/holes may have changed -> non-panel UI
          refreshNonPanelUI?.();
          redraw();
          return setStatus('Moved line.');
        } else {
          redraw();
          return setStatus('Cannot move line there.', '#B00020');
        }
      }

    // Finish sizing the source line (don’t move/swap yet)
    if (eSelectMode === 'line' && eLineAnchor){
      const line = makeLineFromDrag(eLineAnchor, eLineDrag || eLineAnchor);

      // Validate source
      const cells = iterCells(line);
      if (touchesLocked(cells) || !allFilled(cells)){
        eLineAnchor = eLineDrag = null;
        setStatus('Source must be filled and unlocked.', '#B00020');
        redraw();
        return;
      }

      eLineSrc = line;           // lock it in as the source
      eLineAnchor = eLineDrag = null;
      setStatus('Source line set. Click a destination start cell.');

      // Panel hint changes (“click a destination …”)
      refreshPanel();
      redraw();
      return;
    }
  }
}

/* ============ INPUT: KEYS ============ */
function keyPressed(){
  // Mode switches
  if (key==='c'||key==='C'){ UIState.setMode('collect'); return; }
  if (key==='p'||key==='P'){ UIState.setMode('P'); return; }
  if (key==='m'||key==='M'){ UIState.setMode('move'); return; }

  // Cycle move selection modes
  if (key==='q'||key==='Q'){
    if (mode !== 'move') return;
    const order = ['drag','click','line'];
    const next = order[(order.indexOf(eSelectMode)+1)%order.length];
    UIState.setESelect(next);        // handles rebuild pills + active + non-panel UI
    return;
  }

  // Peek (V)
  if (key==='v'||key==='V'){ 
    peek = true; 
    refreshNonPanelUI();  // update HUD immediately
    return redraw(); 
  }

// Inspect toggle (X)
if (key==='x'||key==='X'){
  inspect = !inspect;
  if (!inspect) inspectLightness = false; // turn off L layer when exiting inspect
  refreshNonPanelUI(); // just HUD/labels; panel doesn't change for inspect
  redraw();
  return setStatus(inspect ? 'Inspect ON' : 'Inspect OFF');
}

// Lightness layer (L) — only meaningful while inspect is ON
if (key==='l'||key==='L'){
  if (!inspect) { setStatus('Press X to enter Inspect first.', '#B00020'); return; }
  inspectLightness = !inspectLightness;
  refreshNonPanelUI();
  redraw();
  return setStatus(inspectLightness ? 'Inspect: lightness bands ON' : 'Inspect: lightness bands OFF');
}

  // Diff (D)
  if (key==='d'||key==='D'){ 
    showDiff = !showDiff; 
    refreshNonPanelUI(); 
    return redraw(); 
  }

  // Zoom out
  if (key === '[' || key === '{') {
    zoomOut = true;
    refreshNonPanelUI();
    const next = Math.max(LENGTH_MIN, LENGTH - ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars(); // keep the right-side queue tiles in sync
      setStatus(`Zoom: ${LENGTH}px/cell`);
      pulseHUDKey('[');
    }
    return;
  }

  // Zoom in
  if (key === ']' || key === '}') {
    zoomIn = true;
    refreshNonPanelUI();
    const next = Math.min(MAX_LENGTH, LENGTH + ZOOM_STEP);
    if (next !== LENGTH) {
      LENGTH = next;
      resizeCanvas(COLS * LENGTH, ROWS * LENGTH);
      syncQueueCSSVars();
      setStatus(`Zoom: ${LENGTH}px/cell`);
      pulseHUDKey(']');
    }
    return;
  }

  // Shuffle (S)
  if (key==='s'||key==='S'){
    shuffle = true; 
    gridRGB = deepCopyGridRGB(originalRGB);
    boardPerm = buildShuffledPerm();
    gridRGB = applyPermToGrid(originalRGB, boardPerm);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    // Queue + grid changed, but don’t rebuild E-panel here
    refreshNonPanelUI();
    setStatus('Shuffled current from ORIGINAL.');
    pulseHUDKey('S');
    return;
  }

  // Check (T)
  if (key==='t'||key==='T'){
    checkme = true;
    if (popQueue.length>0) return setStatus(`Not solved: queue ${popQueue.length}.`,'#B00020');
    if (holes.size>0)     return setStatus(`Not solved: ${holes.size} empty cells.`,'#B00020');
    let mism=0; 
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
      if(!colorsEqual(gridRGB[r][c],originalRGB[r][c])) mism++;
      setStatus(mism===0?'✅ Correct!':'❌ Not yet: '+mism+' mismatches.', mism===0?'#1B5E20':'#B00020');

      pulseHUDKey('T');
      return;
  }

  // Reset to original (A)
  if (key==='a'||key==='A'){
    answerit = true;
    gridRGB = deepCopyGridRGB(originalRGB);
    holes.clear(); popQueue.length=0; dragging=null;
    recomputeLockedCells();
    enforceGuides();
    refreshNonPanelUI();
    setStatus('Reset to ORIGINAL.');
    pulseHUDKey('A');
    return;
  }

  // New Flow (F)
  if (key==='f'||key==='F'){ 
    applyThemeFlow(); 
    refreshNonPanelUI();
    return; 
  }

  // Guides: 0 Off, 1 Corners, 2 Borders
  if (key==='0'){ guideMode=0; recomputeLockedCells(); enforceGuides(); refreshNonPanelUI(); return setStatus('guides: OFF'); }
  if (key==='1'){ guideMode=1; recomputeLockedCells(); enforceGuides(); refreshNonPanelUI(); return setStatus('guides: corners'); }
  if (key==='2'){ guideMode=2; recomputeLockedCells(); enforceGuides(); refreshNonPanelUI(); return setStatus('guides: borders'); }

    // Arrow key nudging for locked source line in move / line
    if (mode === 'move' && eSelectMode === 'line' && eLineSrc) {
      let dr = 0, dc = 0;
      if (key === 'ArrowUp')    dr = -1;
      if (key === 'ArrowDown')  dr = +1;
      if (key === 'ArrowLeft')  dc = -1;
      if (key === 'ArrowRight') dc = +1;

      if (dr !== 0 || dc !== 0) {
        const start = lineStart(eLineSrc);
        if (start) {
          const dst = makeDstLineFromStart(eLineSrc, start.r + dr, start.c + dc);
          if (dst && applyLineMoveSwap(eLineSrc, dst)) {
            eLineSrc = dst;                  // keep selection at new location
            refreshNonPanelUI?.();           // update HUD/header/queue tiles
            redraw();
            return setStatus('Moved line.');
          } else {
            return setStatus('Blocked.', '#B00020');
          }
        }
      }
    }


  // Escape cancels transient E selections
  if (key === 'Escape'){
    if (dragging || eLineAnchor || eLineSrc){
      dragging = null; eLineAnchor = null; eLineDrag = null; eLineSrc = null;
      setStatus('Selection canceled.');
      // Panel hint changes (especially for line/click sources)
      refreshPanel();
      return;
    }
  }
}

function keyReleased(){
  if (key==='v'||key==='V'){ peek=false; refreshNonPanelUI(); }


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