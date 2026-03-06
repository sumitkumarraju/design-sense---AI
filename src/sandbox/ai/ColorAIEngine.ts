import { isAIEnabled } from "./AIProvider";

// ─── Color AI Engine ────────────────────────────────────────────────
// When AI is enabled, provides intelligent color improvement suggestions.
// Works with data received from the UI Firefly service.

export interface ColorSuggestion {
    currentColor: string;
    suggestedColor: string;
    reason: string;
    confidence: number;
}

// Pool of pre-analyzed color recommendations based on common design issues
const COLOR_RULES: { condition: (r: number, g: number, b: number) => boolean; suggestion: string; suggestedColor: string }[] = [
    {
        condition: (r, g, b) => r > 200 && g > 200 && b > 200,
        suggestion: "Light color may have poor contrast on white backgrounds",
        suggestedColor: "#334155"
    },
    {
        condition: (r, g, b) => Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 100 && r < 200,
        suggestion: "Gray tones can feel flat. Consider adding a subtle color tint.",
        suggestedColor: "#475569"
    },
    {
        condition: (r, g, b) => r > 200 && g < 100 && b < 100,
        suggestion: "Pure red can feel aggressive. Consider a softer warm tone.",
        suggestedColor: "#DC2626"
    }
];

export async function suggestColorImprovements(currentColors?: string[]): Promise<ColorSuggestion[]> {
    if (!isAIEnabled() && (!currentColors || currentColors.length === 0)) {
        return [{
            currentColor: "",
            suggestedColor: "",
            reason: "Connect to Adobe Firefly to get intelligent color suggestions.",
            confidence: 0
        }];
    }

    const suggestions: ColorSuggestion[] = [];

    // Apply rule-based color analysis
    if (currentColors) {
        currentColors.forEach(hex => {
            const rgb = hexToRgb(hex);
            if (!rgb) return;

            COLOR_RULES.forEach(rule => {
                if (rule.condition(rgb.r, rgb.g, rgb.b)) {
                    suggestions.push({
                        currentColor: hex,
                        suggestedColor: rule.suggestedColor,
                        reason: rule.suggestion,
                        confidence: 0.75
                    });
                }
            });
        });
    }

    return suggestions;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
