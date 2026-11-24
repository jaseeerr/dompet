import { expect, test } from "@playwright/test";
test("explores demo surfaces unassisted and replans when the occupied element disappears", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
  });
  await page.goto("/?debug");
  const inspect = async () => {
    await page.getByRole("button", { name: "Inspect physics" }).click();
    return page.locator("#motion").innerText();
  };
  await page.clock.runFor(1200);
  const first = await inspect();
  const initial = first.match(/Support (p\d+)/)![1];
  const visited = new Set([initial]);
  for (let i = 0; i < 16 && visited.size === 1; i++) {
    await page.clock.runFor(500);
    const id = (await inspect()).match(/Support (p\d+|floor)/)?.[1];
    if (id) visited.add(id);
  }
  expect(visited.size).toBeGreaterThan(1);
  // Replace the habitat while a route or rest is active; the new world has only its floor.
  await page
    .locator("main,nav")
    .evaluateAll((elements) =>
      elements.forEach((el) => el.setAttribute("data-dompet-ignore", "")),
    );
  await page.getByRole("button", { name: "Refresh surfaces" }).click();
  await page.clock.runFor(4500);
  expect(await inspect()).toContain("Support floor");
});
