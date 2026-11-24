// Rest skeleton for the supplied tabby. Positive X points toward the nose.
import { Bone, Group } from "three";
export function buildCat() {
  const root = new Group();
  function joint(parent, name, x, y, z) {
    const bone = new Bone();
    bone.name = name;
    bone.position.set(x, y, z);
    parent.add(bone);
    return bone;
  }
  const spine = joint(root, "spine", 0, 0.77, 0);
  const chest = joint(spine, "chest", 0.2, 0.08, 0);
  const head = joint(spine, "neck", 0.68, 0.32, 0);
  head.rotation.y = -0.38;
  const ears = [],
    eyes = [],
    legs = [],
    tail = [];
  for (const side of [-1, 1]) {
    ears.push(joint(head, "earHinge" + side, 0.07, 0.37, 0.12 * side));
    eyes.push(joint(head, "eyelid" + side, 0.23, 0.25, 0.14 * side));
  }
  for (const front of [false, true])
    for (const side of [-1, 1]) {
      const name = (front ? "fore" : "hind") + (side === 1 ? "Near" : "Far");
      const x = front ? (side === 1 ? 0.68 : 0.49) : side === 1 ? -0.31 : -0.79;
      const hip = joint(root, name, x, 0.76, side * 0.16);
      const bend = front ? -0.075 : 0.14;
      const knee = joint(hip, name + "Knee", bend, -0.35, 0);
      const ankle = joint(knee, name + "Ankle", -bend, -0.32, 0);
      joint(ankle, name + "Contact", 0.044, -0.09, 0);
      legs.push({ hip, knee, ankle, side, front });
    }
  // Sample the downward curve at the rump and the rising distal tip.
  const tailCenters = [
    [-0.94, 0.88],
    [-1.04, 0.73],
    [-1.16, 0.64],
    [-1.29, 0.64],
    [-1.4, 0.72],
    [-1.49, 0.85],
    [-1.56, 1],
  ];
  let parent = spine;
  for (const [i, [x, y]] of tailCenters.entries()) {
    const [px, py] = i ? tailCenters[i - 1] : [0, 0.77];
    parent = joint(parent, "tail" + i, x - px, y - py, 0);
    tail.push(parent);
  }
  root.updateMatrixWorld(true);
  return { root, spine, chest, head, eyes, ears, legs, tail, dispose() {} };
}
