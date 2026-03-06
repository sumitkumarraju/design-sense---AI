import { editor } from "express-document-sdk";

// ─── Alignment Fixer ────────────────────────────────────────────────
// Two strategies:
// 1. Smart align: groups nearby elements, snaps to group median
// 2. Left-align fallback: aligns all elements to the leftmost edge
// Always runs both X and Y alignment for maximum visible effect.

const SNAP_THRESHOLD = 50; // px — elements within 50px get grouped
const MIN_GROUP_SIZE = 2;

export function fixAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    let fixedCount = 0;

    // Strategy 1: Smart group alignment (X-axis)
    const xGroups = groupByProximity(
        elements.map((el, i) => ({ index: i, val: el.translation.x })),
        SNAP_THRESHOLD
    );

    xGroups.forEach(group => {
        if (group.length < MIN_GROUP_SIZE) return;

        const medianVal = median(group.map(g => g.val));

        group.forEach(g => {
            const el = elements[g.index];
            if (Math.abs(el.translation.x - medianVal) > 2) {
                el.translation = { x: Math.round(medianVal), y: el.translation.y };
                fixedCount++;
            }
        });
    });

    // If smart alignment fixed nothing, use left-align fallback
    if (fixedCount === 0) {
        const leftmost = Math.min(...elements.map((el: any) => el.translation.x));

        elements.forEach((el: any) => {
            if (Math.abs(el.translation.x - leftmost) > 5) {
                el.translation = { x: leftmost, y: el.translation.y };
                fixedCount++;
            }
        });
    }

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) aligned"
            : "Elements already aligned"
    };
}

export function fixVerticalAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    const yGroups = groupByProximity(
        elements.map((el, i) => ({ index: i, val: el.translation.y })),
        SNAP_THRESHOLD
    );

    let fixedCount = 0;

    yGroups.forEach(group => {
        if (group.length < MIN_GROUP_SIZE) return;

        const medianVal = median(group.map(g => g.val));

        group.forEach(g => {
            const el = elements[g.index];
            if (Math.abs(el.translation.y - medianVal) > 2) {
                el.translation = { x: el.translation.x, y: Math.round(medianVal) };
                fixedCount++;
            }
        });
    });

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) vertically aligned"
            : "Vertical alignment already good"
    };
}

// ─── Helpers ────────────────────────────────────────────────────────

interface PosItem { index: number; val: number; }

function groupByProximity(items: PosItem[], threshold: number): PosItem[][] {
    if (items.length === 0) return [];
    const sorted = items.slice().sort((a, b) => a.val - b.val);
    const groups: PosItem[][] = [[sorted[0]]];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].val - sorted[i - 1].val <= threshold) {
            groups[groups.length - 1].push(sorted[i]);
        } else {
            groups.push([sorted[i]]);
        }
    }
    return groups;
}

function median(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}
