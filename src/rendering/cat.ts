import spiderSheet from "../characters/spiderman-fallback.webp?inline";
import type { DOMPetOptions } from "../index.js";
import humanSheet from "../characters/human-fallback.webp?inline";
import texturedSheet from "../characters/tabby-fallback.webp?inline";
import sheet from "../characters/tabby.png?inline";
import { tabby, type Clip } from "../characters/tabby.js";
import type { Body } from "../physics/motion.js";
import type { Behaviour } from "../behaviour/explorer.js";

import {
  webPullDuration,
  webShootDuration,
  type WebPose,
} from "../physics/web.js";

export class Animation {
  web?: WebPose;
  clip: Clip = "fall";
  facing: 1 | -1 = tabby.facing;
  elapsed = 0;
  distance = 0;
  clock = 0;
  heading = 0;
  turnProgress = 1;
  landingTime = Infinity;
  sleep = 0;
  anticipation = 0;
  impact = 0;
  descent = 0;
  gaze = 0;
  update(
    body: Body,
    wasGrounded: boolean,
    behaviour: Behaviour | "manual",
    ms: number,
    pitch = 0,
  ) {
    if (body.vx) this.facing = body.vx < 0 ? -1 : 1;
    this.clock += ms;
    this.gaze += (pitch - this.gaze) * Math.min(1, ms / 110);
    this.anticipation +=
      ((behaviour === "prepare-jump" ? 1 : 0) - this.anticipation) *
      Math.min(1, ms / 55);
    if (!body.support) this.descent = Math.max(0, body.vy);
    else if (!wasGrounded) this.impact = Math.min(1, this.descent / 520);
    this.sleep +=
      ((body.support && behaviour === "sleep" ? 1 : 0) - this.sleep) *
      Math.min(1, ms / 170);
    if (body.support) this.distance += (Math.abs(body.vx) * ms) / 1000;
    const target = this.facing === 1 ? 0 : 1;
    this.heading +=
      Math.sign(target - this.heading) *
      Math.min(Math.abs(target - this.heading), ms / 180);
    let next: Clip;
    if (!body.support) next = body.vy < 0 ? "jump" : "fall";
    else if (
      !wasGrounded ||
      (this.clip === "land" &&
        this.elapsed <
          tabby.clips.land.durations.reduce((total, n) => total + n, 0))
    )
      next = "land";
    else if (body.vx) next = "walk";
    else next = behaviour === "sleep" ? "sleep" : "idle";
    if (next !== this.clip) {
      this.clip = next;
      this.elapsed = 0;
    } else this.elapsed += ms;
  }
  get frame() {
    const clip = tabby.clips[this.clip];
    const total = clip.durations.reduce<number>((sum, d) => sum + d, 0);
    let t = clip.loop ? this.elapsed % total : this.elapsed;
    for (let i = 0; i < clip.durations.length - 1; i++) {
      if (t < clip.durations[i]) return clip.first + i;
      t -= clip.durations[i];
    }
    return clip.first + clip.durations.length - 1;
  }
}

export function loadCat(
  redraw: () => void,
  failed: () => void,
  textured = false,
  character: DOMPetOptions["character"] = "cat",
) {
  const human = character !== "cat";
  const frameScale = textured || human ? 6 : 1;
  const spider = character === "spiderman";
  const image = new Image();
  let ready = false;
  image.onload = () => {
    ready =
      image.naturalWidth === (spider ? 24 : 15) * tabby.width * frameScale &&
      image.naturalHeight === (spider ? 9 : 1) * tabby.height * frameScale;
    redraw();
    if (!ready) failed();
  };
  image.onerror = () => {
    ready = false;
    redraw();
    failed();
  };
  if (spider) {
    // A synchronous start/destroy pair should never begin an asset fetch.
    queueMicrotask(() => {
      if (image.onload) image.src = spiderSheet;
    });
  } else image.src = human ? humanSheet : textured ? texturedSheet : sheet;
  return {
    draw(
      ctx: CanvasRenderingContext2D,
      animation: Animation,
      body: Body,
      size: number,
      dpr: number,
    ) {
      const scale = size / (human ? tabby.anchorY : tabby.width);
      ctx.save();
      ctx.translate(
        Math.round(body.x * dpr) / dpr,
        Math.round(body.y * dpr) / dpr,
      );
      let frame = animation.frame,
        row = 0,
        facing = animation.facing;
      if (spider) {
        let phase = (animation.clock / 3600) % 1;
        if (animation.web) {
          const shooting = animation.web.clip === "WebShoot";
          row = shooting ? 7 : 8;
          const duration = shooting ? webShootDuration : webPullDuration;
          phase = Math.min(1, animation.web.time / duration);
        } else if (!body.support) {
          row = 4;
          phase = Math.max(0, Math.min(1, (body.vy + 480) / 960));
        } else if (animation.landingTime < 1.02) {
          row = 5;
          phase = animation.landingTime / 1.02;
        } else if (animation.turnProgress < 1) {
          row = 2;
          phase = animation.turnProgress;
          facing = animation.facing === -1 ? 1 : -1;
        } else if (animation.anticipation > 0.2) {
          row = 3;
          phase = animation.anticipation;
        } else if (body.vx) {
          row = 1;
          phase = ((animation.distance * 2.15767) / (size * 0.82)) % 1;
        } else if (animation.clock % 3700 < 240) {
          row = 6;
          phase = (animation.clock % 3700) / 240;
        }
        frame = Math.min(23, Math.floor(phase * 24));
      }
      if (animation.web?.clip === "WebPull")
        ctx.rotate(animation.web.lean ?? 0);
      ctx.scale(facing * scale, scale);
      ctx.imageSmoothingEnabled = textured || human;
      if (ready) {
        ctx.drawImage(
          image,
          frame * tabby.width * frameScale,
          row * tabby.height * frameScale,
          tabby.width * frameScale,
          tabby.height * frameScale,
          -tabby.anchorX,
          -tabby.anchorY,
          tabby.width,
          tabby.height,
        );
      } else if (!human) {
        ctx.fillStyle = "#43323d";
        ctx.fillRect(-12, -16, 24, 16);
        ctx.fillRect(-10, -21, 5, 6);
        ctx.fillRect(5, -21, 5, 6);
        ctx.fillStyle = "#ffe5b5";
        ctx.fillRect(-5, -10, 3, 3);
        ctx.fillRect(5, -10, 3, 3);
      }
      ctx.restore();
    },
    dispose() {
      image.onload = null;
      image.onerror = null;
    },
  };
}
