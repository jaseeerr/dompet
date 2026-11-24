# Phase 6 — Whole-body jumps, falls and landings

Begin after [phase 5](phase5.md) passes.

**Goal:** Show where a jump's force comes from and how the cat absorbs the landing.

## Implementation sequence

1. Author anticipation, push-off, airborne stretch, falling reach and landing recovery poses. Compress the hind legs and spine during preparation, extend at takeoff and flex the forelegs under load on contact.
2. Use the explorer's prepare-jump intent to start the crouch. Use real ground departure, vertical velocity and support acquisition to select airborne and impact poses. A walk off an edge should enter the fall directly.
3. Blend landing recovery into a stable stance or the next step. Scale compression to impact speed within the rig's tested range and interrupt recovery cleanly if the support disappears.

**Develop**

- [ ] Align the strongest hind-leg extension with the simulated impulse. Keep all clips in place so animation playback cannot add a second vertical displacement.
- [x] Coordinate chest rotation, paw tuck, head stabilization and tail counterbalance through ascent and descent.
- [x] Define transitions for a short hop, long drop, early landing on an intervening ledge and a missed destination.

**Test**

- [ ] Record all four cases with velocity, support ID, animation state and paw markers. Compare the event trace and pose at takeoff, apex and landing.
- [ ] Remove the destination mid-flight and pause at the apex. Check finite coordinates, recovery to a valid pose and stable landings at multiple frame rates.

**Acceptance:** In the journal the cat crouches, pushes off, reaches and absorbs impact on the platform it actually hits. The landing response begins within one rendered frame of physical contact; a missed landing continues naturally into a fall.

## Candidate result

The explorer’s preparation state cues crouch. Vertical velocity sets tuck and reach, and support acquisition triggers compression scaled by impact velocity. The [journal recording](media/journal.webm) includes preparation, ascent, descent and contact.
