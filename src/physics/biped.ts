import type { Body, Intent } from "./motion.js";

export const standingHeight = 2.15767;
export const strideMetres = 0.82;
export const walkSpeed = (height: number, multiplier: number) =>
  (height / standingHeight) * strideMetres * multiplier;

const planted: Intent = { direction: 0, jump: false };

// Hold the planner's next instruction while the character changes support feet.
// Planner timers and takeoff attempts must only advance on executed instructions.
export class BipedMovement {
  facing: -1 | 1 = 1;
  heading = 0;
  turnProgress = 1;
  landingTime = Infinity;
  private pending?: Intent;
  constructor(
    private turnSeconds: number,
    private landSeconds: number,
  ) {}
  invalidate() {
    this.pending = undefined;
  }
  intent(
    body: Body,
    next: () => Intent,
    dt: number,
    manual?: Intent,
    fleeing = false,
  ): Intent {
    if (!body.support) {
      this.turnProgress = 1;
      this.pending = undefined;
      this.landingTime = Infinity;
      const command = next();
      if (command.direction) this.facing = command.direction;
      this.heading +=
        ((this.facing === 1 ? 0 : 1) - this.heading) * Math.min(1, dt * 6);
      return command;
    }
    if (fleeing) this.landingTime = Infinity;
    if (this.landingTime < this.landSeconds) {
      this.landingTime += dt;
      return planted;
    }
    if (this.turnProgress < 1) {
      this.turnProgress = Math.min(
        1,
        this.turnProgress + dt / (fleeing ? 0.24 : this.turnSeconds),
      );
      const t = this.turnProgress;
      const ease = t * t * (3 - 2 * t);
      this.heading = this.facing === -1 ? ease : 1 - ease;
      return planted;
    }
    const command = this.pending ? (manual ?? this.pending) : next();
    this.pending = undefined;
    if (command.direction && command.direction !== this.facing) {
      this.facing = command.direction;
      this.turnProgress = 0;
      this.pending = { ...command };
      return planted;
    }
    this.heading = this.facing === 1 ? 0 : 1;
    return command;
  }
  landed() {
    this.landingTime = 0;
  }
}
