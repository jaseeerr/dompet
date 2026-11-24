import { test, expect, type Page } from "@playwright/test";
import type { DOMPet } from "../../src";
import type { Snapshot } from "../../src/world/platform";
declare global {
  interface Window {
    fixture: { pet: DOMPet; world: Snapshot; scans: number };
  }
}
async function setup(page: Page) {
  await page.goto("/fixtures/lifecycle.html");
  await page.evaluate(async () => {
    const url = new URL("./entry.ts", location.href);
    const { DOMPet, Scanner } = (await import(
      url.href
    )) as typeof import("../../demo/fixtures/entry");
    const style = document.createElement("style");
    style.textContent = `body{margin:0;min-height:160vh} #panel{position:relative;margin:70px 0 0 5vw;width:90vw;height:200px;overflow:auto} #list{height:600px} #perch{position:relative;top:60px;margin-left:5%;width:85%;height:30px;background:salmon} #zone{position:fixed;top:10px;left:0;width:20px;height:12px;background:black} #sticky{position:sticky;top:0;background:navy;height:24px;z-index:2}@media(max-width:600px){#perch{top:48px}}`;
    document.head.append(style);
    document.body.innerHTML =
      '<header id="sticky"></header><div id="panel"><div id="list"><div id="perch"></div></div></div><dialog>Modal</dialog><div id="zone"></div>';
    const scan = Scanner.prototype.scan;
    Scanner.prototype.scan = function (doc) {
      const world = scan.call(this, doc);
      window.fixture.scans++;
      window.fixture.world = world;
      return world;
    };
    const pet = new DOMPet({ debug: true, exclusionZones: ["#zone"] });
    window.fixture = {
      pet,
      scans: 0,
      world: { platforms: [], rejected: {}, candidates: 0 },
    };
    pet.debugMove(0);
    pet.start();
  });
}
const support = (page: Page) =>
  page.evaluate(() => window.fixture.pet.debugState?.support);
const aligned = (page: Page) =>
  page.evaluate(() => {
    const state = window.fixture.pet.debugState!;
    return (
      Math.abs(
        state.y - document.querySelector("#perch")!.getBoundingClientRect().top,
      ) < 0.5 && !!state.support
    );
  });
test("carries a rider through scroll, resize and layout motion, then releases recycled content", async ({
  page,
}) => {
  await setup(page);
  await expect.poll(() => aligned(page)).toBe(true);
  const id = await support(page);
  await page.evaluate(() => (document.querySelector("#panel")!.scrollTop = 25));
  await expect.poll(() => aligned(page)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 30));
  await expect.poll(() => aligned(page)).toBe(true);
  expect(await support(page)).toBe(id);
  expect(
    await page.evaluate(
      () =>
        window.fixture.world.platforms.find((p) => p.source?.id === "sticky")
          ?.y,
    ),
  ).toBe(0);
  const width = page.viewportSize()!.width > 600 ? 590 : 830;
  await page.setViewportSize({ width, height: 700 });
  await expect.poll(() => aligned(page)).toBe(true);
  const x = await page.evaluate(() => window.fixture.pet.debugState!.x);
  await page.locator("#perch").evaluate((el) => {
    el.style.transition = "transform 180ms linear";
    el.style.transform = "translate(14px,18px)";
  });
  await expect
    .poll(() => page.evaluate(() => window.fixture.pet.debugState!.x))
    .toBeCloseTo(x + 14, 0);
  await expect.poll(() => aligned(page)).toBe(true);
  await page.evaluate(() => {
    history.pushState({}, "", "?route=two");
    document
      .querySelector("#perch")!
      .replaceWith(document.createElement("section"));
  });
  await expect.poll(() => support(page)).not.toBe(id);
  expect(
    await page.evaluate(
      (id) => window.fixture.world.platforms.some((p) => p.id === id),
      id,
    ),
  ).toBe(false);
});
test("suspends for modal and hidden states, coalesces changes and cleans up pending work", async ({
  page,
}) => {
  await setup(page);
  await expect.poll(() => aligned(page)).toBe(true);
  const host = page.locator("[data-dompet]");
  await page
    .locator("dialog")
    .evaluate((el) => (el as HTMLDialogElement).showModal());
  await expect(host).toBeHidden();
  await page
    .locator("dialog")
    .evaluate((el) => (el as HTMLDialogElement).close());
  await expect(host).toBeVisible();
  await page.evaluate(() => {
    window.fixture.pet.pause();
    const dialog = document.createElement("aside");
    dialog.id = "modal";
    dialog.setAttribute("aria-modal", "true");
    dialog.textContent = "Modal";
    document.body.append(dialog);
  });
  await expect(host).toBeHidden();
  await page.locator("#modal").evaluate((el) => el.remove());
  await expect(host).toBeVisible();
  const before = await page.evaluate(() => window.fixture.scans);
  await page.evaluate(() => {
    for (let i = 0; i < 75; i++) document.body.dataset.layout = String(i);
  });
  await expect
    .poll(() => page.evaluate(() => window.fixture.scans))
    .toBeGreaterThan(before);
  const settled = await page.evaluate(() => window.fixture.scans);
  expect(settled - before).toBeLessThanOrEqual(3);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.fixture.scans)).toBe(settled);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    document.querySelector("#perch")!.remove();
    window.fixture.pet.refresh();
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.fixture.scans)).toBe(settled);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => support(page)).toBe(null);
  const y = await page.evaluate(() => window.fixture.pet.debugState!.y);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.fixture.pet.debugState!.y)).toBe(y);
  const after = await page.evaluate(() => {
    document.body.dataset.layout = "last";
    window.dispatchEvent(new Event("resize"));
    window.fixture.pet.destroy();
    return window.fixture.scans;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.fixture.scans)).toBe(after);
});
test("updates clipping, exclusion zones and replacement landing surfaces during a jump", async ({
  page,
}) => {
  await setup(page);
  await expect.poll(() => aligned(page)).toBe(true);
  await page.evaluate(() => {
    const zone = document.querySelector<HTMLElement>("#zone")!,
      perch = document.querySelector("#perch")!.getBoundingClientRect();
    zone.style.cssText = `position:fixed;left:${perch.left + 20}px;top:${perch.top - 4}px;width:30px;height:10px;background:black;pointer-events:none`;
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.fixture.world.platforms.find((p) => p.source?.id === "perch")
            ?.intervals.length,
      ),
    )
    .toBe(2);
  await page.evaluate(() => window.fixture.pet.debugJump());
  await expect.poll(() => support(page), { intervals: [10, 20] }).toBe(null);
  await page.evaluate(() => {
    const old = document.querySelector("#perch")!,
      parent = old.parentElement!;
    old.remove();
    const next = document.createElement("article");
    next.id = "replacement";
    next.style.cssText =
      "width:100%;height:25px;position:relative;top:75px;background:teal";
    parent.append(next);
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const surface = window.fixture.world.platforms.find(
          (p) => p.source?.id === "replacement",
        );
        return (
          !!surface && window.fixture.pet.debugState!.support === surface.id
        );
      }),
    )
    .toBe(true);
  await page.evaluate(
    () => (document.querySelector("#panel")!.scrollTop = 230),
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.fixture.world.platforms.some(
          (p) => p.source?.id === "replacement",
        ),
      ),
    )
    .toBe(false);
  await page.evaluate(() => document.body.replaceChildren());
  await expect(page.locator("[data-dompet] canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.fixture.world.platforms.map((p) => p.id)),
    )
    .toEqual(["floor"]);
});
