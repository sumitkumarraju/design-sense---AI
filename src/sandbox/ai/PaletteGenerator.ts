import { isAIEnabled } from "./AIProvider";

// ─── Palette Generator (Stub) ───────────────────────────────────────

export interface GeneratedPalette {
    name: string;
    colors: string[];
    style: "vibrant" | "muted" | "monochrome" | "complementary";
    confidence: number;
}

export async function generatePalette(baseColor?: string): Promise<GeneratedPalette[]> {
    if (!isAIEnabled()) {
        // Return a default harmonious palette as fallback
        return [{
            name: "Default Harmony",
            colors: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"],
            style: "monochrome",
            confidence: 0.5
        }];
    }

    // TODO: Implement AI-powered palette generation
    return [];
}
