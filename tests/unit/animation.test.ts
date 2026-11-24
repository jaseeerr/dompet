import { expect, it } from "vitest";
import { Animation } from "../../src/rendering/cat";
import { DOMPet } from "../../src";
import type { Body } from "../../src/physics/motion";
const body: Body = { x: 100, y: 100, vx: 0, vy: 0, support: "floor" };
it("selects grounded and airborne clips, preserves facing and plays landing once", () => {
  const a = new Animation();
  a.update({ ...body, vx: -10 }, true, "walk", 10);
  expect([a.clip, a.frame, a.facing]).toEqual(["walk", 3, -1]);
  a.update({ ...body, vx: -10 }, true, "walk", 90);
  expect(a.frame).toBe(4);
  a.update({ ...body, vx: 10 }, true, "walk", 270);
  expect([a.frame, a.facing]).toEqual([3, 1]);
  a.update({ ...body, support: null, vy: -100 }, true, "jump", 10);
  expect(a.clip).toBe("jump");
  a.update({ ...body, support: null, vy: -30 }, false, "jump", 1000);
  expect(a.frame).toBe(8);
  a.update({ ...body, support: null, vy: 100 }, false, "fall", 10);
  expect(a.clip).toBe("fall");
  a.update(body, false, "idle", 10);
  expect(a.frame).toBe(11);
  a.update(body, true, "idle", 100);
  expect(a.frame).toBe(12);
  a.update(body, true, "idle", 25);
  a.update(body, true, "idle", 1);
  expect(a.clip).toBe("idle");
  a.update(body, true, "sleep", 1);
  a.update(body, true, "sleep", 850);
  expect(a.frame).toBe(14);
  a.update(body, true, "sleep", 1050);
  expect(a.frame).toBe(13);
});
it("rejects unusable visual sizes during SSR-safe construction", () => {
  for (const size of [0, -1, NaN, Infinity])
    expect(() => new DOMPet({ size })).toThrow(RangeError);
});
