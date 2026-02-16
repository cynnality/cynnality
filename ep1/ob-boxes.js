// ob_boxes.js
// Right-click contextual boxes for OB rows

let keyBoxZ = 100;
const BOX_DROP_OFFSET = 120; // distance below the pane

const BOX_INITIAL_OFFSET_X = 40;
const BOX_INITIAL_OFFSET_Y = 120;
const BOX_INITIAL_WIDTH = 320;
const BOX_INITIAL_HEIGHT = 180;

const BOX_PRESETS = {
  start: {
    offsetX: 40,
    offsetY: 120,
    width: 320,
    height: 180
  },
  women: {
    offsetX: 420,
    offsetY: 120,
    width: 360,
    height: 200
  },
  pro: {
    offsetX: 40,
    offsetY: 340,
    width: 340,
    height: 180
  },
  threes: {
    offsetX: 420,
    offsetY: 340,
    width: 300,
    height: 160
  }
};

const MINIMIZED_WIDTH  = 200;
const MINIMIZED_HEIGHT = 44; // header only

// --- ROW → BOX MAPPING ---
function getRowKey(row) {
  if (row.classList.contains('start')) return 'start';
  if (row.classList.contains('women')) return 'women';
  if (row.classList.contains('pro')) return 'pro';
  if (row.classList.contains('threes')) return 'threes';
  return null;
}

// --- INIT ROW CONTEXT MENU ---
document
  .querySelectorAll('.pane-ob .ob_row')
  .forEach(initRowBoxInteraction);

function initRowBoxInteraction(row) {
  row.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const key = getRowKey(row);
    if (!key) return;

    const box = document.querySelector(`.key-${key}`);
    if (!box) return;

    showKeyBox(row, box);
  });
}

function getBottomCenter(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.bottom
  };
}

function toSVGPoint(svg, x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function storeBoxSize(box) {
  if (box.dataset.prevWidth) return;

  box.dataset.prevWidth  = box.offsetWidth;
  box.dataset.prevHeight = box.offsetHeight;
}

document.querySelectorAll('.key-box').forEach(box => {
  const closeBtn = box.querySelector('.box-btn.close');
  const minBtn = box.querySelector('.box-btn.minimize');

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    box.remove();
  });

  minBtn?.addEventListener('click', (e) => {
    e.stopPropagation();

    if (!box.classList.contains('minimized')) {
      // going INTO minimized
      storeBoxSize(box);

      box.style.width  = `${MINIMIZED_WIDTH}px`;
      box.style.height = `${MINIMIZED_HEIGHT}px`;
      box.classList.add('minimized');
    } else {
      // coming OUT of minimized
      box.style.width  = `${box.dataset.prevWidth}px`;
      box.style.height = `${box.dataset.prevHeight}px`;

      box.classList.remove('minimized');
      delete box.dataset.prevWidth;
      delete box.dataset.prevHeight;
    }
  });

});

// --- SHOW BOX + CONNECTOR ---
function showKeyBox(row, box) {
  const paneRect = document
    .querySelector('.pane-ob')
    .getBoundingClientRect();

  box.style.display = 'block';

  const key = getRowKey(row);
  const preset = BOX_PRESETS[key];

  // ---------- INITIAL POSITION / SIZE (only once) ----------
  if (!box.dataset.hasBeenOpened) {
    const offsetX = preset?.offsetX ?? BOX_INITIAL_OFFSET_X;
    const offsetY = preset?.offsetY ?? BOX_INITIAL_OFFSET_Y;
    const width   = preset?.width   ?? BOX_INITIAL_WIDTH;
    const height  = preset?.height  ?? BOX_INITIAL_HEIGHT;

    box.style.left   = `${paneRect.left + offsetX}px`;
    box.style.top    = `${paneRect.bottom + offsetY}px`;
    box.style.width  = `${width}px`;
    box.style.height = `${height}px`;

    box.dataset.hasBeenOpened = 'true';
  }

  // ---------- Z-INDEX / VISIBILITY ----------
  keyBoxZ++;
  box.style.zIndex = keyBoxZ;
  box.classList.add('revealing');

  // ---------- DRAW CONNECTOR LINE ----------
  const label = row.querySelector('.ob_label');
  const color = getComputedStyle(label).color;

  requestAnimationFrame(() => {
    drawRowToBoxLine(row, box, color);
  });

  // ---------- 🔑 WOMEN’S TIMELINE REVEAL (SAFE + SCOPED) ----------
  if (key === 'women' && !box.dataset.timelineRevealed) {
    box.dataset.timelineRevealed = 'true';

    // allow layout to settle before animating timeline
    requestAnimationFrame(() => {
      revealWomensTimeline(box);
    });
  }
  if (key === 'women') {
    setTimeout(() => {
      animateWomensTimeline(box);
    }, 400); // after box reveal
  }
}

// --- SVG CONNECTOR ---
function drawRowToBoxLine(row, box, color) {
  const svg = document.getElementById('connections-layer');

  const startDOM = getBottomCenter(row);
  const boxRect = box.getBoundingClientRect();

  const endDOM = {
    x: boxRect.left + boxRect.width / 2,
    y: boxRect.top
  };

  const start = toSVGPoint(svg, startDOM.x, startDOM.y);
  const end = toSVGPoint(svg, endDOM.x, endDOM.y);

  const control = {
    x: start.x,
    y: (start.y + end.y) / 2
  };

  const path = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );

  path.dataset.type = 'row-box'; // TAG

  const d = `
    M ${start.x},${start.y}
    Q ${control.x},${control.y}
      ${end.x},${end.y}
  `;

    //store references
  path._row = row;
  path._box = box;

  path.setAttribute('d', d);
  path.setAttribute('stroke', '#000');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '2');

  svg.appendChild(path);

  updateRowBoxLine(path);
  animatePathDraw(path);
}

function updateRowBoxLine(path) {
  const svg = document.getElementById('connections-layer');

  const row = path._row;
  const box = path._box;

  if (!row || !box) return;

  const rowRect = row.getBoundingClientRect();
  const boxHeader = box.querySelector('.key-box-header');
  const boxRect = boxHeader.getBoundingClientRect();

  // start: bottom center of row
  const startDOM = {
    x: rowRect.left + rowRect.width / 2,
    y: rowRect.bottom
  };

  // end: center of box header
  const endDOM = {
    x: boxRect.left + boxRect.width / 2,
    y: boxRect.top + boxRect.height / 2
  };

  const start = toSVGPoint(svg, startDOM.x, startDOM.y);
  const end = toSVGPoint(svg, endDOM.x, endDOM.y);

  const control = {
    x: start.x,
    y: (start.y + end.y) / 2
  };

  path.setAttribute(
    'd',
    `M ${start.x},${start.y}
     Q ${control.x},${control.y}
       ${end.x},${end.y}`
  );
}

// --- LINE DRAW ANIMATION ---
function animatePathDraw(path) {
  const length = path.getTotalLength();

  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;

  path.getBoundingClientRect(); // force reflow

  path.style.transition = 'stroke-dashoffset 300ms ease-out';
  path.style.strokeDashoffset = '0';

  // 🔑 only fade/remove if row-box lines are NOT persistent
  if (!rowBoxLinesVisible) {
    setTimeout(() => {
      path.classList.add('fading');
    }, 1300);

    setTimeout(() => {
      path.remove();
    }, 1600);
  }
}

// --- DRAG + RESIZE (UNCHANGED CORE LOGIC) ---
document.querySelectorAll('.key-box').forEach((box) => {
  const corner = box.querySelector('.key-box-corner');

  box.addEventListener('mousedown', (e) => {
    if (e.target.closest('.key-box-corner')) return;

    keyBoxZ++;
    box.style.zIndex = keyBoxZ;

    document.body.classList.add('is-interacting');

    const startX = e.pageX;
    const startY = e.pageY;
    const startLeft = box.offsetLeft;
    const startTop = box.offsetTop;

    const move = (e) => {
      box.style.left = startLeft + (e.pageX - startX) + 'px';
      box.style.top = startTop + (e.pageY - startY) + 'px';

        // update attached row→box lines
      document
        .querySelectorAll('#connections-layer path[data-type="row-box"]')
        .forEach(path => {
          if (path._box === box) {
            updateRowBoxLine(path);
          }
        });
    };

    const up = () => {
      document.body.classList.remove('is-interacting');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  if (!corner) return;

  corner.addEventListener('mousedown', (e) => {
    if (box.classList.contains('minimized')) return;
    document.body.classList.add('is-interacting');

    const startX = e.pageX;
    const startY = e.pageY;
    const startW = box.offsetWidth;
    const startH = box.offsetHeight;

    const move = (e) => {
      box.style.width = startW + (e.pageX - startX) + 'px';
      box.style.height = startH + (e.pageY - startY) + 'px';
    };

    const up = () => {
      document.body.classList.remove('is-interacting');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
});

// --- SHARED UTILITY ---
function getCenter(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

window.showKeyBoxForOBRow = function (row) {
  const key = getRowKey(row);
  if (!key) return;

  const box = document.querySelector(`.key-${key}`);
  if (!box) return;

  showKeyBox(row, box);
};

const rowBoxToggle = document.querySelector('.row-box-toggle');

let rowBoxLinesVisible = true;

rowBoxToggle.addEventListener('click', () => {
  rowBoxLinesVisible = !rowBoxLinesVisible;

  rowBoxToggle.classList.toggle('active', rowBoxLinesVisible);

  document
    .querySelectorAll('#connections-layer path[data-type="row-box"]')
    .forEach(path => {
      path.style.display = rowBoxLinesVisible ? 'block' : 'none';
    });
});

// boxes bodies // womens timeline

function revealWomensTimeline(box) {
  const timeline = box.querySelector('.womens-timeline');
  if (!timeline) return;

  // 1️⃣ reveal gold medals first
  revealTimelineItems(timeline, '.timeline-item.gold', 0, 180);

  // 2️⃣ after gold medals finish, reveal non-gold years
  const goldCount = timeline.querySelectorAll('.timeline-item.gold').length;
  const goldDuration = goldCount * 180 + 300; // breathing room

  revealTimelineItems(
    timeline,
    '.timeline-item.nongold',
    goldDuration,
    140
  );
}

function revealTimelineItems(container, selector, delayStart = 0, stagger = 120) {
  const items = container.querySelectorAll(selector);

  items.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('revealed');
    }, delayStart + i * stagger);
  });
}

function animateWomensTimeline(box) {
  const timeline = box.querySelector('.womens-timeline');
  if (!timeline) return;

  const goldItems = timeline.querySelectorAll('.timeline-item.gold');
  const nonGoldItems = timeline.querySelectorAll('.timeline-item.nongold');

  // reset (important if box is reopened)
  timeline.classList.remove('is-expanded');
  [...goldItems, ...nonGoldItems].forEach(item => {
    item.classList.remove('revealed');
  });

  // 1. GOLD medals first
  goldItems.forEach((item, i) => {
    item.style.setProperty('--delay', `${i * 180}ms`);
    setTimeout(() => {
      item.classList.add('revealed');
    }, i * 180);
  });

  const goldDuration = goldItems.length * 180 + 400;

  // 2. “breath” → expand timeline
  setTimeout(() => {
    timeline.classList.add('is-expanded');
  }, goldDuration + 300);

  // 3. Non-gold ticks + notes
  setTimeout(() => {
    nonGoldItems.forEach((item, i) => {
      item.style.setProperty('--delay', `${i * 160}ms`);
      setTimeout(() => {
        item.classList.add('revealed');
      }, i * 160);
    });
  }, goldDuration + 900);
}
