import { motion, supports, type Body, type Bounds } from "../physics/motion.js";
import type { Platform } from "./platform.js";
export function carry(
  body: Body,
  old: Platform[],
  next: Platform[],
  bounds: Bounds,
  settings = motion,
): Body {
  if (!body.support) return body;
  const before = old.find((p) => p.id === body.support),
    after = next.find((p) => p.id === body.support);
  if (before && after && after.y >= Math.min(bounds.height, settings.height)) {
    const half = Math.min(bounds.width, settings.width) / 2;
    const x =
      body.x + (after.originX ?? after.left) - (before.originX ?? before.left);
    if (
      x >= half &&
      x <= bounds.width - half &&
      supports(after, x, bounds.width, settings)
    )
      return { ...body, x, y: after.y };
  }
  return { ...body, support: null, vy: 0 };
}
export function sameGeometry(old: Platform[], next: Platform[]) {
  return (
    old.length === next.length &&
    old.every((a, i) => {
      const b = next[i];
      return (
        a.id === b.id &&
        a.y === b.y &&
        a.intervals.length === b.intervals.length &&
        a.intervals.every(
          ([l, r], j) => l === b.intervals[j][0] && r === b.intervals[j][1],
        )
      );
    })
  );
}
