// ─── Severity Weights Configuration ─────────────────────────────────

export const SEVERITY_WEIGHTS: Record<string, number> = {
    HIGH: -20,
    MEDIUM: -15,
    LOW: -5
};

export const CATEGORY_WEIGHTS: Record<string, number> = {
    layout: 0.20,
    color: 0.15,
    contrast: 0.20,
    typography: 0.15,
    spacing: 0.15,
    hierarchy: 0.15
};

export const GRADE_THRESHOLDS: { min: number; grade: string }[] = [
    { min: 90, grade: "A" },
    { min: 80, grade: "B" },
    { min: 65, grade: "C" },
    { min: 50, grade: "D" },
    { min: 0, grade: "F" }
];
