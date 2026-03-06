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
    suggestedFix?: string; // e.g., "Align at 120px"
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
