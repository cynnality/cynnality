function getExplainerLayer() {
  return document.getElementById("explainer-layer");
}

async function loadYearExplainer(year) {

  const explainerLayer = document.getElementById("explainer-layer");
  if (!explainerLayer) return;

  // Clear previous explainer
  explainerLayer.innerHTML = "";

  try {

    const response = await fetch(`explainer-${year}.svg`);
    const svgText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");

    const svgElement = doc.documentElement;

    // Remove width/height
    svgElement.removeAttribute("width");
    svgElement.removeAttribute("height");

    // Convert <svg> to <g>
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");

    while (svgElement.firstChild) {
      wrapper.appendChild(svgElement.firstChild);
    }

    const explainerId = `explainer-${year}`;

    wrapper.setAttribute("id", explainerId);
    wrapper.setAttribute("class", "year-explainer");
    wrapper.setAttribute(
    "transform",
    "translate(200,200) scale(0.7)"
    );

    explainerLayer.appendChild(wrapper);

    // 🔥 THIS IS WHAT MAKES IT DRAGGABLE
    makeSvgDraggable(explainerId);

  } catch (err) {
    console.error("Explainer load failed:", err);
  }
}