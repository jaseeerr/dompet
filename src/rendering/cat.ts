import spiderSheet from "../characters/spiderman-fallback.webp?inline";
import type { DOMPetOptions } from "../index.js";
import humanSheet from "../characters/human-fallback.webp?inline";
import texturedSheet from "../characters/tabby-fallback.webp?inline";
import sheet from "../characters/tabby.png?inline";
import { tabby, type Clip } from "../characters/tabby.js";
import type { Body } from "../physics/motion.js";
import type { Behaviour } from "../behaviour/explorer.js";

export class Animation {
  clip: Clip = "fall";
  facing: 1 | -1 = tabby.facing;
  elapsed = 0;
  distance = 0;
  clock = 0;
  heading = 0;
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
  const image = new Image();
  let ready = false;
  image.onload = () => {
    ready =
      image.naturalWidth === 15 * tabby.width * frameScale &&
      image.naturalHeight === tabby.height * frameScale;
    redraw();
    if (!ready) failed();
  };
  image.onerror = () => {
    ready = false;
    redraw();
    failed();
  };
  image.src =
    character === "spiderman"
      ? spiderSheet
      : human
        ? humanSheet
        : textured
          ? texturedSheet
          : sheet;
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
      ctx.scale(animation.facing * scale, scale);
      ctx.imageSmoothingEnabled = textured || human;
      if (ready) {
        ctx.drawImage(
          image,
          animation.frame * tabby.width * frameScale,
          0,
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
