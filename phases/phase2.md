# Phase 2 — DOM scanner and platform generation

Begin after the acceptance checks in [phase 1](phase1.md) pass.

## Implementation sequence

1. Start with a static fixture and a pure segment type. Assign element IDs through a WeakMap so sorting and rescanning preserve identity.
2. Batch candidate reads, intersect ancestor clips, then split sampled visible top edges into intervals. Record each rejection for debug inspection.
3. Normalize coincident edges with deterministic tie breaking, insert the floor and render the resulting snapshot over the fixture.

**Goal:** Turn arbitrary visible UI into a usable set of walkable platforms.

**Develop**

- [x] Discover candidate semantic elements (`button`, `input`, `textarea`, `nav`, `section`, `article`, etc.) and styled containers such as cards.
- [x] Filter hidden, detached, zero-sized, transparent/non-visual wrappers and elements outside the visible region. Use size thresholds relative to pet dimensions.
- [x] Exclude the overlay, `script`, `style`, explicit ignore selectors and inappropriate content.
- [x] Resolve overflow clipping and use sampled hit testing where practical to avoid obvious occluded surfaces. Do not assume every bounding rectangle is actually visible.
- [x] Represent walkable top edges as platform segments with stable ID, left/right bounds, height, source and visible intervals.
- [x] Deduplicate overlapping/coincident edges and suppress page-sized wrappers that would make navigation uninteresting. Include a viewport-floor fallback.
- [x] Provide include/exclude selectors and configurable minimum platform width.
- [x] Implement debug mode with platform lines, IDs, candidate counts and rejection reasons.

**Test**

- Cards, inputs, buttons, nested divs, grid/flex layouts, hidden elements, clipped scroll containers and overlapping elements.
- Identical or near-identical edges do not create duplicate platforms.
- Ignore selectors work and the overlay never becomes a platform.
- Stable IDs persist through geometry refresh; removed elements disappear from the world.
- Empty pages and pages with no usable candidates still have a safe fallback.

**Acceptance:** Debug mode highlights usable UI surfaces without marking every DOM wrapper. The resulting world is deterministic for a fixed layout.

Verified with typecheck, lint, the ESM and declaration build, Node import, two unit tests and four Chromium tests. Reviewed the playground overlay visually.
