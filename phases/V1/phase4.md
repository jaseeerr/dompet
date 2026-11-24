# Phase 4 — Make the larger cat fit the website

Begin after [phase 3](phase3.md) passes.

**Goal:** Make the larger animal's size meaningful to collision, reachable jumps and safe landings.

## Implementation sequence

1. Measure the rig's standing silhouette, load-bearing paw span and shoulder height. Derive a ground anchor and a compact collision shape from those measurements. Tail extension and ear flicks should never resize the body.
2. Resolve the proposed 112 px desktop and 88 px small-screen defaults once per layout change. Preserve the public CSS-pixel size override. Replace hard-coded prototype dimensions in spawn, support overlap, viewport bounds, scanner thresholds, reconciliation and graph trajectory simulation with the same resolved measurements.
3. Overlay the four projected contact markers, collision box and usable platform intervals in the inspector. Use the pose reel to verify that camera depth and real platform height agree.

**Develop**

- [x] Specify the small-screen breakpoint and behaviour when the requested size exceeds the viewport. Document the distinction between full visual width and supporting paw span.
- [x] Compute safe standing and takeoff intervals from visible top surfaces. Cover partial occlusion and shallow perches where a plausible stance can still fit.
- [x] Carry a planted cat with a scrolled or resized platform. On losing sufficient support, release it and replan using the existing one-way physics rules.

**Test**

- [x] Compare explicit 32, 88, 112 and 144 px sizes on cards, narrow buttons and the viewport floor. Test intervals just below and above the support threshold.
- [ ] Exercise nested scroll, breakpoint changes, a moving support and removal mid-jump. Replay a route through the planner and integrator and compare their predicted landing platform.

**Acceptance:** The cat appears larger by default, fits both demo viewports, and lands only where its configured support footprint fits. At rest, planted paw markers align with the supporting edge within two CSS pixels across DPR 1, 2 and 3.

## Candidate result

The measured 2.62648-unit standing silhouette resolves to 112 or 88 CSS pixels. The integrator, graph, scanner and layout reconciler use a common footprint. Unit tests exercise the exact threshold at 32, 88, 112 and 144 pixels.
