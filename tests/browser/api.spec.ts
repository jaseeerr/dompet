import { expect, test } from "@playwright/test";
import type { DOMPet } from "../../src";
declare global {
  interface Window {
    apiPet: DOMPet;
    unmountPet: () => void;
  }
}
test("combines motion preferences, visibility and explicit pause without overriding user choices", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fixtures/lifecycle.html");
  const initial = await page.evaluate(async () => {
    const { DOMPet } = (await import(
      new URL("./entry.ts", location.href).href
    )) as typeof import("../../src");
    const pet = (window.apiPet = new DOMPet({ debug: true, zIndex: 123 }));
    const states: string[] = [];
    const off = pet.on("statechange", (e) => states.push(e.state));
    pet.start();
    pet.start();
    pet.hide();
    pet.hide();
    pet.show();
    off();
    off();
    pet.hide();
    pet.show();
    pet.resume();
    return {
      states,
      state: pet.state,
      y: pet.debugState!.y,
      z: getComputedStyle(document.querySelector("[data-dompet]")!).zIndex,
    };
  });
  expect(initial).toMatchObject({
    states: ["paused", "hidden", "paused"],
    state: "paused",
    z: "123",
  });
  await page.evaluate(() => window.apiPet.pause());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await page.evaluate(() => window.apiPet.state)).toBe("paused");
  await page.evaluate(() => window.apiPet.resume());
  await expect
    .poll(() => page.evaluate(() => window.apiPet.debugState!.y))
    .toBeGreaterThan(initial.y);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => page.evaluate(() => window.apiPet.state))
    .toBe("paused");
  const ignored = await page.evaluate(async () => {
    window.apiPet.destroy();
    const { DOMPet } = await import(new URL("./entry.ts", location.href).href);
    const pet = new DOMPet({ respectReducedMotion: false });
    pet.start();
    const state = pet.state;
    pet.destroy();
    return state;
  });
  expect(ignored).toBe("running");
});
test("reports startup errors, allows retry and supports teardown inside a landing callback", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  const result = await page.evaluate(async () => {
    const { DOMPet } = (await import(
      new URL("./entry.ts", location.href).href
    )) as typeof import("../../src");
    const first = new DOMPet(),
      second = new DOMPet({ debug: true, speed: 2, gravity: 600 }),
      bad = new DOMPet({ include: ["["] });
    const errors: string[] = [];
    for (const p of [second, bad]) p.on("error", (e) => errors.push(e.message));
    try {
      bad.start();
    } catch {
      /* syntax error */
    }
    first.start();
    try {
      second.start();
    } catch {
      /* occupied */
    }
    first.destroy();
    second.start();
    second.debugMove(1);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    const vx = second.debugState!.vx;
    const landing = await new Promise<string>((resolve) =>
      second.on("landing", (e) => {
        second.destroy();
        resolve(e.platformId);
      }),
    );
    second.start();
    return {
      errors,
      vx,
      landing,
      state: second.state,
      overlays: document.querySelectorAll("[data-dompet]").length,
    };
  });
  expect(result).toMatchObject({
    vx: 360,
    landing: "floor",
    state: "destroyed",
    overlays: 0,
  });
  expect(result.errors).toHaveLength(2);
});
test("mounts the vanilla and React Strict Mode integrations and releases the document", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  for (const mode of ["vanilla", "react", "react"]) {
    await page.evaluate(async (mode) => {
      const { mountPet, mountStrict } = await import(
        new URL("./integrations.js", location.href).href
      );
      const root =
        document.querySelector("main") ??
        document.body.appendChild(document.createElement("main"));
      window.unmountPet = mode === "react" ? mountStrict(root) : mountPet();
    }, mode);
    await expect(page.locator("[data-dompet]")).toHaveCount(1);
    await page.evaluate(() => window.unmountPet());
    await expect(page.locator("[data-dompet]")).toHaveCount(0);
  }
});
test("overlay leaves touch, form interaction and keyboard focus with the host", async ({
  browser,
}) => {
  const page = await browser.newPage({ hasTouch: true });
  try {
    await page.goto("/");
    const overlay = page.locator("[data-dompet]");
    await expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(
      await overlay.evaluate(
        (el) =>
          (el as HTMLElement).inert &&
          getComputedStyle(el).pointerEvents === "none",
      ),
    ).toBe(true);
    await page.getByLabel("Observation").tap();
    await page.keyboard.type("Tabby");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Save note" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("li").first()).toHaveText("Tabby");
  } finally {
    await page.close();
  }
});
