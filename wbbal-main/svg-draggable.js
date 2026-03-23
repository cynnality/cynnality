/* =========================
   SVG DRAGGABLE UTILITY
========================= */

function makeSvgDraggable(elementId) {

  const element = document.getElementById(elementId);
  const svg = element.ownerSVGElement;

  if (!element || !svg) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let currentX = 0;
  let currentY = 0;

  /* =========================
     READ EXISTING TRANSLATE
  ========================== */

  function getTranslateValues(el) {
    const transform = el.getAttribute("transform");

    if (!transform) return { x: 0, y: 0 };

    const match = transform.match(/translate\(([^,]+),?\s*([^)]+)?\)/);

    if (!match) return { x: 0, y: 0 };

    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[2] || 0)
    };
  }

  /* =========================
     SVG MOUSE POSITION
  ========================== */

  function getMousePosition(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* =========================
     INITIALIZE CURRENT POSITION
  ========================== */

  const initial = getTranslateValues(element);
  currentX = initial.x;
  currentY = initial.y;

  /* =========================
     MOUSEDOWN
  ========================== */

  element.addEventListener("mousedown", (evt) => {

    // Prevent drag when clicking interactive inner elements
    if (evt.target.closest(".chip")) return;

    isDragging = true;

    // Re-read position in case something changed
    const existing = getTranslateValues(element);
    currentX = existing.x;
    currentY = existing.y;

    const mouse = getMousePosition(evt);

    offsetX = mouse.x - currentX;
    offsetY = mouse.y - currentY;
  });

  /* =========================
     MOUSEMOVE
  ========================== */

  svg.addEventListener("mousemove", (evt) => {
    if (!isDragging) return;

    const mouse = getMousePosition(evt);

    currentX = mouse.x - offsetX;
    currentY = mouse.y - offsetY;

    const existingTransform = element.getAttribute("transform") || "";
    const scaleMatch = existingTransform.match(/scale\([^)]+\)/);

    const scalePart = scaleMatch ? scaleMatch[0] : "";

    element.setAttribute(
      "transform",
      `translate(${currentX}, ${currentY}) ${scalePart}`
    );
  });

  /* =========================
     STOP DRAG
  ========================== */

  svg.addEventListener("mouseup", () => {
    isDragging = false;
  });

  svg.addEventListener("mouseleave", () => {
    isDragging = false;
  });
}
