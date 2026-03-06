import React from "react";

interface ReportExportProps {
    onExport: () => void;
    disabled?: boolean;
}

export const ReportExport: React.FC<ReportExportProps> = ({ onExport, disabled }) => {
    return (
        <button
            className="action-btn secondary"
            onClick={onExport}
            disabled={disabled}
        >
            📄 Export Report
        </button>
    );
};
