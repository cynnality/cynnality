const params = new URLSearchParams(window.location.search);
const file = params.get("file");

fetch(`${file}.md`)
  .then(res => res.text())
  .then(markdown => {
    document.getElementById("note-content").innerHTML =
      marked.parse(markdown);
  });