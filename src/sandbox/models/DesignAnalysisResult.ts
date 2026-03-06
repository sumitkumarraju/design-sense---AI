export interface DesignIssue {
    type:
    | "MISALIGNED"
    | "POOR_SPACING"
    | "LOW_CONTRAST"
    | "TOO_MANY_COLORS"
    | "NO_FOCAL_POINT"
    | "OVERLAP"
    | "EDGE_PROXIMITY"
    | "SPACING_IMBALANCE"
    | "WEAK_HIERARCHY"
    | "AAA_CONTRAST_FAIL";
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    elementId?: string;
    suggestedFix?: string;
}

export interface DesignScoreData {
    overallScore: number;
    grade: "Good" | "Fair" | "Needs Improvement";
    layoutScore: number;
    colorScore: number;
    typographyScore: number;
}

export interface DesignAnalysisResult extends DesignScoreData {
    issues: {
        layout: DesignIssue[];
        typography: DesignIssue[];
        color: DesignIssue[];
    };
    checklist: {
        label: string;
        passed: boolean;
    }[];
    suggestions?: {
        category: string;
        priority: string;
        title: string;
        description: string;
        actionText: string;
        impact: string;
    }[];
    summary?: string;
}

// ─── Platform-Level Types (6-Category Scoring) ──────────────────────

export interface PlatformAnalysisResult {
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
    issues: {
        layout: DesignIssue[];
        color: DesignIssue[];
        contrast: DesignIssue[];
        typography: DesignIssue[];
        spacing: DesignIssue[];
        hierarchy: DesignIssue[];
    };
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
}
