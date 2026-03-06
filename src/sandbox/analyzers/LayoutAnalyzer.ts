import { editor, colorUtils, constants } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

export function analyzeLayout(): { score: number, issues: DesignIssue[] } {
    const page = editor.context.insertionParent;

    if (!page) {
        return { score: 100, issues: [] };
    }

    const elements = page.children.toArray();

    const alignmentIssues = checkLeftAlignment(elements);
    const spacingIssues = checkVerticalSpacing(elements);
    const gridIssues = detectGridColumns(elements);
    const focalIssues = detectFocalPoint(elements);

    const allIssues = [
        ...alignmentIssues,
        ...spacingIssues,
        ...gridIssues,
        ...focalIssues
    ];

    const score = calculateLayoutScore(allIssues);

    return { score, issues: allIssues };
}

export function autoFixAlignment(): void {
    const page = editor.context.insertionParent;
    if (!page) return;

    const elements = page.children.toArray();
    if (elements.length < 2) return;

    const minLeft = Math.min(
        ...elements.map(el => el.translation.x)
    );

    elements.forEach(el => {
        el.translation = { x: minLeft, y: el.translation.y };
    });
}

export function highlightElements(elements: readonly any[]): void {
    elements.forEach(el => {
        const rect = editor.createRectangle();

        rect.width = el.width || 100;
        rect.height = el.height || 100;

        // @ts-ignore
        rect.fill = colorUtils.fromHex("#transparent"); // SDK might handles this differently or null

        // @ts-ignore
        rect.stroke = {
            type: constants.StrokeType.color,
            color: colorUtils.fromHex("#FF0000"),
            width: 2,
            dashPattern: [],
            dashOffset: 0,
            position: constants.StrokePosition.center
        };

        rect.translation = {
            x: el.translation.x,
            y: el.translation.y
        };

        editor.context.insertionParent.children.append(rect);
    });
}

function checkLeftAlignment(elements: readonly any[]): DesignIssue[] {
    if (elements.length < 2) return [];

    const leftPositions = elements.map(el => el.translation.x);
    const minLeft = Math.min(...leftPositions);
    const variance = leftPositions.map(x => Math.abs(x - minLeft));

    const inconsistent = variance.filter(v => v > 10 && v < 200);

    if (inconsistent.length > 0) {
        return [{
            type: "MISALIGNED",
            severity: "MEDIUM",
            title: "Inconsistent left margins",
            description: "Elements are not aligned to a consistent left edge.",
            suggestedFix: "Align to grid"
        }];
    }
    return [];
}

function checkVerticalSpacing(elements: readonly any[]): DesignIssue[] {
    if (elements.length < 3) return [];

    const sorted = elements
        .slice()
        .sort((a, b) => a.translation.y - b.translation.y);

    const gaps: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];

        const prevBottom = prev.translation.y + (prev.height || 100);
        const gap = current.translation.y - prevBottom;

        if (gap > -50 && gap < 500) {
            gaps.push(gap);
        }
    }

    if (gaps.length < 2) return [];

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const inconsistent = gaps.filter(g => Math.abs(g - avgGap) > 15);

    if (inconsistent.length > 0) {
        return [{
            type: "POOR_SPACING",
            severity: "MEDIUM",
            title: "Uneven spacing between elements",
            description: "Vertical spacing is inconsistent across the layout.",
            suggestedFix: "Distribute vertically"
        }];
    }

    return [];
}

function detectGridColumns(elements: readonly any[]): DesignIssue[] {
    const xPositions = elements.map(el => el.translation.x);
    const columns: number[] = [];

    xPositions.forEach(x => {
        const existing = columns.find(col => Math.abs(col - x) < 15);
        if (existing === undefined) {
            columns.push(x);
        }
    });

    if (columns.length > 4) {
        return [{
            type: "MISALIGNED",
            severity: "LOW",
            title: "No clear column grid",
            description: "Elements do not align to consistent column structure.",
            suggestedFix: "Snap to column grid"
        }];
    }

    return [];
}

function detectFocalPoint(elements: readonly any[]): DesignIssue[] {
    if (elements.length < 2) return [];

    const areas = elements.map(el =>
        (el.width || 100) * (el.height || 100)
    );

    const maxArea = Math.max(...areas);
    const totalArea = areas.reduce((a, b) => a + b, 0);

    const dominanceRatio = maxArea / totalArea;

    if (dominanceRatio < 0.35) {
        return [{
            type: "NO_FOCAL_POINT",
            severity: "MEDIUM",
            title: "Lack of clear focal point",
            description: "No dominant visual element guiding attention.",
            suggestedFix: "Increase size or contrast of primary element"
        }];
    }

    return [];
}

function calculateLayoutScore(issues: DesignIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
        const severityMultiplier: Record<string, number> = {
            HIGH: 2.0,
            MEDIUM: 1.5,
            LOW: 1.0
        };

        const basePenalty = 10;
        score -= basePenalty * severityMultiplier[issue.severity];
    });

    return Math.max(Math.round(score), 30);
}
