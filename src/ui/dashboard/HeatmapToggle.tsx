import React from "react";

interface HeatmapToggleProps {
    isActive: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

export const HeatmapToggle: React.FC<HeatmapToggleProps> = ({ isActive, onToggle, disabled }) => {
    return (
        <button
            className={`action-btn heatmap`}
            onClick={onToggle}
            disabled={disabled}
        >
            {isActive ? "🗑️ Clear Heatmap" : "🔥 Show Design Heatmap"}
        </button>
    );
};
