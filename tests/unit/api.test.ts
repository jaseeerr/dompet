import { expect, it } from "vitest";
import { DOMPet, type DOMPetOptions } from "../../src";
import { motion, step } from "../../src/physics/motion";
it("validates constructor inputs without browser globals", () => {
  for (const options of [
    { character: "fox" },
    { speed: 0 },
    { speed: Infinity },
    { gravity: -1 },
    { size: NaN },
    { minPlatformWidth: 0 },
    { zIndex: 1.3 },
    { exclude: "div" },
    { include: [""] },
    { debug: 1 },
    { respectReducedMotion: "false" },
  ])
    expect(() => new DOMPet(options as DOMPetOptions)).toThrow();
  expect(
    new DOMPet({
      character: "cat",
      size: 48,
      speed: 2,
      gravity: 900,
      zIndex: -1,
      debug: false,
      respectReducedMotion: false,
    }).state,
  ).toBe("new");
});
it("applies configured horizontal velocity and gravity to a physics tick", () => {
  const b = step(
    { x: 100, y: 100, vx: 0, vy: 0, support: null },
    { direction: 1, jump: false },
    [],
    { width: 400, height: 400 },
    { ...motion, speed: 360, gravity: 600 },
  );
  expect([b.x, b.vx, b.vy]).toEqual([103, 360, 5]);
});

it("plans jumps with the configured gravity", async () => {
  const { Graph } = await import("../../src/navigation/graph");
  const base = {
    source: null,
    left: 0,
    right: 240,
    intervals: [[0, 240] as [number, number]],
  };
  const platforms = [
    { ...base, id: "floor", y: 220 },
    { ...base, id: "shelf", y: 155 },
  ];
  for (const [gravity, reachable] of [
    [1200, true],
    [4800, false],
  ] as const) {
    const graph = new Graph(
      platforms,
      { width: 240, height: 220 },
      { ...motion, gravity },
    );
    expect(
      graph
        .edges(graph.surfaces[0])
        .some((edge) => edge.to.platform.id === "shelf"),
    ).toBe(reachable);
  }
});
