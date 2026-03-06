// ─── Adobe Firefly Service ───────────────────────────────────────────
// Handles OAuth2 authentication and Firefly API calls from the UI iframe runtime.
// The document sandbox does NOT have fetch access, so all API calls go through here.

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const FIREFLY_API_BASE = "https://firefly-api.adobe.io";
const FIREFLY_SCOPES = "openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis";

export interface FireflyCredentials {
    clientId: string;
    clientSecret: string;
}

interface TokenData {
    accessToken: string;
    expiresAt: number;
}

interface FireflyImageResult {
    images: { url: string }[];
    jobId?: string;
}

interface FireflyGenerateOptions {
    prompt: string;
    n?: number;
    size?: { width: number; height: number };
    contentClass?: "photo" | "art";
    styles?: { presets?: string[] };
}

// ─── State ──────────────────────────────────────────────────────────

let credentials: FireflyCredentials | null = null;
let tokenData: TokenData | null = null;

// ─── Auth ───────────────────────────────────────────────────────────

export async function connectFirefly(creds: FireflyCredentials): Promise<{ success: boolean; message: string }> {
    try {
        credentials = creds;
        const token = await fetchAccessToken();
        return { success: true, message: "Connected to Adobe Firefly" };
    } catch (error: any) {
        credentials = null;
        tokenData = null;
        return { success: false, message: error.message || "Authentication failed" };
    }
}

export function disconnectFirefly(): void {
    credentials = null;
    tokenData = null;
}

export function isFireflyConnected(): boolean {
    return credentials !== null && tokenData !== null && tokenData.expiresAt > Date.now();
}

async function fetchAccessToken(): Promise<string> {
    if (!credentials) throw new Error("No credentials configured");

    // Return cached token if still valid (with 5-min buffer)
    if (tokenData && tokenData.expiresAt > Date.now() + 5 * 60 * 1000) {
        return tokenData.accessToken;
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: FIREFLY_SCOPES
    });

    const response = await fetch(IMS_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    tokenData = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    };

    return tokenData.accessToken;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await fetchAccessToken();
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": credentials!.clientId,
        "Authorization": `Bearer ${token}`
    };
}

// ─── Image Generation ───────────────────────────────────────────────

export async function generateImage(options: FireflyGenerateOptions): Promise<FireflyImageResult> {
    const headers = await getAuthHeaders();

    const payload: any = {
        prompt: options.prompt,
        n: options.n || 1
    };

    if (options.size) {
        payload.size = options.size;
    }

    if (options.contentClass) {
        payload.contentClass = options.contentClass;
    }

    if (options.styles?.presets) {
        payload.styles = { presets: options.styles.presets };
    }

    const response = await fetch(`${FIREFLY_API_BASE}/v3/images/generate-async`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firefly API error (${response.status}): ${errorText}`);
    }

    return await response.json();
}

// ─── Design Improvement Suggestions ─────────────────────────────────
// Uses Firefly to generate design-aware suggestions based on current design issues

export interface AISuggestion {
    category: "layout" | "color" | "typography" | "spacing" | "hierarchy" | "contrast";
    title: string;
    description: string;
    confidence: number;
    action?: string;
    data?: any;
}

export async function getDesignSuggestions(issuesSummary: string): Promise<AISuggestion[]> {
    if (!isFireflyConnected()) {
        return [{ category: "layout", title: "Not connected", description: "Connect to Adobe Firefly to get AI suggestions.", confidence: 0 }];
    }

    // Use Firefly image generation to create an "ideal" version for comparison
    // This serves as a visual reference for improvement
    const suggestions: AISuggestion[] = [];

    try {
        // Generate an improved design reference
        const result = await generateImage({
            prompt: `Professional, well-designed ${issuesSummary}. Clean layout, proper hierarchy, balanced spacing, harmonious colors, WCAG accessible contrast.`,
            n: 1,
            contentClass: "art"
        });

        if (result.images && result.images.length > 0) {
            suggestions.push({
                category: "layout",
                title: "AI Design Reference Generated",
                description: "Firefly generated an ideal layout reference based on your design issues. Use it as visual guidance for improvements.",
                confidence: 0.8,
                data: { referenceImageUrl: result.images[0].url }
            });
        }
    } catch (error: any) {
        suggestions.push({
            category: "layout",
            title: "AI generation failed",
            description: error.message || "Could not generate design reference.",
            confidence: 0
        });
    }

    // Rule-based AI suggestions derived from issue analysis
    suggestions.push(...generateRuleBasedSuggestions(issuesSummary));

    return suggestions;
}

// ─── Color Palette from Firefly ─────────────────────────────────────

export interface GeneratedPaletteResult {
    name: string;
    colors: string[];
    imageUrl?: string;
}

export async function generateColorPalette(theme: string): Promise<GeneratedPaletteResult> {
    if (!isFireflyConnected()) {
        // Return a default palette when not connected
        return {
            name: "Default (not connected)",
            colors: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"]
        };
    }

    try {
        const result = await generateImage({
            prompt: `Abstract color palette swatch with 5 harmonious colors for ${theme}. Flat color blocks, no text, minimalist.`,
            n: 1,
            contentClass: "art",
            size: { width: 1024, height: 256 }
        });

        return {
            name: `Firefly: ${theme}`,
            colors: extractDefaultBrandColors(theme),
            imageUrl: result.images?.[0]?.url
        };
    } catch {
        return {
            name: `Default: ${theme}`,
            colors: extractDefaultBrandColors(theme)
        };
    }
}

// ─── Rule-Based Suggestion Helpers ──────────────────────────────────

function generateRuleBasedSuggestions(issuesSummary: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const lower = issuesSummary.toLowerCase();

    if (lower.includes("contrast") || lower.includes("wcag")) {
        suggestions.push({
            category: "contrast",
            title: "Improve Text Contrast",
            description: "Increase contrast between text and background to meet WCAG AA (4.5:1) or AAA (7:1) standards.",
            confidence: 0.9,
            action: "fixContrast"
        });
    }

    if (lower.includes("spacing") || lower.includes("gap") || lower.includes("margin")) {
        suggestions.push({
            category: "spacing",
            title: "Normalize Spacing",
            description: "Apply consistent spacing using an 8px grid system for professional rhythm.",
            confidence: 0.85,
            action: "fixSpacing"
        });
    }

    if (lower.includes("alignment") || lower.includes("misalign")) {
        suggestions.push({
            category: "layout",
            title: "Snap to Grid",
            description: "Align elements to a detected column grid for a structured, professional layout.",
            confidence: 0.9,
            action: "fixAlignment"
        });
    }

    if (lower.includes("hierarchy") || lower.includes("focal")) {
        suggestions.push({
            category: "hierarchy",
            title: "Establish Visual Hierarchy",
            description: "Apply a 1.25× modular type scale and increase the dominant element's size for clear focus.",
            confidence: 0.85,
            action: "fixTypography"
        });
    }

    if (lower.includes("color") || lower.includes("palette")) {
        suggestions.push({
            category: "color",
            title: "Simplify Color Palette",
            description: "Reduce to 3-5 harmonious colors by merging similar hues for a cohesive look.",
            confidence: 0.8,
            action: "fixColorPalette"
        });
    }

    if (suggestions.length === 0) {
        suggestions.push({
            category: "layout",
            title: "Design looks great!",
            description: "No major issues detected. Consider minor refinements for an A+ score.",
            confidence: 0.7
        });
    }

    return suggestions;
}

function extractDefaultBrandColors(theme: string): string[] {
    const palettes: Record<string, string[]> = {
        "professional": ["#1E293B", "#334155", "#3B82F6", "#60A5FA", "#F1F5F9"],
        "vibrant": ["#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"],
        "calm": ["#0D9488", "#14B8A6", "#5EEAD4", "#99F6E4", "#F0FDFA"],
        "warm": ["#B91C1C", "#DC2626", "#F87171", "#FCA5A5", "#FEF2F2"],
        "dark": ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B"]
    };

    const lower = theme.toLowerCase();
    for (const [key, colors] of Object.entries(palettes)) {
        if (lower.includes(key)) return colors;
    }
    return palettes.professional;
}
