import type { Snapshot } from "../world/platform.js";
import type { DOMPetMetrics } from "../index.js";
export function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  world: Snapshot,
  m: DOMPetMetrics,
) {
  ctx.save();
  ctx.font = "12px monospace";
  ctx.lineWidth = 2;
  for (const p of world.platforms) {
    const y = p.source ? p.y : p.y - 1;
    ctx.fillStyle = ctx.strokeStyle = "#ad205b";
    for (const [left, right] of p.intervals) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.fillText(p.id, left + 2, y > 14 ? y - 3 : y + 13);
    }
  }
  const lines = [
    world.candidates +
      " candidates · " +
      world.platforms.length +
      " platforms (incl. floor)",
    `scan ${m.scanMs.toFixed(1)} ms · frame ${m.frameMs.toFixed(1)} ms`,
    `graph ${m.graphNodes} nodes / ${m.graphEdges} edges · ${m.replans} plans`,
    ...Object.entries(world.rejected).map(([reason, n]) => reason + " " + n),
  ];
  const width = Math.max(...lines.map((s) => ctx.measureText(s).width)) + 12;
  ctx.fillStyle = "#202821";
  ctx.fillRect(6, 16, width, lines.length * 16 + 8);
  ctx.fillStyle = "white";
  lines.forEach((s, i) => ctx.fillText(s, 12, 32 + i * 16));
  ctx.restore();
}
