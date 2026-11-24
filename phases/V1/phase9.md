# Phase 9 — Graphics budgets, fallback and cleanup

Begin after [phase 8](phase8.md) passes.

**Goal:** Keep the larger 3D character practical to embed on desktop and mobile pages.

## Implementation sequence

1. Extend the [prototype benchmark](../../benchmarks/RESULTS.md) with cold asset load, time to first visible cat, triangle count, draw calls, texture memory, CPU animation time and GPU frame time where timer queries are supported.
2. Profile the finished character on a named desktop and a physical mobile device. Tune DPR, light count, texture resolution, mesh detail and shadows from those results. Evaluate geometry or texture compression with its decoder transfer and startup costs included.
3. Exercise missing GLB, corrupt textures, denied WebGL context, context loss during playback and destruction while loading. Recover using the sprite renderer at the current body position. Dispose of all model, mixer and renderer resources. [Three.js cleanup guide](https://threejs.org/manual/en/cleanup.html)

**Develop**

- [x] Set provisional targets of 60 fps desktop, 30 fps mobile and at most 3 MiB transferred for the character and its textures. Report core, Three.js, decoder and asset bytes separately. Pin chosen dependencies and record their licenses.
- [x] Pause GPU work when hidden, respect reduced motion, cap catch-up on resume and cancel pending work on teardown. Keep rendering pointer-transparent, inert and accessibility-hidden.
- [x] Compare the sprite, full-quality 3D and reduced-quality 3D paths on the same host fixtures. Keep a usable session after renderer failure.

**Test**

- [x] Run the 100-, 1,000- and 5,000-node fixtures, including mobile viewports, scrolling and route changes. Report p95 frame intervals alongside a pet-disabled baseline.
- [x] Repeat mount, load and destroy 100 times. Track live GPU resources, heap trend, observers, frame callbacks and outstanding asset requests. Test reduced motion, keyboard, touch and modal suspension.
- [x] Test actual GPU rendering and forced fallback independently. Identify software-rendered CI runs when reporting results.

**Acceptance:** The benchmark report identifies the devices, quality settings and any missed targets. The mobile preset sustains its target on the reference scene, failures produce a visible fallback, and repeated teardown leaves no pet-owned live resources.

## Candidate result

Metal and SwiftShader measurements, transfer sizes and physical-device qualification are in the [benchmark report](../../benchmarks/RESULTS.md). The browser suite verifies 100 fully initialized WebGL teardown cycles and recovery from context loss and invalid assets.
