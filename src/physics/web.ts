import type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";

export const webRelease = 0.2;
export const webShootDuration = 0.4;
export const webPullDuration = 0.6;
export type WebPose =
  | { clip: "WebShoot"; time: number }
  | { clip: "WebPull"; time: number; lean?: number };

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

export type WebAnchor = NonNullable<ReturnType<typeof webAnchor>>;

const smooth = (t: number) => t * t * (3 - 2 * t);

export function webFlightTime(distance: number) {
  return Math.max(webShootDuration - webRelease, distance / 1500);
}

export function webSwing(
  origin: Body,
  anchor: WebAnchor,
  elapsed: number,
  gravity: number,
  floor: number,
) {
  // A shortening pendulum carries the pet sideways under the anchor. The
  // final reel lifts its feet from below the anchor onto the landing surface.
  const swingTime = Math.min(
    1.45,
    Math.max(0.38, 0.9 * Math.sqrt(anchor.distance / gravity)),
  );
  const progress = Math.min(1, elapsed / swingTime);
  const angle = Math.atan2(origin.x - anchor.x, origin.y - anchor.y);
  const radius = anchor.distance * (1 - 0.82 * smooth(progress));
  const theta = angle * Math.cos((progress * Math.PI) / 2);
  const x = anchor.x + radius * Math.sin(theta);
  const y = anchor.y + radius * Math.cos(theta);
  const reel = smooth(Math.max(0, (progress - 0.58) / 0.42));
  return {
    x: x + (anchor.x - x) * reel,
    y: Math.min(floor, y + (anchor.y - y) * reel),
    arrived: progress === 1,
  };
}

export function webStrand(
  hand: { x: number; y: number },
  anchor: WebAnchor,
  extension: number,
  pullTime: number,
) {
  const x = hand.x + (anchor.x - hand.x) * extension;
  const y = hand.y + (anchor.y - hand.y) * extension;
  const distance = Math.hypot(x - hand.x, y - hand.y);
  const slack = Math.min(86, distance * 0.24) * Math.exp(-4.5 * pullTime);
  const cast = 1 - extension;
  return {
    x,
    y,
    controlX: (hand.x + x) / 2 + slack * 0.2 * cast,
    controlY: (hand.y + y) / 2 + slack * (1 + 0.65 * cast),
  };
}
