# Phase 10 — Field journal, package and V1 release candidate

Begin after [phase 9](phase9.md) passes.

**Goal:** Deliver the complete animated 3D cat through the same simple browser integration as the prototype.

## Implementation sequence

1. Make the 3D cat the preferred renderer on supported devices. Finalize and document renderer selection, defaults, size units, fallback behaviour and the migration path for hosts using the 32 px sprite.
2. Update the field journal with normal-size exploration and an optional character inspector for slowing clips, inspecting the rig and comparing quality levels. Keep asset inspection outside the normal host bundle.
3. Package the renderer chunk, GLB, textures and any decoder files under stable package-relative URLs. Update the release allowlist, declarations, dependency notices and artwork attribution. Revisit private/public terms against the actual asset rights before selecting the release version.

**Develop**

- [x] Document how a host starts, pauses, hides and destroys the cat; include a plain browser or vanilla Vite example and a React mount/cleanup example. Keep SSR imports safe.
- [x] Document asset deployment under a nested base path, network and CSP requirements, graceful fallback and debugging of missing resources.
- [x] Update the changelog and release checklist with the measured size defaults, known limits and performance results. Treat repository visibility and publication as explicit release decisions.

**Test**

- [x] Inspect the actual npm tarball and install it in clean vanilla and React consumers. Serve their production builds under a subpath. Confirm the rig, textures, walking and facial clips load from packaged resources.
- [x] Verify import during SSR, initialization after hydration, Strict Mode remounts, reduced motion and the forced sprite path. Check that no model or decoder request goes to an undeclared external host.
- [x] Record a continuous journal run covering a walk in both directions, a turn toward the viewer, a jump, a drop, a landing, sleep and wake. Review at both default sizes against the [V1 objective](README.md).

**Acceptance:** A clean consumer can initialize the larger four-legged cat with the documented API. The final recording shows independent paw contacts, a readable face and coordinated full-body movement, and the shipped candidate passes the browser, package and asset-rights checks.

## Candidate result

The 1.0.0-rc.1 package includes the model, renderer chunk, declarations, notices and consumer examples. A clean Vite production build rendered both vanilla and React Strict Mode under /nested/. Node SSR import passed. See the [journal recording](media/journal.webm) and [benchmark results](../../benchmarks/RESULTS.md).
