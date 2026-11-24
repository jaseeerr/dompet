# Phase 8 — Coat, eyes, lighting and page composition

Begin after [phase 7](phase7.md) passes.

**Goal:** Make the tabby look dimensional and legible against ordinary website content.

## Implementation sequence

1. Tune the GLB materials under a fixed studio setup. Use coat colour and roughness to separate fur, nose and paw pads; give the eyes a controlled highlight. Review texture detail at final display size.
2. Set a soft key, fill and restrained rim light. Choose a slightly elevated three-quarter view that shows depth between near and far legs while preserving the projected support anchor.
3. Add a soft contact shadow projected onto the usable surface. Fade it as the paws leave the perch and clip it at gaps, edges and exclusion zones. Compare a simple shadow texture against a dynamic shadow pass on the target devices.

**Develop**

- [ ] Tune the face on pale, dark and patterned pages. Remove eye glare, transparent fringes, noisy whiskers and shimmering coat markings.
- [x] Give the camera clearance for tail extension, upright ears and airborne stretch. Keep size consistent when the cat turns.
- [x] Record presentation presets and reference captures from the journal. Keep lighting local to the transparent pet overlay.

**Test**

- [x] Capture front three-quarter, side, turn, sleep and full-stretch jump frames at both default sizes. Review on light, dark and image-heavy backgrounds.
- [ ] Move the pet across a transparent panel, clipped card and viewport edge. Verify shadows stay with the valid support and the face remains readable through a turn.

**Acceptance:** The captures show a modeled face, distinct paws and coat volume at normal size. The shadow meets grounded paws, fades in flight, and never paints across an empty gap between platforms.

## Candidate result

The contact shadow is clipped to one supporting interval and fades with height. The [pose sheet](media/poses.png) shows five poses at both defaults; the journal inspector also supports angle, size, background and playback controls.
