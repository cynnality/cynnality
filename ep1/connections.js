const obCircleState = {
  start: false,
  women: false,
  pro: false,
  threes: false
};

const OB_CIRCLE_DELAY = 1200;   // delay before any appear
const OB_CIRCLE_STAGGER = 450; // time between each circle

// map keys → ob rows
const keyMap = {
  S: 'start',
  W: 'women',
  P: 'pro',
  T: 'threes'
};

const svg = document.getElementById('connections-layer');

document.querySelector('.q-circle.template').addEventListener('mousedown', (e) => {
  const clone = e.currentTarget.cloneNode(true);

  clone.classList.remove('template');
  clone.classList.add('instance');

  clone.style.position = 'fixed';
  clone.style.left = `${e.clientX}px`;
  clone.style.top = `${e.clientY}px`;

  document.body.appendChild(clone);

  beginDrag(clone, e);
});

function beginDrag(circle, startEvent) {
  const offsetX = 0;
  const offsetY = 0;

  function move(e) {
    circle.style.left = `${e.clientX - offsetX}px`;
    circle.style.top = `${e.clientY - offsetY}px`;
  }

  function up() {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);

    finalizeQCircle(circle);
  }

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function finalizeQCircle(circle) {
  // mark as connectable instance
  circle.dataset.connections = '0';

  // snap visuals
  circle.style.cursor = 'grab';
}

let activeLine = null;
let lineSource = null;

function getCenter(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function toSVGPoint(svg, x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function updateLine(e) {
  if (!activeLine || !lineSource) return;

  const sourceCenter = getCenter(lineSource);

  const start = toSVGPoint(svg, sourceCenter.x, sourceCenter.y);
  const end = toSVGPoint(svg, e.clientX, e.clientY);

  const control = {
    x: (start.x + end.x) / 2,
    y: Math.min(start.y, end.y) - 80
  };

  const d = `
    M ${start.x},${start.y}
    Q ${control.x},${control.y}
      ${end.x},${end.y}
  `;

  activeLine.setAttribute('d', d);
}

function cancelLine(e) {
  document.removeEventListener('mousemove', updateLine);
  document.removeEventListener('mouseup', cancelLine);

  if (!activeLine || !lineSource) {
    cleanupTempLine();
    return;
  }

  const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
  const qCircle = dropTarget?.closest('.q-circle.instance');

  if (!qCircle) {
    //  not dropped on a question circle
    cleanupTempLine();
    return;
  }

  const currentCount = Number(qCircle.dataset.connections || 0);
  // has 2 connections
  if (currentCount >= 2) {
    cleanupTempLine();
    return;
  }
  // commit the line 
  commitLineToQCircle(qCircle);

}

// same pattern as boxes.js
document.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  const obKey = keyMap[key];
  if (!obKey) return;

  const row = document.querySelector(`.pane-ob .ob_row.${obKey}`);
  if (!row) return;

  const label = row.querySelector('.ob_label');
  const detail = row.querySelector('.ob_detail');

  if (
    label.classList.contains('active') &&
    detail.classList.contains('active')
  ) {
    if (!obCircleState[obKey]) {
      obCircleState[obKey] = true;
      checkAllOBCirclesActive();
    }
  }
});

function checkAllOBCirclesActive() {
  const allActive = Object.values(obCircleState).every(Boolean);
  if (!allActive) return;

  revealPaneOBCircles();
}

function revealPaneOBCircles() {
  const order = ['start', 'women', 'pro', 'threes'];

  setTimeout(() => {
    order.forEach((key, index) => {
      const circle = document.querySelector(`.ob-circle.${key}`);
      if (!circle) return;

      setTimeout(() => {
        circle.classList.add('active');
      }, index * OB_CIRCLE_STAGGER);
    });
  }, OB_CIRCLE_DELAY);
}

document.querySelectorAll('.ob-circle').forEach(circle => {
  circle.addEventListener('mousedown', (e) => {
    e.preventDefault();

    lineSource = circle;

    const { x, y } = getCenter(circle);

    activeLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    activeLine.setAttribute('fill', 'none');
    activeLine.setAttribute('stroke-width', '2');
    activeLine.setAttribute('stroke-dasharray', '4 4');

    const lineColor = getComputedStyle(circle).color;
    activeLine.setAttribute('stroke', lineColor);

    svg.appendChild(activeLine);

    document.addEventListener('mousemove', updateLine);
    document.addEventListener('mouseup', cancelLine);
  });
});

function cleanupTempLine() {
  if (activeLine) {
    svg.removeChild(activeLine);
  }

  activeLine = null;
  lineSource = null;
}

function commitLineToQCircle(qCircle) {
  const sourceCenter = getCenter(lineSource);
  const targetCenter = getCenter(qCircle);

  const start = toSVGPoint(svg, sourceCenter.x, sourceCenter.y);
  const end = toSVGPoint(svg, targetCenter.x, targetCenter.y);

  const control = {
    x: (start.x + end.x) / 2,
    y: Math.min(start.y, end.y) - 80
  };

  const d = `
    M ${start.x},${start.y}
    Q ${control.x},${control.y}
      ${end.x},${end.y}
  `;

  activeLine.setAttribute('d', d);
  activeLine.classList.add('committed-line');

  // 🔑 increment per-instance connection count
  const currentCount = Number(qCircle.dataset.connections || 0) + 1;
  qCircle.dataset.connections = String(currentCount);

  activeLine = null;
  lineSource = null;

  // 🔔 reveal when complete
  if (currentCount === 2) {
    revealSearchBarFor(qCircle);
  }
}

function revealSearchBarFor(qCircle) {
  const bar = document.createElement('div');
  bar.className = 'search-bar active';
  bar.textContent = 'search text here';

  const rect = qCircle.getBoundingClientRect();
  bar.style.position = 'fixed';
  bar.style.left = `${rect.left}px`;
  bar.style.top = `${rect.bottom + 12}px`;

  document.body.appendChild(bar);
  typewriterEffect(bar);
}

function typewriterEffect(el) {
  const text = el.textContent;
  el.textContent = '';
  let i = 0;

  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;

    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 40);
}

window.checkOBActivationState = function () {
  const keys = ['start', 'women', 'pro', 'threes'];

  keys.forEach(key => {
    const label = document.querySelector(`.ob_label.${key}`);
    const detail = document.querySelector(`.ob_detail.${key}`);

    if (
      label?.classList.contains('active') &&
      detail?.classList.contains('active')
    ) {
      obCircleState[key] = true;
    }
  });

  checkAllOBCirclesActive();
};
