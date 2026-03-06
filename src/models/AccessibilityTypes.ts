export interface AnalysisResult {
    pageCount: number;
    pages: PageAnalysis[];
}

export interface PageAnalysis {
    pageIndex: number;
    issues: AccessibilityIssue[];
    headingStructure: HeadingNode[];
    imagesMissingAlt: number;
    emptyTextBlocks: number;
    elementCount: number;
}

export interface AccessibilityIssue {
    elementId?: string;
    type: IssueType;
    severity: 'Critical' | 'Warning' | 'Info';
    description: string;
}

export type IssueType =
    | 'MISSING_ALT_TEXT'
    | 'EMPTY_HEADING'
    | 'LOW_CONTRAST'
    | 'BROKEN_HIERARCHY'
    | 'MISSING_PAGE_TITLE';

export interface HeadingNode {
    level: number;
    text: string;
}
