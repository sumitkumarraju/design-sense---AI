// ─── AI Configuration ───────────────────────────────────────────────
// Central config for AI provider settings.
// Set enabled: true and provide an API key to activate AI features.

export const AI_CONFIG = {
    enabled: false,
    provider: "none" as "openai" | "anthropic" | "gemini" | "none",
    apiKey: "",
    model: "",
    maxTokens: 1024,
    temperature: 0.7
};
