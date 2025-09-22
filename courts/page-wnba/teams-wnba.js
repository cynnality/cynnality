// ...existing code...

// Deck/player data (move from decks-and-cards.js)
const playerData = { 
  storm: [
    { name: "Nneka Ogwumike", img: "/assets/w-player-decks/nneka-ogwumike-storm.svg" },
    { name: "Skylar Diggins", img: "/assets/w-player-decks/skylar-diggins-storm.svg" },
    { name: "Gabby Williams", img: "/assets/w-player-decks/gabby-williams-storm.svg" },
    { name: "Dominique Malonga", img: "/assets/w-player-decks/dominique-malonga-storm.svg" },
    { name: "Erica Wheeler", img: "/assets/w-player-decks/erica-wheeler-storm.svg" },
  ],
  aces: [
    { name: "Jewell Loyd", img: "/assets/w-player-decks/jewell-loyd-aces.svg" },
    { name: "Chelsea Gray", img: "/assets/w-player-decks/chelsea-gray-aces.svg" },
    { name: "A'ja Wilson", img: "/assets/w-player-decks/aja-wilson-aces.svg" },
  ],
};

const deckImages = {
  storm: "/assets/w-player-decks/deck-storm.svg",
  aces: "/assets/w-player-decks/deck-aces.svg",
};

Promise.all([
  fetch('teams-wnba.json').then(res => res.json()),
]).then(([teams]) => {
  const menu = document.getElementById("teams-menu");
  const content = document.getElementById("team-content");

  teams.forEach((team, idx) => {
    const btn = document.createElement("button");
    btn.textContent = team.name;
    btn.addEventListener("click", () => showTeam(team, btn));
    if (idx === 0) btn.classList.add("active");
    menu.appendChild(btn);
  });

  // Show first team by default
  if (teams.length) showTeam(teams[0], menu.querySelector("button"));

  function showTeam(team, btn) {
    // Remove active from all
    menu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Deck logic
    const teamCode = team.code?.replace("las-vegas-", "").replace("seattle-", "").replace(" ", "-").replace("golden-state-", "");
    let deckHtml = "";
    if (deckImages[teamCode]) {
      deckHtml = `
        <div class="team-deck-section">
          <img src="${deckImages[teamCode]}" alt="${team.name} Deck" class="team-deck-img" id="deck-img-${teamCode}" />
          <div class="team-deck-cards" id="deck-cards-${teamCode}" style="display:none;"></div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="team-tab-bar">
        <span class="team-tab-name">${team.name}</span>
      </div>
      <div class="team-content-inner">
        <div class="team-content-vis">
          <div class="team-logo-holder">
            <img src="${team.logo}" alt="${team.name} Logo" class="team-logo" />
          </div>
          <div class="team-palette-holder">
            <img src="${team.palette}" alt="${team.name} Color Palette" class="team-palette" />
          </div>
          <div class="team-court-holder">
            <svg 
                class="team-court"
                viewBox="0 0 132.29 79.375"
                aria-label="Court"
                style="
                  --court-main: ${team.courtColors?.main || '#fff'};
                  --court-boundbox-lines: ${team.courtColors?.lines || '#000'};
                  --court-main-lines: ${team.courtColors?.accent || '#000'};
                "
              >
                <use href="#court"></use>
            </svg>
          </div>
        </div>
        <div class="team-content-deck">
          ${deckHtml}
        </div>
      </div>
    `;

    // Deck click logic
    if (deckImages[teamCode]) {
      const deckImg = document.getElementById(`deck-img-${teamCode}`);
      const cardsDiv = document.getElementById(`deck-cards-${teamCode}`);
      let cardsVisible = false;
      deckImg.addEventListener('click', () => {
        if (!cardsVisible) {
          // Show cards
          const cards = playerData[teamCode] || [];
          cardsDiv.innerHTML = cards.map(player => `
            <div class="player-card">
              <img src="${player.img}" alt="${player.name}">
            </div>
          `).join('');
          cardsDiv.style.display = 'flex';
          cardsVisible = true;
        } else {
          // Hide cards
          cardsDiv.style.display = 'none';
          cardsVisible = false;
        }
      });
    }
  }
});