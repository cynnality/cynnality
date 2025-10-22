// --- tiny helpers ---
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

export const UI = {}; // ESM gives you a singleton automatically

UI.HUD = (() => {
  // cache DOM once
  let el = {
    mode:   null,
    guide:  null,
    queue:  null,
    inspect:null,
    diff:   null,
    status: null,
    hudRoot:null
  };

  function init() {
    el.mode    = $('#hud-mode');
    el.guide   = $('#hud-guide');
    el.queue   = $('#hud-queue');
    el.inspect = $('#hud-inspect');
    el.diff    = $('#hud-diff');
    el.status  = $('#hud-status');
    el.hudRoot = $('#hud');
  }

  // formatters that are UI-specific (copy lives in UI)
  function guideModeLabel(guideMode) {
    return guideMode === 0 ? 'Off' : guideMode === 1 ? 'corners' : 'borders';
  }

  // render pill texts (no active-glow here)
  function render(state) {
    // expects: { mode, guideMode, queueLen, inspect, showDiff, statusMsg }
    if (el.mode)    el.mode.textContent    = state.mode ?? '—';
    if (el.guide)   el.guide.textContent   = guideModeLabel(state.guideMode ?? 0);
    if (el.queue)   el.queue.textContent   = state.queueLen ?? 0;
    if (el.inspect) el.inspect.textContent = state.inspect ? 'On' : 'Off';
    if (el.diff)    el.diff.textContent    = state.showDiff ? 'On' : 'Off';
    if (el.status && typeof state.statusMsg === 'string') el.status.textContent = state.statusMsg;
  }

  // status helper (UI-level only; core stays source of truth)
  function setStatus(msg, color = '#000000') {
    if (el.status) {
      el.status.textContent = msg ?? '';
      // optional: style by color if you want (or handle in CSS by data attr)
      // el.status.style.color = color;
      el.status.dataset.color = color; // handy hook for CSS if desired
    }
  }
  // --- add inside UI.HUD IIFE ---
function setStatusList(lines = []) {
  if (!el.status) return;
  el.status.innerHTML = ''; // clear
  lines.forEach(t => {
    const row = document.createElement('div');
    row.className = 'status-line';
    row.textContent = String(t);
    el.status.appendChild(row);
  });
}

// keep existing setStatus(msg,color) working
// (we'll let it render a single line, same structure)
const _oldSetStatus = setStatus;
setStatus = function(msg, color = '#000000'){
  setStatusList([msg ?? '']);
  if (el.status) el.status.dataset.color = color;
};

return { init, render, setStatus, setStatusList, setActiveKeys, pulseKey, refreshAll, wireHotkeys };


  // active glow for keycaps
  function setKeyActive(keyChar, on) {
    const node = document.querySelector(`.hud-key[data-key="${String(keyChar).toUpperCase()}"]`);
    if (!node) return;
    node.classList.toggle('active', !!on);
  }

  // consolidated active-keys updater
  function setActiveKeys(state) {
    // modes
    setKeyActive('C', state.mode === 'collect');
    setKeyActive('P', state.mode === 'P');
    setKeyActive('M', state.mode === 'move');

    // hinting
    setKeyActive('V', !!state.peek);
    setKeyActive('X', !!state.inspect);
    setKeyActive('L', state.inspect && !!state.inspectLightness);
    setKeyActive('D', !!state.showDiff);

    // guides
    setKeyActive('0', state.guideMode === 0);
    setKeyActive('1', state.guideMode === 1);
    setKeyActive('2', state.guideMode === 2);
  }

  // pulse
  function pulseKey(keyChar, ms = 160) {
    const node = document.querySelector(`.hud-key[data-key="${String(keyChar).toUpperCase()}"]`);
    if (!node) return;
    node.classList.add('active');
    setTimeout(() => node.classList.remove('active'), ms);
  }

  // one-shot refresh (text + active glows)
  function refreshAll(state) {
    render(state);
    setActiveKeys(state);
  }

  // === HUD hotkey wiring (click/hold) ===
  // we keep your exact V hold + X/L toggle behavior but call back into core
  function wireHotkeys({
    onKeyDownShot,     // (k)   -> core synthesizes keyPressed()
    onKeyUpShot,       // (k)   -> core synthesizes keyReleased()
    onToggleInspect,   // ()    -> flips inspect in core (and clears L if off)
    onToggleLightness, // ()    -> returns true if toggled, false if blocked
    onRefreshUI,       // ()    -> core refreshUIElements()
    onRedraw,          // ()    -> core redraw()
    onStatus           // (msg, color) -> core setStatus()
  } = {}) {
    const hud = el.hudRoot || $('#hud');
    if (!hud) return;
    let vIsDown = false;

    hud.addEventListener('mousedown', (ev) => {
      const btn = ev.target.closest('.hud-key[data-key]');
      if (!btn) return;
      const k = (btn.getAttribute('data-key') || '').toUpperCase();

      if (k === 'V') {
        vIsDown = true;
        onKeyDownShot?.('V');
        onRefreshUI?.();
        ev.preventDefault();
        return;
      }

      if (k === 'X') {
        onToggleInspect?.();
        onRefreshUI?.();
        onRedraw?.();
        ev.preventDefault();
        return;
      }

      if (k === 'L') {
        const ok = onToggleLightness?.();
        onRefreshUI?.();
        onRedraw?.();
        if (!ok) onStatus?.('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault();
        return;
      }

      onKeyDownShot?.(k);
      onRefreshUI?.();
      ev.preventDefault();
    });

    hud.addEventListener('mouseup', (ev) => {
      if (!vIsDown) return;
      vIsDown = false;
      onKeyUpShot?.('V');
      onRefreshUI?.();
      ev.preventDefault();
    });

    hud.addEventListener('mouseleave', () => {
      if (!vIsDown) return;
      vIsDown = false;
      onKeyUpShot?.('V');
      onRefreshUI?.();
    });

    // keyboard accessibility on focused keycap
    hud.addEventListener('keydown', (ev) => {
      const btn = ev.target.closest('.hud-key[data-key]');
      if (!btn) return;
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const k = (btn.getAttribute('data-key') || '').toUpperCase();

      if (k === 'X') {
        onToggleInspect?.();
        onRefreshUI?.();
        onRedraw?.();
        ev.preventDefault();
        return;
      }

      if (k === 'L') {
        const ok = onToggleLightness?.();
        onRefreshUI?.();
        onRedraw?.();
        if (!ok) onStatus?.('Press X to enter Inspect first.', '#B00020');
        ev.preventDefault();
        return;
      }

      onKeyDownShot?.(k);
      onRefreshUI?.();
      ev.preventDefault();
    });
  }

  return { init, render, setStatus, setActiveKeys, pulseKey, refreshAll, wireHotkeys };
})();

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

  hint.textContent = null;

  if (mode === 'P'){
    if (queueLen > 0){
      label.textContent = 'click on an empty spot to place';
      hint.textContent  = 'this square';
    }
    return;
  }

  if (mode === 'collect'){
    if (queueLen > 0){
      label.textContent = 'you\'re collecting squares!';
      hint.textContent  = 'press P to start putting squares back on the grid';
    } else {
      label.textContent = 'click on or drag mouse around grid to take squares off and collect them below';
    }
    return;
  }

  if (mode === 'move'){
    label.textContent = 'drag squares on the grid to move them around';
    if (queueLen === 0) hint.textContent = 'check helper menu for more options!';
    return;
  }
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
  let infoEl, readState = () => ({}), onSetESelect = () => {};

  function init({ readStateFn, onSetESelectFn } = {}){
    readState = readStateFn || readState;
    onSetESelect = onSetESelectFn || onSetESelect;
    infoEl = document.getElementById('queue-mode-info');

    if (infoEl){
      infoEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.emode-pill, .pill');
        if (!btn) return;
        const em = btn.dataset.emode;
        const { mode } = readState();
        if (!em || mode !== 'move') return;
        onSetESelect(em);
      }, { passive: true });
    }
    renderInfo();
  }

  function renderInfo(){
    if (!infoEl) return;
    const { mode, popQueueLen, eClickSrc, eLineSrc, eSelectMode } = readState();

    if (mode === 'collect'){
      infoEl.innerHTML = `
        <div class="q-title">Collect mode</div>
        <div class="q-tip">click or drag across grid to take squares off the grid and collect them below</div>
      `;
      return;
    }

    if (mode === 'P'){
      const empty = popQueueLen === 0;
      infoEl.innerHTML = `
        <div class="q-title">Place mode</div>
        <div class="q-tip">${
          empty
            ? 'Queue is empty — press <span class="hud-key">C</span> and click a tile to collect.'
            : 'Click an empty spot on the grid to place the leftmost color.'
        }</div>
      `;
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
        <div class="q-tip emode-hint" data-emode="drag">Drag a tile to swap or move into a hole.</div>
        <div class="q-tip emode-hint" data-emode="click">Click a source tile, then click a destination (tile = swap, hole = move).</div>
        <div class="q-tip emode-hint" data-emode="line">Drag to size a row/column, then click a same-length destination line (all empty = move, all filled = swap).</div>
      </div>
      ${srcPicked}
      ${dstPicked}
    `;
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
    {key:'A', label:'answers the sort (RESETS MOVE / COLLECTIONS)'},
    {key:'Esc', label:'cancel drag'},
    {key:'F', label:'new flow theme (WILL RESET PAGE AND LOSE ALL CHANGES!)'}
  ]
};

function renderList(arr){
  return arr.map(item => `
    <div class="hud-item">
      <span class="hud-key" data-key="${item.key}">${item.key}</span>
      <span class="hud-item-label">${item.label}</span>
    </div>
  `).join('');
}

export function renderHUDLists(sections = HUD_SECTIONS){
  const m = $('#hud-modes-list');
  const h = $('#hud-hinting-list');
  const g = $('#hud-guides-list');
  const u = $('#hud-utility-list');
  if (m) m.innerHTML = renderList(sections.modes);
  if (h) h.innerHTML = renderList(sections.hinting);
  if (g) g.innerHTML = renderList(sections.guides);
  if (u) u.innerHTML = renderList(sections.utility);
}

// (optional) export HUD_SECTIONS so you can tweak copy at runtime
export { HUD_SECTIONS };

// --- Collapsible HUD sections (minimal JS, accessible) ---
function keyFromSection(sectionEl){
  // derive a stable key by looking for the list id inside the section
  const list = sectionEl.querySelector('.hud-list[id]');
  if (!list) return null;
  const id = list.id; // e.g., hud-modes-list
  return id.replace(/^hud-|-list$/g, ''); // "modes", "hinting", "guides", "utility"
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

  const t = document.createElement('strong');
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
  wrap.className = 'hud-subbox'; // match your styling
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
  _makeInlineCollapsible(basic, { title: 'contrast',             key: 'sliders-basic', defaultOpen: true });
  _makeInlineCollapsible(adv,   { title: 'contrast (advanced)',  key: 'sliders-adv',   defaultOpen: false });
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
