const VisualBuilder = (() => {
    function cleanClassName(value = "") {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s_-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/_+/g, "-");
    }

    function getSelectedText(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        return {
            start,
            end,
            selectedText: textarea.value.slice(start, end)
        };
    }

    function replaceSelectedText(textarea, newText, selectionStart, selectionEnd) {
        const before = textarea.value.slice(0, selectionStart);
        const after = textarea.value.slice(selectionEnd);

        textarea.value = `${before}${newText}${after}`;

        const cursorPosition = selectionStart + newText.length;
        textarea.focus();
        textarea.setSelectionRange(cursorPosition, cursorPosition);
    }

    function wrapSelectionWithTag(textarea, tagName) {
        const { start, end, selectedText } = getSelectedText(textarea);

        if (!selectedText) {
            return {
                ok: false,
                message: "Select text in the content editor first."
            };
        }

        const wrappedText = `<${tagName}>${selectedText}</${tagName}>`;

        replaceSelectedText(textarea, wrappedText, start, end);

        return {
            ok: true,
            message: `Wrapped selection with <${tagName}>.`
        };
    }

    function wrapSelectionWithClass(textarea, className, tagName = "mark") {
        const cleanName = cleanClassName(className);

        if (!cleanName) {
            return {
                ok: false,
                message: "Enter a class name first."
            };
        }

        const { start, end, selectedText } = getSelectedText(textarea);

        if (!selectedText) {
            return {
                ok: false,
                message: "Select text in the content editor first."
            };
        }

        const wrappedText = `<${tagName} class="${cleanName}">${selectedText}</${tagName}>`;

        replaceSelectedText(textarea, wrappedText, start, end);

        return {
            ok: true,
            className: cleanName,
            message: `Wrapped selection with ${tagName}.${cleanName}.`
        };
    }

    function createMarkerObject({ className, background, color }) {
        const cleanName = cleanClassName(className);

        if (!cleanName) return null;

        return {
            className: cleanName,
            background: background?.trim() || "",
            color: color?.trim() || ""
        };
    }

    function buildMarkerStyleBlock(marker) {
        const lines = [
            `mark.${marker.className} {`
        ];

        if (marker.background) {
            lines.push(`    background: ${marker.background};`);
        }

        if (marker.color) {
            lines.push(`    color: ${marker.color};`);
        }

        lines.push(`}`);

        return lines.join("\n");
    }

    function extractCssValue(cssBlock, propertyName) {
        const regex = new RegExp(`${propertyName}\\s*:\\s*([^;]+);`, "i");
        const match = cssBlock.match(regex);

        return match ? match[1].trim() : "";
    }

    function extractMarkersFromCss(cssText = "") {
        const markers = [];
        const markerRegex = /mark\.([a-zA-Z0-9_-]+)\s*\{([\s\S]*?)\}/g;

        let match;

        while ((match = markerRegex.exec(cssText)) !== null) {
            const className = match[1];
            const cssBlock = match[2];

            markers.push({
                className,
                background: extractCssValue(cssBlock, "background"),
                color: extractCssValue(cssBlock, "color")
            });
        }

        return markers;
    }

    function isSixDigitHex(value = "") {
        return /^#[0-9a-fA-F]{6}$/.test(value.trim());
    }

    function applyHexOpacity(hex, opacityPercent) {
        const cleanHex = hex.trim().replace("#", "").slice(0, 6);

        if (cleanHex.length !== 6) return hex;

        const opacity = Number(opacityPercent) / 100;

        const alpha = Math.round(opacity * 255)
            .toString(16)
            .padStart(2, "0");

        return `#${cleanHex}${alpha}`;
    }

    function buildHtmlElement({
        tag = "div",
        className = "",
        innerHtml = ""
    }) {
        const cleanTag = tag || "div";
        const cleanName = cleanClassName(className);

        const classAttribute = cleanName
            ? ` class="${cleanName}"`
            : "";

        return `<${cleanTag}${classAttribute}>
    ${innerHtml || ""}
    </${cleanTag}>`;
    }

    function buildCssBlock({
        selector,
        styles = {}
    }) {
        if (!selector) return "";

        const lines = [`${selector} {`];

        Object.entries(styles).forEach(([property, value]) => {
            if (!value) return;

            lines.push(`    ${property}: ${value};`);
        });

        lines.push("}");

        return lines.join("\n");
    }

    function createBox({
        tag = "div",
        className,
        background = "",
        color = "",
        border = "",
        borderRadius = "",
        padding = "",
        margin = "",
        width = "",
        minHeight = "",
        display = "",
        gap = ""
    }) {
        const cleanName = cleanClassName(className);

        if (!cleanName) {
            return {
                ok: false,
                message: "Enter a box class name first."
            };
        }

        const html = buildHtmlElement({
            tag,
            className: cleanName,
            innerHtml: ""
        });

        const css = buildCssBlock({
            selector: `.${cleanName}`,
            styles: {
                background,
                color,
                border,
                "border-radius": borderRadius,
                padding,
                margin,
                width,
                "min-height": minHeight,
                display,
                gap
            }
        });

        return {
            ok: true,
            html,
            css,
            className: cleanName,
            message: `Created box: .${cleanName}`
        };
    }

    return {
        cleanClassName,
        getSelectedText,
        replaceSelectedText,
        wrapSelectionWithTag,
        wrapSelectionWithClass,
        createMarkerObject,
        buildMarkerStyleBlock,
        extractCssValue,
        extractMarkersFromCss,
        isSixDigitHex,
        applyHexOpacity,
        buildHtmlElement,
        buildCssBlock,
        createBox
    };
})();