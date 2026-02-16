const fs = require("fs");
const path = require("path");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");

if (process.argv.length < 3) {
  console.log("Usage: node svg-flatten-transforms.js input.svg");
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath =
  path.basename(inputPath, ".svg") + "-flattened.svg";

const svgText = fs.readFileSync(inputPath, "utf8");
const parser = new DOMParser();
const serializer = new XMLSerializer();
const doc = parser.parseFromString(svgText, "image/svg+xml");

/* =========================
   UTIL: Parse translate(x,y)
========================= */

function parseTranslate(transform) {
  const match = transform.match(/translate\(([^)]+)\)/);
  if (!match) return [0, 0];

  const parts = match[1]
    .split(/[ ,]+/)
    .map(Number);

  return [
    parts[0] || 0,
    parts[1] || 0
  ];
}

/* =========================
   APPLY TRANSLATE TO ELEMENT
========================= */

function applyTranslate(el, tx, ty) {
  const x = parseFloat(el.getAttribute("x"));
  const y = parseFloat(el.getAttribute("y"));

  if (!isNaN(x)) {
    el.setAttribute("x", x + tx);
  }

  if (!isNaN(y)) {
    el.setAttribute("y", y + ty);
  }

  const cx = parseFloat(el.getAttribute("cx"));
  const cy = parseFloat(el.getAttribute("cy"));

  if (!isNaN(cx)) {
    el.setAttribute("cx", cx + tx);
  }

  if (!isNaN(cy)) {
    el.setAttribute("cy", cy + ty);
  }
}

/* =========================
   RECURSIVE WALK
========================= */

function processNode(node, parentTx = 0, parentTy = 0) {
  if (node.nodeType !== 1) return;

  let tx = parentTx;
  let ty = parentTy;

  const transform = node.getAttribute("transform");

  if (transform && transform.includes("translate")) {
    const [localTx, localTy] = parseTranslate(transform);
    tx += localTx;
    ty += localTy;
    node.removeAttribute("transform");
  }

  applyTranslate(node, tx, ty);

  Array.from(node.childNodes).forEach(child =>
    processNode(child, tx, ty)
  );
}

processNode(doc.documentElement);

const result = serializer.serializeToString(doc);
fs.writeFileSync(outputPath, result);

console.log("Flattened SVG written to:", outputPath);
