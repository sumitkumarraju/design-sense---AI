import { editor } from "express-document-sdk";

// ─── Alignment Fixer ────────────────────────────────────────────────
// PHILOSOPHY: Only fix elements that are ALMOST aligned but off by a
// few pixels. Never move elements that are intentionally at different
// positions. This prevents destroying multi-column layouts.
//
// Algorithm:
// 1. For each pair of elements, check if X positions are within 10px
// 2. If yes → snap to the position that more elements share
// 3. Same for Y positions (horizontal rows)
// 4. Result: subtle corrections, never layout destruction

const NEAR_MISS_THRESHOLD = 10; // Only fix if within 10px of another element

export function fixAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    let fixedCount = 0;

    // Step 1: Fix X-axis near-misses (vertical column alignment)
    fixedCount += fixAxisNearMisses(elements, "x");

    // Step 2: Fix Y-axis near-misses (horizontal row alignment)
    fixedCount += fixAxisNearMisses(elements, "y");

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) snapped to nearest neighbor"
            : "All elements are already well-aligned"
    };
}

export function fixVerticalAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements = page.children.toArray() as any[];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    const fixedCount = fixAxisNearMisses(elements, "y");

    return {
        success: true,
        message: fixedCount > 0
            ? fixedCount + " element(s) vertically aligned"
            : "Vertical alignment already good"
    };
}

// ─── Core: Fix Near-Misses on One Axis ──────────────────────────────

function fixAxisNearMisses(elements: any[], axis: "x" | "y"): number {
    // Collect all positions on this axis
    const positions: { index: number; pos: number }[] = elements.map((el, i) => ({
        index: i,
        pos: axis === "x" ? el.translation.x : el.translation.y
    }));

    // Sort by position
    positions.sort((a, b) => a.pos - b.pos);

    // Find groups of nearly-aligned elements (within threshold)
    const groups: typeof positions[] = [];
    let currentGroup = [positions[0]];

    for (let i = 1; i < positions.length; i++) {
        if (positions[i].pos - currentGroup[0].pos <= NEAR_MISS_THRESHOLD) {
            currentGroup.push(positions[i]);
        } else {
            if (currentGroup.length >= 2) groups.push(currentGroup);
            currentGroup = [positions[i]];
        }
    }
    if (currentGroup.length >= 2) groups.push(currentGroup);

    // For each group, snap all to the most common position (mode)
    let fixedCount = 0;

    groups.forEach(group => {
        // Find the position that most elements share (mode)
        const posCount = new Map<number, number>();
        group.forEach(item => {
            const rounded = Math.round(item.pos);
            posCount.set(rounded, (posCount.get(rounded) || 0) + 1);
        });

        let targetPos = group[0].pos;
        let maxCount = 0;
        posCount.forEach((count, pos) => {
            if (count > maxCount) {
                maxCount = count;
                targetPos = pos;
            }
        });

        // Snap elements that aren't at the target
        group.forEach(item => {
            const el = elements[item.index];
            const diff = Math.abs(item.pos - targetPos);

            if (diff > 1 && diff <= NEAR_MISS_THRESHOLD) {
                if (axis === "x") {
                    el.translation = { x: Math.round(targetPos), y: el.translation.y };
                } else {
                    el.translation = { x: el.translation.x, y: Math.round(targetPos) };
                }
                fixedCount++;
            }
        });
    });

    return fixedCount;
}
