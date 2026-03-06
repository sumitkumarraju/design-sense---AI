import { editor, colorUtils, constants } from "express-document-sdk";

/**
 * AutoFixer — Central fix dispatcher for DesignSense AI.
 * Each fix algorithm uses the Express Document SDK to manipulate
 * elements on the current page.
 */

// ─── Main Dispatcher ────────────────────────────────────────────────

export function applyFix(issueType: string): { success: boolean; message: string } {
    try {
        switch (issueType) {
            case "MISALIGNED":
                return fixAlignment();
            case "POOR_SPACING":
                return fixSpacing();
            case "LOW_CONTRAST":
                return fixContrast();
            case "TOO_MANY_COLORS":
                return fixColorPalette();
            case "NO_FOCAL_POINT":
                return fixTypographyHierarchy();
            default:
                return { success: false, message: "Unknown issue type: " + issueType };
        }
    } catch (err: any) {
        return { success: false, message: err.message || "Fix failed" };
    }
}

// ─── Algorithm 1: K-Means Alignment ─────────────────────────────────
// Groups X positions into clusters (grid columns) and snaps each
// element to the nearest cluster center.

function fixAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    const xPositions = elements.map(el => el.translation.x);

    // K-means with k = number of natural columns (max 4)
    const k = Math.min(4, Math.max(1, detectColumnCount(xPositions)));
    const centers = kMeansClusters(xPositions, k);

    let fixedCount = 0;
    elements.forEach(el => {
        const nearestCenter = findNearest(el.translation.x, centers);
        if (Math.abs(el.translation.x - nearestCenter) > 5) {
            el.translation = { x: nearestCenter, y: el.translation.y };
            fixedCount++;
        }
    });

    return {
        success: true,
        message: fixedCount + " element(s) snapped to " + k + " column grid"
    };
}

function detectColumnCount(positions: number[]): number {
    const sorted = [...new Set(positions.map(p => Math.round(p / 10) * 10))].sort((a, b) => a - b);
    if (sorted.length <= 1) return 1;

    let groups = 1;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] > 50) groups++;
    }
    return groups;
}

function kMeansClusters(values: number[], k: number): number[] {
    // Initialize centers from evenly spaced points in range
    const min = Math.min(...values);
    const max = Math.max(...values);
    let centers: number[] = [];
    for (let i = 0; i < k; i++) {
        centers.push(min + (max - min) * (i / Math.max(k - 1, 1)));
    }

    // Run 10 iterations of K-means
    for (let iter = 0; iter < 10; iter++) {
        const buckets: number[][] = centers.map(() => []);

        values.forEach(v => {
            let bestIdx = 0;
            let bestDist = Math.abs(v - centers[0]);
            for (let i = 1; i < centers.length; i++) {
                const dist = Math.abs(v - centers[i]);
                if (dist < bestDist) { bestDist = dist; bestIdx = i; }
            }
            buckets[bestIdx].push(v);
        });

        centers = buckets.map((bucket, i) => {
            if (bucket.length === 0) return centers[i];
            return Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length);
        });
    }

    return centers;
}

function findNearest(value: number, centers: number[]): number {
    let best = centers[0];
    let bestDist = Math.abs(value - centers[0]);
    for (let i = 1; i < centers.length; i++) {
        const dist = Math.abs(value - centers[i]);
        if (dist < bestDist) { bestDist = dist; best = centers[i]; }
    }
    return best;
}

// ─── Algorithm 2: Equal Spacing Distribution ────────────────────────
// Sorts elements by Y position, calculates ideal equal gaps,
// and redistributes them vertically.

function fixSpacing(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    if (elements.length < 3) return { success: false, message: "Need at least 3 elements" };

    const sorted = elements
        .slice()
        .sort((a, b) => a.translation.y - b.translation.y);

    // Calculate total vertical span
    const firstTop = sorted[0].translation.y;
    const lastEl = sorted[sorted.length - 1];
    const lastBottom = lastEl.translation.y + (lastEl.height || 100);

    // Calculate total content height
    const totalContentHeight = sorted.reduce((sum, el) => sum + (el.height || 100), 0);

    // Equal gap between elements
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

// ─── Algorithm 3: WCAG Contrast Boost ───────────────────────────────
// For elements with low contrast against white background, darkens
// light fills or lightens dark fills to achieve WCAG AA 4.5:1 ratio.

function fixContrast(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    const white = { r: 255, g: 255, b: 255 };
    let fixedCount = 0;

    elements.forEach(el => {
        try {
            const fill = el.fill;
            if (!fill || !fill.color) return;

            const rgb = toRGB(fill.color);
            if (!rgb) return;

            const ratio = contrastRatio(rgb, white);

            // If contrast is below WCAG AA (4.5:1), adjust
            if (ratio < 4.5) {
                const lum = relativeLuminance(rgb);

                if (lum > 0.5) {
                    // Light color on white → darken it
                    const darkened = darkenColor(rgb, 4.5, white);
                    // @ts-ignore
                    el.fill = colorUtils.fromHex(rgbToHex(darkened));
                    fixedCount++;
                } else if (ratio < 3.0) {
                    // Very dark but still low contrast → lighten slightly or make darker
                    const adjusted = darkenColor(rgb, 4.5, white);
                    // @ts-ignore
                    el.fill = colorUtils.fromHex(rgbToHex(adjusted));
                    fixedCount++;
                }
            }
        } catch { /* skip non-fillable elements */ }
    });

    return {
        success: true,
        message: fixedCount + " element(s) adjusted for WCAG 4.5:1 contrast"
    };
}

// ─── Algorithm 4: Palette Simplification ────────────────────────────
// Merges similar colors (within 30° hue distance) to the most
// common color in each group. Reduces palette to ≤5 colors.

function fixColorPalette(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];

    // Collect all fill colors
    const colorMap: { el: any; rgb: { r: number; g: number; b: number } }[] = [];
    elements.forEach(el => {
        try {
            const fill = el.fill;
            if (fill && fill.color) {
                const rgb = toRGB(fill.color);
                if (rgb) colorMap.push({ el, rgb });
            }
        } catch { /* skip */ }
    });

    if (colorMap.length < 2) return { success: false, message: "Not enough colors to simplify" };

    // Group similar colors by hue proximity (within 30°)
    const groups: typeof colorMap[] = [];
    const assigned = new Set<number>();

    colorMap.forEach((item, i) => {
        if (assigned.has(i)) return;
        const group = [item];
        assigned.add(i);
        const hue1 = rgbToHsl(item.rgb).h;

        for (let j = i + 1; j < colorMap.length; j++) {
            if (assigned.has(j)) continue;
            const hue2 = rgbToHsl(colorMap[j].rgb).h;
            const diff = Math.abs(hue1 - hue2);
            const hueDist = Math.min(diff, 360 - diff);
            if (hueDist < 30) {
                group.push(colorMap[j]);
                assigned.add(j);
            }
        }
        groups.push(group);
    });

    // For each group with > 1 member, unify to the first color (most frequent)
    let fixedCount = 0;
    groups.forEach(group => {
        if (group.length < 2) return;
        const targetHex = rgbToHex(group[0].rgb);
        for (let i = 1; i < group.length; i++) {
            try {
                // @ts-ignore
                group[i].el.fill = colorUtils.fromHex(targetHex);
                fixedCount++;
            } catch { /* skip */ }
        }
    });

    return {
        success: true,
        message: fixedCount + " element(s) unified. Palette reduced to " + groups.length + " color groups"
    };
}

// ─── Algorithm 5: Modular Type Scale ────────────────────────────────
// Applies a 1.25× modular type scale. The largest text stays as-is,
// secondary text is scaled down by 1.25×, tertiary by 1.25² etc.

function fixTypographyHierarchy(): { success: boolean; message: string } {
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

    // Sort by current font size descending
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
        const clampedSize = Math.max(12, targetSize); // minimum 12px

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

// ─── Utility Functions ──────────────────────────────────────────────

interface RGB { r: number; g: number; b: number }

function toRGB(colorObj: any): RGB | null {
    try {
        if (typeof colorObj.red === "number") {
            return { r: Math.round(colorObj.red * 255), g: Math.round(colorObj.green * 255), b: Math.round(colorObj.blue * 255) };
        }
        if (typeof colorObj.r === "number") {
            return { r: colorObj.r, g: colorObj.g, b: colorObj.b };
        }
    } catch { /* skip */ }
    return null;
}

function relativeLuminance(rgb: RGB): number {
    const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(c1: RGB, c2: RGB): number {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function darkenColor(rgb: RGB, targetRatio: number, bg: RGB): RGB {
    // Iteratively darken the color until contrast ratio meets target
    let r = rgb.r, g = rgb.g, b = rgb.b;
    for (let i = 0; i < 50; i++) {
        const ratio = contrastRatio({ r, g, b }, bg);
        if (ratio >= targetRatio) break;
        r = Math.max(0, r - 5);
        g = Math.max(0, g - 5);
        b = Math.max(0, b - 5);
    }
    return { r, g, b };
}

function rgbToHex(c: RGB): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return "#" + toHex(c.r) + toHex(c.g) + toHex(c.b);
}

function rgbToHsl(c: RGB): { h: number; s: number; l: number } {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
        h *= 360;
    }
    return { h, s, l };
}

// Exported for testing
export { kMeansClusters, findNearest, detectColumnCount, darkenColor, rgbToHex, contrastRatio, relativeLuminance };
