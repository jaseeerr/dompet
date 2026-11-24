import { type Body, type Bounds, type Intent } from "../physics/motion.js";
import type { Interval, Platform } from "../world/platform.js";
export interface Surface {
    key: string;
    platform: Platform;
    span: Interval;
}
export interface Edge {
    from: Surface;
    to: Surface;
    kind: "walk" | "jump" | "drop";
    takeoff: Interval;
    landing: Interval;
    direction: Intent["direction"];
    ticks: number;
}
export declare class Graph {
    private bounds;
    readonly settings: {
        width: number;
        fullFootprint: boolean;
        height: number;
        speed: number;
        gravity: number;
        jumpSpeed: number;
        terminalSpeed: number;
    };
    edgeCount: number;
    private rows;
    private jobs;
    readonly surfaces: Surface[];
    private byPlatform;
    private cache;
    constructor(platforms: Platform[], bounds: Bounds, settings?: {
        width: number;
        fullFootprint: boolean;
        height: number;
        speed: number;
        gravity: number;
        jumpSpeed: number;
        terminalSpeed: number;
    });
    locate(body: Body): Surface | undefined;
    edges(s: Surface, budget?: {
        trials: number;
    }): Edge[];
    private transitions;
    private trace;
    route(start: Surface, goal: Surface, blocked: ReadonlySet<Edge>, budget?: {
        trials: number;
    }): Edge[];
}
