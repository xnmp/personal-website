// Derive a pixel-registered state bitmap from an authored normal-state bitmap.
//   node scripts/derive-state.mjs <normal.webp> <out.webp> <hover|focus> [--catch=0.5] [--sheen=0.18] [--ring=14:22] [--ring-color=f0502a]
//
// Generated hover/pressed art drifts: the model reframes the object, so a
// 9-slice of it lands corners and screws in different places from the normal
// state. Deriving the light-catch states from the normal keeps the silhouette,
// chamfers and screws identical by construction. The material stays the
// authored one; only the light changes.
//   hover  top-left key light: a sheen over the face plus a brighter edge catch
//   focus  a vermilion silkscreen line just inside the bevel, following the
//          silhouette (so it follows the chamfers, unlike a CSS outline), with
//          an optional dark keyline inside it so the line holds on any cap.
//          Pass --catch=0 --sheen=0 to keep focus distinct from hover.
//   pressed the cap sinks: the face dims and the bevels that faced the light
//          fall into the shade of the surround
import sharp from "sharp";

const [, , src, out, mode = "hover", ...flags] = process.argv;
if (!src || !out || !["hover", "focus", "pressed"].includes(mode)) {
  console.error("usage: derive-state.mjs <normal> <out.webp> <hover|focus|pressed> [--catch=] [--sheen=] [--ring=a:b] [--ring-color=hex] [--halo=a:b] [--halo-color=hex]");
  process.exit(1);
}
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const CATCH = +(opt.catch ?? 0.5); // edge-catch gain on the outer bevel
const SHEEN = +(opt.sheen ?? 0.18); // face sheen strength at the top-left
const [R0, R1] = (opt.ring ?? "14:22").split(":").map(Number); // focus line band, px from the edge
// the focus line is vermilion, except on a vermilion cap, where it is cream
const hex = (h) => h.match(/../g).map((c) => parseInt(c, 16));
const RING = hex(opt["ring-color"] ?? "f0502a");
// a dark keyline just inside the focus line (two-tone focus indicator)
const [H0, H1] = opt.halo ? opt.halo.split(":").map(Number) : [0, 0];
const HALO = hex(opt["halo-color"] ?? "0b0c0e");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
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

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const screen = (c, l) => 255 - ((255 - c) * (255 - l)) / 255;

const outBuf = Buffer.from(data);
const diag = Math.hypot(W, H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const p = i * 4;
    if (data[p + 3] === 0) continue;
    const d = dist[i] / 3; // chamfer units -> px
    // key light from the upper left (the brief's light direction)
    const fall = Math.exp(-((Math.hypot(x, y) / diag) ** 2) / 0.18);
    // outward normal from the distance field; only bevels facing the
    // upper-left light catch it
    const gx = at(x + 1, y) - at(x - 1, y);
    const gy = at(x, y + 1) - at(x, y - 1);
    const gl = Math.hypot(gx, gy) || 1;
    const facing = Math.max(0, (gx + gy) / gl / Math.SQRT2); // n = -grad, L = (-1,-1)/sqrt2
    const bevel = 1 - smooth(2, 12, d);
    let rgb;
    if (mode === "pressed") {
      const shade = 0.9 * (1 - CATCH * bevel * facing);
      rgb = [0, 1, 2].map((k) => data[p + k] * shade);
    } else {
      const light = 255 * (SHEEN * fall + CATCH * bevel * facing);
      rgb = [0, 1, 2].map((k) => screen(data[p + k], Math.min(255, light)));
    }
    if (mode === "focus") {
      const band = (a, b) => smooth(a - 1.5, a, d) * (1 - smooth(b, b + 1.5, d));
      const h = H1 ? band(H0, H1) * 0.85 : 0;
      rgb = rgb.map((c, k) => c * (1 - h) + HALO[k] * h);
      const w = band(R0, R1);
      rgb = rgb.map((c, k) => c * (1 - w) + RING[k] * w);
    }
    for (let k = 0; k < 3; k++) outBuf[p + k] = Math.round(rgb[k]);
  }

await sharp(outBuf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
console.log(out, W, H, mode);
