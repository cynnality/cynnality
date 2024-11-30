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

// Select all cards
const cards = document.querySelectorAll('.card');

// Add a click event listener to each card
cards.forEach(card => {
  card.addEventListener('click', function() {
    // Extract data from the card element
    const title = card.getAttribute('data-title');
    const description = card.getAttribute('data-description');
    const link = card.getAttribute('data-link');
    const tags = card.getAttribute('data-tags');
    const image = card.querySelector('.card-image').style.backgroundImage;
    const tagsString = card.getAttribute('data-tags');
    const tagsArray = tagsString.split(',').map(tag => tag.trim());

    // Set content in the popup
    document.querySelector('.cptitle').textContent = title;
    document.querySelector('.cpdescription').textContent = description;
    document.querySelector('.cplink').href = link;
    document.querySelector('.cplink').textContent = "source";
    document.querySelector('.cptags').textContent = tags;
    document.querySelector('.cpimage').style.backgroundImage = image;

    // Show the popup
    document.querySelector('.bigcardlayout-container').classList.add('show');
  });
});

// Hide the popup when the close button is clicked
document.querySelector('.popup-close').addEventListener('click', function() {
  document.querySelector('.popup-container').classList.remove('show');
});

document.getElementById('generateCard').addEventListener('click', function() {
  // Get values from the form
  const imageLink = document.getElementById('imageLink').value;
  const cardTitle = document.getElementById('cardTitle').value;
  const cardDescription = document.getElementById('cardDescription').value;
  const sourceLink = document.getElementById('sourceLink').value;
  const cardTags = document.getElementById('cardTags').value;
  
  // Create the HTML string for the card
  const generatedHTML = `
    <div class="card" 
         data-title="${cardTitle}" 
         data-description="${cardDescription}" 
         data-link="${sourceLink}" 
         data-tags="${cardTags}">
      <div class="card-image" style="background-image: url('${imageLink}');"></div>
      <div class="card-title">${cardTitle}</div>
    </div>
  `;

  // Display the generated HTML in the <pre> tag for easy copying
  document.getElementById('generatedHTML').textContent = generatedHTML;
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
