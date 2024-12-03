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





// Select all the smallcards and bigcards
const cards = document.querySelectorAll('.smallcard');
const closeButtons = document.querySelectorAll('.close');

// Add click event listeners to each smallcard to open the corresponding bigcard
cards.forEach(card => {
  card.addEventListener('click', () => {
    const bigcardId = card.getAttribute('data-modal');
    const bigcard = document.getElementById(bigcardId);
    if (bigcard) {
      bigcard.classList.add('show'); // Add the 'show' class to display the bigcard
    }
  });
});

// Add click event listeners to each close button to close the corresponding bigcard
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const bigcardId = button.getAttribute('data-modal');
    const bigcard = document.getElementById(bigcardId);
    if (bigcard) {
      bigcard.classList.remove('show'); // Remove the 'show' class to hide the bigcard
    }
  });
});


// Close the bigcard when clicking anywhere outside of it
window.onclick = function(event) {
  const bigcards = document.querySelectorAll('.bigcard');
  bigcards.forEach(bigcard => {
    if (event.target == bigcard) {
      bigcard.classList.remove('show'); // Remove the 'show' class to hide the bigcard
    }
  });
};





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
