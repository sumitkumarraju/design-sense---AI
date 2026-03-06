import { editor, colorUtils, constants } from "express-document-sdk";

// ─── K-Means Alignment Fixer ────────────────────────────────────────
// Groups X positions into clusters (grid columns) and snaps each
// element to the nearest cluster center.

export function fixAlignment(): { success: boolean; message: string } {
    const page = editor.context.insertionParent;
    if (!page) return { success: false, message: "No page found" };

    const elements: any[] = [...page.children.toArray()];
    if (elements.length < 2) return { success: false, message: "Need at least 2 elements" };

    const xPositions = elements.map(el => el.translation.x);
    const k = Math.min(4, Math.max(1, detectColumnCount(xPositions)));
    const centers = kMeansClusters(xPositions, k);

    let fixedCount = 0;
    elements.forEach(el => {
        const nearestCenter = findNearest(el.translation.x, centers);
        if (Math.abs(el.translation.x - nearestCenter) > 5) {
            el.translation = { x: nearestCenter, y: el.translation.y };
            fixedCount++;
        }
    });

    return {
        success: true,
        message: fixedCount + " element(s) snapped to " + k + " column grid"
    };
}

// ─── Helpers ────────────────────────────────────────────────────────

export function detectColumnCount(positions: number[]): number {
    const sorted = [...new Set(positions.map(p => Math.round(p / 10) * 10))].sort((a, b) => a - b);
    if (sorted.length <= 1) return 1;

    let groups = 1;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] > 50) groups++;
    }
    return groups;
}

export function kMeansClusters(values: number[], k: number): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    let centers: number[] = [];
    for (let i = 0; i < k; i++) {
        centers.push(min + (max - min) * (i / Math.max(k - 1, 1)));
    }

    for (let iter = 0; iter < 10; iter++) {
        const buckets: number[][] = centers.map(() => []);

        values.forEach(v => {
            let bestIdx = 0;
            let bestDist = Math.abs(v - centers[0]);
            for (let i = 1; i < centers.length; i++) {
                const dist = Math.abs(v - centers[i]);
                if (dist < bestDist) { bestDist = dist; bestIdx = i; }
            }
            buckets[bestIdx].push(v);
        });

        centers = buckets.map((bucket, i) => {
            if (bucket.length === 0) return centers[i];
            return Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length);
        });
    }

    return centers;
}

export function findNearest(value: number, centers: number[]): number {
    let best = centers[0];
    let bestDist = Math.abs(value - centers[0]);
    for (let i = 1; i < centers.length; i++) {
        const dist = Math.abs(value - centers[i]);
        if (dist < bestDist) { bestDist = dist; best = centers[i]; }
    }
    return best;
}
