# Phase 1 — A Three.js renderer in the DOM overlay

Begin from the released prototype and its [renderer plan](../prototype/phase5.md).

**Goal:** Prove that a depth-lit object can ride a real DOM platform using the existing simulation and public lifecycle.

## Implementation sequence

1. Extract a small renderer interface from the canvas work in `src/index.ts`. Pass viewport size, DPR, body pose, facing and elapsed simulation time through it. Adapt the existing tabby first and run its regression tests.
2. Add a pinned Three.js dependency and lazy-load the 3D renderer at browser startup. Mount a transparent canvas inside the current pointer-transparent shadow host. Give the 2D fallback and debug drawing their own canvas where needed.
3. Place an asymmetric test body with distinguishable front and back feet under an orthographic camera. Project its ground anchor to the simulation's feet. Keep physics on the existing 120 Hz clock and render once per animation frame.

**Develop**

- [x] Define renderer selection for the spike and expose it in the field journal. Make loading, ready, fallback and destroyed paths explicit.
- [x] Map viewport X-right/Y-down to scene coordinates in one place. Keep the physics plane fixed as the camera reveals the character's depth. [Three.js orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html)
- [x] Share start, pause, hide, visibility and teardown behaviour. Ignore late imports or asset completions after destroy.

**Test**

- [ ] In the journal, move, jump and land the test body on a button. Compare its projected anchor with the debug platform line before and after scroll, resize and DPR changes.
- [ ] Import the package in Node, force WebGL initialization failure, and destroy during initialization. Check that fallback renders and the frame and overlay counts return to baseline.

**Acceptance:** A host can start the journal with either renderer. Both follow the same seeded body trajectory, and the 3D ground anchor is within one CSS pixel of the debug landing point.

## Candidate result

The journal selects the lazy WebGL renderer or the embedded sprite. Context loss, missing and corrupt models, late teardown, SSR and pause are covered by the browser and consumer checks.
