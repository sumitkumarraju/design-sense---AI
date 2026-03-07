import { editor, colorUtils } from "express-document-sdk";

// ─── Color Utilities ────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

function getElementColor(el: any): RGB | null {
    try {
        const fill = el.fill;
        if (!fill) return null;

        // ColorFill has a .color property which is a Color with .red/.green/.blue (0-1 range)
        const color = fill.color;
        if (color && typeof color.red === "number") {
            return {
                r: Math.round(color.red * 255),
                g: Math.round(color.green * 255),
                b: Math.round(color.blue * 255)
            };
        }
    } catch { /* skip */ }
    return null;
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

// ─── WCAG Contrast Fixer ────────────────────────────────────────────
// Uses correct SDK API: editor.makeColorFill()

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

            if (ratio < 4.5) {
                // Darken until we hit 4.5:1
                let r = rgb.r, g = rgb.g, b = rgb.b;
                for (let i = 0; i < 100; i++) {
                    if (contrastRatio({ r, g, b }, white) >= 4.5) break;
                    r = Math.max(0, r - 5);
                    g = Math.max(0, g - 5);
                    b = Math.max(0, b - 5);
                }

                // Use correct SDK API: editor.makeColorFill()
                const newColor = colorUtils.fromHex(rgbToHex({ r, g, b }));
                el.fill = editor.makeColorFill(newColor);
                fixedCount++;
            }
        } catch (err) {
            console.error("Contrast fix error:", err);
        }
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " of " + scannedCount + " element(s) darkened for WCAG 4.5:1"
            : (scannedCount > 0 ? "All elements already meet contrast" : "No colorable elements found")
    };
}

// ─── Palette Simplification ─────────────────────────────────────────

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
            if (Math.min(diff, 360 - diff) < 30) {
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
            try {
                const newColor = colorUtils.fromHex(targetHex);
                group[i].el.fill = editor.makeColorFill(newColor);
                fixedCount++;
            } catch { /* skip */ }
        }
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) unified into " + groups.length + " groups"
            : "Colors already simplified"
    };
}
