# DOMPet
A framework-independent browser pet. The placeholder falls onto visible page surfaces and rests with its feet on the first usable edge.

Run `npm ci` and `npm run dev` to open the playground at the local URL printed by Vite. Use the habitat and field notes controls to change the layout and try interacting through the overlay.

Import `DOMPet` from `dompet`, construct it and call `start()` after the document body exists. Import and construction are SSR-safe. Use `pause()` to freeze the pose and `resume()` to continue. Repeated calls are safe. Destroy releases the overlay, animation callback and resize listener permanently. Construct a fresh instance to start again.

Use `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` for local checks. Install Chromium with `npx playwright install chromium` before `npm run test:e2e`. Run `npm run format` to format the workspace.

## Platform discovery

Enable the canvas inspector with **Debug platforms** in the playground, or construct `new DOMPet({ debug: true, include: ['.ledge'], exclude: ['.menu'], minPlatformWidth: 15 })`. Include selectors add candidates. Exclusions skip matching subtrees, including elements marked `data-dompet-ignore`. Width is in viewport CSS pixels and defaults to half the placeholder width.

Call `pet.refresh()` after scrolling or changing the layout. Startup and viewport resize also scan the page. Lines mark usable intervals, with stable element IDs and a viewport floor. The inspector counts rejected candidates by reason. Top-edge visibility uses sampled browser hit tests, so thin occluders, pointer-transparent layers and transformed geometry can be approximate. Discovery covers the light DOM of the current document.

## Physics playground

Choose **Debug platforms**, then **Walk left** or **Walk right** to keep moving until **Stop walking**. **Jump** takes off from a supporting surface. **Reset pet** returns the cat to the upper part of the viewport. **Inspect physics** displays a snapshot of its feet position, velocity and supporting platform ID. Positions use viewport CSS pixels and velocities use pixels per second.

Physics advances at 120 fixed steps per second with up to eight steps per animation frame. Long frame gaps discard excess simulation time. Top edges allow upward passage and catch a descending pet where its feet overlap a visible interval.
