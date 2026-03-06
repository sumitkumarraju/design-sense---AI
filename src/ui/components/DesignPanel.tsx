import React from "react";
import { ScoreCard } from "./ScoreCard";
import { CategoryPills } from "./CategoryPills";
import { IssueSection } from "./IssueSection";
import { ChecklistPanel } from "./ChecklistPanel";
import { DesignAnalysisResult } from "../models/DesignAnalysisResult";
import "../styles/DesignPanel.css";

interface DesignPanelProps {
    data: DesignAnalysisResult;
    onAnalyze: () => void;
    onFix: (issueType: string) => void;
    isAnalyzing: boolean;
}

export const DesignPanel: React.FC<DesignPanelProps> = ({ data, onAnalyze, onFix, isAnalyzing }) => {
    return (
        <div className="design-panel">
            <div className="panel-header">
                <div className="title-area">
                    <h2>DesignSense AI</h2>
                    <span className="subtitle">Smart Design Coach</span>
                </div>
                <button
                    className={`analyze-btn ${isAnalyzing ? 'analyzing' : ''}`}
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Design'}
                </button>
            </div>

            <ScoreCard {...data} />

            <CategoryPills
                overallScore={data.overallScore}
                grade={data.grade}
                layoutScore={data.layoutScore}
                colorScore={data.colorScore}
                typographyScore={data.typographyScore}
            />

            <div className="issues-container">
                <IssueSection title="Alignment & Spacing" icon="◰" issues={data.issues.layout} onFix={onFix} />
                <IssueSection title="Visual Hierarchy" icon="☷" issues={data.issues.typography} onFix={onFix} />
                <IssueSection title="Color Harmony" icon="◐" issues={data.issues.color} onFix={onFix} />
            </div>

            <ChecklistPanel checklist={data.checklist} />
        </div>
    );
};
