import type { ScanOptions } from "../types.js";
export type { ScanOptions } from "../types.js";
import {
  subtract,
  type Interval,
  type Platform,
  type Snapshot,
} from "../world/platform.js";

const semantic =
  "button,input,textarea,select,fieldset,img,video,canvas,a[href]";
const containers =
  "div,main,form,ul,ol,li,nav,section,article,header,footer,aside,figure";
const excluded =
  "[data-dompet],[data-dompet-ignore],script,style,template,noscript,iframe,object,embed";
const petWidth = 30;
function painted(color: string) {
  return (
    color !== "transparent" &&
    !/^(?:rgba|hsla)\([^)]*,\s*0(?:\.0+)?\)$/.test(color) &&
    !/\/\s*0(?:\.0+)?%?\)$/.test(color)
  );
}
function hasSurface(style: CSSStyleDeclaration) {
  return (
    painted(style.backgroundColor) ||
    style.backgroundImage !== "none" ||
    (parseFloat(style.borderTopWidth) > 0 && painted(style.borderTopColor)) ||
    style.boxShadow !== "none"
  );
}
// On very large documents sample the viewport first. Include nearby siblings so
// short controls between sample rows can still contribute their top edge.
function viewportCandidates(
  doc: Document,
  width: number,
  height: number,
  selector: string,
) {
  const found = new Set<Element>();
  const cols = Math.max(1, Math.min(12, Math.ceil(width / 150)));
  const rows = Math.max(1, Math.min(10, Math.ceil(height / 90)));
  function add(el: Element | null) {
    if (el && found.size < 256 && el.matches(selector)) found.add(el);
  }
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      let el = doc.elementFromPoint(
        ((col + 0.5) * width) / cols,
        ((row + 0.5) * height) / rows,
      );
      while (el && el !== doc.body && el !== doc.documentElement) {
        add(el);
        add(el.previousElementSibling);
        add(el.nextElementSibling);
        el = el.parentElement;
      }
    }
  return [...found].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}
export class Scanner {
  private ids = new WeakMap<Element, string>();
  private next = 1;
  private minimum: number;
  private include: string;
  private exclude: string;
  private zoneSelector: string;
  zones: DOMRect[] = [];
  roots = new Set<Element>();
  constructor(options: ScanOptions) {
    this.minimum = options.minPlatformWidth ?? petWidth / 2;
    if (!Number.isFinite(this.minimum) || this.minimum <= 0)
      throw new RangeError("minPlatformWidth must be positive and finite");
    this.include = (options.include ?? []).join(",");
    this.zoneSelector = (options.exclusionZones ?? []).join(",");
    this.exclude = [
      excluded,
      ...(options.exclude ?? []),
      ...(options.exclusionZones ?? []),
    ].join(",");
  }
  scan(doc: Document): Snapshot {
    this.roots = new Set([doc.documentElement, doc.body]);
    this.zones = this.zoneSelector
      ? Array.from(doc.querySelectorAll(this.zoneSelector)).flatMap((el) => {
          this.roots.add(el);
          const r = el.getBoundingClientRect();
          return r.width &&
            r.height &&
            getComputedStyle(el).visibility === "visible"
            ? [r]
            : [];
        })
      : [];
    const view = doc.defaultView!;
    const width = doc.documentElement.clientWidth,
      height = doc.documentElement.clientHeight;
    const platforms: Platform[] = [];
    const rejected: Record<string, number> = {};
    const reject = (reason: string) => {
      rejected[reason] = (rejected[reason] ?? 0) + 1;
    };
    const styles = new Map<Element, CSSStyleDeclaration>();
    const styleOf = (el: Element) => {
      let style = styles.get(el);
      if (!style) {
        style = view.getComputedStyle(el);
        styles.set(el, style);
      }
      return style;
    };
    // Validate exclusions even on an empty page.
    doc.documentElement.matches(this.exclude);
    const selector = [semantic, containers, this.include]
      .filter(Boolean)
      .join(",");
    const all = doc.body.querySelectorAll(selector);
    const candidates =
      all.length > 2048
        ? viewportCandidates(doc, width, height, selector)
        : all;
    const rects = new Map<Element, DOMRect>();
    function rectOf(el: Element) {
      let r = rects.get(el);
      if (!r) {
        r = el.getBoundingClientRect();
        rects.set(el, r);
      }
      return r;
    }
    if (candidates.length < all.length)
      rejected["outside shortlist"] = all.length - candidates.length;
    for (const el of Array.from(candidates)) {
      const rect = rectOf(el);
      if (
        rect.bottom <= 0 ||
        rect.top >= height ||
        rect.right <= 0 ||
        rect.left >= width
      ) {
        reject("offscreen");
        continue;
      }
      if (platforms.length >= 128) {
        reject("platform limit");
        continue;
      }
      if (el.closest(this.exclude)) {
        reject("excluded");
        continue;
      }
      const style = styleOf(el);

      if (
        !el.isConnected ||
        !rect.height ||
        !rect.width ||
        style.visibility !== "visible"
      ) {
        reject("hidden");
        continue;
      }
      if (
        !el.matches(semantic) &&
        !(this.include && el.matches(this.include)) &&
        !hasSurface(style)
      ) {
        reject("unpainted");
        continue;
      }
      if (rect.width >= width * 0.95 && rect.height >= height * 0.85) {
        reject("page-sized");
        continue;
      }
      const y = rect.top;
      let left = Math.max(0, rect.left),
        right = Math.min(width, rect.right);
      if (y < 0 || y >= height || left >= right) {
        reject("offscreen");
        continue;
      }
      const sampleY = y + Math.min(0.5, rect.height / 2, (height - y) / 2);
      let reason = "";
      for (let node: Element | null = el; node; node = node.parentElement) {
        const css = styleOf(node);
        if (
          Number(css.opacity) === 0 ||
          (node !== el && css.contentVisibility === "hidden")
        ) {
          reason = "hidden";
          break;
        }
        if (node === el || node === doc.documentElement) continue;
        if (css.overflowX === "visible" && css.overflowY === "visible")
          continue;
        this.roots.add(node);
        const bounds = rectOf(node);
        if (css.overflowY !== "visible") {
          const top = bounds.top + node.clientTop;
          if (y < top || sampleY >= top + node.clientHeight) {
            reason = "clipped";
            break;
          }
        }
        if (css.overflowX !== "visible") {
          const start = bounds.left + node.clientLeft;
          left = Math.max(left, start);
          right = Math.min(right, start + node.clientWidth);
        }
      }
      if (reason) {
        reject(reason);
        continue;
      }
      if (right - left < this.minimum) {
        reject("too narrow");
        continue;
      }
      let intervals: Interval[] = [];
      const samples = Math.min(
        all.length > 256 ? 3 : 64,
        Math.ceil((right - left) / Math.max(1, Math.min(8, this.minimum))),
      );
      const step = (right - left) / samples;
      let run: number | undefined;
      for (let i = 0; i < samples; i++) {
        const hit = doc.elementFromPoint(left + (i + 0.5) * step, sampleY);
        if (hit && el.contains(hit)) {
          run ??= left + i * step;
        } else if (run !== undefined) {
          intervals.push([run, left + i * step]);
          run = undefined;
        }
      }
      if (run !== undefined) intervals.push([run, right]);
      if (!intervals.length) {
        reject("occluded");
        continue;
      }
      for (const zone of this.zones)
        if (y >= zone.top && y < zone.bottom)
          intervals = subtract(intervals, [zone.left, zone.right]);
      for (const other of platforms) {
        if (Math.abs(other.y - y) <= 1)
          for (const interval of other.intervals)
            intervals = subtract(intervals, interval);
      }
      intervals = intervals.filter(([a, b]) => b - a >= this.minimum);
      if (!intervals.length) {
        reject("no usable interval");
        continue;
      }
      let id = this.ids.get(el);
      if (!id) {
        id = "p" + this.next++;
        this.ids.set(el, id);
      }
      platforms.push({
        id,
        y,
        left: intervals[0][0],
        right: intervals[intervals.length - 1][1],
        originX: rect.left,
        source: el,
        intervals,
      });
    }
    platforms.push({
      id: "floor",
      source: null,
      y: height,
      left: 0,
      right: width,
      intervals: [[0, width]],
    });
    return { platforms, candidates: all.length, rejected };
  }
}
