import { expect, test } from "vitest";
import { webFlightTime, webStrand, webSwing } from "../../src/physics/web.js";

const origin = { x: 100, y: 660, vx: 0, vy: 0, support: "floor" };
const anchor = { x: 800, y: 300, distance: Math.hypot(700, 360) };

test("long casts take longer and the web sags before tightening", () => {
  expect(webFlightTime(anchor.distance)).toBeGreaterThan(webFlightTime(100));
  const hand = { x: 100, y: 580 };
  const extended = webStrand(hand, anchor, 1, 0);
  expect(extended).toMatchObject({ x: anchor.x, y: anchor.y });
  expect(extended.controlY).toBeGreaterThan((hand.y + anchor.y) / 2);
  expect(webStrand(hand, anchor, 1, 0.6).controlY).toBeLessThan(
    extended.controlY,
  );
});

test("long swings travel along an arc and settle on the landing surface", () => {
  const early = webSwing(origin, anchor, 0.18, 1200, origin.y);
  const lineY = origin.y + ((early.x - origin.x) / 700) * (anchor.y - origin.y);
  expect(early.x).toBeGreaterThan(origin.x);
  expect(early.y).toBeGreaterThan(lineY);
  expect(early.y).toBeLessThanOrEqual(origin.y);
  expect(webSwing(origin, anchor, 2, 1200, origin.y)).toEqual({
    x: anchor.x,
    y: anchor.y,
    arrived: true,
  });
});
