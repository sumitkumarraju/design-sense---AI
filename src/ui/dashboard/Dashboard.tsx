import React from "react";
import { DesignIssue } from "../../sandbox/models/DesignAnalysisResult";
import { HeatmapToggle } from "./HeatmapToggle";
import { ReportExport } from "./ReportExport";
import { AISettings } from "./AISettings";
import { AISuggestion } from "../services/fireflyService";

// ─── Types ──────────────────────────────────────────────────────────

export interface DashboardData {
    overallScore: number;
    grade: string;
    categories: {
        layout: number;
        color: number;
        contrast: number;
        typography: number;
        spacing: number;
        hierarchy: number;
    };
    issues: {
        layout: DesignIssue[];
        color: DesignIssue[];
        contrast: DesignIssue[];
        typography: DesignIssue[];
        spacing: DesignIssue[];
        hierarchy: DesignIssue[];
    };
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
}

interface DashboardProps {
    data: DashboardData;
    isAnalyzing: boolean;
    isHeatmapActive: boolean;
    isAIConnected: boolean;
    aiConnectionStatus: string;
    aiSuggestions: AISuggestion[];
    onAnalyze: () => void;
    onFix: (issueType: string) => void;
    onToggleHeatmap: () => void;
    onExportReport: () => void;
    onAIConnect: (clientId: string, clientSecret: string) => void;
    onAIDisconnect: () => void;
    onAIImprove: () => void;
}

// ─── Category Display Config ────────────────────────────────────────

const CATEGORY_CONFIG: { key: string; label: string; color: string }[] = [
    { key: "layout", label: "Layout", color: "#2563EB" },
    { key: "color", label: "Color", color: "#7C3AED" },
    { key: "contrast", label: "Contrast", color: "#059669" },
    { key: "typography", label: "Typography", color: "#D97706" },
    { key: "spacing", label: "Spacing", color: "#DC2626" },
    { key: "hierarchy", label: "Hierarchy", color: "#0891B2" }
];

// ─── Component ──────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({
    data,
    isAnalyzing,
    isHeatmapActive,
    isAIConnected,
    aiConnectionStatus,
    aiSuggestions,
    onAnalyze,
    onFix,
    onToggleHeatmap,
    onExportReport,
    onAIConnect,
    onAIDisconnect,
    onAIImprove
}) => {
    const gradeClass = `grade-${data.grade.toLowerCase()}`;
    const allIssues = ([] as DesignIssue[]).concat(
        ...Object.values(data.issues)
    );

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>DesignSense AI</h1>
                <p>Real-Time Design Intelligence Platform</p>
            </div>

            {/* AI Settings */}
            <AISettings
                isConnected={isAIConnected}
                onConnect={onAIConnect}
                onDisconnect={onAIDisconnect}
                connectionStatus={aiConnectionStatus}
            />

            {/* Overall Score */}
            <div className="score-overview">
                <div className={`score-circle ${gradeClass}`}>
                    <span className="score-number">{data.overallScore}</span>
                    <span className="score-grade">Grade {data.grade}</span>
                </div>
                <div className="score-meta">
                    <div className="stat">
                        <span className="critical">{data.criticalCount}</span> critical
                    </div>
                    <div className="stat">
                        <span className="warning">{data.warningCount}</span> warnings
                    </div>
                    <div className="stat">
                        <span className="info">{data.infoCount}</span> info
                    </div>
                    <div className="stat">{data.totalIssues} total issues</div>
                </div>
            </div>

            {/* Category Scores */}
            <div className="category-grid">
                {CATEGORY_CONFIG.map(cat => {
                    const score = data.categories[cat.key as keyof typeof data.categories] || 0;
                    return (
                        <div className="category-card" key={cat.key}>
                            <div className="cat-label">{cat.label}</div>
                            <div className="cat-score" style={{ color: cat.color }}>
                                {score}
                            </div>
                            <div className="cat-bar">
                                <div
                                    className="cat-bar-fill"
                                    style={{
                                        width: `${score}%`,
                                        background: cat.color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    className="action-btn primary"
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Design"}
                </button>

                <button
                    className="action-btn ai-improve"
                    onClick={onAIImprove}
                    disabled={data.totalIssues === 0}
                >
                    ✨ AI Improve Design
                </button>

                <HeatmapToggle
                    isActive={isHeatmapActive}
                    onToggle={onToggleHeatmap}
                    disabled={data.totalIssues === 0}
                />

                <button
                    className="action-btn secondary"
                    onClick={() => onFix("MISALIGNED")}
                    disabled={data.totalIssues === 0}
                >
                    🔧 Fix Layout
                </button>

                <button
                    className="action-btn secondary"
                    onClick={() => onFix("LOW_CONTRAST")}
                    disabled={data.totalIssues === 0}
                >
                    🎨 Fix Contrast
                </button>

                <ReportExport
                    onExport={onExportReport}
                    disabled={data.totalIssues === 0}
                />
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
                <div className="ai-suggestions">
                    <h3>✨ AI Suggestions ({aiSuggestions.length})</h3>
                    {aiSuggestions.map((suggestion, i) => (
                        <div className="ai-suggestion-item" key={i}>
                            <div>
                                <div className="suggestion-title">{suggestion.title}</div>
                                <div className="suggestion-desc">{suggestion.description}</div>
                                {suggestion.action && (
                                    <button
                                        className="suggestion-action"
                                        onClick={() => onFix(suggestion.action!)}
                                    >
                                        Apply Fix
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Issues List */}
            {allIssues.length > 0 && (
                <div className="issues-section">
                    <h3>Issues ({allIssues.length})</h3>
                    {allIssues.map((issue, i) => (
                        <div className="issue-item" key={i}>
                            <div className={`issue-badge ${issue.severity.toLowerCase()}`} />
                            <div className="issue-content">
                                <div className="issue-title">{issue.title}</div>
                                <div className="issue-desc">{issue.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
