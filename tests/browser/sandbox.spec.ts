import { expect, test } from "@playwright/test";
test("overlay leaves controls and nested scrolling usable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-dompet] canvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Pause pet" }).click();
  await page.getByRole("button", { name: "Resume pet" }).click();
  await page.getByRole("button", { name: "Add a perch" }).click();
  await expect(page.locator("article")).toHaveCount(3);
  await page.getByLabel("Observation").fill("Sleeping");
  await page.getByText("Save note").click();
  await expect(page.locator("li").first()).toHaveText("Sleeping");
  const panel = page.locator(".panel");
  await panel.hover();
  await page.mouse.wheel(0, 180);
  await expect
    .poll(() => panel.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
});
test("repeated lifecycle calls release canvas, frame and listener", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  await page.evaluate(async () => {
    const source = new URL("./entry.ts", location.href);
    const { DOMPet } = await import(source.href);
    const frames = new Set<number>();
    window.requestAnimationFrame = () => {
      const id = frames.size + 1;
      frames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      frames.delete(id);
    };
    const on = window.addEventListener.bind(window);
    const listeners = new Set<EventListenerOrEventListenerObject>();
    window.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === "resize") {
        listeners.add(listener);
        if (typeof options === "object")
          options.signal?.addEventListener("abort", () =>
            listeners.delete(listener),
          );
      }
      on(type, listener, options);
    };
    function check(overlays: number, scheduled: number) {
      if (
        document.querySelectorAll("[data-dompet]").length !== overlays ||
        listeners.size !== overlays ||
        frames.size !== scheduled
      )
        throw Error("Unexpected lifecycle resource count");
    }
    for (let i = 0; i < 3; i++) {
      const pet = new DOMPet();
      pet.start();
      pet.start();
      check(1, 1);
      pet.pause();
      pet.pause();
      check(1, 0);
      pet.resume();
      pet.resume();
      check(1, 1);
      pet.destroy();
      pet.destroy();
      pet.start();
      check(0, 0);
    }
  });
});

test("journal settings preserve pause and replace a single overlay", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause pet" }).click();
  await page.getByLabel("Cat size").selectOption("144");
  await page.getByLabel("Walking speed").selectOption("1.6");
  await page.getByLabel("Debug platforms").check();
  await expect(page.locator("[data-dompet]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Resume pet" })).toBeVisible();
  await page.getByRole("button", { name: "Inspect physics" }).click();
  await expect(page.locator("#motion")).toContainText("80.6");
  await page.getByLabel("Debug platforms").uncheck();
  await expect(page.locator("#physics")).toBeHidden();
});
