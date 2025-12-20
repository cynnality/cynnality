document.addEventListener('DOMContentLoaded', () => {
  const mdFile = 'FSCJ 25_26 WBB team.md'; // relative to this HTML
  let mdIndex = null;

  // normalize strings for matching
  const normalize = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  // simple markdown roster parser -> { "Leandrea McCloud": {key:val, ...}, ... }
  function buildIndex(mdText) {
    const blocks = mdText.split('---').map(b => b.trim()).filter(Boolean);
    const idx = {};
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const obj = {};
      let nameKey = null;
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (!line.includes(':')) { i++; continue; }
        const colon = line.indexOf(':');
        const key = line.slice(0, colon).trim();
        let val = line.slice(colon + 1).trim();

        // handle list-like indented blocks (not needed here but safe)
        if (val === '' && i + 1 < lines.length && lines[i+1].startsWith('-')) {
          const arr = [];
          i++;
          while (i < lines.length && lines[i].startsWith('-')) {
            const item = lines[i].slice(1).trim();
            arr.push(item);
            i++;
          }
          obj[key] = arr;
          continue;
        }

        // convert booleans and numeric arrays and bracket arrays
        if (/^(true|false)$/i.test(val)) val = val.toLowerCase() === 'true';
        else if (/^\[.*\]$/.test(val)) {
          try { val = JSON.parse(val.replace(/'/g, '"')); }
          catch(e) { val = val.slice(1,-1).split(',').map(v=>v.trim()); }
        }
        // empty to null
        else if (val === 'N/A') val = null;

        obj[key] = val;
        if (key.toLowerCase() === 'name') nameKey = val;
        i++;
      }
      if (nameKey) idx[nameKey] = obj;
    });
    return idx;
  }

  // create details container element (single shared)
  function ensureDetailsContainer() {
    let container = document.querySelector('.player-details');
    if (!container) {
      container = document.createElement('div');
      container.className = 'player-details';
      const roster = document.querySelector('.roster-stickers');
      roster.insertAdjacentElement('afterend', container);
    }
    return container;
  }

  // build HTML for player object
    function renderPlayer(playerObj, playerName) {
    const lines = [];
    lines.push(`<div class="pd-header"><h3>${playerName}</h3></div>`);

    // keys we don't want shown in the details panel
    const ignoredKeys = new Set(['name', 'roster-sticker', 'roster_sticker', 'rosterSticker', 'roster', 'roster-sticker-png']);

    // preferred ordering
    const order = ['year','number','position','hometown','highSchool','playerNum','yrsInWnba','draftedWnba','team2025'];
    order.forEach(k => {
      if (playerObj[k] && !ignoredKeys.has(k)) {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
        lines.push(`<div class="pd-row"><span class="pd-label">${label}:</span> <span class="pd-val">${Array.isArray(playerObj[k]) ? playerObj[k].join(', ') : playerObj[k]}</span></div>`);
      }
    });
    // generic remaining keys
    Object.keys(playerObj).forEach(k => {
      if (order.includes(k)) return;
      if (ignoredKeys.has(k)) return;
      const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
      const val = playerObj[k];
      if (val === null) return;
      if (Array.isArray(val)) {
        lines.push(`<div class="pd-row"><span class="pd-label">${label}:</span> <span class="pd-val">${val.join(', ')}</span></div>`);
      } else if (typeof val === 'boolean') {
        if (val) lines.push(`<div class="pd-row"><span class="pd-label">${label}:</span> <span class="pd-val">Yes</span></div>`);
      } else {
        lines.push(`<div class="pd-row"><span class="pd-label">${label}:</span> <span class="pd-val">${val}</span></div>`);
      }
    });
    return lines.join('');
  }

  // fetch and build index, then wire click handlers
  fetch(mdFile).then(r => r.text()).then(mdText => {
    mdIndex = buildIndex(mdText);

    // attach click listeners to sticker containers or images
    document.querySelectorAll('.fscj-roster-sticker, .fscj-roster-sticker img').forEach(el => {
      el.style.cursor = 'pointer';
    });

    document.querySelectorAll('.fscj-roster-sticker').forEach(container => {
      container.addEventListener('click', (e) => {
        // find player name: prefer roster data-name, then img alt, then inferred from class
        const img = container.querySelector('img');
        let keyCandidate = container.dataset.name || (img && img.alt) || container.className;
        // normalize and match to mdIndex keys
        const norm = normalize(keyCandidate);
        const foundName = Object.keys(mdIndex).find(n => normalize(n) === norm);
        if (!foundName) return console.warn('player md not found for', keyCandidate);
        const playerObj = mdIndex[foundName];

        const details = ensureDetailsContainer();
        // toggle: if same player currently shown -> hide
        if (details.dataset.current === foundName) {
          details.remove();
          return;
        }
        // populate and show
        details.innerHTML = renderPlayer(playerObj, foundName);
        details.dataset.current = foundName;
        // scroll into view smoothly
        details.scrollIntoView({behavior: 'smooth', block: 'start'});
      });
    });
  }).catch(err => {
    console.error('Could not load roster markdown:', err);
  });
});