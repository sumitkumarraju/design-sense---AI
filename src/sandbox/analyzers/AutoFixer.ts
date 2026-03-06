import { editor, colorUtils } from "express-document-sdk";

// ─── AutoFixer — Central Fix Dispatcher ─────────────────────────────
// Routes fix requests to the appropriate modular fixer.
// All @ts-ignore removed — uses proper (el as any) casting.

import { fixAlignment, fixVerticalAlignment } from "../actions/AlignmentFixer";
import { fixSpacing, fixHorizontalSpacing } from "../actions/SpacingFixer";
import { fixContrast, fixColorPalette } from "../actions/ColorFixer";
import { fixTypography, fixFontFamilies } from "../actions/TypographyFixer";

export function applyFix(issueType: string): { success: boolean; message: string } {
    try {
        switch (issueType) {
            case "MISALIGNED":
                return fixAlignment();
            case "POOR_SPACING":
            case "SPACING_IMBALANCE":
                return fixSpacing();
            case "LOW_CONTRAST":
            case "AAA_CONTRAST_FAIL":
                return fixContrast();
            case "TOO_MANY_COLORS":
                return fixColorPalette();
            case "NO_FOCAL_POINT":
            case "WEAK_HIERARCHY":
                return fixTypography();
            case "fixAlignment":
                return fixAlignment();
            case "fixSpacing":
                return fixSpacing();
            case "fixContrast":
                return fixContrast();
            case "fixColorPalette":
                return fixColorPalette();
            case "fixTypography":
                return fixTypography();
            case "fixFontFamilies":
                return fixFontFamilies();
            case "fixVerticalAlignment":
                return fixVerticalAlignment();
            case "fixHorizontalSpacing":
                return fixHorizontalSpacing();
            default:
                return { success: false, message: "Unknown issue type: " + issueType };
        }
    } catch (err: any) {
        return { success: false, message: err.message || "Fix failed" };
    }
}
