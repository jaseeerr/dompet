import { Quaternion, Vector3 } from "three";

export function seatedPose(root) {
  const hips = root.getObjectByName("Hips");
  const limbs = [];
  for (const [side, sign] of [
    ["L", 1],
    ["R", -1],
  ]) {
    for (const [joint, child, direction] of [
      ["Thigh", "Shin", [0.18 * sign, -0.12, 1]],
      ["Shin", "Foot", [0.05 * sign, -1, 0.14]],
      ["Foot", "Toe", [0.1 * sign, -0.18, 1]],
      ["UpperArm", "Forearm", [0.15 * sign, -1, -0.14]],
      ["Forearm", "Hand", [-0.15 * sign, -1, 0.48]],
    ]) {
      const bone = root.getObjectByName(joint + side);
      const tip = root.getObjectByName(child + side);
      if (bone && tip)
        limbs.push({
          bone,
          axis: tip.position.clone().normalize(),
          direction: new Vector3(...direction).normalize(),
          base: new Quaternion(),
        });
    }
  }

  const parent = new Quaternion();
  const facing = new Quaternion();
  const rotation = new Quaternion();
  const target = new Quaternion();
  const currentAxis = new Vector3();
  const desiredAxis = new Vector3();
  let posed = false;
  return {
    restore() {
      if (!posed) return;
      for (const { bone, base } of limbs) bone.quaternion.copy(base);
      posed = false;
    },
    apply(group, amount) {
      group.position.y = 0;
      if (!hips || !amount) return;
      group.getWorldQuaternion(facing);
      for (const { bone, axis, direction, base } of limbs) {
        base.copy(bone.quaternion);
        bone.parent.getWorldQuaternion(parent).invert();
        desiredAxis
          .copy(direction)
          .applyQuaternion(facing)
          .applyQuaternion(parent);
        currentAxis.copy(axis).applyQuaternion(base);
        target
          .copy(base)
          .premultiply(rotation.setFromUnitVectors(currentAxis, desiredAxis));
        bone.quaternion.slerp(target, amount);
      }
      const hipHeight = group.worldToLocal(
        hips.getWorldPosition(currentAxis),
      ).y;
      group.position.y = (0.06 - hipHeight) * amount;
      posed = true;
    },
  };
}
