let teamsData;
let teams = [];

function preload() {
  // Load the JSON file (make sure it's in the same directory)
  teamsData = loadJSON("teams-pro.json");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");

  // Convert the JSON into a simpler array
  for (let teamName in teamsData) {
    let t = teamsData[teamName];
    teams.push({
      name: t.defaultContent.name,
      founded: t.founded,
      chips: t.chipCount,
      color: t.colors.color1,
      color2: t.colors.color2,
      x: random(100, width - 100),
      y: random(100, height - 100),
      r: map(t.chipCount, 0, 5, 40, 100) // circle size = # of championships
    });
  }

  noStroke();
}

function draw() {
  background(20);

  let hoverIndex = -1;

  // Draw all teams
  for (let i = 0; i < teams.length; i++) {
    let t = teams[i];

    // Check hover distance
    let d = dist(mouseX, mouseY, t.x, t.y);
    if (d < t.r / 2) {
      hoverIndex = i;
    }

    // Draw base circle
    fill(t.color);
    ellipse(t.x, t.y, t.r);

    // Add border if hovered
    if (i === hoverIndex) {
      stroke(t.color2);
      strokeWeight(3);
      noFill();
      ellipse(t.x, t.y, t.r + 8);
      noStroke();
    }
  }

  // Tooltip when hovering
  if (hoverIndex !== -1) {
    let t = teams[hoverIndex];
    drawTooltip(t);
  }
}

function drawTooltip(team) {
  let info = `${team.name}\nFounded: ${team.founded}\nChampionships: ${team.chips}`;
  let x = mouseX + 15;
  let y = mouseY - 10;

  push();
  fill(255, 240);
  rect(x, y, 200, 60, 8);
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(info, x + 10, y + 5);
  pop();
}
