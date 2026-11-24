# Phase 9 — Demo, documentation and release candidate

Begin after the acceptance checks in [phase 8](phase8.md) pass.

## Implementation sequence

1. Wire the final public API into the interactive demo and document each control using working examples.
2. Audit sprite attribution, private-use terms, exports and file allowlist. Cut the candidate version and inspect an actual packed archive.
3. Install the tarball in clean vanilla and React fixtures. Run production builds and SSR imports following only the README.

**Goal:** Make the package understandable and ready for private consumers.

**Develop**

- [ ] Polish the demo into a realistic interactive mock website that naturally exposes different platform types.
- [ ] Add demo controls for pause/resume, size, speed, layout changes and debug mode.
- [ ] Write README covering installation, quick start, API, configuration, framework integration, accessibility, performance, troubleshooting and known limitations.
- [ ] Add architecture notes, contribution/testing instructions, changelog and asset attribution.
- [ ] Choose explicit private-use licensing/permissions; do not add a public open-source license unless intended.
- [ ] Verify generated declarations, package exports and bundled assets. Restrict published contents using `files`.
- [ ] Set initial release candidate version (e.g. `0.1.0-rc.1`).

**Test**

- Run full CI and visual review of demo.
- Execute `npm pack --dry-run`, then `npm pack`; inspect archive contents for required JS, declarations, assets and absence of secrets or unnecessary files.
- Install the packed tarball into clean vanilla Vite and React projects; verify development and production builds.
- Verify SSR-safe imports and browser initialization after a production build.
- Follow README from scratch without relying on repository-only files.

**Acceptance:** The package works outside its own repository, documentation matches implementation, and release candidate has no critical known defects.
