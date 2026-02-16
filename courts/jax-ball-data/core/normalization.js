(function () {

  function normalizePlayerId(id) {
    if (!id) return id;

    return id
      .toLowerCase()
      .replace(/-/g, "_")
      .replace(/^0+/, "")
      .replace(/_0(\d)/g, "_$1");
  }

  function normalizeJersey(jersey) {
    if (jersey == null) return null;
    return String(parseInt(jersey, 10));
  }

  window.Normalization = {
    normalizePlayerId,
    normalizeJersey
  };

})();
