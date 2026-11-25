import { expect, test } from "@playwright/test";
for (const dpr of [1, 2, 3]) {
  test(`draws sharp, foot-anchored sprites at DPR ${dpr} after resize`, async ({
    browser,
  }) => {
    const page = await browser.newPage({
      deviceScaleFactor: dpr,
      viewport: { width: 1000, height: 300 },
    });
    try {
      await page.goto("/fixtures/lifecycle.html");
      const result = await page.evaluate(async () => {
        const url = new URL("./entry.ts", location.href);
        const { DOMPet } = (await import(
          url.href
        )) as typeof import("../../demo/fixtures/entry");
        const results = [];
        for (const size of [24, 32, 64]) {
          const pet = new DOMPet({
            character: "cat",
            renderer: "sprite",
            debug: true,
            size,
          });
          pet.start();
          pet.pause();
          // Compare the sampled sprite colours inside the footprint against the native palette.
          const canvas = document
            .querySelector("[data-dompet]")!
            .shadowRoot!.querySelector("canvas")!;
          const pixels = () => {
            const ctx = canvas.getContext("2d")!,
              state = pet.debugState!,
              d = window.devicePixelRatio;
            const w = Math.ceil(size * d);
            const h = Math.min(Math.round(state.y * d), Math.ceil(size * d));
            const data = ctx.getImageData(
              Math.round(state.x * d) - Math.floor(w / 2),
              Math.round(state.y * d) - h,
              w,
              h + 1,
            ).data;
            let orange = false,
              blended = false,
              bottom = -1;
            for (let i = 0; i < data.length; i += 4) {
              const [r, g, b, a] = data.subarray(i, i + 4);
              if (r === 223 && g === 136 && b === 70) orange = true;
              if (a !== 0 && a !== 255) blended = true;
              if (a && !(r === 173 && g === 32 && b === 91))
                bottom = Math.floor(i / (4 * w));
            }
            return { orange, blended, bottom, h };
          };
          const until = performance.now() + 3000;
          while (!pixels().orange && performance.now() < until)
            await new Promise((r) => setTimeout(r, 20));
          results.push(pixels());
          pet.destroy();
        }
        const pet = new DOMPet({ character: "cat", renderer: "sprite" });
        pet.start();
        pet.pause();
        return {
          results,
          width: document
            .querySelector("[data-dompet]")!
            .shadowRoot!.querySelector("canvas")!.width,
        };
      });
      for (const p of result.results) {
        expect(p.orange).toBe(true);
        expect(p.blended).toBe(false);
        expect(p.bottom).toBe(p.h - 1);
      }
      expect(result.width).toBe(1000 * dpr);
      await page.setViewportSize({ width: 485, height: 330 });
      await expect
        .poll(() =>
          page
            .locator("[data-dompet] canvas")
            .first()
            .evaluate((el) => (el as HTMLCanvasElement).width),
        )
        .toBe(485 * dpr);
    } finally {
      await page.close();
    }
  });
}
test("pending and failed image loads preserve the fallback and release callbacks on destroy", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  const result = await page.evaluate(async () => {
    const images: HTMLImageElement[] = [];
    window.Image = class extends Image {
      constructor() {
        super();
        images.push(this);
      }
      override set src(_url: string) {
        void _url;
      }
    };
    const url = new URL("./entry.ts", location.href);
    const { DOMPet } = (await import(
      url.href
    )) as typeof import("../../demo/fixtures/entry");
    const pet = new DOMPet({
      character: "cat",
      renderer: "sprite",
      debug: true,
    });
    pet.start();
    pet.pause();
    const state = pet.debugState!;
    const ctx = document
      .querySelector("[data-dompet]")!
      .shadowRoot!.querySelector("canvas")!
      .getContext("2d")!;
    const pixel = () =>
      Array.from(ctx.getImageData(state.x, state.y - 2, 1, 1).data);
    const pending = pixel();
    images[0].dispatchEvent(new Event("error"));
    const failed = pixel();
    pet.destroy();
    const second = new DOMPet({ character: "cat", renderer: "sprite" });
    second.start();
    second.destroy();
    return {
      pending,
      failed,
      released: images.every((im) => im.onload === null && im.onerror === null),
    };
  });
  expect(result.pending).toEqual([67, 50, 61, 255]);
  expect(result.failed).toEqual(result.pending);
  expect(result.released).toBe(true);
});
