fetch('../page-wnba/players-wnba.json')
  .then(res => res.json())
  .then(players => {
    document.querySelectorAll('.name-tooltip').forEach(el => {
      const name = el.dataset.name;
      const player = players.find(p =>
        p.first.toLowerCase() === name.toLowerCase() ||
        p.last.toLowerCase() === name.toLowerCase()
      );
      if (player) {
        el.setAttribute('data-fullname', player.full);
      }
    });
  });