// -----------------------------
// PLAYER DECK DATA (unchanged)
// -----------------------------
const playerData = {
  "seattle-storm": [
    { name: "Nneka Ogwumike", img: "/assets/w-player-decks/nneka-ogwumike-storm.svg" },
    { name: "Skylar Diggins", img: "/assets/w-player-decks/skylar-diggins-storm.svg" },
    { name: "Gabby Williams", img: "/assets/w-player-decks/gabby-williams-storm.svg" },
    { name: "Dominique Malonga", img: "/assets/w-player-decks/dominique-malonga-storm.svg" },
    { name: "Erica Wheeler", img: "/assets/w-player-decks/erica-wheeler-storm.svg" }
  ],
  "las-vegas-aces": [
    { name: "Jewell Loyd", img: "/assets/w-player-decks/jewell-loyd-aces.svg" },
    { name: "Chelsea Gray", img: "/assets/w-player-decks/chelsea-gray-aces.svg" },
    { name: "A'ja Wilson", img: "/assets/w-player-decks/aja-wilson-aces.svg" }
  ]
};

// Deck images keyed by looks.slug
const deckImages = {
  "seattle-storm": "/assets/w-player-decks/deck-storm.svg",
  "las-vegas-aces": "/assets/w-player-decks/deck-aces.svg"
};

// -----------------------------
// LOAD TEAM DATA
// -----------------------------
fetch("/courts/teams-pro.json")
  .then(res => res.json())
  .then(data => {
    const teams = Object.values(data);

    const menu = document.getElementById("teams-menu");
    const content = document.getElementById("team-content");

    // -----------------------------
    // BUILD MENU
    // -----------------------------
    teams.forEach((team, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${team.teamNameCity} ${team.teamName}`;

      if (!team.isActive) btn.classList.add("is-folded");

      btn.addEventListener("click", () => showTeam(team, btn));

      if (idx === 0) btn.classList.add("active");
      menu.appendChild(btn);
    });

    if (teams.length) showTeam(teams[0], menu.querySelector("button"));

    // -----------------------------
    // TEAM CARD HELPERS
    // -----------------------------
    function createTeamCard(team) {
      return `
        <div class="team-card" id="team-${team.teamCode}">
          <div class="team-cover-bg">
            <div class="team-cover-mid-bg">
              <div class="team-cover-fg">
                <div class="team-cover-fg-text">
                  <h4 class="team-name-city">${team.teamNameCity}</h4>
                  <h2 class="team-name">${team.teamName}</h2>
                </div>
              </div>
            </div>
          </div>

          <div class="team-info-section">
            <div class="team-colors team-colors-left">
              <div class="team-color-block color1"></div>
              <div class="team-color-block color2"></div>
              <div class="team-color-block color3"></div>
            </div>

            <div class="team-details">
              ${buildTeamDetails(team)}
            </div>

            <div class="team-colors team-colors-right">
              <div class="team-color-block color1"></div>
              <div class="team-color-block color2"></div>
              <div class="team-color-block color3"></div>
            </div>
          </div>
        </div>
      `;
    }

    function buildTeamDetails(team) {
      let html = "";

      if (team.isOriginalTeam) {
        html += `<div class="detail_row og-team-note">OG WNBA Team</div>`;
      }

      html += `
        <div class="detail_row">Founded: ${team.founded}</div>
        <div class="detail_row">City: ${team.city}</div>
        <div class="detail_row">Championships: ${team.chipCount}</div>
      `;

      if (team.chipYear?.length) {
        html += `<div class="detail_row">Championship Year(s): ${team.chipYear.join(", ")}</div>`;
      }

      if (team.foldedYear) {
        html += `<div class="detail_row">Folded: ${team.foldedYear}</div>`;
      }

      return html;
    }

    function applyTeamColors(card, team) {
      card.style.setProperty("--team-color1", team.colors.color1);
      card.style.setProperty("--team-color2", team.colors.color2);
      card.style.setProperty("--team-color3", team.colors.color3);

      card.querySelectorAll(".team-colors").forEach(div => {
        div.querySelector(".color1").style.background = team.colors.color1;
        div.querySelector(".color2").style.background = team.colors.color2;
        div.querySelector(".color3").style.background = team.colors.color3;
      });
    }

    // -----------------------------
    // MAIN RENDER (WITH DECK)
    // -----------------------------
    function showTeam(team, btn) {
      menu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const slug = team.looks.slug;
      const hasDeck = deckImages[slug];

      content.innerHTML = `
        <div class="team-tab-bar">
          <span class="team-tab-name">
            
            ${team.isActive ? "active" : " folded"}
          </span>
        </div>

        <div class="team-content-inner">
          <div class="team-content-vis">
            <img src="${team.defaultContent.img}" class="team-logo" />

            <svg class="team-court" viewBox="0 0 132.29 79.375"
              style="
                --court-main: ${team.looks.courtColors.main};
                --court-boundbox-lines: ${team.looks.courtColors.lines};
                --court-main-lines: ${team.looks.courtColors.accent};
              ">
              <use href="#court"></use>
            </svg>
          </div>

          ${hasDeck ? `
          <div class="team-deck-section">
            <img
              src="${deckImages[slug]}"
              class="team-deck-img"
              id="deck-img"
              alt="Team Deck"
            />
            <div class="team-deck-cards" id="deck-cards" style="display:none;"></div>
          </div>
          ` : ""}
        </div>
      `;

      // Inject card
      content.insertAdjacentHTML("beforeend", createTeamCard(team));
      applyTeamColors(document.getElementById(`team-${team.teamCode}`), team);

      // -----------------------------
      // DECK CLICK LOGIC
      // -----------------------------
      if (hasDeck) {
        const deckImg = document.getElementById("deck-img");
        const cardsDiv = document.getElementById("deck-cards");
        let visible = false;

        deckImg.addEventListener("click", () => {
          if (!visible) {
            const cards = playerData[slug] || [];
            cardsDiv.innerHTML = cards.map(p =>
              `<div class="player-card"><img src="${p.img}" alt="${p.name}" /></div>`
            ).join("");
            cardsDiv.style.display = "flex";
            visible = true;
          } else {
            cardsDiv.style.display = "none";
            visible = false;
          }
        });
      }
    }
  });

