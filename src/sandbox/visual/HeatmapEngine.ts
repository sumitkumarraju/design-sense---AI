import { editor, colorUtils, constants } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Heatmap Color Mapping ──────────────────────────────────────────

const ISSUE_COLORS: Record<string, string> = {
    MISALIGNED: "#FF0000",
    POOR_SPACING: "#FFA500",
    SPACING_IMBALANCE: "#FFA500",
    LOW_CONTRAST: "#800080",
    AAA_CONTRAST_FAIL: "#800080",
    NO_FOCAL_POINT: "#0000FF",
    WEAK_HIERARCHY: "#0000FF",
    TOO_MANY_COLORS: "#FFD700",
    OVERLAP: "#FF4444",
    EDGE_PROXIMITY: "#FF6600"
};

const HEATMAP_TAG = "__designsense_heatmap__";

// ─── Draw Heatmap ───────────────────────────────────────────────────
// If issues have elementId → draw stroke over that element.
// If no elementId → draw overlays over ALL elements using the issue color.
// This ensures the heatmap is always visible.

export function drawHeatmap(elements: readonly any[], issues: DesignIssue[]): { overlayCount: number } {
    // Clear existing heatmap first
    clearHeatmap();

    let overlayCount = 0;
    if (issues.length === 0 || elements.length === 0) return { overlayCount: 0 };

    // Separate issues with and without elementId
    const elementIssues = issues.filter(i => i.elementId);
    const globalIssues = issues.filter(i => !i.elementId);

    // Draw per-element overlays
    elementIssues.forEach(issue => {
        const el = elements.find((e: any) => e.id === issue.elementId);
        if (!el) return;
        if (drawOverlay(el, ISSUE_COLORS[issue.type] || "#FF0000")) overlayCount++;
    });

    // For global issues (no elementId), highlight ALL elements with colored strokes
    if (globalIssues.length > 0) {
        // Pick the most severe issue's color
        const primaryColor = ISSUE_COLORS[globalIssues[0].type] || "#FF0000";

        elements.forEach(el => {
            // Skip elements we already overlaid
            if (elementIssues.some(i => i.elementId === (el as any).id)) return;
            if (drawOverlay(el, primaryColor)) overlayCount++;
        });
    }

    return { overlayCount };
}

function drawOverlay(el: any, hexColor: string): boolean {
    try {
        const overlay = editor.createRectangle();

        const w = el.width || 100;
        const h = el.height || 50;

        overlay.width = w;
        overlay.height = h;

        // Position at the element's location
        overlay.translation = {
            x: el.translation?.x ?? 0,
            y: el.translation?.y ?? 0
        };

        // Set stroke color (visible border around element)
        try {
            (overlay as any).stroke = {
                type: constants.StrokeType.color,
                color: colorUtils.fromHex(hexColor),
                width: 3,
                dashPattern: [],
                dashOffset: 0,
                position: constants.StrokePosition.center
            };
        } catch {
            // Fallback: set fill instead of stroke
            try {
                (overlay as any).fill = colorUtils.fromHex(hexColor);
                (overlay as any).opacity = 0.3;
            } catch { /* skip */ }
        }

        // Try to make it transparent fill
        try {
            (overlay as any).fill = null;
        } catch { /* some SDKs don't support null fill */ }

        // Tag for cleanup
        (overlay as any).name = HEATMAP_TAG;

        editor.context.insertionParent.children.append(overlay);
        return true;
    } catch {
        return false;
    }
}

// ─── Clear Heatmap ──────────────────────────────────────────────────

export function clearHeatmap(): { removedCount: number } {
    const page = editor.context.insertionParent;
    if (!page) return { removedCount: 0 };

    const elements = page.children.toArray();
    let removedCount = 0;

    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if ((el as any).name === HEATMAP_TAG) {
            try {
                el.removeFromParent();
                removedCount++;
            } catch { /* skip */ }
        }
    }

    return { removedCount };
}
