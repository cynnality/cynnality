const params = new URLSearchParams(window.location.search);
const file = params.get("file");

fetch(`${file}.md`)
  .then(res => res.text())
  .then(markdown => {

    // custom ==highlight== syntax
    const processedMarkdown = markdown.replace(
      /==(.+?)==/g,
      '<mark>$1</mark>'
    );

    document.getElementById("note-content").innerHTML =
      marked.parse(processedMarkdown);

  });