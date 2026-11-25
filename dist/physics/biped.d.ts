import type { Body, Intent } from "./motion.js";
export declare const standingHeight = 2.15767;
export declare const strideMetres = 0.82;
export declare const walkSpeed: (height: number, multiplier: number) => number;
export declare class BipedMovement {
    private turnSeconds;
    private landSeconds;
    facing: -1 | 1;
    heading: number;
    turnProgress: number;
    landingTime: number;
    private pending?;
    constructor(turnSeconds: number, landSeconds: number);
    invalidate(): void;
    intent(body: Body, next: () => Intent, dt: number, manual?: Intent, fleeing?: boolean): Intent;
    landed(): void;
}
