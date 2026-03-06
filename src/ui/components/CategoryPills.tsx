import React from "react";
import { DesignScoreData } from "../models/DesignAnalysisResult";
import "../styles/CategoryPills.css";

export const CategoryPills: React.FC<DesignScoreData> = ({ layoutScore, colorScore, typographyScore }) => {
    return (
        <div className="pill-container">
            <div className="pill layout">
                Layout: {layoutScore}
            </div>
            <div className="pill color">
                Color Harmony: {colorScore}
            </div>
            <div className="pill typography">
                Typography: {typographyScore}
            </div>
        </div>
    );
};
