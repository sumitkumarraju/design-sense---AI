// ─── Report Service ─────────────────────────────────────────────────
// Generates downloadable JSON design reports.

import { DesignIssue } from "../models/DesignAnalysisResult";

export interface DesignReport {
    generatedAt: string;
    platform: string;
    overallScore: number;
    grade: string;
    categories: {
        name: string;
        score: number;
        issueCount: number;
    }[];
    issues: {
        category: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        suggestedFix?: string;
    }[];
    wcagCompliance: {
        aa: boolean;
        aaa: boolean;
        contrastIssues: number;
    };
    summary: string;
}

export function generateReport(data: {
    overallScore: number;
    grade: string;
    categories: Record<string, number>;
    issues: Record<string, DesignIssue[]>;
}): DesignReport {
    const allIssues: DesignReport["issues"] = [];

    Object.entries(data.issues).forEach(([category, issues]) => {
        issues.forEach(issue => {
            allIssues.push({
                category,
                type: issue.type,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                suggestedFix: issue.suggestedFix
            });
        });
    });

    const contrastIssues = allIssues.filter(
        i => i.type === "LOW_CONTRAST" || i.type === "AAA_CONTRAST_FAIL"
    );

    const categoryList = Object.entries(data.categories).map(([name, score]) => ({
        name,
        score,
        issueCount: (data.issues[name] || []).length
    }));

    const criticalCount = allIssues.filter(i => i.severity === "HIGH").length;

    return {
        generatedAt: new Date().toISOString(),
        platform: "DesignSense AI",
        overallScore: data.overallScore,
        grade: data.grade,
        categories: categoryList,
        issues: allIssues,
        wcagCompliance: {
            aa: contrastIssues.filter(i => i.type === "LOW_CONTRAST").length === 0,
            aaa: contrastIssues.length === 0,
            contrastIssues: contrastIssues.length
        },
        summary: generateSummaryText(data.overallScore, data.grade, allIssues.length, criticalCount)
    };
}

function generateSummaryText(score: number, grade: string, total: number, critical: number): string {
    if (score >= 90) {
        return `Excellent design quality (Grade ${grade}). ${total} minor suggestions found.`;
    }
    if (score >= 75) {
        return `Good design quality (Grade ${grade}). ${total} issues found, ${critical} critical. Review recommended fixes.`;
    }
    if (score >= 60) {
        return `Fair design quality (Grade ${grade}). ${total} issues found, ${critical} critical. Significant improvements recommended.`;
    }
    return `Design needs improvement (Grade ${grade}). ${total} issues found, ${critical} critical. Immediate attention required.`;
}

export function downloadReport(report: DesignReport): void {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `DesignSense_Report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
