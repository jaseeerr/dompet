# Phase 2 — Model a full domestic tabby

Begin after [phase 1](phase1.md) passes.

**Goal:** Deliver a recognizable full-body cat with four distinct legs and a readable face at the intended display sizes.

## Implementation sequence

1. Assemble permitted front, side and three-quarter references for one adult short-haired tabby. Mark the shoulder blades, rib cage, pelvis, hocks, paw pads, muzzle and ear placement on the design sheet.
2. Build the model in Blender or adapt a model with documented modification and redistribution rights. Review a neutral standing pose before painting the coat.
3. Paint the tabby stripes, lighter muzzle and chest, nose and ear interiors. Export a static GLB, load it into the phase 1 viewer and check what detail survives at 88 and 112 px.

**Develop**

- [x] Shape four independent limbs with separate paws, raised rear hocks and room for elbow and knee flexion. Leave enough topology around joints and eyelids for phase 3.
- [x] Model eyes, nose, muzzle pads, cheeks, ears and a tapered tail in depth. Choose the resting tail curve and view angle so the face and far-side legs can be distinguished.
- [x] Store the editable master, export settings, model orientation, scale, texture sources and attribution. Embed textures in the distributable GLB. [Three.js glTF loader](https://threejs.org/docs/pages/GLTFLoader.html)

**Test**

- [ ] Inspect all four sides in a turntable and the standing silhouette at actual desktop and mobile sizes. Use an untextured render to catch anatomy that depends on painted markings.
- [x] Re-export from the master and load the GLB in a clean viewer. Check normals, seams, paw height, texture resolution, triangle count and file size.

**Acceptance:** The turntable shows four complete limbs, a continuous back and tail, and a dimensional face. The journal-size three-quarter render retains a recognizable muzzle, eyes and ear silhouette. The asset record covers every shipped mesh and texture.

## Candidate result

The original procedural master exports six skinned surfaces with named joints, solid facial features and vertex-colored markings. Re-export produces the same binary. See the [standing portrait](media/tabby.png) and [actual-size poses](media/poses.png).
