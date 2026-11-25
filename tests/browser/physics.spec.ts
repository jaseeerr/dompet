import { expect, test } from "@playwright/test";
test("walk, jump, inspect and reset the pet on scanned surfaces", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?debug");
  const click = (name: string) =>
    page.getByRole("button", { name, exact: true }).click();
  async function inspect() {
    await click("Inspect physics");
    return (await page.locator("#motion").innerText()).match(
      /Feet \(([\d.]+), ([\d.]+)\).*Support (\S+)/,
    )!;
  }
  await page.clock.runFor(1600);
  const standing = await inspect();
  expect(standing[3]).toMatch(/^p\d+$/);
  await click("Jump");
  await page.clock.runFor(120);
  const jump = await inspect();
  expect(jump[3]).toBe("airborne");
  expect(Number(jump[2])).toBeLessThan(Number(standing[2]));
  await click("Walk right");
  await page.clock.runFor(200);
  await click("Stop walking");
  expect(Number((await inspect())[1])).toBeGreaterThan(Number(standing[1]));
  await click("Pause pet");
  await click("Reset pet");
  expect((await inspect())[2]).toBe("112.0");
});
