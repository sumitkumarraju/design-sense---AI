import { editor } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

export function analyzeTypography(): { score: number, issues: DesignIssue[] } {
    const page = editor.context.insertionParent;
    if (!page) {
        return { score: 100, issues: [] };
    }

    const elements = page.children.toArray();
    const textNodes = extractTextInfo(elements);

    if (textNodes.length === 0) {
        return { score: 100, issues: [] };
    }

    const hierarchyIssues = checkHierarchy(textNodes);
    const fontFamilyIssues = checkFontFamilyCount(textNodes);
    const sizeConsistencyIssues = checkSizeConsistency(textNodes);

    const allIssues = [
        ...hierarchyIssues,
        ...fontFamilyIssues,
        ...sizeConsistencyIssues
    ];

    const score = calculateTypographyScore(allIssues);
    return { score, issues: allIssues };
}

interface TextInfo {
    fontSize: number;
    fontFamily: string;
    name: string;
}

function extractTextInfo(elements: readonly any[]): TextInfo[] {
    const texts: TextInfo[] = [];

    elements.forEach(el => {
        // Express SDK text nodes have a `text` property and character styles
        // We attempt to read fontSize and fontFamily from the element
        try {
            if (el.type === "Text" || el.type === "text") {
                const fontSize = el.fontSize || el.characterStyles?.fontSize || 16;
                const fontFamily = el.fontFamily || el.characterStyles?.fontFamily || "Unknown";
                texts.push({
                    fontSize: Number(fontSize),
                    fontFamily: String(fontFamily),
                    name: el.name || "Text Element"
                });
            }
        } catch {
            // Skip elements that don't expose text properties
        }
    });

    return texts;
}

/**
 * Hierarchy Detection:
 * - Headlines should be clearly larger than body text
 * - Multiple same-size large texts = weak hierarchy
 */
function checkHierarchy(textNodes: TextInfo[]): DesignIssue[] {
    if (textNodes.length < 2) return [];

    const sizes = textNodes.map(t => t.fontSize);
    const maxSize = Math.max(...sizes);

    // Count how many elements share the largest size
    const largestCount = sizes.filter(s => Math.abs(s - maxSize) < 2).length;

    const issues: DesignIssue[] = [];

    // Multiple competing headlines
    if (largestCount > 2) {
        issues.push({
            type: "NO_FOCAL_POINT",
            severity: "MEDIUM",
            title: "Multiple competing headlines",
            description: `${largestCount} text elements share the largest font size (${maxSize}px). Consider differentiating headline from subheadings.`,
            suggestedFix: "Reduce secondary headline sizes"
        });
    }

    // Check size ratio between largest and smallest
    const minSize = Math.min(...sizes);
    const ratio = maxSize / minSize;

    if (ratio < 1.25 && textNodes.length > 2) {
        issues.push({
            type: "NO_FOCAL_POINT",
            severity: "MEDIUM",
            title: "Weak text size contrast",
            description: "Font sizes are too similar across elements. Use a modular scale (e.g., 1.25× ratio) for better hierarchy.",
            suggestedFix: "Apply modular type scale"
        });
    }

    return issues;
}

/**
 * Font Family Detection:
 * - More than 2 font families = visual noise
 */
function checkFontFamilyCount(textNodes: TextInfo[]): DesignIssue[] {
    const families = new Set(textNodes.map(t => t.fontFamily));

    if (families.size > 2) {
        return [{
            type: "NO_FOCAL_POINT",
            severity: "LOW",
            title: "Too many font families",
            description: `Using ${families.size} different font families. Limit to 2 for visual cohesion.`,
            suggestedFix: "Consolidate to 2 font families"
        }];
    }

    return [];
}

/**
 * Size Consistency Detection:
 * - Body text should use consistent sizes
 * - Detect scattered font sizes that don't follow a scale
 */
function checkSizeConsistency(textNodes: TextInfo[]): DesignIssue[] {
    if (textNodes.length < 3) return [];

    const sizes = textNodes.map(t => t.fontSize);
    const uniqueSizes = new Set(sizes);

    // If more than 4 distinct sizes across text elements, that's inconsistent
    if (uniqueSizes.size > 4) {
        return [{
            type: "NO_FOCAL_POINT",
            severity: "LOW",
            title: "Inconsistent font sizing",
            description: `${uniqueSizes.size} different font sizes detected. Standardize to a type scale for visual rhythm.`,
            suggestedFix: "Adopt a consistent type scale"
        }];
    }

    return [];
}

function calculateTypographyScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * mult[issue.severity];
    });
    return Math.max(Math.round(score), 30);
}
