import { DesignIssue, PlatformAnalysisResult } from "../sandbox/models/DesignAnalysisResult";

// This interface declares all the APIs that the document sandbox runtime (code.ts) exposes to the UI/iframe runtime

export interface DocumentSandboxApi {
    // Legacy
    analyzeLayout(): Promise<{ score: number; issues: DesignIssue[] }>;
    analyzeColors(): Promise<{ score: number; issues: DesignIssue[] }>;
    analyzeTypography(): Promise<{ score: number; issues: DesignIssue[] }>;
    applyFix(issueType: string): Promise<{ success: boolean; message: string }>;

    // New Analyzers
    analyzeSpacing(): Promise<{ score: number; issues: DesignIssue[] }>;
    analyzeHierarchy(): Promise<{ score: number; issues: DesignIssue[] }>;
    analyzeContrast(): Promise<{ score: number; issues: DesignIssue[] }>;

    // Full Platform Analysis
    runFullAnalysis(): Promise<PlatformAnalysisResult>;

    // Modular Fixers
    fixAlignment(): Promise<{ success: boolean; message: string }>;
    fixSpacing(): Promise<{ success: boolean; message: string }>;
    fixContrast(): Promise<{ success: boolean; message: string }>;
    fixColorPalette(): Promise<{ success: boolean; message: string }>;
    fixTypography(): Promise<{ success: boolean; message: string }>;
    fixFontFamilies(): Promise<{ success: boolean; message: string }>;

    // Heatmap
    showHeatmap(): Promise<{ overlayCount: number }>;
    clearHeatmap(): Promise<{ removedCount: number }>;
}
