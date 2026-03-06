import { editor } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Main Entry ─────────────────────────────────────────────────────

export function analyzeContrast(): { score: number; issues: DesignIssue[] } {
    const page = editor.context.insertionParent;
    if (!page) return { score: 100, issues: [] };

    const elements = page.children.toArray();
    const textElements = extractTextElements(elements);

    if (textElements.length === 0) return { score: 100, issues: [] };

    const aaIssues = checkWCAG_AA(textElements);
    const aaaIssues = checkWCAG_AAA(textElements);
    const largeTextIssues = checkLargeTextContrast(textElements);

    const allIssues = [...aaIssues, ...aaaIssues, ...largeTextIssues];
    return { score: calculateContrastScore(allIssues), issues: allIssues };
}

// ─── Types ──────────────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

interface TextElement {
    id: string;
    name: string;
    fontSize: number;
    foreground: RGB;
    background: RGB;
}

// ─── Text Element Extraction ────────────────────────────────────────

function extractTextElements(elements: readonly any[]): TextElement[] {
    const results: TextElement[] = [];

    elements.forEach((el, index) => {
        try {
            if (el.type === "Text" || el.type === "text") {
                const fg = extractColor(el);
                const bg: RGB = { r: 255, g: 255, b: 255 }; // assume white bg

                if (fg) {
                    results.push({
                        id: el.id || `text-${index}`,
                        name: el.name || "Text Element",
                        fontSize: el.fontSize || el.characterStyles?.fontSize || 16,
                        foreground: fg,
                        background: bg
                    });
                }
            }
        } catch {
            // Skip elements that don't expose text properties
        }
    });

    return results;
}

function extractColor(el: any): RGB | null {
    try {
        const fill = el.fill || el.characterStyles?.fill;
        if (!fill) return null;
        const c = fill.color || fill;
        if (c.red !== undefined) {
            return { r: Math.round(c.red * 255), g: Math.round(c.green * 255), b: Math.round(c.blue * 255) };
        }
        if (c.r !== undefined) {
            return { r: c.r, g: c.g, b: c.b };
        }
    } catch { /* ignore */ }
    return { r: 0, g: 0, b: 0 }; // default to black text
}

// ─── WCAG AA Check (4.5:1 for normal text, 3:1 for large) ──────────

function checkWCAG_AA(textElements: TextElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    textElements.forEach(el => {
        const ratio = contrastRatio(el.foreground, el.background);
        const isLargeText = el.fontSize >= 18;
        const threshold = isLargeText ? 3.0 : 4.5;

        if (ratio < threshold) {
            issues.push({
                type: "LOW_CONTRAST",
                severity: "HIGH",
                title: `WCAG AA fail: "${el.name}"`,
                description: `Contrast ratio ${ratio.toFixed(2)}:1 (requires ${threshold}:1). Font size: ${el.fontSize}px.`,
                elementId: el.id,
                suggestedFix: "Darken text or lighten background"
            });
        }
    });

    return issues;
}

// ─── WCAG AAA Check (7:1 for normal text, 4.5:1 for large) ─────────

function checkWCAG_AAA(textElements: TextElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    textElements.forEach(el => {
        const ratio = contrastRatio(el.foreground, el.background);
        const isLargeText = el.fontSize >= 18;
        const aaThreshold = isLargeText ? 3.0 : 4.5;
        const aaaThreshold = isLargeText ? 4.5 : 7.0;

        // Only flag AAA if AA passes (to avoid duplicate noise)
        if (ratio >= aaThreshold && ratio < aaaThreshold) {
            issues.push({
                type: "AAA_CONTRAST_FAIL",
                severity: "LOW",
                title: `WCAG AAA opportunity: "${el.name}"`,
                description: `Contrast ratio ${ratio.toFixed(2)}:1 passes AA but not AAA (${aaaThreshold}:1). Consider improving for maximum accessibility.`,
                elementId: el.id,
                suggestedFix: "Increase contrast for AAA compliance"
            });
        }
    });

    return issues;
}

// ─── Large Text Threshold ───────────────────────────────────────────
// Headings ≥24px or bold ≥18px get different contrast requirements

function checkLargeTextContrast(textElements: TextElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    const largeTexts = textElements.filter(el => el.fontSize >= 24);

    largeTexts.forEach(el => {
        const ratio = contrastRatio(el.foreground, el.background);
        if (ratio < 3.0) {
            issues.push({
                type: "LOW_CONTRAST",
                severity: "MEDIUM",
                title: `Low contrast heading: "${el.name}"`,
                description: `Large text (${el.fontSize}px) has contrast ratio ${ratio.toFixed(2)}:1. Even large text needs at least 3:1.`,
                elementId: el.id,
                suggestedFix: "Increase heading contrast"
            });
        }
    });

    return issues;
}

// ─── WCAG Contrast Calculation ──────────────────────────────────────

function contrastRatio(c1: RGB, c2: RGB): number {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(rgb: RGB): number {
    const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ─── Scoring ────────────────────────────────────────────────────────

function calculateContrastScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * (mult[issue.severity] || 1);
    });
    return Math.max(Math.round(score), 0);
}
