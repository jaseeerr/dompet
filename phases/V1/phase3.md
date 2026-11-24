# Phase 3 — Rig the legs, spine and face

Begin after [phase 2](phase2.md) passes.

**Goal:** Produce a deforming quadruped rig that can carry weight, look around and compress into a crouch.

## Implementation sequence

1. Build a pelvis and chest joined by a flexible spine. Add neck, head, shoulder blades, four individual limb chains, paws and a segmented tail. Set consistent left/right names and a ground-level root.
2. Add authoring controls for paw placement, knee and elbow direction, shoulder travel and tail curl. Add eye aim, eyelid closure and independent ear rotation. Weight the mesh against deliberately extreme poses.
3. Bake a short pose reel onto exported bones and facial morph targets. Verify the GLB in the journal, since authoring constraints need their results baked for playback.

**Develop**

- [x] Add named contact markers under all four paws and record their bind-pose offsets from the root. Record forward/up axes and the reference standing dimensions.
- [ ] Test skin weights at the groin, shoulder, neck, muzzle and tail base. Correct pinching and inverted bends before producing locomotion clips.
- [ ] Supply a mapping of exported bone and morph names plus an asset check that reports missing markers, duplicate clip names and invalid transforms.

**Test**

- [x] Pose each leg independently, then test a deep crouch, high forepaw reach, full stretch, head turn, blink and curled sleeping pose.
- [ ] Compare the Blender and browser pose reels from the same camera angles. Check that closed lids cover the eyes and fixed paws stay at their markers.

**Acceptance:** All four paws can be placed independently, the spine visibly flexes and the face can blink and aim. The exported pose reel reproduces those controls without broken joints, detached eyes or missing animation channels.

## Candidate result

Four contact markers and two-link limb chains drive the paws. Six skins bind the four limbs, spine and tail. The exported pose reel and inspector use the same joint hierarchy as gameplay. Rig names and offsets are in the [asset record](../../src/characters/ART.md). The editable authoring source is JavaScript.
