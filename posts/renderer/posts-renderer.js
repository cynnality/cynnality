const PostsRenderer = (() => {
    async function loadJson(path, fallback) {
        try {
            const response = await fetch(path);
            if (!response.ok) return fallback;

            const text = await response.text();
            if (!text.trim()) return fallback;

            return JSON.parse(text);
        } catch (error) {
            console.warn(`Could not load ${path}`, error);
            return fallback;
        }
    }

    async function loadText(path) {
        if (!path) return "";

        try {
            const safePath = path.replaceAll(" ", "%20");
            const response = await fetch(`../../${safePath}`);

            if (!response.ok) return "";

            return await response.text();
        } catch (error) {
            console.warn(`Could not load ${path}`, error);
            return "";
        }
    }

    function renderSimpleMarkdown(value = "") {
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

    function renderPostContent(content) {
        return content
            ? renderSimpleMarkdown(content)
            : `<p>No content found.</p>`;
    }

    return {
        loadJson,
        loadText,
        renderSimpleMarkdown,
        renderPostContent
    };
})();