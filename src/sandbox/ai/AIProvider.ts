// ─── AI Provider Configuration ──────────────────────────────────────
// Supports Adobe Firefly as the primary AI provider.

export interface AIConfig {
    provider: "firefly" | "openai" | "anthropic" | "gemini" | "none";
    apiKey: string;
    clientId: string;
    clientSecret: string;
    accessToken: string;
    model: string;
    enabled: boolean;
}

const defaultConfig: AIConfig = {
    provider: "none",
    apiKey: "",
    clientId: "",
    clientSecret: "",
    accessToken: "",
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
    return currentConfig.enabled && (
        currentConfig.accessToken.length > 0 ||
        currentConfig.apiKey.length > 0
    );
}

export function setAccessToken(token: string): void {
    currentConfig.accessToken = token;
    currentConfig.enabled = token.length > 0;
}
