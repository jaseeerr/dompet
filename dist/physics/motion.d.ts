import type { Body } from "../types.js";
export type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";
export declare const stepSeconds: number;
export declare const motion: {
    width: number;
    fullFootprint: boolean;
    height: number;
    speed: number;
    airSpeed: number;
    gravity: number;
    jumpSpeed: number;
    terminalSpeed: number;
};
export interface Bounds {
    width: number;
    height: number;
}
export interface Intent {
    direction: -1 | 0 | 1;
    jump: boolean;
}
export declare function spawn(bounds: Bounds, settings?: {
    width: number;
    fullFootprint: boolean;
    height: number;
    speed: number;
    airSpeed: number;
    gravity: number;
    jumpSpeed: number;
    terminalSpeed: number;
}): Body;
export declare function supports(platform: Platform, x: number, width: number, settings?: {
    width: number;
    fullFootprint: boolean;
    height: number;
    speed: number;
    airSpeed: number;
    gravity: number;
    jumpSpeed: number;
    terminalSpeed: number;
}): boolean;
export declare function step(body: Body, intent: Intent, platforms: Platform[], bounds: Bounds, settings?: {
    width: number;
    fullFootprint: boolean;
    height: number;
    speed: number;
    airSpeed: number;
    gravity: number;
    jumpSpeed: number;
    terminalSpeed: number;
}): Body;
