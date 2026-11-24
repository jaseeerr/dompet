# Phase 10 — Private GitHub package distribution

Begin after the acceptance checks in [phase 9](phase9.md) pass.

## Implementation sequence

1. Confirm the private destination and collaborator access. Prepare the release commit with reproducible generated dist and a clean-build comparison in CI.
2. Audit tracked files and credentials, run release checks and tag the verified commit. Document SSH access and immutable pinning.
3. Install the tag from an authorized clean fixture with scripts disabled. Verify a read-only CI install, unauthorized denial and lockfile reproducibility.

**Goal:** Distribute an installable, versioned package directly from a private GitHub repository. Do not publish publicly or to the npm registry.

**Develop and release**

- [x] Create a private repository, e.g. `jaseeerr/dompet`, and push the complete source, tests and documentation.
- [x] Configure access for authorized collaborators only; use branch protection and required CI checks where available.
- [x] Set package name `dompet`, version `0.1.0`, `private: true`, `type: module`, and appropriate `exports`, `types`, `files` and `sideEffects` metadata.
- [x] Keep the release build reproducible. For MVP Git installs, generate and commit the `dist/` artifacts at release time so consumers do not require build-time dev dependencies or install lifecycle scripts. Ensure those artifacts are tracked despite ignore rules.
- [x] Make CI verify that the committed release artifacts match a clean build; include runtime assets in `dist/`.
- [x] Verify no secrets, credentials, local environment files or unlicensed assets are committed. Store any CI credentials as secrets, not source files.
- [x] Run final CI and package smoke tests; bump version and update changelog.
- [x] Tag the verified release `v0.1.0` and optionally create a private GitHub Release with notes and the packed tarball.
- [x] Document authenticated SSH Git installation and pinned tag/commit usage. For CI consumers, use a scoped read-only deploy key or approved machine credential; never embed tokens in package.json, lockfiles or URLs.

**Example package metadata (adjust actual output paths)**

```json
{
  "name": "dompet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "sideEffects": false
}
```

`sideEffects: false` is appropriate only if importing the package does not install styles or perform other necessary side effects. `private: true` prevents accidental npm publication; repository visibility and GitHub permissions control access to Git installs.

**Consumer installation**

After authorized users configure GitHub SSH authentication:

```bash
npm install 'git+ssh://git@github.com/jaseeerr/dompet.git#v0.1.0'
```

For immutable dependency pinning, use the verified commit SHA instead of a tag. Commit the consumer application's lockfile and use `npm ci` for reproducible installations.

**Test**

- Install the tagged package using SSH from a clean authorized environment with no local repository or global build tools.
- Verify installation with lifecycle scripts disabled (`npm install --ignore-scripts`) in a clean fixture, confirming committed artifacts suffice.
- Verify package import, TypeScript types, sprite loading and production bundle in a consumer application.
- Verify unauthorized users cannot fetch the private repository.
- Verify a clean CI consumer can authenticate using a read-only credential and that logs/lockfiles do not expose secrets.
- Verify pinned installation and `npm ci` work after subsequent development commits.

**Acceptance:** An authorized developer can install the private tagged package directly from GitHub and initialize the pet successfully. No public repository or npm registry publication has occurred.

The repository is private and the owner is its only listed collaborator. The GitHub account plan does not support protection rules for this private repository.

## Release record

The private annotated tag [v0.1.0](https://github.com/jaseeerr/dompet/tree/v0.1.0) resolves to `6524430e4139c2de2a9afc39ce298acdc0155729`. A clean SSH consumer with install scripts disabled resolved that exact commit, imported the ESM package and installed zero transitive dependencies. A separate Git consumer typechecked and rendered the embedded tabby from a production Vite build.

GitHub Actions reproduced the committed build, ran the browser suite, and installed the private repository with a read-only job token. Anonymous Git access returned HTTP 401. [Release commit checks](https://github.com/jaseeerr/dompet/actions/runs/45407911318) · [Tag checks](https://github.com/jaseeerr/dompet/actions/runs/45408355050)
