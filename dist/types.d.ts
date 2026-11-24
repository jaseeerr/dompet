export interface ScanOptions {
    include?: string[];
    exclude?: string[];
    exclusionZones?: string[];
    minPlatformWidth?: number;
}
export interface Body {
    x: number;
    y: number;
    vx: number;
    vy: number;
    support: string | null;
}
export type Behaviour = "idle" | "walk" | "prepare-jump" | "jump" | "fall" | "sleep" | "recover";
