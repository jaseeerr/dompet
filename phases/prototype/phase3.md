# Phase 3 — Physics and collision engine

Begin after the acceptance checks in [phase 2](phase2.md) pass.

## Implementation sequence

1. Define a pure fixed-step update consuming the phase 2 snapshot and horizontal/jump intent. Use feet as the vertical reference.
2. Sweep from previous to next feet position, evaluate horizontal overlap at crossing time and choose the first landing.
3. Connect a capped accumulator to the clock and expose opt-in sandbox controls. Replay identical inputs at multiple frame rates.

**Goal:** Make the pet move naturally on generated platforms.

**Develop**

- [x] Implement position, velocity, gravity, horizontal movement, jumping, terminal fall speed and world boundaries.
- [x] Use one-way top-surface collisions for MVP: land when descending across a valid surface with sufficient horizontal overlap; do not collide with its underside.
- [x] Use swept vertical collision checks to prevent tunnelling through thin platforms. Select the earliest valid landing when multiple surfaces are crossed.
- [x] Track grounded platform ID, edge departure and transition into falling.
- [x] Implement fixed-step physics with delta clamping and a capped number of updates per frame.
- [x] Add manual debug controls for left/right movement, jumping, reset and physics inspection.
- [x] Safely respawn when the pet exits the world or geometry becomes invalid.

**Test**

- Gravity and jump trajectories against known inputs; landing at the expected height.
- Walking off an edge, passing upward through a one-way platform, crossing thin platforms at high speed, overlapping surfaces and boundary conditions.
- Equivalent results across simulated 30/60/120 Hz rendering schedules within tolerance.
- Large time gaps, zero delta, removal of the supporting platform and empty worlds.

**Acceptance:** The pet walks, jumps, falls and lands reliably without floating, tunnelling or depending on display refresh rate.

Verified with typecheck, lint, production build, seven unit tests and five Chromium tests. Fixed-step replay matched at 30, 60 and 120 Hz. A visual check confirmed the feet aligned with the top of a scanned button.
