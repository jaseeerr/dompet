# Phase 1 — Project foundation and developer sandbox

Begin from the repository plan.

## Implementation sequence

1. Wire the package root to ESM and declarations, with Node-only import coverage before adding browser code.
2. Build a side-effect-free constructor and acquire the shadow canvas, frame clock and resize listener on start. Exercise terminal destroy and repeated calls.
3. Mount the placeholder in a vanilla playground. Drive real controls through the overlay, then run the clean-install checks.

**Goal:** Establish a maintainable library and a browser playground.

**Develop**

- [x] Initialize Git, TypeScript strict mode, Vite library build, Vitest, Playwright, linting and formatting.
- [x] Configure ESM output and `.d.ts` generation. Keep internal modules out of the public API.
- [x] Add scripts for `dev`, `build`, `typecheck`, `lint`, `test`, and `test:e2e`.
- [x] Create a demo with navigation, cards, forms, buttons, nested containers, a scrollable panel and layout-change controls.
- [x] Implement an isolated canvas overlay and basic `DOMPet` lifecycle: start, pause, resume, destroy.
- [x] Add a placeholder character and a deterministic clock/randomness injection strategy for tests.
- [x] Ensure import has no browser side effects; browser initialization occurs only when started.

**Test**

- Clean install, typecheck, lint, build and unit test execution.
- Start/destroy repeatedly; verify no duplicate overlays, listeners or animation loops.
- Verify underlying buttons, inputs and scrolling work normally.
- Verify importing the package in Node/SSR does not access `window` or `document` at module load.

**Acceptance:** A demo shows an isolated placeholder pet; the library builds and the lifecycle tests pass.

Verified with a clean lockfile install, typecheck, lint, production build, Node package import, two unit tests and two Chromium browser tests. A visual review confirmed the placeholder appears in the lower-right corner of the playground.
