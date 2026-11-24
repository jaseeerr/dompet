# Phase 7 — Facial expression, rest and secondary motion

Begin after [phase 6](phase6.md) passes.

**Goal:** Give the cat a readable face and quiet, coordinated movement between platform transfers.

## Implementation sequence

1. Build a relaxed idle with subtle rib-cage breathing, intermittent blinks, ear turns and tail-tip motion. Test it at normal on-page size before adding finer detail.
2. Let the eyes and head glance toward a reachable perch before movement. Layer bounded neck, ear and tail motion over the primary clips with explicit ownership of each animated bone or morph.
3. Author standing-to-curled sleep and wake-to-stand transitions. Tuck all four paws, settle the tail around the body, close the lids and retain gentle breathing in the sleeping pose.

**Develop**

- [x] Choose dwell times through the existing deterministic behaviour clock. Base gaze on pet state and perch geometry; the effect needs no page text or user input.
- [x] Limit head rotation, eye travel and secondary-motion amplitude. Give jump and landing clips priority over idle glances.
- [x] Freeze secondary animation along with locomotion on pause or reduced motion. On resume, blend from the displayed pose.

**Test**

- [ ] Watch a seeded rest–look–walk–sleep–wake sequence from the side and three-quarter camera. Check the eyes, eyelids, chest, ears and tail at actual size.
- [ ] Interrupt sleep with platform removal, enable reduced motion during a blink, and hide the tab during a turn. Check that the cat recovers without a pop or accumulated motion.

**Acceptance:** A viewer can distinguish alert rest, target attention and sleep from the face and posture alone. Across repeated transitions the head stays connected to the neck, eyes remain inside the lids and the tail clears the planted paws.

## Candidate result

Perch elevation steers the head and ear hinges. Simulation time drives blinking, breathing, tail motion, sleep and waking. The recorded seeded explorer reached idle, walk, prepare-jump, jump, fall and sleep.
