const UtilityEntryService = (() => {
    const DATA_PATH =
        "../../basketball_101_data_files/utility_entries_data.json";

    const SAVE_URL =
        "http://localhost:8787/save-utility-entry";

    function slugify(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/['’]/g, "")
            .replace(/[ç]/g, "c")
            .replace(/[ğ]/g, "g")
            .replace(/[ı]/g, "i")
            .replace(/[ö]/g, "o")
            .replace(/[ş]/g, "s")
            .replace(/[ü]/g, "u")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    }

    function createEntryId(parts = []) {
        const cleanParts = parts
            .filter(Boolean)
            .map(slugify)
            .filter(Boolean);

        return `utility_${cleanParts.join("_")}_${Date.now()}`;
    }

    async function loadEntries() {
        const response = await fetch(DATA_PATH);

        if (!response.ok) {
            return {
                openEntries: {},
                resolvedEntries: {}
            };
        }

        const data = await response.json();

        return {
            openEntries: data.openEntries || data.entries || {},
            resolvedEntries: data.resolvedEntries || {}
        };
    }

    async function saveEntry(entry) {
        const response = await fetch(SAVE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            throw new Error("Could not save utility entry.");
        }

        return await response.json();
    }

    function buildUtilityEntry({
        title,
        category,
        priority = "normal",
        createdFrom,
        task,
        referenceRequest,
        wires,
        attachedTo,
        notes = ""
    }) {
        return {
            entryId: createEntryId([
                category,
                title,
                referenceRequest?.playerName
            ]),

            title,
            entryType: "utility_note",
            contentType: "data",
            collection: "wnba",
            category,
            status: "open",
            priority,

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),

            createdFrom,
            task,
            referenceRequest,
            wires,
            attachedTo,

            notes,

            resolved: {
                isResolved: false,
                resolvedAt: "",
                resolvedByTool: "",
                resolvedIds: {}
            }
        };
    }

    function resolveEntry(entry, resolvedIds = {}, resolvedByTool = "utility-entry-manager") {
        return {
            ...entry,
            status: "resolved",
            updatedAt: new Date().toISOString(),
            resolved: {
                ...(entry.resolved || {}),
                isResolved: true,
                resolvedAt: new Date().toISOString(),
                resolvedByTool,
                resolvedIds
            }
        };
    }

    return {
        slugify,
        createEntryId,
        loadEntries,
        saveEntry,
        buildUtilityEntry,
        resolveEntry
    };
})();