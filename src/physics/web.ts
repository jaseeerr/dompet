import type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";

export const webRelease = 0.2;
export const webShootDuration = 0.4;
export const webPullDuration = 0.6;
export type WebPose = { clip: "WebShoot" | "WebPull"; time: number };

export function webAnchor(platform: Platform, origin: Body, footprint: number) {
  let nearest: { x: number; y: number; distance: number } | undefined;
  const half = footprint / 2;
  for (const [left, right] of platform.intervals) {
    if (right - left < footprint) continue;
    const x = Math.max(left + half, Math.min(right - half, origin.x));
    const distance = Math.hypot(x - origin.x, platform.y - origin.y);
    if (!nearest || distance < nearest.distance)
      nearest = { x, y: platform.y, distance };
  }
  return nearest;
}
