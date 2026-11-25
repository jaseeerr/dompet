# Tabby

The orange tabby with a teal collar is original pixel art drawn for DOMPet during phase 5. All frames were composed for this project. No third-party art or attribution is used. The sheet is included for use with this private package under the project's private-use permissions.

Each cell is 32 × 24 pixels and faces right. The foot anchor is (16, 23), measured from the upper-left corner. Frames run left to right in the order defined in the character metadata.

## V1 rc.1 procedural tabby

The editable master is model.js. Its mesh shapes, coat markings and material colors are generated specifically for DOMPet. It uses no external model, photograph or texture. Run `node scripts/export-cat.mjs` to regenerate tabby.glb with Three.js GLTFExporter. The ground is Y = 0 and the nose points along positive X. The joint hierarchy and named meshes are preserved in the binary glTF export.

The neutral silhouette measures 2.62648 model units across the gameplay camera. Each limb has a hip or shoulder, knee, ankle and contact marker. Prefixes are `foreNear`, `foreFar`, `hindNear` and `hindFar`. Contact markers sit at (0.044, −0.09, 0) relative to their ankles. The pelvis and chest weight the torso. Seven tail bones weight the tapered tail. Eyelid nodes control visible eye height, and paired ear hinges carry their inner and outer surfaces. Stripe color is stored per vertex. The asset has no image textures or decoder dependency.

The export contains the pose reel and idle, walk, turn, jump, fall, land and sleep clips. The game samples its procedural pose against actual distance, velocity and support. The inspector plays the portable glTF clips. Run `npm run check:cat` after re-exporting to validate skins, clips, transforms, contact names and planted paw drift.

## V1 rc.2 textured tabby

The supplied source GLB in `downloaded assets/` contains an indexed 11,002-triangle mesh, its UV layout and an embedded PNG coat. It arrived without animation, a skeleton or embedded license terms. The export script preserves the texture, maps the mesh onto the DOMPet skeleton and bakes eight clips. The eyes are painted into the coat. The automatic 2D fallback uses fifteen poses from this same asset. The explicit sprite renderer uses the original pixel sheet.

## V1 rc.3 human

The supplied dompet-human.glb is shipped byte-for-byte. Its metadata names an original DOMPet human, declares no third-party asset notices and specifies Y up, +Z forward, an anchor between the soles and a 0.82 m walk cycle. Its embedded surface materials and eyelid morph targets are used directly. The 2D sheet was baked from the same model.

## V1 rc.4 Spider-Man

The supplied dompet-spiderman.glb includes custom geometry, suit and mask textures, an emblem, rig and ten clips. The WebShoot and WebPull clips drive web traversal, including the sprite fallback. WallCling is included in the GLB for future use. Its metadata identifies Spider-Man as a Marvel character and states that no character license is supplied. The fallback frames are renders of this same asset.
