import type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";
export declare const webRelease = 0.2;
export declare const webShootDuration = 0.4;
export declare const webPullDuration = 0.6;
export type WebPose = {
    clip: "WebShoot";
    time: number;
} | {
    clip: "WebPull";
    time: number;
    lean?: number;
};
export declare function webAnchor(platform: Platform, origin: Body, footprint: number): {
    x: number;
    y: number;
    distance: number;
} | undefined;
export type WebAnchor = NonNullable<ReturnType<typeof webAnchor>>;
export declare function webFlightTime(distance: number): number;
export declare function webSwing(origin: Body, anchor: WebAnchor, elapsed: number, gravity: number, floor: number): {
    x: number;
    y: number;
    arrived: boolean;
};
export declare function webStrand(hand: {
    x: number;
    y: number;
}, anchor: WebAnchor, extension: number, pullTime: number): {
    x: number;
    y: number;
    controlX: number;
    controlY: number;
};
