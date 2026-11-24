import type { Behaviour, Body, ScanOptions } from "./types.js";
import { observeLayout, modalOpen } from "./dom/layout.js";
import { carry, sameGeometry } from "./world/reconcile.js";
import { Animation, loadCat } from "./rendering/cat.js";
import { tabby } from "./characters/tabby.js";
import { Explorer } from "./behaviour/explorer.js";
import { Graph } from "./navigation/graph.js";
import {
  motion,
  stepSeconds,
  step,
  spawn,
  type Intent,
} from "./physics/motion.js";
import { playback } from "./playback.js";
import { Scanner } from "./dom/scanner.js";
import { drawPlatforms } from "./debug/platforms.js";
import type { Snapshot } from "./world/platform.js";
export interface DOMPetOptions extends ScanOptions {
  character?: "cat";
  speed?: number;
  gravity?: number;
  zIndex?: number;
  respectReducedMotion?: boolean;
  debug?: boolean;
  /** Visual sprite width in CSS pixels. */
  size?: number;
}
export type DOMPetState = "new" | "running" | "paused" | "hidden" | "destroyed";
export interface DOMPetEvents {
  statechange: { previous: DOMPetState; state: DOMPetState };
  landing: { platformId: string; x: number; y: number };
  error: Error;
}
export interface DOMPetMetrics {
  scanMs: number;
  refreshMs: number;
  frameMs: number;
  renderMs: number;
  physicsMs: number;
  navigationMs: number;
  platforms: number;
  graphNodes: number;
  graphEdges: number;
  replans: number;
}
const owners = new WeakMap<Document, DOMPet>();
export class DOMPet {
  #metrics?: DOMPetMetrics;
  get debugMetrics(): Readonly<DOMPetMetrics> | undefined {
    return this.#metrics ? { ...this.#metrics } : undefined;
  }
  #document?: Document;
  #events = new EventTarget();
  #state: DOMPetState = "new";
  #hidden = false;
  #reduced = false;
  #respectReducedMotion: boolean;
  #motion: typeof motion;
  #zIndex: number;
  #selectors: string[];
  get state(): DOMPetState {
    return this.#state;
  }
  on<K extends keyof DOMPetEvents>(
    name: K,
    listener: (detail: DOMPetEvents[K]) => void,
  ): () => void {
    if (this.#destroyed) return () => {};
    const wrapped = (e: Event) =>
      listener((e as CustomEvent<DOMPetEvents[K]>).detail);
    this.#events.addEventListener(name, wrapped);
    return () => this.#events.removeEventListener(name, wrapped);
  }
  #emit<K extends keyof DOMPetEvents>(name: K, detail: DOMPetEvents[K]) {
    this.#events.dispatchEvent(new CustomEvent(name, { detail }));
  }
  #transition(state: DOMPetState) {
    const previous = this.#state;
    if (previous === state) return;
    this.#state = state;
    this.#emit("statechange", { previous, state });
  }
  #sync() {
    if (!this.#loop || !this.#host) return;
    const hidden = this.#hidden || this.#suspended;
    if (hidden)
      this.#host.style.setProperty("visibility", "hidden", "important");
    else this.#host.style.removeProperty("visibility");
    if (hidden || this.#reduced || this.#paused) this.#loop.pause();
    else this.#loop.resume();
    this.#transition(
      hidden ? "hidden" : this.#paused || this.#reduced ? "paused" : "running",
    );
  }
  hide(): void {
    this.#hidden = true;
    this.#sync();
  }
  show(): void {
    this.#hidden = false;
    this.#sync();
  }

  #host?: HTMLElement;
  #loop?: ReturnType<typeof playback>;
  #controller?: AbortController;
  #destroyed = false;

  #scanner: Scanner;
  #debug: boolean;
  #size: number;
  #disposeSprite?: () => void;
  #manual = false;
  #paused = false;
  #suspended = false;
  debugExplore(): void {
    if (this.#debug) {
      this.#manual = false;
      this.#intent = { direction: 0, jump: false };
      this.#replan?.();
    }
  }
  #replan?: () => void;
  #intent: Intent = { direction: 0, jump: false };
  #reset?: () => void;
  debugMove(direction: -1 | 0 | 1): void {
    if (this.#debug) {
      this.#manual = true;
      this.#intent.direction = direction;
    }
  }
  debugJump(): void {
    if (this.#debug) {
      this.#manual = true;
      this.#intent.jump = true;
    }
  }
  debugReset(): void {
    if (this.#debug) {
      this.#manual = true;
      this.#reset?.();
    }
  }
  #inspect?: () => Body & { behaviour: Behaviour | "manual" };
  get debugState():
    Readonly<Body & { behaviour: Behaviour | "manual" }> | undefined {
    return this.#debug ? this.#inspect?.() : undefined;
  }

  #refresh?: () => void;
  constructor(options: DOMPetOptions = {}) {
    if (options.character !== undefined && options.character !== "cat")
      throw new TypeError("character must be cat");
    for (const key of ["debug", "respectReducedMotion"] as const)
      if (options[key] !== undefined && typeof options[key] !== "boolean")
        throw new TypeError(key + " must be boolean");
    for (const key of ["speed", "gravity"] as const)
      if (
        options[key] !== undefined &&
        (!Number.isFinite(options[key]) || options[key] <= 0)
      )
        throw new RangeError(key + " must be positive and finite");
    this.#motion = {
      ...motion,
      speed: motion.speed * (options.speed ?? 1),
      gravity: options.gravity ?? motion.gravity,
    };
    if (!Number.isFinite(this.#motion.speed))
      throw new RangeError("speed exceeds supported range");
    this.#respectReducedMotion = options.respectReducedMotion ?? true;
    this.#zIndex = options.zIndex ?? 2147483646;
    if (
      !Number.isInteger(this.#zIndex) ||
      this.#zIndex < -2147483648 ||
      this.#zIndex > 2147483647
    )
      throw new RangeError("zIndex must be a signed 32-bit integer");
    this.#selectors = [];
    for (const key of ["include", "exclude", "exclusionZones"] as const) {
      const list = options[key];
      if (list === undefined) continue;
      if (
        !Array.isArray(list) ||
        list.some((v) => typeof v !== "string" || !v.trim())
      )
        throw new TypeError(key + " must contain nonempty CSS selectors");
      this.#selectors.push(...list);
    }
    this.#size = options.size ?? tabby.size;
    if (!Number.isFinite(this.#size) || this.#size <= 0)
      throw new RangeError("size must be positive and finite");
    this.#scanner = new Scanner(options);
    this.#debug = options.debug ?? false;
  }
  refresh(): void {
    this.#refresh?.();
  }
  start(): void {
    if (this.#host || this.#destroyed) return;
    try {
      if (typeof document === "undefined" || !document.body)
        throw new Error("DOMPet.start requires a document body");
      if (owners.has(document))
        throw new Error("A DOMPet is already active in this document");
      for (const selector of this.#selectors) document.body.matches(selector);
      this.#document = document;
      owners.set(document, this);
      this.#mount();
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (this.#document) this.#release();
      this.#emit("error", error);
      throw error;
    }
  }
  #mount() {
    const host = document.createElement("div");
    host.dataset.dompet = "";
    host.setAttribute("aria-hidden", "true");
    host.inert = true;
    host.style.cssText =
      "all:initial!important;position:fixed!important;inset:0!important;display:block!important;pointer-events:none!important";
    host.style.setProperty("z-index", String(this.#zIndex), "important");
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none";
    host.attachShadow({ mode: "open" }).append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("DOMPet requires a 2D canvas");
    let world: Snapshot = { platforms: [], candidates: 0, rejected: {} };
    const scanner = this.#scanner;
    const metrics = (this.#metrics = this.#debug
      ? {
          scanMs: 0,
          refreshMs: 0,
          frameMs: 0,
          renderMs: 0,
          physicsMs: 0,
          navigationMs: 0,
          platforms: 0,
          graphNodes: 0,
          graphEdges: 0,
          replans: 0,
        }
      : undefined);
    let physicsMs = 0,
      navigationMs = 0;

    document.body.append(host);
    this.#host = host;
    let width = 0,
      height = 0,
      ratio = 1;
    const size = this.#size;
    let animation = new Animation();
    const bounds = () => ({ width, height });
    let body = spawn({ width: host.clientWidth, height: host.clientHeight });
    let graph: Graph;
    let explorer: Explorer;
    const sprite = loadCat(draw, () =>
      this.#emit(
        "error",
        new Error("Cat sprite unavailable; drawing fallback"),
      ),
    );
    this.#disposeSprite = sprite.dispose;
    this.#replan = () => {
      graph = new Graph(world.platforms, bounds(), this.#motion);
      explorer = new Explorer(graph);
      if (metrics) {
        metrics.graphNodes = graph.surfaces.length;
        metrics.graphEdges = 0;
      }
    };
    this.#inspect = () => ({
      ...body,
      behaviour: this.#manual ? "manual" : explorer.state,
    });
    this.#reset = () => {
      this.#intent = { direction: 0, jump: false };
      body = spawn(bounds());
      animation = new Animation();
      draw();
    };
    function draw() {
      if (!ctx || document.hidden) return;
      const start = metrics ? performance.now() : 0;
      layout.checkRoute();
      ctx.clearRect(0, 0, width, height);
      if (metrics) drawPlatforms(ctx, world, metrics);
      const left = body.x - size / 2,
        top = body.y - (size * tabby.anchorY) / tabby.width;
      if (
        !scanner.zones.some(
          (r) =>
            left < r.right &&
            left + size > r.left &&
            top < r.bottom &&
            body.y > r.top,
        )
      )
        sprite.draw(ctx, animation, body, size, ratio);
      if (metrics) {
        metrics.physicsMs = physicsMs;
        metrics.navigationMs = navigationMs;
        metrics.renderMs = performance.now() - start;
        metrics.frameMs = physicsMs + navigationMs + metrics.renderMs;
        physicsMs = 0;
        navigationMs = 0;
      }
    }
    function resize() {
      if (
        width === host.clientWidth &&
        height === host.clientHeight &&
        ratio === (window.devicePixelRatio || 1)
      )
        return;
      width = host.clientWidth;
      height = host.clientHeight;
      ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.#controller = new AbortController();
    const signal = this.#controller.signal;
    const suspend = () => {
      this.#suspended = true;
      this.#sync();
    };
    const layout = observeLayout(
      () => {
        if (!document.body) return;
        if (!host.isConnected) document.body.append(host);
        if (modalOpen()) {
          if (!this.#suspended) suspend();
          return;
        }
        const refreshStart = metrics ? performance.now() : 0;
        const wasSuspended = this.#suspended;
        this.#suspended = false;

        const oldWidth = width,
          oldHeight = height;
        resize();
        const scanStart = metrics ? performance.now() : 0;
        const next = scanner.scan(document);
        if (metrics) {
          metrics.scanMs = performance.now() - scanStart;
          metrics.platforms = next.platforms.length;
        }
        const changed =
          width !== oldWidth ||
          height !== oldHeight ||
          !sameGeometry(world.platforms, next.platforms);
        body = carry(body, world.platforms, next.platforms, bounds());
        world = next;
        for (const p of world.platforms)
          if (p.source) scanner.roots.add(p.source);
        layout.track(scanner.roots);
        if (changed || !explorer) this.#replan?.();
        draw();
        if (metrics) metrics.refreshMs = performance.now() - refreshStart;
        if (wasSuspended) this.#sync();
      },
      suspend,
      signal,
    );
    this.#refresh = layout.flush;
    function watchResolution() {
      const media = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      media.addEventListener(
        "change",
        () => {
          layout.flush();
          watchResolution();
        },
        { once: true, signal },
      );
    }
    watchResolution();
    if (this.#respectReducedMotion) {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.#reduced = media.matches;
      media.addEventListener(
        "change",
        () => {
          this.#reduced = media.matches;
          this.#sync();
        },
        { signal },
      );
    }
    this.#replan();
    if (document.hidden) suspend();
    else layout.flush();
    this.#loop = playback(
      {
        request: (cb) => window.requestAnimationFrame(cb),
        cancel: (id) => window.cancelAnimationFrame(id),
      },
      Math.random,
      draw,
      () => {
        const start = metrics ? performance.now() : 0;
        const plans = explorer.plans;
        const intent = this.#manual ? this.#intent : explorer.intent(body);
        const physicsStart = metrics ? performance.now() : 0;
        if (metrics) {
          navigationMs += physicsStart - start;
          metrics.replans += explorer.plans - plans;
          metrics.graphEdges = graph.edgeCount;
        }
        const grounded = body.support !== null;
        body = step(body, intent, world.platforms, bounds(), this.#motion);
        animation.update(
          body,
          grounded,
          this.#manual ? "manual" : explorer.state,
          stepSeconds * 1000,
        );
        if (metrics) physicsMs += performance.now() - physicsStart;
        this.#intent.jump = false;
        if (!grounded && body.support)
          this.#emit("landing", {
            platformId: body.support,
            x: body.x,
            y: body.y,
          });
      },
    );
    this.#sync();
  }
  pause(): void {
    if (this.#loop) {
      this.#paused = true;
      this.#sync();
    }
  }
  resume(): void {
    this.#paused = false;
    this.#sync();
  }
  #release() {
    this.#loop?.pause();
    if (this.#document) owners.delete(this.#document);
    this.#document = undefined;
    this.#controller?.abort();
    this.#scanner.roots.clear();
    this.#metrics = undefined;
    this.#disposeSprite?.();
    this.#disposeSprite = undefined;
    this.#host?.remove();
    this.#reset = undefined;
    this.#inspect = undefined;
    this.#replan = undefined;
    this.#refresh = undefined;
    this.#loop = undefined;
    this.#controller = undefined;
    this.#host = undefined;
  }
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#release();
    this.#transition("destroyed");
    this.#events = new EventTarget();
  }
}
