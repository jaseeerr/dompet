# Phase 6 — Dynamic websites, scrolling and responsive layouts

Begin after the acceptance checks in [phase 5](phase5.md) pass.

## Implementation sequence

1. Collect mutation, resize, route and scroll invalidations into one scheduled refresh. Observe nested scroll containers and ignore overlay mutations.
2. Diff snapshots by stable ID. Carry supported feet with a moved surface, release removed supports and revalidate the route.
3. Exercise modal and visibility transitions, virtualized content and mobile breakpoints. Disconnect observers and clear queued work on destroy.

**Goal:** Keep the pet synchronized with real-world web applications.

**Develop**

- [x] Integrate `MutationObserver` for relevant DOM and attribute changes, and `ResizeObserver` for tracked elements and layout roots.
- [x] Handle viewport resize, nested scroll events, orientation changes and SPA route changes. Provide explicit `refresh()` for layouts not captured by observers.
- [x] Coalesce invalidations into scheduled geometry updates; suppress observer feedback from the pet overlay.
- [x] Preserve support relationships when a platform moves; if it becomes hidden or removed, transition to falling/recovery. Revalidate navigation targets.
- [x] Handle sticky/fixed UI, virtualized lists, dialogs, collapsed panels, layout shifts and CSS transitions on a best-effort basis; use bounded refresh while active layout motion is detected.
- [x] Avoid rendering above modal dialogs by default (including native top-layer dialogs); pause or hide as appropriate. Support developer-defined exclusion zones.
- [x] Pause simulation and unnecessary geometry work while the document is hidden; refresh before resuming.
- [x] Document geometry limitations for CSS transforms, unusual stacking contexts and unsupported DOM boundaries.

**Test**

- Scroll page and nested panels, resize window, change responsive breakpoint, navigate SPA routes and replace DOM content.
- Open/close modals, add/remove supporting elements mid-jump and animate card expansion.
- Verify virtualized/offscreen elements do not create stale platforms.
- Verify observer cleanup and that overlay updates do not trigger an endless scan loop.
- Test desktop and mobile viewport sizes in Chromium, Firefox and WebKit.

**Acceptance:** The pet remains synchronized with normal dynamic layouts and recovers gracefully when the environment changes.

Verified with typecheck, lint, the production build, a Node import, 13 unit tests and 28 browser tests. The dynamic layout fixtures passed in Chromium, Firefox and WebKit at desktop and mobile viewport sizes.
