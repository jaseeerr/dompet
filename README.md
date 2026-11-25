# DOMPet
A framework-independent browser pet. Spider-Man walks, turns, jumps, and zips by web to higher page surfaces.

## Install the private release

With read access to `jaseeerr/dompet` and GitHub SSH authentication configured, install the V1 candidate from your application directory:

```sh
npm install 'git+ssh://git@github.com/jaseeerr/dompet.git#v1.0.0-rc.6'
```

For an immutable pin, replace `v1.0.0-rc.6` with the full commit SHA returned by `git ls-remote git@github.com:jaseeerr/dompet.git refs/tags/v1.0.0-rc.6`. Commit your application's lockfile and use `npm ci` in subsequent builds. The repository tracks the compiled ESM library, declarations and self-hosted character assets. Installing with `--ignore-scripts` is supported.

For a private CI consumer, grant its deploy key read-only access and load the private key from the CI secret store. Use verified GitHub host keys. An approved read-only machine credential can also authenticate Git through a credential helper. Keep credentials out of dependency URLs, lockfiles and logs.

In a browser entry module, initialize the pet after the document body exists.

```js
import { DOMPet } from "dompet";

const pet = new DOMPet({ character: "spiderman", respectReducedMotion: true });
pet.start(); // After the document body exists.
```

In vanilla applications, call `pet.destroy()` when removing the host view. For React, mount this component once at the app root.

```js
import { useEffect } from "react";
import { DOMPet } from "dompet";

export function ReactPet() {
  useEffect(() => {
    const pet = new DOMPet();
    pet.start();
    return () => pet.destroy();
  }, []);
  return null;
}
```

Import and construction work during server rendering. The effect starts after hydration and cleans up on unmount, including React Strict Mode remounts. The package includes copyable [vanilla](examples/vanilla.js) and [React](examples/ReactPet.js) examples.

## Try the field journal

From the source checkout, run `npm ci` and `npm run dev`, then open the local Vite URL. **Pause pet** freezes the current pose. **Character size**, **Walking speed** and **Debug platforms** create a fresh pet with the selected options and preserve an explicit pause. **Add a perch** changes the layout. **Save note** adds your observation to the scrollable field log for the current session. **Refresh surfaces** rescans immediately.

## Public API

All constructor options are optional.

| Option | Default | Meaning |
| --- | --- | --- |
| `character` | `"spiderman"` | Select `"spiderman"`, `"human"` or `"cat"` |
| `size` | 112 desktop, 88 at viewport widths up to 600 px | Positive character size in CSS pixels, capped to the viewport |
| `renderer` | `"auto"` | Prefer WebGL with sprite fallback. Choose `"sprite"` for the selected character’s 2D renderer or `"webgl"` to request 3D with recovery. |
| `speed` | `1` | Ground and air speed multiplier. At 1, humanoids walk one authored stride per second (about 43 CSS px/s at 112 px tall). Air travel and cat movement use 180 CSS px/s. |
| `gravity` | `1200` | Positive downward acceleration in CSS pixels per second squared |
| `include`, `exclude`, `exclusionZones` | Empty arrays | CSS selectors for extra candidates, ignored subtrees and protected rectangles |
| `minPlatformWidth` | `15` | Minimum usable interval width in CSS pixels |
| `debug` | `false` | Enable debug rendering, inspection and movement controls |
| `zIndex` | `2147483646` | Signed 32-bit integer stacking level for the overlay |
| `respectReducedMotion` | `true` | Freeze simulation and sprite animation when the system requests reduced motion |

The constructor validates option values. Browser selector syntax is checked at `start()`. Starting a second instance in the same document throws. After the owner is destroyed, the second instance can retry. Repeated starts on the owner are safe.

`pet.state` reports `new`, `running`, `paused`, `hidden`, or `destroyed`. Use `pause()` and `resume()` to control playback, and `hide()` and `show()` to control visibility. Hiding stops playback. Showing preserves an explicit pause and the current system motion preference. When reduced motion is enabled, the cat stays still from startup. Runtime preference changes take effect immediately. `resume()` clears an explicit pause and honours the preference. A modal or hidden document also takes precedence over playback. `refresh()` updates visible geometry. `destroy()` is terminal and releases the document for another instance.

Subscribe before `start()` to receive startup events. Every subscription returns a cleanup function. Destroy also releases subscriptions.

```js
const unsubscribe = pet.on("landing", ({ platformId, x, y }) => {
  console.log(platformId, x, y);
});
unsubscribe();
```

| Event | Payload | When it fires |
| --- | --- | --- |
| `statechange` | `{ previous, state }` | Effective lifecycle state changes, including suspension and destruction |
| `landing` | `{ platformId, x, y }` | An airborne pet acquires support, with feet in viewport CSS pixels |
| `error` | `Error` | Startup fails or the sprite falls back. Startup errors are also thrown to the caller. |

TypeScript consumers can import `DOMPetOptions`, `DOMPetState`, and `DOMPetEvents` from `dompet`. Debug hosts can call `debugMove(-1 | 0 | 1)`, `debugJump()`, `debugReset()`, and `debugExplore()`. The `debugState` getter returns a snapshot of position, velocity, supporting platform and behaviour while debug mode is active.

## Platform discovery

Enable the canvas inspector with **Debug platforms** in the playground, or construct `new DOMPet({ debug: true, include: ['.ledge'], exclude: ['.menu'], minPlatformWidth: 15 })`. Include selectors add candidates. Exclusions skip matching subtrees, including elements marked `data-dompet-ignore`. The scanner applies both the configured minimum width (15 CSS pixels by default) and the resolved paw footprint.

DOMPet refreshes automatically after scrolling, resizing, route changes and DOM updates. Call `pet.refresh()` to synchronously rescan a custom layout. Lines mark usable intervals, with stable element IDs and a viewport floor. The inspector counts rejected candidates by reason. Top-edge visibility uses sampled browser hit tests, so thin occluders, pointer-transparent layers and transformed geometry can be approximate. Discovery covers the light DOM of the current document.

## Physics playground

Choose **Debug platforms**, then **Walk left** or **Walk right** to keep moving until **Stop walking**. **Jump** takes off from a supporting surface. **Reset pet** returns the cat to the upper part of the viewport. **Inspect physics** displays a snapshot of its feet position, velocity and supporting platform ID. Positions use viewport CSS pixels and velocities use pixels per second.

Physics advances at 120 fixed steps per second with up to eight steps per animation frame. Long frame gaps discard excess simulation time. Top edges allow upward passage and catch a descending pet where its feet overlap a visible interval.

## Autonomous exploration

The pet explores by default. It samples takeoff points on each visible interval and runs candidate walks, jumps and drops through the fixed-step physics engine. A* links successful transfers into routes, with a preference for less-visited destinations. If no route is available, the pet strolls on its current surface or rests. Narrow or unusually placed jumps can fall between sampled trajectories.

A refresh that changes the platform geometry or viewport invalidates the current route. During a scan interval, two failed transfers between the same pair of surfaces retire that connection. Manual movement, jump and reset controls take over in debug mode. Choose **Explore** to return control to the pet. **Inspect physics** includes the current behaviour.

## Cat rendering

DOMPet loads Three.js and the selected GLB on demand. The human’s size is its standing height. Its embedded Idle, Walk, Turn, JumpTakeoff, Airborne and Land clips follow simulation time and distance, with Blink layered independently on the mask lenses or eyelids. Spider-Man plants his feet through the 1.75-second turn and 1.02-second landing. His airborne pose responds to ascent and descent. Its support footprint is 26% of its height. Choose `character: "cat"` for the tabby, or `{character:"cat",renderer:"sprite",size:32}` for the prototype pixel art.

For direct ESM deployment, copy the entire `dist/` directory under your site path and import its `index.js`. Keep `chunks/` and `assets/` beside it. Allow same-origin scripts and model fetches in CSP and permit `data:` images for the embedded fallback. A failed import, model request or WebGL context switches to a 2D rendering of the selected character at the current feet. Inspect `[data-dompet]` and its `data-renderer` attribute for loading, webgl or sprite. Vite consumers can import the package by name. [Art provenance](src/characters/ART.md)

## Dynamic layouts

The cat follows its supporting element through page and nested scrolling, viewport changes and layout shifts. Removing or clipping away the surface releases the cat. Geometry updates are batched per frame. CSS motion triggers additional samples about every 64 ms for up to 1.5 seconds, plus a final refresh when the transition or animation ends.

Native modal dialogs and visible elements marked `aria-modal="true"` suspend the pet. Hidden documents suspend simulation and geometry scans. On return, DOMPet refreshes before continuing and preserves an explicit pause. Use `exclusionZones: ['.checkout-panel']` to exclude selected elements as perches and hide the sprite wherever its bounds overlap their visible viewport rectangles.

Geometry uses axis-aligned viewport rectangles and sampled hit tests in the current document’s light DOM. Rotations, 3D transforms, complex stacking contexts and pointer-transparent occluders can produce approximate edges. Iframe contents and shadow-tree interiors are outside the scanner. For long-running custom motion or layout changes outside observer coverage, call `refresh()` from the host.

## Performance diagnostics

With `debug: true`, read `pet.debugMetrics` for the latest scanner, refresh, physics, navigation, render and update/render timings in milliseconds. It also reports platform count, graph nodes, cached edges and planning attempts. Metrics are local to the instance and are released on destroy.

Run `npm run benchmark` with Playwright Chromium installed to repeat the reference workloads. The benchmark prints JSON lines for each node count, CPU throttle setting and heap sample. Set `DOMPET_BENCH_GPU=metal` on an Apple GPU to use hardware rendering. The report includes the renderer, draw calls, triangles, load time, frame intervals and GPU timing where available. [Benchmark results](benchmarks/RESULTS.md)

## Accessibility and troubleshooting

The decorative overlay is inert, hidden from assistive technology and transparent to pointer events. The host retains keyboard focus and scrolling. Provide native buttons for pause and visibility if your users need those controls.

| Symptom | What to check |
| --- | --- |
| The cat stays still | Read `pet.state`. A system reduced-motion preference or explicit pause freezes movement. An exploring cat also rests between trips. |
| The cat disappears | Check modal dialogs, document visibility, exclusion zones and the host's stacking context. |
| A perch is missing | Enable debug mode, inspect rejection counts and check clipping, painted surfaces and minimum width. Call `refresh()` after custom layout changes. |
| A second start throws | Destroy the instance that owns the document. In React, pair each effect's start with cleanup. |
| A server-rendered page reports a missing document | Move `start()` to the client entry or mount effect. |

The maintainer builds the package with `npm run build` and `npm pack` from a clean source installation. Private-use permissions and release notes accompany the tarball. [Private-use terms](LICENSE) · [Changelog](CHANGELOG.md)
