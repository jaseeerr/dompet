import type { ScanOptions } from "../types.js";
export type { ScanOptions } from "../types.js";
import { type Snapshot } from "../world/platform.js";
export declare class Scanner {
    private ids;
    private next;
    private minimum;
    private include;
    private exclude;
    private zoneSelector;
    zones: DOMRect[];
    roots: Set<Element>;
    constructor(options: ScanOptions);
    scan(doc: Document, footprint?: number): Snapshot;
}
