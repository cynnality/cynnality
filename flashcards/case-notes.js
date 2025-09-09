// --- Global Variables ---
let attributeLookup = {}; 
let cases = [];
let current = 0;
let conElemData = {};
let articleData = {};
let amendmentData = {};

// --- Helper Functions ---
function getReadable(tag, section) {
  if (!attributeLookup[section]) return tag;
  if (section === "con-elem") {
    const entry = attributeLookup[section][tag];
    return entry && entry.name ? entry.name : tag;
  }
  return attributeLookup[section][tag] || tag;
}

function renderList(arr, label, section) {
  if (!arr || !arr.length) return "";
  let displayArr = arr.map(tag => getReadable(tag, section));
  return `<div class="case-attr-block"><span class="case-attr-label">${label}:</span> ${displayArr.join(", ")}</div>`;
}

// --- Data Loading ---
Promise.all([
  fetch("con-elem-bank.json").then(res => res.json()),
  fetch("articles-bank.json").then(res => res.json()),
  fetch("amendment-bank.json").then(res => res.json()),
  fetch("case-attribute-bank.json").then(res => res.json()),
  fetch("case-notes.json").then(res => res.json())
]).then(([conElem, articles, amendments, attr, caseNotes]) => {
  conElemData = conElem;
  articleData = articles;
  amendmentData = amendments;
  attributeLookup = attr;
  cases = caseNotes;
  renderCase();
});

// --- Render Functions ---
function renderCase() {
  closePopup();
  const c = cases[current];
  const container = document.getElementById("case-slide-container");
  if (!c) {
    container.innerHTML = "<h2>No case found.</h2>";
    return;
  }

  // Render facts block if present
  let factsHtml = "";
  if (c.details && c.details.facts && c.details.facts.length) {
    factsHtml = `<div class="case-detail-block facts-block"><span class="case-detail-label">Facts:</span><ol>`;
    c.details.facts.forEach(fact => factsHtml += `<li>${fact}</li>`);
    factsHtml += `</ol></div>`;
  }

  let html = `
      <div class="case-title"><h2 id="${c.case_id}">${c.case_name}</h2></div>
      <div class="top-bar">
      <div class="title-and-elements">
        <div class="case-attr-block"><span class="case-attr-label">decided in:</span> ${c.attributes.year || ""}</div>
        ${renderArticleButtons(c.attributes.articles)}
        ${renderAmendmentButtons(c.attributes.amendments)}
        ${renderConElem(c.attributes.con_elem)}
        ${renderList(c.attributes.federal_law, "Federal Law", "federal-law")}
        ${renderList(c.attributes.state_law, "State Law", "state-law")}
        ${renderList(c.attributes.executive_order, "Executive Order", "executive-order")}
        ${renderList(c.attributes.case_law, "Case Law", "case-law")}
      </div> 
      ${factsHtml}  
    </div>
  `;

  // Details (excluding facts)
  html += `<div class="case-details">`;
  if (c.details && c.details["issues-questions"]) {
    html += `<div class="case-detail-block"><span class="case-detail-label">main question(s):</span> ${c.details["issues-questions"]}</div>`;
  }
  if (c.details && c.details.decision) {
    html += `<div class="case-detail-block"><span class="case-detail-label">the court's decision:</span> ${c.details.decision}</div>`;
  }
  if (c.details && c.details.impact) {
    html += `<div class="case-detail-block"><span class="case-detail-label">the decision's impact:</span> ${c.details.impact}</div>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

function renderConElem(arr) {
  if (!arr || !arr.length) return "";
  let html = `<div class="case-attr-block"><span class="case-attr-label">constitutional elements:</span><ul>`;
  arr.forEach(tag => {
    const entry = conElemData[tag];
    if (entry) {
      let assign = entry.article ? entry.article : entry.amendment ? entry.amendment : "";
      html += `<li>
        <button class="neo-btn clause-btn" data-type="con-elem" data-id="${tag}">
          <strong>${entry.name}</strong>${assign ? ` <span style="color:#555;">(${assign})</span>` : ""}
        </button>
      </li>`;
    } else {
      html += `<li>${tag}</li>`;
    }
  });
  html += "</ul></div>";
  return html;
}

function renderArticleButtons(arr) {
  if (!arr || !arr.length) return "";
  let html = `<div class="case-attr-block"><span class="case-attr-label">Articles:</span><ul>`;
  arr.forEach(tag => {
    const entry = articleData[tag];
    if (entry) {
      html += `<li>
        <button class="neo-btn clause-btn" data-type="article" data-id="${tag}">
          <strong>${entry.name}</strong>
        </button>
      </li>`;
    } else {
      html += `<li>${tag}</li>`;
    }
  });
  html += "</ul></div>";
  return html;
}

function renderAmendmentButtons(arr) {
  if (!arr || !arr.length) return "";
  let html = `<div class="case-attr-block"><span class="case-attr-label">Amendments:</span><ul>`;
  arr.forEach(tag => {
    const entry = amendmentData[tag];
    if (entry) {
      html += `<li>
        <button class="neo-btn clause-btn" data-type="amendment" data-id="${tag}">
          <strong>${entry.name}</strong>
        </button>
      </li>`;
    } else {
      html += `<li>${tag}</li>`;
    }
  });
  html += "</ul></div>";
  return html;
}

// --- Popup Logic ---
document.getElementById("case-slide-container").addEventListener("click", function(e) {
  const btn = e.target.closest(".clause-btn");
  if (btn) {
    const type = btn.getAttribute("data-type");
    const id = btn.getAttribute("data-id");
    let info;
    if (type === "con-elem") {
      info = conElemData[id];
    } else if (type === "article") {
      info = articleData[id];
    } else if (type === "amendment") {
      info = amendmentData[id];
    }
    if (info) showPopup(info, type, id);
  }
});

function showPopup(info, type, id) {
  const popup = document.getElementById("popup-window");
  let html = `<div class="popup-header" style="cursor:move; background:#ffe600; border-bottom:2px solid #222; padding:8px;">
    <span style="font-weight:bold;">${info.name || id}</span>
    <button onclick="closePopup()" style="float:right; background:#fff; border:2px solid #222; font-size:1.2em;">×</button>
  </div>
  <div class="popup-content" style="padding:16px;">`;

  if (type === "con-elem") {
    html += `<div><strong>Definition:</strong> ${info.definition || ""}</div>`;
    if (info.article) html += `<div><strong>Article:</strong> ${info.article}</div>`;
    if (info.amendment) html += `<div><strong>Amendment:</strong> ${info.amendment}</div>`;
    if (info.cases && info.cases.length) {
      html += `<div><strong>Related Cases:</strong><ul>`;
      info.cases.forEach(cid => {
        html += `<li>${cid}</li>`;
      });
      html += `</ul></div>`;
    }
  } else if (type === "article") {
    html += `<div><strong>Title:</strong> ${info.title || ""}</div>`;
    if (info.sections) {
      html += `<div><strong>Sections:</strong><ul>`;
      Object.values(info.sections).forEach(section => {
        html += `<li><strong>${section.name}:</strong> ${section.title || ""}`;
        if (section.content && section.content.length) {
          html += `<ul>`;
          section.content.forEach(point => {
            html += `<li>${point}</li>`;
          });
          html += `</ul>`;
        }
        html += `</li>`;
      });
      html += `</ul></div>`;
    }
    if (info.clauses && info.clauses.length) {
      html += `<div><strong>Clauses:</strong><ul>`;
      info.clauses.forEach(clause => {
        html += `<li>${clause}</li>`;
      });
      html += `</ul></div>`;
    }
  } else if (type === "amendment") {
    html += `<div><strong>Title:</strong> ${info.title || ""}</div>`;
    html += `<div><strong>Definition:</strong> ${info.definition || ""}</div>`;
    if (info.clauses && info.clauses.length) {
      html += `<div><strong>Clauses:</strong><ul>`;
      info.clauses.forEach(clause => {
        html += `<li>${clause}</li>`;
      });
      html += `</ul></div>`;
    }
    if (info.cases && info.cases.length) {
      html += `<div><strong>Related Cases:</strong><ul>`;
      info.cases.forEach(cid => {
        html += `<li>${cid}</li>`;
      });
      html += `</ul></div>`;
    }
  }

  html += `</div>`;
  popup.innerHTML = html;
  popup.style.display = "block";
  popup.style.left = "5vw";
  popup.style.top = "60vh";
  popup.style.width = "400px";
  popup.style.background = "#fff";
  popup.style.border = "4px solid #222";
  popup.style.boxShadow = "12px 12px 0 #222";
  popup.style.borderRadius = "0";
  popup.style.resize = "both";
  popup.style.overflow = "auto";
  makeDraggable(popup, popup.querySelector('.popup-header'));
}

function closePopup() {
  document.getElementById("popup-window").style.display = "none";
}

// --- Draggable Popup Logic ---
function makeDraggable(popup, header) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.onmousedown = function(e) {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
    document.body.style.userSelect = "none";
  };

  document.onmousemove = function(e) {
    if (isDragging) {
      popup.style.left = (e.clientX - offsetX) + "px";
      popup.style.top = (e.clientY - offsetY) + "px";
    }
  };

  document.onmouseup = function() {
    isDragging = false;
    document.body.style.userSelect = "";
  };
}

// --- Navigation ---
document.getElementById("prev-case").onclick = function() {
  if (current > 0) {
    current--;
    renderCase();
  }
};
document.getElementById("next-case").onclick = function() {
  if (current < cases.length - 1) {
    current++;
    renderCase();
  }
};