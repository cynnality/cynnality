(function () {

  const state = {
    CURRENT_STAT: "pts",  // pts | reb | ast
    CURRENT_MODE: "total", // total | avg

    VIEW_MODE: "all", // "all" = show all players
    // "leaders" = top 5 per team (filtered)
    PLAYER_VIEW: "compact", // or "extended"
    LAYOUT_MODE: "by-team" // "by-team" | "global"
  };

  function setState(partial) {
    Object.assign(state, partial);
  }

  function getState() {
    return { ...state };
  }

  function resetStatFilters() {
    state.CURRENT_STAT = null;
    state.CURRENT_MODE = null;
  }

  window.PlayerState = {
    getState,
    setState,
    resetStatFilters
  };

})();
