//FUNCTIONAL wiki player look up - no styles

// --- WIKIPEDIA API ENDPOINTS ---
let searchUrl =
  "https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&format=json&search=";

// Updated endpoint: must use 'rvslots=*&rvprop=content'
let contentUrl =
  "https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=revisions&rvslots=*&rvprop=content&format=json&titles=";

let userInput;
let resultDiv;
let infoBoxDiv;

function setup() {
  noCanvas();

  userInput = select("#userinput");
  button = select("#startSearch");
  button.mousePressed(startSearch);

  createP("------");
  infoBoxDiv = createDiv().id("infobox-data");

  createP("------");
  resultDiv = createDiv().id("result");
}

function startSearch() {
  infoBoxDiv.html("<em>Loading...</em>");
  resultDiv.html("");
  goWiki(userInput.value());
}

function goWiki(term) {
  let url = searchUrl + encodeURIComponent(term);
  loadJSON(url, gotSearch, "jsonp");
}

function gotSearch(data) {
  if (data[1].length === 0) {
    infoBoxDiv.html("No results found for that search term.");
    return;
  }

  let title = data[1][0].replace(/\s+/g, "_");
  createDiv("Querying page: " + title);

  let url = contentUrl + title;
  loadJSON(url, gotContent, "jsonp");
}

function gotContent(data) {
  let page = data.query.pages;
  let pageId = Object.keys(page)[0];

  if (!page[pageId].revisions) {
    infoBoxDiv.html("No infobox data found on this page.");
    return;
  }

  let content = page[pageId].revisions[0].slots.main["*"];

  // Match several possible basketball infobox templates
  let infoboxRegex = /\{\{Infobox (?:basketball biography|basketball player|sportsperson)([\s\S]*?)\n\}\}/;
  let match = content.match(infoboxRegex);

  if (!match) {
    infoBoxDiv.html(
      'Could not find a recognizable "Infobox basketball" template.'
    );
    return;
  }

  let infoboxContent = match[1].trim();

  // --- Parse infobox line by line (safe for multi-line values) ---
  let rawFields = {};
  let currentKey = null;

  infoboxContent.split("\n").forEach((line) => {
    let fieldMatch = line.match(/^\|\s*([^=]+?)\s*=\s*(.*)$/);
    if (fieldMatch) {
      currentKey = fieldMatch[1].trim();
      rawFields[currentKey] = fieldMatch[2].trim();
    } else if (currentKey && line.trim().startsWith("*")) {
      rawFields[currentKey] += "\n" + line.trim();
    } else if (currentKey && line.trim() && !line.startsWith("|")) {
      rawFields[currentKey] += " " + line.trim();
    }
  });

  // --- CLEAN + EXTRACT TARGET FIELDS ---
  const targetKeys = [
    "image",
    "position",
    "team",
    "league",
    "height_ft",
    "height_in",
    "weight_lb",
    "birth_date",
    "draft_year",
    "draft_pick",
    "high_school",
    "college",
    "highlights",
  ];

  let extractedData = {};

  targetKeys.forEach((key) => {
    if (rawFields[key]) {
      let value = rawFields[key];
      value = cleanWikiMarkup(value);
      if (key === "highlights") {
        value = value.replace(/\*/g, "").trim();
        value = value.replace(/\n/g, "<br>");
      }
      extractedData[key] = value.trim();
    }
  });

  // --- TEAM HISTORY HANDLING ---
  let teamHistory = [];
  for (let i = 1; i < 20; i++) {
    let yearsKey = `years${i}`;
    let teamKey = `team${i}`;
    if (rawFields[teamKey]) {
      let years = rawFields[yearsKey] ? cleanWikiMarkup(rawFields[yearsKey]) : "";
      let team = cleanWikiMarkup(rawFields[teamKey]);
      let entry = years ? `${years} — ${team}` : team;
      teamHistory.push(entry);
    }
  }

  // --- BUILD DISPLAY HTML ---
  let displayHtml = `<h2>${page[pageId].title}</h2>`;

// Add image (if available)
if (extractedData.image) {
  let imageFile = extractedData.image.replace(/File:/i, "").trim();
  let imageUrl =
    "https://en.wikipedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(imageFile);
  displayHtml += `<img src="${imageUrl}" alt="${page[pageId].title}" style="max-width:200px; border-radius:8px; display:block; margin:0 auto 15px;">`;
}

// REMOVED: background styling div, now just plain content
displayHtml += `<div style="font-family:sans-serif; max-width:500px; color:#000000; margin:0 auto;">`;

const appendRow = (label, value) => {
  if (value) displayHtml += `<p style="color:#000000;"><strong>${label}:</strong> ${value}</p>`;
};

  appendRow("Position", extractedData.position);
  appendRow("League", extractedData.league);
  appendRow("Current Team", extractedData.team);
  appendRow("College", extractedData.college);
  appendRow("High School", extractedData.high_school);
  appendRow("Birth Date", extractedData.birth_date);

  // Height/Weight
  let height = "";
  if (extractedData.height_ft) height += extractedData.height_ft + "' ";
  if (extractedData.height_in) height += extractedData.height_in + '"';
  appendRow("Height", height);
  appendRow(
    "Weight",
    extractedData.weight_lb ? extractedData.weight_lb + " lbs" : ""
  );

  // Draft info
  let draft = "";
  if (extractedData.draft_pick) draft += `#${extractedData.draft_pick} pick`;
  if (extractedData.draft_year) draft += ` in ${extractedData.draft_year}`;
  appendRow("Draft Info", draft);

  // Career history (including overseas/AU/Unrivaled if listed)
  if (teamHistory.length > 0) {
    displayHtml += "<p><strong>Career History:</strong></p>";
    displayHtml += "<ul style='margin-left:20px; list-style-type:disc;'>";
    teamHistory.forEach((entry) => {
      displayHtml += `<li>${entry}</li>`;
    });
    displayHtml += "</ul>";
  }

// Highlights
if (extractedData.highlights) {
  displayHtml += "<p style='color:#000000;'><strong>Career Highlights:</strong></p>";
  displayHtml +=
    "<ul style='margin-left:20px; list-style-type:disc; color:#000000;'><li>" +
    extractedData.highlights.replace(/<br>/g, "</li><li>") +
    "</li></ul>";
  displayHtml = displayHtml.replace("<li></li>", "");
}

displayHtml += "</div>";

infoBoxDiv.html(displayHtml);

// Clear previous result
resultDiv.html("");

// Create details element
let details = document.createElement("details");
let summary = document.createElement("summary");
summary.textContent = "--- Full API Response JSON (for debugging) ---";
let pre = document.createElement("pre");
pre.textContent = JSON.stringify(data, null, 2);

// Append summary and pre to details
details.appendChild(summary);
details.appendChild(pre);

// Append to resultDiv
resultDiv.elt.appendChild(details);

}

// --- UTILITY: CLEAN WIKI MARKUP ---
function cleanWikiMarkup(value) {
  return (
    value
      .replace(/\{\{[^}]*\}\}/g, "") // remove templates
      .replace(/\[\[[^|]*\|([^\]]*)\]\]/g, "$1") // [[page|display]]
      .replace(/\[\[(.*?)\]\]/g, "$1") // [[page]]
      .replace(/<\/?[^>]+(>|$)/g, "") // remove HTML tags
      .replace(/\s+/g, " ") // normalize spaces
      .trim()
  );
}

