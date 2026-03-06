import { editor, colorUtils } from "express-document-sdk";

// ─── Color Utilities ────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

function getElementColor(el: any): RGB | null {
    try {
        // Method 1: Direct fill property (most common in Express SDK)
        const fill = el.fill;
        if (fill) {
            // If fill is a Color object directly (has red/green/blue)
            if (typeof fill.red === "number") {
                return { r: Math.round(fill.red * 255), g: Math.round(fill.green * 255), b: Math.round(fill.blue * 255) };
            }
            // If fill has a color property
            if (fill.color && typeof fill.color.red === "number") {
                return { r: Math.round(fill.color.red * 255), g: Math.round(fill.color.green * 255), b: Math.round(fill.color.blue * 255) };
            }
            // If fill has toHex or similar
            if (typeof fill.toHex === "function") {
                return hexToRgb(fill.toHex());
            }
        }
    } catch { /* continue to next method */ }

    try {
        // Method 2: Get fill color via SDK methods
        if (el.fillColor) {
            const fc = el.fillColor;
            if (typeof fc.red === "number") {
                return { r: Math.round(fc.red * 255), g: Math.round(fc.green * 255), b: Math.round(fc.blue * 255) };
            }
        }
    } catch { /* continue */ }

    try {
        // Method 3: For text elements
        if (el.allTextStyles) {
            const styles = el.allTextStyles;
            if (styles.color && typeof styles.color.red === "number") {
                return { r: Math.round(styles.color.red * 255), g: Math.round(styles.color.green * 255), b: Math.round(styles.color.blue * 255) };
            }
        }
    } catch { /* continue */ }

    return null;
}

function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function relativeLuminance(rgb: RGB): number {
    const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function contrastRatio(c1: RGB, c2: RGB): number {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function rgbToHex(c: RGB): string {
    const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return "#" + h(c.r) + h(c.g) + h(c.b);
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

function setElementColor(el: any, hex: string): boolean {
    try {
        // Try the standard Express SDK approach
        const newColor = colorUtils.fromHex(hex);

        // Try setting fill directly (works for most shape elements)
        el.fill = newColor;
        return true;
    } catch {
        // Fallback: try as any
        try {
            (el as any).fill = colorUtils.fromHex(hex);
            return true;
        } catch {
            return false;
        }
    }
}

// ─── WCAG Contrast Fixer ────────────────────────────────────────────

export function fixContrast(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    const white: RGB = { r: 255, g: 255, b: 255 };
    let fixedCount = 0;
    let scannedCount = 0;

    elements.forEach(el => {
        try {
            const rgb = getElementColor(el);
            if (!rgb) return;

            scannedCount++;
            const ratio = contrastRatio(rgb, white);

            // Fix any element that doesn't meet WCAG AA 4.5:1
            if (ratio < 4.5) {
                const fgLum = relativeLuminance(rgb);

                let r = rgb.r, g = rgb.g, b = rgb.b;

                if (fgLum > 0.2) {
                    // Light color on white — darken aggressively
                    for (let i = 0; i < 100; i++) {
                        if (contrastRatio({ r, g, b }, white) >= 4.5) break;
                        r = Math.max(0, r - 5);
                        g = Math.max(0, g - 5);
                        b = Math.max(0, b - 5);
                    }
                } else {
                    // Already dark but still low contrast — make even darker
                    for (let i = 0; i < 100; i++) {
                        if (contrastRatio({ r, g, b }, white) >= 4.5) break;
                        r = Math.max(0, r - 3);
                        g = Math.max(0, g - 3);
                        b = Math.max(0, b - 3);
                    }
                }

                const newHex = rgbToHex({ r, g, b });
                if (setElementColor(el, newHex)) {
                    fixedCount++;
                }
            }
        } catch { /* skip */ }
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " of " + scannedCount + " element(s) darkened for WCAG 4.5:1 contrast"
            : (scannedCount > 0 ? "All elements already meet contrast requirements" : "No colorable elements found")
    };
}

// ─── Palette Simplification Fixer ───────────────────────────────────

export function fixColorPalette(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    const colorMap: { el: any; rgb: RGB }[] = [];

    elements.forEach(el => {
        const rgb = getElementColor(el);
        if (rgb) colorMap.push({ el, rgb });
    });

    if (colorMap.length < 2) return { success: false, message: "Not enough colored elements" };

    // Group by hue proximity (within 30°)
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

    let fixedCount = 0;
    groups.forEach(group => {
        if (group.length < 2) return;
        const targetHex = rgbToHex(group[0].rgb);
        for (let i = 1; i < group.length; i++) {
            if (setElementColor(group[i].el, targetHex)) {
                fixedCount++;
            }
        }
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) unified into " + groups.length + " color groups"
            : "Colors already simplified"
    };
}
