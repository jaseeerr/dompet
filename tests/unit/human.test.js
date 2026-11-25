import { readFile } from "node:fs/promises";
import { Group } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { expect, it } from "vitest";
import { humanAnimator } from "../../src/rendering/human.js";

it("layers the supplied blink over a distance-driven walking pose", async () => {
  const bytes = await readFile(
    new URL("../../downloaded assets/dompet-human.glb", import.meta.url),
  );
  const { scene, animations } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const animator = humanAnimator(scene, animations),
    group = new Group();
  group.add(scene);
  const body = { support: "floor", vx: 130 };
  const state = { clock: 0, heading: 0, anticipation: 0, distance: 10 };
  const lids = [];
  scene.traverse((n) => {
    if (n.morphTargetInfluences?.length) lids.push(n);
  });
  const thigh = scene.getObjectByName("ThighL");
  animator.draw(group, body, state, 112);
  state.clock = 3800;
  animator.draw(group, body, state, 112);
  expect(
    Math.max(...lids.flatMap((n) => n.morphTargetInfluences)),
  ).toBeGreaterThan(0.5);
  const planted = thigh.quaternion.clone();
  state.clock = 4100;
  animator.draw(group, body, state, 112);
  expect(Math.max(...lids.flatMap((n) => n.morphTargetInfluences))).toBeCloseTo(
    0,
  );
  expect(thigh.quaternion.angleTo(planted)).toBeLessThan(0.001);
  state.distance += 12;
  animator.draw(group, body, state, 112);
  expect(thigh.quaternion.angleTo(planted)).toBeGreaterThan(0.01);
  animator.dispose();
});
