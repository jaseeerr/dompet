// Neutral projected nose-to-tail length, measured in the authoring coordinate system.
export const standingWidth = 2.62648;

// Two-link inverse kinematics. The ankle remains upright through stance.
function place(leg, x, y) {
  const bend = leg.front ? -0.075 : 0.14;
  const a = Math.hypot(0.35, bend),
    b = Math.hypot(0.32, bend);
  const d = Math.min(
    a + b - 0.00001,
    Math.max(Math.abs(a - b) + 0.001, Math.hypot(x, y)),
  );
  const sign = leg.front ? -1 : 1;
  const hip =
    Math.atan2(x, -y) +
    sign *
      Math.acos(
        Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))),
      );
  const knee =
    -sign *
    Math.acos(Math.max(-1, Math.min(1, (d * d - a * a - b * b) / (2 * a * b))));
  leg.hip.rotation.z = hip - Math.atan2(bend, 0.35);
  leg.knee.rotation.z = knee + Math.atan2(bend, 0.35) - Math.atan2(-bend, 0.32);
  leg.ankle.rotation.z = -leg.hip.rotation.z - leg.knee.rotation.z;
}
export function pose(rig, cat, body, anim, size) {
  const t = anim.clock / 1000,
    walk = anim.clip === "walk";
  const scale = size / standingWidth;
  const phase = anim.distance / (scale * 0.88 * Math.cos(0.32));
  const turn = anim.heading;
  cat.rotation.y = -0.32 + turn * (-Math.PI + 0.64);
  for (const [i, leg] of rig.legs.entries()) {
    const p = (phase + [0, 0.5, 0.75, 0.25][i]) % 1;
    const stance = p < 0.5;
    const dx = walk
      ? stance
        ? 0.22 - 0.88 * p
        : -0.22 + 0.44 * (p - 0.5) * 2
      : 0;
    const lift = walk && !stance ? 0.17 * Math.sin((p - 0.5) * 2 * Math.PI) : 0;
    const jump = anim.clip === "jump",
      fall = anim.clip === "fall";
    const compression =
      anim.clip === "land"
        ? 0.18 *
          (0.4 + 0.6 * anim.impact) *
          Math.sin(Math.PI * Math.min(1, anim.elapsed / 125))
        : 0;
    const tuck = jump ? Math.min(1, -body.vy / 350) : 0;
    const reach = fall ? Math.min(1, body.vy / 400) : 0;
    const settle = 0.42 * anim.sleep + 0.12 * anim.anticipation;
    leg.hip.position.y = 0.76 - compression - settle;
    place(
      leg,
      dx +
        (leg.front ? 0.19 : -0.15) * tuck +
        (leg.front ? 0.12 : -0.06) * reach,
      -0.67 +
        lift +
        compression +
        settle +
        tuck * (leg.front ? 0.19 : 0.27) +
        reach * 0.025,
    );
  }
  rig.chest.rotation.z =
    0.07 * Math.sin(phase * 2 * Math.PI) * Number(walk) - 0.12 * anim.sleep;
  rig.spine.rotation.z = walk ? 0.023 * Math.sin(phase * 2 * Math.PI) : 0;
  rig.spine.position.y =
    0.77 + (walk ? 0.022 * Math.sin(phase * 4 * Math.PI) : 0);
  if (anim.clip === "jump") rig.spine.rotation.z = 0.13;
  if (anim.clip === "fall") rig.spine.rotation.z = -0.1;
  if (anim.clip === "land")
    rig.spine.position.y -=
      0.18 *
      (0.4 + 0.6 * anim.impact) *
      Math.sin(Math.PI * Math.min(1, anim.elapsed / 125));
  rig.head.rotation.z = -rig.spine.rotation.z + (anim.gaze ?? 0);
  rig.ears.forEach((ear, i) => {
    ear.rotation.x = (i ? 1 : -1) * (0.12 + 0.38 * anim.sleep);
    ear.rotation.y = 0.14 * Math.sin(t * 0.9 + i) + (anim.gaze ?? 0);
  });
  rig.spine.position.y -= 0.42 * anim.sleep + 0.12 * anim.anticipation;
  const breath = 0.012 * Math.sin(t * (anim.sleep > 0.5 ? 2 : 3.5));
  rig.spine.scale.y = 1 + breath;
  rig.head.rotation.z -= 0.42 * anim.sleep + 0.12 * anim.anticipation;
  rig.head.rotation.y =
    -0.38 * (1 - 2 * turn) + 0.22 * Math.sin(t * 0.74) * (1 - anim.sleep);
  const blink = Math.max(0, 1 - Math.abs((t % 3.9) - 1.3) / 0.095);
  for (const eye of rig.eyes)
    eye.scale.y = Math.max(0.045, (1 - blink) * (1 - anim.sleep));
  rig.tail.forEach((s, i) => {
    s.rotation.y = anim.sleep * 0.34 + 0.08 * Math.sin(t * 2 - i * 0.37);
  });
}
