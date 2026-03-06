import { editor } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Main Entry ─────────────────────────────────────────────────────

export function analyzeSpacing(): { score: number; issues: DesignIssue[] } {
    const page = editor.context.insertionParent;
    if (!page) return { score: 100, issues: [] };

    const elements = page.children.toArray();
    if (elements.length < 2) return { score: 100, issues: [] };

    const horizontalIssues = checkHorizontalGaps(elements);
    const verticalIssues = checkVerticalGaps(elements);
    const marginIssues = checkMarginBalance(elements, page);
    const whitespaceIssues = checkWhitespaceDistribution(elements, page);

    const allIssues = [
        ...horizontalIssues,
        ...verticalIssues,
        ...marginIssues,
        ...whitespaceIssues
    ];

    return { score: calculateSpacingScore(allIssues), issues: allIssues };
}

// ─── Horizontal Gap Consistency ─────────────────────────────────────

function checkHorizontalGaps(elements: readonly any[]): DesignIssue[] {
    const sorted = elements.slice().sort((a, b) => a.translation.x - b.translation.x);
    const gaps: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        const prevRight = prev.translation.x + (prev.width || 100);
        const gap = current.translation.x - prevRight;

        if (gap > 0 && gap < 500) gaps.push(gap);
    }

    if (gaps.length < 2) return [];

    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const inconsistent = gaps.filter(g => Math.abs(g - avg) > 15);

    if (inconsistent.length > 0) {
        return [{
            type: "SPACING_IMBALANCE",
            severity: "MEDIUM",
            title: "Inconsistent horizontal spacing",
            description: "Horizontal gaps between elements vary significantly. Use consistent spacing for visual rhythm.",
            suggestedFix: "Equalize horizontal gaps"
        }];
    }

    return [];
}

// ─── Vertical Gap Consistency ───────────────────────────────────────

function checkVerticalGaps(elements: readonly any[]): DesignIssue[] {
    const sorted = elements.slice().sort((a, b) => a.translation.y - b.translation.y);
    const gaps: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        const prevBottom = prev.translation.y + (prev.height || 100);
        const gap = current.translation.y - prevBottom;

        if (gap > 0 && gap < 500) gaps.push(gap);
    }

    if (gaps.length < 2) return [];

    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const inconsistent = gaps.filter(g => Math.abs(g - avg) > 15);

    if (inconsistent.length > 0) {
        return [{
            type: "SPACING_IMBALANCE",
            severity: "MEDIUM",
            title: "Inconsistent vertical spacing",
            description: "Vertical gaps between elements vary significantly. Standardize spacing for a cleaner layout.",
            suggestedFix: "Equalize vertical gaps"
        }];
    }

    return [];
}

// ─── Margin Balance ─────────────────────────────────────────────────
// Checks whether elements are roughly centered / balanced within the page

function checkMarginBalance(elements: readonly any[], page: any): DesignIssue[] {
    const pageWidth = page.width || 800;
    const pageHeight = page.height || 600;

    let minX = Infinity, maxRight = 0;
    let minY = Infinity, maxBottom = 0;

    elements.forEach(el => {
        const x = el.translation.x;
        const y = el.translation.y;
        const right = x + (el.width || 100);
        const bottom = y + (el.height || 100);

        if (x < minX) minX = x;
        if (right > maxRight) maxRight = right;
        if (y < minY) minY = y;
        if (bottom > maxBottom) maxBottom = bottom;
    });

    const leftMargin = minX;
    const rightMargin = pageWidth - maxRight;
    const topMargin = minY;
    const bottomMargin = pageHeight - maxBottom;

    const issues: DesignIssue[] = [];

    const horizontalImbalance = Math.abs(leftMargin - rightMargin);
    if (horizontalImbalance > 40) {
        issues.push({
            type: "SPACING_IMBALANCE",
            severity: "LOW",
            title: "Unbalanced horizontal margins",
            description: `Left margin (${Math.round(leftMargin)}px) vs right margin (${Math.round(rightMargin)}px). Consider centering content.`,
            suggestedFix: "Center content horizontally"
        });
    }

    const verticalImbalance = Math.abs(topMargin - bottomMargin);
    if (verticalImbalance > 40) {
        issues.push({
            type: "SPACING_IMBALANCE",
            severity: "LOW",
            title: "Unbalanced vertical margins",
            description: `Top margin (${Math.round(topMargin)}px) vs bottom margin (${Math.round(bottomMargin)}px). Consider centering content.`,
            suggestedFix: "Center content vertically"
        });
    }

    return issues;
}

// ─── Whitespace Distribution ────────────────────────────────────────
// Flags designs where content is crammed together with no breathing room

function checkWhitespaceDistribution(elements: readonly any[], page: any): DesignIssue[] {
    const pageArea = (page.width || 800) * (page.height || 600);
    let contentArea = 0;

    elements.forEach(el => {
        contentArea += (el.width || 100) * (el.height || 100);
    });

    const contentRatio = contentArea / pageArea;

    if (contentRatio > 0.85) {
        return [{
            type: "SPACING_IMBALANCE",
            severity: "HIGH",
            title: "Overcrowded layout",
            description: `Content fills ${Math.round(contentRatio * 100)}% of the page. Leave at least 20% whitespace for readability.`,
            suggestedFix: "Reduce element sizes or increase page area"
        }];
    }

    if (contentRatio < 0.10 && elements.length > 1) {
        return [{
            type: "SPACING_IMBALANCE",
            severity: "LOW",
            title: "Excessive whitespace",
            description: `Content fills only ${Math.round(contentRatio * 100)}% of the page. Consider increasing element sizes for more impact.`,
            suggestedFix: "Scale up content or reduce page dimensions"
        }];
    }

    return [];
}

// ─── Scoring ────────────────────────────────────────────────────────

function calculateSpacingScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * (mult[issue.severity] || 1);
    });
    return Math.max(Math.round(score), 0);
}
