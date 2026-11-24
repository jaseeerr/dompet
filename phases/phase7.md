# Phase 7 — Public API, configuration and accessibility

Begin after the acceptance checks in [phase 6](phase6.md) pass.

## Implementation sequence

1. Specify defaults, validation, lifecycle transitions and one-active-instance behaviour in a public contract. Export only consumer types and the entry point.
2. Apply reduced-motion changes at startup and runtime while preserving explicit user pause. Return cleanup functions for event subscriptions.
3. Mount vanilla and React examples, including Strict Mode remounts, and verify forms, focus, touch and SSR imports.

**Goal:** Make integration simple, stable and non-disruptive.

**Develop**

- [ ] Finalize typed constructor options, sensible defaults, validation and documented public methods/events.
- [ ] Support character, size, speed, gravity, include/exclude selectors, debug mode, rendering layer and reduced-motion preference.
- [ ] Expose lifecycle and useful event subscriptions (state change, landing, error); subscriptions must return cleanup functions.
- [ ] Keep start/pause/resume/destroy semantics idempotent; document single-active-instance MVP constraint and behaviour after destroy.
- [ ] Respect `prefers-reduced-motion` by disabling autonomous animation by default when requested; respond to changes and expose pause/hide control for host applications.
- [ ] Ensure overlay is non-focusable, `aria-hidden`, and `pointer-events: none`; never trap keyboard focus or intercept user input.
- [ ] Create integration examples for vanilla JS, React with effect cleanup and SSR-safe initialization.

**Proposed API (subject to implementation refinement)**

```ts
import { DOMPet } from 'dompet';

const pet = new DOMPet({
  character: 'cat',
  size: 32,
  speed: 1,
  exclude: ['[data-dompet-ignore]'],
  debug: false,
  respectReducedMotion: true,
});

pet.start();
pet.pause();
pet.resume();
pet.refresh();
pet.destroy();
```

**Test**

- Valid/invalid options, lifecycle ordering, event unsubscription and double initialization.
- Mouse, touch, keyboard, form submission, scrolling and screen-reader semantics remain unaffected.
- Reduced-motion preference at startup and runtime; explicit pause and resume.
- React mount/unmount including Strict Mode and SSR import.

**Acceptance:** A developer can install and initialize the package using a few lines, and the host application remains fully usable with the pet enabled.
