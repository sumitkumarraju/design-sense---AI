// ─── AI Provider Configuration ──────────────────────────────────────
// Stub module for future AI integration. No actual API calls are made.

export interface AIConfig {
    provider: "openai" | "anthropic" | "gemini" | "none";
    apiKey: string;
    model: string;
    enabled: boolean;
}

const defaultConfig: AIConfig = {
    provider: "none",
    apiKey: "",
    model: "",
    enabled: false
};

let currentConfig: AIConfig = { ...defaultConfig };

export function configureAI(config: Partial<AIConfig>): void {
    currentConfig = { ...currentConfig, ...config };
}

export function getAIConfig(): AIConfig {
    return { ...currentConfig };
}

export function isAIEnabled(): boolean {
    return currentConfig.enabled && currentConfig.apiKey.length > 0;
}
