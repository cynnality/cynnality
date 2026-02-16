// =========================
// GRID CELL INTERACTIONS
// =========================

// All grid cells
const gridCells = document.querySelectorAll(".grid-cell");

// Special control cell
const specialCell = document.getElementById("special-cell");

// All grid cells EXCEPT the special one
const playableCells = [...gridCells].filter(
  cell => cell.id !== "special-cell"
);

// -------------------------
// Click to toggle flip
// -------------------------

gridCells.forEach(cell => {
  cell.addEventListener("click", () => {
    cell.classList.toggle("flipped");
  });
});

// -------------------------
// Special cell: random flip
// -------------------------

specialCell.addEventListener("click", () => {
  // shuffle cells randomly
  const shuffled = [...playableCells].sort(() => Math.random() - 0.5);

  // flip each one with a staggered delay
  shuffled.forEach((cell, index) => {
    setTimeout(() => {
      cell.classList.add("flipped");
    }, index * 60);
  });
});
