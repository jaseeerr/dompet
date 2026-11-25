import type { DOMPetOptions } from "../index.js";
import { type Clip } from "../characters/tabby.js";
import type { Body } from "../physics/motion.js";
import type { Behaviour } from "../behaviour/explorer.js";
import { type WebPose } from "../physics/web.js";
export declare const seatedSpriteAnchor = 17;
export declare class Animation {
    sit: number;
    web?: WebPose;
    clip: Clip;
    facing: 1 | -1;
    elapsed: number;
    distance: number;
    clock: number;
    heading: number;
    turnProgress: number;
    landingTime: number;
    sleep: number;
    anticipation: number;
    impact: number;
    descent: number;
    gaze: number;
    update(body: Body, wasGrounded: boolean, behaviour: Behaviour | "manual", ms: number, pitch?: number): void;
    get frame(): number;
}
export declare function loadCat(redraw: () => void, failed: () => void, textured?: boolean, character?: DOMPetOptions["character"]): {
    draw(ctx: CanvasRenderingContext2D, animation: Animation, body: Body, size: number, dpr: number): void;
    dispose(): void;
};
