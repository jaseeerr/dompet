import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Group, Vector3 } from "three";
import { buildCat } from "../src/characters/model.js";
import { pose, standingWidth } from "../src/rendering/pose.js";
const bytes = await readFile(
  new URL("../src/characters/tabby.glb", import.meta.url),
);
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
assert.equal(gltf.skins.length, 6);
assert.equal(new Set(gltf.animations.map((a) => a.name)).size, 8);
const rig = buildCat(),
  cat = new Group(),
  size = 112,
  scale = size / standingWidth;
cat.add(rig.root);
let drift = 0;
for (const heading of [0, 1]) {
  for (const rate of [30, 60, 120])
    for (const speed of [0.6, 1, 1.6]) {
      const planted = new Map();
      for (let n = 0; n <= rate * 2; n++) {
        const distance = (n * speed * 180) / rate;
        const phase = distance / (scale * 0.88 * Math.cos(0.32));
        pose(
          rig,
          cat,
          { vy: 0 },
          {
            clock: (n * 1000) / rate,
            clip: "walk",
            distance,
            heading,
            sleep: 0,
            anticipation: 0,
            impact: 0,
            elapsed: 0,
          },
          size,
        );
        rig.legs.forEach(({ hip }, i) => {
          const marker = rig.root.getObjectByName(hip.name + "Contact");
          assert(gltf.nodes.some((n) => n.name === marker.name));
          const v = marker.getWorldPosition(new Vector3());
          const footX = v.x * scale + distance * (heading ? -1 : 1);
          if ((phase + [0, 0.5, 0.75, 0.25][i]) % 1 >= 0.5) {
            planted.delete(i);
            return;
          }
          if (!planted.has(i)) planted.set(i, footX);
          drift = Math.max(
            drift,
            Math.abs(footX - planted.get(i)),
            Math.abs(v.y * scale),
          );
        });
      }
    }
}
for (const node of gltf.nodes) {
  for (const key of ["translation", "rotation", "scale", "matrix"])
    if (node[key])
      assert(
        node[key].every(Number.isFinite),
        node.name + " has invalid " + key,
      );
}
assert(drift <= 2, "Stance drift " + drift);
console.log(
  "Four contacts, six skins, eight clips. Maximum planted error " +
    drift.toFixed(3) +
    " CSS px.",
);
rig.dispose();
