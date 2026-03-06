import { DesignIssue } from "../models/DesignAnalysisResult";
import { SEVERITY_WEIGHTS, CATEGORY_WEIGHTS, GRADE_THRESHOLDS } from "./SeverityWeights";

// ─── Types ──────────────────────────────────────────────────────────

export interface CategoryResult {
    score: number;
    issues: DesignIssue[];
}

export interface PlatformScoreResult {
    overallScore: number;
    grade: string;
    categories: {
        layout: number;
        color: number;
        contrast: number;
        typography: number;
        spacing: number;
        hierarchy: number;
    };
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
}

// ─── Main Score Calculator ──────────────────────────────────────────

export function calculateFullScore(results: {
    layout: CategoryResult;
    color: CategoryResult;
    contrast: CategoryResult;
    typography: CategoryResult;
    spacing: CategoryResult;
    hierarchy: CategoryResult;
}): PlatformScoreResult {
    const categoryScores = {
        layout: computeCategoryScore(results.layout.issues),
        color: computeCategoryScore(results.color.issues),
        contrast: computeCategoryScore(results.contrast.issues),
        typography: computeCategoryScore(results.typography.issues),
        spacing: computeCategoryScore(results.spacing.issues),
        hierarchy: computeCategoryScore(results.hierarchy.issues)
    };

    const overallScore = Math.round(
        categoryScores.layout * CATEGORY_WEIGHTS.layout +
        categoryScores.color * CATEGORY_WEIGHTS.color +
        categoryScores.contrast * CATEGORY_WEIGHTS.contrast +
        categoryScores.typography * CATEGORY_WEIGHTS.typography +
        categoryScores.spacing * CATEGORY_WEIGHTS.spacing +
        categoryScores.hierarchy * CATEGORY_WEIGHTS.hierarchy
    );

    const allIssues = [
        ...results.layout.issues,
        ...results.color.issues,
        ...results.contrast.issues,
        ...results.typography.issues,
        ...results.spacing.issues,
        ...results.hierarchy.issues
    ];

    return {
        overallScore,
        grade: determineGrade(overallScore),
        categories: categoryScores,
        totalIssues: allIssues.length,
        criticalCount: allIssues.filter(i => i.severity === "HIGH").length,
        warningCount: allIssues.filter(i => i.severity === "MEDIUM").length,
        infoCount: allIssues.filter(i => i.severity === "LOW").length
    };
}

// ─── Per-Category Score ─────────────────────────────────────────────

function computeCategoryScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        score += SEVERITY_WEIGHTS[issue.severity] || -10;
    });
    return Math.max(Math.round(score), 0);
}

// ─── Grade ──────────────────────────────────────────────────────────

function determineGrade(score: number): string {
    for (const threshold of GRADE_THRESHOLDS) {
        if (score >= threshold.min) return threshold.grade;
    }
    return "F";
}
