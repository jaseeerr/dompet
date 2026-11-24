// Run after npm run build. The measured page loads only the bundled library.
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import os from "node:os";
const bundle = await readFile(
  new URL("../dist/index.js", import.meta.url),
  "utf8",
);
async function serve(page) {
  await page.route("http://dompet.test/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/")
      return route.fulfill({ contentType: "text/html", body: "<body></body>" });
    const body = await readFile(new URL("../dist" + path, import.meta.url));
    return route.fulfill({
      body,
      contentType: path.endsWith(".js")
        ? "text/javascript"
        : "application/octet-stream",
    });
  });
  await page.goto("http://dompet.test/");
}
const useMetal = process.env.DOMPET_BENCH_GPU === "metal";
const browser = await chromium.launch(
  useMetal
    ? {
        channel: "chromium",
        args: [
          "--enable-gpu",
          "--use-angle=metal",
          "--disable-software-rasterizer",
        ],
      }
    : {},
);
try {
  console.log(
    JSON.stringify({
      cpu: os.cpus()[0].model,
      os: os.release(),
      browser: browser.version(),
      gzipBytes: gzipSync(bundle).length,
    }),
  );
  for (const [count, rate, mobile = false, mode = "auto"] of [
    [100, 1],
    [1000, 1],
    [5000, 1],
    [1000, 4],
    [1000, 1, true],
    [1000, 1, false, "sprite"],
  ]) {
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 720 },
    });
    await serve(page);
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate });
    const result = await page.evaluate(
      async ({ count, mode }) => {
        let seed = 42;
        Math.random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 2 ** 32;
        };
        const { DOMPet } = await import("/index.js");
        document.body.innerHTML =
          '<style>#outer{height:620px;overflow:auto}#inner{height:850px;overflow:auto;display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.card{height:52px;background:tan}</style><main id="outer"><section id="inner"></section></main>';
        const inner = document.querySelector("#inner");
        for (let i = 0; i < count; i++) {
          const el = document.createElement("article");
          el.className = "card";
          inner.append(el);
        }
        const frame = () => new Promise(requestAnimationFrame);
        const stats = (values) => {
          const s = [...values].sort((a, b) => a - b);
          return {
            p95: +s[Math.ceil(s.length * 0.95) - 1].toFixed(2),
            max: +s.at(-1).toFixed(2),
          };
        };
        async function workload() {
          const intervals = [],
            longTasks = [];
          const observer = new PerformanceObserver((list) =>
            longTasks.push(...list.getEntries().map((e) => e.duration)),
          );
          observer.observe({ type: "longtask" });
          let last = await frame();
          for (let i = 0; i < 90; i++) {
            inner.firstChild.style.height = 52 + (i % 3) + "px";
            inner.scrollTop = i * 5;
            const t = await frame();
            if (i >= 10) intervals.push(t - last);
            last = t;
          }
          longTasks.push(...observer.takeRecords().map((e) => e.duration));
          observer.disconnect();
          return { ...stats(intervals), longTasks: longTasks.length };
        }
        const disabled = await workload();
        inner.scrollTop = 0;
        const pet = new DOMPet({ renderer: mode });
        const loadStart = performance.now();
        pet.start();
        await pageReady();
        const readyMs = Math.round(performance.now() - loadStart);
        async function pageReady() {
          while (
            document.querySelector("[data-dompet]").dataset.renderer ===
            "loading"
          )
            await frame();
        }
        const renderer =
          document.querySelector("[data-dompet]").dataset.renderer;
        let graphics;
        if (renderer === "webgl") {
          const gl = document
            .querySelector("[data-dompet]")
            .shadowRoot.querySelectorAll("canvas")[1]
            .getContext("webgl2");
          const info = gl.getExtension("WEBGL_debug_renderer_info");
          const timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
          const query = timer ? gl.createQuery() : null;
          let calls = 0,
            triangles = 0;
          const original = gl.drawElements;
          gl.drawElements = function (mode, count, ...rest) {
            calls++;
            if (mode === gl.TRIANGLES) triangles += count / 3;
            return original.call(this, mode, count, ...rest);
          };
          if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
          await frame();
          if (query) gl.endQuery(timer.TIME_ELAPSED_EXT);
          gl.drawElements = original;
          let gpuMs = null;
          if (query) {
            for (
              let i = 0;
              i < 30 && !gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
              i++
            )
              await frame();
            if (
              gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) &&
              !gl.getParameter(timer.GPU_DISJOINT_EXT)
            )
              gpuMs = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
            gl.deleteQuery(query);
          }
          graphics = {
            driver: info
              ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
              : gl.getParameter(gl.RENDERER),
            calls,
            triangles,
            gpuMs,
          };
        }
        const enabled = await workload();
        const times = [];
        for (let i = 0; i < 40; i++) {
          await frame();
          inner.scrollTop = i * 4;
          const t = performance.now();
          pet.refresh();
          times.push(performance.now() - t);
        }
        pet.destroy();
        const debug = new DOMPet({ debug: true, renderer: mode });
        debug.start();
        const frames = [],
          physics = [],
          navigation = [],
          render = [];
        for (let i = 0; i < 240; i++) {
          await frame();
          const d = debug.debugMetrics;
          if (d) {
            frames.push(d.frameMs);
            physics.push(d.physicsMs);
            navigation.push(d.navigationMs);
            render.push(d.renderMs);
          }
        }
        const metrics = debug.debugMetrics;
        debug.destroy();
        return {
          renderer,
          readyMs,
          graphics,
          disabled,
          enabled,
          refresh: stats(times),
          ...(metrics
            ? {
                frame: stats(frames),
                physics: stats(physics),
                navigation: stats(navigation),
                render: stats(render),
                metrics,
              }
            : {}),
        };
      },
      { count, mode },
    );
    console.log(JSON.stringify({ nodes: count, rate, mobile, ...result }));
    await page.close();
  }
  const page = await browser.newPage();
  await serve(page);
  const session = await page.context().newCDPSession(page);
  await page.evaluate(async () => {
    const { DOMPet } = await import("/index.js");
    window.makePet = () => new DOMPet({ debug: true, renderer: "sprite" });
    window.cycle = () => {
      for (let i = 0; i < 25; i++) {
        const pet = new DOMPet();
        pet.start();
        pet.destroy();
      }
    };
  }, bundle);
  const heap = [];
  for (let batch = 0; batch < 5; batch++) {
    await page.evaluate(() => window.cycle());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await session.send("HeapProfiler.collectGarbage");
    heap.push((await session.send("Runtime.getHeapUsage")).usedSize);
  }
  console.log(JSON.stringify({ postGcBytesAfterWarmupAndFourBatches: heap }));
  // Drive five minutes of browser simulation through the normal animation callback.
  // GC between minutes makes post-warmup growth visible separately from allocation churn.
  await page.evaluate(() => {
    let seed = 42,
      id = 0,
      time = 0,
      landings = 0;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const frames = new Map();
    window.requestAnimationFrame = (cb) => {
      frames.set(++id, cb);
      return id;
    };
    window.cancelAnimationFrame = (id) => frames.delete(id);
    document.body.innerHTML =
      '<article style="position:fixed;bottom:40px;left:30%;width:40%;height:30px;background:tan"></article>';
    const pet = window.makePet();
    pet.on("landing", () => landings++);
    pet.start();
    window.advanceMinute = () => {
      for (let i = 0; i < 3600; i++) {
        time += 1000 / 60;
        const callbacks = [...frames.values()];
        frames.clear();
        for (const cb of callbacks) cb(time);
        const body = pet.debugState;
        if (!Number.isFinite(body.x + body.y))
          throw Error("Invalid pet coordinates");
      }
      return landings;
    };
    window.cleanup = () => pet.destroy();
  });
  const minutes = [];
  for (let minute = 1; minute <= 5; minute++) {
    const landings = await page.evaluate(() => window.advanceMinute());
    await session.send("HeapProfiler.collectGarbage");
    minutes.push({
      minute,
      landings,
      heap: (await session.send("Runtime.getHeapUsage")).usedSize,
    });
  }
  if (minutes.at(-1).landings <= minutes[0].landings)
    throw Error("Exploration stopped making transfers");
  await page.evaluate(() => window.cleanup());
  console.log(JSON.stringify({ minutes }));
  await page.close();
} finally {
  await browser.close();
}
