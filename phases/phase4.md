# Phase 4 — Autonomous navigation and behaviour

Begin after the acceptance checks in [phase 3](phase3.md) pass.

## Implementation sequence

1. Generate nearby candidate transitions and validate them by replaying the phase 3 integrator. Store takeoff and landing intervals with each edge.
2. Prove single-edge execution before adding A* routes. Drive physics with intents and use seeded dwell and target selection.
3. Invalidate stale edges on world changes, cap retries and replay failed jumps and disconnected islands in a long seeded run.

**Goal:** Allow the pet to explore without developer or user control.

**Develop**

- [ ] Implement a finite-state machine: idle, walk, prepare-jump, jump, fall, sleep and recover.
- [ ] Build a navigation graph of platforms and feasible transitions: walking, jumping and controlled drops.
- [ ] Calculate reachability using the same gravity, speed and jump parameters as the physics engine. Simulate candidate trajectories to identify intervening landings and safe landing intervals.
- [ ] Start with local reachable-target selection; add A* for multi-platform routes once the graph is reliable. Use movement cost and optional novelty weighting.
- [ ] Add randomized dwell times, exploration preferences, rest intervals and direction changes; avoid repetitive oscillation.
- [ ] Replan when a destination disappears or changes, recover from failed jumps and enforce bounded retry attempts.
- [ ] Separate navigation intent from physics execution; the controller must not teleport the pet to its target.

**Test**

- Reachable and unreachable jumps, intermediate platforms, narrow landing intervals, disconnected islands and drop transitions.
- Route invalidation, failed-jump recovery and deterministic seeded behaviour.
- No perpetual retries when a route is impossible; idle/sleep fallback works.
- Run a seeded multi-minute simulation and verify all positions remain finite and the pet continues exploring or resting appropriately.

**Acceptance:** The pet independently traverses reachable parts of the demo and handles disconnected layouts without getting stuck in repeated failed actions.
