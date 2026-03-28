const svgFiles = [
  "teams-listing-svgs/w_teams_s1.svg",
  "teams-listing-svgs/w_teams_s2.svg",
  "teams-listing-svgs/w_teams_s3.svg",
  "teams-listing-svgs/w_teams_s4.svg",
  "teams-listing-svgs/w_teams_s7.svg",
  "teams-listing-svgs/w_teams_s8.svg",
  "teams-listing-svgs/w_teams_s10.svg",
  "teams-listing-svgs/w_teams_s11.svg",
  "teams-listing-svgs/w_teams_s12.svg",
  "teams-listing-svgs/w_teams_s13.svg",
  "teams-listing-svgs/w_teams_s14.svg",
  "teams-listing-svgs/w_teams_s18.svg",
  "teams-listing-svgs/w_teams_s20.svg",
  "teams-listing-svgs/w_teams_s22.svg",
  "teams-listing-svgs/w_teams_s29.svg",
];

const YEAR_TO_VIEW = {
  "97": "s1",
  "98": "s2",
  "99": "s3",
  "00": "s4",
  "01": "s4",
  "02": "s4",
  "03": "s7",
  "04": "s8",
  "05": "s8",
  "06": "s10",
  "07": "s11",
  "08": "s12",
  "09": "s13",
  "10": "s14",
  "11": "s14",
  "12": "s14",
  "13": "s14",
  "14": "s18",
  "15": "s18",
  "16": "s20",
  "17": "s20",
  "18": "s22",
  "19": "s22",
  "20": "s22",
  "21": "s22",
  "22": "s22",
  "23": "s22",
  "24": "s22",
  "25": "s29",
};

const HARD_BUTTON_FILES = {
  "original_8": "/teams-listing-svgs/original_8_tree.svg",
  "expansion_teams": "/teams-listing-svgs/expansion_teams_tree.svg",
  "folded_teams": "/teams-listing-svgs/folded_teams_tree.svg",
  "relocated_teams": "/teams-listing-svgs/relocated_teams_tree.svg",
  "defs_of_terms": "/teams-listing-svgs/defs_of_terms_tree.svg",

  "totals_oview_tree": "/teams-listing-svgs/totals_oview_tree.svg",
  "wnba_teams_full_list": "/teams-listing-svgs/wnba_teams_full_list.svg",
};

function loadExternalSVG(filePath) {

  const container = document.getElementById("svg-grid");


  document.querySelectorAll(".svg-item").forEach(el => {
    el.classList.remove("active");
  });

  fetch(filePath)
    .then(res => res.text())
    .then(svg => {

      let existing = document.getElementById("external-view");

      if (!existing) {
        const wrapper = document.createElement("div");
        wrapper.id = "external-view";
        wrapper.classList.add("svg-item");

        container.appendChild(wrapper);
        existing = wrapper;
      }

      existing.innerHTML = svg;
      existing.classList.add("active");

    });

}

const container = document.getElementById("svg-grid");

Promise.all(
  svgFiles.map(file =>
    fetch(file).then(res => res.text()).then(svg => ({ file, svg }))
  )
).then(results => {

  results.forEach(({ file, svg }) => {

    const wrapper = document.createElement("div");
    wrapper.classList.add("svg-item");

    // ✅ now file is available
    const match = file.match(/s(\d+)\.svg$/);
    const seasonKey = match ? `s${match[1]}` : null;

    wrapper.id = `view-${seasonKey}`;

    wrapper.innerHTML = svg;
    container.appendChild(wrapper);
  });

});

function showView(seasonKey) {

  document.querySelectorAll(".svg-item").forEach(el => {
    el.classList.remove("active");
  });

  const target = document.getElementById(`view-${seasonKey}`);
  if (target) target.classList.add("active");

}

function setActiveButton(activeId) {

  document.querySelectorAll('[id^="gt-btn-"]').forEach(btn => {
    btn.classList.remove("active-btn");
  });

  const el = document.getElementById(activeId);
  if (el) el.classList.add("active-btn");
}

document.querySelectorAll('[id^="gt-btn-"]').forEach(btn => {

  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {

    const year = btn.id.replace("gt-btn-", "");
    const viewIndex = YEAR_TO_VIEW[year];

    if (viewIndex !== undefined) {
      showView(viewIndex);
    }

    setActiveButton(btn.id);

  });

});
document.querySelectorAll(".hard_btn, .intro_btn").forEach(btn => {

  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {

    const file = HARD_BUTTON_FILES[btn.id];

    if (file) {
      loadExternalSVG(file);
    }

  });

});