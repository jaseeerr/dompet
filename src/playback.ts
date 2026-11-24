import { stepSeconds } from "./physics/motion.js";
// The browser supplies RAF timestamps. Tests advance the same clock explicitly.
export interface Scheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}
export function playback(
  clock: Scheduler,
  random: () => number,
  draw: (phase: number) => void,
  update?: () => void,
) {
  let frame: number | undefined;
  let previous: number | undefined;
  let phase = random() * Math.PI * 2;
  let accumulator = 0;
  let generation = 0;
  function tick(time: number) {
    const run = generation;
    const elapsed =
      previous === undefined ? 0 : Math.min(100, Math.max(0, time - previous));
    phase += Math.min(50, elapsed) / 350;
    accumulator += elapsed / 1000;
    const steps = Math.min(8, Math.floor((accumulator + 1e-12) / stepSeconds));
    for (let i = 0; i < steps; i++) {
      update?.();
      if (run !== generation) return;
    }
    accumulator = Math.max(0, accumulator - steps * stepSeconds) % stepSeconds;
    previous = time;
    draw(phase);
    frame = clock.request(tick);
  }
  return {
    resume() {
      if (frame === undefined) {
        draw(phase);
        frame = clock.request(tick);
      }
    },
    resetTime() {
      previous = undefined;
      accumulator = 0;
    },
    pause() {
      generation++;
      if (frame !== undefined) clock.cancel(frame);
      frame = undefined;
      previous = undefined;
      accumulator = 0;
    },
  };
}
