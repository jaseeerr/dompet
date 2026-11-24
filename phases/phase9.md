# Phase 9 — Demo, documentation and release candidate

Begin after the acceptance checks in [phase 8](phase8.md) pass.

## Implementation sequence

1. Wire the final public API into the interactive demo and document each control using working examples.
2. Audit sprite attribution, private-use terms, exports and file allowlist. Cut the candidate version and inspect an actual packed archive.
3. Install the tarball in clean vanilla and React fixtures. Run production builds and SSR imports following only the README.

**Goal:** Make the package understandable and ready for private consumers.

**Develop**

- [x] Polish the demo into a realistic interactive mock website that naturally exposes different platform types.
- [x] Add demo controls for pause/resume, size, speed, layout changes and debug mode.
- [x] Write README covering installation, quick start, API, configuration, framework integration, accessibility, performance, troubleshooting and known limitations.
- [x] Add architecture notes, contribution/testing instructions, changelog and asset attribution.
- [x] Choose explicit private-use licensing/permissions; do not add a public open-source license unless intended.
- [x] Verify generated declarations, package exports and bundled assets. Restrict published contents using `files`.
- [x] Set initial release candidate version (e.g. `0.1.0-rc.1`).

**Test**

- Run full CI and visual review of demo.
- Execute `npm pack --dry-run`, then `npm pack`; inspect archive contents for required JS, declarations, assets and absence of secrets or unnecessary files.
- Install the packed tarball into clean vanilla Vite and React projects; verify development and production builds.
- Verify SSR-safe imports and browser initialization after a production build.
- Follow README from scratch without relying on repository-only files.

**Acceptance:** The package works outside its own repository, documentation matches implementation, and release candidate has no critical known defects.

The verified artifact is [dompet-0.1.0-rc.1.tgz](../releases/dompet-0.1.0-rc.1.tgz). A clean build produced an identical tarball, SHA-256 `035db45cdec1767386d870359531224baf27c1fbaa7bd13ce5387b230ff665f5`.

The dry run matched the actual 11-file archive. Separate vanilla and React Vite applications installed the tarball, typechecked and rendered the embedded sprite in development and production. Node imports and server rendering of the packaged React example passed. The field journal was reviewed at 1280 × 800 and 390 × 844. A clean install passed typecheck, lint, build, 16 unit tests and 51 browser tests. The hosted GitHub Actions run remains pending upload.
