import type { Animation } from "./cat.js";
import type { Body } from "../types.js";
export function scene(
  host: ShadowRoot,
  lost: () => void,
  signal: AbortSignal,
  character: "human" | "cat" | "spiderman",
): Promise<{
  draw(
    body: Body,
    animation: Animation,
    size: number,
    ratio: number,
    visible: boolean,
    debug?: CanvasRenderingContext2D,
  ): { x: number; y: number } | undefined;
  dispose(): void;
}>;
