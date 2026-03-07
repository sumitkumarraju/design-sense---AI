import { editor, colorUtils } from "express-document-sdk";
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

const HEATMAP_TAG = "designsense_heatmap";

// Track heatmap overlay IDs for cleanup
let heatmapOverlayIds: string[] = [];

// ─── Draw Heatmap ───────────────────────────────────────────────────

export function drawHeatmap(elements: readonly any[], issues: DesignIssue[]): { overlayCount: number } {
    // Clear existing first
    clearHeatmap();

    let overlayCount = 0;
    if (issues.length === 0 || elements.length === 0) return { overlayCount: 0 };

    const elementIssues = issues.filter(i => i.elementId);
    const globalIssues = issues.filter(i => !i.elementId);

    // Per-element overlays
    elementIssues.forEach(issue => {
        const el = elements.find((e: any) => e.id === issue.elementId);
        if (!el) return;
        if (createOverlay(el, ISSUE_COLORS[issue.type] || "#FF0000")) overlayCount++;
    });

    // Global issue overlays — mark all elements
    if (globalIssues.length > 0) {
        const color = ISSUE_COLORS[globalIssues[0].type] || "#FF0000";
        elements.forEach(el => {
            if (elementIssues.some(i => i.elementId === (el as any).id)) return;
            if (createOverlay(el, color)) overlayCount++;
        });
    }

    return { overlayCount };
}

function createOverlay(el: any, hexColor: string): boolean {
    try {
        const overlay = editor.createRectangle();

        overlay.width = el.width || 100;
        overlay.height = el.height || 40;

        overlay.translation = {
            x: el.translation?.x ?? 0,
            y: el.translation?.y ?? 0
        };

        // Use correct SDK API: editor.makeStroke()
        const strokeColor = colorUtils.fromHex(hexColor);
        overlay.stroke = editor.makeStroke({
            color: strokeColor,
            width: 3
        });

        // Set fill to undefined (transparent) — correct SDK way
        overlay.fill = undefined;

        // Set low opacity so design is visible underneath
        overlay.opacity = 0.8;

        // Tag with addOnData for cleanup
        try {
            overlay.addOnData.setItem(HEATMAP_TAG, "true");
        } catch {
            // If addOnData fails, track by ID
        }

        // Track overlay ID for cleanup
        heatmapOverlayIds.push(overlay.id);

        editor.context.insertionParent.children.append(overlay);
        return true;
    } catch (err) {
        console.error("Heatmap overlay failed:", err);
        return false;
    }
}

// ─── Clear Heatmap ──────────────────────────────────────────────────

export function clearHeatmap(): { removedCount: number } {
    const page = editor.context.insertionParent;
    if (!page) return { removedCount: 0 };

    let removedCount = 0;
    const elements = page.children.toArray();

    // Strategy 1: Remove by tracked IDs
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (heatmapOverlayIds.includes(el.id)) {
            try {
                el.removeFromParent();
                removedCount++;
            } catch { /* skip */ }
        }
    }

    // Strategy 2: Also check addOnData tag
    if (removedCount === 0) {
        const freshElements = page.children.toArray();
        for (let i = freshElements.length - 1; i >= 0; i--) {
            const el = freshElements[i];
            try {
                const tag = el.addOnData?.getItem(HEATMAP_TAG);
                if (tag === "true") {
                    el.removeFromParent();
                    removedCount++;
                }
            } catch { /* skip non-taggable elements */ }
        }
    }

    // Reset tracking
    heatmapOverlayIds = [];

    return { removedCount };
}
