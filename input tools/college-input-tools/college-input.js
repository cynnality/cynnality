console.log("College input tool loaded");

// inputs
const collegeNameInput = document.getElementById("collegeName");
const collegeIdInput = document.getElementById("collegeId");
const editCollegeIdBtn = document.getElementById("editCollegeIdBtn");

const refName1Input = document.getElementById("refName1");
const refName2Input = document.getElementById("refName2");
const refName3Input = document.getElementById("refName3");
const refName4Input = document.getElementById("refName4");

const copyJsonBtn = document.getElementById("copyJsonBtn");
const jsonPreview = document.getElementById("jsonPreview");

let collegeIdManualMode = false;

function createCollegeIdFromName(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  if (cleaned.startsWith("university of ")) {
    return cleaned.replace("university of ", "u_of_").replace(/\s+/g, "_");
  }

  if (cleaned.endsWith(" university")) {
    return cleaned.replace(" university", "_u").replace(/\s+/g, "_");
  }

  return cleaned.replace(/\s+/g, "_");
}

function buildRefNames() {
  const refNames = {};

  [refName1Input, refName2Input, refName3Input, refName4Input].forEach((input, index) => {
    if (input.value.trim()) {
      refNames[`refName${index + 1}`] = input.value.trim();
    }
  });

  return refNames;
}

function updateJSONPreview() {
  const collegeId = collegeIdInput.value || "college_id_here";

  const output = {
    [collegeId]: {
      name: collegeNameInput.value,
      refNames: buildRefNames()
    }
  };

  jsonPreview.textContent = JSON.stringify(output, null, 2);
}

collegeNameInput.addEventListener("input", () => {
  if (!collegeIdManualMode) {
    collegeIdInput.value = createCollegeIdFromName(collegeNameInput.value);
  }

  updateJSONPreview();
});

[refName1Input, refName2Input, refName3Input, refName4Input].forEach((input) => {
  input.addEventListener("input", updateJSONPreview);
});

editCollegeIdBtn.addEventListener("click", () => {
  collegeIdManualMode = true;
  collegeIdInput.readOnly = false;
  collegeIdInput.focus();
  editCollegeIdBtn.textContent = "Confirm collegeId";
});

collegeIdInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    confirmCollegeIdEdit();
  }
});

collegeIdInput.addEventListener("blur", () => {
  if (collegeIdManualMode) {
    confirmCollegeIdEdit();
  }
});

function confirmCollegeIdEdit() {
  collegeIdManualMode = false;
  collegeIdInput.readOnly = true;
  editCollegeIdBtn.textContent = "Edit collegeId";
  updateJSONPreview();
}

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

window.addEventListener("load", () => {
  document.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });

  updateJSONPreview();
});


// ======== COLLAPSE / EXPAND HEADERS ======================
document.querySelectorAll(".panel.input > h2").forEach((heading) => {
  heading.addEventListener("click", () => {
    const panel = heading.closest(".panel");
    panel.classList.toggle("collapsed");
  });
});