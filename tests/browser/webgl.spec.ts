import { expect, test } from "@playwright/test";
test("renders the packaged rig and recovers at the same feet after context loss", async ({
  page,
}) => {
  await page.goto("/?debug");
  const host = page.locator("[data-dompet]");
  await expect(host).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: "Pause pet" }).click();
  await page.getByRole("button", { name: "Inspect physics" }).click();
  const before = await page.locator("#motion").innerText();
  await host
    .locator("canvas")
    .last()
    .evaluate((el) =>
      (el as HTMLCanvasElement)
        .getContext("webgl2")!
        .getExtension("WEBGL_lose_context")!
        .loseContext(),
    );
  await expect(host).toHaveAttribute("data-renderer", "sprite");
  await page.getByRole("button", { name: "Inspect physics" }).click();
  expect(await page.locator("#motion").innerText()).toBe(before);
});
test("uses the sprite when the GLB cannot load", async ({ page }) => {
  await page.route(/dompet-human\.glb(?:$|\?(?!import))/, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-dompet]")).toHaveAttribute(
    "data-renderer",
    "sprite",
  );
});
test("releases 100 initialized WebGL pets and pending model loads", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/fixtures/lifecycle.html");
  const count = await page.evaluate(async () => {
    const { DOMPet } = await import(new URL("./entry.ts", location.href).href);
    for (let i = 0; i < 100; i++) {
      const pet = new DOMPet();
      pet.start();
      pet.pause();
      const host = document.querySelector<HTMLElement>("[data-dompet]")!;
      while (host.dataset.renderer === "loading")
        await new Promise(requestAnimationFrame);
      if (host.dataset.renderer !== "webgl")
        throw Error("Failed to initialize cycle " + i);
      const canvas = host.shadowRoot!.querySelectorAll("canvas")[1];
      const context = canvas.getContext("webgl2")!;
      pet.destroy();
      if (!context.isContextLost() || host.isConnected)
        throw Error("WebGL resource retained at cycle " + i);
    }
    const pending = new DOMPet();
    pending.start();
    pending.destroy();
    return document.querySelectorAll("[data-dompet]").length;
  });
  expect(count).toBe(0);
});
test("recovers from corrupt model bytes", async ({ page }) => {
  await page.route(/dompet-human\.glb(?:$|\?(?!import))/, (route) =>
    route.fulfill({ body: "invalid binary data" }),
  );
  await page.goto("/");
  await expect(page.locator("[data-dompet]")).toHaveAttribute(
    "data-renderer",
    "sprite",
  );
});
