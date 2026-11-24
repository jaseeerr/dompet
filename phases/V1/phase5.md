# Phase 5 — Four-legged walking and turning

Begin after [phase 4](phase4.md) passes.

**Goal:** Make the walk read as an animal shifting weight through four legs.

## Implementation sequence

1. Author an in-place four-beat walk with distinct contact, load, lift and swing for each paw. Animate the shoulder blades sliding, pelvis shifting and spine flexing with the steps. Mark each stance interval in clip metadata.
2. Blend idle, walk, stop and turn actions. Advance gait phase by distance travelled so the existing speed option changes cadence and avoids paw sliding. Let physics supply root translation. [Three.js animation mixer](https://threejs.org/docs/pages/AnimationMixer.html)
3. Rotate the character through a short stepping turn when direction changes. If measured stance drift exceeds the tolerance, apply bounded paw corrections during contact and ease them out on lift.

**Develop**

- [x] Export idle, walk and turning clips with consistent root orientation, frame ranges, stride length and contact timings.
- [x] Couple head stabilization and tail balance to the walking pose. Support both directions and short stops near the end of a perch.
- [ ] Add slow-motion and contact-trail inspection to the journal so drift is visible in surface-local coordinates, including on moving platforms.

**Test**

- [x] Replay the same path at slow, normal and brisk speed at 30, 60 and 120 Hz. Measure planted-paw drift per stance and inspect at normal playback speed.
- [ ] Reverse direction twice, pause mid-stride, resume and stop at an edge. Check for mirrored anatomy, snapped joints and animation that continues while paused.

**Acceptance:** The slow-motion walk shows four distinct footfalls per cycle. Each planted paw drifts at most two CSS pixels relative to a stationary support at the default desktop size. Stops and turns preserve balance and continuous facing.

## Candidate result

The four-beat cycle advances by travel distance. The asset check replays three speeds, three render rates and both headings. Maximum planted error was 0.752 CSS pixels against the two-pixel target. The inspector provides quarter-speed playback and clip scrubbing.
