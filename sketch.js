let cols = 3;
let rows = 4;
let cellW, cellH;

let originalColors = [];
let shuffledColors = [];

let dragging = false;
let selectedIndex = -1;

function setup() {
  createCanvas(600, 800);
  noStroke();
  colorMode(HSB);

  cellW = width / cols;
  cellH = height / rows;

  generateGradientColors();
  shuffledColors = shuffle([...originalColors]);
}

function draw() {
  background(255);
  drawGrid();

  // Optional: highlight the currently dragged cell
  if (dragging && selectedIndex !== -1) {
    let r = floor(selectedIndex / cols);
    let c = selectedIndex % cols;
    stroke(0);
    strokeWeight(3);
    noFill();
    rect(c * cellW, r * cellH, cellW, cellH);
    noStroke();
  }

  // Draw instructions
  fill(0);
  textAlign(CENTER);
  textSize(18);
  text("Drag and drop the boxes to sort the gradient!", width / 2, height - 40);
}

function drawGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let idx = r * cols + c;
      fill(shuffledColors[idx]);
      rect(c * cellW, r * cellH, cellW, cellH);
    }
  }
}

function generateGradientColors() {
  let baseHue = random(360);
  let saturation = random(40, 80);
  for (let i = 0; i < rows * cols; i++) {
    let brightness = map(i, 0, rows * cols - 1, 30, 100);
    originalColors.push(color(baseHue, saturation, brightness));
  }
}

function mousePressed() {
  if (mouseY < rows * cellH && mouseX < cols * cellW) {
    let c = floor(mouseX / cellW);
    let r = floor(mouseY / cellH);
    selectedIndex = r * cols + c;
    dragging = true;
  }
}

function mouseReleased() {
  if (dragging && mouseY < rows * cellH && mouseX < cols * cellW) {
    let c = floor(mouseX / cellW);
    let r = floor(mouseY / cellH);
    let targetIndex = r * cols + c;

    // Swap the two colors
    let temp = shuffledColors[selectedIndex];
    shuffledColors[selectedIndex] = shuffledColors[targetIndex];
    shuffledColors[targetIndex] = temp;
  }

  dragging = false;
  selectedIndex = -1;
}


