  const fibaConfig = {
    titleElementId: "cluster-title-text",
    title: "FIBA",


    rootId: "cluster-root",
    switchIndicatorId: "cluster-switch-indicator",

    boxSelector: ".box-group, #cluster-root",

    debugButtonId: "debug-toggle",

    defaultDescriptionStyle: {
      borderColor: "var(--darkest-blue)",
      borderWidth: "2px"
    },

  /* ==========================================================
     BOX REGISTRY (ALL INTERACTION LIVES HERE)
     - the ' brain ' of this current system
     - plain JavaScript object (not special / custom)
     - stores all the data about how the boxes should behave, acting
        acting as a 'data dictionary'
     - each key matches a DOM id 
     - 'items' stored here haven't happened yet - its just stored for
         later when something DOES happen
     - registry says: here is how world-cup-event should behave
     - click handler says: i'll apply that behavior when world-cup-event is clicked
  ========================================================== */

    registry: {

      "cluster-root": {
      accent: "#C67400", 
      mode: "replace",
      description: `
        <div class="description-block" data-block="cluster-root">
          FIBA is the international governing body of basketball.
        </div>
      `,
      behavior: "expand-cluster",
      next: ["events-root"]
    },

    "events-root": {
      accent: "#5A8CFF",
      mode: "replace",
      description: `
        <div class="description-block" data-block="events-root">
          FIBA hosts 
          <span class="highlight" data-source="events-root">
            global basketball events
          </span>
        </div>
      `,
      next: ["olympic-qualification"],

      style: {
        frame: {
          stroke: "#5A8CFF"
        },
        accent: {
          fill: "#5A8CFF",

          transform: "translate(0px, 0px)",
          transition: "transform 0.25s ease"
        },
        label: {
          transform: "translate(0px, 0px)",
          transition: "transform 0.25s ease"
        }
      },

      hoverStyle: {
        accent: {
          transform: "translate(6px, 20px)"
        },
        label: {
          transform: "translate(6px, 20px)"
        }
      },

      previewStyle: {
        accent: {
          transform: "translate(6px, 20px)"
        },
        label: {
          transform: "translate(6px, 20px)"
        }
      },

      activeStyle: {
        accent: {
          stroke: "#333925",
          fill: "#5A8CFF",
          transform: "translate(20px, 20px)"
        },
        label: {
          transform: "translate(20px, 20px)"
        }
      }

    },

    "rules-root": {
      accent: "#490F40",
      mode: "replace",
      description: `
        <div class="description-block" data-block="rules-root">
          Rules define how international basketball
          competitions are governed.
        </div>
      `,
      next: ["fiba-rules"]
    },

    "olympic-qualification": {
      accent: "#F69E00",
      mode: "append",
      description: `
        <div class="description-block" data-block="olympic-qualification">
          where teams can 
          <span class="highlight" data-source="olympic-qualification">
          qualify for the Olympics
          </span>
        </div>
      `,

      next: ["world-cup-event"],

      style: {
        frame: {
          stroke: "#F69E00"
        },
        accent: {
          fill: "#F69E00",
          stroke: "#333925",

          transform: "translate(0px, 0px)",
          transition: "transform 0.25s ease"
        },
        label: {
          // fill: "#ffffff",

          transform: "translate(0px, 0px)",
          transition: "transform 0.25s ease"
        }
      },
      hoverStyle: {
        accent: {
          transform: "translate(-10px, 20px)"
        },
        label: {
          transform: "translate(-10px, 20px)"
        }
      },
      previewStyle: {
        accent: {
          transform: "translate(-10px, 40px)"
          },
        label: {
          transform: "translate(-10px, 40px)"
        }
      },
      activeStyle: {
        accent: {
          transform: "translate(-10px, 40px)"
        },
        label: {
          transform: "translate(-10px, 40px)"
        }
      }
    },

    "world-cup-event": {
      accent: "#950058",
      mode: "append",
      description: `
        <div class="description-block" data-block="world-cup-event">
          like the world cup - which is
          <span class="highlight" data-source="world-cup-event">
            FIBA's MAIN EVENT
          </span>
        </div>
      `,
      next: [],
      behavior: "dual-indicator",

      descriptionStyle: {
        borderColor: "#950058",
        borderWidth: "3px",
        borderStyle: "solid"
      },

      style: {
        frame: {
          stroke: "#5A8CFF"
        }
      },

      activeStyle: {
        accent: {
          stroke: "#F69E00",
          fill: "#ffe5f3"
        }
      },

      indicators: [
        { colorFrom: "events-root" },
        { colorFrom: "olympic-qualification" }
      ],

      // borderRadius: 12,

      inject: {
        id: "world-cup-2026-card",
        path: "world-cup-berlin-card.svg",
        draggable: true,
        x: startX,
        y: startY
      }
    },

    "fiba-rules": {
      accent: "#7a4cff",
      description: `
        <div class="description-block" data-block="fiba-rules">
          FIBA establishes the official international
          basketball rules used globally.
        </div>
      `,
      next: ["olympic-rules", "fiba-pro-play"]
    },

    "olympic-rules": {
      accent: "#444444",
      description: `
        <div class="description-block" data-block="olympic-rules">
          Olympic basketball rules are based on FIBA
          standards with event-specific details.
        </div>
      `,
      next: []
    },

    "fiba-pro-play": {
      accent: "#1a7f37",
      description: `
        <div class="description-block" data-block="fiba-pro-play">
          Most professional leagues outside the NBA
          operate under FIBA rule structure.
        </div>
      `,
      next: []
    }

  },

        labels: {
        "cluster-root": ["GLOBAL", "BASKETBALL", "ORGANIZATION"],
        "events-root": ["EVENTS"],
        "rules-root": ["RULES"],
        "olympic-qualification": ["OLYMPIC", "QUALIFIER"],
        "world-cup-event": ["WORLD", "CUP"],
        "fiba-rules": ["FIBA", "RULES"],
        "olympic-rules": ["OLYMPIC", "BASKETBALL"],
        "fiba-pro-play": ["MOST", "PROFESSIONAL", "PLAY"]
        },

        descriptionContainerId: "cluster-description-container",
        descriptionContentId: "cluster-description-content",

}