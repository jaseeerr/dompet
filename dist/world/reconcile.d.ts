import { type Body, type Bounds } from "../physics/motion.js";
import type { Platform } from "./platform.js";
export declare function carry(body: Body, old: Platform[], next: Platform[], bounds: Bounds): Body;
export declare function sameGeometry(old: Platform[], next: Platform[]): boolean;
