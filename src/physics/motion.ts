import type { Body } from "../types.js";
export type { Body } from "../types.js";
import type { Platform } from "../world/platform.js";

export const stepSeconds = 1 / 120;
export const motion = {
  width: 30,
  height: 22,
  speed: 180,
  gravity: 1200,
  jumpSpeed: 480,
  terminalSpeed: 800,
};
export interface Bounds {
  width: number;
  height: number;
}
export interface Intent {
  direction: -1 | 0 | 1;
  jump: boolean;
}

export function spawn(bounds: Bounds): Body {
  return {
    x: Math.min(
      bounds.width / 2,
      Math.max(motion.width / 2, bounds.width * 0.4),
    ),
    y: Math.min(bounds.height, motion.height),
    vx: 0,
    vy: 0,
    support: null,
  };
}
export function supports(platform: Platform, x: number, width: number) {
  const half = Math.min(motion.width, width) / 2;
  return platform.intervals.some(
    ([left, right]) =>
      Math.min(right, x + half) - Math.max(left, x - half) >=
        Math.min(4, half * 2) && right > left,
  );
}

// x is the centre of the body, y is its feet, in viewport CSS pixels.
export function step(
  body: Body,
  intent: Intent,
  platforms: Platform[],
  bounds: Bounds,
  settings = motion,
): Body {
  const { width, height } = bounds;
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return { x: 0, y: 0, vx: 0, vy: 0, support: null };
  if (
    ![body.x, body.y, body.vx, body.vy].every(Number.isFinite) ||
    body.y > height ||
    body.y < 0 ||
    body.x < 0 ||
    body.x > width
  )
    return spawn(bounds);
  const half = Math.min(width, motion.width) / 2;
  const targetX = body.x + intent.direction * settings.speed * stepSeconds;
  const clampX = (value: number) =>
    Math.max(half, Math.min(width - half, value));
  const x = clampX(targetX);
  const vx = x === targetX ? intent.direction * settings.speed : 0;
  const standing = platforms.find(
    (p) =>
      p.id === body.support && p.y === body.y && supports(p, body.x, width),
  );
  if (standing && !intent.jump && supports(standing, x, width))
    return { x, y: standing.y, vx, vy: 0, support: standing.id };
  const initialVy = standing && intent.jump ? -motion.jumpSpeed : body.vy;
  let vy = Math.min(
    motion.terminalSpeed,
    initialVy + settings.gravity * stepSeconds,
  );
  let y = body.y + vy * stepSeconds;
  let landing: Platform | undefined;
  if (vy > 0) {
    for (const p of platforms) {
      if (
        p.y < body.y ||
        p.y > y ||
        p.y < Math.min(height, motion.height) ||
        p.y > height ||
        (landing && p.y >= landing.y)
      )
        continue;
      const fraction = (p.y - body.y) / (y - body.y);
      const crossingX = clampX(body.x + (targetX - body.x) * fraction);
      if (
        supports(p, crossingX, width) &&
        (p.y !== body.y || supports(p, x, width))
      )
        landing = p;
    }
  }
  if (landing)
    return {
      x,
      y: landing.y,
      vx,
      vy: 0,
      support: supports(landing, x, width) ? landing.id : null,
    };
  const ceiling = Math.min(height, motion.height);
  if (y < ceiling) {
    y = ceiling;
    vy = 0;
  }
  if (y > height) return spawn(bounds);
  return { x, y, vx, vy, support: null };
}
