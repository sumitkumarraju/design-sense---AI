import React from "react";
import { DesignScoreData } from "../models/DesignAnalysisResult";
import "../styles/ScoreCard.css";

export const ScoreCard: React.FC<DesignScoreData> = ({ overallScore, grade }) => {
    return (
        <div className="score-card">
            <div className="score-number">{overallScore}</div>
            <div className={`grade-badge grade-${grade.toLowerCase().replace(" ", "-")}`}>
                {grade}
            </div>
            <p className="score-summary">
                Your overall design score is decent, but could be improved with better alignment and color consistency.
            </p>
        </div>
    );
};
