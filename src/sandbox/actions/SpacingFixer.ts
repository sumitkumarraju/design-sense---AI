import { editor } from "express-document-sdk";

// ─── Equal Spacing Distribution Fixer ───────────────────────────────
// Sorts elements by Y position, calculates ideal equal gaps,
// and redistributes them vertically.

export function fixSpacing(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    if (elements.length < 3) return { success: false, message: "Need at least 3 elements" };

    const sorted = elements
        .slice()
        .sort((a, b) => a.translation.y - b.translation.y);

    const firstTop = sorted[0].translation.y;
    const lastEl = sorted[sorted.length - 1];
    const lastBottom = lastEl.translation.y + (lastEl.height || 100);

    const totalContentHeight = sorted.reduce((sum, el) => sum + (el.height || 100), 0);

    const totalAvailableSpace = lastBottom - firstTop - totalContentHeight;
    const equalGap = Math.max(10, totalAvailableSpace / (sorted.length - 1));

    let currentY = firstTop;
    let fixedCount = 0;

    sorted.forEach(el => {
        if (Math.abs(el.translation.y - currentY) > 3) {
            el.translation = { x: el.translation.x, y: Math.round(currentY) };
            fixedCount++;
        }
        currentY += (el.height || 100) + equalGap;
    });

    return {
        success: true,
        message: fixedCount + " element(s) redistributed with " + Math.round(equalGap) + "px equal spacing"
    };
}

// ─── Horizontal Spacing Fixer ───────────────────────────────────────

export function fixHorizontalSpacing(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    if (elements.length < 3) return { success: false, message: "Need at least 3 elements" };

    const sorted = elements
        .slice()
        .sort((a, b) => a.translation.x - b.translation.x);

    const firstLeft = sorted[0].translation.x;
    const lastEl = sorted[sorted.length - 1];
    const lastRight = lastEl.translation.x + (lastEl.width || 100);

    const totalContentWidth = sorted.reduce((sum, el) => sum + (el.width || 100), 0);

    const totalAvailableSpace = lastRight - firstLeft - totalContentWidth;
    const equalGap = Math.max(10, totalAvailableSpace / (sorted.length - 1));

    let currentX = firstLeft;
    let fixedCount = 0;

    sorted.forEach(el => {
        if (Math.abs(el.translation.x - currentX) > 3) {
            el.translation = { x: Math.round(currentX), y: el.translation.y };
            fixedCount++;
        }
        currentX += (el.width || 100) + equalGap;
    });

    return {
        success: true,
        message: fixedCount + " element(s) redistributed horizontally with " + Math.round(equalGap) + "px equal spacing"
    };
}
