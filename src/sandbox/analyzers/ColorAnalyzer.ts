import { editor } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

export function analyzeColors(): { score: number, issues: DesignIssue[] } {
    const page = editor.context.insertionParent;
    if (!page) {
        return { score: 100, issues: [] };
    }

    const elements = page.children.toArray();
    const colorData = extractColorData(elements);

    const paletteIssues = checkPaletteSize(colorData.uniqueColors);
    const contrastIssues = checkContrastPairs(colorData.colorPairs);
    const harmonyIssues = checkColorHarmony(colorData.uniqueColors);
    const dominanceIssues = checkColorDominance(colorData.colorUsage);

    const allIssues = [
        ...paletteIssues,
        ...contrastIssues,
        ...harmonyIssues,
        ...dominanceIssues
    ];

    const score = calculateColorScore(allIssues);
    return { score, issues: allIssues };
}

// ─── Color Data Types ───────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

interface ColorData {
    uniqueColors: RGB[];
    colorPairs: { foreground: RGB; background: RGB }[];
    colorUsage: { color: RGB; count: number }[];
}

// ─── Color Extraction ───────────────────────────────────────────────

function extractColorData(elements: readonly any[]): ColorData {
    const colors: RGB[] = [];
    const pairs: { foreground: RGB; background: RGB }[] = [];
    const usageMap = new Map<string, { color: RGB; count: number }>();

    elements.forEach(el => {
        try {
            // Try to extract fill color
            const fill = el.fill;
            if (fill && fill.color) {
                const rgb = toRGB(fill.color);
                if (rgb) {
                    colors.push(rgb);
                    const key = rgbToKey(rgb);
                    const entry = usageMap.get(key);
                    if (entry) {
                        entry.count++;
                    } else {
                        usageMap.set(key, { color: rgb, count: 1 });
                    }
                }
            }

            // Try to extract stroke color
            const stroke = el.stroke;
            if (stroke && stroke.color) {
                const rgb = toRGB(stroke.color);
                if (rgb) colors.push(rgb);
            }
        } catch {
            // Elements without color properties
        }
    });

    // Generate pairs for contrast checking (each color against white/black)
    colors.forEach(fg => {
        pairs.push({ foreground: fg, background: { r: 255, g: 255, b: 255 } });
        pairs.push({ foreground: fg, background: { r: 0, g: 0, b: 0 } });
    });

    // Build unique color list
    const seen = new Set<string>();
    const uniqueColors: RGB[] = [];
    colors.forEach(c => {
        const key = rgbToKey(c);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueColors.push(c);
        }
    });

    return {
        uniqueColors,
        colorPairs: pairs,
        colorUsage: Array.from(usageMap.values())
    };
}

// ─── WCAG Contrast Ratio ────────────────────────────────────────────

/**
 * Calculate WCAG 2.0 contrast ratio between two colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter luminance and L2 is the darker.
 */
export function contrastRatio(c1: RGB, c2: RGB): number {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance per WCAG 2.0
 */
export function relativeLuminance(rgb: RGB): number {
    const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─── Analysis Functions ─────────────────────────────────────────────

function checkPaletteSize(uniqueColors: RGB[]): DesignIssue[] {
    if (uniqueColors.length > 5) {
        return [{
            type: "TOO_MANY_COLORS",
            severity: "LOW",
            title: "Using too many colors",
            description: `${uniqueColors.length} distinct colors detected. Limit to 3-5 for visual harmony.`,
            suggestedFix: "Consolidate to a 3–5 color palette"
        }];
    }
    return [];
}

function checkContrastPairs(pairs: { foreground: RGB; background: RGB }[]): DesignIssue[] {
    const issues: DesignIssue[] = [];
    let lowContrastCount = 0;

    pairs.forEach(pair => {
        const ratio = contrastRatio(pair.foreground, pair.background);

        // WCAG AA requires 4.5:1 for normal text
        if (ratio < 3.0) {
            lowContrastCount++;
        }
    });

    if (lowContrastCount > 0) {
        issues.push({
            type: "LOW_CONTRAST",
            severity: "HIGH",
            title: "Low contrast text",
            description: `${lowContrastCount} color combination(s) fall below WCAG readability thresholds.`,
            suggestedFix: "Increase contrast to at least 4.5:1 ratio"
        });
    }

    return issues;
}

function checkColorHarmony(uniqueColors: RGB[]): DesignIssue[] {
    if (uniqueColors.length < 2) return [];

    // Convert to HSL and check if hues are harmonious
    const hues = uniqueColors.map(c => rgbToHsl(c).h);

    // Check for clashing hues (too close but not identical)
    let clashCount = 0;
    for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
            const diff = Math.abs(hues[i] - hues[j]);
            const hueDist = Math.min(diff, 360 - diff);
            // Hues 10-30° apart often clash visually
            if (hueDist > 10 && hueDist < 30) {
                clashCount++;
            }
        }
    }

    if (clashCount > 1) {
        return [{
            type: "TOO_MANY_COLORS",
            severity: "MEDIUM",
            title: "Clashing color combinations",
            description: "Some colors are too close in hue, creating visual tension.",
            suggestedFix: "Use complementary (180°) or analogous (30°+) color schemes"
        }];
    }

    return [];
}

function checkColorDominance(colorUsage: { color: RGB; count: number }[]): DesignIssue[] {
    if (colorUsage.length < 2) return [];

    const totalCount = colorUsage.reduce((sum, c) => sum + c.count, 0);
    const sorted = colorUsage.slice().sort((a, b) => b.count - a.count);
    const topRatio = sorted[0].count / totalCount;

    // Good design typically has 60-30-10 color rule
    // If no color dominates (primary < 40%), hierarchy is weak
    if (topRatio < 0.4) {
        return [{
            type: "TOO_MANY_COLORS",
            severity: "LOW",
            title: "No dominant brand color",
            description: "No single color takes visual priority. Apply the 60-30-10 rule.",
            suggestedFix: "Make one color occupy ~60% of the design"
        }];
    }

    return [];
}

// ─── Utility Functions ──────────────────────────────────────────────

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

function rgbToKey(c: RGB): string {
    return `${c.r},${c.g},${c.b}`;
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

function calculateColorScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * mult[issue.severity];
    });
    return Math.max(Math.round(score), 30);
}
