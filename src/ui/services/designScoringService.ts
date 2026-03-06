import { DesignIssue, DesignAnalysisResult } from "../models/DesignAnalysisResult";

// ─── Weight Configuration ───────────────────────────────────────────
export interface ScoringWeights {
    layout: number;
    color: number;
    typography: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
    layout: 0.40,
    color: 0.30,
    typography: 0.30
};

// ─── Grade Thresholds ───────────────────────────────────────────────
interface GradeThreshold {
    min: number;
    label: "Good" | "Fair" | "Needs Improvement";
}

const GRADE_THRESHOLDS: GradeThreshold[] = [
    { min: 80, label: "Good" },
    { min: 60, label: "Fair" },
    { min: 0, label: "Needs Improvement" }
];

// ─── Per-Issue Severity Penalties ───────────────────────────────────
const SEVERITY_PENALTY: Record<string, number> = {
    HIGH: 20,
    MEDIUM: 12,
    LOW: 5
};

// ─── Main Scoring Engine ────────────────────────────────────────────

export function computeDesignScore(
    layoutResult: { score: number; issues: DesignIssue[] },
    colorResult: { score: number; issues: DesignIssue[] },
    typoResult: { score: number; issues: DesignIssue[] },
    weights: ScoringWeights = DEFAULT_WEIGHTS
): DesignAnalysisResult {
    // Recalculate per-category scores from issues for accuracy
    const layoutScore = computeCategoryScore(layoutResult.issues);
    const colorScore = computeCategoryScore(colorResult.issues);
    const typoScore = computeCategoryScore(typoResult.issues);

    // Weighted average
    const overallScore = Math.round(
        layoutScore * weights.layout +
        colorScore * weights.color +
        typoScore * weights.typography
    );

    const grade = determineGrade(overallScore);

    // Build checklist from issue presence
    const checklist = buildChecklist(layoutResult.issues, colorResult.issues, typoResult.issues);

    return {
        overallScore,
        grade,
        layoutScore,
        colorScore,
        typographyScore: typoScore,
        issues: {
            layout: layoutResult.issues,
            color: colorResult.issues,
            typography: typoResult.issues
        },
        checklist
    };
}

// ─── Category Score Calculator ──────────────────────────────────────

export function computeCategoryScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        score -= SEVERITY_PENALTY[issue.severity] || 10;
    });
    return Math.max(Math.round(score), 0);
}

// ─── Grade Determination ────────────────────────────────────────────

export function determineGrade(score: number): "Good" | "Fair" | "Needs Improvement" {
    for (const threshold of GRADE_THRESHOLDS) {
        if (score >= threshold.min) return threshold.label;
    }
    return "Needs Improvement";
}

// ─── Checklist Builder ──────────────────────────────────────────────

function buildChecklist(
    layoutIssues: DesignIssue[],
    colorIssues: DesignIssue[],
    typoIssues: DesignIssue[]
): { label: string; passed: boolean }[] {
    const hasType = (issues: DesignIssue[], types: string[]) =>
        issues.some(i => types.includes(i.type));

    return [
        {
            label: "Alignment Consistency",
            passed: !hasType(layoutIssues, ["MISALIGNED"])
        },
        {
            label: "Spacing Balance",
            passed: !hasType(layoutIssues, ["POOR_SPACING"])
        },
        {
            label: "Visual Hierarchy",
            passed: !hasType(typoIssues, ["NO_FOCAL_POINT"])
        },
        {
            label: "Color Contrast",
            passed: !hasType(colorIssues, ["LOW_CONTRAST"])
        },
        {
            label: "Brand Palette Usage",
            passed: !hasType(colorIssues, ["TOO_MANY_COLORS"])
        }
    ];
}
