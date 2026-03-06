import { editor } from "express-document-sdk";

// ─── Modular Type Scale Fixer ───────────────────────────────────────
// Applies a 1.25× modular type scale. The largest text stays as-is,
// secondary text is scaled down by 1.25×, tertiary by 1.25² etc.

export function fixTypography(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    const textElements: any[] = [];

    elements.forEach(el => {
        try {
            const elType = String(el.type).toLowerCase();
            if (elType === "text") {
                textElements.push(el);
            }
        } catch { /* skip */ }
    });

    if (textElements.length < 2) return { success: false, message: "Need at least 2 text elements" };

    textElements.sort((a, b) => {
        const sizeA = a.fontSize || 16;
        const sizeB = b.fontSize || 16;
        return sizeB - sizeA;
    });

    const SCALE_RATIO = 1.25;
    const baseSize = textElements[0].fontSize || 32;
    let fixedCount = 0;

    textElements.forEach((el, index) => {
        const targetSize = Math.round(baseSize / Math.pow(SCALE_RATIO, index));
        const clampedSize = Math.max(12, targetSize);

        try {
            if (el.fontSize !== clampedSize) {
                el.fontSize = clampedSize;
                fixedCount++;
            }
        } catch { /* some text elements may not allow direct fontSize set */ }
    });

    return {
        success: true,
        message: fixedCount + " text element(s) adjusted to 1.25x modular scale"
    };
}

// ─── Font Family Consolidation ──────────────────────────────────────
// Consolidates more than 2 font families to the 2 most commonly used

export function fixFontFamilies(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    const textElements: any[] = [];

    elements.forEach(el => {
        try {
            if (String(el.type).toLowerCase() === "text") {
                textElements.push(el);
            }
        } catch { /* skip */ }
    });

    if (textElements.length < 2) return { success: false, message: "Need at least 2 text elements" };

    // Count font family usage
    const familyCounts = new Map<string, number>();
    textElements.forEach(el => {
        const family = el.fontFamily || "Unknown";
        familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    });

    if (familyCounts.size <= 2) return { success: true, message: "Already using ≤2 font families" };

    // Keep the 2 most common families
    const sorted = [...familyCounts.entries()].sort((a, b) => b[1] - a[1]);
    const keepFamilies = new Set([sorted[0][0], sorted[1][0]]);
    const fallbackFamily = sorted[0][0]; // most common = fallback

    let fixedCount = 0;
    textElements.forEach(el => {
        try {
            const family = el.fontFamily || "Unknown";
            if (!keepFamilies.has(family)) {
                el.fontFamily = fallbackFamily;
                fixedCount++;
            }
        } catch { /* skip */ }
    });

    return {
        success: true,
        message: fixedCount + " text element(s) consolidated to 2 font families"
    };
}
