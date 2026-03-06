import React from "react";
import "../styles/ChecklistPanel.css";

interface ChecklistItem {
    label: string;
    passed: boolean;
}

interface ChecklistPanelProps {
    checklist: ChecklistItem[];
}

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({ checklist }) => {
    return (
        <div className="checklist-panel">
            <div className="view-full-report">
                <span>View Full Report</span>
                <span className="chevron-right">›</span>
            </div>
            <div className="checklist-content">
                <h3 className="checklist-title">
                    <span className="check-icon">✓</span> DesignSense Analysis Checklist
                </h3>
                {checklist.map((item, index) => (
                    <div key={index} className="check-item">
                        <div className={`checkbox ${item.passed ? "checked" : ""}`}>
                            {item.passed && "✓"}
                        </div>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
