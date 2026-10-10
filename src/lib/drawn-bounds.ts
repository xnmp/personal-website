/** Where a 1-bit screen art's drawing sits in its mask, as shares of the
 *  mask: its centre (x, y) and its size (w, h). A style fits a drawing by
 *  these (to centre it, or to stand every card's at one height) instead of
 *  naming the project whose art it is, so a new project's art fits itself. */
export type DrawnBounds = { x: number; y: number; w: number; h: number };

/** The bounds of the pixels whose alpha reaches `threshold`, in an RGBA-like
 *  buffer of `channels` per pixel with alpha last; null if none do. Pure. */
export function drawnBounds(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  channels: number,
  threshold = 128,
): DrawnBounds | null {
  if (width <= 0 || height <= 0 || channels <= 0 || pixels.length < width * height * channels) return null;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * channels + channels - 1] < threshold) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  return {
    x: round((x0 + x1 + 1) / 2 / width),
    y: round((y0 + y1 + 1) / 2 / height),
    w: round((x1 - x0 + 1) / width),
    h: round((y1 - y0 + 1) / height),
  };
}
