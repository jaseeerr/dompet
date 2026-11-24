# DOMPet V1 — A larger, articulated 3D cat

## Candidate review

The ten implementation phases are available in `1.0.0-rc.1`. Start the field journal with `npm run dev` and open **Inspect the tabby rig and animations** to rotate, scrub and compare the exported poses. The editable master is a procedural Three.js model. Its reproducible GLB contains six skins, four contact markers and eight animation clips.

[Journal recording](media/journal.webm) · [Default-size pose sheet](media/poses.png) · [Hardware and software benchmarks](../../benchmarks/RESULTS.md)

The physical iPhone frame-rate gate remains open. The paired device had Web Inspector disabled. Each phase records the implementation and checks performed; unchecked plan items identify review coverage that was not independently confirmed.

## Original plan

Build a tabby that looks like a cat even in silhouette. When it walks slowly, a viewer should be able to follow each paw through contact, lift and swing. When it turns toward the viewer, the muzzle, eyes and ears should read as a face. When it jumps, the movement should travel from the hindquarters through the spine to the forepaws.

Use Three.js for rendering, Blender for authoring and a rigged GLB for delivery. The website remains a side-view platform world measured in viewport CSS pixels. The simulation owns position and velocity. The renderer gives the animal depth, a three-quarter view, lighting and expressive motion. Hosts continue to initialize one framework-independent pet.

The prototype defaults to a 32 px sprite and a 30 × 22 px physics body. Start V1 visual trials at **112 CSS px wide on desktop and 88 px on small screens**, measured across the neutral standing silhouette, including the tail. These are proposed defaults. An explicit host size wins. Measure the standing paws separately before choosing collision dimensions.

| Phase | Deliverable | Review question |
| --- | --- | --- |
| [1. Renderer integration](phase1.md) | Three.js overlay and visible fallback | Can the same simulated body drive either renderer? |
| [2. Character model](phase2.md) | Complete, textured cat mesh | Does the face and four-legged silhouette read at actual size? |
| [3. Skeleton and skinning](phase3.md) | Exportable quadruped and facial rig | Can it crouch, stretch and blink without mesh collapse? |
| [4. Scale and platform contact](phase4.md) | Shared size and paw-support model | Can the larger cat stand on the perches it chooses? |
| [5. Ground locomotion](phase5.md) | Weight-bearing walk, rest and turn | Do planted paws stay planted as the body moves? |
| [6. Airborne movement](phase6.md) | Anticipation, takeoff, fall and landing | Does the pose match the actual flight and impact? |
| [7. Face and secondary motion](phase7.md) | Gaze, breathing, ears, tail and sleep | Does the cat feel alive while standing still? |
| [8. Lighting and composition](phase8.md) | Finished real-time appearance | Is the face readable on both light and dark websites? |
| [9. Performance and resilience](phase9.md) | Profiled quality levels and recovery | Does the host stay usable on lower-powered devices? |
| [10. Consumer release](phase10.md) | Packaged, tested V1 candidate | Can a fresh app load the complete cat from the package? |

Complete the acceptance check in each file before advancing. Keep the field journal runnable throughout. Review movement at normal speed and in slow motion, using the actual on-page size as well as an enlarged inspection view. Keep source assets and redistribution permissions alongside the export. V1 names this development milestone; choose the package version during release review.
