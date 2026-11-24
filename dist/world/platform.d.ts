export type Interval = [left: number, right: number];
export interface Platform {
    id: string;
    left: number;
    right: number;
    y: number;
    originX?: number;
    source: Element | null;
    intervals: Interval[];
}
export interface Snapshot {
    platforms: Platform[];
    candidates: number;
    rejected: Record<string, number>;
}
export declare function subtract(intervals: Interval[], [left, right]: Interval): Interval[];
