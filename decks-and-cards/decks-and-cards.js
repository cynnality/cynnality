const playerData = {
    storm: [
        { name: "Nneka Ogwumike", img: "../assets/w-player-decks/nneka-ogwumike-storm.svg" },
        { name: "Skylar Diggins", img: "../assets/w-player-decks/skylar-diggins-storm.svg" },
        { name: "Gabby Williams", img: "../assets/w-player-decks/gabby-williams-storm.svg" },
        { name: "Dominique Malonga", img: "../assets/w-player-decks/dominique-malonga-storm.svg" },
        { name: "Erica Wheeler", img: "../assets/w-player-decks/erica-wheeler-storm.svg" },

    ],
    aces: [
        { name: "Jewell Loyd", img: "../assets/w-player-decks/jewell-loyd-aces.svg" },
        { name: "Chelsea Gray", img: "../assets/w-player-decks/chelsea-gray-aces.svg" },
        { name: "A'ja Wilson", img: "../assets/w-player-decks/aja-wilson-aces.svg" },
        // ...add more
    ],
    // ...add more teams
};

document.addEventListener('DOMContentLoaded', function () {
    // Expand/collapse logic
    document.querySelectorAll('.break-down-card .button').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = btn.closest('.break-down-card');
            card.classList.toggle('expanded');
            btn.textContent = card.classList.contains('expanded') ? 'hide decks' : 'show decks';
        });
    });

    // Deck click logic for grid (multiple active)
    document.querySelectorAll('.deck-grid .deck').forEach(deck => {
        deck.addEventListener('click', function () {
            const team = deck.getAttribute('data-team');
            // Prevent adding the same deck twice
            if (document.querySelector(`#active-deck-rows .active-deck-row[data-team="${team}"]`)) return;

            // Mark this deck as active (for styling and hiding)
            deck.classList.add('active');
            deck.style.visibility = 'hidden';

            // Create the active row
            const activeRow = document.createElement('div');
            activeRow.className = 'active-deck-row';
            activeRow.setAttribute('data-team', team);

            // Add a close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.className = 'close-active-row';
            closeBtn.title = 'Close';

            // Get player cards for this team
            const cards = playerData[team] || [];
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'player-cards-container';
            cardsContainer.innerHTML = cards.map(player => `
                <div class="player-card">
                    <img src="${player.img}" alt="${player.name}">
                </div>
            `).join('');

            // Assemble the active row (only player cards and close button)
            activeRow.appendChild(cardsContainer);
            activeRow.appendChild(closeBtn);

            // Add to the active rows container
            document.getElementById('active-deck-rows').appendChild(activeRow);

            // Close logic for this row
            closeBtn.addEventListener('click', function () {
                // Remove the active row
                activeRow.remove();
                // Show the deck in the grid again
                deck.style.visibility = 'visible';
                deck.classList.remove('active');
            });
        });
    });
});

const btn = document.querySelector("button"); // Get the button from the page
if (btn) { // Detect clicks on the button
  btn.onclick = function () {
    // The 'dipped' class in style.css changes the appearance on click
    btn.classList.toggle("dipped");
  };
}
