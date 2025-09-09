let slides = [];
let current = 0;

fetch("general-notes.json")
  .then(res => res.json())
  .then(data => {
    slides = data;
    renderSlide();
  });

function renderList(items, indent = 0) {
  let html = `<ul style="margin-left:${indent}px;">`;
  items.forEach(item => {
    html += `<li>${item.text || ""}`;
    if (item.subitems) {
      html += renderList(item.subitems, indent + 24);
    }
    html += `</li>`;
  });
  html += "</ul>";
  return html;
}

function renderSlide() {
  const slide = slides[current];
  const container = document.getElementById("slide-container");
  if (!slide) {
    container.innerHTML = "<h2>No slide found.</h2>";
    return;
  }
  let html = `<h2>${slide.title}</h2>`;
  if (slide.title.toLowerCase() === "vocab") {
    html += "<ul>";
    slide.content.forEach(item => {
      if (item.type === "vocab") {
        html += `<li style="margin-bottom:8px;"><strong>${item.word}</strong>`;
        if (item.definition) {
          html += `<div style="margin-left:24px; color:#444; font-size:0.98em;">${item.definition}</div>`;
        }
        html += `</li>`;
      }
    });
    html += "</ul>";
  } else if (slide.title.toLowerCase().includes("constitution")) {
    html += "<ul>";
    slide.content.forEach(item => {
      if (item.type === "term") {
        html += `<li style="margin-bottom:8px;"><strong>${item.term}</strong>`;
        if (item.definition) {
          html += `<div style="margin-left:24px; color:#444; font-size:0.98em;">${item.definition}</div>`;
        }
        if (item.examples && item.examples.length) {
          html += `<ul style="margin-left:36px; margin-top:4px;">`;
          item.examples.forEach(ex => {
            html += `<li style="color:#333; font-size:0.97em;">${ex}</li>`;
          });
          html += `</ul>`;
        }
        html += `</li>`;
      } else if (item.type === "subtopic") {
        html += `<h3>${item.title}</h3>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
      } else if (item.type === "detail") {
        html += `<h4>${item.title}</h4>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
      } else if (item.text) {
        html += renderList([item]);
      }
    });
    html += "</ul>";
  } else {
    slide.content.forEach(item => {
      if (item.type === "subtopic") {
        html += `<h3>${item.title}</h3>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
      } else if (item.type === "detail") {
        html += `<h4>${item.title}</h4>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
      } else if (item.text) {
        html += renderList([item]);
      }
    });
  }
  container.innerHTML = html;
}
document.getElementById("prev-slide").onclick = function() {
  if (current > 0) {
    current--;
    renderSlide();
  }
};
document.getElementById("next-slide").onclick = function() {
  if (current < slides.length - 1) {
    current++;
    renderSlide();
  }
};