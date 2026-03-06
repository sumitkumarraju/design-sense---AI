import { editor } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Main Entry ─────────────────────────────────────────────────────

export function analyzeHierarchy(): { score: number; issues: DesignIssue[] } {
    const page = editor.context.insertionParent;
    if (!page) return { score: 100, issues: [] };

    const elements = page.children.toArray();
    if (elements.length < 2) return { score: 100, issues: [] };

    const dominanceIssues = checkSizeDominance(elements);
    const positionIssues = checkPositionHierarchy(elements, page);
    const weightIssues = checkVisualWeight(elements);

    const allIssues = [
        ...dominanceIssues,
        ...positionIssues,
        ...weightIssues
    ];

    return { score: calculateHierarchyScore(allIssues), issues: allIssues };
}

// ─── Size Dominance ─────────────────────────────────────────────────
// At least one element should be clearly dominant (≥35% of total area)

function checkSizeDominance(elements: readonly any[]): DesignIssue[] {
    const areas = elements.map(el => (el.width || 100) * (el.height || 100));
    const totalArea = areas.reduce((a, b) => a + b, 0);
    const maxArea = Math.max(...areas);

    const dominanceRatio = maxArea / totalArea;

    if (dominanceRatio < 0.25) {
        return [{
            type: "WEAK_HIERARCHY",
            severity: "MEDIUM",
            title: "No dominant visual element",
            description: "All elements are similar in size. Create a clear focal point by making one element significantly larger.",
            suggestedFix: "Enlarge the primary element"
        }];
    }

    // Check if too many elements compete for dominance
    const largeElements = areas.filter(a => a > totalArea * 0.20);
    if (largeElements.length > 2) {
        return [{
            type: "WEAK_HIERARCHY",
            severity: "LOW",
            title: "Multiple competing focal points",
            description: `${largeElements.length} large elements compete for attention. Differentiate sizes to create clear priority.`,
            suggestedFix: "Reduce secondary element sizes"
        }];
    }

    return [];
}

// ─── Position Hierarchy ─────────────────────────────────────────────
// Important elements should follow reading patterns (top-left or center emphasis)

function checkPositionHierarchy(elements: readonly any[], page: any): DesignIssue[] {
    const pageW = page.width || 800;
    const pageH = page.height || 600;

    const areas = elements.map(el => ({
        area: (el.width || 100) * (el.height || 100),
        centerX: el.translation.x + (el.width || 100) / 2,
        centerY: el.translation.y + (el.height || 100) / 2
    }));

    // Find the largest element
    const sorted = areas.slice().sort((a, b) => b.area - a.area);
    const largest = sorted[0];

    // Check if the largest element is in the bottom-right quadrant
    // (unnatural for primary content in LTR layouts)
    const isBottomRight =
        largest.centerX > pageW * 0.65 &&
        largest.centerY > pageH * 0.65;

    if (isBottomRight && sorted.length > 2) {
        return [{
            type: "WEAK_HIERARCHY",
            severity: "LOW",
            title: "Primary element in weak position",
            description: "The largest element is positioned in the bottom-right, which is typically scanned last. Consider placing it in the upper-left or center.",
            suggestedFix: "Move primary element to a stronger position"
        }];
    }

    return [];
}

// ─── Visual Weight Distribution ─────────────────────────────────────
// Checks that visual weight (size × position importance) is well-distributed

function checkVisualWeight(elements: readonly any[]): DesignIssue[] {
    if (elements.length < 3) return [];

    // Simple visual weight: area * (1 / distance from top-left)
    const weights = elements.map(el => {
        const area = (el.width || 100) * (el.height || 100);
        const distFromOrigin = Math.sqrt(
            el.translation.x ** 2 + el.translation.y ** 2
        ) + 1;
        return area / distFromOrigin;
    });

    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    // If the ratio of max to min weight is extreme, hierarchy is too steep
    if (maxWeight / minWeight > 50) {
        return [{
            type: "WEAK_HIERARCHY",
            severity: "LOW",
            title: "Extreme visual weight imbalance",
            description: "Some elements are visually overpowering while others are nearly invisible. Consider a more gradual hierarchy.",
            suggestedFix: "Adjust element sizes for balanced hierarchy"
        }];
    }

    return [];
}

// ─── Scoring ────────────────────────────────────────────────────────

function calculateHierarchyScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * (mult[issue.severity] || 1);
    });
    return Math.max(Math.round(score), 0);
}
