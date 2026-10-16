import { scaleField } from "./framed-pane.mjs";

export function chamferDistance(data, W, H) {
  const N = W * H;
  // Chamfer (3-4) distance from each opaque pixel to the nearest transparent one.
  const INF = 1e9;
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = data[i * 4 + 3] > 127 ? INF : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dist[y * W + x]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    }

  return dist;
}

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Normalize the logical silhouette's gradient before interpolation. Taking a
// derivative after thresholding native alpha amplifies single-pixel coverage
// crossings into bright/dark bands across an otherwise continuous bevel.
export function edgeCatch(data, width, height, catchWidth, density) {
  const distance = chamferDistance(data, width, height);
  const at = (x, y) => x < 0 || y < 0 || x >= width || y >= height ? 0 : distance[y * width + x];
  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1);
    const facing = Math.max(0, (gx + gy) / (Math.hypot(gx, gy) || 1) / Math.SQRT2);
    field[i] = facing * (1 - smooth(Math.min(2, catchWidth / 3), catchWidth, distance[i] / 3));
  }
  return scaleField(field, width, height, 1, density);
}
