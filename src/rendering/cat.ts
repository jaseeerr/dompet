import sheet from "../characters/tabby.png?inline";
import { tabby, type Clip } from "../characters/tabby.js";
import type { Body } from "../physics/motion.js";
import type { Behaviour } from "../behaviour/explorer.js";

export class Animation {
  clip: Clip = "fall";
  facing: 1 | -1 = tabby.facing;
  elapsed = 0;
  update(
    body: Body,
    wasGrounded: boolean,
    behaviour: Behaviour | "manual",
    ms: number,
  ) {
    if (body.vx) this.facing = body.vx < 0 ? -1 : 1;
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

export function loadCat(redraw: () => void, failed: () => void) {
  const image = new Image();
  let ready = false;
  image.onload = () => {
    ready =
      image.naturalWidth === 15 * tabby.width &&
      image.naturalHeight === tabby.height;
    redraw();
    if (!ready) failed();
  };
  image.onerror = () => {
    ready = false;
    redraw();
    failed();
  };
  image.src = sheet;
  return {
    draw(
      ctx: CanvasRenderingContext2D,
      animation: Animation,
      body: Body,
      size: number,
      dpr: number,
    ) {
      const scale = size / tabby.width;
      ctx.save();
      ctx.translate(
        Math.round(body.x * dpr) / dpr,
        Math.round(body.y * dpr) / dpr,
      );
      ctx.scale(animation.facing * scale, scale);
      ctx.imageSmoothingEnabled = false;
      if (ready) {
        ctx.drawImage(
          image,
          animation.frame * tabby.width,
          0,
          tabby.width,
          tabby.height,
          -tabby.anchorX,
          -tabby.anchorY,
          tabby.width,
          tabby.height,
        );
      } else {
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
