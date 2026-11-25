import { AnimationMixer } from "three";

// Metres from the embedded rest bounds and the artist's walkCycleMeters metadata.
export const humanHeight = 2.15767;
export function humanAnimator(root, clips) {
  const mixer = new AnimationMixer(root);
  const actions = Object.fromEntries(
    clips.map((clip) => [clip.name, mixer.clipAction(clip)]),
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
      if (now < lastClock) {
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
      const turning = animation.heading > 0 && animation.heading < 1;
      let name = "Idle",
        time = now % actions.Idle.getClip().duration;
      group.rotation.y = (1 - 2 * animation.heading) * 0.92;
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
      } else if (
        now - landed <
        (body.vx ? 0.16 : actions.Land.getClip().duration)
      ) {
        name = "Land";
        time = now - landed;
      } else if (turning) {
        name = "Turn";
        const progress =
          animation.facing < 0 ? animation.heading : 1 - animation.heading;
        time = progress * actions.Turn.getClip().duration;
        group.rotation.y -= Math.PI * progress;
      } else if (body.vx) {
        name = "Walk";
        time = ((animation.distance * humanHeight) / (size * 0.82)) % 1;
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
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}
