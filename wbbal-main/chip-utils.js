/* =========================
   CHIP UTILITIES (SHARED)
========================= */

function setChipText(chipEl, { year, city, country }) {
  if (!chipEl) return;

  const cityEl = chipEl.querySelector("#chip-city");
  const countryEl = chipEl.querySelector("#chip-country");
  const yearEl = chipEl.querySelector("#chip-year");

  if (cityEl) cityEl.textContent = city.toUpperCase();
  if (countryEl) countryEl.textContent = country.toUpperCase();
  if (yearEl) yearEl.textContent = year;
}
