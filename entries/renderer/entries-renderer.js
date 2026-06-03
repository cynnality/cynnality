const EntriesRenderer = (() => {
    function renderSimpleMarkdown(value) {
        return value
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
            .replace(/__(.*?)__/gim, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/gim, "<em>$1</em>")
            .replace(/_(.*?)_/gim, "<em>$1</em>")
            .replace(/\n\n/gim, "</p><p>");
    }

    async function getEntryContent(entry) {
        if (!entry.contentFile) return "";

        const response = await fetch(`../${entry.contentFile}`);
        if (!response.ok) return "";

        return await response.text();
    }

    function getEntriesForWire(entries, wireId) {
        return entries.filter(entry =>
            (entry.wires || []).includes(wireId)
        );
    }

    function getEntriesForAttachedTo(entries, type, id) {
        return entries.filter(entry =>
            (entry.attachedTo || []).some(item =>
                item.type === type && item.id === id
            )
        );
    }

    async function openEntryModal(entry) {
        const modal = document.getElementById("entryModal");

        document.getElementById("entryModalCategory").textContent =
            entry.category || "";

        document.getElementById("entryModalTitle").textContent =
            entry.title || "Untitled Entry";

        document.getElementById("entryModalDescription").textContent =
            entry.description || "";

        const rawContent = await getEntryContent(entry);

        document.getElementById("entryModalContent").innerHTML =
            rawContent
                ? renderSimpleMarkdown(rawContent)
                : `<p>No markdown content found.</p>`;

        modal.classList.remove("hidden");
    }

    function closeEntryModal() {
        document.getElementById("entryModal").classList.add("hidden");
    }

    function setupEntryModal() {
        document
            .getElementById("closeEntryModalBtn")
            ?.addEventListener("click", closeEntryModal);

        document
            .getElementById("entryModalBackdrop")
            ?.addEventListener("click", closeEntryModal);
    }

    function renderPageEntries(entries, container) {
        container.innerHTML = "";

        if (!entries.length) {
            container.innerHTML = `<p>No entries wired to this page yet.</p>`;
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement("article");
            card.className = "page-entry-card";

            card.innerHTML = `
                <div class="page-entry-card-title">${entry.title}</div>
                <div class="page-entry-card-meta">${entry.category || ""}</div>
            `;

            card.addEventListener("click", () => {
                openEntryModal(entry);
            });

            container.appendChild(card);
        });
    }

    function setupEntriesPanelToggle() {
        document.querySelectorAll(".entries-panel-toggle").forEach(button => {
            button.addEventListener("click", () => {
                const panel = button.closest(".entries-page-panel");
                panel.classList.toggle("collapsed");

                button.textContent = panel.classList.contains("collapsed")
                    ? button.dataset.closedLabel
                    : button.dataset.openLabel;
            });
        });
    }

    return {
        setupEntryModal,
        setupEntriesPanelToggle,
        getEntriesForWire,
        getEntriesForAttachedTo,
        renderPageEntries,
        openEntryModal
    };
})();