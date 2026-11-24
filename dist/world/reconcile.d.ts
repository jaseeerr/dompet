import { type Body, type Bounds } from "../physics/motion.js";
import type { Platform } from "./platform.js";
export declare function carry(body: Body, old: Platform[], next: Platform[], bounds: Bounds, settings?: {
    width: number;
    fullFootprint: boolean;
    height: number;
    speed: number;
    gravity: number;
    jumpSpeed: number;
    terminalSpeed: number;
}): Body;
export declare function sameGeometry(old: Platform[], next: Platform[]): boolean;
