import { AnimationMixer, Quaternion, Vector3 } from "three";

// Metres from the embedded rest bounds and the artist's walkCycleMeters metadata.
export const humanHeight = 2.15767;
export function humanAnimator(root, clips) {
  const mixer = new AnimationMixer(root);
  // The group's yaw drives facing. Remove only the authored pelvis yaw from
  // Turn, preserving the lateral step, weight shift and spine counterrotation.
  const turn = clips.find((c) => c.name === "Turn").clone();
  const rotation = turn.tracks.find((t) => t.name === "Hips.quaternion");
  if (rotation) {
    const q = new Quaternion(),
      twist = new Quaternion();
    for (let i = 0; i < rotation.values.length; i += 4) {
      q.fromArray(rotation.values, i);
      twist.set(0, q.y, 0, q.w).normalize().invert();
      q.premultiply(twist).toArray(rotation.values, i);
    }
  }
  const pitchAxis = new Vector3(1, 0, 0),
    offset = new Quaternion();
  const flightBones = [
    ["Spine", 0.1],
    ["ThighL", 0.18],
    ["ThighR", 0.14],
    ["UpperArmL", -0.15],
    ["UpperArmR", -0.19],
  ].flatMap(([name, angle]) => {
    const bone = root.getObjectByName(name);
    return bone ? [{ bone, angle, base: bone.quaternion.clone() }] : [];
  });
  let applied = false,
    flight = 0;
  const actions = Object.fromEntries(
    clips.map((clip) => [
      clip.name,
      mixer.clipAction(clip.name === "Turn" ? turn : clip),
    ]),
  );
  const blink = actions.Blink.play();
  let outgoing, transitionStart;
  const takeoffEnd = actions.JumpTakeoff.getClip().duration;
  let previous,
    wasGrounded = false,
    landed = -Infinity,
    lastClock = -1;
  return {
    draw(group, body, animation, size) {
      const now = animation.clock / 1000,
        grounded = body.support !== null;
      if (applied)
        for (const part of flightBones) part.bone.quaternion.copy(part.base);
      if (now < lastClock) {
        flight = 0;
        outgoing?.stop();
        previous?.stop();
        outgoing = previous = undefined;
        landed = -Infinity;
        wasGrounded = false;
      }
      if (grounded && !wasGrounded) landed = now;
      wasGrounded = grounded;
      const delta = now - lastClock;
      lastClock = now;
      const turning = animation.turnProgress < 1;
      const contactTime = animation.landingTime ?? now - landed;
      let name = "Idle",
        time = now % actions.Idle.getClip().duration;
      group.rotation.y = (1 - 2 * animation.heading) * 0.92;
      group.rotation.z =
        animation.web?.clip === "WebPull" ? -(animation.web.lean ?? 0) : 0;
      if (!grounded) {
        name =
          animation.clip === "jump" && animation.elapsed < 160
            ? "JumpTakeoff"
            : "Airborne";
        time =
          name === "JumpTakeoff"
            ? takeoffEnd - 0.16 + animation.elapsed / 1000
            : 0;
      } else if (animation.anticipation > 0.2) {
        name = "JumpTakeoff";
        time = (takeoffEnd - 0.16) * animation.anticipation;
      } else if (contactTime < actions.Land.getClip().duration) {
        name = "Land";
        time = contactTime;
      } else if (turning) {
        name = "Turn";
        const progress = animation.turnProgress;
        time = progress * actions.Turn.getClip().duration;
      } else if (body.vx) {
        name = "Walk";
        time = ((animation.distance * humanHeight) / (size * 0.82)) % 1;
      }
      if (animation.web && actions[animation.web.clip]) {
        name = animation.web.clip;
        time = animation.web.time;
      }
      const action = actions[name];
      if (previous !== action) {
        outgoing?.stop();
        outgoing = previous;
        transitionStart = now - Math.max(0, delta);
        action.play();
        previous = action;
      }
      const blend = outgoing
        ? Math.min(1, Math.max(0, (now - transitionStart) / 0.09))
        : 1;
      action.setEffectiveWeight(blend);
      if (outgoing) {
        outgoing.setEffectiveWeight(1 - blend);
        if (blend === 1) {
          outgoing.stop();
          outgoing = undefined;
        }
      }
      action.time = time;
      blink.time = Math.min(now % 3.7, blink.getClip().duration);
      mixer.update(0);
      // Sample the same airborne base clip, then layer tuck on ascent and
      // extension on descent. Restore the sampled bones before the next frame.
      const target =
        grounded || animation.web
          ? 0
          : Math.max(-1, Math.min(1, -body.vy / 480));
      flight += (target - flight) * (1 - Math.exp(-12 * Math.max(0, delta)));
      for (const part of flightBones) {
        part.base.copy(part.bone.quaternion);
        part.bone.quaternion.multiply(
          offset.setFromAxisAngle(pitchAxis, part.angle * flight),
        );
      }
      applied = true;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}
