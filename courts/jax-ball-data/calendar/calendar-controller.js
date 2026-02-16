(function () {

  function buildGamesByDate(games) {
    const byDate = {};

    games.forEach(game => {
      if (!game.date) return;

      if (!byDate[game.date]) {
        byDate[game.date] = [];
      }

      byDate[game.date].push(game);
    });

    return byDate;
  }

  function getMonthKey(dateStr) {
    return dateStr.slice(0, 7); // YYYY-MM
  }

  function groupDatesByMonth(gamesByDate) {
    const byMonth = {};

    Object.keys(gamesByDate).forEach(date => {
      const monthKey = getMonthKey(date);
      if (!byMonth[monthKey]) byMonth[monthKey] = [];
      byMonth[monthKey].push(date);
    });

    return byMonth;
  }

  function formatCalendarDayLabel(dateStr) {
    if (!dateStr) return { day: "", date: "" };

    const d = new Date(dateStr + "T00:00:00");

    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      date: d.getDate()
    };
  }

  function renderCalendar({
    container,
    games,
    onDaySelected
  }) {
    if (!container) return;

    container.innerHTML = "";

    const gamesByDate = buildGamesByDate(games);
    const datesByMonth = groupDatesByMonth(gamesByDate);
    const monthKeys = Object.keys(datesByMonth).sort();

    monthKeys.forEach(monthKey => {
      const [year, month] = monthKey.split("-").map(Number);
      renderMonth({
        parent: container,
        year,
        monthIndex: month - 1,
        gamesByDate,
        onDaySelected
      });
    });
  }

  function renderMonth({
    parent,
    year,
    monthIndex,
    gamesByDate,
    onDaySelected
  }) {
    const monthEl = document.createElement("div");
    monthEl.className = "calendar-month";

    const isOctober = monthIndex === 9; // 0-based

    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const datesInThisMonth = Object.keys(gamesByDate)
      .filter(d => d.startsWith(monthKey))
      .sort();

    const title = document.createElement("h3");
    title.className = "calendar-month-title";
    title.textContent = new Date(`${monthKey}-01`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    }).toUpperCase();

    monthEl.appendChild(title);

    if (!isOctober) {
      const weekdays = document.createElement("div");
      weekdays.className = "calendar-weekdays";

      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d =>
        weekdays.appendChild(
          Object.assign(document.createElement("div"), { textContent: d })
        )
      );

      monthEl.appendChild(weekdays);
    }

    const grid = document.createElement("div");
    grid.className = "calendar-month-grid";

    if (isOctober) {
      monthEl.classList.add("is-october");

      datesInThisMonth.forEach(dateKey => {
        const gamesForDay = gamesByDate[dateKey] || [];
        if (!gamesForDay.length) return;

        const dayCell = buildDayCell(dateKey, gamesForDay, onDaySelected);
        grid.appendChild(dayCell);
      });
    } else {
      const firstDay = new Date(year, monthIndex, 1).getDay();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        grid.appendChild(
          Object.assign(document.createElement("div"), {
            className: "calendar-day empty"
          })
        );
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const gamesForDay = gamesByDate[dateKey] || [];
        const dayCell = buildDayCell(dateKey, gamesForDay, onDaySelected);
        grid.appendChild(dayCell);
      }
    }

    monthEl.appendChild(grid);
    parent.appendChild(monthEl);
  }

  function buildDayCell(dateKey, gamesForDay, onDaySelected) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";

    const label = formatCalendarDayLabel(dateKey);
    const labelEl = document.createElement("div");
    labelEl.className = "calendar-day-label";
    labelEl.innerHTML = `
      <span class="day-name">${label.day}</span>
      <span class="day-num">${label.date}</span>
    `;

    dayCell.appendChild(labelEl);

    gamesForDay.forEach(game => {
    const gameEl = document.createElement("div");
    gameEl.className = "calendar-game";

    // Preserve team-based styling
    if (game.team_id) {
        gameEl.dataset.team = game.team_id;
    }

    // Preserve stats indicator
    if (game.has_stats) {
        gameEl.classList.add("has-stats");
    }

    dayCell.appendChild(gameEl);
    });

    if (gamesForDay.length) {
      dayCell.classList.add("has-games");
      dayCell.addEventListener("click", () => {
        if (onDaySelected) onDaySelected(dateKey, gamesForDay);
      });
    }

    return dayCell;
  }

  window.CalendarController = {
    renderCalendar
  };

})();
