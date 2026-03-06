import { DesignIssue } from "../models/DesignAnalysisResult";

// ─── Suggestion Output ──────────────────────────────────────────────

export interface DesignSuggestion {
    category: "layout" | "color" | "typography";
    priority: "critical" | "important" | "nice-to-have";
    title: string;
    description: string;
    actionText: string;
    impact: string;
}

// ─── Rule Definitions ───────────────────────────────────────────────

interface SuggestionRule {
    issueType: string;
    severity: string[];
    generate: (issue: DesignIssue) => DesignSuggestion;
}

const LAYOUT_RULES: SuggestionRule[] = [
    {
        issueType: "MISALIGNED",
        severity: ["HIGH", "MEDIUM"],
        generate: () => ({
            category: "layout",
            priority: "important",
            title: "Fix element alignment",
            description: "Elements have inconsistent left margins. Align them to a shared edge or grid column to create visual order.",
            actionText: "Auto-align to nearest grid",
            impact: "Improves visual flow and professional appearance"
        })
    },
    {
        issueType: "MISALIGNED",
        severity: ["LOW"],
        generate: () => ({
            category: "layout",
            priority: "nice-to-have",
            title: "Establish a column grid",
            description: "Elements are scattered across too many X positions. Snap them into 2-4 consistent columns.",
            actionText: "Snap to column grid",
            impact: "Creates structured, magazine-style layout"
        })
    },
    {
        issueType: "POOR_SPACING",
        severity: ["HIGH", "MEDIUM"],
        generate: () => ({
            category: "layout",
            priority: "important",
            title: "Balance vertical spacing",
            description: "Gaps between elements are uneven. Use consistent spacing (e.g., 16px or 24px) between sections.",
            actionText: "Distribute elements evenly",
            impact: "Creates rhythm and breathing room in the layout"
        })
    },
    {
        issueType: "NO_FOCAL_POINT",
        severity: ["HIGH", "MEDIUM"],
        generate: () => ({
            category: "layout",
            priority: "critical",
            title: "Create a visual focal point",
            description: "No single element dominates the design. Make one element significantly larger to guide the viewer's eye.",
            actionText: "Enlarge primary element",
            impact: "Directs attention and creates visual hierarchy"
        })
    }
];

const COLOR_RULES: SuggestionRule[] = [
    {
        issueType: "LOW_CONTRAST",
        severity: ["HIGH"],
        generate: () => ({
            category: "color",
            priority: "critical",
            title: "Increase text contrast",
            description: "Text colors don't meet WCAG readability standards. Darken text or lighten backgrounds for a 4.5:1 minimum ratio.",
            actionText: "Boost contrast ratio",
            impact: "Essential for readability and accessibility compliance"
        })
    },
    {
        issueType: "TOO_MANY_COLORS",
        severity: ["MEDIUM"],
        generate: () => ({
            category: "color",
            priority: "important",
            title: "Fix clashing color combinations",
            description: "Some colors are too similar in hue, creating visual tension. Use complementary or analogous color schemes.",
            actionText: "Apply harmonious palette",
            impact: "Reduces visual noise and creates cohesion"
        })
    },
    {
        issueType: "TOO_MANY_COLORS",
        severity: ["LOW"],
        generate: (issue: DesignIssue) => ({
            category: "color",
            priority: "nice-to-have",
            title: issue.title.includes("dominant") ? "Establish a dominant brand color" : "Simplify color palette",
            description: issue.title.includes("dominant")
                ? "No color takes visual priority. Apply the 60-30-10 rule: 60% primary, 30% secondary, 10% accent."
                : "Too many distinct colors are used. Consolidate to 3-5 brand colors for visual harmony.",
            actionText: issue.title.includes("dominant") ? "Apply 60-30-10 rule" : "Reduce to 3-5 colors",
            impact: "Strengthens brand identity and visual consistency"
        })
    }
];

const TYPOGRAPHY_RULES: SuggestionRule[] = [
    {
        issueType: "NO_FOCAL_POINT",
        severity: ["MEDIUM"],
        generate: (issue: DesignIssue) => {
            if (issue.title.includes("competing")) {
                return {
                    category: "typography",
                    priority: "important",
                    title: "Differentiate headline sizes",
                    description: "Multiple text elements share the same large size. Make one headline clearly larger and reduce others.",
                    actionText: "Apply type scale",
                    impact: "Creates clear reading order and hierarchy"
                };
            }
            if (issue.title.includes("contrast") || issue.title.includes("Weak")) {
                return {
                    category: "typography",
                    priority: "important",
                    title: "Increase font size contrast",
                    description: "Font sizes are too similar. Use a modular scale (1.25x ratio) for clear differentiation.",
                    actionText: "Apply modular scale",
                    impact: "Makes content scannable and improves readability"
                };
            }
            if (issue.title.includes("font families") || issue.title.includes("font")) {
                return {
                    category: "typography",
                    priority: "nice-to-have",
                    title: "Reduce font family count",
                    description: "More than 2 font families create visual chaos. Use one for headings and one for body text.",
                    actionText: "Consolidate fonts",
                    impact: "Creates typographic consistency and brand cohesion"
                };
            }
            return {
                category: "typography",
                priority: "nice-to-have",
                title: "Standardize font sizing",
                description: "Too many distinct font sizes. Adopt a consistent type scale for visual rhythm.",
                actionText: "Apply type scale",
                impact: "Improves readability and visual consistency"
            };
        }
    }
];

// ─── Main Engine ────────────────────────────────────────────────────

export function generateSuggestions(
    layoutIssues: DesignIssue[],
    colorIssues: DesignIssue[],
    typographyIssues: DesignIssue[]
): DesignSuggestion[] {
    const suggestions: DesignSuggestion[] = [];
    const seen = new Set<string>();

    const processIssues = (issues: DesignIssue[], rules: SuggestionRule[]) => {
        issues.forEach(issue => {
            const rule = rules.find(r =>
                r.issueType === issue.type && r.severity.includes(issue.severity)
            );
            if (rule) {
                const suggestion = rule.generate(issue);
                const key = suggestion.title;
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(suggestion);
                }
            }
        });
    };

    processIssues(layoutIssues, LAYOUT_RULES);
    processIssues(colorIssues, COLOR_RULES);
    processIssues(typographyIssues, TYPOGRAPHY_RULES);

    // Sort by priority: critical > important > nice-to-have
    const priorityOrder: Record<string, number> = { critical: 0, important: 1, "nice-to-have": 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
}

// ─── Quick Summary Generator ────────────────────────────────────────

export function generateQuickSummary(suggestions: DesignSuggestion[]): string {
    const critical = suggestions.filter(s => s.priority === "critical").length;
    const important = suggestions.filter(s => s.priority === "important").length;
    const nice = suggestions.filter(s => s.priority === "nice-to-have").length;

    if (suggestions.length === 0) return "Your design looks excellent! No issues detected.";
    if (critical > 0) return `${critical} critical issue${critical > 1 ? "s" : ""} found. Fix these first for the biggest impact.`;
    if (important > 0) return `${important} improvement${important > 1 ? "s" : ""} recommended to elevate your design.`;
    return `${nice} minor tweak${nice > 1 ? "s" : ""} to polish your design.`;
}
