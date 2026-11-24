import { expect, test } from "@playwright/test";
test("100 teardown cycles release observers and RAFs without reading input or sending requests", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  await page.evaluate(async () => {
    await import(new URL("./entry.ts", location.href).href);
  });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const cycles = await page.evaluate(async () => {
    const { DOMPet } = (await import(
      new URL("./entry.ts", location.href).href
    )) as typeof import("../../src");
    const input = document.createElement("input");
    document.body.append(input);
    Object.defineProperty(input, "value", {
      get() {
        throw Error("Pet read host input");
      },
    });
    const observers = new Set<object>();
    window.MutationObserver = class extends MutationObserver {
      override observe(...args: Parameters<MutationObserver["observe"]>) {
        observers.add(this);
        super.observe(...args);
      }
      override disconnect() {
        observers.delete(this);
        super.disconnect();
      }
    };
    window.ResizeObserver = class extends ResizeObserver {
      override observe(...args: Parameters<ResizeObserver["observe"]>) {
        observers.add(this);
        super.observe(...args);
      }
      override disconnect() {
        observers.delete(this);
        super.disconnect();
      }
    };
    const request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    window.requestAnimationFrame = (cb) => {
      const id = request((t) => {
        pending.delete(id);
        cb(t);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
    const listeners = new Set<AbortSignal>(),
      original = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, options) {
      const signal = typeof options === "object" ? options?.signal : undefined;
      if (signal && !listeners.has(signal)) {
        listeners.add(signal);
        signal.addEventListener("abort", () => listeners.delete(signal), {
          once: true,
        });
      }
      original.call(this, type, fn, options);
    };
    for (let i = 0; i < 100; i++) {
      const pet = new DOMPet({ renderer: "sprite" });
      pet.start();
      history.replaceState({}, "", "?view=" + i);
      input.className = "field-" + i;
      window.dispatchEvent(new Event("resize"));
      pet.pause();
      pet.resume();
      pet.destroy();
      await Promise.resolve();
      if (
        pending.size ||
        observers.size ||
        listeners.size ||
        document.querySelector("[data-dompet]")
      )
        throw Error("Retained resources on cycle " + i);
    }
    return 100;
  });
  expect(cycles).toBe(100);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
test("large scrolled lists retain visible platforms within the discovery budget", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  const result = await page.evaluate(async () => {
    const { Scanner } = (await import(
      new URL("./entry.ts", location.href).href
    )) as typeof import("../../demo/fixtures/entry");
    document.body.style.margin = "0";
    const list = document.createElement("main");
    list.style.cssText = "height:85vh;overflow:auto";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 5000; i++) {
      const row = document.createElement("article");
      row.style.cssText = "height:40px;background:tan;margin-bottom:4px";
      row.id = "row-" + i;
      frag.append(row);
    }
    list.append(frag);
    document.body.append(list);
    list.scrollTop = 44 * 4500;
    const world = new Scanner({}).scan(document);
    return {
      count: world.platforms.length,
      ids: world.platforms.map((p) => p.source?.id),
      skipped: world.rejected["outside shortlist"],
    };
  });
  expect(result.count).toBeLessThanOrEqual(129);
  expect(result.ids).toContain("row-4501");
  expect(result.skipped).toBeGreaterThan(4000);
});
test("a hidden active pet schedules no frames or geometry work", async ({
  page,
}) => {
  await page.goto("/fixtures/lifecycle.html");
  const result = await page.evaluate(async () => {
    const { DOMPet, Scanner } = (await import(
      new URL("./entry.ts", location.href).href
    )) as typeof import("../../demo/fixtures/entry");
    const request = window.requestAnimationFrame.bind(window),
      scan = Scanner.prototype.scan;
    let frames = 0,
      scans = 0;
    window.requestAnimationFrame = (cb) => {
      frames++;
      return request(cb);
    };
    Scanner.prototype.scan = function (doc) {
      scans++;
      return scan.call(this, doc);
    };
    const pet = new DOMPet({ debug: true });
    pet.start();
    await new Promise(request);
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    const start = { frames, scans, body: pet.debugState };
    window.dispatchEvent(new Event("resize"));
    document.body.append(document.createElement("button"));
    await new Promise((r) => setTimeout(r, 100));
    const end = { frames, scans, body: pet.debugState };
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    pet.destroy();
    return { start, end, rescanned: scans > start.scans };
  });
  expect(result.end).toEqual(result.start);
  expect(result.rescanned).toBe(true);
});
