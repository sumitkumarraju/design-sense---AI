import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { analyzeLayout } from "./analyzers/LayoutAnalyzer";
import { analyzeColors } from "./analyzers/ColorAnalyzer";
import { analyzeTypography } from "./analyzers/TypographyAnalyzer";
import { applyFix } from "./analyzers/AutoFixer";

const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    runtime.exposeApi({
        analyzeLayout: () => analyzeLayout(),
        analyzeColors: () => analyzeColors(),
        analyzeTypography: () => analyzeTypography(),
        applyFix: (issueType: string) => applyFix(issueType)
    });
}

start();
