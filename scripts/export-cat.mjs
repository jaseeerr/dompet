import { pose as animate, standingWidth } from "../src/rendering/pose.js";
import { AnimationClip, Group, VectorKeyframeTrack } from "three";
import { writeFile } from "node:fs/promises";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { buildCat } from "../src/characters/model.js";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};
const rig = buildCat();
const joints = [
  rig.spine,
  rig.chest,
  rig.head,
  ...rig.legs.map((l) => l.hip),
  ...rig.tail,
];
const { QuaternionKeyframeTrack, Quaternion, Vector3 } = await import("three");
const channels = joints.map((joint, i) => {
  const base = joint.quaternion.clone(),
    axis = new Vector3(0, 0, 1);
  const bent = base
    .clone()
    .multiply(new Quaternion().setFromAxisAngle(axis, 0.24));
  return new QuaternionKeyframeTrack(
    joint.name + ".quaternion",
    [0, 1 + i * 0.03, 2.5],
    [...base.toArray(), ...bent.toArray(), ...base.toArray()],
  );
});
for (const eye of rig.eyes) {
  const { VectorKeyframeTrack } = await import("three");
  channels.push(
    new VectorKeyframeTrack(
      eye.name + ".scale",
      [0, 1, 1.1, 1.2, 2.5],
      [1, 1, 1, 1, 1, 1, 1, 0.05, 1, 1, 1, 1, 1, 1, 1],
    ),
  );
}
const pose = new AnimationClip("Pose reel", 2.5, channels);
// Sample the same procedural pose used during play into portable glTF clips.
const clips = [pose];
const nodes = [
  ...new Set([
    ...joints,
    ...rig.eyes,
    ...rig.ears,
    ...rig.legs.flatMap((l) => [l.knee, l.ankle]),
  ]),
];
const neutral = nodes.map((n) => [
  n.position.clone(),
  n.quaternion.clone(),
  n.scale.clone(),
]);
for (const clip of ["idle", "walk", "turn", "jump", "fall", "land", "sleep"]) {
  const samples = Array.from({ length: 25 }, (_, i) => i / 24);
  const rotation = new Group();
  const tracks = nodes.map(() => ({ position: [], quaternion: [], scale: [] }));
  for (const t of samples) {
    animate(
      rig,
      rotation,
      { vy: clip === "jump" ? -400 * (1 - t) : 400 * t },
      {
        clock: t * 1000,
        clip,
        elapsed: t * 125,
        distance: ((t * 112) / standingWidth) * 0.88 * Math.cos(0.32),
        heading: clip === "turn" ? t : 0,
        sleep: clip === "sleep" ? t : 0,
        anticipation: 0,
        impact: 1,
      },
      112,
    );
    nodes.forEach((n, i) => {
      for (const prop of ["position", "quaternion", "scale"])
        tracks[i][prop].push(...n[prop].toArray());
    });
  }
  const channels = [];
  nodes.forEach((node, i) => {
    for (const [prop, values] of Object.entries(tracks[i])) {
      const width = prop === "quaternion" ? 4 : 3;
      if (values.every((v, j) => Math.abs(v - values[j % width]) < 1e-6))
        continue;
      const Track = width === 4 ? QuaternionKeyframeTrack : VectorKeyframeTrack;
      channels.push(new Track(node.name + "." + prop, samples, values));
    }
  });
  if (clip === "turn")
    channels.push(
      new QuaternionKeyframeTrack(
        "character.quaternion",
        samples,
        samples.flatMap((t) =>
          new Quaternion()
            .setFromAxisAngle(new Vector3(0, 1, 0), -t * Math.PI)
            .toArray(),
        ),
      ),
    );
  clips.push(new AnimationClip(clip, 1, channels));
}
rig.root.name = "character";
nodes.forEach((n, i) => {
  n.position.copy(neutral[i][0]);
  n.quaternion.copy(neutral[i][1]);
  n.scale.copy(neutral[i][2]);
});
const bytes = await new GLTFExporter().parseAsync(rig.root, {
  binary: true,
  animations: clips,
});
await writeFile(
  new URL("../src/characters/tabby.glb", import.meta.url),
  new Uint8Array(bytes),
);
rig.dispose();
