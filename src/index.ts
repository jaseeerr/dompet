import { BipedMovement, walkSpeed } from "./physics/biped.js";
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
  supports,
  type Intent,
} from "./physics/motion.js";
import {
  webAnchor,
  webFlightTime,
  webStrand,
  webSwing,
  webPullDuration,
  webRelease,
  webShootDuration,
} from "./physics/web.js";
import { playback } from "./playback.js";
import { Scanner } from "./dom/scanner.js";
import { drawPlatforms } from "./debug/platforms.js";
import type { Platform, Snapshot } from "./world/platform.js";
export interface DOMPetOptions extends ScanOptions {
  renderer?: "auto" | "sprite" | "webgl";
  character?: "cat" | "human" | "spiderman";
  speed?: number;
  gravity?: number;
  zIndex?: number;
  respectReducedMotion?: boolean;
  debug?: boolean;
  /** Character size in CSS pixels. */
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
  #renderer: NonNullable<DOMPetOptions["renderer"]>;
  #size?: number;
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

  #character: NonNullable<DOMPetOptions["character"]>;
  #refresh?: () => void;
  constructor(options: DOMPetOptions = {}) {
    this.#character = options.character ?? "spiderman";
    if (!["cat", "human", "spiderman"].includes(this.#character))
      throw new TypeError("character must be spiderman, human or cat");
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
    this.#renderer = options.renderer ?? "auto";
    if (!["auto", "sprite", "webgl"].includes(this.#renderer))
      throw new TypeError("Invalid renderer");
    this.#size = options.size;
    if (
      this.#size !== undefined &&
      (!Number.isFinite(this.#size) || this.#size <= 0)
    )
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
    host.dataset.character = this.#character;
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
    const override = this.#size;
    const settings = this.#motion;
    let size = override ?? 112;
    let animation = new Animation();
    const bounds = () => ({ width, height });
    let initial = true;
    let body = spawn({ width: host.clientWidth, height: host.clientHeight });
    let graph: Graph;
    let explorer: Explorer;
    const human = this.#character !== "cat";
    const originalSpeed = settings.speed;
    const newBiped = () =>
      human
        ? new BipedMovement(
            this.#character === "spiderman" ? 1.75 : 1.8,
            this.#character === "spiderman" ? 1.02 : 0.52,
          )
        : undefined;
    let biped = newBiped();
    let web: { platformId: string; origin: Body; elapsed: number } | undefined;
    let nextWebTime = 1200;
    let pointer: { x: number; y: number } | undefined;
    let fleeing = false;
    const fleeIntent = (): Intent => {
      const direction =
        pointer && pointer.x !== body.x
          ? pointer.x < body.x
            ? 1
            : -1
          : animation.facing;
      const support = world.platforms.find((p) => p.id === body.support);
      const nextX = body.x + direction * settings.speed * 1.65 * stepSeconds;
      const canEscape = support && supports(support, nextX, width, settings);
      return { direction: canEscape ? direction : 0, jump: false };
    };
    const updateFleeing = () => {
      const radius = Math.max(42, size * (fleeing ? 1.45 : 1.05));
      const top = body.y - settings.height;
      const next = Boolean(
        pointer &&
        !this.#manual &&
        body.support &&
        Math.hypot(
          Math.max(0, Math.abs(pointer.x - body.x) - settings.width / 2),
          Math.max(0, top - pointer.y, pointer.y - body.y),
        ) <= radius,
      );
      if (next !== fleeing) {
        fleeing = next;
        this.#replan?.();
      }
    };
    const webTarget = (platform: Platform | undefined, origin: Body) => {
      if (!platform?.source?.isConnected || platform.y < size) return;
      const anchor = webAnchor(platform, origin, settings.width);
      if (
        !anchor ||
        origin.y - anchor.y < size * 0.45 ||
        anchor.distance > Math.hypot(width, height) * 0.92
      )
        return;
      const half = settings.width / 2;
      if (
        scanner.zones.some(
          (zone) =>
            Math.min(origin.x, anchor.x) - half < zone.right &&
            Math.max(origin.x, anchor.x) + half > zone.left &&
            anchor.y - size < zone.bottom &&
            Math.min(height, origin.y + size * 0.3) > zone.top,
        )
      )
        return;
      return anchor;
    };
    const advanceWeb = () => {
      animation.web = undefined;
      if (
        !web &&
        !fleeing &&
        !this.#manual &&
        this.#character === "spiderman" &&
        body.support &&
        !body.vx &&
        explorer.state === "idle" &&
        animation.clock >= nextWebTime
      ) {
        nextWebTime = animation.clock + 5000;
        let reach = 0;
        for (const platform of world.platforms) {
          const anchor = webTarget(platform, body);
          if (!anchor) continue;
          const score = Math.abs(anchor.x - body.x) + anchor.distance * 0.45;
          if (score > reach) {
            reach = score;
            web = { platformId: platform.id, origin: body, elapsed: 0 };
          }
        }
      }
      if (fleeing && body.support) web = undefined;
      if (!web) return false;
      const anchor = this.#manual
        ? undefined
        : webTarget(
            world.platforms.find((p) => p.id === web?.platformId),
            web.origin,
          );
      if (
        !anchor ||
        (body.support && body.support !== web.origin.support) ||
        (body.support && body.y !== web.origin.y)
      ) {
        web = undefined;
        return false;
      }
      const { origin, platformId } = web;
      web.elapsed += stepSeconds;
      const pullTime =
        web.elapsed - webRelease - webFlightTime(anchor.distance);
      if (pullTime <= 0) {
        animation.web = {
          clip: "WebShoot",
          time: Math.min(web.elapsed, webShootDuration - 0.001),
        };
        return true;
      }
      const floor = Math.min(height, origin.y + size * 0.3);
      const { x, y, arrived } = webSwing(
        origin,
        anchor,
        pullTime,
        settings.gravity,
        floor,
      );
      body = {
        x,
        y,
        vx: arrived ? 0 : (x - body.x) / stepSeconds,
        vy: arrived ? 0 : (y - body.y) / stepSeconds,
        support: arrived ? platformId : null,
      };
      if (arrived) {
        web = undefined;
        this.#replan?.();
      } else {
        animation.web = {
          clip: "WebPull",
          time: pullTime % webPullDuration,
          lean: Math.max(-0.23, Math.min(0.23, body.vx / 2500)),
        };
      }
      return true;
    };
    const sprite = loadCat(
      draw,
      () =>
        this.#emit(
          "error",
          new Error("Character sprite unavailable; drawing fallback"),
        ),
      this.#renderer !== "sprite",
      this.#character,
    );
    const assetController = new AbortController();
    let model:
      | Awaited<ReturnType<typeof import("./rendering/scene.js").scene>>
      | undefined;
    let disposed = false;
    const fallback = () => {
      model?.dispose();
      model = undefined;
      host.dataset.renderer = "sprite";
      draw();
    };
    host.dataset.renderer = this.#renderer === "sprite" ? "sprite" : "loading";
    if (this.#renderer !== "sprite")
      void import("./rendering/scene.js")
        .then(async ({ scene }) => {
          if (disposed) return;
          const loaded = await scene(
            host.shadowRoot!,
            fallback,
            assetController.signal,
            this.#character,
          );
          if (disposed) {
            loaded.dispose();
            return;
          }
          model = loaded;
          host.dataset.renderer = "webgl";
          draw();
        })
        .catch(() => {
          if (!disposed) fallback();
        });
    this.#disposeSprite = () => {
      disposed = true;
      assetController.abort();
      model?.dispose();
      sprite.dispose();
    };
    this.#replan = () => {
      biped?.invalidate();
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
      body = spawn(bounds(), settings);
      web = undefined;
      nextWebTime = 1200;
      animation = new Animation();
      biped = newBiped();
      draw();
    };
    let dirty: [number, number, number, number] | undefined;
    let webDirty: typeof dirty;
    function draw() {
      if (!ctx || document.hidden) return;
      const start = metrics ? performance.now() : 0;
      layout.checkRoute();
      if (metrics) ctx.clearRect(0, 0, width, height);
      else if (dirty) ctx.clearRect(...dirty);
      if (!metrics && webDirty) ctx.clearRect(...webDirty);
      dirty = webDirty = undefined;
      if (metrics) drawPlatforms(ctx, world, metrics);
      const left = body.x - size / 2,
        top = body.y - (human ? size : (size * tabby.anchorY) / tabby.width);
      const visible = !scanner.zones.some(
        (r) =>
          left < r.right &&
          left + size > r.left &&
          top < r.bottom &&
          body.y + size * 0.32 * animation.sit > r.top,
      );
      if (model && visible) {
        const support = world.platforms
          .filter(
            (p) =>
              p.y >= body.y &&
              p.y - body.y < size * 0.7 &&
              p.intervals.some(([a, b]) => body.x >= a && body.x <= b),
          )
          .sort((a, b) => a.y - b.y)[0];
        if (support) {
          const span = support.intervals.find(
            ([a, b]) => body.x >= a && body.x <= b,
          )!;
          dirty = [body.x - size * 0.22 - 2, support.y - 4, size * 0.44 + 4, 8];
          ctx.save();
          ctx.beginPath();
          ctx.rect(span[0], support.y - 2, span[1] - span[0], 5);
          ctx.clip();
          ctx.fillStyle = `rgba(45,32,28,${0.23 * Math.max(0, 1 - (support.y - body.y) / (size * 0.7))})`;
          ctx.beginPath();
          ctx.ellipse(body.x, support.y, size * 0.22, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      const wrist = model?.draw(
        body,
        animation,
        size,
        ratio,
        visible,
        metrics ? ctx : undefined,
      );
      if (!model && visible) {
        sprite.draw(ctx, animation, body, size, ratio);
        const padding =
          2 +
          (animation.web?.clip === "WebPull"
            ? Math.ceil(size * Math.abs(animation.web.lean ?? 0))
            : 0);
        dirty = [
          left - padding,
          top - padding,
          size + 2 * padding,
          size + 2 * padding + (animation.sit >= 0.5 ? size * 0.31 : 0),
        ];
      }
      if (visible && web && animation.web && web.elapsed >= webRelease) {
        const anchor = webTarget(
          world.platforms.find((p) => p.id === web?.platformId),
          web.origin,
        );
        if (anchor) {
          const hand = wrist ?? {
            x: body.x + animation.facing * size * 0.16,
            y: body.y - size * 0.73,
          };
          const flightTime = webFlightTime(anchor.distance);
          const sinceRelease = web.elapsed - webRelease;
          const extension = Math.min(1, sinceRelease / flightTime);
          const { x, y, controlX, controlY } = webStrand(
            hand,
            anchor,
            extension,
            Math.max(0, sinceRelease - flightTime),
          );
          const left = Math.min(hand.x, x, controlX);
          const top = Math.min(hand.y, y, controlY);
          webDirty = [
            left - 3,
            top - 3,
            Math.max(hand.x, x, controlX) - left + 6,
            Math.max(hand.y, y, controlY) - top + 6,
          ];
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(hand.x, hand.y);
          ctx.quadraticCurveTo(controlX, controlY, x, y);
          ctx.lineCap = "round";
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "rgba(50, 58, 70, 0.6)";
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#f5f8fc";
          ctx.stroke();
          ctx.restore();
        }
      }
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
      size = Math.min(width, height, override ?? (width <= 600 ? 88 : 112));
      if (human) {
        settings.speed = walkSpeed(size, originalSpeed / motion.speed);
        settings.airSpeed = originalSpeed;
      }
      settings.fullFootprint = true;
      settings.width = size * (human ? 0.26 : 0.43);
      settings.height = size * (human ? 1 : 0.56);
      if (initial) {
        body = spawn(bounds(), settings);
        initial = false;
      }
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.#controller = new AbortController();
    const signal = this.#controller.signal;
    const clearPointer = () => {
      pointer = undefined;
    };
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "mouse")
          pointer = { x: event.clientX, y: event.clientY };
      },
      { capture: true, passive: true, signal },
    );
    window.addEventListener(
      "pointerout",
      (event) => {
        if (event.pointerType === "mouse" && !event.relatedTarget)
          clearPointer();
      },
      { capture: true, passive: true, signal },
    );
    window.addEventListener("blur", clearPointer, { signal });
    document.addEventListener("visibilitychange", clearPointer, { signal });
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
        const next = scanner.scan(document, settings.width);
        if (metrics) {
          metrics.scanMs = performance.now() - scanStart;
          metrics.platforms = next.platforms.length;
        }
        const changed =
          width !== oldWidth ||
          height !== oldHeight ||
          !sameGeometry(world.platforms, next.platforms);
        body = carry(body, world.platforms, next.platforms, bounds(), settings);
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
        updateFleeing();
        const plans = explorer.plans;
        const override = this.#manual
          ? this.#intent
          : fleeing
            ? fleeIntent()
            : undefined;
        const nextIntent = () => override ?? explorer.intent(body);
        const grounded = body.support !== null;
        const traversing = advanceWeb();
        const intent = traversing
          ? undefined
          : biped
            ? biped.intent(body, nextIntent, stepSeconds, override, fleeing)
            : nextIntent();
        const physicsStart = metrics ? performance.now() : 0;
        if (metrics) {
          navigationMs += physicsStart - start;
          metrics.replans += explorer.plans - plans;
          metrics.graphEdges = graph.edgeCount;
        }
        if (intent)
          body = step(
            body,
            intent,
            world.platforms,
            bounds(),
            fleeing ? { ...settings, speed: settings.speed * 1.65 } : settings,
          );
        animation.update(
          body,
          grounded,
          this.#manual ? "manual" : explorer.state,
          stepSeconds * 1000,
          this.#manual ? 0 : explorer.lookPitch(body),
        );
        if (biped) {
          if (!grounded && body.support) biped.landed();
          animation.facing = biped.facing;
          animation.heading = biped.heading;
          animation.turnProgress = biped.turnProgress;
          animation.landingTime = biped.landingTime;
        }
        const resting =
          this.#character === "spiderman" &&
          !this.#manual &&
          !fleeing &&
          !traversing &&
          body.support &&
          body.support !== "floor" &&
          !body.vx &&
          !intent?.jump &&
          (explorer.state === "idle" || explorer.state === "sleep") &&
          animation.turnProgress === 1 &&
          animation.landingTime >= 0.65;
        if (!body.support || traversing) animation.sit = 0;
        else
          animation.sit = Math.max(
            0,
            Math.min(1, animation.sit + stepSeconds * (resting ? 4 : -8)),
          );
        if (metrics) physicsMs += performance.now() - physicsStart;
        if (animation.web && web) {
          const anchor = webTarget(
            world.platforms.find((p) => p.id === web?.platformId),
            web.origin,
          );
          if (anchor && anchor.x !== web.origin.x) {
            animation.facing = anchor.x < web.origin.x ? -1 : 1;
            animation.heading = animation.facing === 1 ? 0 : 1;
            if (biped) {
              biped.facing = animation.facing;
              biped.heading = animation.heading;
              biped.turnProgress = 1;
            }
          }
        }
        if (intent?.jump) this.#intent.jump = false;
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
