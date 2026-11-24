import { expect, it } from "vitest";
import {
  step,
  spawn,
  motion,
  stepSeconds,
  type Body,
} from "../../src/physics/motion";
import { playback } from "../../src/playback";
import type { Platform } from "../../src/world/platform";

const bounds = { width: 400, height: 300 };
function platform(id: string, y: number, left = 0, right = 400): Platform {
  return { id, y, left, right, intervals: [[left, right]], source: null };
}
const floor = platform("floor", 300);
const idle = { direction: 0, jump: false } as const;
const grounded: Body = { x: 100, y: 300, vx: 0, vy: 0, support: "floor" };
it("integrates gravity and passes up through an edge before landing on it", () => {
  const ledge = platform("ledge", 245);
  let body = step(grounded, { ...idle, jump: true }, [floor, ledge], bounds);
  expect(body.vy).toBe(-470);
  expect(body.y).toBeCloseTo(300 - 470 * stepSeconds);
  let apex = body.y;
  for (let i = 0; i < 150; i++) {
    body = step(body, idle, [floor, ledge], bounds);
    apex = Math.min(apex, body.y);
  }
  expect(apex).toBeCloseTo(206);
  expect(body.y).toBe(245);
  expect(body.support).toBe("ledge");
});
it("sweeps the visible intervals at crossing time and takes the earliest landing", () => {
  const start = { ...grounded, x: 100, y: 100, vy: 900, support: null };
  const upper = platform("upper", 101, 111.5, 160),
    lower = platform("lower", 105);
  expect(
    step(start, { direction: 1, jump: false }, [lower, upper], bounds).support,
  ).toBe("lower");
  upper.intervals = [
    [0, 50],
    [108, 160],
  ];
  expect(
    step(start, { direction: 1, jump: false }, [lower, upper], bounds).support,
  ).toBe("upper");
  expect(step(start, idle, [], bounds).vy).toBe(motion.terminalSpeed);
});
it("walks off an edge, releases a removed support and stays inside the walls", () => {
  const ledge = platform("perch", 150, 0, 100);
  const body = { ...grounded, x: 111, y: 150, support: "perch" };
  const falling = step(body, { direction: 1, jump: false }, [ledge], bounds);
  expect(falling.support).toBeNull();
  expect(falling.y).toBeGreaterThan(150);
  expect(step(body, idle, [], bounds).vy).toBeGreaterThan(0);
  expect(
    step(
      { ...grounded, x: 15 },
      { direction: -1, jump: false },
      [floor],
      bounds,
    ).x,
  ).toBe(15);
});
it("recovers from invalid state, invalid bounds and an empty world", () => {
  expect(step({ ...grounded, x: NaN }, idle, [], bounds)).toEqual(
    spawn(bounds),
  );
  expect(step(grounded, idle, [], bounds)).toEqual(spawn(bounds));
  expect(step(grounded, idle, [], { width: NaN, height: 0 })).toEqual({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    support: null,
  });
});
function replay(times: number[]) {
  let body = spawn(bounds),
    steps = 0;
  let frame: FrameRequestCallback = () => {};
  const loop = playback(
    {
      request: (cb) => {
        frame = cb;
        return 0;
      },
      cancel: () => {},
    },
    () => 0,
    () => {},
    () => {
      body = step(body, { direction: -1, jump: false }, [floor], bounds);
      steps++;
    },
  );
  loop.resume();
  frame(0);
  for (const t of times) frame(t);
  loop.pause();
  return { steps, body };
}
it("matches 30, 60 and 120 Hz rendering and bounds work after a stall", () => {
  const run = (hz: number) =>
    replay(Array.from({ length: hz / 2 }, (_, i) => ((i + 1) * 1000) / hz));
  expect(run(30).steps).toBe(60);
  expect(run(30)).toEqual(run(60));
  expect(run(60)).toEqual(run(120));
  expect(replay([0]).steps).toBe(0);
  expect(replay([60000]).steps).toBe(8);
});
