/*
  This is your site JavaScript code - you can add interactivity!
*/

// Print a message in the browser's dev tools console each time the page loads
// Use your menus or right-click / control-click and choose "Inspect" > "Console"
console.log("Hello 🌎");

/* 
Make the "Click me!" button move when the visitor clicks it:
- First add the button to the page by following the steps in the TODO 🚧
*/
const btn = document.querySelector("button"); // Get the button from the page
if (btn) { // Detect clicks on the button
  btn.onclick = function () {
    // The 'dipped' class in style.css changes the appearance on click
    btn.classList.toggle("dipped");
  };
}


document.addEventListener("DOMContentLoaded", () => {
  // Select all small cards
  const smallCards = document.querySelectorAll(".smallcard");
  // Select all big cards
  const bigCards = document.querySelectorAll(".bigcard");
  // Select all rows in the tables that have content
  const tableRows = document.querySelectorAll(".cardtable tr[data-content]");
  // Select all content divs inside big cards
  const bigCardContents = document.querySelectorAll(".tablewindow > .content");

  // Function to hide all big cards
  function hideBigCards() {
    bigCards.forEach(card => card.classList.remove("visible"));
  }

  // Function to clear all table window content
  function clearContent() {
    bigCardContents.forEach(content => {
      content.classList.add("hidden");
      content.classList.remove("visible");
    });
  }

  // Attach click events to small cards
  smallCards.forEach(card => {
    card.addEventListener("click", () => {
      const bigCardId = card.getAttribute("data-bigcard");
      const bigCard = document.querySelector(`.${bigCardId}`);

      // Toggle visibility of the big card
      if (bigCard.classList.contains("visible")) {
        bigCard.classList.remove("visible");
        clearContent();
      } else {
        hideBigCards(); // Hide all other big cards
        clearContent(); // Clear any existing content
        bigCard.classList.add("visible");
      }
    });
  });

  // Attach click events to table rows
  tableRows.forEach(row => {
    row.addEventListener("click", () => {
      const contentId = row.getAttribute("data-content");
      const contentToShow = document.getElementById(contentId);

      // Clear existing content and show the new one
      clearContent();
      if (contentToShow) {
        contentToShow.classList.remove("hidden");
        contentToShow.classList.add("visible");
      }
    });
  });
});





// ----- GLITCH STARTER PROJECT HELPER CODE -----

// Open file when the link in the preview is clicked
let goto = (file, line) => {
  window.parent.postMessage(
    { type: "glitch/go-to-line", payload: { filePath: file, line: line } }, "*"
  );
};
// Get the file opening button from its class name
const filer = document.querySelectorAll(".fileopener");
filer.forEach((f) => {
  f.onclick = () => { goto(f.dataset.file, f.dataset.line); };
});
