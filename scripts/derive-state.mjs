// Derive a pixel-registered state bitmap from an authored normal-state bitmap.
//   node scripts/derive-state.mjs <normal.webp> <out.webp> <hover|focus> [--catch=0.5] [--catch-width=12] [--sheen=0.18] [--ring=14:22] [--ring-color=f0502a]
//
// Generated hover/pressed art drifts: the model reframes the object, so a
// 9-slice of it lands corners and screws in different places from the normal
// state. Deriving the light-catch states from the normal keeps the silhouette,
// chamfers and screws identical by construction. The material stays the
// authored one; only the light changes.
//   hover  top-left key light: a sheen over the face plus a brighter edge catch
//   focus  a coloured line just inside the edge, following the silhouette
//          (so it follows the corners, unlike a CSS outline), with an optional
//          dark keyline inside it so the line holds on any cap. With
//          --groove=<depth> the line is a channel cut into the board: it keeps
//          the board's grain, and its walls take the upper-left light (the
//          wall nearer the edge is in shade along the lit sides and catches
//          the light along the shaded ones, the inner wall the other way).
//          --groove-tint=hex is the colour the shaded wall falls toward.
//          Pass --catch=0 --sheen=0 to keep focus distinct from hover.
//   pressed the cap sinks: the face dims (--dim, the face's remaining
//          brightness) and the bevels that faced the light fall into the shade
//          of the surround
import sharp from "sharp";
import { webpOptions } from "./webp.mjs";

const [, , src, out, mode = "hover", ...flags] = process.argv;
if (!src || !out || !["hover", "focus", "pressed"].includes(mode)) {
  console.error("usage: derive-state.mjs <normal> <out.webp> <hover|focus|pressed> [--catch=] [--catch-width=px] [--sheen=] [--ring=a:b] [--ring-color=hex] [--halo=a:b[,c:d]] [--halo-color=hex] [--crown=0.2] [--dim=0.9] [--light=hex] [--ring-radius=px]");
  process.exit(1);
}
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const CATCH = +(opt.catch ?? 0.5); // edge-catch gain on the outer bevel
const SHEEN = +(opt.sheen ?? 0.18); // face sheen strength at the top-left
const CATCH_W = +(opt["catch-width"] ?? 12); // px of bevel the catch spans in from the edge
const DIM = +(opt.dim ?? 0.9); // pressed: what's left of the face's brightness
const [R0, R1] = (opt.ring ?? "14:22").split(":").map(Number); // focus line band, px from the edge
// With --ring-radius the line is a rounded rectangle inset R0 from the
// art's bounds, its corners this round, instead of following the
// silhouette: an outline offset inward past its corner radius comes out
// square-cornered, which reads wrong inside a rounded bezel.
const RADIUS = opt["ring-radius"] === undefined ? 0 : +opt["ring-radius"];
// the focus line is vermilion, except on a vermilion cap, where it is cream
const hex = (h) => h.match(/../g).map((c) => parseInt(c, 16));
const RING = hex(opt["ring-color"] ?? "f0502a");
// the key light's colour: white by default; a warm light keeps brass gold as
// it brightens, where white would wash it toward silver
const LIGHT = hex(opt.light ?? "ffffff").map((c) => c / 255);
// dark keylines beside the focus line (a two-tone focus indicator): one or
// more bands, a:b[,c:d], e.g. one either side of the line
const HALOS = opt.halo ? opt.halo.split(",").map((b) => b.split(":").map(Number)) : [];
const HALO = hex(opt["halo-color"] ?? "0b0c0e");
const GROOVE = +(opt.groove ?? 0); // channel wall shading, 0 = a flat printed line
// what the channel's shaded wall falls toward: black by default; a light line
// on a dark card shades toward the card's own colour (a cream line shaded
// toward black reads as grey metal, not card)
const GROOVE_TINT = hex(opt["groove-tint"] ?? "000000");
// a flat line laid in as enamel: brighter along its middle (it is a little
// proud) and carrying a little of the board's grain, so it reads as material
const CROWN = +(opt.crown ?? 0);

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

// the board's mean brightness, so a grooved line can carry its grain
let lumSum = 0;
let lumN = 0;
for (let i = 0; i < N; i++)
  if (data[i * 4 + 3] > 127) {
    lumSum += data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2];
    lumN++;
  }
const MEAN_LUM = lumSum / Math.max(1, lumN);

// the opaque art's bounds, for a rounded focus line
let [bx0, by0, bx1, by1] = [W, H, -1, -1];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (data[(y * W + x) * 4 + 3] > 127) [bx0, by0, bx1, by1] = [Math.min(bx0, x), Math.min(by0, y), Math.max(bx1, x), Math.max(by1, y)];
/** depth (px) inside the rounded rectangle inset R0 from the bounds */
const roundDepth = (x, y) => {
  const [cx, cy] = [(bx0 + bx1) / 2, (by0 + by1) / 2];
  const [hx, hy] = [(bx1 - bx0) / 2 - R0, (by1 - by0) / 2 - R0];
  const [qx, qy] = [Math.abs(x - cx) - hx + RADIUS, Math.abs(y - cy) - hy + RADIUS];
  return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - RADIUS);
};

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
    const bevel = 1 - smooth(Math.min(2, CATCH_W / 3), CATCH_W, d);
    let rgb;
    if (mode === "pressed") {
      const shade = DIM * (1 - CATCH * bevel * facing);
      rgb = [0, 1, 2].map((k) => data[p + k] * shade);
    } else {
      const light = 255 * (SHEEN * fall + CATCH * bevel * facing);
      rgb = [0, 1, 2].map((k) => screen(data[p + k], Math.min(255, light * LIGHT[k])));
    }
    if (mode === "focus") {
      // where the line runs: by the silhouette, or by the rounded rectangle
      const dr = RADIUS ? R0 + roundDepth(x, y) : d;
      const band = (a, b) => smooth(a - 1.5, a, dr) * (1 - smooth(b, b + 1.5, dr));
      const h = Math.min(1, HALOS.reduce((a, [h0, h1]) => a + band(h0, h1), 0)) * 0.85;
      rgb = rgb.map((c, k) => c * (1 - h) + HALO[k] * h);
      const w = band(R0, R1);
      let ink = RING;
      if (CROWN) {
        const grain = 1 + 0.35 * ((data[p] + data[p + 1] + data[p + 2]) / MEAN_LUM - 1);
        const crown = 1 + CROWN * (Math.sin(Math.PI * Math.min(1, Math.max(0, (dr - R0) / (R1 - R0)))) - 0.5);
        ink = RING.map((c) => Math.min(255, c * grain * crown));
      }
      if (GROOVE) {
        // the board's grain, a little exaggerated, carried into the channel
        const grain = 1 + 1.6 * ((data[p] + data[p + 1] + data[p + 2]) / MEAN_LUM - 1);
        // across the channel: -1 at its outer wall, +1 at its inner wall
        const across = Math.min(1, Math.max(-1, ((dr - R0) / (R1 - R0)) * 2 - 1));
        const wall = Math.sign(across) * smooth(0.35, 0.95, Math.abs(across));
        // facing is 0 on the edges turned from the light (bottom, right), about
        // 0.7 on the top and left: centred, it says which wall is lit. The
        // channel as a whole sits a little below the board, so a little darker.
        const lit = 1 + GROOVE * wall * (2 * facing - 1) - GROOVE * 0.12;
        // grain and wall shade together; what darkens falls toward the tint
        const f = grain * lit;
        ink = RING.map((c, k) => Math.min(255, f < 1 ? c * f + GROOVE_TINT[k] * (1 - f) : c * f));
      }
      rgb = rgb.map((c, k) => c * (1 - w) + ink[k] * w);
    }
    for (let k = 0; k < 3; k++) outBuf[p + k] = Math.round(rgb[k]);
  }

await sharp(outBuf, { raw: { width: W, height: H, channels: 4 } }).webp(webpOptions(92)).toFile(out);
console.log(out, W, H, mode);
