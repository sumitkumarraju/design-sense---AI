export interface WCAGTag {
    level: "A" | "AA" | "AAA";
    criterion: string;
}

export interface EnhancedIssue {
    type: string;
    severity: "CRITICAL" | "WARNING";
    wcag: WCAGTag;
}

export interface PageScore {
    pageIndex: number;
    score: number;
    criticalIssues: number;
    warnings: number;
}

export interface AccessibilityScoreResult {
    overallScore: number;
    grade: "A" | "B" | "C" | "D" | "F";
    pageScores: PageScore[];
    totalCritical: number;
    totalWarnings: number;
    wcagBreakdown: {
        A: number;
        AA: number;
        AAA: number;
    };
}
