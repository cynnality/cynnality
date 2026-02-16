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
===== 1. GLOBAL CONSTANTS ===== 
- 'let' is used because the value changes !!!!
==============================*/

const startX = 1080;
const startY = 100;

let activeBoxId = null;

// FUNCTION: MOUSESVG = NOT YET RESET // REPLACED // CONFIRMED PLACEMENT 
function mountSVG(id, path, options = {}) {
  if (document.getElementById(id)) return;

  fetch(path)
    .then(res => res.text())
    .then(svgText => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");

      const node = document.importNode(doc.documentElement, true);

      // Guarantee ID assignment
      node.id = id;

      // Apply positioning if provided
      if (options.x !== undefined && options.y !== undefined) {
        node.setAttribute(
          "transform",
          `translate(${options.x}, ${options.y})`
        );
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
// END FUNCTION: MOUSESVG = NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT

/* =========================
===== 2. INIT FUNCTION ===== 

   MAIN INITIALIZATION

   - DOMContentLoaded means: "wait until the entire HTML is parsed before running this code"
   - without this - getElementById() would fail IF ELEMENTS ARE NOT YET LOADED
   - think: "boot sequence"
========================= */

function initCluster(config) {
  document.addEventListener("DOMContentLoaded", () => {

  /*===============================
  ===== 3. STATE VARIABLES =====
  =================================*/

  const indicator = document.getElementById(config.switchIndicatorId);
  const orgRoot = document.getElementById(config.rootId);

  const descriptionContainer = document.getElementById(config.descriptionContainerId);
  const descriptionContent = document.getElementById(config.descriptionContentId);

  /* ⌄ this returns a NodeList (array-like object)
  in this case, think: "get every interactive box element" ⌄ ======= */
  const boxGroups = document.querySelectorAll(config.boxSelector);

  let selectedBoxId = null;

/* =================== QUESTION ======================================================
  why are these click logs considered redundant ? should i keep ... kinda wanna keep...

  descriptionContainer.addEventListener("click", (event) => {
      event.stopPropagation();
  });

  descriptionContent.addEventListener("click", () => {
    console.log("DESCRIPTION CLICKED");
  });
  =====================================================================================
*/

    // BOX GROUPS BLOCK  NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT
    boxGroups.forEach(box => {
      const rect = box.querySelector(".box-accent") || box.querySelector("rect");
      const boxDef = config.registry[box.id];

      if (rect) {
        applyPrimaryStroke(rect, 4);
      }

      if (boxDef && boxDef.style) {
        applyStyle(box, boxDef.style);
      }
    });
    // END BOX GROUPS BLOCK  NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT 

    // TITLE TEXT APPLICATION   NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT
    const titleElement = document.getElementById(config.titleElementId);
      if (titleElement && config.title) {
        titleElement.textContent = config.title;
      }
    // END TITLE TEXT APPLICATION   NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT


    // BOX LABELS APPLICATION   NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT
    Object.entries(config.labels || {}).forEach(([boxId, lines]) => {
      const box = document.getElementById(boxId);
      if (!box) return;

      const textElements = box.querySelectorAll(".box-label");

      textElements.forEach((el, index) => {
        el.textContent = lines[index] || "";
      });
    });
    // END BOX LABELS APPLICATION   NOT YET RESET/ REPLACED/CONFIRMED PLACEMENT

  /*===============================
  ===== 4. PURE STATE HELPERS ===== 
  ==============================*/

  // FUNCTION: isLockedState = CONFIRMED PLACEMENT: STATE VARIABLES
  function isLockedState(id) {
    return activeBoxId === id || selectedBoxId === id;
  }
  // END FUNCTION: isLockedState = CONFIRMED PLACEMENT: STATE VARIABLES

  // FUNCTION: clearPreviousActive = CONFIRMED PLACEMENT: STATE VARIABLES
  function clearPreviousActive() {
    if (!activeBoxId || activeBoxId === selectedBoxId) return;

    const prev = document.getElementById(activeBoxId);
    if (!prev) return;

    const prevDef = config.registry[activeBoxId];
    updateBoxVisualState(prev, prevDef);
  }
  // END FUNCTION: clearPreviousActive = CONFIRMED PLACEMENT: STATE VARIABLES

  /*===============================
  ===== 5. PURE VISUAL RESOLVER =====
  =================================*/
  // FUNCTION: updateBoxVisualState = CONFIRMED PLACEMENT: PURE VISUAL RESOLVER
  /*ONLY PLACE THAT DETERMINES VISUAL STATE*/
  function updateBoxVisualState(box, boxDef) {
    if (!boxDef) return;

    if (activeBoxId === box.id && boxDef.activeStyle) {
      applyStyle(box, boxDef.activeStyle);
    } 
    else if (selectedBoxId === box.id && boxDef.previewStyle) {
      applyStyle(box, boxDef.previewStyle);
    } 
    else if (boxDef.style) {
      applyStyle(box, boxDef.style);
    }
  }
  // END FUNCTION: updateBoxVisualState = CONFIRMED PLACEMENT: PURE VISUAL RESOLVER

  /*==================================
  ===== 6. DESCRIPTION RENDERING =====
  ===================================*/  

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
    }

    function revealChildren(boxDef) {
      boxDef.next?.forEach(nextId => {
        const nextEl = document.getElementById(nextId);
        if (nextEl) nextEl.style.display = "inline";
      });
    }



function applyCurrentState(box, boxDef) {
  let targetStyle;

  if (activeBoxId === box.id && boxDef?.activeStyle) {
    targetStyle = boxDef.activeStyle;
  } else if (selectedBoxId === box.id && boxDef?.previewStyle) {
    targetStyle = boxDef.previewStyle;
  } else {
    targetStyle = boxDef?.style;
  }

  if (targetStyle) {
    applyStyle(box, targetStyle);
  }
}

  /* =========================
     INDICATOR BOX
     - utility function
     - creates a new sg <rect>
     - positions it, styles it, and injects (appends) it 

     - SVG elements MUST use SVG namespace
       - createElements("rect") will not behave correctly
     ========================== */

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

        // stagger horizontally
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

  /*=========================================================
  global primary stroke and stroke width utility function
  =========================================================== */
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




  /*=========================================
  DEBUG MODE FUNCTION HERE 
  ======================================== */ 
      function applyDebugState() {

        const indicator = document.getElementById(config.switchIndicatorId);
        if (indicator) {
          indicator.classList.add("is-on");
        }

        /* Show ALL interactive boxes including roots */
          document.querySelectorAll(config.boxSelector).forEach(box => {
            box.style.display = "inline";
          });

        /* Apply FINAL committed state visuals */
        Object.keys(config.registry).forEach(id => {
          /* ⌄ FOOTNOTE #1 ⌄ */
          const boxDef = config.registry[id];

          /* ^ FOOTNOTE #1 ^ */
          const group = document.getElementById(id);
          if (!group) return;

          const rect = group.querySelector(".box-accent") || group.querySelector("rect");
          if (!rect) return;

          /* === STROKE + INDICATOR BEHAVIOR === */
          if (boxDef.behavior === "dual-indicator") {

            if (boxDef.activeStyle) {
              applyStyle(group, boxDef.activeStyle);
            } else if (boxDef.style) {
              applyStyle(group, boxDef.style);
            }

            if (boxDef.borderRadius) {
              rect.setAttribute("rx", boxDef.borderRadius);
              rect.setAttribute("ry", boxDef.borderRadius);
            }

            addIndicatorBoxes(group, boxDef, config.registry);

          } else {
            /* === DEFAULT COMMITTED FILL === */
            if (boxDef.activeStyle) {
              applyStyle(group, boxDef.activeStyle);
            } else if (boxDef.style) {
              applyStyle(group, boxDef.style);
            }

          }

        });

      }

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

  /* ==========================================================
     GENERIC BOX CLICK HANDLER
     - the 'engine' that applies the behavior 
  ========================================================== */

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
      if (boxDef?.style) {
        applyStyle(box, boxDef.style);
      }
    });

    box.addEventListener("click", () => {

      const id = box.id;
      const boxDef = config.registry[id];
      if (!boxDef) return;

      // APPLY PREVIEW STYLE (box click visual)
      if (boxDef.previewStyle) {
        applyStyle(box, boxDef.previewStyle);
      }

      // Immediate expansion behavior for cluster-root
      if (boxDef.behavior === "expand-cluster") {

        const isOn = orgRoot.classList.toggle("is-on");
        indicator.classList.toggle("is-on");

        if (boxDef.activeStyle) {
          applyStyle(box, boxDef.activeStyle);
        }

        descriptionContent.innerHTML = boxDef.description;

        boxDef.next?.forEach(nextId => {
          const nextEl = document.getElementById(nextId);
          if (nextEl) nextEl.style.display = "inline";
        });

        activeBoxId = id;
        return;
      }

      selectedBoxId = id;

      /* showing descrip based on MODE append: adds / replace: replaces */
      if (boxDef.mode === "append") {

        const alreadyExists = descriptionContent.querySelector(
          `[data-block="${id}"]`
        );
        console.log("ALREADY EXISTS:", alreadyExists);

        if (!alreadyExists) {
          descriptionContent.innerHTML += boxDef.description;
          console.log("APPENDED DESCRIPTION");
        }

      } else {
        descriptionContent.innerHTML = boxDef.description;
        console.log("REPLACED DESCRIPTION");
      }

      // apply highlight color based on the data source tag in the highlight span 
      // in the box registry
      /*========= COMMENTING OUT THE HIGHLIGHT FOR NOW  - LEAVING DEFINITITONS IN REGISTRY FOR REIMPLEMENTATION IN FUTURE +++==== /*
      descriptionContent.querySelectorAll(".highlight").forEach(el => {
        const source = el.dataset.source;
        const sourceConfig = config.registry[source];

        if (sourceConfig && sourceConfig.accent) {
          el.style.backgroundColor = sourceConfig.accent;
        }
      });
      */
      descriptionContent.querySelectorAll("[data-source]").forEach(el => {
        const source = el.dataset.source;
        const sourceConfig = config.registry[source];

        if (sourceConfig && sourceConfig.accent) {
          el.style.color = sourceConfig.accent;
        }
      });


      if (boxDef.descriptionStyle) {
        Object.entries(boxDef.descriptionStyle).forEach(([prop, value]) => {
          descriptionContainer.style[prop] = value;
        });
      }

      /* showing the TEXT color assigned to specific box-groups */
      descriptionContent.style.color = boxDef.textColor || "#000000";

    });

  });

  /* ==========================================================
     DESCRIPTION CLICK = COMMIT / TRIGGER
        ========================================
        COMMMIT HANDLER=========COMMMIT HANDLER
        ===============        ===================
  ========================================================== */

descriptionContent.addEventListener("click", (event) => {
  event.stopPropagation();
  
    if (!selectedBoxId) return;

    const boxDef = config.registry[selectedBoxId];

    if (!boxDef) return;

    console.log("NEXT:", boxDef.next);

    /* resetting the description overlay */
    Object.entries(config.defaultDescriptionStyle).forEach(([prop, value]) => {
      descriptionContainer.style[prop] = value;
    });

    /* resetting the text color os description overly - default is black */
    descriptionContent.style.color = "#000000";

    const box = document.getElementById(selectedBoxId);
    const rect = 
      box?.querySelector(".box-accent") ||
      box?.querySelector("rect");

      // Reset previous active node
      if (activeBoxId && activeBoxId !== selectedBoxId) {
        const prevEl = document.getElementById(activeBoxId);
        const prevDef = config.registry[activeBoxId];

        if (prevEl && prevDef?.style) {
          applyStyle(prevEl, prevDef.style);
        }
      }

    if (!box || !rect) return;

      /* ==========================================================
       CUSTOM BEHAVIOR SWITCH 
      ========================================================== */

      if (boxDef.activeStyle) {
        applyStyle(box, boxDef.activeStyle);
      }

      if (boxDef.behavior === "dual-indicator") {
        if (boxDef.borderRadius) {
          rect.setAttribute("rx", boxDef.borderRadius);
          rect.setAttribute("ry", boxDef.borderRadius);
        }

        addIndicatorBoxes(box, boxDef, config.registry);
      }

    /* show next boxes
        - progression logic
        - registry defines relationships
        - not hardocded logic  */
    boxDef.next?.forEach(nextId => {
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.style.display = "inline";
    });

    if (boxDef.inject) {
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

  });

  /* ==========================================================
     DEBUG MODE
  ========================================================== */
  let debugMode = false;  // must exist here for button to toggle (opposed to the const = true at the very top (removed))

  const debugButton = document.getElementById(config.debugButtonId);

  if (debugButton) {
    debugButton.addEventListener("click", () => {
      debugMode = !debugMode;

      console.log("Debug Mode:", debugMode ? "ON" : "OFF");

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
});
}

    /* ⌄ FOOTNOTE #1 ⌄ 

    const config = boxRegistry[id];

    it means when a box is clicked -> const id = box.id;

    ex: clicked world cup event box group
        would give <g id="world-cup-event">
        THEN
        id === "world-cup-event"

        then

        const config = boxRegistry[id];
        means: go into the BOX REGISTRY obejct and get the object stored
                under the key "world-cup-event"

                so the color, behavior, strokeColorFrom, indicatorColorFrom, and
                borderRadius are all stored in BOX REGISTRY and assigned to specific
                box groups

                so config is the thing HOLDING/CONNECTING the data

    SVG SAYS: "I AM THE WORLD CUP EVENT " (based on id given to it)

    THEN JS / BOX REGISTRY SAYS: "WHEN WORLD CUP EVENT IS CLICKED, HERE
              IS HOW IT SHOULD BEHAVE"

    so - essentially the same thing could be achieved by configuring
    each box group separately with 
    if (id === "world-cup-event") {...}
    if (id === "olympic-qualification") {...}
    if (id === "fiba-rules") {...}

    but instead - all 'configuraations' are stored in the BOX REGISTRY
                  and assigned to specific box groups
    and the behavior / click handler code stays relatiely generic / reusable


    in JS: 
      objects store data
      variables temporarily hold / store the data
      functions apply logic to do stuff with that data

    this current system:
      box registry = object = data  / definitions
      behavior engine = generic click logic - functions
      utility functions (indicator. folder injection, draggable. etc.)
      SVG = visuals/UI 

     ^ FOOTNOTE #1 ^ */