import React, { useState } from "react";
import { DesignIssue } from "../models/DesignAnalysisResult";
import "../styles/IssueSection.css";

interface IssueSectionProps {
    title: string;
    icon?: string;
    issues: DesignIssue[];
    onFix?: (issueType: string) => void;
}

export const IssueSection: React.FC<IssueSectionProps> = ({ title, icon, issues, onFix }) => {
    const [open, setOpen] = useState(true);
    const [fixedTypes, setFixedTypes] = useState<Set<string>>(new Set());

    const handleFix = async (issueType: string) => {
        if (onFix) {
            await onFix(issueType);
            setFixedTypes(prev => new Set([...prev, issueType]));
        }
    };

    return (
        <div className="issue-section">
            <div className="section-header" onClick={() => setOpen(!open)}>
                <div className="section-title-wrapper">
                    {icon && <span className="section-icon">{icon}</span>}
                    <h3>{title}</h3>
                </div>
                <span className={`chevron ${open ? "open" : ""}`}>▼</span>
            </div>

            {open && (
                <div className="issues-list">
                    {issues.map((issue, index) => (
                        <div key={index} className="issue-item-container">
                            <div className="issue-item">
                                <span className={`severity ${issue.severity.toLowerCase()}`}>
                                    {issue.severity}
                                </span>
                                <div className="issue-text">
                                    <strong>{issue.title}</strong>
                                    {issue.description && <p>{issue.description}</p>}
                                </div>
                                <button
                                    className={`fix-btn ${fixedTypes.has(issue.type) ? 'fixed' : ''}`}
                                    onClick={() => handleFix(issue.type)}
                                    disabled={fixedTypes.has(issue.type)}
                                >
                                    {fixedTypes.has(issue.type) ? '✓ Fixed' : 'Fix'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
