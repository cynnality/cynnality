// --- tiny helpers ---
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

export const UI = {}; // ESM gives you a singleton automatically

// Minimal HUD module: init + text rendering + stacked status + active-glow refresh
UI.HUD = (() => {
  const el = {
    mode:   null,
    guide:  null,
    queue:  null,
    inspect:null,
    diff:   null,
    status: null,
    hudRoot:null
  };

  function init() {
    el.mode    = document.querySelector('#hud-mode');
    el.guide   = document.querySelector('#hud-guide');
    el.queue   = document.querySelector('#hud-queue');
    el.inspect = document.querySelector('#hud-inspect');
    el.diff    = document.querySelector('#hud-diff');
    el.status  = document.querySelector('#hud-status');
    el.hudRoot = document.querySelector('#hud');
  }

  const guideModeLabel = (g) => (g===0 ? 'Off' : g===1 ? 'corners' : 'borders');

  // Text numbers/labels only; no “active glow” here
  function render(state) {
    if (el.mode)    el.mode.textContent    = state.mode ?? '—';
    if (el.guide)   el.guide.textContent   = guideModeLabel(state.guideMode ?? 0);
    if (el.queue)   el.queue.textContent   = state.queueLen ?? 0;
    if (el.inspect) el.inspect.textContent = state.inspect ? 'On' : 'Off';
    if (el.diff)    el.diff.textContent    = state.showDiff ? 'On' : 'Off';
    if (el.status && typeof state.statusMsg === 'string') el.status.textContent = state.statusMsg;
  }

// Status (stacked lines support) — accepts strings OR {key,text,color}
function setStatusList(items = []) {
  if (!el.status) return;
  el.status.innerHTML = '';

  // Keys that should show a close (×) button:
  const closableKeys = new Set(['welcome', 'guides']); // welcome gets an × too

  items.forEach((item, i) => {
    let key, text, color;
    if (typeof item === 'string') {
      text = String(item);
      key  = `line-${i}`;
      color = undefined;
    } else {
      ({ key, text, color } = item || {});
      text = String(text ?? '');
    }

    const row  = document.createElement('div');
    row.className = 'status-line';
    if (key)   row.dataset.key = key;
    if (color) row.style.setProperty('--status-color', color);

    const span = document.createElement('span');
    span.className = 'status-text';
    if (item.html) span.innerHTML = item.html;
    else span.textContent = text;
    row.appendChild(span);

    // Add the dismiss (×) button for selected keys
    if (key && closableKeys.has(key)) {
      const btn = document.createElement('button');
      btn.className = 'status-close';
      btn.setAttribute('data-status-x', key);
      btn.setAttribute('aria-label', 'Dismiss');
      btn.textContent = '×';
      row.appendChild(btn);
    }

    el.status.appendChild(row);
  });
}


// Single-line convenience (keeps existing calls working)
function setStatus(msg, color = '#000000') {
  // Pass through in the new object form so both paths behave identically
  setStatusList([{ key: 'flash', text: msg ?? '', color }]);
}

  // Update active glows across HUD + legend using the shared key helper
  function refreshActive(state) {
    const K = UI.Keys; // from the canonical block
    if (!K) return;

    // Modes
    K.setKeyActiveAll('C', state.mode === 'collect');
    K.setKeyActiveAll('M', state.mode === 'move');

    // Hinting
    K.setKeyActiveAll('V', !!state.peek);
    K.setKeyActiveAll('X', !!state.inspect);
    K.setKeyActiveAll('L', state.inspect && !!state.inspectLightness);
    K.setKeyActiveAll('D', !!state.showDiff);

    // Guides
    K.setKeyActiveAll('0', state.guideMode === 0);
    K.setKeyActiveAll('1', state.guideMode === 1);
    K.setKeyActiveAll('2', state.guideMode === 2);
  }

  // One-shot HUD refresh: text + active glows
  function refreshAll(state) {
    render(state);
    refreshActive(state);
  }

  // NOTE:
  // - wireHotkeys is defined in the canonical block (UI.HUD.wireHotkeys)
  // - pulsing is handled by UI.Keys.pulseKeyAll

  return { init, render, setStatus, setStatusList, refreshAll };
})();

// === Sliders UI binding ===
function bindSlider(id, onInput, labelId) {
  const el = $(id);
  if (!el) return null;
  const lbl = labelId ? $(labelId) : null;
  const updateLabel = v => { if (lbl) lbl.textContent = v; };
  el.addEventListener('input', () => onInput(el, updateLabel));
  // seed label once
  onInput(el, updateLabel);
  return el;
}

/**
 * Initialize all sliders in one pass, using a descriptor table.
 * Core provides two functions so UI doesn't mutate state directly.
 */
export function initSliders({
  onRenderChange,   // (name, value) => void  (no regen)
  onGenChange       // (name, value) => void  (regen with same theme)
} = {}) {

  // Render-time: SAT_SCALE, VAL_GAMMA
  bindSlider('#sl-sat', (el, setLbl) => {
    const v = parseFloat(el.value);
    onRenderChange?.('SAT_SCALE', v);
    setLbl?.(v.toFixed(2));
  }, '#lbl-sat');

  bindSlider('#sl-gam', (el, setLbl) => {
    const v = parseFloat(el.value);
    onRenderChange?.('VAL_GAMMA', v);
    setLbl?.(v.toFixed(2));
  }, '#lbl-gam');

  // Gen-time: MIN_DELTA, BANDS, and advanced (optional if present)
  bindSlider('#sl-mind', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_MIN_DELTA', v);
    setLbl?.(v.toFixed(2));
  }, '#lbl-mind');

  bindSlider('#sl-bands', (el, setLbl) => {
    const v = parseInt(el.value, 10);
    onGenChange?.('GEN_BANDS', v);
    setLbl?.(String(v));
  }, '#lbl-bands');

  bindSlider('#sl-colspan', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_V_COL_SPAN_MIN', v);
    setLbl?.(v.toFixed(0));
  }, '#lbl-colspan');

  bindSlider('#sl-vband-min', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_V_BAND_MIN', v);
    setLbl?.(v.toFixed(1));
  }, '#lbl-vband-min');

  bindSlider('#sl-vband-max', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_V_BAND_MAX', v);
    setLbl?.(v.toFixed(1));
  }, '#lbl-vband-max');

  bindSlider('#sl-vcontrast', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_V_CONTRAST', v);
    setLbl?.(v.toFixed(2));
  }, '#lbl-vcontrast');

  bindSlider('#sl-vgamma-gen', (el, setLbl) => {
    const v = parseFloat(el.value);
    onGenChange?.('GEN_V_GAMMA_GEN', v);
    setLbl?.(v.toFixed(2));
  }, '#lbl-vgamma-gen');
}

export function updateQueueHeader(mode, queueLen){
  const label = $('#queue-next-label');
  const hint  = $('#queue-help');
  if (!label || !hint) return;

  // reset hint each call
  hint.textContent = '';

  if (mode === 'collect'){
    if (queueLen > 0){
      label.textContent = "you're collecting squares!";
      hint.textContent  = 'right-click an empty spot to place from queue';
    } else {
      label.textContent = 'click or drag across grid to take squares off and collect them below';
    }
    return;
  }

  // Move mode messaging
  if (mode === 'move'){
    label.textContent = 'drag squares on the grid to move them around';
    if (queueLen > 0) {
      hint.textContent = 'right-click an empty spot to place from queue';
    }
    return;
  }

  // Fallback (if any other mode appears later)
  label.textContent = '';
  hint.textContent  = '';
}

function rgbStr(t){ return `rgb(${t[0]} ${t[1]} ${t[2]})`; }

export function renderQueueUI(queue, hudQueueEl = null){
  const nextWrap = $('#queue-next');
  const nextCell = nextWrap ? nextWrap.querySelector('.queue-cell') : null;
  const gridEl   = $('#queue-grid');
  if (!nextWrap || !gridEl) return;

  const N = queue?.length ?? 0;

  // first tile preview
  if (N > 0){
    nextWrap.style.display = '';
    if (nextCell){
      nextCell.style.background   = rgbStr(queue[0]);
      nextCell.removeAttribute('data-empty');
    }
  } else {
    nextWrap.style.display = 'none';
    if (nextCell){
      nextCell.style.background = 'transparent';
      nextCell.setAttribute('data-empty','true');
    }
  }

  // remainder grid
  gridEl.textContent = '';
  if (N > 1){
    const frag = document.createDocumentFragment();
    for (let i=1;i<N;i++){
      const d = document.createElement('div');
      d.className = 'queue-cell';
      d.style.background = rgbStr(queue[i]);
      frag.appendChild(d);
    }
    gridEl.appendChild(frag);
  }

  if (hudQueueEl) hudQueueEl.textContent = String(N);
}

export function syncQueueCSSVars(lengthPx, rows){
  const holder = $('#queue-holder');
  const grid   = $('#queue-grid');
  if (holder) holder.style.setProperty('--tile', `${lengthPx}px`);
  if (grid)   grid.style.setProperty('--rows', `${rows}`);
}

export const QueuePanel = (() => {
  let infoEl, 
      diffEl, // host for diff queue panel
  readState = () => ({}), 
  onSetESelect = () => {},
  onSetDiffStroke = () => {};

  function init({ readStateFn, onSetESelectFn, onSetDiffStrokeFn } = {}){
    readState        = readStateFn        || readState;
    onSetESelect     = onSetESelectFn     || onSetESelect;
    onSetDiffStroke  = onSetDiffStrokeFn  || onSetDiffStroke;
    infoEl = document.getElementById('queue-mode-info');

    // giving a dedicated container exists *after* the main panel
    if (infoEl) {
      diffEl = document.getElementById('queue-diff-info');
      if (!diffEl) {
        diffEl = document.createElement('div');
        diffEl.id = 'queue-diff-info';
        diffEl.className = 'q-panel q-diff-host q-info'; // style like your other panels
        infoEl.insertAdjacentElement('afterend', diffEl);
      }
    }

    if (infoEl){
      infoEl.addEventListener('click', (e) => {
        // Existing emode pills
        const btn = e.target.closest('.emode-pill, .pill');
        if (btn){
          const em = btn.dataset.emode;
          const { mode } = readState();
          if (em && mode === 'move') onSetESelect(em);
          return;
        }
      }, { passive: true });
    }

    // handle swatch clicks inside the *diff* panel container
    if (diffEl){
      diffEl.addEventListener('click', (e) => {
        const sw = e.target.closest('.diff-swatch');
        if (sw){
          onSetDiffStroke(sw.dataset.color);
          // local visual update
          diffEl.querySelectorAll('.diff-swatch')
            .forEach(n => n.classList.toggle('active', n === sw));
        }
      }, { passive: true });
    }

    renderInfo();
  }

function renderInfo(){
  if (!infoEl) return;
  const { mode, popQueueLen, eClickSrc, eLineSrc, eSelectMode, showDiff, diffStroke } = readState();

  const makeDiffPanel = () => {
    if (!showDiff) return '';
    const diffSwatches = ['#000000ff','#ffffff','#ff0040ff','#fffb00ff','#2bff00ff','#ff00ffff'];
    return `
      <div class="q-subtitle">difference lines</div>
      <div class="q-tip">lines mean a square is incorrectly placed. they disappear as you move things to the right place!</div>
      <div class="q-swatches" id="q-diff-swatches">
        ${diffSwatches.map(c =>
          `<button class="q-pill diff-swatch${diffStroke===c ? ' active' : ''}"
                   data-color="${c}" style="background:${c}"
                   aria-label="Set diff stroke to ${c}"></button>`).join('')}
      </div>`;
  };

  if (mode === 'collect'){
    const hasQ = popQueueLen > 0;
    infoEl.innerHTML = `
      <div class="q-title">Collect mode</div>
      <div class="q-tip">click or drag across grid to take squares off the grid and collect them below</div>
      ${hasQ ? `<div class="q-sub">Tip: right-click an empty cell to place from queue</div>` : ''}
    `;
    // NEW: own container — either fill or clear
    if (diffEl) diffEl.innerHTML = makeDiffPanel();
    return;
  }

  const srcPicked = eClickSrc
    ? `<div class="q-sub">source picked at <span class="q-pill">${eClickSrc.r},${eClickSrc.c}</span></div>` : '';
  const dstPicked = eLineSrc
    ? `<div class="q-sub">destination picked at <span class="q-pill">${eLineSrc.r},${eLineSrc.c}</span></div>` : '';

  infoEl.innerHTML = `
    <div class="q-title">move mode!</div>
    <div id="q-emode-pills" class="q-mode-toggle">
      <span class="emode-pill q-pill" data-emode="drag">drag</span>
      <span class="emode-pill q-pill" data-emode="click">click</span>
      <span class="emode-pill q-pill" data-emode="line">line</span>
    </div>
    <div id="q-emode-hints">
      <div class="q-tip emode-hint" data-emode="drag">press and drag a square to move it</div>
      <div class="q-tip emode-hint" data-emode="click">click a square, then click where you want it to go</div>
      <div class="q-tip emode-hint" data-emode="line">press and drag to select more than onne square. click, drag, or use arrows keys to move it</div>
    </div>
    ${srcPicked}
    ${dstPicked}
  `;

  // NEW: own container — either fill or clear
  if (diffEl) diffEl.innerHTML = makeDiffPanel();

  refreshEPillsActive();
}

  function refreshEPillsActive(){
    if (!infoEl) return;
    const { mode, eSelectMode } = readState();
    if (mode !== 'move') return;
    const pills = infoEl.querySelectorAll('.emode-pill');
    const hints = infoEl.querySelectorAll('.emode-hint');
    pills.forEach(p => p.classList.toggle('active', p.dataset.emode === eSelectMode));
    hints.forEach(h => h.style.display = (h.dataset.emode === eSelectMode ? '' : 'none'));
  }

  function refresh(){ renderInfo(); }

  return { init, refresh, renderInfo, refreshEPillsActive };
})();

const HUD_SECTIONS = {
  move: [
    {key:'M', label:'move squares around'},
    {key:'Q', label:'toggle move types'},
    {key:'Escape', label:'selection'},
  ],
  hinting: [
    // {key:'V', label:'hold to see sort soluation'},
    // {key:'X', label:'see categorical colors'},
    // {key:'L', label:'see tinted categorical colors (only with X active'},
    // {key:'D', label:'see mismatched outlines'},
  ],
  guides: [
     {key:'0', label:'OFF'},
     {key:'1', label:'CORNERS'},
     {key:'2', label:'BORDERS'},
  ],
  utility: [
  //{key:'M', label:'move squares around'},
    {key:'C', label:'collect squares'},
    {key:'V', label:'hold to see sort solution'},
    {key:'X', label:'see categorical colors'},
    {key:'L', label:'see tinted categorical colors'},
    {key:'D', label:'see mismatched outlines'},
    {key:']', label:'zoom in'},
    {key:'[', label:'zoom out'},
  //{key:'Q', label:'toggle thru selection types'},
    {key:'S', label:'shuffle the grid'},
    {key:'T', label:'check if your sort is correct'},
    {key:'A', label:'sorts the grid !!'},
  //{key:'Escape', label:'cancel drag'},
    {key:'F', label:'get a new gradient !!'},
  ]
};

function renderList(arr) {
  return arr.map(item => `
    <div class="hud-item">
      <div class="hud-key" data-key="${item.key}">
        <div class="key-name">${item.key}</div>
        <div class="hud-item-label">${item.label}</div>
      </div>
    </div>
  `).join('');
}

export function renderHUDLists(sections = HUD_SECTIONS){
  const m = $('#hud-move-list');
  // const h = $('#hud-hinting-list');
  const g = $('#hud-guides-list'); 
  const u = $('#hud-utility-list');
  if (m) m.innerHTML = renderList(sections.move);
  // if (h) h.innerHTML = renderList(sections.hinting);
  if (g) g.innerHTML = renderList(sections.guides);
  if (u) u.innerHTML = renderList(sections.utility);
}

// (optional) export HUD_SECTIONS so you can tweak copy at runtime
export { HUD_SECTIONS };

// --- Collapsible HUD sections (minimal JS, accessible) ---
function keyFromSection(sectionEl){
  // find the list id inside this section
  const list = sectionEl.querySelector('.hud-list[id]');
  if (!list) return null;

  const listId = list.id;                // e.g., "hud-guides-list"
  const key = listId.replace(/^hud-|-list$/g, ''); // "guides"

  // 🔎 Minimal stamping (one-time, harmless if repeated)
  if (!sectionEl.dataset.section) sectionEl.dataset.section = key;
  if (!sectionEl.dataset.listId)  sectionEl.dataset.listId  = listId;

  const desiredId = `hud-${key}-section`; // e.g., "hud-guides-section"
  if (!sectionEl.id || sectionEl.id !== desiredId) {
    sectionEl.id = desiredId;
  }

  return key;
}

function restoreState(){
  try { return JSON.parse(localStorage.getItem('hudCollapse') || '{}'); }
  catch{ return {}; }
}
function saveState(state){
  try { localStorage.setItem('hudCollapse', JSON.stringify(state)); } catch {}
}

function applyOpen(section, open){
  section.classList.toggle('is-collapsed', !open);
  const title = section.querySelector('.hudsec-title');
  if (title){
    title.setAttribute('aria-expanded', String(!!open));
  }
}

function makeToggleable(section, state){
  const title = section.querySelector('.hudsec-title');
  if (!title) return;

  // button semantics for a11y
  title.setAttribute('role', 'button');
  title.setAttribute('tabindex', '0');

  // add a little chevron (▾)
  if (!title.querySelector('.chev')){
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '▾';
    title.appendChild(chev);
  }

  const key = keyFromSection(section);
  const defaultOpen = true; // change if you want some collapsed by default
  const open = key in state ? !!state[key] : defaultOpen;
  applyOpen(section, open);

  const toggle = () => {
    const nowOpen = !section.classList.contains('is-collapsed');
    applyOpen(section, !nowOpen);
    if (key){
      state[key] = !nowOpen;
      saveState(state);
    }
  };

  title.addEventListener('click', toggle);
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
}

export function enableHudCollapsers(){
  const state = restoreState();
  document.querySelectorAll('#hud .hud-section').forEach(sec => makeToggleable(sec, state));
}

// Optional programmatic control if you ever need it:
export function setHudSectionOpen(sectionKey, open){
  const sec = document.querySelector(`#hud .hud-list#hud-${sectionKey}-list`)?.closest('.hud-section');
  if (!sec) return;
  const st = restoreState();
  applyOpen(sec, !!open);
  st[sectionKey] = !!open;
  saveState(st);
}

// ========= Collapsible HUD "extra" panels: status + subboxes =========

// small state helpers (re-use the same store as sections but in a separate key)
function _restoreExtras() {
  try { return JSON.parse(localStorage.getItem('hudCollapseExtras') || '{}'); }
  catch { return {}; }
}
function _saveExtras(state) {
  try { localStorage.setItem('hudCollapseExtras', JSON.stringify(state)); } catch {}
}

// build a header node
function _makeHeader(titleText){
  const h = document.createElement('div');
  h.className = 'hudsub-title';
  h.setAttribute('role', 'button');
  h.setAttribute('tabindex', '0');
  h.setAttribute('aria-expanded', 'true');

  const t = document.createElement('span');
  t.className = 'title-text';
  t.textContent = titleText;

  const chev = document.createElement('span');
  chev.className = 'chev';
  chev.textContent = '▾';

  h.appendChild(t);
  h.appendChild(chev);
  return h;
}

// make an existing container "inline-collapsible":
// - inserts a title header at the top (if not present)
// - wraps the current children (except header) into .hudsub-body
// - toggles .is-collapsed and aria-expanded; persists to localStorage
function _makeInlineCollapsible(targetEl, { title, key, defaultOpen = true }){
  if (!targetEl) return;

  const state = _restoreExtras();
  const open = key in state ? !!state[key] : !!defaultOpen;

  // If we haven't built a header/body, do it now
  let header = targetEl.querySelector(':scope > .hudsub-title');
  if (!header) {
    header = _makeHeader(title);
    const body = document.createElement('div');
    body.className = 'hudsub-body';

    // move existing children into body
    while (targetEl.firstChild) body.appendChild(targetEl.firstChild);
    targetEl.appendChild(header);
    targetEl.appendChild(body);
  }

  // initial state
  targetEl.classList.toggle('is-collapsed', !open);
  header.setAttribute('aria-expanded', String(!!open));
  const bodyEl = targetEl.querySelector(':scope > .hudsub-body');
  if (bodyEl) bodyEl.setAttribute('aria-hidden', String(!open));

  const toggle = () => {
    const nowOpen = !targetEl.classList.contains('is-collapsed');
    const nextOpen = !nowOpen;
    targetEl.classList.toggle('is-collapsed', !nextOpen);
    header.setAttribute('aria-expanded', String(nextOpen));
    if (bodyEl) bodyEl.setAttribute('aria-hidden', String(!nextOpen));
    state[key] = nextOpen;
    _saveExtras(state);
  };

  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
}

// Special case: #hud-status is not inside a subbox. We’ll turn it into one
// *without* changing the HTML: wrap it once and attach a header before it.
function _upgradeStatusAsCollapsible() {
  const s = document.getElementById('hud-status');
  if (!s) return;

  // Build a new wrapper that looks like a subbox
  const wrap = document.createElement('div');
  wrap.className = 'hud-subbox status-panel'; // match your styling
  // also add a helper class so it gets the white card look directly
  s.classList.add('collapsible-status');

  // Insert wrapper before status, then move status inside
  s.parentNode.insertBefore(wrap, s);
  wrap.appendChild(s);

  // Make the wrapper collapsible, using the status node as body
  // (the helper will create title + body; we want the body to contain #hud-status)
  // So: create an empty wrapper, then move #hud-status into the body after build.
  _makeInlineCollapsible(wrap, { title: 'status', key: 'status', defaultOpen: true });

  // ensure role/aria-live stay on the *body* that is being hidden/shown
  const bodyEl = wrap.querySelector(':scope > .hudsub-body');
  if (bodyEl) {
    // move #hud-status inside the body (after header was created)
    bodyEl.appendChild(s);
  }
}

// Public initializer: call once from core after HUD is rendered
export function enableHudExtraPanels(){
  // 1) Status
  _upgradeStatusAsCollapsible();

  // 2) Sliders (you separated them as .hud-subbox.regular / .hud-subbox.advanced)
  const basic = document.querySelector('.hud-subbox.regular');
  const adv   = document.querySelector('.hud-subbox.advanced');
  _makeInlineCollapsible(basic, { title: 'color sliders',             key: 'sliders-basic', defaultOpen: true });
  _makeInlineCollapsible(adv,   { title: 'still testing...',  key: 'sliders-adv',   defaultOpen: false });
}

// Optional programmatic controls, if you want to open/close later:
export function setHudExtraOpen(key, open){
  const map = {
    'status': document.getElementById('hud-status')?.parentElement,
    'sliders-basic': document.querySelector('.hud-subbox.regular'),
    'sliders-adv'  : document.querySelector('.hud-subbox.advanced')
  };
  const target = map[key];
  if (!target) return;
  const state = _restoreExtras();
  target.classList.toggle('is-collapsed', !open);
  const header = target.querySelector(':scope > .hudsub-title');
  const body   = target.querySelector(':scope > .hudsub-body');
  header?.setAttribute('aria-expanded', String(!!open));
  body?.setAttribute('aria-hidden', String(!open));
  state[key] = !!open; _saveExtras(state);
}

// --- Dock #hud-status between HUD and Queue ---

function _ensureCollapsibleStatusWrapper(){
  // If we already upgraded status earlier, reuse that wrapper
  let status = document.getElementById('hud-status');
  if (!status) return null;

  // If a wrapper already exists (we created one when enabling extra panels), return it
  const existingWrap = status.closest('.hud-subbox');
  if (existingWrap) return existingWrap;

  // Otherwise, build a collapsible wrapper on the fly
  status.classList.add('collapsible-status'); // gives the card look
  const wrap = document.createElement('div');
  wrap.className = 'hud-subbox';

  // Build header + body like your other subboxes
  const header = document.createElement('div');
  header.className = 'hudsub-title';
  header.setAttribute('role','button');
  header.setAttribute('tabindex','0');
  header.setAttribute('aria-expanded','true');
  header.innerHTML = `<strong>status</strong><span class="chev">▾</span>`;

  const body = document.createElement('div');
  body.className = 'hudsub-body';

  // Move the status node inside the body
  body.appendChild(status);
  wrap.appendChild(header);
  wrap.appendChild(body);

  // Simple toggling
  const toggle = () => {
    const open = !wrap.classList.contains('is-collapsed');
    wrap.classList.toggle('is-collapsed', open); // invert
    header.setAttribute('aria-expanded', String(!open));
    body.setAttribute('aria-hidden', String(open));
  };
  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggle(); } });

  return wrap;
}

/**
 * Move the status panel to 'queue' or back to 'hud'.
 * - Requires a <div id="queue-status-slot"></div> in the queue panel.
 */
export function dockStatus(where = 'queue'){
  // if the html div has a data-nodock TRUE attribute, html div decides placement !!
  if (where === 'auto') {
    where = (document.getElementById('hud-status')?.dataset.nodock === 'true') ? 'hud' : 'queue';
  }
  // If the visible host is marked "no dock", do nothing.
  const host = document.getElementById('hud-status'); // <- whatever your host id is
  if (host && (host.dataset.nodock === 'true' || host.classList.contains('no-dock'))) {
    return;
  }

  const wrap = _ensureCollapsibleStatusWrapper();
  if (!wrap) return;

  // If the internal wrapper is marked "no dock", also do nothing.
  if (wrap.dataset.nodock === 'true' || wrap.classList.contains('no-dock')) {
    return;
  }

  if (where === 'queue'){
    const slot   = document.getElementById('queue-status-slot');
    const target = slot
      || document.getElementById('queue-mode-info')?.parentElement
      || document.getElementById('queue-holder');
    if (target && wrap.parentNode !== target){
      target.insertBefore(wrap, slot || document.getElementById('queue-mode-info') || target.firstChild);
    }
  } else {
    const hud = document.getElementById('hud');
    if (hud && wrap.parentNode !== hud){
      hud.insertBefore(wrap, hud.firstChild);
    }
  }
}

// --- Faux scrollbar sync (JS fallback for browsers without scroll-timeline) ---
export function enableHudFauxScroll() {
  const scroller = document.getElementById('hud');
  const bar = scroller?.querySelector('.hud-fauxbar');
  if (!scroller || !bar) return;

  // Only attach JS sync if CSS scroll-timeline is NOT supported
  const hasScrollTimeline = CSS && CSS.supports && CSS.supports('(scroll-timeline: auto)');
  if (hasScrollTimeline) return;

  // Thumb height: read from CSS custom prop (--thumb-h) if set; else a sensible default
  const readThumbHeight = () => {
    const cs = getComputedStyle(bar);
    const raw = cs.getPropertyValue('--thumb-h').trim();
    const n = raw.endsWith('px') ? parseFloat(raw) : parseFloat(raw || '56');
    return Number.isFinite(n) ? n : 56;
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const update = () => {
    const thumbH = readThumbHeight();
    const scrollSpan = scroller.scrollHeight - scroller.clientHeight;
    // If no overflow, pin thumb to top
    const ratio = scrollSpan > 0 ? scroller.scrollTop / scrollSpan : 0;
    const trackH = scroller.clientHeight;
    const maxTravel = Math.max(0, trackH - thumbH);
    const px = maxTravel * clamp01(ratio);
    // Drive the thumb via CSS var (the ::before uses translateY(var(--thumb-y)))
    bar.style.setProperty('--thumb-y', `${px}px`);
  };

  // Keep thumb responsive to content/size changes
  const ro = new ResizeObserver(update);
  ro.observe(scroller);
  ro.observe(bar);

  // Sync on scroll
  scroller.addEventListener('scroll', update, { passive: true });

  // Initial position
  requestAnimationFrame(update);
}

// --- Faux scrollbar drag to scroll (mouse + touch) ---
export function enableHudFauxDrag() {
  const scroller = document.getElementById('hud');
  const bar = scroller?.querySelector('.hud-fauxbar');
  if (!scroller || !bar) return;

  // read thumb height from CSS var --thumb-h, fallback to 56px
  const readThumbHeight = () => {
    const cs = getComputedStyle(bar);
    const raw = cs.getPropertyValue('--thumb-h').trim();
    const n = raw.endsWith('px') ? parseFloat(raw) : parseFloat(raw || '56');
    return Number.isFinite(n) ? n : 56;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const getClientY = (ev) =>
    (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;

  const setScrollFromPointer = (ev) => {
    const rect = bar.getBoundingClientRect();
    const thumbH = readThumbHeight();
    const trackH = rect.height;
    const maxTravel = Math.max(0, trackH - thumbH);
    const clientY = getClientY(ev);
    // center the thumb on the pointer
    const y = clamp(clientY - rect.top - thumbH / 2, 0, maxTravel);

    const scrollSpan = scroller.scrollHeight - scroller.clientHeight;
    const ratio = maxTravel > 0 ? (y / maxTravel) : 0;
    scroller.scrollTop = ratio * Math.max(0, scrollSpan);
  };

  let dragging = false;

  const onDown = (ev) => {
    dragging = true;
    bar.classList.add('dragging');
    setScrollFromPointer(ev);
    // capture move/up on window for robustness
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: true });
    ev.preventDefault();
  };

  const onMove = (ev) => {
    if (!dragging) return;
    setScrollFromPointer(ev);
    ev.preventDefault(); // prevent page scroll on touch
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('dragging');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
  };

  // start drag by pressing anywhere on the bar
  bar.addEventListener('mousedown', onDown);
  bar.addEventListener('touchstart', onDown, { passive: false });

  // safety: cancel drag if window loses focus
  window.addEventListener('blur', onUp);
}


// ================== HOTKEY + LEGEND CANONICAL HELPERS ==================
(function(){
  // --- Normalization + DOM helpers (shared by HUD & Legend) -------------
  function normalizeKeyForCore(raw) {
    if (!raw) return raw;
    const s = String(raw).trim();
    if (/^esc(ape)?$/i.test(s)) return 'Escape';
    if (s === '↑') return 'ArrowUp';
    if (s === '↓') return 'ArrowDown';
    if (s === '←') return 'ArrowLeft';
    if (s === '→') return 'ArrowRight';
    return s.toUpperCase(); // letters, [, ]
  }
  function keyAttrMatches(nodeKey, wantKey) {
    const a = normalizeKeyForCore(nodeKey);
    const b = normalizeKeyForCore(wantKey);
    return a === b;
  }
  function findAllKeyButtons(key) {
    return [...document.querySelectorAll('.hud-key[data-key]')]
      .filter(n => keyAttrMatches(n.getAttribute('data-key'), key));
  }
  function setKeyActiveAll(key, on) {
    findAllKeyButtons(key).forEach(n => n.classList.toggle('active', !!on));
  }
  function pulseKeyAll(key, ms = 160) {
    findAllKeyButtons(key).forEach(n => {
      n.classList.add('active');
      setTimeout(() => n.classList.remove('active'), ms);
    });
  }
  // expose once
  window.UI = window.UI || {};
  UI.Keys = { normalizeKeyForCore, setKeyActiveAll, pulseKeyAll };

  // --- HUD hotkeys wiring (mouse-pressable HUD keycaps) -----------------
  UI.HUD = UI.HUD || {};
  
  UI.HUD.wireHotkeys = function wireHotkeys({
    onKeyDownShot, onKeyUpShot,
    onToggleInspect, onToggleLightness,
    onRefreshUI, onRedraw, onStatus
  } = {}) {
    const hud = document.getElementById('hud');
    if (!hud) return;
    let vIsDown = false;

    hud.addEventListener('mousedown', (ev) => {
      const btn = ev.target.closest('.hud-key[data-key]');
      if (!btn) return;
      const k = normalizeKeyForCore(btn.getAttribute('data-key'));

      if (k === 'V') {
        vIsDown = true;
        onKeyDownShot?.('V');
        onRefreshUI?.(); onRedraw?.();
        ev.preventDefault(); return;
      }
      if (k === 'X') {
        onToggleInspect?.();
        onRefreshUI?.(); onRedraw?.();
        ev.preventDefault(); return;
      }
      if (k === 'L') {
        const ok = onToggleLightness?.();
        onRefreshUI?.(); onRedraw?.();
        if (!ok) onStatus?.('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault(); return;
      }
      onKeyDownShot?.(k);
      onRefreshUI?.(); onRedraw?.();
      ev.preventDefault();
    });

    const releaseV = () => {
      if (!vIsDown) return;
      vIsDown = false;
      onKeyUpShot?.('V');
      onRefreshUI?.(); onRedraw?.();
    };
    hud.addEventListener('mouseup', releaseV);
    hud.addEventListener('mouseleave', releaseV);
  };

  // --- LEGEND: wire static keyboard legend buttons ----------------------
  UI.Legend = UI.Legend || {};

  function normalizeKeyForCore(k) {
  if (!k) return k;
  const s = String(k).trim();
  if (/^esc(ape)?$/i.test(s)) return 'Escape';
  if (s === '↑' || /^arrowup$/i.test(s)) return 'ArrowUp';
  if (s === '↓' || /^arrowdown$/i.test(s)) return 'ArrowDown';
  if (s === '←' || /^arrowleft$/i.test(s)) return 'ArrowLeft';
  if (s === '→' || /^arrowright$/i.test(s)) return 'ArrowRight';
  return s.toUpperCase(); // letters, [, ]
}

  UI.Legend.wire = function wireKeyboardLegend({
    onKeyDownShot, onKeyUpShot,
    onToggleInspect, onToggleLightness,
    onRefreshUI, onRedraw, onStatus
  } = {}) {
    const host = document.getElementById('key-legend');
    if (!host) return;

    let vIsDown = false;

    host.addEventListener('mousedown', (ev) => {
      const btn = ev.target.closest('.hud-key[data-key]');
      if (!btn) return;
      const k = normalizeKeyForCore(btn.getAttribute('data-key'));

      if (k === 'V') {
        vIsDown = true;
        onKeyDownShot?.('V');
        onRefreshUI?.(); onRedraw?.();
        ev.preventDefault(); return;
      }
      if (k === 'X') {
        onToggleInspect?.(); onRefreshUI?.(); onRedraw?.();
        ev.preventDefault(); return;
      }
      if (k === 'L') {
        const ok = onToggleLightness?.();
        onRefreshUI?.(); onRedraw?.();
        if (!ok) onStatus?.('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault(); return;
      }

      onKeyDownShot?.(k);
      onRefreshUI?.(); onRedraw?.();
      ev.preventDefault();
    });

    const releaseV = () => {
      if (!vIsDown) return;
      vIsDown = false;
      onKeyUpShot?.('V');
      onRefreshUI?.(); onRedraw?.();
    };
    host.addEventListener('mouseup', releaseV);
    host.addEventListener('mouseleave', releaseV);

    // toggle labels → also toggles diagram mode
    const toggle = document.getElementById('legend-label-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        host.classList.toggle('show-labels', toggle.checked);
        host.classList.toggle('diagram',     toggle.checked);
        if (toggle.checked) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => UI.Legend.refreshDiagram());
          });
        }
      });
    }
  };

  // --- LEGEND: copy HUD labels onto legend keys as data-label -----------
  UI.Legend.syncLabelsFromHUD = function syncLabelsFromHUD() {
    const map = new Map();
    document.querySelectorAll('#hud .hud-item').forEach(item => {
      const kEl = item.querySelector('.hud-key[data-key]');
      const lEl = item.querySelector('.hud-item-label');
      if (!kEl || !lEl) return;
      const k = normalizeKeyForCore(kEl.getAttribute('data-key'));
      map.set(k, (lEl.textContent || '').trim());
    });

    document.querySelectorAll('#key-legend .hud-key[data-key]').forEach(btn => {
      const k = normalizeKeyForCore(btn.getAttribute('data-key'));
      const label = map.get(k) || '';
      if (label) btn.setAttribute('data-label', label);
      else {
        const fb = {
          Escape: 'cancel drag',
          ArrowUp: 'nudge up',
          ArrowDown: 'nudge down',
          ArrowLeft: 'nudge left',
          ArrowRight: 'nudge right'
        }[k];
        if (fb) btn.setAttribute('data-label', fb);
      }
    });
  };

  // --- added to optimize current diagram editing system -------
  UI.Legend.refreshDiagram = function refreshDiagram() {
    UI.Legend.syncLabelsFromHUD();
    UI.Legend.buildDiagram();
  };


// --- LEGEND: build elbow-line diagram bands from current layout --------
UI.Legend.buildDiagram = function buildKeyboardLegendDiagram() {
  const layout = document.getElementById('keyboard-layout');
  const host   = document.getElementById('key-legend');
  if (!layout || !host || !host.classList.contains('show-labels')) return;

  const needBand = (cls) => {
    let el = layout.querySelector(`.legend-band.${cls}`);
    if (!el) {
      el = document.createElement('div');
      el.className = `legend-band ${cls}`;
      layout.appendChild(el);
    }
    el.textContent = ''; // clear old
    return el;
  };

  const band1 = needBand('band-row1');
  const band2 = needBand('band-row2');
  const band3 = needBand('band-row3');
  const bandEsc = needBand('band-esc');

    // 🔧 Make each band tall enough so its SVG has room to draw.
    // Using the full layout height is simple and safe.
    const layoutRect = layout.getBoundingClientRect();
    [band1, band2, band3].forEach(b => {
      b.style.height = `${Math.ceil(layoutRect.height)}px`;
    });

  const rows = {
    rowEsc: layout.querySelector('.keyboard-row.row-esc'),
    row1: layout.querySelector('.keyboard-row.row-1'),
    row2: layout.querySelector('.keyboard-row.row-2'),
    row3: layout.querySelector('.keyboard-row.row-3'),
  };
  if (!rows.row1 || !rows.row2 || !rows.row3) return;


  // ---------- helpers ----------
  const readPx = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    const m = s.match(/^(-?\d+(?:\.\d+)?)px$/i);
    if (m) return { value: Number(m[1]) };
    if (!isNaN(s)) return { value: Number(s) };
    return null;
  };
  const num = (v, fb) => {
    if (v == null) return fb;
    const s = String(v).trim();
    if (!s || s === 'auto') return 'auto';
    const n = Number(s);
    return Number.isFinite(n) ? n : fb;
  };
  const readOpt = (btn, pill, name, fb) => {
    // precedence: data-* on button → CSS var on button → CSS var on pill → fallback
    const d = btn.getAttribute(`data-${name}`);
    if (d != null) return d;
    const vBtn = getComputedStyle(btn).getPropertyValue(`--${name}`).trim();
    if (vBtn) return vBtn;
    const vPill = getComputedStyle(pill).getPropertyValue(`--${name}`).trim();
    if (vPill) return vPill;
    return fb;
  };
const pillAnchor = (pill, attach /* 'center'|'edge-left'|'edge-right' */, insetX, insetY) => {
  const r = pill.getBoundingClientRect();
  // Base anchor
  let ax = attach === 'edge-left'  ? r.left
       : attach === 'edge-right'   ? r.right
       : (r.left + r.width / 2);
  let ay = (attach === 'edge-left' || attach === 'edge-right')
         ? (r.top + r.height / 2)
         : (r.top + r.height / 2);
  // Apply per-key insets (px): push the actual touch point toward corners
  ax += (Number(insetX) || 0);
  ay += (Number(insetY) || 0);
  return { ax, ay };
};

  const ensureSVGOnBand = (bandEl) => {
    // one <svg> per band, sized by CSS to the band box; no viewBox (pixel user space!)
    let svg = bandEl.querySelector('svg.legend-line');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('legend-line');
      // NO viewBox here → SVG units are CSS pixels; our point coords are pixels.
      bandEl.appendChild(svg);
    }
    return svg;
  };
  const addSegment = (svg, a, b, stroke, widthPx, cap, join, keyClass, segClass) => {
    const seg = document.createElementNS('http://www.w3.org/2000/svg','line');
    seg.setAttribute('x1', a.x); seg.setAttribute('y1', a.y);
    seg.setAttribute('x2', b.x); seg.setAttribute('y2', b.y);
    seg.setAttribute('fill', 'none');
    seg.setAttribute('stroke', stroke || '#222');
    seg.setAttribute('stroke-width', widthPx || 2);
    seg.setAttribute('stroke-linecap', cap || 'square');
    seg.setAttribute('stroke-linejoin', join || 'round');
    // mark lines so we can hover-highlight them
    if (keyClass) seg.classList.add(keyClass);
    seg.classList.add('legend-seg', segClass || 'seg');
    svg.appendChild(seg);
    return seg;
  };

  function addForRow(bandEl, rowEl, dir /* 'down'|'up' */) {
  // Recompute layout metrics locally so scope/order can never break us
  const layoutRectLocal = layout.getBoundingClientRect();
  const layoutCenterX   = layoutRectLocal.left + layoutRectLocal.width / 2;

  const bandRect = bandEl.getBoundingClientRect();
  const rowRect  = rowEl.getBoundingClientRect();

  // shared SVG per band
  const svg = ensureSVGOnBand(bandEl);

  // helper: convert page coords → band-local coords
  const toLocal = ({ x, y }) => ({ x: x - bandRect.left, y: y - bandRect.top });

  rowEl.querySelectorAll('.hud-key[data-key]').forEach(btn => {
    const label = btn.getAttribute('data-label');
    if (!label) return;

    // --- compute key center ---
    const kRect = btn.getBoundingClientRect();
    const keyCx = kRect.left + kRect.width  / 2;
    const keyCy = kRect.top  + kRect.height / 2;

    // same base X as existing system (keeps pill baseline behavior):
    const factor = 0.25;
    const baseX  = layoutCenterX + (keyCx - layoutCenterX) * factor;
    const leftPx = baseX - bandRect.left;

    const vBase  = (dir === 'down')
      ? Math.max(8, rowRect.top - bandRect.bottom)
      : Math.max(8, bandRect.top - rowRect.bottom);

    const hAbs   = Math.max(8, Math.abs(keyCx - baseX));
    const hSign  = (keyCx >= baseX) ? 1 : -1;

    // --- create pill element ---
    const p = document.createElement('div');
    p.className = 'legend-callout';

    // Hover tagging so CSS can target matching <line> elements
    p.addEventListener('mouseenter', () => {
      const canonKey = p.className.match(/key-[A-Za-z0-9u]+/g) || [];
      canonKey.forEach(cls => {
        document.querySelectorAll(`svg.legend-line line.${cls}`).forEach(l => l.classList.add('key-hovered'));
      });
    });
    p.addEventListener('mouseleave', () => {
      document.querySelectorAll('svg.legend-line line.key-hovered').forEach(l => l.classList.remove('key-hovered'));
    });

    // inner label wrapper so centering text never changes geometry
    const lbl = document.createElement('span');
    lbl.className = 'legend-label';
    lbl.textContent = label;
    p.appendChild(lbl);

    // base vars (default = layout-based baseline)
    let leftPxBase = leftPx;
    let topPxBase  = null; // only set when locked to key

    // Allow per-key pill locking to the KEY center (opt-in via --p-lock:key or data-p-lock="key")
    const pLockAttr = (btn.getAttribute('data-p-lock') || '').trim().toLowerCase();
    const pLockVar  = getComputedStyle(btn).getPropertyValue('--p-lock').trim().toLowerCase();
    const lockToKey = (pLockAttr === 'key') || (pLockVar === 'key');

    if (lockToKey) {
      // Base X/Y now follow the key; offsets remain your per-key nudge relative to the key
      leftPxBase = (keyCx - bandRect.left);
      topPxBase  = (keyCy - bandRect.top);
    }

    p.style.setProperty('--left-px-base', String(leftPxBase));
    if (topPxBase != null) p.style.setProperty('--top-px-base', `${topPxBase}px`);

    p.style.setProperty('--v-len-base',   `${vBase}px`);
    p.style.setProperty('--h-len-base',   String(hAbs));
    p.style.setProperty('--h-sign-base',  String(hSign));


    // per-key class hook
    const canon = (function canonize(dk){
      const s = String(dk||'').trim();
      if (/^esc(ape)?$/i.test(s)) return 'Escape';
      if (s==='↑'||/^arrowup$/i.test(s)) return 'ARROWUP';
      if (s==='↓'||/^arrowdown$/i.test(s)) return 'ARROWDOWN';
      if (s==='←'||/^arrowleft$/i.test(s)) return 'ARROWLEFT';
      if (s==='→'||/^arrowright$/i.test(s)) return 'ARROWRIGHT';
      return s.toUpperCase();
    })(btn.getAttribute('data-key'));
    p.classList.add(`key-${canon.replace(/[^A-Z0-9]/g, m => `u${m.charCodeAt(0).toString(16)}`)}`);

    // copy whitelisted vars from button → pill (author on .key-XYZ or [data-*])
    const csKey = window.getComputedStyle(btn);
    [
      '--h-len','--v-len','--h-sign','--v-flip','--h-len-delta','--v-len-delta',
      '--offset-x','--offset-y','--stroke','--meet-y-delta','--v-dir',
      '--h-attach-edge','--h-edge','--geom','--line','--hdir','--vdir','--hlen','--vlen',
      '--attach','--line-color-1','--line-color-2','--linecap','--linejoin',
      // ⬇️ NEW: key-edge anchoring vars
      '--key-anchor','--key-anchor-dx','--key-anchor-dy'
    ].forEach(name => {
      const val = csKey.getPropertyValue(name);
      if (val && val.trim() !== '') p.style.setProperty(name, val.trim());
    });

    // attach pill to band
    bandEl.appendChild(p);

    // ------------ GEOMETRY MODE (opt-in) ------------
    const useGeom = (btn.getAttribute('data-geom') === '1') ||
                    (getComputedStyle(btn).getPropertyValue('--geom').trim() === '1');
    if (!useGeom) {
      // default: pseudo-legs via CSS ::before/::after
      return;
    }
    p.classList.add('use-svg'); // hide pseudo-legs for this pill

    // read per-key opts
    const lineFirst = (readOpt(btn,p,'line','H') || 'H').toUpperCase();  // "H"|"V"
    const hdir      = Number(readOpt(btn,p,'hdir',  (keyCx >= layoutCenterX ? 1 : -1))) || 1;
    const vdir      = Number(readOpt(btn,p,'vdir',  (dir === 'down' ? 1 : -1))) || 1;
    const hlenRaw   = readOpt(btn,p,'hlen','auto');
    const vlenRaw   = readOpt(btn,p,'vlen','auto');
    const hlen      = (hlenRaw == null) ? 'auto' : (String(hlenRaw).trim()==='auto' ? 'auto' : Number(hlenRaw));
    const vlen      = (vlenRaw == null) ? 'auto' : (String(vlenRaw).trim()==='auto' ? 'auto' : Number(vlenRaw));

    const attach    = String(readOpt(btn,p,'attach','edge-right'));
    const dialineDefault = getComputedStyle(p).getPropertyValue('--dialine-color').trim() || '#222';
    const color1 = readOpt(btn,p,'line-color-1', dialineDefault);
    const color2 = readOpt(btn,p,'line-color-2', dialineDefault);
    const cap       = String(readOpt(btn,p,'linecap','square'));
    const join      = String(readOpt(btn,p,'linejoin','round'));

    const strokeVar = getComputedStyle(p).getPropertyValue('--stroke').trim() || '2px';
    const strokeVal = (() => {
      const m = String(strokeVar).trim().match(/^(-?\d+(?:\.\d+)?)px$/i);
      if (m) return Number(m[1]);
      const n = Number(strokeVar); return Number.isFinite(n) ? n : 2;
    })();

    // NEW: where on the key face the first segment starts
    const keyAnchor = String(readOpt(btn,p,'key-anchor','center')).toLowerCase(); // "center"|"top"|"bottom"|"left"|"right"

    // helpers to parse px values
    const toPx = v => {
      const m = String(v||'').trim().match(/^(-?\d+(?:\.\d+)?)px$/i);
      if (m) return Number(m[1]);
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // NEW: anchor/elbow nudges (parse BEFORE use)
    const keyDxPx   = toPx(readOpt(btn,p,'key-anchor-dx','0px'));
    const keyDyPx   = toPx(readOpt(btn,p,'key-anchor-dy','0px'));
    const meetY     = toPx(readOpt(btn,p,'meet-y-delta','0px'));   // H-first elbow Y nudge
    const meetX     = toPx(readOpt(btn,p,'meet-x-delta','0px'));   // V-first elbow X nudge
    const insetXPx  = toPx(readOpt(btn,p,'attach-inset-x','0px')); // pill contact point X inset
    const insetYPx  = toPx(readOpt(btn,p,'attach-inset-y','0px')); // pill contact point Y inset

    // derive key-edge anchor offsets from the key’s size
    const anchorDx = keyAnchor === 'left'   ? -kRect.width/2  :
                    keyAnchor === 'right'  ?  kRect.width/2  : 0;
    const anchorDy = keyAnchor === 'top'    ? -kRect.height/2 :
                    keyAnchor === 'bottom' ?  kRect.height/2 : 0;

    // final key start point (page coords)
    const Pstart = { x: keyCx + anchorDx + keyDxPx, y: keyCy + anchorDy + keyDyPx };

    // compute pill anchor AFTER pill is positioned (with insets toward corners)
    const { ax: pillAx, ay: pillAy } = pillAnchor(p, attach, insetXPx, insetYPx);
    const Ppill = { x: pillAx, y: pillAy };

    // elbow point
    let P0, P1, P2;
    if (lineFirst === 'H') {
      // Horizontal first → slide elbow vertically with meetY
      const targetY = Ppill.y + meetY;
      const autoH   = (hlen === 'auto') ? (Ppill.x - Pstart.x) : (hdir * Number(hlen));
      const elbowX  = Pstart.x + autoH;
      P0 = Pstart;
      P1 = { x: elbowX, y: targetY };
      P2 = Ppill;
    } else {
      // Vertical first → slide elbow horizontally with meetX
      const targetX = Ppill.x + meetX;
      const autoV   = (vlen === 'auto') ? (Ppill.y - Pstart.y) : (vdir * Number(vlen));
      const elbowY  = Pstart.y + autoV;
      P0 = Pstart;
      P1 = { x: targetX, y: elbowY };
      P2 = Ppill;
    }

    // add two colored segments into the band-local SVG
    const A = toLocal(P0), B = toLocal(P1), C = toLocal(P2);
    const keyClass = `key-${canon.replace(/[^A-Z0-9]/g, m => `u${m.charCodeAt(0).toString(16)}`)}`;

    const seg1 = addSegment(svg, A, B, color1, strokeVal, cap, join, keyClass, 'seg-1');
    const seg2 = addSegment(svg, B, C, color2, strokeVal, cap, join, keyClass, 'seg-2');

    // Hover/highlight logic for this key + its pill + segments
    const setHover = (on) => {
      p.classList.toggle('is-hover', !!on);
      seg1.classList.toggle('is-hovered', !!on);
      seg2.classList.toggle('is-hovered', !!on);
    };

    // Hover triggered by the keyboard key itself (safe; keys are interactive)
    btn.addEventListener('mouseenter', () => setHover(true));
    btn.addEventListener('mouseleave', () => setHover(false));

    // Optional: also allow pill hover, but keep it non-clickable
    p.style.pointerEvents = 'auto';
    ['mousedown','mouseup','click','pointerdown','pointerup'].forEach(evName => {
      p.addEventListener(evName, (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    });
    p.addEventListener('mouseenter', () => setHover(true));
    p.addEventListener('mouseleave', () => setHover(false));

  });
}


if (rows.rowEsc) addForRow(bandEsc, rows.rowEsc, 'down'); // ⬅️ NEW (Esc sits above, so we usually go “down”)
addForRow(band1, rows.row1, 'down');
addForRow(band2, rows.row2, 'down');
addForRow(band3, rows.row3, 'up');
};

  // --- LEGEND: keep diagram aligned on resize ---------------------------
  UI.Legend.observeResize = function observeKeyboardLegendForDiagram() {
    const layout = document.getElementById('keyboard-layout');
    if (!layout || !window.ResizeObserver) return () => {};

    const ro = new ResizeObserver(() => {
      if (UI.Legend._raf) return;
      UI.Legend._raf = requestAnimationFrame(() => {
        UI.Legend._raf = null;
        const host = document.getElementById('key-legend');
        if (host && host.classList.contains('show-labels') && host.classList.contains('diagram')) {
          UI.Legend.refreshDiagram();
        }
      });
    });

    ro.observe(layout);
    return () => ro.disconnect();
  };
})();


// === === === CLEANING UP KEYBOARD LEGEND / GUIDED FOR GOING BACK AND REMOVING THINGS ABOVE === === ===