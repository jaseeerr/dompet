# Changelog

## 1.0.0-rc.5

Humanoid walking speed follows standing height and the authored stride. Reversals and landings hold ground position for the full clip. Airborne limbs respond to vertical velocity. Spider-Man’s 2D renderer now includes 24 walk frames, a stepping turn and landing recovery.

## 1.0.0-rc.4

Spider-Man is the default character with animated mask lenses, seven authored clips, short blends between body poses and a matching 2D fallback. Explicit human and cat selections remain available.

## 1.0.0-rc.3

The supplied rigged human is now the default companion. Walking, blinking, turning and jump phases use its embedded clips. A human sprite sheet provides offline graphics fallback. Existing explicit cat selections retain the tabby.

## 1.0.0-rc.2

Replaces the procedural cat with the supplied textured orange tabby, rigged for the existing movement system. Automatic fallback draws poses rendered from the same coat. Set `renderer: "sprite"` for the original pixel art.

## 1.0.0-rc.1

Adds a locally hosted Three.js tabby with six skins, eight portable animation clips, responsive sizing, footprint-aware navigation and context-loss recovery. The journal includes a rig inspector and renderer selection.

## 0.1.0 — 2026-11-24

First private Git release. Consumers can install the tagged repository with lifecycle scripts disabled. CI compares the committed build with a clean build and checks a private Git install using a read-only job token.

## 0.1.0-rc.1 — 2026-11-24

First private release candidate. The package includes an animated tabby, DOM platform discovery, autonomous movement, responsive layout tracking, reduced-motion support, lifecycle controls and typed events. The ESM build embeds its sprite and has zero runtime dependencies.

The field journal demo supports changing the cat’s visual size, walking speed and habitat layout. The browser suite covers desktop and mobile viewports, integration cleanup and host interaction.
