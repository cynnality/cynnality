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
  // Select all days
  const wDay = document.querySelectorAll(".wday");
  // Select all expanded days
  const wDayExpand = document.querySelectorAll(".wdayexpand");
  // select all content divs inside wdayexpand
  const wDayExpandContents = document.querySelectorAll(".wdayexpandwindow .wdayexpandcontent");
  // Select all rows in the tables that have content
  const tableRows = document.querySelectorAll(".cardtable tr[data-content]");
  // Select all content divs inside big cards
  const bigCardContents = document.querySelectorAll(".tablewindow > .content");
  // Select all close buttons inside big cards
  const closeButtons = document.querySelectorAll(".bigcard .close");

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
  
    // Function to clear active states from table rows
  function clearActiveRows() {
    tableRows.forEach(row => row.classList.remove("active"));
  }

  // Attach click events to small cards
  smallCards.forEach(card => {
    card.addEventListener("click", () => {
      const bigCardId = card.getAttribute("data-bigcard");
      const sanitizedBigCardId = bigCardId.replace(/[^a-zA-Z0-9_-]/g, "");
      const bigCard = document.querySelector(`.${sanitizedBigCardId}`);

      // Toggle visibility of the big card
      if (bigCard.classList.contains("visible")) {
        bigCard.classList.remove("visible");
        clearContent();
        clearActiveRows();
      } else {
        hideBigCards(); // Hide all other big cards
        clearContent(); // Clear any existing content
        clearActiveRows();
        bigCard.classList.add("visible");
      }
    });
  });


    // Attach click events to days
  wDay.forEach(day => {
    day.addEventListener("click", () => {
      const wDayExpandId = day.getAttribute("data-wdayexpand");
      // Hide all day expanders first
      document.querySelectorAll(".wdayexpand").forEach(expand => {
        expand.classList.add("hidden");
        expand.classList.remove("visible");
      });
      // Show the selected day's expander
      const expandToShow = document.getElementById(wDayExpandId);
      if (expandToShow) {
        expandToShow.classList.remove("hidden");
        expandToShow.classList.add("visible");
      }
    });
  });

document.querySelectorAll('.expand-matchup-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // Find the closest .matchup-row
    const matchupRow = btn.closest('.matchup-row');
    // The blurb is the next sibling after the matchup-row
    const extra = matchupRow.nextElementSibling;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    if (expanded) {
      extra.classList.add('hidden');
    } else {
      extra.classList.remove('hidden');
    }
  });
});

    // Attach click event to "Show All" button
  const showAllBtn = document.querySelector(".show-all-wdays");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      // Hide all first (in case any are open)
      document.querySelectorAll(".wdayexpand").forEach(expand => {
        expand.classList.remove("visible");
        expand.classList.add("hidden");
      });
      // Show all in order
      const order = [
        "wdayexpandmon",
        "wdayexpandtues",
        "wdayexpandwed",
        "wdayexpandthurs",
        "wdayexpandfri",
        "wdayexpandsat",
        "wdayexpandsun"
      ];
      order.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove("hidden");
          el.classList.add("visible");
        }
      });
    });
  }

    // Attach click events to table rows
  document.querySelectorAll('.cardtable tr[data-content]').forEach(row => {
    row.addEventListener("click", () => {
      // Hide all content sections first
      document.querySelectorAll('.content').forEach(c => c.classList.add('hidden'));
      // Show the selected content section
      const contentId = row.getAttribute("data-content");
      const contentToShow = document.getElementById(contentId);
      if (contentToShow) {
        contentToShow.classList.remove('hidden');
        // Expand all wdayexpand sections for this content
        contentToShow.querySelectorAll('.wdayexpand').forEach(day => {
          day.classList.remove('hidden');
        });
      }
    });
  });


document.querySelectorAll('.hide-all-details').forEach(btn => {
  btn.addEventListener('click', function() {
    const parent = btn.closest('.wdayexpand');
    if (parent) {
      const allHidden = Array.from(parent.querySelectorAll('.matchup-row, .matchup-extra'))
        .every(el => el.classList.contains('hidden'));
      if (allHidden) {
        // Show all
        parent.querySelectorAll('.matchup-row, .matchup-extra').forEach(el => {
          el.classList.remove('hidden');
        });
        btn.textContent = 'Hide All Games';
      } else {
        // Hide all
        parent.querySelectorAll('.matchup-row, .matchup-extra').forEach(el => {
          el.classList.add('hidden');
        });
        btn.textContent = 'Show All Games';
      }
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
      clearActiveRows();
      row.classList.add("active"); //highlights the row that is opened
      if (contentToShow) {
        contentToShow.classList.remove("hidden");
        contentToShow.classList.add("visible");
        // Scroll the content into view smoothly
        contentToShow.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Attach click events to close buttons
  closeButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      const bigCard = button.closest(".bigcard"); // Find the parent bigcard
      bigCard.classList.remove("visible"); // Hide the big card
      clearContent(); // Clear any visible content inside the big card
      clearActiveRows(); //clears active state from rows

      // Prevent event bubbling to avoid unexpected behavior
      event.stopPropagation();
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
