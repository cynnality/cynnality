let searchUrl =
  "https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&format=json&search=";
let contentUrl =
  "https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=revisions&rvslots=*&rvprop=content&format=json&titles=";

let userInput, button, infoBoxDiv;

// --- Sprite gravity ---
let gravity = 0.4;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.style("z-index", "-1");
  cnv.style("position", "fixed");

  // --- HTML elements ---
  userInput = select("#userinput");
  button = select("#startSearch");
  button.mousePressed(startSearch);

  createP("--- Extracted Player Information ---").style("text-align", "center");
  infoBoxDiv = createDiv().id("infobox-data");

  infoBoxDiv.style("font-family", "Verdana, sans-serif");
  infoBoxDiv.style("background-color", "rgba(250, 250, 250, 0.95)");
  infoBoxDiv.style("padding", "20px");
  infoBoxDiv.style("border-radius", "12px");
  infoBoxDiv.style("max-width", "600px");
  infoBoxDiv.style("margin", "20px auto");
  infoBoxDiv.style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)");
  infoBoxDiv.style("position", "relative");
  infoBoxDiv.style("z-index", "10");
}

function draw() {
  background(30, 30, 40); // plain dark background

  // --- Sprite physics (dropped basketballs) ---
  for (let i = 0; i < allSprites.length; i++) {
    let s = allSprites[i];
    s.velocity.y += gravity; // gravity
    if (s.position.y + s.height / 2 > height) {
      s.position.y = height - s.height / 2;
      s.velocity.y *= -0.7; // bounce
      s.velocity.x *= 0.98; // friction
    }
  }

  // Draw all sprites
  drawSprites();

  // Basketball cursor
  noStroke();
  fill(255, 165, 0);
  ellipse(mouseX, mouseY, 30, 30);
}

function mousePressed() {
  // Drop a basketball sprite at the mouse position
  let spr = createSprite(mouseX, mouseY, random(15, 40), random(15, 40));
  spr.shapeColor = color(255, 140, 0);
  spr.velocity.y = random(-2, 2);
  spr.velocity.x = random(-3, 3);
}

function keyPressed() {
  if (key === 'c') {
    allSprites.removeSprites(); // clear all dropped balls
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- Wikipedia search functions ---
function startSearch() {
  infoBoxDiv.html("<em>Loading...</em>");
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
  let infoboxRegex = /\{\{Infobox (?:basketball biography|basketball player|sportsperson)([\s\S]*?)\n\}\}/;
  let match = content.match(infoboxRegex);
  if (!match) {
    infoBoxDiv.html('Could not find a recognizable "Infobox basketball" template.');
    return;
  }

  let infoboxContent = match[1].trim();
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

  const targetKeys = ["image","position","team","league","height_ft","height_in","weight_lb","birth_date","draft_year","draft_pick","high_school","college","highlights"];
  let extractedData = {};
  targetKeys.forEach((key) => {
    if(rawFields[key]){
      let value = cleanWikiMarkup(rawFields[key]);
      if(key==="highlights") value = value.replace(/\*/g,"").trim().replace(/\n/g,"<br>");
      extractedData[key] = value.trim();
    }
  });

  let teamHistory = [];
  for (let i=1; i<20; i++){
    let yearsKey = `years${i}`;
    let teamKey = `team${i}`;
    if(rawFields[teamKey]){
      let years = rawFields[yearsKey]? cleanWikiMarkup(rawFields[yearsKey]) : "";
      let team = cleanWikiMarkup(rawFields[teamKey]);
      let entry = years ? `${years} — ${team}` : team;
      teamHistory.push(entry);
    }
  }

  let displayHtml = `<h2>${page[pageId].title}</h2>`;
  if(extractedData.image){
    let imgFile = extractedData.image.replace(/File:/i,"").trim();
    let imgUrl = "https://en.wikipedia.org/wiki/Special:FilePath/" + encodeURIComponent(imgFile);
    displayHtml += `<img src="${imgUrl}" alt="${page[pageId].title}" style="max-width:200px; border-radius:8px; display:block; margin-bottom:15px;">`;
  }

  displayHtml += `<div style="font-family:sans-serif; max-width:500px;">`;
  const appendRow = (label,value)=>{ if(value) displayHtml += `<p><strong>${label}:</strong> ${value}</p>`; }
  appendRow("Position", extractedData.position);
  appendRow("League", extractedData.league);
  appendRow("Current Team", extractedData.team);
  appendRow("College", extractedData.college);
  appendRow("High School", extractedData.high_school);
  appendRow("Birth Date", extractedData.birth_date);

  let height = "";
  if(extractedData.height_ft) height += extractedData.height_ft + "' ";
  if(extractedData.height_in) height += extractedData.height_in + '"';
  appendRow("Height", height);
  appendRow("Weight", extractedData.weight_lb ? extractedData.weight_lb + " lbs" : "");

  let draft = "";
  if(extractedData.draft_pick) draft += `#${extractedData.draft_pick} pick`;
  if(extractedData.draft_year) draft += ` in ${extractedData.draft_year}`;
  appendRow("Draft Info", draft);

  if(teamHistory.length>0){
    displayHtml += "<p><strong>Career History:</strong></p><ul>";
    teamHistory.forEach(e=>displayHtml+=`<li>${e}</li>`);
    displayHtml += "</ul>";
  }

  if(extractedData.highlights){
    displayHtml += "<p><strong>Career Highlights:</strong></p>";
    displayHtml += "<ul><li>" + extractedData.highlights.replace(/<br>/g,"</li><li>") + "</li></ul>";
  }

  displayHtml += "</div>";
  infoBoxDiv.html(displayHtml);
}

function cleanWikiMarkup(value){
  return value.replace(/\{\{[^}]*\}\}/g,"")
              .replace(/\[\[[^|]*\|([^\]]*)\]\]/g,"$1")
              .replace(/\[\[(.*?)\]\]/g,"$1")
              .replace(/<\/?[^>]+(>|$)/g,"")
              .replace(/\s+/g," ")
              .trim();
}
