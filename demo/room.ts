// A pixel-art interior matches the journal's resident tabby.
export function drawRoom(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  function block(x: number, y: number, w: number, h: number, color: string) {
    ctx!.fillStyle = color;
    ctx!.fillRect(x, y, w, h);
  }
  block(0, 0, 152, 80, "#e9dbc0");
  for (let x = 2; x < 152; x += 8) block(x, 0, 1, 80, "#e3d2b4");
  block(0, 64, 152, 16, "#bc8767");
  block(0, 64, 152, 2, "#94634d");
  for (let x = 0; x < 152; x += 24) block(x, 70, 1, 10, "#ac795f");
  block(16, 7, 68, 47, "#a97352");
  block(19, 10, 62, 40, "#b4cfcb");
  block(61, 15, 6, 6, "#fff1bc");
  block(60, 16, 8, 4, "#fff1bc");
  for (const [x, y, w] of [
    [19, 32, 16],
    [31, 28, 12],
    [40, 35, 15],
    [55, 30, 16],
    [68, 27, 13],
  ]) {
    block(x, y, w, 50 - y, "#83a69b");
    block(x + 3, y - 3, w - 5, 3, "#83a69b");
  }
  block(19, 39, 62, 11, "#72958a");
  block(47, 10, 3, 40, "#f5e5c9");
  block(19, 29, 62, 2, "#f5e5c9");
  block(13, 51, 74, 3, "#85533f");
  block(15, 54, 70, 2, "#bb895e");
  block(95, 34, 44, 30, "#80573e");
  block(98, 37, 38, 24, "#614735");
  block(97, 49, 40, 2, "#ac7d55");
  const books = ["#d29060", "#819b82", "#c4a169", "#ac6852"];
  for (let i = 0; i < 8; i++) {
    const h = 7 + (i % 3);
    block(100 + i * 4, 49 - h, 3, h, books[i % 4]);
    block(100 + i * 4, 47, 3, 1, "#dfc49d");
  }
  block(100, 57, 19, 3, "#819b82");
  block(102, 54, 18, 2, "#bb8b62");
  block(117, 21, 3, 11, "#54705a");
  block(111, 19, 7, 4, "#72845c");
  block(108, 16, 6, 4, "#72845c");
  block(119, 17, 6, 4, "#556c50");
  block(123, 14, 4, 4, "#556c50");
  block(111, 26, 15, 2, "#aa694d");
  block(113, 28, 11, 6, "#bc7758");
  block(20, 68, 62, 2, "#a8775b");
  block(17, 70, 68, 4, "#d3a76d");
  block(20, 74, 62, 2, "#a8775b");
  block(28, 61, 3, 7, "#76503e");
  block(69, 61, 3, 7, "#76503e");
  block(25, 58, 50, 4, "#885d43");
  block(28, 55, 44, 3, "#aab49b");
  block(31, 54, 38, 1, "#bdc7aa");
}
