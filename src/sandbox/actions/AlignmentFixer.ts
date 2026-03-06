import { editor } from "express-document-sdk";

// ─── Gentle Alignment Fixer ─────────────────────────────────────────
// Instead of K-Means (which destroys intentional layouts), this uses
// a "gentle nudge" approach:
// 1. Groups elements by proximity on the X-axis
// 2. Within each group, snaps to the group's median X position
// 3. Only adjusts elements that are nearly aligned (within threshold)
// 4. Leaves intentionally different positions untouched

const SNAP_THRESHOLD = 20; // Only nudge if within 20px of a neighbor
const MIN_GROUP_SIZE = 2;  // Need at least 2 nearby elements to form a column

export function fixAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    // Step 1: Group elements by X proximity
    const groups = groupByProximity(
        elements.map((el, i) => ({ index: i, x: el.translation.x })),
        SNAP_THRESHOLD
    );

    let fixedCount = 0;

    // Step 2: For each group with 2+ members, snap to the median X
    groups.forEach(group => {
        if (group.length < MIN_GROUP_SIZE) return;

        const xValues = group.map(g => g.x);
        const medianX = median(xValues);

        group.forEach(g => {
            const el = elements[g.index];
            const distance = Math.abs(el.translation.x - medianX);

            // Only snap if the element is close but not exact
            if (distance > 2 && distance <= SNAP_THRESHOLD) {
                el.translation = { x: Math.round(medianX), y: el.translation.y };
                fixedCount++;
            }
        });
    });

    if (fixedCount === 0) {
        return { success: true, message: "Layout already well-aligned" };
    }

    return {
        success: true,
        message: fixedCount + " element(s) gently nudged into alignment"
    };
}

// ─── Y-Axis Alignment ───────────────────────────────────────────────

export function fixVerticalAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    const groups = groupByProximity(
        elements.map((el, i) => ({ index: i, x: el.translation.y })),
        SNAP_THRESHOLD
    );

    let fixedCount = 0;

    groups.forEach(group => {
        if (group.length < MIN_GROUP_SIZE) return;

        const yValues = group.map(g => g.x);
        const medianY = median(yValues);

        group.forEach(g => {
            const el = elements[g.index];
            const distance = Math.abs(el.translation.y - medianY);

            if (distance > 2 && distance <= SNAP_THRESHOLD) {
                el.translation = { x: el.translation.x, y: Math.round(medianY) };
                fixedCount++;
            }
        });
    });

    if (fixedCount === 0) {
        return { success: true, message: "Vertical alignment already good" };
    }

    return {
        success: true,
        message: fixedCount + " element(s) vertically aligned"
    };
}

// ─── Helpers ────────────────────────────────────────────────────────

interface PositionItem { index: number; x: number; }

function groupByProximity(items: PositionItem[], threshold: number): PositionItem[][] {
    const sorted = items.slice().sort((a, b) => a.x - b.x);
    const groups: PositionItem[][] = [];
    let currentGroup: PositionItem[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].x - sorted[i - 1].x <= threshold) {
            currentGroup.push(sorted[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [sorted[i]];
        }
    }
    groups.push(currentGroup);

    return groups;
}

function median(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

// Exported for testing
export { groupByProximity, median };
