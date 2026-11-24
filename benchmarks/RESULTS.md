# Phase 8 reference measurements

Measured on November 24, 2026 with an Apple M5, Darwin 25.6.0, Node 24.18.0 and headless Chromium 159.0.8154.6. Repeat with `npm run benchmark` after installing Playwright Chromium. Timing thresholds are reference targets. Shared CI runners execute correctness checks; they do not gate releases on hardware-specific timings.

## Method

The runner loads the production ESM bundle into an isolated page at 1280 × 720 CSS pixels. Each fixture contains 100, 1,000 or 5,000 card nodes inside nested scroll containers. For the host baseline and enabled pass, each animation frame changes one card's height and scrolls the inner panel. The interval measurement discards ten warm-up frames and retains 80. The 4× row uses Chromium CPU throttling.

Refresh timings cover 40 synchronous `refresh()` calls on the scrolling page with debug disabled. Update/render timings cover 240 animation frames with instrumentation and the debug overlay enabled after scrolling settles. They include navigation intent, physics and animation updates, and canvas drawing. These figures measure JavaScript time. Compositing and host work contribute to the separate frame-interval metric. The timer resolution can round individual steps to zero.

## Results

All timings below are p95 milliseconds. The original refresh column uses the phase 7 implementation on the same machine and fixture. Frame interval includes the host's work during continuous scrolling and mutation.

| Cards | CPU | Original refresh | Updated refresh | Pet update/render | Host interval, disabled | Host interval, enabled |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 1× | 4.6 | 4.7 | 0.5 | 16.8 | 16.7 |
| 1,000 | 1× | 28.0 | 4.6 | 0.5 | 16.7 | 16.8 |
| 5,000 | 1× | 127.4 | 14.3 | 0.4 | 16.7 | 33.3 |
| 1,000 | 4× | 115.8 | 15.1 | 0.7 | 16.8 | 33.4 |

On the 1,000-card reference workload, navigation and physics each took 0.1 ms p95 and rendering took 0.4 ms p95. The scanner took 3.6 ms in its last debug refresh. The steady-state 2 ms target and the 16 ms refresh target were met. At 5,000 cards, the enabled host interval still occasionally spans two display frames during continuous mutation. No long tasks were reported during the measured workload windows. Across all four runs the longest individually timed refresh was 15.3 ms.

The production ESM bundle, including the sprite, was 11,872 bytes gzip (11.6 KiB), within the 50 KiB target. After 25 warm-up lifecycles and four batches of 25 additional cycles, post-GC heap samples were 906,548, 906,548, 913,380, 925,008 and 925,080 bytes. In a separate five-minute simulated browser run at 60 Hz, the pet made 94 landings and retained finite coordinates throughout. Post-GC JS heap ranged from 1.09 to 1.15 MiB. These short reference runs can catch gross growth but cannot establish a long-term memory ceiling.

## Work limits and trade-offs

- Bounding rectangles and computed styles are reused within each refresh, keeping scroll and mutation results fresh. Above 256 candidates, each visible edge gets up to three occlusion samples. Above 2,048 candidates, viewport samples, their ancestors and adjacent siblings provide a shortlist of up to 256 candidates. At most 128 element platforms plus the viewport floor are retained. Small or obscured ledges can be missed on dense pages.
- Trajectory checks query 64-pixel vertical bands, including the distance the feet can descend in a physics step. Edge construction resumes from its previous launch sample and evaluates up to six trajectories per planning step. A decision considers up to eight destinations, with up to 24 expanded surfaces per budgeted route search. A sufficiently long or intricate route may be skipped.
- Development and production builds have zero runtime package dependencies. The debug metrics include scan and refresh duration, frame and subsystem timings, platform and graph sizes, cached edges and planning attempts.

## Verification

The reliability suite runs 100 start/pause/resume/destroy cycles per browser profile with route and resize invalidations pending. It checks overlay removal, observer disconnection, abortable listener cleanup and RAF cancellation. It traps reads of the fixture input value and watches for HTTP(S) requests after the modules are loaded. A hidden active document schedules no frames or scans during the test interval.

The browser matrix uses Chromium, Firefox and WebKit with desktop and mobile viewport sizes. Mobile coverage uses resized desktop engines. Bundle size includes the embedded sprite. Heap samples use Chromium's JS heap after explicit GC and do not measure native browser or GPU memory.
