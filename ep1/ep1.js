// panes.js — stable, extensible pane system

let paneZ = 10;

document.querySelectorAll('.pane').forEach(initPane);

function initPane(pane) {
  const title = pane.querySelector('.title');
  const corner = pane.querySelector('.corner');

  let mode = null; // 'drag' | 'resize' | null
  let startX, startY;
  let startLeft, startTop;
  let startWidth, startHeight;

  // bring to front
  pane.addEventListener('mousedown', () => {
    paneZ++;
    pane.style.zIndex = paneZ;
  });

  // ---------- DRAG ----------
  title.addEventListener('mousedown', (e) => {
    mode = 'drag';
    pane.classList.add('is-dragging');
    document.body.classList.add('is-interacting');

    startX = e.pageX;
    startY = e.pageY;
    startLeft = pane.offsetLeft;
    startTop = pane.offsetTop;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', stopInteraction);
  });

  // ---------- RESIZE ----------
  if (corner) {
    corner.addEventListener('mousedown', (e) => {
      mode = 'resize';
      document.body.classList.add('is-interacting');

      startX = e.pageX;
      startY = e.pageY;
      startWidth = pane.offsetWidth;
      startHeight = pane.offsetHeight;

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', stopInteraction);
    });
  }

  // ---------- MOVE HANDLER ----------
  function onMove(e) {
    if (mode === 'drag') {
      pane.style.left = startLeft + (e.pageX - startX) + 'px';
      pane.style.top = startTop + (e.pageY - startY) + 'px';
    }

    if (mode === 'resize') {
      pane.style.width = startWidth + (e.pageX - startX) + 'px';
      pane.style.height = startHeight + (e.pageY - startY) + 'px';
    }
  }

  // ---------- STOP ----------
  function stopInteraction() {
    mode = null;
    pane.classList.remove('is-dragging');
    document.body.classList.remove('is-interacting');

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', stopInteraction);
  }
}
