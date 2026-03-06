import { isAIEnabled } from "./AIProvider";

// ─── Typography AI Engine ───────────────────────────────────────────
// Provides intelligent typography and font pairing suggestions.

export interface TypographySuggestion {
    elementId: string;
    suggestedFont: string;
    suggestedSize: number;
    reason: string;
    confidence: number;
}

// Curated font pairings (heading + body)
const FONT_PAIRINGS: { heading: string; body: string; style: string }[] = [
    { heading: "Montserrat", body: "Open Sans", style: "Modern & Clean" },
    { heading: "Playfair Display", body: "Source Sans Pro", style: "Elegant & Editorial" },
    { heading: "Roboto Slab", body: "Roboto", style: "Technical & Professional" },
    { heading: "Lora", body: "Merriweather", style: "Classic & Readable" },
    { heading: "Poppins", body: "Inter", style: "Contemporary & Friendly" }
];

// Modular type scale (1.25 ratio)
const TYPE_SCALE = [48, 38, 30, 24, 20, 16, 14, 12];

export async function suggestTypographyImprovements(textElements?: any[]): Promise<TypographySuggestion[]> {
    if (!isAIEnabled() && (!textElements || textElements.length === 0)) {
        return [{
            elementId: "",
            suggestedFont: "",
            suggestedSize: 0,
            reason: "Connect to Adobe Firefly to get intelligent typography suggestions.",
            confidence: 0
        }];
    }

    const suggestions: TypographySuggestion[] = [];

    if (textElements && textElements.length > 0) {
        // Collect current font sizes
        const sizes = textElements.map((el: any) => el.fontSize || 16);
        const uniqueSizes = [...new Set(sizes)].sort((a, b) => b - a);

        // Suggest modular scale if sizes are irregular
        if (uniqueSizes.length > 2) {
            const isOnScale = uniqueSizes.every(s =>
                TYPE_SCALE.some(ts => Math.abs(s - ts) < 3)
            );

            if (!isOnScale) {
                textElements.forEach((el: any, i: number) => {
                    const scaleIndex = Math.min(i, TYPE_SCALE.length - 1);
                    suggestions.push({
                        elementId: el.id || `text-${i}`,
                        suggestedFont: "",
                        suggestedSize: TYPE_SCALE[scaleIndex],
                        reason: `Apply ${TYPE_SCALE[scaleIndex]}px from 1.25× modular scale for consistent hierarchy.`,
                        confidence: 0.8
                    });
                });
            }
        }

        // Suggest font pairing
        const families = textElements.map((el: any) => el.fontFamily || "Unknown");
        const uniqueFamilies = [...new Set(families)];

        if (uniqueFamilies.length > 3 || (uniqueFamilies.length === 1 && uniqueFamilies[0] === "Unknown")) {
            const pairing = FONT_PAIRINGS[Math.floor(Math.random() * FONT_PAIRINGS.length)];
            suggestions.push({
                elementId: "",
                suggestedFont: `${pairing.heading} + ${pairing.body}`,
                suggestedSize: 0,
                reason: `Consider "${pairing.style}" font pairing: ${pairing.heading} for headings, ${pairing.body} for body text.`,
                confidence: 0.7
            });
        }
    }

    return suggestions;
}
