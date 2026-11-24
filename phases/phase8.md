# Phase 8 — Performance, reliability and cross-browser hardening

Begin after the acceptance checks in [phase 7](phase7.md) pass.

## Implementation sequence

1. Build repeatable stress fixtures and collect baseline timings with the pet disabled on a named machine/browser.
2. Instrument each subsystem, measure p95 timings and optimize the measured bottleneck. Bound neighbour queries and refresh work.
3. Automate the browser matrix and compare enabled timings, bundle size and resource counts after 100 teardown cycles. Record results alongside targets.

**Goal:** Ensure the package is safe to embed in realistic applications.

**Develop**

- [ ] Profile scanner, geometry refresh, physics, pathfinding and rendering independently.
- [ ] Cache candidate geometry, bound candidate counts and pathfinding work, and use a simple spatial index if profiling justifies it.
- [ ] Avoid quadratic graph construction on large pages by querying nearby candidate platforms.
- [ ] Add debug counters for scan time, platform count, frame time, graph size and replans.
- [ ] Add stress fixtures with 100, 1,000 and 5,000 DOM nodes, continuous mutations and nested scrolling.
- [ ] Establish release benchmarks on a documented reference machine and browser.
- [ ] Run long-lived and repeated lifecycle tests for leaks. Confirm no network calls, input-value collection or telemetry by default.
- [ ] Configure CI to typecheck, lint, build, unit-test and run browser tests.

**Initial performance targets (verify and report, not guarantees)**

| Metric | Target |
| --- | --- |
| Core JS | At most 50 KiB gzip, excluding sprites |
| Steady-state pet update/render | p95 under 2 ms per frame on reference desktop |
| Geometry refresh, 1,000-node fixture | p95 under 16 ms on reference desktop |
| Large layout refresh | Chunk work where needed; avoid pet-induced tasks over 50 ms |
| Idle/hidden tab | No continuous scanning or physics work while hidden |
| Cleanup | No retained pet-owned DOM, observers, listeners or RAF callbacks after destroy |

**Test**

- Browser matrix: Chromium, Firefox, WebKit; desktop and representative mobile viewports.
- CPU throttling, rapid mutations, repeated route changes and 100 lifecycle cycles.
- Long-running autonomous exploration; no uncaught exceptions, runaway memory growth or invalid coordinates.
- Compare baseline host performance with pet enabled; record measurements and limitations.
- Check package bundle size and dependency tree.

**Acceptance:** CI passes, performance measurements are recorded, critical regressions are resolved and known limitations are documented.
