import { step, spawn, type Body, type Intent } from "./physics/motion.js";
import { playback } from "./playback.js";
import { Scanner, type ScanOptions } from "./dom/scanner.js";
import { drawPlatforms } from "./debug/platforms.js";
import type { Snapshot } from "./world/platform.js";
export interface DOMPetOptions extends ScanOptions {
  debug?: boolean;
}
export class DOMPet {
  #host?: HTMLElement;
  #loop?: ReturnType<typeof playback>;
  #controller?: AbortController;
  #destroyed = false;

  #scanner: Scanner;
  #debug: boolean;
  #intent: Intent = { direction: 0, jump: false };
  #reset?: () => void;
  debugMove(direction: -1 | 0 | 1): void {
    if (this.#debug) this.#intent.direction = direction;
  }
  debugJump(): void {
    if (this.#debug) this.#intent.jump = true;
  }
  debugReset(): void {
    if (this.#debug) this.#reset?.();
  }
  #inspect?: () => Body;
  get debugState(): Readonly<Body> | undefined {
    return this.#debug ? this.#inspect?.() : undefined;
  }

  #refresh?: () => void;
  constructor(options: DOMPetOptions = {}) {
    this.#scanner = new Scanner(options);
    this.#debug = options.debug ?? false;
  }
  refresh(): void {
    this.#refresh?.();
  }
  start(): void {
    if (this.#host || this.#destroyed) return;
    const host = document.createElement("div");
    host.dataset.dompet = "";
    host.setAttribute("aria-hidden", "true");
    host.inert = true;
    host.style.cssText =
      "all:initial!important;position:fixed!important;inset:0!important;display:block!important;pointer-events:none!important;z-index:2147483646!important";
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none";
    host.attachShadow({ mode: "open" }).append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("DOMPet requires a 2D canvas");
    let world: Snapshot = this.#scanner.scan(document);
    const debug = this.#debug;
    document.body.append(host);
    this.#host = host;
    let width = 0,
      height = 0,
      phase = 0;
    const bounds = () => ({ width, height });
    let body = spawn({ width: host.clientWidth, height: host.clientHeight });
    this.#inspect = () => ({ ...body });
    this.#reset = () => {
      this.#intent = { direction: 0, jump: false };
      body = spawn(bounds());
      draw(phase);
    };
    function draw(next: number) {
      if (!ctx) return;
      phase = next;
      ctx.clearRect(0, 0, width, height);
      if (debug) drawPlatforms(ctx, world);
      const x = Math.round(body.x - 15),
        y = Math.round(body.y - 22);
      ctx.fillStyle = "#342d38";
      ctx.fillRect(x + 4, y, 6, 8);
      ctx.fillRect(x + 20, y, 6, 8);
      ctx.fillRect(x, y + 6, 30, 16);
      ctx.fillStyle = "#ffcb7e";
      const eyeHeight = Math.cos(phase / 2) > 0.996 ? 1 : 4;
      ctx.fillRect(x + 6, y + 11, 4, eyeHeight);
      ctx.fillRect(x + 20, y + 11, 4, eyeHeight);
    }
    function resize() {
      width = host.clientWidth;
      height = host.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(phase);
    }
    this.#controller = new AbortController();
    this.#refresh = () => {
      world = this.#scanner.scan(document);
      draw(phase);
    };
    window.addEventListener(
      "resize",
      () => {
        world = this.#scanner.scan(document);
        resize();
      },
      {
        signal: this.#controller.signal,
      },
    );
    resize();
    this.#loop = playback(
      {
        request: (cb) => window.requestAnimationFrame(cb),
        cancel: (id) => window.cancelAnimationFrame(id),
      },
      Math.random,
      draw,
      () => {
        body = step(body, this.#intent, world.platforms, bounds());
        this.#intent.jump = false;
      },
    );
    document.addEventListener(
      "visibilitychange",
      () => this.#loop?.resetTime(),
      { signal: this.#controller.signal },
    );
    this.#loop.resume();
  }
  pause(): void {
    this.#loop?.pause();
  }
  resume(): void {
    this.#loop?.resume();
  }
  destroy(): void {
    this.pause();
    this.#controller?.abort();
    this.#host?.remove();
    this.#reset = undefined;
    this.#inspect = undefined;
    this.#refresh = undefined;
    this.#loop = undefined;
    this.#controller = undefined;
    this.#host = undefined;
    this.#destroyed = true;
  }
}
