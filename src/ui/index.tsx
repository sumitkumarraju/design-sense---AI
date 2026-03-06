import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@swc-react/theme";
import { DesignPanel } from "./components/DesignPanel";
import { DesignAnalysisResult } from "./models/DesignAnalysisResult";
import { computeDesignScore } from "./services/designScoringService";
import { generateSuggestions, generateQuickSummary } from "./services/suggestionEngine";

import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

import "./styles/DesignPanel.css";
import "./styles/ScoreCard.css";
import "./styles/CategoryPills.css";
import "./styles/IssueSection.css";
import "./styles/ChecklistPanel.css";

const defaultData: DesignAnalysisResult = computeDesignScore(
    { score: 100, issues: [] },
    { score: 100, issues: [] },
    { score: 100, issues: [] }
);

const App = () => {
    const [data, setData] = useState<DesignAnalysisResult>(defaultData);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const getSandboxProxy = async () => {
        await addOnUISdk.ready;
        return addOnUISdk.instance.runtime.apiProxy(RuntimeType.documentSandbox) as any;
    };

    const runAnalysis = async () => {
        const sandboxProxy = await getSandboxProxy();
        const layoutResult = await sandboxProxy.analyzeLayout();
        const colorResult = await sandboxProxy.analyzeColors();
        const typographyResult = await sandboxProxy.analyzeTypography();

        const result = computeDesignScore(layoutResult, colorResult, typographyResult);
        const suggestions = generateSuggestions(
            layoutResult.issues,
            colorResult.issues,
            typographyResult.issues
        );
        const summary = generateQuickSummary(suggestions);
        setData({ ...result, suggestions, summary });
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            await runAnalysis();
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFix = async (issueType: string) => {
        try {
            const sandboxProxy = await getSandboxProxy();
            const result = await sandboxProxy.applyFix(issueType);
            console.log("Fix result:", result);

            // Re-analyze after fix to update scores
            await runAnalysis();
        } catch (error) {
            console.error("Fix failed:", error);
        }
    };

    return (
        // @ts-ignore
        <Theme theme="express" scale="medium" color="light">
            <DesignPanel
                data={data}
                onAnalyze={handleAnalyze}
                onFix={handleFix}
                isAnalyzing={isAnalyzing}
            />
        // @ts-ignore
        </Theme>
    );
};

// Start the add-on
addOnUISdk.ready.then(() => {
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
}).catch((e: any) => console.error(e));
