import { expect, test } from "@playwright/test";
test("visible intervals, filters and stable IDs survive refresh", async ({
  page,
}) => {
  await page.goto("/fixtures/platforms.html");
  const snapshot = await page.evaluate(async () => {
    const moduleUrl = new URL("./entry.ts", location.href);
    const { Scanner } = (await import(
      moduleUrl.href
    )) as typeof import("../../demo/fixtures/entry");
    const scanner = new Scanner({ include: ["#custom"], exclude: [".skip"] });
    function read() {
      return scanner
        .scan(document)
        .platforms.map(({ id, source, intervals }) => ({
          id,
          name: source?.id ?? "floor",
          intervals,
        }));
    }
    const first = read(),
      repeat = read();
    document.querySelector("#grid")!.prepend(document.createElement("button"));
    document.querySelector("#card")!.remove();
    const changed = read();
    const wideOnly = new Scanner({ minPlatformWidth: 110 })
      .scan(document)
      .platforms.map((p) => p.source?.id);
    document.body.replaceChildren();
    return { first, repeat, changed, wideOnly, empty: read() };
  });
  const byName = Object.fromEntries(snapshot.first.map((p) => [p.name, p]));
  expect(Object.keys(byName).sort()).toEqual(
    [
      "button",
      "card",
      "custom",
      "floor",
      "input",
      "ledge",
      "nested",
      "wide",
    ].sort(),
  );
  expect(byName.wide.intervals).toEqual([[20, 120]]);
  expect(byName.ledge.intervals).toEqual([
    [20, 100],
    [140, 220],
  ]);
  expect(snapshot.repeat).toEqual(snapshot.first);
  expect(snapshot.changed.find((p) => p.name === "card")).toBeUndefined();
  expect(snapshot.changed.find((p) => p.name === "ledge")?.id).toBe(
    byName.ledge.id,
  );
  expect(snapshot.wideOnly).not.toContain("wide");
  expect(snapshot.empty.map((p) => p.name)).toEqual(["floor"]);
});
test("debug view paints platform lines while paused", async ({ page }) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Pause pet" }).click();
  await page.getByRole("button", { name: "Refresh surfaces" }).click();
  const pixel = await page
    .locator("[data-dompet] canvas")
    .first()
    .evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      return Array.from(
        canvas
          .getContext("2d")!
          .getImageData(canvas.width - 10, canvas.height - 1, 1, 1).data,
      );
    });
  expect(pixel).toEqual([173, 32, 91, 255]);
});
