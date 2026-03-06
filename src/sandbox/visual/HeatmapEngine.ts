import { editor, colorUtils, constants } from "express-document-sdk";
import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Heatmap Color Mapping ──────────────────────────────────────────

const ISSUE_COLORS: Record<string, string> = {
    MISALIGNED: "#FF0000",         // 🔴 Red — alignment
    POOR_SPACING: "#FFA500",       // 🟠 Orange — spacing
    SPACING_IMBALANCE: "#FFA500",  // 🟠 Orange — spacing
    LOW_CONTRAST: "#800080",       // 🟣 Purple — contrast
    AAA_CONTRAST_FAIL: "#800080",  // 🟣 Purple — contrast
    NO_FOCAL_POINT: "#0000FF",     // 🔵 Blue — typography/hierarchy
    WEAK_HIERARCHY: "#0000FF",     // 🔵 Blue — hierarchy
    TOO_MANY_COLORS: "#FFD700",    // 🟡 Gold — color
    OVERLAP: "#FF4444",            // Red variant
    EDGE_PROXIMITY: "#FF6600"      // Dark orange
};

const HEATMAP_TAG = "__designsense_heatmap__";

// ─── Draw Heatmap ───────────────────────────────────────────────────

export function drawHeatmap(elements: readonly any[], issues: DesignIssue[]): { overlayCount: number } {
    let overlayCount = 0;

    issues.forEach(issue => {
        if (!issue.elementId) return;

        const el = elements.find((e: any) => e.id === issue.elementId);
        if (!el) return;

        const hexColor = ISSUE_COLORS[issue.type] || "#FF0000";

        try {
            const overlay = editor.createRectangle();

            overlay.width = el.width || el.boundsInParent?.width || 100;
            overlay.height = el.height || el.boundsInParent?.height || 100;

            // Stroke-only overlay (no fill)
            // @ts-ignore
            overlay.fill = null;

            // @ts-ignore
            overlay.stroke = {
                type: constants.StrokeType.color,
                color: colorUtils.fromHex(hexColor),
                width: 3,
                dashPattern: [],
                dashOffset: 0,
                position: constants.StrokePosition.center
            };

            overlay.translation = {
                x: el.boundsInParent?.x ?? el.translation.x,
                y: el.boundsInParent?.y ?? el.translation.y
            };

            // Tag overlay for later removal
            // @ts-ignore - name exists at runtime
            overlay.name = HEATMAP_TAG;

            editor.context.insertionParent.children.append(overlay);
            overlayCount++;
        } catch { /* skip elements that can't be overlaid */ }
    });

    // Also draw region-level heatmap for issues without elementId
    const regionIssues = issues.filter(i => !i.elementId);
    if (regionIssues.length > 0 && elements.length > 0) {
        regionIssues.forEach(issue => {
            const hexColor = ISSUE_COLORS[issue.type] || "#FF0000";
            try {
                // Draw a small indicator badge at top-left
                const badge = editor.createRectangle();
                badge.width = 20;
                badge.height = 20;

                // @ts-ignore
                badge.fill = colorUtils.fromHex(hexColor);
                badge.translation = { x: 5, y: 5 + overlayCount * 25 };
                // @ts-ignore - name exists at runtime
                badge.name = HEATMAP_TAG;

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

    // Remove in reverse order to avoid index shifting
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        // @ts-ignore - name exists at runtime
        if (el.name === HEATMAP_TAG) {
            try {
                el.removeFromParent();
                removedCount++;
            } catch { /* skip */ }
        }
    }

    return { removedCount };
}
