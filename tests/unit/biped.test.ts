import { expect, it, vi } from "vitest";
import { BipedMovement, walkSpeed } from "../../src/physics/biped";
import { motion, step, stepSeconds } from "../../src/physics/motion";

const body = { x: 100, y: 300, vx: 0, vy: 0, support: "floor" };
const left = { direction: -1, jump: false } as const;

it.each([88, 112, 180])(
  "walks one authored cycle per second at %i CSS px",
  (height) => {
    const settings = { ...motion, speed: walkSpeed(height, 1), airSpeed: 180 };
    const floor = {
      id: "floor",
      y: 300,
      left: 0,
      right: 500,
      source: null,
      intervals: [[0, 500] as [number, number]],
    };
    let next = { ...body };
    for (let i = 0; i < 120; i++)
      next = step(
        next,
        { direction: 1, jump: false },
        [floor],
        { width: 500, height: 300 },
        settings,
      ) as typeof body;
    expect(((next.x - body.x) / height) * 2.15767).toBeCloseTo(0.82, 7);
    expect(
      step(
        next,
        { direction: 1, jump: true },
        [floor],
        { width: 500, height: 300 },
        settings,
      ).vx,
    ).toBe(180);
  },
);

it("plants a full turn and landing without consuming the queued planner command", () => {
  const gait = new BipedMovement(1.75, 1.02),
    next = vi.fn(() => left);
  gait.landed();
  for (let i = 0; i < 123; i++)
    expect(gait.intent(body, next, stepSeconds).direction).toBe(0);
  expect(next).not.toHaveBeenCalled();
  expect(gait.intent(body, next, stepSeconds).direction).toBe(0);
  for (let i = 0; i < 210; i++)
    expect(gait.intent(body, next, stepSeconds).direction).toBe(0);
  expect(gait.heading).toBeCloseTo(1, 7);
  for (let i = 0; gait.turnProgress < 1 && i < 2; i++)
    gait.intent(body, next, stepSeconds);
  expect(gait.intent(body, next, stepSeconds)).toEqual(left);
  expect(next).toHaveBeenCalledTimes(1);
});
