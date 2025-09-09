window.onload = function() {
  setViewstyle("flashcards");

  // Event listeners
  document.getElementById("flashcards-btn").addEventListener("click", () => {
    setViewstyle("flashcards");
  });
  document.getElementById("jeopardy-btn").addEventListener("click", () => {
    setViewstyle("jeopardy");
    startJeopardyGame();
  });
  document.getElementById("layout-slider").addEventListener("click", function() {
    if (layoutMode === "classic") {
      layoutMode = "sidebyside";
      this.textContent = "side / side";
      this.classList.add("active");
      showCard();
    } else {
      layoutMode = "classic";
      this.textContent = "front / back";
      this.classList.remove("active");
      showCard();
    }
  });
  document.getElementById("background-btn").addEventListener("click", function() {
    const card = flashcards[currentCard];
    const helpContent = document.getElementById("help-content");
    helpContent.innerHTML = "";
    if (card.slides && card.slides.length > 0) {
      card.slides.forEach(filename => {
        let img = document.createElement("img");
        img.src = `slides/${filename}`;
        img.alt = filename;
        helpContent.appendChild(img);
      });
    } else {
      helpContent.textContent = "No background slides available for this card.";
    }
  });

  // DRAGGABLE HELP PANEL
  const helpPanel = document.getElementById("help-panel");
  const helpHeader = document.querySelector(".help-header");
  let offsetX = 0, offsetY = 0, isDragging = false;

  if (helpHeader) {
    helpHeader.addEventListener("mousedown", function(e) {
      isDragging = true;
      offsetX = e.clientX - helpPanel.offsetLeft;
      offsetY = e.clientY - helpPanel.offsetTop;
      document.body.style.userSelect = "none";
    });
  }

  document.addEventListener("mousemove", function(e) {
    if (isDragging) {
      helpPanel.style.left = (e.clientX - offsetX) + "px";
      helpPanel.style.top = (e.clientY - offsetY) + "px";
    }
  });

  document.addEventListener("mouseup", function() {
    isDragging = false;
    document.body.style.userSelect = "";
  });
};

function setViewstyle(style) {
  document.getElementById("flashcards-btn").classList.toggle("active", style === "flashcards");
  document.getElementById("jeopardy-btn").classList.toggle("active", style === "jeopardy");
  document.getElementById("flashcard").style.display = style === "flashcards" ? "" : "none";
  document.getElementById("nextCard").style.display = style === "flashcards" ? "" : "none";
  document.getElementById("slideFilter").style.display = style === "flashcards" ? "" : "none";
  document.getElementById("help-panel").style.display = style === "flashcards" ? "" : "none";
  document.getElementById("help-content").style.display = style === "flashcards" ? "" : "none";
  document.getElementById("jeopardy-container").style.display = style === "jeopardy" ? "flex" : "none";
}

let flashcards = [];
let currentCard = 0;
let showingFront = true;
let layoutMode = "classic"; // "classic" or "sidebyside"

// Load both sets of flashcards and filter out blanks
Promise.all([
  fetch("slides.json").then(res => res.json()),
  fetch("american-gov-questions.json").then(res => res.json())
]).then(([historyData, govData]) => {
  flashcards = [];
  [historyData, govData].forEach(data => {
    if (!data.slides) return;
    data.slides.forEach(slide => {
      if (!slide.flashcards || !Array.isArray(slide.flashcards)) return;
      slide.flashcards.forEach(card => {
        if (card && (card.front || card.back)) {
          flashcards.push({ ...card, section: slide.id, title: slide.title });
        }
      });
    });
  });
  shuffle(flashcards);
  currentCard = Math.floor(Math.random() * flashcards.length);
  showCard();
    const slideFilter = document.getElementById("slideFilter");
    slideFilter.innerHTML = `
      <option value="all" selected>All</option>
      <option value="civil-war">Civil War</option>
      <option value="intro-gov">Intro to American Government</option>
      `;
});

function filterFlashcards() {
  const selected = document.getElementById("slideFilter").value;
  flashcards = [];
  if (selected === "civil-war") {
    fetch("slides.json")
      .then(res => res.json())
      .then(data => {
        data.slides.forEach(slide => {
          if (slide.flashcards && Array.isArray(slide.flashcards)) {
            slide.flashcards.forEach(card => {
              if (card && (card.front || card.back)) {
                flashcards.push({
                  section: slide.id,
                  title: slide.title,
                  front: card.front,
                  back: card.back,
                  tags: card.tags,
                  slides: card.slides,
                  year: card.year
                });
              }
            });
          }
        });
        shuffle(flashcards);
        currentCard = Math.floor(Math.random() * flashcards.length);
        showCard();
      });
  } else if (selected === "intro-gov") {
    fetch("american-gov-questions.json")
      .then(res => res.json())
      .then(data => {
        data.slides.forEach(slide => {
          if (slide.flashcards && Array.isArray(slide.flashcards)) {
            slide.flashcards.forEach(card => {
              if (card && (card.front || card.back)) {
                flashcards.push({
                  section: slide.id,
                  title: slide.title,
                  front: card.front,
                  back: card.back,
                  tags: card.tags,
                  slides: card.slides,
                  year: card.year
                });
              }
            });
          }
        });
        shuffle(flashcards);
        currentCard = Math.floor(Math.random() * flashcards.length);
        showCard();
      });
  }
}

/* Show a flashcard */
function showCard() {
  if (!flashcards.length || !flashcards[currentCard] || (!flashcards[currentCard].front && !flashcards[currentCard].back)) {
    document.getElementById("flashcard").innerHTML = "<div class='front'>No cards available.</div>";
    return;
  }
  const card = flashcards[currentCard];
  const cardEl = document.getElementById("flashcard");
  if (layoutMode === "classic") {
    cardEl.innerHTML = `
      <div class="front">${card.front}</div>
      <div class="back">${card.back}</div>
    `;
    cardEl.classList.remove("sidebyside");
    cardEl.classList.remove("flipped");
    showingFront = true;
  } else {
    cardEl.innerHTML = `
      <div class="sidebyside-container">
        <div class="side-front">${card.front}</div>
        <div class="side-back">${card.back}</div>
      </div>
    `;
    cardEl.classList.add("sidebyside");
  }
}

/* Flip flashcard */
function flipCard() {
  const cardEl = document.getElementById("flashcard");
  cardEl.classList.toggle("flipped");
  showingFront = !showingFront;
}

/* Next card (random each time) */
function nextCard() {
  if (flashcards.length === 0) return;
  currentCard = Math.floor(Math.random() * flashcards.length);
  showCard();
}

/* Optional: filter by tag */
function filterByTag(tag) {
  flashcards = flashcards.filter(card => card.tags && card.tags.includes(tag));
  currentCard = 0;
  showCard();
}

// Shuffle utility
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// JEOPARDY GAME LOGIC (unchanged from your version, but placed after flashcard logic for clarity)
let jeopardyData = null;
let qualifierIndex = 0;
let qualifierCorrect = 0;

async function startJeopardyGame() {
  document.getElementById("flashcard").style.display = "none";
  document.getElementById("nextCard").style.display = "none";
  document.getElementById("slideFilter").style.display = "none";
  document.getElementById("help-panel").style.display = "none";
  document.getElementById("help-content").style.display = "none";
  const container = document.getElementById("jeopardy-container");
  container.style.display = "flex";
  container.innerHTML = "<h2>Loading Jeopardy...</h2>";
  try {
    const response = await fetch("jeopardy-viewstyle.json");
    if (!response.ok) throw new Error("Could not load jeopardy-viewstyle.json");
    jeopardyData = await response.json();
    qualifierIndex = 0;
    qualifierCorrect = 0;
    showQualifierPrompt();
  } catch (err) {
    container.innerHTML = `<h2>Error loading Jeopardy game.</h2><p>${err.message}</p>`;
  }
}

function showQualifierPrompt() {
  const container = document.getElementById("jeopardy-container");
  const q = jeopardyData.qualifier[qualifierIndex];
  container.innerHTML = `
    <div class="jeopardy-qualifier">
      <h2>This is a high stakes game!</h2>
      <p>To make sure all our players are qualified to enter, you must correctly answer the following 3 questions.</p>
      <h3>${q.prompt}</h3>
      <button class="neo-btn" onclick="chooseQualifier(0)">${q.options[0]}</button>
      <button class="neo-btn" onclick="chooseQualifier(1)">${q.options[1]}</button>
      <div id="qualifier-feedback"></div>
    </div>
  `;
}

window.chooseQualifier = function(choice) {
  const q = jeopardyData.qualifier[qualifierIndex];
  const feedback = document.getElementById("qualifier-feedback");
  if (choice === q.answer) {
    qualifierCorrect++;
    feedback.textContent = "Correct!";
  } else {
    feedback.textContent = "Incorrect!";
  }
  setTimeout(() => {
    qualifierIndex++;
    if (qualifierIndex < jeopardyData.qualifier.length) {
      showQualifierPrompt();
    } else {
      finishQualifier();
    }
  }, 1000);
};

function finishQualifier() {
  let chips = qualifierCorrect;
  const container = document.getElementById("jeopardy-container");
  if (chips === 0) {
    container.innerHTML = `<h2>Sorry, you didn't qualify for the Jeopardy game!</h2>`;
  } else {
    container.innerHTML = `<h2>Congratulations! You earned ${chips} chip${chips > 1 ? 's' : ''}.</h2>
      <button class="neo-btn" onclick="startJeopardyBoard(${chips})">Enter Jeopardy Game</button>`;
  }
}

window.exitJeopardy = function() {
  document.getElementById("jeopardy-container").style.display = "none";
  document.getElementById("flashcard").style.display = "";
  document.getElementById("nextCard").style.display = "";
  document.getElementById("slideFilter").style.display = "";
  document.getElementById("help-panel").style.display = "";
  document.getElementById("help-content").style.display = "";
};

window.startJeopardyBoard = function(startingChips) {
  let chips = startingChips;
  let answered = {};
  const container = document.getElementById("jeopardy-container");
  container.innerHTML = `
    <div id="board-area">
      <table id="jeopardy-board"></table>
    </div>
    <div id="chip-count-box">Chips: ${chips}</div>
    <div id="question-area"></div>
  `;
  const board = container.querySelector("#jeopardy-board");
  let html = "<tr>";
  jeopardyData.categories.forEach(cat => {
    html += `<th>${cat.name}</th>`;
  });
  html += "</tr>";
  for (let i = 0; i < 3; i++) {
    html += "<tr>";
    jeopardyData.categories.forEach((cat, cIdx) => {
      const q = cat.questions[i];
      if (q) {
        const key = `${cIdx}-${i}`;
        html += `<td>
          <button class="neo-btn" style="font-size:1.3rem;" ${answered[key] ? "disabled" : ""} onclick="chooseJeopardyQuestion(${cIdx},${i},${chips})">
            ${q.chips}
          </button>
        </td>`;
      } else {
        html += "<td></td>";
      }
    });
    html += "</tr>";
  }
  board.innerHTML = html;
  window.jeopardyChips = chips;
  window.jeopardyAnswered = answered;
  window.updateChipCount = function(newChips) {
    window.jeopardyChips = newChips;
    document.getElementById("chip-count-box").textContent = `Chips: ${newChips}`;
  };
};

window.chooseJeopardyQuestion = function(catIdx, qIdx, chips) {
  const board = document.getElementById("jeopardy-board");
  const cell = board.rows[qIdx + 1].cells[catIdx];
  const cat = jeopardyData.categories[catIdx];
  const q = cat.questions[qIdx];
  const key = `${catIdx}-${qIdx}`;
  if (window.jeopardyAnswered[key]) return;
  cell.innerHTML = `
    <div id="wager-prompt">
      <h3>How many chips do you want to wager? (1-${window.jeopardyChips})</h3>
      <input type="number" id="wager" min="1" max="${window.jeopardyChips}" value="1">
      <button class="neo-btn" onclick="showJeopardyQuestion(${catIdx},${qIdx})">Submit Wager</button>
    </div>
  `;
};

window.showJeopardyQuestion = function(catIdx, qIdx) {
  const board = document.getElementById("jeopardy-board");
  const cell = board.rows[qIdx + 1].cells[catIdx];
  const cat = jeopardyData.categories[catIdx];
  const q = cat.questions[qIdx];
  const wager = parseInt(document.getElementById("wager").value, 10);
  cell.innerHTML = `
    <div id="question-prompt">
      <h3>${q.question}</h3>
      <label>Your answer:</label>
      <input type="text" id="user-answer" style="width:80%;">
      <button class="neo-btn" onclick="submitJeopardyAnswer(${catIdx},${qIdx},${wager})">Submit</button>
      <div id="answer-feedback"></div>
    </div>
  `;
};

window.submitJeopardyAnswer = function(catIdx, qIdx, wager) {
  const board = document.getElementById("jeopardy-board");
  const cell = board.rows[qIdx + 1].cells[catIdx];
  const cat = jeopardyData.categories[catIdx];
  const q = cat.questions[qIdx];
  const key = `${catIdx}-${qIdx}`;
  const userAnswer = cell.querySelector("#user-answer").value;
  const feedback = cell.querySelector("#answer-feedback");
  function normalize(str) {
    return str.toLowerCase().replace(/[^\w\s]/gi, '').trim();
  }
  const userNorm = normalize(userAnswer);
  const correct = q.answers.some(ans => normalize(ans) === userNorm);
  let chips = window.jeopardyChips;
  let base = q.chips;
  let total = base + wager;
  if (correct) {
    chips += total;
    feedback.textContent = `Correct! You gain ${total} chips.`;
  } else {
    chips -= total;
    feedback.textContent = `Incorrect. You lose ${total} chips. Correct answer: ${q.answers[0]}`;
  }
  window.updateChipCount(chips);
  window.jeopardyAnswered[key] = true;
  setTimeout(() => {
    cell.innerHTML = `<span style="font-weight:bold;">${correct ? "✔️" : "❌"}</span>`;
  }, 1500);
  if (chips <= 0) {
    feedback.innerHTML += `<br><strong>Game over! You ran out of chips.</strong>`;
    setTimeout(exitJeopardy, 2000);
  }
};
