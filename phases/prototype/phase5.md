# Phase 5 — Character art, rendering and animation

Begin after the acceptance checks in [phase 4](phase4.md) pass.

## Implementation sequence

1. Record asset provenance and define per-state frames, durations and foot anchors before integrating the sheet.
2. Map behaviour and velocity to clips. Advance on simulation time, mirror around the foot anchor and preserve the placeholder on load failure.
3. Inspect every clip at several scales and pixel ratios against light and dark backgrounds. Verify package-local asset resolution.

**Goal:** Replace the placeholder with a polished animated pet.

**Develop**

- [x] Create or acquire an appropriately licensed pixel-art cat sprite sheet; record asset origin, terms and attribution.
- [x] Define animation frame ranges, frame durations, sprite anchors, visual scale and facing direction in character metadata.
- [x] Implement idle, walk, jump, fall, landing (if available) and sleep animation states.
- [x] Keep the collision shape independent of transparent sprite padding. Anchor feet to the platform surface.
- [x] Handle sprite loading failures gracefully, including a fallback visual.
- [x] Handle DPR changes and canvas resizing; use nearest-neighbour rendering for pixel art.
- [x] Bundle assets or use a reliably resolved package asset URL; avoid external runtime asset requests by default.

**Test**

- Frame selection, looping, transitions, facing direction and feet alignment.
- Multiple pet sizes, DPR 1/2/3 and viewport resizing.
- Slow/failed sprite loading and repeated start/destroy.
- Visual review on light and dark backgrounds; verify no flicker or blurry pixel art.

**Acceptance:** A recognizable cat animates smoothly in every supported movement state and remains visually aligned with the physical world.

Verified all six clips on light and dark backgrounds. Chromium checked 24, 32 and 64 CSS-pixel widths at DPR 1, 2 and 3, viewport resize, pending and failed loads, and teardown. Typecheck, lint, 13 unit tests, 10 Chromium tests, build, Node import and comparison of the embedded PNG against the source sheet passed.
