// Relight the torn rim of a cut-paper asset for the brief's key light.
//   node scripts/relight-edge.mjs <in.png> <out.png> [--band=16] [--shade=0.45] [--lift=0.06]
//
// A generated torn edge is lit evenly: its exposed fibres (the paper's pale
// core) glow on all four sides, which reads as an outline, not as paper in a
// light from the upper left. This keeps the fibres that face the light and
// lets the ones that face away (bottom, right) fall into shade, within --band
// px of the outer silhouette. Only the outer edge: a window cut in a mat keeps
// its authored bevel. The normal comes from a blurred silhouette, so each run
// of fibres takes its side's light, not each lump its own.
import sharp from "sharp";

const args = process.argv.slice(2);
const [src, out] = args.filter((a) => !a.startsWith("--"));
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((f) => f.slice(2).split("=")));
if (!src || !out) {
  console.error("usage: relight-edge.mjs <in> <out> [--band=16] [--shade=0.45] [--lift=0.06]");
  process.exit(1);
}
const BAND = +(opt.band ?? 16);
const SHADE = +(opt.shade ?? 0.45); // darkening of fibres turned fully from the light
const LIFT = +(opt.lift ?? 0.06); // brightening of fibres turned to it

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

// the outside: transparent pixels connected to the canvas border
const outside = new Uint8Array(N);
const stack = [];
const seed = (x, y) => {
  const i = y * W + x;
  if (!outside[i] && data[i * 4 + 3] <= 127) {
    outside[i] = 1;
    stack.push(i);
  }
};
for (let x = 0; x < W; x++) {
  seed(x, 0);
  seed(x, H - 1);
}
for (let y = 0; y < H; y++) {
  seed(0, y);
  seed(W - 1, y);
}
while (stack.length) {
  const i = stack.pop();
  const x = i % W;
  const y = (i - x) / W;
  if (x > 0) seed(x - 1, y);
  if (x < W - 1) seed(x + 1, y);
  if (y > 0) seed(x, y - 1);
  if (y < H - 1) seed(x, y + 1);
}

// chamfer distance (px) from each inside pixel to the outside
const dist = new Float32Array(N);
for (let i = 0; i < N; i++) dist[i] = outside[i] ? 0 : 1e9;
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dist[y * W + x]);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (dist[i]) dist[i] = Math.min(dist[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
  }
for (let y = H - 1; y >= 0; y--)
  for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x;
    if (dist[i]) dist[i] = Math.min(dist[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
  }

// a blurred silhouette for the edge's broad direction
const mask = Buffer.alloc(N);
for (let i = 0; i < N; i++) mask[i] = outside[i] ? 0 : 255;
const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(BAND / 2).toColourspace("b-w").extractChannel(0).raw().toBuffer();
const s = (x, y) => soft[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const px = Buffer.from(data);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (outside[i] || data[i * 4 + 3] === 0) continue;
    const d = dist[i] / 3;
    const w = 1 - smooth(BAND * 0.5, BAND, d);
    if (w <= 0) continue;
    // the inward gradient; the light comes from the upper left, so an edge
    // whose inside lies down-right of it (top, left) faces the light
    const gx = s(x + 2, y) - s(x - 2, y);
    const gy = s(x, y + 2) - s(x, y - 2);
    const gl = Math.hypot(gx, gy);
    if (!gl) continue;
    const facing = (gx + gy) / gl / Math.SQRT2; // -1 turned away .. 1 square to the light
    const lit = Math.min(1, Math.max(0, (facing + 0.2) / 0.9)); // top and left edges ~1
    const m = 1 + w * (lit * LIFT - (1 - lit) * SHADE);
    for (let k = 0; k < 3; k++) px[i * 4 + k] = Math.min(255, Math.round(data[i * 4 + k] * m));
  }

await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
console.log(`${out} ${W}x${H}`);
