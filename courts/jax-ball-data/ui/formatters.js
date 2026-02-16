(function () {

  function num(val) {
    if (val == null || val === "") return 0;
    return Number(val);
  }

  function formatDateLabel(dateStr, variant = "full") {
    if (!dateStr) return "";

    const d = new Date(dateStr + "T00:00:00");

    switch (variant) {
      case "day":
        return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

      case "day-date":
        return d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric"
        }).toUpperCase().replace(",", " ·");

      case "month":
        return d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        }).toUpperCase();

      case "numeric":
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        }).toUpperCase();

      case "full":
      default:
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric"
        }).toUpperCase().replace(",", " ·");
    }
  }

  function formatCalendarDayLabel(dateStr) {
    if (!dateStr) return { day: "", date: "" };

    const d = new Date(dateStr + "T00:00:00");

    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      date: d.getDate()
    };
  }

  function formatPlayer(p, {
    PLAYER_BY_ID,
    normalizeJersey
  }) {
    if (!p || !p.player_id) return "Unknown Player";

    // 1️⃣ Exact ID match
    let info = PLAYER_BY_ID[p.player_id];

    // 2️⃣ Fallback: team + raw jersey
    if (!info && p.jersey && p.player_id.includes("_")) {
      const teamId = p.player_id.split("_")[0];
      info = PLAYER_BY_ID[`${teamId}_${p.jersey}`];
    }

    // 3️⃣ Final fallback: team + normalized jersey
    if (!info && p.jersey && p.player_id.includes("_")) {
      const teamId = p.player_id.split("_")[0];
      const jersey = normalizeJersey(p.jersey);
      info = PLAYER_BY_ID[`${teamId}_${jersey}`];
    }

    if (!info) return p.player_id;

    return `#${info.number} ${info.name}`;
  }

  window.Formatters = {
    num,
    formatDateLabel,
    formatCalendarDayLabel,
    formatPlayer
  };

})();
