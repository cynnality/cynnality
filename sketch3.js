Quadrille.cellLength = 30;
let quadrille;
let hoveredRow;
let sortedRows = [];
let c1, c2; // gradient colors

function setup() {
  createCanvas(400, 600);

  Quadrille.cellLength = 30;
  Quadrille.textDisplay = true;    // show text values
  Quadrille.imageDisplay = true;   // show images
  Quadrille.colorDisplay = true;   // show p5.Color values ✅


  c1 = color('orange');
  c2 = color('purple');

  quadrille = createQuadrille(10, 10);
  fillGradientGrid(quadrille, c1, c2);

  hoveredRow = quadrille.row(0);
}


function draw() {
  background('#222');
  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text("Gradient Sorting Grid", width / 2, 25);

  // Draw main grid
  drawQuadrille(quadrille, { outline: 'white', row: 1, col: 0 });

  // Hovered row
  if (quadrille.mouseRow >= 0 && quadrille.mouseRow < quadrille.height) {
    hoveredRow = quadrille.row(quadrille.mouseRow);
    drawQuadrille(hoveredRow, { outline: 'cyan', row: quadrille.height + 2, col: 0 });
  }

  // Sorted rows (clicked)
  for (let i = 0; i < sortedRows.length; i++) {
    drawQuadrille(sortedRows[i], { outline: 'lime', row: quadrille.height + 4 + i, col: 0 });
  }

  fill(255);
  textSize(14);
  textAlign(LEFT);
  text("Hover = preview row\nClick = add row to bottom", 10, height - 40);
}

function mousePressed() {
  let r = quadrille.mouseRow;
  if (r >= 0 && r < quadrille.height) {
    let selected = quadrille.row(r);
    sortedRows.push(selected);
  }
}

// 🧩 Helper to fill grid with a smooth 2-color gradient
function fillGradientGrid(q, colA, colB) {
  for (let y = 0; y < q.height; y++) {
    // Compute interpolation factor for this row (0 to 1)
    let tRow = y / (q.height - 1);

    for (let x = 0; x < q.width; x++) {
      // Compute interpolation factor for this column (0 to 1)
      let tCol = x / (q.width - 1);

      // Mix horizontally and vertically for a smooth 2D gradient
      let mixAmt = (tRow + tCol) / 2;
      let c = lerpColor(colA, colB, mixAmt);

      // Write to Quadrille (works on most builds)
      if (q.write) q.write(x, y, c);
      else if (q.set) q.set(x, y, c);
    }
  }
}






