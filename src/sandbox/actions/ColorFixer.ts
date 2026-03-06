import { editor, colorUtils } from "express-document-sdk";

// ─── Color Utilities ────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

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

// ─── WCAG Contrast Boost Fixer ──────────────────────────────────────

export function fixContrast(): { success: boolean; message: string } {
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

            if (ratio < 4.5) {
                const lum = relativeLuminance(rgb);

                if (lum > 0.5) {
                    const darkened = darkenColor(rgb, 4.5, white);
                    // @ts-ignore
                    el.fill = colorUtils.fromHex(rgbToHex(darkened));
                    fixedCount++;
                } else if (ratio < 3.0) {
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

// ─── Palette Simplification Fixer ───────────────────────────────────

export function fixColorPalette(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];

    const colorMap: { el: any; rgb: RGB }[] = [];
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
