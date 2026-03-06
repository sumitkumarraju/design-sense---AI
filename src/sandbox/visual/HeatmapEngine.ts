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

export function drawHeatmap(elements: readonly any[], issues: DesignIssue[]): { overlayCount: number } {
    // Clear any existing heatmap first
    clearHeatmap();

    let overlayCount = 0;

    // Draw per-element overlays for issues with elementId
    issues.forEach(issue => {
        if (!issue.elementId) return;

        const el = elements.find((e: any) => e.id === issue.elementId);
        if (!el) return;

        const hexColor = ISSUE_COLORS[issue.type] || "#FF0000";

        try {
            const overlay = editor.createRectangle();

            overlay.width = el.width || (el as any).boundsInParent?.width || 100;
            overlay.height = el.height || (el as any).boundsInParent?.height || 100;

            // Stroke-only overlay
            (overlay as any).fill = null;
            (overlay as any).stroke = {
                type: constants.StrokeType.color,
                color: colorUtils.fromHex(hexColor),
                width: 3,
                dashPattern: [],
                dashOffset: 0,
                position: constants.StrokePosition.center
            };

            overlay.translation = {
                x: (el as any).boundsInParent?.x ?? el.translation.x,
                y: (el as any).boundsInParent?.y ?? el.translation.y
            };

            (overlay as any).name = HEATMAP_TAG;

            editor.context.insertionParent.children.append(overlay);
            overlayCount++;
        } catch { /* skip */ }
    });

    // Draw region badges for issues without elementId
    const regionIssues = issues.filter(i => !i.elementId);
    if (regionIssues.length > 0) {
        regionIssues.forEach((issue, idx) => {
            const hexColor = ISSUE_COLORS[issue.type] || "#FF0000";
            try {
                const badge = editor.createRectangle();
                badge.width = 20;
                badge.height = 20;

                (badge as any).fill = colorUtils.fromHex(hexColor);
                badge.translation = { x: 5, y: 5 + idx * 25 };
                (badge as any).name = HEATMAP_TAG;

                editor.context.insertionParent.children.append(badge);
                overlayCount++;
            } catch { /* skip */ }
        });
    }

    return { overlayCount };
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
