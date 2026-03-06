import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@swc-react/theme";
import { Dashboard, DashboardData } from "./dashboard/Dashboard";
import { generateReport, downloadReport } from "./services/reportService";
import {
    connectFirefly,
    disconnectFirefly,
    isFireflyConnected,
    getDesignSuggestions,
    AISuggestion
} from "./services/fireflyService";

import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

import "./styles/Dashboard.css";
import "./styles/AISettings.css";

// ─── Default State ──────────────────────────────────────────────────

const defaultData: DashboardData = {
    overallScore: 100,
    grade: "A",
    categories: {
        layout: 100,
        color: 100,
        contrast: 100,
        typography: 100,
        spacing: 100,
        hierarchy: 100
    },
    issues: {
        layout: [],
        color: [],
        contrast: [],
        typography: [],
        spacing: [],
        hierarchy: []
    },
    totalIssues: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0
};

// ─── App ────────────────────────────────────────────────────────────

const App = () => {
    const [data, setData] = useState<DashboardData>(defaultData);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isHeatmapActive, setIsHeatmapActive] = useState(false);
    const [isAIConnected, setIsAIConnected] = useState(false);
    const [aiConnectionStatus, setAIConnectionStatus] = useState("");
    const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);

    const getSandboxProxy = async () => {
        await addOnUISdk.ready;
        return addOnUISdk.instance.runtime.apiProxy(RuntimeType.documentSandbox) as any;
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const sandboxProxy = await getSandboxProxy();
            const result = await sandboxProxy.runFullAnalysis();
            setData(result);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFix = async (issueType: string) => {
        try {
            const sandboxProxy = await getSandboxProxy();

            switch (issueType) {
                case "MISALIGNED":
                case "fixAlignment":
                    await sandboxProxy.fixAlignment();
                    break;
                case "POOR_SPACING":
                case "SPACING_IMBALANCE":
                case "fixSpacing":
                    await sandboxProxy.fixSpacing();
                    break;
                case "LOW_CONTRAST":
                case "fixContrast":
                    await sandboxProxy.fixContrast();
                    break;
                case "TOO_MANY_COLORS":
                case "fixColorPalette":
                    await sandboxProxy.fixColorPalette();
                    break;
                case "NO_FOCAL_POINT":
                case "WEAK_HIERARCHY":
                case "fixTypography":
                    await sandboxProxy.fixTypography();
                    break;
                default:
                    await sandboxProxy.applyFix(issueType);
            }

            // Re-analyze after fix
            const result = await sandboxProxy.runFullAnalysis();
            setData(result);
        } catch (error) {
            console.error("Fix failed:", error);
        }
    };

    const handleToggleHeatmap = async () => {
        try {
            const sandboxProxy = await getSandboxProxy();

            if (isHeatmapActive) {
                await sandboxProxy.clearHeatmap();
                setIsHeatmapActive(false);
            } else {
                await sandboxProxy.showHeatmap();
                setIsHeatmapActive(true);
            }
        } catch (error) {
            console.error("Heatmap toggle failed:", error);
        }
    };

    const handleExportReport = () => {
        const report = generateReport({
            overallScore: data.overallScore,
            grade: data.grade,
            categories: data.categories,
            issues: data.issues
        });
        downloadReport(report);
    };

    // ─── AI Handlers ────────────────────────────────────────────────

    const handleAIConnect = async (clientId: string, clientSecret: string) => {
        setAIConnectionStatus("Connecting...");
        const result = await connectFirefly({ clientId, clientSecret });
        setIsAIConnected(result.success);
        setAIConnectionStatus(result.message);
    };

    const handleAIDisconnect = () => {
        disconnectFirefly();
        setIsAIConnected(false);
        setAIConnectionStatus("");
        setAISuggestions([]);
    };

    const handleAIImprove = async () => {
        // Build an issue summary for the AI
        const allIssues = ([] as string[]).concat(
            data.issues.layout.map(i => i.title),
            data.issues.color.map(i => i.title),
            data.issues.contrast.map(i => i.title),
            data.issues.typography.map(i => i.title),
            data.issues.spacing.map(i => i.title),
            data.issues.hierarchy.map(i => i.title)
        );

        const summary = allIssues.length > 0
            ? allIssues.join(", ")
            : "general design improvement";

        const suggestions = await getDesignSuggestions(summary);
        setAISuggestions(suggestions);
    };

    return (
        <Theme theme="express" scale="medium" color="light" {...({} as any)}>
            <Dashboard
                data={data}
                isAnalyzing={isAnalyzing}
                isHeatmapActive={isHeatmapActive}
                isAIConnected={isAIConnected}
                aiConnectionStatus={aiConnectionStatus}
                aiSuggestions={aiSuggestions}
                onAnalyze={handleAnalyze}
                onFix={handleFix}
                onToggleHeatmap={handleToggleHeatmap}
                onExportReport={handleExportReport}
                onAIConnect={handleAIConnect}
                onAIDisconnect={handleAIDisconnect}
                onAIImprove={handleAIImprove}
            />
        </Theme>
    );
};

// Start the add-on
addOnUISdk.ready.then(() => {
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
}).catch((e: any) => console.error(e));
