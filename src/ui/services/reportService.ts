// ─── Report Service ─────────────────────────────────────────────────
// Generates design reports and exports as PDF (via browser print), DOCX-style HTML, or JSON.

import { DesignIssue } from "../models/DesignAnalysisResult";

export interface DesignReport {
    generatedAt: string;
    platform: string;
    overallScore: number;
    grade: string;
    categories: {
        name: string;
        score: number;
        issueCount: number;
    }[];
    issues: {
        category: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        suggestedFix?: string;
    }[];
    wcagCompliance: {
        aa: boolean;
        aaa: boolean;
        contrastIssues: number;
    };
    summary: string;
}

export function generateReport(data: {
    overallScore: number;
    grade: string;
    categories: Record<string, number>;
    issues: Record<string, DesignIssue[]>;
}): DesignReport {
    const allIssues: DesignReport["issues"] = [];

    Object.entries(data.issues).forEach(([category, issues]) => {
        issues.forEach(issue => {
            allIssues.push({
                category,
                type: issue.type,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                suggestedFix: issue.suggestedFix
            });
        });
    });

    const contrastIssues = allIssues.filter(
        i => i.type === "LOW_CONTRAST" || i.type === "AAA_CONTRAST_FAIL"
    );

    const categoryList = Object.entries(data.categories).map(([name, score]) => ({
        name,
        score,
        issueCount: (data.issues[name] || []).length
    }));

    const criticalCount = allIssues.filter(i => i.severity === "HIGH").length;

    return {
        generatedAt: new Date().toISOString(),
        platform: "DesignSense AI",
        overallScore: data.overallScore,
        grade: data.grade,
        categories: categoryList,
        issues: allIssues,
        wcagCompliance: {
            aa: contrastIssues.filter(i => i.type === "LOW_CONTRAST").length === 0,
            aaa: contrastIssues.length === 0,
            contrastIssues: contrastIssues.length
        },
        summary: generateSummaryText(data.overallScore, data.grade, allIssues.length, criticalCount)
    };
}

function generateSummaryText(score: number, grade: string, total: number, critical: number): string {
    if (score >= 90) {
        return `Excellent design quality (Grade ${grade}). ${total} minor suggestions found.`;
    }
    if (score >= 75) {
        return `Good design quality (Grade ${grade}). ${total} issues found, ${critical} critical.`;
    }
    if (score >= 60) {
        return `Fair design quality (Grade ${grade}). ${total} issues found, ${critical} critical. Improvements recommended.`;
    }
    return `Design needs improvement (Grade ${grade}). ${total} issues found, ${critical} critical. Immediate attention required.`;
}

// ─── PDF Export (via browser Print-to-PDF) ──────────────────────────

export function downloadReportAsPDF(report: DesignReport): void {
    const html = buildReportHTML(report);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        // Fallback: download as HTML file
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DesignSense_Report_${report.generatedAt.slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to render, then trigger print dialog
    printWindow.onload = () => {
        printWindow.print();
    };
}

// ─── JSON Export ────────────────────────────────────────────────────

export function downloadReport(report: DesignReport): void {
    downloadReportAsPDF(report);
}

// ─── HTML Builder ───────────────────────────────────────────────────

function buildReportHTML(report: DesignReport): string {
    const severityColor: Record<string, string> = {
        HIGH: "#DC2626",
        MEDIUM: "#F59E0B",
        LOW: "#3B82F6"
    };

    const gradeColor: Record<string, string> = {
        A: "#22C55E",
        B: "#3B82F6",
        C: "#F59E0B",
        D: "#EF4444",
        F: "#DC2626"
    };

    const issueRows = report.issues.map(issue => `
        <tr>
            <td><span style="color:${severityColor[issue.severity] || '#666'};font-weight:700;">${issue.severity}</span></td>
            <td>${issue.category}</td>
            <td><strong>${issue.title}</strong><br><small style="color:#666;">${issue.description}</small></td>
            <td>${issue.suggestedFix || "—"}</td>
        </tr>
    `).join("");

    const categoryRows = report.categories.map(cat => `
        <tr>
            <td style="text-transform:capitalize;font-weight:600;">${cat.name}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;background:#E5E7EB;border-radius:4px;height:8px;overflow:hidden;">
                        <div style="width:${cat.score}%;height:100%;background:${cat.score >= 80 ? '#22C55E' : cat.score >= 60 ? '#F59E0B' : '#EF4444'};border-radius:4px;"></div>
                    </div>
                    <span style="font-weight:700;min-width:30px;">${cat.score}</span>
                </div>
            </td>
            <td>${cat.issueCount}</td>
        </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DesignSense AI Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; margin-bottom: 4px; }
        .subtitle { color: #64748B; font-size: 14px; margin-bottom: 24px; }
        .score-section { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding: 24px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; border: 5px solid; }
        .score-number { font-size: 32px; line-height: 1; }
        .score-grade { font-size: 14px; opacity: 0.8; }
        .summary { font-size: 14px; color: #475569; line-height: 1.6; flex: 1; }
        .wcag { margin-top: 8px; font-size: 13px; }
        .wcag-pass { color: #22C55E; font-weight: 600; }
        .wcag-fail { color: #DC2626; font-weight: 600; }
        h2 { font-size: 18px; margin: 24px 0 12px 0; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 8px 12px; background: #F1F5F9; font-weight: 600; color: #475569; }
        td { padding: 8px 12px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
        @media print { body { padding: 20px; } .score-section { break-inside: avoid; } }
    </style>
</head>
<body>
    <h1>🎨 DesignSense AI Report</h1>
    <div class="subtitle">Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>

    <div class="score-section">
        <div class="score-circle" style="border-color:${gradeColor[report.grade] || '#999'};color:${gradeColor[report.grade] || '#999'};">
            <span class="score-number">${report.overallScore}</span>
            <span class="score-grade">Grade ${report.grade}</span>
        </div>
        <div class="summary">
            <p>${report.summary}</p>
            <div class="wcag">
                WCAG AA: <span class="${report.wcagCompliance.aa ? 'wcag-pass' : 'wcag-fail'}">${report.wcagCompliance.aa ? '✅ Pass' : '❌ Fail'}</span>
                &nbsp;&nbsp;
                WCAG AAA: <span class="${report.wcagCompliance.aaa ? 'wcag-pass' : 'wcag-fail'}">${report.wcagCompliance.aaa ? '✅ Pass' : '❌ Fail'}</span>
            </div>
        </div>
    </div>

    <h2>Category Scores</h2>
    <table>
        <thead><tr><th>Category</th><th>Score</th><th>Issues</th></tr></thead>
        <tbody>${categoryRows}</tbody>
    </table>

    <h2>Issues (${report.issues.length})</h2>
    <table>
        <thead><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead>
        <tbody>${issueRows.length > 0 ? issueRows : '<tr><td colspan="4" style="text-align:center;color:#94A3B8;">No issues found — great work! 🎉</td></tr>'}</tbody>
    </table>

    <div class="footer">
        DesignSense AI — Design Intelligence Platform • ${report.generatedAt.slice(0, 10)}
    </div>
</body>
</html>`;
}
