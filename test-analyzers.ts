/**
 * DesignSense AI — Phase 1 Unit Tests
 * Tests the pure logic functions from LayoutAnalyzer and ColorAnalyzer
 * with mock Express Document SDK element data.
 */

// ─── Mock Element Factory ───────────────────────────────────────────
function createMockElement(x: number, y: number, w: number, h: number) {
    return {
        translation: { x, y },
        width: w,
        height: h
    };
}

// ─── Extract Logic Functions (mirrored from LayoutAnalyzer.ts) ──────
// We re-implement pure logic here to test independently of Express SDK

interface DesignIssue {
    type: string;
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    suggestedFix?: string;
}

function checkLeftAlignment(elements: any[]): DesignIssue[] {
    if (elements.length < 2) return [];
    const leftPositions = elements.map(el => el.translation.x);
    const minLeft = Math.min(...leftPositions);
    const variance = leftPositions.map(x => Math.abs(x - minLeft));
    const inconsistent = variance.filter(v => v > 10 && v < 200);
    if (inconsistent.length > 0) {
        return [{ type: "MISALIGNED", severity: "MEDIUM", title: "Inconsistent left margins", description: "Elements are not aligned to a consistent left edge.", suggestedFix: "Align to grid" }];
    }
    return [];
}

function checkVerticalSpacing(elements: any[]): DesignIssue[] {
    if (elements.length < 3) return [];
    const sorted = elements.slice().sort((a, b) => a.translation.y - b.translation.y);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        const prevBottom = prev.translation.y + (prev.height || 100);
        const gap = current.translation.y - prevBottom;
        if (gap > -50 && gap < 500) gaps.push(gap);
    }
    if (gaps.length < 2) return [];
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const inconsistent = gaps.filter(g => Math.abs(g - avgGap) > 15);
    if (inconsistent.length > 1) {
        return [{ type: "POOR_SPACING", severity: "MEDIUM", title: "Uneven spacing between elements", description: "Vertical spacing is inconsistent across the layout.", suggestedFix: "Distribute vertically" }];
    }
    return [];
}

function detectGridColumns(elements: any[]): DesignIssue[] {
    const xPositions = elements.map(el => el.translation.x);
    const columns: number[] = [];
    xPositions.forEach(x => {
        const existing = columns.find(col => Math.abs(col - x) < 15);
        if (existing === undefined) columns.push(x);
    });
    if (columns.length > 4) {
        return [{ type: "MISALIGNED", severity: "LOW", title: "No clear column grid", description: "Elements do not align to consistent column structure.", suggestedFix: "Snap to column grid" }];
    }
    return [];
}

function detectFocalPoint(elements: any[]): DesignIssue[] {
    if (elements.length < 2) return [];
    const areas = elements.map(el => (el.width || 100) * (el.height || 100));
    const maxArea = Math.max(...areas);
    const totalArea = areas.reduce((a, b) => a + b, 0);
    const dominanceRatio = maxArea / totalArea;
    if (dominanceRatio < 0.35) {
        return [{ type: "NO_FOCAL_POINT", severity: "MEDIUM", title: "Lack of clear focal point", description: "No dominant visual element guiding attention.", suggestedFix: "Increase size or contrast of primary element" }];
    }
    return [];
}

function calculateLayoutScore(issues: DesignIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
        const mult: Record<string, number> = { HIGH: 2.0, MEDIUM: 1.5, LOW: 1.0 };
        score -= 10 * mult[issue.severity];
    });
    return Math.max(Math.round(score), 30);
}

function checkColorCount(count: number): DesignIssue[] {
    if (count > 5) {
        return [{ type: "TOO_MANY_COLORS", severity: "LOW", title: "Using too many colors", description: "Over five distinct colors are used.", suggestedFix: "Limit to 3-4 brand colors" }];
    }
    return [];
}

// ─── Test Runner ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean) {
    if (condition) {
        console.log(`  \u2705 ${label}`);
        passed++;
    } else {
        console.log(`  \u274C ${label}`);
        failed++;
    }
}

// ─── TEST SUITE 1: Left Alignment ──────────────────────────────────
console.log("\n=== TEST: Left Alignment Detection ===");

const alignedElements = [
    createMockElement(50, 10, 200, 40),
    createMockElement(50, 60, 200, 40),
    createMockElement(50, 110, 200, 40),
];
assert("Aligned elements produce no issues", checkLeftAlignment(alignedElements).length === 0);

const misalignedElements = [
    createMockElement(50, 10, 200, 40),
    createMockElement(80, 60, 200, 40),   // 30px off
    createMockElement(50, 110, 200, 40),
];
assert("Misaligned elements produce MISALIGNED issue", checkLeftAlignment(misalignedElements).length === 1);
assert("Misaligned issue severity is MEDIUM", checkLeftAlignment(misalignedElements)[0].severity === "MEDIUM");

// ─── TEST SUITE 2: Vertical Spacing ───────────────────────────────
console.log("\n=== TEST: Vertical Spacing Consistency ===");

const evenlySpaced = [
    createMockElement(50, 0, 200, 40),  // bottom = 40
    createMockElement(50, 60, 200, 40),  // gap = 20, bottom = 100
    createMockElement(50, 120, 200, 40),  // gap = 20
    createMockElement(50, 180, 200, 40),  // gap = 20
];
assert("Evenly spaced elements produce no issues", checkVerticalSpacing(evenlySpaced).length === 0);

const unevenlySpaced = [
    createMockElement(50, 0, 200, 40),  // bottom = 40
    createMockElement(50, 45, 200, 40),  // gap = 5
    createMockElement(50, 130, 200, 40),  // gap = 45
    createMockElement(50, 175, 200, 40),  // gap = 5
];
assert("Uneven spacing produces POOR_SPACING issue", checkVerticalSpacing(unevenlySpaced).length === 1);

// ─── TEST SUITE 3: Grid Detection ─────────────────────────────────
console.log("\n=== TEST: Grid Column Detection ===");

const gridAligned = [
    createMockElement(50, 10, 100, 30),
    createMockElement(200, 10, 100, 30),
    createMockElement(50, 50, 100, 30),
    createMockElement(200, 50, 100, 30),
];
assert("2-column grid produces no issues", detectGridColumns(gridAligned).length === 0);

const scatteredGrid = [
    createMockElement(10, 10, 80, 30),
    createMockElement(110, 10, 80, 30),
    createMockElement(230, 10, 80, 30),
    createMockElement(350, 10, 80, 30),
    createMockElement(475, 10, 80, 30),
];
assert("5+ columns flags grid issue", detectGridColumns(scatteredGrid).length === 1);

// ─── TEST SUITE 4: Focal Point ────────────────────────────────────
console.log("\n=== TEST: Focal Point Detection ===");

const withFocalPoint = [
    createMockElement(50, 10, 300, 200),  // area = 60000 (dominant)
    createMockElement(50, 220, 100, 30),   // area = 3000
    createMockElement(50, 260, 100, 30),   // area = 3000
];
assert("One dominant element → no focal point issue", detectFocalPoint(withFocalPoint).length === 0);

const noFocalPoint = [
    createMockElement(50, 10, 100, 40),  // area = 4000
    createMockElement(50, 60, 100, 40),  // area = 4000
    createMockElement(50, 110, 100, 40),  // area = 4000
    createMockElement(50, 160, 100, 40),  // area = 4000
];
assert("Equal-size elements → NO_FOCAL_POINT issue", detectFocalPoint(noFocalPoint).length === 1);

// ─── TEST SUITE 5: Scoring Engine ──────────────────────────────────
console.log("\n=== TEST: Scoring Engine ===");

assert("No issues → score 100", calculateLayoutScore([]) === 100);

const mediumIssues: DesignIssue[] = [
    { type: "MISALIGNED", severity: "MEDIUM", title: "t", description: "d" },
    { type: "POOR_SPACING", severity: "MEDIUM", title: "t", description: "d" }
];
assert("2 MEDIUM issues → score 70", calculateLayoutScore(mediumIssues) === 70);

const heavyIssues: DesignIssue[] = [
    { type: "A", severity: "HIGH", title: "t", description: "d" },
    { type: "B", severity: "HIGH", title: "t", description: "d" },
    { type: "C", severity: "HIGH", title: "t", description: "d" },
    { type: "D", severity: "HIGH", title: "t", description: "d" },
];
assert("4 HIGH issues → floor at 30", calculateLayoutScore(heavyIssues) === 30);

// ─── TEST SUITE 6: Color Count ─────────────────────────────────────
console.log("\n=== TEST: Color Count Detection ===");

assert("3 colors → no issue", checkColorCount(3).length === 0);
assert("5 colors → no issue", checkColorCount(5).length === 0);
assert("6 colors → TOO_MANY_COLORS issue", checkColorCount(6).length === 1);
assert("10 colors → TOO_MANY_COLORS issue", checkColorCount(10).length === 1);

// ─── SUMMARY ──────────────────────────────────────────────────────
console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log("=".repeat(50));

if (failed > 0) {
    process.exit(1);
}
