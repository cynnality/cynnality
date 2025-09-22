let slides = [];
let current = 0;

fetch("general-notes.json")
  .then(res => res.json())
  .then(data => {
    slides = data;
    renderSlide();
  });

function slugify(text) {
  return text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
}

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
    let html = `<div class="slide-title-block" id="slide${current}-title">
    <h2>${slide.title}</h2>
    </div>`;
  let h3Count = 0, h4Count = 0;

  if (slide.title.toLowerCase() === "vocab") {
    html += "<ul>";
    slide.content.forEach(item => {
      if (item.type === "vocab") {
        html += `<li style="margin-bottom:8px;"><strong>${item.word}</strong>`;
        if (item.definition) {
          html += `<div class="voc-def">${item.definition}</div>`;
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
          html += `<ul>`;
          item.examples.forEach(ex => {
            html += `<li>${ex}</li>`;
          });
          html += `</ul>`;
        }
        html += `</li>`;
      } else if (item.type === "subtopic") {
        const id = `slide${current}-h3-${h3Count++}-${slugify(item.title)}`;
        html += `<div id="${id}"><h3>${item.title}</h3>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
        html += `</div>`;
      } else if (item.type === "detail") {
        const id = `slide${current}-h4-${h4Count++}-${slugify(item.title)}`;
        html += `<div id="${id}"><h4>${item.title}</h4>`;
        if (item.details) {
          html += renderList(item.details.map(d => ({text: d})));
        }
        html += `</div>`;
      } else if (item.text) {
        html += renderList([item]);
      }
    });
    html += "</ul>";
    } else {
    // --- NESTED DIV LOGIC FOR GENERAL NOTES ---
    let h3Count = 0, h4Count = 0;
    let openH3 = null, openH4 = null;

    function closeH4() {
      if (openH4) {
        if (openH3) {
          openH3.content += openH4.content;
        } else {
          html += openH4.content;
        }
        openH4 = null;
      }
    }
    function closeH3() {
      closeH4();
      if (openH3) {
        html += openH3.content;
        openH3 = null;
      }
    }

    slide.content.forEach(item => {
      if (item.type === "subtopic") {
        closeH3();
        const id = `slide${current}-h3-${h3Count++}-${slugify(item.title)}`;
        openH3 = { id, content: `<div id="${id}"><h3>${item.title}</h3>` };
        if (item.details) {
          openH3.content += renderList(item.details.map(d => ({ text: d })));
        }
      } else if (item.type === "detail") {
        closeH4();
        const id = `slide${current}-h4-${h4Count++}-${slugify(item.title)}`;
        openH4 = { id, content: `<div class="detail-container" id="${id}"><h4>${item.title}</h4>` };
        if (item.details) {
          openH4.content += renderList(item.details.map(d => ({ text: d })));
        }
      } else if (item.text) {
        const listHtml = renderList([item]);
        if (openH4) {
          openH4.content += listHtml;
        } else if (openH3) {
          openH3.content += listHtml;
        } else {
          html += listHtml;
        }
      }
    });

    closeH4();
    closeH3();
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