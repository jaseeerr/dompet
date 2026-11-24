import { expect, it } from "vitest";
import { Explorer } from "../../src/behaviour/explorer";
import { Graph } from "../../src/navigation/graph";
import { step, type Body } from "../../src/physics/motion";
import type { Platform } from "../../src/world/platform";
const bounds = { width: 360, height: 320 };
function platform(
  id: string,
  y: number,
  left: number,
  right: number,
): Platform {
  return { id, y, left, right, source: null, intervals: [[left, right]] };
}
const floor = platform("floor", 320, 0, 360),
  shelf = platform("shelf", 250, 75, 190),
  perch = platform("perch", 185, 145, 162),
  island = platform("island", 40, 270, 315);
const layout = [floor, shelf, perch, island];
const start: Body = { x: 110, y: 320, vx: 0, vy: 0, support: "floor" };
function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
it("routes through intermediate landings to a narrow perch and rejects a disconnected island", () => {
  const g = new Graph(layout, bounds);
  const [a, b, c, d] = g.surfaces;
  expect(g.route(a, c, new Set()).map((e) => e.to)).toEqual([b, c]);
  expect(g.route(a, d, new Set())).toEqual([]);
  const drops = g.edges(b).filter((e) => e.kind === "drop");
  expect(drops.some((e) => e.to === a)).toBe(true);
  for (const e of g.edges(a)) {
    const x = (e.takeoff[0] + e.takeoff[1]) / 2;
    let body = { ...start, x };
    for (let i = 0; i < e.ticks; i++)
      body = step(
        body,
        { direction: e.direction, jump: i === 0 && e.kind === "jump" },
        layout,
        bounds,
      );
    expect(body.support).toBe(e.to.platform.id);
    expect(body.x).toBeGreaterThanOrEqual(e.landing[0] - 1.5);
    expect(body.x).toBeLessThanOrEqual(e.landing[1] + 1.5);
  }
});
it("replays three minutes deterministically with sustained exploration and rest", () => {
  function run() {
    const bot = new Explorer(new Graph(layout, bounds), seeded(9));
    let body = start;
    const states = new Set<string>(),
      visited = new Set<string>(),
      samples = [];
    for (let t = 0; t < 21600; t++) {
      body = step(body, bot.intent(body), layout, bounds);
      if (!Number.isFinite(body.x + body.y)) throw Error("invalid body");
      states.add(bot.state);
      if (body.support) visited.add(body.support);
      if (t % 120 === 0) samples.push([body.x, body.y, bot.state]);
    }
    return { states, visited, samples };
  }
  const a = run();
  expect(a).toEqual(run());
  expect(a.visited).toEqual(new Set(["floor", "shelf", "perch"]));
  for (const s of ["idle", "walk", "prepare-jump", "jump", "fall", "sleep"])
    expect(a.states.has(s)).toBe(true);
  expect(new Set(a.samples.slice(-20).map((v) => v[0])).size).toBeGreaterThan(
    2,
  );
});
it("rests and strolls on an isolated platform without launching failed jumps", () => {
  const bot = new Explorer(new Graph([floor, island], bounds), seeded(22));
  let body = start;
  const states = new Set<string>();
  for (let i = 0; i < 6000; i++) {
    const intent = bot.intent(body);
    if (intent.jump) throw Error("unreachable target selected");
    body = step(body, intent, [floor, island], bounds);
    states.add(bot.state);
  }
  expect(states).toEqual(new Set(["idle", "sleep", "walk"]));
});
it("walks across adjacent edges and caps failed transfers to a destination", () => {
  const left = platform("left", 250, 0, 100),
    right = platform("right", 250, 103, 180);
  const walking = new Graph([left, right], bounds);
  expect(
    walking
      .edges(walking.surfaces[0])
      .some((e) => e.to === walking.surfaces[1] && e.kind === "walk"),
  ).toBe(true);
  const bot = new Explorer(new Graph([floor, shelf], bounds), seeded(1));
  let body = start,
    jumps = 0,
    recovered = false;
  for (let t = 0; t < 10000; t++) {
    const intent = bot.intent(body);
    if (intent.jump) jumps++;
    // The target vanishes before physics can land on it.
    body = step(body, intent, [floor], bounds);
    if (bot.state === "recover") recovered = true;
  }
  expect(recovered).toBe(true);
  expect(jumps).toBe(2);
});
