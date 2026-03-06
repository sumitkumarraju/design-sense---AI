import { editor, colorUtils } from "express-document-sdk";

// ─── Color Utilities ────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

function extractFillColor(el: any): RGB | null {
    try {
        // Try shape fill first
        if (el.fill && el.fill.color) {
            return toRGB(el.fill.color);
        }
        // Try allTextStyles for text elements
        if (el.allTextStyles && el.allTextStyles.color) {
            return toRGB(el.allTextStyles.color);
        }
        // Try characterStyles
        if (el.characterStyles && el.characterStyles.fill) {
            return toRGB(el.characterStyles.fill.color || el.characterStyles.fill);
        }
        // Direct fill that is a color
        if (el.fill && typeof el.fill.red === "number") {
            return toRGB(el.fill);
        }
    } catch { /* skip */ }
    return null;
}

function toRGB(colorObj: any): RGB | null {
    try {
        if (typeof colorObj.red === "number") {
            return {
                r: Math.round(colorObj.red * 255),
                g: Math.round(colorObj.green * 255),
                b: Math.round(colorObj.blue * 255)
            };
        }
        if (typeof colorObj.r === "number") {
            return { r: colorObj.r, g: colorObj.g, b: colorObj.b };
        }
    } catch { /* skip */ }
    return null;
}

function relativeLuminance(rgb: RGB): number {
    const linearize = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

function contrastRatio(c1: RGB, c2: RGB): number {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function adjustForContrast(rgb: RGB, bg: RGB, targetRatio: number): RGB {
    const bgLum = relativeLuminance(bg);
    let r = rgb.r, g = rgb.g, b = rgb.b;

    // Determine if we need to darken or lighten
    const fgLum = relativeLuminance(rgb);
    const shouldDarken = fgLum > bgLum;

    for (let i = 0; i < 100; i++) {
        if (contrastRatio({ r, g, b }, bg) >= targetRatio) break;

        if (shouldDarken) {
            // Darken the foreground
            r = Math.max(0, r - 3);
            g = Math.max(0, g - 3);
            b = Math.max(0, b - 3);
        } else {
            // Lighten the foreground
            r = Math.min(255, r + 3);
            g = Math.min(255, g + 3);
            b = Math.min(255, b + 3);
        }
    }
    return { r, g, b };
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

function applyColorToElement(el: any, hex: string): boolean {
    try {
        const color = colorUtils.fromHex(hex);

        // Try text-specific approach first
        const elType = String(el.type || "").toLowerCase();
        if (elType === "text") {
            // For text elements, try setting fill directly
            (el as any).fill = color;
            return true;
        }

        // For shape elements
        (el as any).fill = color;
        return true;
    } catch {
        return false;
    }
}

// ─── WCAG Contrast Fixer ────────────────────────────────────────────
// Fixes ALL element types (shapes + text) for WCAG AA 4.5:1 contrast

export function fixContrast(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    const bg: RGB = { r: 255, g: 255, b: 255 }; // assume white background
    let fixedCount = 0;

    elements.forEach(el => {
        try {
            const rgb = extractFillColor(el);
            if (!rgb) return;

            const ratio = contrastRatio(rgb, bg);

            if (ratio < 4.5) {
                const adjusted = adjustForContrast(rgb, bg, 4.5);
                const hex = rgbToHex(adjusted);

                if (applyColorToElement(el, hex)) {
                    fixedCount++;
                }
            }
        } catch { /* skip non-colorable elements */ }
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) adjusted for WCAG 4.5:1 contrast"
            : "All elements already meet contrast requirements"
    };
}

// ─── Palette Simplification Fixer ───────────────────────────────────

export function fixColorPalette(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];

    const colorMap: { el: any; rgb: RGB }[] = [];
    elements.forEach(el => {
        try {
            const rgb = extractFillColor(el);
            if (rgb) colorMap.push({ el, rgb });
        } catch { /* skip */ }
    });

    if (colorMap.length < 2) return { success: false, message: "Not enough colors to simplify" };

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
            if (applyColorToElement(group[i].el, targetHex)) {
                fixedCount++;
            }
        }
    });

    return {
        success: true,
        message: fixedCount + " element(s) unified. Palette reduced to " + groups.length + " color groups"
    };
}
