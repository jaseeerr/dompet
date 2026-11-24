import type { Behaviour, Body, ScanOptions } from "./types.js";
export interface DOMPetOptions extends ScanOptions {
    renderer?: "auto" | "sprite" | "webgl";
    character?: "cat";
    speed?: number;
    gravity?: number;
    zIndex?: number;
    respectReducedMotion?: boolean;
    debug?: boolean;
    /** Character size in CSS pixels. */
    size?: number;
}
export type DOMPetState = "new" | "running" | "paused" | "hidden" | "destroyed";
export interface DOMPetEvents {
    statechange: {
        previous: DOMPetState;
        state: DOMPetState;
    };
    landing: {
        platformId: string;
        x: number;
        y: number;
    };
    error: Error;
}
export interface DOMPetMetrics {
    scanMs: number;
    refreshMs: number;
    frameMs: number;
    renderMs: number;
    physicsMs: number;
    navigationMs: number;
    platforms: number;
    graphNodes: number;
    graphEdges: number;
    replans: number;
}
export declare class DOMPet {
    #private;
    get debugMetrics(): Readonly<DOMPetMetrics> | undefined;
    get state(): DOMPetState;
    on<K extends keyof DOMPetEvents>(name: K, listener: (detail: DOMPetEvents[K]) => void): () => void;
    hide(): void;
    show(): void;
    debugExplore(): void;
    debugMove(direction: -1 | 0 | 1): void;
    debugJump(): void;
    debugReset(): void;
    get debugState(): Readonly<Body & {
        behaviour: Behaviour | "manual";
    }> | undefined;
    constructor(options?: DOMPetOptions);
    refresh(): void;
    start(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}
