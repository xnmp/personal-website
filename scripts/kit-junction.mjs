/** Restore a narrow painted junction defect from the intact rail profiles on
 * either side. Coordinates address the trimmed, SHA-pinned source, not output
 * pixels. Only RGB inside the declared bands changes; native coverage remains
 * authored, including the edge's antialiasing. Never writes the source file. */
export function repairJunctions(image, { size, horizontal, vertical, depth, radius }) {
  const { data, info: { width: W, height: H } } = image;
  if (!Array.isArray(size) || size[0] !== W || size[1] !== H ||
      !Number.isSafeInteger(depth) || depth < 1 || depth * 2 >= Math.min(W, H) ||
      !Number.isSafeInteger(radius) || radius < 1 ||
      !Array.isArray(horizontal) || !Array.isArray(vertical) ||
      horizontal.some(x => !Number.isSafeInteger(x) || x - radius < 1 || x + radius >= W - 1) ||
      vertical.some(y => !Number.isSafeInteger(y) || y - radius < 1 || y + radius >= H - 1)) {
    throw new Error('junction repair requires matching source dimensions and bounded integer bands');
  }
  const out = Buffer.from(data);
  const at = (x, y) => (y * W + x) * 4;
  const restore = (centre, length, pixel) => {
    const first = centre - radius - 1, last = centre + radius + 1;
    for (let j = 0; j < length; j++) {
      const a = pixel(first, j), b = pixel(last, j);
      for (let s = first + 1; s < last; s++) {
        const p = pixel(s, j), t = (s - first) / (last - first);
        const wa = data[a + 3] * (1 - t), wb = data[b + 3] * t;
        if (!data[p + 3] || wa + wb === 0) continue;
        for (let k = 0; k < 3; k++) out[p + k] = Math.round((data[a + k] * wa + data[b + k] * wb) / (wa + wb));
      }
    }
  };
  for (const x of horizontal) {
    restore(x, depth, (s, j) => at(s, j));
    restore(x, depth, (s, j) => at(s, H - 1 - j));
  }
  for (const y of vertical) {
    restore(y, depth, (s, j) => at(j, s));
    restore(y, depth, (s, j) => at(W - 1 - j, s));
  }
  return { data: out, info: image.info };
}
