import type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";
export declare const webRelease = 0.2;
export declare const webShootDuration = 0.4;
export declare const webPullDuration = 0.6;
export type WebPose = {
    clip: "WebShoot" | "WebPull";
    time: number;
};
export declare function webAnchor(platform: Platform, origin: Body, footprint: number): {
    x: number;
    y: number;
    distance: number;
} | undefined;
