// ─── AI Configuration ───────────────────────────────────────────────
// Central config for AI provider settings.

export interface AIConfigType {
    enabled: boolean;
    provider: "firefly" | "openai" | "anthropic" | "gemini" | "none";
    firefly: {
        clientId: string;
        clientSecret: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    maxTokens: number;
    temperature: number;
}

export const AI_CONFIG: AIConfigType = {
    enabled: false,
    provider: "none",
    firefly: {
        clientId: "",
        clientSecret: ""
    },
    openai: {
        apiKey: "",
        model: "gpt-4"
    },
    maxTokens: 1024,
    temperature: 0.7
};
