import {
  motion,
  step,
  stepSeconds,
  type Body,
  type Bounds,
  type Intent,
} from "../physics/motion.js";
import type { Interval, Platform } from "../world/platform.js";

export interface Surface {
  key: string;
  platform: Platform;
  span: Interval;
}
export interface Edge {
  from: Surface;
  to: Surface;
  kind: "walk" | "jump" | "drop";
  takeoff: Interval;
  landing: Interval;
  direction: Intent["direction"];
  ticks: number;
}

export class Graph {
  edgeCount = 0;
  private rows = new Map<number, Platform[]>();
  private jobs = new Map<
    Surface,
    { trials: Generator<Edge | undefined>; found: Edge[] }
  >();
  readonly surfaces: Surface[] = [];
  private byPlatform = new Map<string, Surface[]>();
  private cache = new Map<Surface, Edge[]>();
  constructor(
    platforms: Platform[],
    private bounds: Bounds,
    readonly settings = motion,
  ) {
    const half = Math.min(this.settings.width, bounds.width) / 2;
    for (const platform of platforms) {
      if (
        platform.y < Math.min(this.settings.height, bounds.height) ||
        platform.y > bounds.height
      )
        continue;
      // A descending body can cross at most one terminal-speed step below its feet.
      const first = Math.floor(
        (platform.y - motion.terminalSpeed * stepSeconds) / 64,
      );
      const last = Math.floor(platform.y / 64);
      for (let row = first; row <= last; row++) {
        const entries = this.rows.get(row) ?? [];
        entries.push(platform);
        this.rows.set(row, entries);
      }
      const surfaces: Surface[] = [];
      for (const [i, [a, b]] of platform.intervals.entries()) {
        const span: Interval = [
          Math.max(a + (settings.fullFootprint ? half : 0), half),
          Math.min(
            b - (settings.fullFootprint ? half : 0),
            bounds.width - half,
          ),
        ];
        if (span[0] > span[1]) continue;
        surfaces.push({ platform, key: platform.id + "/" + i, span });
      }
      this.surfaces.push(...surfaces);
      this.byPlatform.set(platform.id, surfaces);
    }
  }
  locate(body: Body): Surface | undefined {
    if (!body.support) return;
    // The collision engine allows a small foot overhang at either edge.
    let best: Surface | undefined,
      distance = Infinity;
    for (const s of this.byPlatform.get(body.support) ?? []) {
      const d = Math.max(0, s.span[0] - body.x, body.x - s.span[1]);
      if (d < distance && d <= this.settings.width / 2) {
        best = s;
        distance = d;
      }
    }
    return best;
  }
  edges(s: Surface, budget?: { trials: number }): Edge[] {
    const cached = this.cache.get(s);
    if (cached) return cached;
    let job = this.jobs.get(s);
    if (!job) {
      job = { trials: this.transitions(s), found: [] };
      this.jobs.set(s, job);
    }
    while (!budget || budget.trials > 0) {
      if (budget) budget.trials--;
      const result = job.trials.next();
      if (result.done) {
        this.jobs.delete(s);
        this.cache.set(s, job.found);
        this.edgeCount += job.found.length;
        return job.found;
      }
      if (result.value) job.found.push(result.value);
    }
    return [];
  }
  private *transitions(s: Surface): Generator<Edge | undefined> {
    const limit = Math.min(
      1200,
      Math.ceil(
        (2 +
          (motion.jumpSpeed + motion.terminalSpeed) / this.settings.gravity +
          this.bounds.height / motion.terminalSpeed) /
          stepSeconds,
      ),
    );
    const [left, right] = s.span;
    const count = Math.min(24, Math.max(1, Math.ceil((right - left) / 36)));
    for (let i = 0; i <= count; i++) {
      const x = left + ((right - left) * i) / count;
      for (const direction of [-1, 0, 1] as const) {
        yield this.trace(s, x, direction, true, limit);
        if ((i === 0 && direction === -1) || (i === count && direction === 1)) {
          yield this.trace(s, x, direction, false, limit);
        }
      }
    }
  }
  private trace(
    s: Surface,
    x: number,
    direction: Intent["direction"],
    jump: boolean,
    limit: number,
  ): Edge | undefined {
    const stride = this.settings.speed * stepSeconds;
    let body: Body = {
      x,
      y: s.platform.y,
      vx: 0,
      vy: 0,
      support: s.platform.id,
    };
    let airborne = false;
    for (let ticks = 1; ticks <= limit; ticks++) {
      const previous = body;
      body = step(
        body,
        { direction, jump: jump && ticks === 1 },
        this.rows.get(Math.floor(body.y / 64)) ?? [],
        this.bounds,
        this.settings,
      );
      if (!body.support) {
        airborne = true;
        continue;
      }
      const to = this.locate(body);
      if (to !== s) {
        if (!to) return;
        const margin =
          jump || airborne || this.settings.fullFootprint
            ? 0
            : this.settings.width / 2 - 4;
        const left = Math.max(to.span[0] - margin, body.x - stride),
          right = Math.min(to.span[1] + margin, body.x + stride);
        if (right < left) return;
        return {
          from: s,
          to,
          kind: jump ? "jump" : airborne ? "drop" : "walk",
          direction,
          ticks,
          takeoff: [x - stride / 2, x + stride / 2],
          landing: [left, right],
        };
      }
      if (airborne || previous.x === body.x) return;
    }
  }
  route(
    start: Surface,
    goal: Surface,
    blocked: ReadonlySet<Edge>,
    budget?: { trials: number },
  ): Edge[] {
    const open = new Set([start]),
      cost = new Map([[start, 0]]),
      parent = new Map<Surface, Edge>();
    const score = (s: Surface) =>
      cost.get(s)! +
      Math.abs(s.platform.y - goal.platform.y) / motion.terminalSpeed;
    let expanded = 0;
    while (open.size && (!budget || (budget.trials > 0 && expanded++ < 24))) {
      let current: Surface | undefined;
      for (const s of open)
        if (!current || score(s) < score(current)) current = s;
      if (!current) break;
      if (current === goal) {
        const path: Edge[] = [];
        for (let e = parent.get(goal); e; e = parent.get(e.from)) path.push(e);
        return path.reverse();
      }
      open.delete(current);
      for (const e of this.edges(current, budget)) {
        if (blocked.has(e)) continue;
        const arrival = parent.get(current)?.landing ?? current.span;
        const approach =
          Math.abs(
            (arrival[0] + arrival[1] - e.takeoff[0] - e.takeoff[1]) / 2,
          ) / this.settings.speed;
        const next = cost.get(current)! + approach + e.ticks * stepSeconds;
        if (next >= (cost.get(e.to) ?? Infinity)) continue;
        cost.set(e.to, next);
        parent.set(e.to, e);
        open.add(e.to);
      }
    }
    return [];
  }
}
