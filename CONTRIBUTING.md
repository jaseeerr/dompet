# Developing DOMPet

Use Node 24 and the committed npm lockfile. Run `npm ci` and `npm run dev` for the field journal. Runtime code lives in `src/`. Demo art and controls live in `demo/`.

## Runtime architecture

1. The public entry owns one overlay per document, lifecycle state and event subscriptions. Browser resources are acquired at start and disposed at destroy.
2. DOM observers coalesce layout changes. The scanner produces viewport-relative intervals with stable element IDs. Reconciliation carries the pet with its supporting surface.
3. The navigation graph tests candidate trajectories with the physics integrator. The explorer chooses movement intents. Fixed steps update the body independently of screen refresh rate.
4. Rendering maps body and behaviour state to tabby clips, scaling at the foot anchor. Library mode embeds the PNG in the ESM bundle. Debug metrics are instance-local.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. For the browser suite run `npx playwright install chromium firefox webkit`, then `npm run test:e2e`. Exercise the journal at desktop and mobile widths when changing controls or appearance. Run `npm run benchmark` for scanner, navigation and rendering changes.

For a release candidate, inspect `npm pack --dry-run` and the archive from `npm pack`. Test the tarball from a clean application with no source aliases. Check development serving, production builds, the public declarations and SSR. Keep temporary installations and browser artifacts outside the source tree.
