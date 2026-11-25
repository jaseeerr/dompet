import { AnimationMixer } from "three";

// Metres from the embedded rest bounds and the artist's walkCycleMeters metadata.
export const humanHeight = 2.15767;
export function humanAnimator(root, clips) {
  const mixer = new AnimationMixer(root);
  const actions = Object.fromEntries(
    clips.map((clip) => [clip.name, mixer.clipAction(clip)]),
  );
  const blink = actions.Blink.play();
  let previous,
    wasGrounded = false,
    landed = -Infinity,
    lastClock = -1;
  return {
    draw(group, body, animation, size) {
      const now = animation.clock / 1000,
        grounded = body.support !== null;
      if (now < lastClock) {
        landed = -Infinity;
        wasGrounded = false;
      }
      if (grounded && !wasGrounded) landed = now;
      wasGrounded = grounded;
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
        time = name === "JumpTakeoff" ? 0.34 + animation.elapsed / 1000 : 0;
      } else if (animation.anticipation > 0.2) {
        name = "JumpTakeoff";
        time = 0.34 * animation.anticipation;
      } else if (now - landed < actions.Land.getClip().duration) {
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
        previous?.stop();
        action.play();
        previous = action;
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
