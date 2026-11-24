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

// Earlier surfaces own their shared portion. Keep the rest of each edge.
export function subtract(
  intervals: Interval[],
  [left, right]: Interval,
): Interval[] {
  return intervals.flatMap(([a, b]): Interval[] => {
    if (b <= left || a >= right) return [[a, b]];
    const remaining: Interval[] = [];
    if (a < left) remaining.push([a, left]);
    if (b > right) remaining.push([right, b]);
    return remaining;
  });
}
