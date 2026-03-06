import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

// ─── Analyzers ──────────────────────────────────────────────────────
import { analyzeLayout } from "./analyzers/LayoutAnalyzer";
import { analyzeColors } from "./analyzers/ColorAnalyzer";
import { analyzeTypography } from "./analyzers/TypographyAnalyzer";
import { analyzeSpacing } from "./analyzers/SpacingAnalyzer";
import { analyzeHierarchy } from "./analyzers/HierarchyAnalyzer";
import { analyzeContrast } from "./analyzers/ContrastAnalyzer";

// ─── Actions ────────────────────────────────────────────────────────
import { applyFix } from "./analyzers/AutoFixer";
import { fixAlignment } from "./actions/AlignmentFixer";
import { fixSpacing as fixSpacingAction } from "./actions/SpacingFixer";
import { fixContrast as fixContrastAction, fixColorPalette } from "./actions/ColorFixer";
import { fixTypography, fixFontFamilies } from "./actions/TypographyFixer";

// ─── Scoring ────────────────────────────────────────────────────────
import { calculateFullScore } from "./scoring/ScoreCalculator";

// ─── Heatmap ────────────────────────────────────────────────────────
import { drawHeatmap, clearHeatmap } from "./visual/HeatmapEngine";

const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    runtime.exposeApi({
        // ─── Legacy API (preserved for compatibility) ───────────
        analyzeLayout: () => analyzeLayout(),
        analyzeColors: () => analyzeColors(),
        analyzeTypography: () => analyzeTypography(),
        applyFix: (issueType: string) => applyFix(issueType),

        // ─── New Analyzers ──────────────────────────────────────
        analyzeSpacing: () => analyzeSpacing(),
        analyzeHierarchy: () => analyzeHierarchy(),
        analyzeContrast: () => analyzeContrast(),

        // ─── Full Platform Analysis ─────────────────────────────
        runFullAnalysis: () => {
            const layout = analyzeLayout();
            const color = analyzeColors();
            const contrast = analyzeContrast();
            const typography = analyzeTypography();
            const spacing = analyzeSpacing();
            const hierarchy = analyzeHierarchy();

            const scoreResult = calculateFullScore({
                layout, color, contrast, typography, spacing, hierarchy
            });

            return {
                ...scoreResult,
                issues: {
                    layout: layout.issues,
                    color: color.issues,
                    contrast: contrast.issues,
                    typography: typography.issues,
                    spacing: spacing.issues,
                    hierarchy: hierarchy.issues
                }
            };
        },

        // ─── Modular Fixers ─────────────────────────────────────
        fixAlignment: () => fixAlignment(),
        fixSpacing: () => fixSpacingAction(),
        fixContrast: () => fixContrastAction(),
        fixColorPalette: () => fixColorPalette(),
        fixTypography: () => fixTypography(),
        fixFontFamilies: () => fixFontFamilies(),

        // ─── Heatmap ────────────────────────────────────────────
        showHeatmap: () => {
            const page = editor.context.insertionParent;
            if (!page) return { overlayCount: 0 };

            const elements = page.children.toArray();

            // Collect all issues from all analyzers
            const allIssues = [
                ...analyzeLayout().issues,
                ...analyzeColors().issues,
                ...analyzeContrast().issues,
                ...analyzeTypography().issues,
                ...analyzeSpacing().issues,
                ...analyzeHierarchy().issues
            ];

            return drawHeatmap(elements, allIssues);
        },

        clearHeatmap: () => clearHeatmap()
    });
}

start();
