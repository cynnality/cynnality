console.log("WNBA team input tool loaded");

let TEAMS = {};
let selectedTeamCode = null;
let championshipYears = [];

const DATA_PATH = "../../basketball_101_data_files/wnba_static_data_v2.json";

// load existing team
const teamSelect = document.getElementById("teamSelect");
const clearFormBtn = document.getElementById("clearFormBtn");

// identity
const teamCodeInput = document.getElementById("teamCode");
const franchiseIdInput = document.getElementById("franchiseId");
const nameFullInput = document.getElementById("nameFull");
const nameShortInput = document.getElementById("nameShort");

// status
const statusActiveInput = document.getElementById("statusActive");
const statusFoldedInput = document.getElementById("statusFolded");
const statusRelocatedInput = document.getElementById("statusRelocated");

const originalYesInput = document.getElementById("originalYes");
const originalNoInput = document.getElementById("originalNo");
const foundedInput = document.getElementById("founded");
const endedInput = document.getElementById("ended");
const endTypeInput = document.getElementById("endType");

// league/location
const conferenceEastInput = document.getElementById("conferenceEast");
const conferenceWestInput = document.getElementById("conferenceWest");
const marketInput = document.getElementById("market");
const cityStateInput = document.getElementById("cityStateInput");
const arenaInput = document.getElementById("arena");

// branding
const slugInput = document.getElementById("slug");
const logoSrcInput = document.getElementById("logoSrc");
const color1Input = document.getElementById("color1");
const color2Input = document.getElementById("color2");
const color3Input = document.getElementById("color3");

const color1Box = document.getElementById("color1Box");
const color2Box = document.getElementById("color2Box");
const color3Box = document.getElementById("color3Box");

function updateColorBoxes() {
  color1Box.style.backgroundColor = color1Input.value || "#eee";
  color2Box.style.backgroundColor = color2Input.value || "#eee";
  color3Box.style.backgroundColor = color3Input.value || "#eee";
}

const courtMainInput = document.getElementById("courtMain");
const courtLinesInput = document.getElementById("courtLines");
const courtAccentInput = document.getElementById("courtAccent");

// history
const formerTeamCodeInput = document.getElementById("formerTeamCode");
const relocatedFromInput = document.getElementById("relocatedFrom");
const relocatedToInput = document.getElementById("relocatedTo");
const brandStatusInput = document.getElementById("brandStatus");
const revivedByTeamCodeInput = document.getElementById("revivedByTeamCode");
const revivesTeamCodeInput = document.getElementById("revivesTeamCode");

// championships/meta
const championshipYearInput = document.getElementById("championshipYear");
const addChampionshipYearBtn = document.getElementById("addChampionshipYearBtn");
const championshipYearsList = document.getElementById("championshipYearsList");
const favoriteInput = document.getElementById("favorite");

// preview
const copyJsonBtn = document.getElementById("copyJsonBtn");
const jsonPreview = document.getElementById("jsonPreview");

const saveJsonBtn = document.getElementById("saveJsonBtn");

async function loadTeamsData() {
  try {
    const res = await fetch(DATA_PATH);
    const data = await res.json();

    TEAMS = data.teams || {};
    populateTeamSelect();
  } catch (error) {
    console.error("Could not load WNBA teams:", error);
  }
}

function populateTeamSelect() {
  teamSelect.innerHTML = `<option value="">-- Select team --</option>`;

  Object.entries(TEAMS)
    .sort((a, b) => a[1].name.full.localeCompare(b[1].name.full))
    .forEach(([teamCode, team]) => {
      const option = document.createElement("option");
      option.value = teamCode;
      option.textContent = `${team.name.full} (${teamCode})`;
      teamSelect.appendChild(option);
    });
}

function setInputValue(input, value) {
  input.value = value ?? "";
}

function fillFormFromTeam(team) {
  selectedTeamCode = team.teamCode;

  setInputValue(teamCodeInput, team.teamCode);
  setInputValue(franchiseIdInput, team.franchiseId);

  setInputValue(nameFullInput, team.name?.full);
  setInputValue(nameShortInput, team.name?.short);

    if (team.status?.isActive) {
    statusActiveInput.checked = true;
    } else if (team.status?.endType === "relocated") {
    statusRelocatedInput.checked = true;
    } else {
    statusFoldedInput.checked = true;
    }

    if (team.status?.isOriginalTeam) {
    originalYesInput.checked = true;
    } else {
    originalNoInput.checked = true;
    }

  setInputValue(foundedInput, team.status?.founded);
  setInputValue(endedInput, team.status?.ended);
  setInputValue(endTypeInput, team.status?.endType);

    if (team.league?.conference === "east") {
        conferenceEastInput.checked = true;
    }

    if (team.league?.conference === "west") {
        conferenceWestInput.checked = true;
    }

  setInputValue(marketInput, team.location?.market);
  setInputValue(cityStateInput, `${team.location?.city || ""}, ${team.location?.state || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, ""));
  setInputValue(arenaInput, team.location?.arena);

  setInputValue(slugInput, team.branding?.slug);
  setInputValue(logoSrcInput, team.branding?.logo?.src);

  setInputValue(color1Input, team.branding?.colors?.color1);
  setInputValue(color2Input, team.branding?.colors?.color2);
  setInputValue(color3Input, team.branding?.colors?.color3);

  updateColorBoxes();

  setInputValue(courtMainInput, team.branding?.courtColors?.main);
  setInputValue(courtLinesInput, team.branding?.courtColors?.lines);
  setInputValue(courtAccentInput, team.branding?.courtColors?.accent);

  setInputValue(formerTeamCodeInput, team.history?.formerTeamCode);
  setInputValue(relocatedFromInput, team.history?.relocatedFrom);
  setInputValue(relocatedToInput, team.history?.relocatedTo);
  setInputValue(brandStatusInput, team.history?.brandStatus);
  setInputValue(revivedByTeamCodeInput, team.history?.revivedByTeamCode);
  setInputValue(revivesTeamCodeInput, team.history?.revivesTeamCode);

  championshipYears = Array.isArray(team.championshipYears)
    ? [...team.championshipYears]
    : [];

  favoriteInput.checked = Boolean(team.meta?.favorite);

    renderChampionshipYearsList();
    syncTeamStatusFields();
    syncOriginalTeamFields();
    updateJSONPreview();
}

function getTeamObject() {
  const teamCode = teamCodeInput.value || "TEAM_CODE_HERE";

  const history = {
    formerTeamCode: formerTeamCodeInput.value || null,
    relocatedFrom: relocatedFromInput.value || null,
    relocatedTo: relocatedToInput.value || null
  };

  if (brandStatusInput.value) {
    history.brandStatus = brandStatusInput.value;
  }

  if (revivedByTeamCodeInput.value) {
    history.revivedByTeamCode = revivedByTeamCodeInput.value;
  }

  if (revivesTeamCodeInput.value) {
    history.revivesTeamCode = revivesTeamCodeInput.value;
  }

  const parsedName = parseTeamName(nameFullInput.value);
  const parsedLocation = parseCityState(cityStateInput.value);

  return {
    teamCode: teamCode,
    franchiseId: franchiseIdInput.value || null,

    name: {
      full: nameFullInput.value,
      city: parsedName.city,
      mascot: parsedName.mascot,
      short: nameShortInput.value
    },

    status: {
      isActive: statusActiveInput.checked,
      isOriginalTeam: originalYesInput.checked,
      founded: foundedInput.value ? Number(foundedInput.value) : null,
      ended: endedInput.value ? Number(endedInput.value) : null,
      endType: endTypeInput.value || null
    },

    league: {
      conference: conferenceEastInput.checked ? "east" : conferenceWestInput.checked ? "west" : ""
    },

    location: {
      market: marketInput.value,
      state: parsedLocation.state,
      city: parsedLocation.city,
      arena: arenaInput.value || null
    },

    branding: {
      slug: slugInput.value,
      logo: {
        src: logoSrcInput.value,
        alt: `${nameFullInput.value} Logo`
      },
      colors: {
        color1: color1Input.value,
        color2: color2Input.value,
        color3: color3Input.value
      },
      courtColors: {
        main: courtMainInput.value,
        lines: courtLinesInput.value,
        accent: courtAccentInput.value
      }
    },

    history: history,

    championshipYears: championshipYears,

    meta: {
      favorite: favoriteInput.checked
    }
  };
}

function buildTeamObject() {
  const teamObject = getTeamObject();
  return {
    [teamObject.teamCode]: teamObject
  };
}

function lockEditPanels() {
  document.querySelectorAll(".panel.input").forEach((panel) => {
    if (panel.querySelector("#teamSelect")) return;

    panel.classList.add("locked");

    panel.querySelectorAll("input, button, textarea, select").forEach((field) => {
        if (
        field.classList.contains("edit-panel-toggle") ||
        field.classList.contains("copy-color-btn")
        ) return;
      field.disabled = true;
    });

    const toggle = panel.querySelector(".edit-panel-toggle");
    if (toggle) toggle.checked = false;
  });
}

function setupEditToggles() {
  document.querySelectorAll(".edit-panel-toggle").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const panel = toggle.closest(".panel");
      const isEditing = toggle.checked;

      panel.classList.toggle("locked", !isEditing);
      panel.classList.toggle("editing", isEditing);

      panel.querySelectorAll("input, button, textarea, select").forEach((field) => {
            if (
            field.classList.contains("edit-panel-toggle") ||
            field.classList.contains("copy-color-btn")
            ) return;
        field.disabled = !isEditing;
      });
    });
  });
}

const endedFieldWrapper = document.getElementById("endedFieldWrapper");

function syncTeamStatusFields() {
  if (statusActiveInput.checked) {
    endTypeInput.value = "";
    endedFieldWrapper.style.display = "none";
    endedInput.value = "";
  }

  if (statusFoldedInput.checked) {
    endTypeInput.value = "folded";
    endedFieldWrapper.style.display = "block";
  }

  if (statusRelocatedInput.checked) {
    endTypeInput.value = "relocated";
    endedFieldWrapper.style.display = "block";
  }

  updateJSONPreview();
}

function syncOriginalTeamFields() {
  if (originalYesInput.checked) {
    foundedInput.value = "1997";
  }

  if (originalNoInput.checked) {
    if (foundedInput.value === "1997") {
      foundedInput.value = "";
    }

  }

  updateJSONPreview();
}

function updateJSONPreview() {
  const output = buildTeamObject();
  jsonPreview.textContent = JSON.stringify(output, null, 2);
}

function renderChampionshipYearsList() {
  championshipYearsList.innerHTML = "";

  championshipYears.forEach((year) => {
    const li = document.createElement("li");
    li.textContent = year;
    championshipYearsList.appendChild(li);
  });
}

function parseCityState(value) {
  const [cityRaw = "", stateRaw = ""] = value.split(",");

  return {
    city: cityRaw.trim(),
    state: stateRaw.trim()
  };
}

function parseTeamName(fullName) {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length <= 1) {
    return {
      city: fullName.trim(),
      mascot: ""
    };
  }

  return {
    city: parts.slice(0, -1).join(" "),
    mascot: parts.slice(-1).join("")
  };
}

teamSelect.addEventListener("change", () => {
  const teamCode = teamSelect.value;

  if (!teamCode) return;

    fillFormFromTeam(TEAMS[teamCode]);
    lockEditPanels();
});

addChampionshipYearBtn.addEventListener("click", () => {
  const year = Number(championshipYearInput.value);

  if (!year) return;

  championshipYears.push(year);
  championshipYears.sort((a, b) => a - b);

  renderChampionshipYearsList();
  updateJSONPreview();

  championshipYearInput.value = "";
});

const liveInputs = document.querySelectorAll("input");

liveInputs.forEach((input) => {
  input.addEventListener("input", () => {
    updateJSONPreview();
    updateColorBoxes();
  });

  input.addEventListener("change", () => {
    updateJSONPreview();
    updateColorBoxes();
  });
});

[statusActiveInput, statusFoldedInput, statusRelocatedInput].forEach((input) => {
  input.addEventListener("change", syncTeamStatusFields);
});

[originalYesInput, originalNoInput].forEach((input) => {
  input.addEventListener("change", syncOriginalTeamFields);
});

document.querySelectorAll(".copy-color-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const inputId = button.dataset.colorInput;
    const input = document.getElementById(inputId);
    const hex = input.value;

    if (!hex) return;

    try {
      await navigator.clipboard.writeText(hex);
      button.textContent = "Copied!";

      setTimeout(() => {
        button.textContent = `Copy ${inputId}`;
      }, 1200);
    } catch (error) {
      console.error("Color copy failed:", error);
    }
  });
});

clearFormBtn.addEventListener("click", () => {
  selectedTeamCode = null;
  championshipYears = [];

  document.querySelectorAll("input").forEach((input) => {
    if (input.type === "checkbox" || input.type === "radio") {
      input.checked = false;
    } else {
      input.value = "";
    }
  });

    teamSelect.value = "";
    renderChampionshipYearsList();
    syncTeamStatusFields();
    syncOriginalTeamFields();
    updateColorBoxes();
    updateJSONPreview();
});

copyJsonBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(jsonPreview.textContent);
    copyJsonBtn.textContent = "Copied!";

    setTimeout(() => {
      copyJsonBtn.textContent = "Copy JSON";
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Copy failed. You can still manually select and copy the JSON.");
  }
});

saveJsonBtn.addEventListener("click", async () => {
  const teamObject = getTeamObject();

  try {
    const response = await fetch("http://127.0.0.1:8787/save-wnba-team", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(teamObject)
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Save failed");
    }

    saveJsonBtn.textContent = "Saved!";

    setTimeout(() => {
      saveJsonBtn.textContent = "Save JSON File";
    }, 1200);
  } catch (error) {
    console.error(error);
    alert("Save failed. Make sure the local save server is running.");
  }
});

document.querySelectorAll(".panel.input .panel-header h2").forEach((heading) => {
  heading.addEventListener("click", () => {
    const panel = heading.closest(".panel");
    panel.classList.toggle("collapsed");
  });
});

window.addEventListener("load", () => {
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = false;
    } else {
      field.value = "";
    }
  });

  selectedTeamCode = null;
  championshipYears = [];

  setupEditToggles();
  renderChampionshipYearsList();
  syncTeamStatusFields();
  syncOriginalTeamFields();
  updateColorBoxes();
  updateJSONPreview();
  loadTeamsData();
});