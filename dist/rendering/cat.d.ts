import { type Clip } from "../characters/tabby.js";
import type { Body } from "../physics/motion.js";
import type { Behaviour } from "../behaviour/explorer.js";
export declare class Animation {
    clip: Clip;
    facing: 1 | -1;
    elapsed: number;
    distance: number;
    clock: number;
    heading: number;
    sleep: number;
    anticipation: number;
    impact: number;
    descent: number;
    gaze: number;
    update(body: Body, wasGrounded: boolean, behaviour: Behaviour | "manual", ms: number, pitch?: number): void;
    get frame(): number;
}
export declare function loadCat(redraw: () => void, failed: () => void): {
    draw(ctx: CanvasRenderingContext2D, animation: Animation, body: Body, size: number, dpr: number): void;
    dispose(): void;
};
