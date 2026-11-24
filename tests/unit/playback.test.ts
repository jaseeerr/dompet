import { expect, it, vi } from "vitest";
import { DOMPet } from "../../src";
import { playback } from "../../src/playback";
it("constructs in Node and permits cleanup before start", () => {
  const pet = new DOMPet();
  pet.pause();
  pet.resume();
  pet.destroy();
  pet.start();
});
it("owns one frame and drops elapsed paused time", () => {
  let tick: FrameRequestCallback = () => {};
  const request = vi.fn((cb: FrameRequestCallback) => {
    tick = cb;
    return 0;
  });
  const cancel = vi.fn(),
    draw = vi.fn();
  const loop = playback({ request, cancel }, () => 0, draw);
  loop.resume();
  loop.resume();
  expect(request).toHaveBeenCalledTimes(1);
  tick(0);
  tick(35);
  expect(draw).toHaveBeenLastCalledWith(0.1);
  loop.pause();
  loop.pause();
  expect(cancel.mock.calls).toEqual([[0]]);
  loop.resume();
  tick(9000);
  expect(draw).toHaveBeenLastCalledWith(0.1);
});
