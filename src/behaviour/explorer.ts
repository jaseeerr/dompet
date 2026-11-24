import type { Behaviour } from "../types.js";
export type { Behaviour } from "../types.js";
import { Graph, type Edge, type Surface } from "../navigation/graph.js";
import { stepSeconds, type Body, type Intent } from "../physics/motion.js";
const still: Intent = { direction: 0, jump: false };
export class Explorer {
  plans = 0;
  private targets: Surface[] = [];
  state: Behaviour = "idle";
  private wait = 180;
  private path: Edge[] = [];
  private launched = 0;
  private previousDistance = Infinity;
  private stroll: number | undefined;
  private visits = new Map<string, number>();
  private failures = new Map<string, number>();
  private blocked = new Set<Edge>();
  constructor(
    private graph: Graph,
    private random: () => number = Math.random,
  ) {}
  lookPitch(body: Body): number {
    const next = this.path[0];
    if (!next || !body.support) return 0;
    const dx = Math.abs((next.landing[0] + next.landing[1]) / 2 - body.x);
    return Math.max(
      -0.22,
      Math.min(0.22, Math.atan2(body.y - next.to.platform.y, Math.max(1, dx))),
    );
  }
  private rest() {
    this.state = this.random() < 0.18 ? "sleep" : "idle";
    this.wait = Math.round(
      (this.state === "sleep" ? 260 : 45) + this.random() * 140,
    );
  }
  private fail(edge: Edge) {
    const key = edge.from.key + ">" + edge.to.key;
    const count = (this.failures.get(key) ?? 0) + 1;
    this.failures.set(key, count);
    this.blocked.add(edge);
    if (count >= 2)
      for (const alternative of this.graph.edges(edge.from)) {
        if (alternative.to === edge.to) this.blocked.add(alternative);
      }
    this.path = [];
    this.launched = 0;
    this.previousDistance = Infinity;
    this.state = "recover";
    this.wait = 45;
  }
  private plan(surface: Surface, body: Body) {
    if (!this.targets.length) {
      this.plans++;
      this.targets = this.graph.surfaces
        .filter((s) => s !== surface)
        .map((s) => ({
          s,
          rank: (this.visits.get(s.key) ?? 0) + this.random(),
        }))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 8)
        .map((entry) => entry.s);
    }
    const budget = { trials: 6 };
    while (this.targets.length) {
      const path = this.graph.route(
        surface,
        this.targets[0],
        this.blocked,
        budget,
      );
      if (path.length) {
        this.path = path;
        this.targets = [];
        return;
      }
      if (!budget.trials) return;
      this.targets.shift();
    }
    const [a, b] = surface.span;
    const target = a + this.random() * (b - a);
    if (Math.abs(target - body.x) > 4) this.stroll = target;
    else this.rest();
  }
  intent(body: Body): Intent {
    const here = this.graph.locate(body);
    let edge = this.path[0];
    if (edge && this.launched) {
      if (here === edge.to) {
        this.visits.set(here.key, (this.visits.get(here.key) ?? 0) + 1);
        this.path.shift();
        this.launched = 0;
        if (!this.path.length) this.rest();
      } else if (
        (body.support && here !== edge.from) ||
        this.launched > edge.ticks + 12
      ) {
        this.fail(edge);
        return still;
      } else {
        this.launched++;
        this.state = body.support ? "walk" : body.vy < 0 ? "jump" : "fall";
        return { direction: edge.direction, jump: false };
      }
    }
    if (!here) {
      this.state = body.vy < 0 ? "jump" : "fall";
      return still;
    }
    if (this.wait > 0) {
      this.wait--;
      if (this.state === "fall" || this.state === "jump") this.state = "idle";
      return still;
    }
    if (!this.path.length && this.stroll === undefined) this.plan(here, body);
    edge = this.path[0];
    if (!edge && this.stroll === undefined) return still;
    if (edge && edge.from !== here) {
      this.fail(edge);
      return still;
    }
    const target = edge
      ? (edge.takeoff[0] + edge.takeoff[1]) / 2
      : this.stroll!;
    const distance = Math.abs(target - body.x);
    if (distance > (this.graph.settings.speed * stepSeconds) / 2 + 1e-7) {
      if (distance >= this.previousDistance) {
        if (edge) this.fail(edge);
        else {
          this.stroll = undefined;
          this.rest();
        }
        this.previousDistance = Infinity;
        return still;
      }
      this.previousDistance = distance;
      this.state = "walk";
      return { direction: target > body.x ? 1 : -1, jump: false };
    }
    this.previousDistance = Infinity;
    if (!edge) {
      this.stroll = undefined;
      this.rest();
      return still;
    }
    if (edge.kind === "jump" && this.state !== "prepare-jump") {
      this.state = "prepare-jump";
      this.wait = 12;
      return still;
    }
    this.launched = 1;
    this.state = edge.kind === "jump" ? "jump" : "walk";
    return { direction: edge.direction, jump: edge.kind === "jump" };
  }
}
