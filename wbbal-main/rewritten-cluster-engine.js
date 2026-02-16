/*============================
1. GLOBAL CONSTANTS
2. INIT FUNCTION
3. STATE VARIABLES
4. PURE STATE HELPERS
5. PURE VISUAL RESOLVER
6. DESCRIPTION RENDERING
7. PROGRESSION HELPERS
8. HOVER HANDLERS
9. CLICK HANDLERS
10. COMMIT HANDLER
11. DEBUG
==============================*/


/*============================
1. GLOBAL CONSTANTS
==============================*/

const startX = 1080;
const startY = 100;

/*
activeBoxId:
- globally tracks the box that has been COMMITTED
- persists outside initCluster
*/
const activeBoxes = new Set();

/*
mountSVG:
- utility helper
- loads external SVG
- attaches to folder mount point
- optional draggable behavior
*/
function mountSVG(id, path, options = {}) {
  if (document.getElementById(id)) return;

  fetch(path)
    .then(res => res.text())
    .then(svgText => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const node = document.importNode(doc.documentElement, true);

      node.id = id;

      if (options.x !== undefined && options.y !== undefined) {
        node.setAttribute("transform", `translate(${options.x}, ${options.y})`);
      }

      const mount = document.getElementById("folder-mount-point");
      if (!mount) return;

      mount.appendChild(node);

      if (options.draggable) {
        makeSvgDraggable(id);
      }
    })
    .catch(err => console.error("SVG load error:", err));
}

/*
PURE VISUAL UTILITIES
These do NOT depend on state.
They are safe global helpers.
*/

function applyPrimaryStroke(rect, width = 2) {
  if (!rect.style.stroke) {
    rect.style.stroke = "var(--darkest-blue)";
  }
  rect.style.strokeWidth = `${width}px`;
}

function applyStyle(group, styleDef) {
  if (!styleDef) return;

  const frame = group.querySelector(".box-frame");
  const accent = group.querySelector(".box-accent");
  const labels = group.querySelectorAll(".box-label");

  if (styleDef.frame && frame) {
    Object.entries(styleDef.frame).forEach(([prop, value]) => {
      frame.style[prop] = value;
    });
  }

  if (styleDef.accent && accent) {
    Object.entries(styleDef.accent).forEach(([prop, value]) => {
      accent.style[prop] = value;
    });
  }

  if (styleDef.label && labels.length) {
    labels.forEach(label => {
      Object.entries(styleDef.label).forEach(([prop, value]) => {
        label.style[prop] = value;
      });
    });
  }
}


/*============================
2. INIT FUNCTION
==============================*/

function initCluster(config) {



  /*============================
  3. STATE VARIABLES
  ==============================*/

  const indicator = document.getElementById(config.switchIndicatorId);
  const orgRoot = document.getElementById(config.rootId);

  const descriptionContainer = document.getElementById(config.descriptionContainerId);
  const descriptionContent = document.getElementById(config.descriptionContentId);

  const boxGroups = document.querySelectorAll(config.boxSelector);

  /*
  selectedBoxId:
  - tracks the PREVIEW selection
  - local to this session
  */
  let selectedBoxId = null;



  /*============================
  INITIAL STATIC APPLICATION
  - apply base styles
  - apply labels
  - apply title
  ==============================*/

  boxGroups.forEach(box => {
    const rect = box.querySelector(".box-accent") || box.querySelector("rect");
    const boxDef = config.registry[box.id];

    if (rect) {
      applyPrimaryStroke(rect, 4);
    }

    if (boxDef?.style) {
      applyStyle(box, boxDef.style);
    }
  });

  const titleElement = document.getElementById(config.titleElementId);
  if (titleElement && config.title) {
    titleElement.textContent = config.title;
  }

  Object.entries(config.labels || {}).forEach(([boxId, lines]) => {
    const box = document.getElementById(boxId);
    if (!box) return;

    const textElements = box.querySelectorAll(".box-label");
    textElements.forEach((el, index) => {
      el.textContent = lines[index] || "";
    });
  });



  /*============================
  4. PURE STATE HELPERS
  ==============================*/

  function isLockedState(id) {
    return activeBoxes.has(id) || selectedBoxId === id;
  }

  // REMOVING SO MORE THAN ONE BOX CAN BE ACTIVE AT A TIME
  // INITIAL/HOVER/PREVIEW/ACTIVE STATES IN REGISTRY WILL NOW "LOCK"
  /* 
  function clearPreviousActive() {
    if (!activeBoxId || activeBoxId === selectedBoxId) return;

    const prev = document.getElementById(activeBoxId);
    if (!prev) return;

    const prevDef = config.registry[activeBoxId];
    updateBoxVisualState(prev, prevDef);
  }
  */

  /* ==========================================================
     INITIAL VISIBILITY (ALL BOXES HIDDEN)
     - manually hides all boxes (.box-group) on initial page load
     - giving control over reveal order 
    ========================================= */

        document.querySelectorAll(".box-group").forEach(box => {
          box.style.display = "none";
        });

      (config.rootChildren || []).forEach(childId => {
        const el = document.getElementById(childId);
        if (el) el.style.display = "none";
      });

  /*============================
  5. PURE VISUAL RESOLVER
  ==============================*/

  /*
  SINGLE VISUAL AUTHORITY
  This function determines how a box SHOULD look.
  */
    function updateBoxVisualState(box, boxDef) {
      if (!boxDef) return;

      // ALWAYS start from base style
      if (boxDef.style) {
        applyStyle(box, boxDef.style);
      }

      // Then layer preview or active on top
      if (activeBoxes.has(box.id) && boxDef.activeStyle) {
        applyStyle(box, boxDef.activeStyle);
      }
      else if (selectedBoxId === box.id && boxDef.previewStyle) {
        applyStyle(box, boxDef.previewStyle);
      }
    }

  /*============================
  6. DESCRIPTION RENDERING
  ==============================*/

    function resetDescriptionContainer() {
      if (!config.defaultDescriptionStyle) return;

      Object.entries(config.defaultDescriptionStyle).forEach(([prop, value]) => {
        descriptionContainer.style[prop] = value;
      });

      descriptionContent.style.color = "#000000";
    }


  function renderDescription(boxDef) {
    if (!boxDef) return;

    if (boxDef.mode === "append") {
      const exists = descriptionContent.querySelector(
        `[data-block="${selectedBoxId}"]`
      );

      if (!exists) {
        descriptionContent.innerHTML += boxDef.description;
      }
    } else {
      descriptionContent.innerHTML = boxDef.description;
    }

    if (boxDef.descriptionStyle) {
      Object.entries(boxDef.descriptionStyle).forEach(([prop, value]) => {
        descriptionContainer.style[prop] = value;
      });
    }

    descriptionContent.style.color = boxDef.textColor || "#000000";

        // Apply highlight accent colors
        descriptionContent.querySelectorAll("[data-source]").forEach(el => {
        const source = el.dataset.source;
        const sourceConfig = config.registry[source];

        if (sourceConfig?.accent) {
            el.style.color = sourceConfig.accent;
        }
        });


  }



  /*============================
  7. PROGRESSION HELPERS
  ==============================*/

  function revealChildren(boxDef) {
    boxDef.next?.forEach(nextId => {
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.style.display = "inline";
    });
  }

  function handleInjection(boxDef) {
    if (!boxDef.inject) return;

    mountSVG(
      boxDef.inject.id,
      boxDef.inject.path,
      {
        draggable: boxDef.inject.draggable,
        x: boxDef.inject.x,
        y: boxDef.inject.y
      }
    );
  }

  function addIndicatorBoxes(group, boxDef, registry) {
    if (group.querySelector(".indicator-box")) return;
    if (!boxDef.indicators) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const parentRect = group.querySelector(".box-accent") || group.querySelector("rect");
    if (!parentRect) return;

    const x = parseFloat(parentRect.getAttribute("x"));
    const y = parseFloat(parentRect.getAttribute("y"));
    const w = parseFloat(parentRect.getAttribute("width"));
    const h = parseFloat(parentRect.getAttribute("height"));

    boxDef.indicators.forEach((indicatorConfig, index) => {
      const indicator = document.createElementNS(svgNS, "rect");

      indicator.setAttribute("width", "20");
      indicator.setAttribute("height", "20");
      indicator.setAttribute("rx", "10");
      indicator.setAttribute("ry", "10");

      indicator.setAttribute("x", x + w - 45 - (index * 24));
      indicator.setAttribute("y", y + h - 30);

      indicator.setAttribute("class", "indicator-box");

      indicator.style.stroke = "#000";
      indicator.style.strokeDasharray = "4 2";

      const refBox = registry[indicatorConfig.colorFrom];
      indicator.style.fill = refBox ? refBox.accent : "#ffffff";

      group.appendChild(indicator);
    });
  }



  /*============================
  8. HOVER HANDLERS
  ==============================*/

  boxGroups.forEach(box => {

    box.addEventListener("mouseenter", () => {
      if (isLockedState(box.id)) return;

      const boxDef = config.registry[box.id];
      if (boxDef?.hoverStyle) {
        applyStyle(box, boxDef.hoverStyle);
      }
    });

    box.addEventListener("mouseleave", () => {
      if (isLockedState(box.id)) return;

      const boxDef = config.registry[box.id];
      updateBoxVisualState(box, boxDef);
    });



    /*============================
    9. CLICK HANDLERS
    ==============================*/

    box.addEventListener("click", () => {

      const boxDef = config.registry[box.id];
      if (!boxDef) return;

      if (boxDef.behavior === "expand-cluster") {
        orgRoot.classList.toggle("is-on");
        indicator.classList.toggle("is-on");

        activeBoxId = box.id;

        renderDescription(boxDef);
        revealChildren(boxDef);
        return;
      }

      selectedBoxId = box.id;

      updateBoxVisualState(box, boxDef);
      renderDescription(boxDef);
    });

  });



  /*============================
  10. COMMIT HANDLER
  ==============================*/

  descriptionContent.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!selectedBoxId) return;

    const boxDef = config.registry[selectedBoxId];
    if (!boxDef) return;

    const box = document.getElementById(selectedBoxId);
    if (!box) return;

    resetDescriptionContainer();
    //  clearPreviousActive();

    activeBoxes.add(selectedBoxId);
    selectedBoxId = null;

    updateBoxVisualState(box, boxDef);

    if (boxDef.behavior === "dual-indicator") {
      addIndicatorBoxes(box, boxDef, config.registry);
    }

    revealChildren(boxDef);
    handleInjection(boxDef);
  });



  /*============================
  11. DEBUG
  ==============================*/

  function applyDebugState() {
    document.querySelectorAll(config.boxSelector).forEach(box => {
      box.style.display = "inline";
    });

    Object.keys(config.registry).forEach(id => {
      const boxDef = config.registry[id];
      const group = document.getElementById(id);
      if (!group) return;

      if (boxDef.activeStyle) {
        applyStyle(group, boxDef.activeStyle);
      }
    });
  }

  let debugMode = false;
  const debugButton = document.getElementById(config.debugButtonId);

  if (debugButton) {
    debugButton.addEventListener("click", () => {
      debugMode = !debugMode;

      if (debugMode) {
        applyDebugState();
        debugButton.textContent = "DEBUG: ON";
      } else {
        location.reload();
      }
    });
  }

  if (config.registry["cluster-root"]) {
    descriptionContent.innerHTML =
      config.registry["cluster-root"].description;
  }

}
