import { isAIEnabled } from "./AIProvider";

// ─── Palette Generator ──────────────────────────────────────────────
// Generates harmonious color palettes using AI data or built-in algorithms.

export interface GeneratedPalette {
    name: string;
    colors: string[];
    style: "vibrant" | "muted" | "monochrome" | "complementary" | "analogous" | "triadic";
    confidence: number;
    imageUrl?: string;
}

// Pre-built palettes for common design themes
const BUILT_IN_PALETTES: GeneratedPalette[] = [
    {
        name: "Ocean Breeze",
        colors: ["#0D9488", "#14B8A6", "#5EEAD4", "#99F6E4", "#F0FDFA"],
        style: "analogous",
        confidence: 0.9
    },
    {
        name: "Sunset Glow",
        colors: ["#DC2626", "#F97316", "#FBBF24", "#FDE68A", "#FEF3C7"],
        style: "analogous",
        confidence: 0.9
    },
    {
        name: "Midnight Pro",
        colors: ["#0F172A", "#1E293B", "#3B82F6", "#60A5FA", "#DBEAFE"],
        style: "monochrome",
        confidence: 0.9
    },
    {
        name: "Forest Calm",
        colors: ["#14532D", "#166534", "#22C55E", "#86EFAC", "#F0FDF4"],
        style: "monochrome",
        confidence: 0.9
    },
    {
        name: "Royal Contrast",
        colors: ["#1E1B4B", "#3730A3", "#6366F1", "#A5B4FC", "#EEF2FF"],
        style: "monochrome",
        confidence: 0.9
    },
    {
        name: "Warm Earth",
        colors: ["#78350F", "#B45309", "#F59E0B", "#FCD34D", "#FFFBEB"],
        style: "analogous",
        confidence: 0.9
    },
    {
        name: "Bold Vibrant",
        colors: ["#BE185D", "#7C3AED", "#2563EB", "#059669", "#D97706"],
        style: "vibrant",
        confidence: 0.85
    },
    {
        name: "Soft Pastel",
        colors: ["#FCA5A5", "#FDE68A", "#A7F3D0", "#93C5FD", "#C4B5FD"],
        style: "muted",
        confidence: 0.85
    }
];

export async function generatePalette(baseColor?: string, theme?: string): Promise<GeneratedPalette[]> {
    const results: GeneratedPalette[] = [];

    // Always return built-in palettes
    results.push(...BUILT_IN_PALETTES);

    // If a base color is provided, generate a custom palette
    if (baseColor) {
        const rgb = hexToRgb(baseColor);
        if (rgb) {
            results.unshift({
                name: `Custom from ${baseColor}`,
                colors: generateAnalogous(rgb),
                style: "analogous",
                confidence: 0.8
            });
        }
    }

    return results;
}

// ─── Color Math Helpers ─────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
    }
    return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function generateAnalogous(rgb: { r: number; g: number; b: number }): string[] {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: string[] = [];

    for (let i = -2; i <= 2; i++) {
        const newH = (hsl.h + i * 30 + 360) % 360;
        const newL = Math.max(0.1, Math.min(0.9, hsl.l + i * 0.1));
        const c = hslToRgb(newH, hsl.s, newL);
        colors.push(rgbToHex(c.r, c.g, c.b));
    }

    return colors;
}
