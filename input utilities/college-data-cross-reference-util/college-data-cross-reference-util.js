const DATA_PATHS = {
    colleges: "../../basketball_101_data_files/wnba_colleges.json",
    drafts: "../../basketball_101_data_files/wnba_drafts_data.json"
};

const SAVE_COLLEGE_URL = "http://127.0.0.1:8787/save-college";
const SAVE_DRAFT_URL = "http://127.0.0.1:8787/save-draft";

let COLLEGES_DATA = { colleges: {} };
let DRAFTS_DATA = { drafts: {} };
let activeIssue = null;

const runChecksBtn = document.getElementById("runChecksBtn");
const statusMessage = document.getElementById("statusMessage");

const missingCollegeCount = document.getElementById("missingCollegeCount");
const okCollegeCount = document.getElementById("okCollegeCount");

const missingCollegeList = document.getElementById("missingCollegeList");
const okCollegeList = document.getElementById("okCollegeList");

const collegeModalOverlay = document.getElementById("collegeModalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveCollegeBtn = document.getElementById("saveCollegeBtn");
const modalStatusMessage = document.getElementById("modalStatusMessage");

const collegeNameInput = document.getElementById("collegeNameInput");
const collegeIdInput = document.getElementById("collegeIdInput");
const refName1Input = document.getElementById("refName1Input");
const refName2Input = document.getElementById("refName2Input");
const refName3Input = document.getElementById("refName3Input");
const refName4Input = document.getElementById("refName4Input");

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (!response.ok) return fallback;

        const text = await response.text();

        if (!text.trim()) return fallback;

        return JSON.parse(text);
    } catch (error) {
        console.warn(`Could not load ${path}`, error);
        return fallback;
    }
}

function makeCollegeId(value) {
    const cleaned = String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
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

function collegeExists(collegeId) {
    return Boolean(COLLEGES_DATA.colleges?.[collegeId]);
}

function collectDraftCollegeReferences() {
    const references = [];

    Object.values(DRAFTS_DATA.drafts || {}).forEach(draft => {
        Object.values(draft.rounds || {}).forEach(round => {
            Object.values(round.picks || {}).forEach(pick => {
                const college = pick.college;

                if (!college) return;

                references.push({
                    sourceType: "draft",
                    sourceFile: "wnba_drafts_data.json",
                    sourceLabel: `${draft.draftName} — Pick #${pick.overallPick}`,
                    detailPath: `drafts.${draft.draftId}.rounds.${round.roundNumber}.picks.${pick.pickId}.college`,
                    draftId: draft.draftId,
                    seasonId: draft.seasonId,
                    pickId: pick.pickId,
                    roundNumber: round.roundNumber,
                    collegeId: college.collegeId,
                    collegeName: college.collegeName,
                    existsInCollegeFile: college.existsInCollegeFile
                });
            });
        });
    });

    return references;
}

function classifyCollegeReferences(references) {
    const missing = [];
    const ok = [];

    references.forEach(reference => {
        const exists = collegeExists(reference.collegeId);

        if (!exists || reference.existsInCollegeFile === false) {
            missing.push({
                ...reference,
                issueType: "missing-college",
                message: `${reference.collegeName} is referenced in ${reference.sourceFile}, but is not confirmed in the main college file.`
            });
            return;
        }

        ok.push({
            ...reference,
            issueType: "ok",
            message: `${reference.collegeName} matched successfully.`
        });
    });

    return { missing, ok };
}

function renderIssueList(container, issues, type) {
    container.innerHTML = "";

    if (!issues.length) {
        container.innerHTML = `<p class="empty-message">No issues found.</p>`;
        return;
    }

    issues.forEach(issue => {
        const card = document.createElement("article");
        card.className = "issue-card";

        card.innerHTML = `
            <div class="issue-title">${issue.collegeName || issue.collegeId}</div>

            <div class="issue-meta">
                <span><strong>Issue:</strong> ${issue.message}</span>
                <span><strong>Source:</strong> ${issue.sourceLabel}</span>
                <span><strong>Path:</strong> ${issue.detailPath}</span>
                <span><strong>College ID:</strong> ${issue.collegeId}</span>
            </div>

            ${
                type === "missing"
                    ? `
                        <div class="issue-actions">
                            <button type="button" class="add-college-btn">Add College</button>
                        </div>
                    `
                    : ""
            }
        `;

        const addButton = card.querySelector(".add-college-btn");

        if (addButton) {
            addButton.addEventListener("click", () => openCollegeModal(issue));
        }

        container.appendChild(card);
    });
}

function renderResults(results) {
    missingCollegeCount.textContent = results.missing.length;
    okCollegeCount.textContent = results.ok.length;

    renderIssueList(missingCollegeList, results.missing, "missing");
    renderIssueList(okCollegeList, results.ok, "ok");
}

async function runChecks() {
    statusMessage.textContent = "Loading college and draft data...";

    COLLEGES_DATA = await loadJson(DATA_PATHS.colleges, { colleges: {} });
    DRAFTS_DATA = await loadJson(DATA_PATHS.drafts, { drafts: {} });

    const references = collectDraftCollegeReferences();
    const results = classifyCollegeReferences(references);

    renderResults(results);

    statusMessage.textContent = `Checked ${references.length} college references.`;
}

function openCollegeModal(issue) {
    activeIssue = issue;

    collegeNameInput.value = issue.collegeName || "";
    collegeIdInput.value = issue.collegeId || makeCollegeId(issue.collegeName);

    refName1Input.value = issue.collegeName || "";
    refName2Input.value = "";
    refName3Input.value = "";
    refName4Input.value = "";

    modalStatusMessage.textContent = "";
    collegeModalOverlay.classList.remove("hidden");
}

function closeCollegeModal() {
    activeIssue = null;
    collegeModalOverlay.classList.add("hidden");
}

function buildRefNames() {
    const refNames = {};

    [refName1Input, refName2Input, refName3Input, refName4Input].forEach((input, index) => {
        const value = input.value.trim();

        if (value) {
            refNames[`refName${index + 1}`] = value;
        }
    });

    return refNames;
}

function buildCollegePayload() {
    return {
        collegeId: collegeIdInput.value.trim(),
        name: collegeNameInput.value.trim(),
        refNames: buildRefNames()
    };
}

function findPickInDraft(draft, pickId) {
    for (const round of Object.values(draft.rounds || {})) {
        if (round.picks?.[pickId]) {
            return round.picks[pickId];
        }
    }

    return null;
}

function patchDraftCollegeReference(issue, collegePayload) {
    const draft = DRAFTS_DATA.drafts?.[issue.draftId];

    if (!draft) {
        throw new Error(`Draft not found: ${issue.draftId}`);
    }

    const pick = findPickInDraft(draft, issue.pickId);

    if (!pick) {
        throw new Error(`Pick not found: ${issue.pickId}`);
    }

    pick.college = {
        collegeId: collegePayload.collegeId,
        collegeName: collegePayload.name,
        existsInCollegeFile: true
    };

    return draft;
}

async function saveCollegeAndResolve() {
    if (!activeIssue) return;

    const collegePayload = buildCollegePayload();

    if (!collegePayload.collegeId || !collegePayload.name) {
        modalStatusMessage.textContent = "College name and college ID are required.";
        return;
    }

    try {
        modalStatusMessage.textContent = "Saving college...";

        const collegeResponse = await fetch(SAVE_COLLEGE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(collegePayload)
        });

        const collegeResult = await collegeResponse.json();

        if (!collegeResponse.ok || !collegeResult.ok) {
            throw new Error(collegeResult.error || "College save failed.");
        }

        COLLEGES_DATA.colleges[collegePayload.collegeId] = collegePayload;

        const patchedDraft = patchDraftCollegeReference(activeIssue, collegePayload);

        modalStatusMessage.textContent = "Updating draft reference...";

        const draftResponse = await fetch(SAVE_DRAFT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patchedDraft)
        });

        const draftResult = await draftResponse.json();

        if (!draftResponse.ok || !draftResult.ok) {
            throw new Error(draftResult.error || "Draft update failed.");
        }

        modalStatusMessage.textContent = "Saved!";

        setTimeout(() => {
            closeCollegeModal();
            runChecks();
        }, 700);
    } catch (error) {
        modalStatusMessage.textContent = `Error: ${error.message}`;
    }
}

function bindEvents() {
    runChecksBtn.addEventListener("click", runChecks);
    closeModalBtn.addEventListener("click", closeCollegeModal);
    saveCollegeBtn.addEventListener("click", saveCollegeAndResolve);

    collegeNameInput.addEventListener("input", () => {
        collegeIdInput.value = makeCollegeId(collegeNameInput.value);
    });

    collegeModalOverlay.addEventListener("click", event => {
        if (event.target === collegeModalOverlay) {
            closeCollegeModal();
        }
    });
}

bindEvents();
runChecks();