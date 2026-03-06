import { isAIEnabled } from "./AIProvider";

// ─── Layout AI Engine ───────────────────────────────────────────────
// Provides intelligent layout rearrangement suggestions.
// Uses rule-based logic + AI data from Firefly when available.

export interface LayoutSuggestion {
    elementId: string;
    action: "move" | "resize" | "reorder";
    description: string;
    confidence: number;
    data?: { x?: number; y?: number; width?: number; height?: number };
}

export async function suggestLayoutImprovements(elements?: any[]): Promise<LayoutSuggestion[]> {
    if (!isAIEnabled() && (!elements || elements.length === 0)) {
        return [{
            elementId: "",
            action: "reorder",
            description: "Connect to Adobe Firefly to get intelligent layout suggestions.",
            confidence: 0
        }];
    }

    const suggestions: LayoutSuggestion[] = [];

    if (elements && elements.length > 0) {
        // Detect elements that could benefit from alignment
        const xPositions = elements.map((el: any) => el.translation?.x || 0);
        const uniqueX = [...new Set(xPositions.map((x: number) => Math.round(x / 20) * 20))];

        if (uniqueX.length > 4) {
            suggestions.push({
                elementId: "",
                action: "move",
                description: `${uniqueX.length} column positions detected. Consolidate to 2-3 columns for cleaner layout.`,
                confidence: 0.85
            });
        }

        // Detect oversized or undersized elements
        elements.forEach((el: any, i: number) => {
            const area = (el.width || 100) * (el.height || 100);
            if (area > 200000) {
                suggestions.push({
                    elementId: el.id || `el-${i}`,
                    action: "resize",
                    description: `Element "${el.name || i}" is very large. Consider reducing size for better balance.`,
                    confidence: 0.7
                });
            }
        });
    }

    return suggestions;
}
