// Bake the cast shadow of a cut-paper asset into its bitmap.
//   node scripts/paper-shadow.mjs <in.webp> <out.webp> --pad=48 [--ambient=dx:dy:blur:opacity] [--contact=dx:dy:blur:opacity] [--tint=2a2418] [--mount=width:hex]
//
// Paper on paper casts two shadows under a soft key light from the upper
// left: a tight, dark contact shadow where the sheet nearly touches the layer
// below, and a wide, faint ambient one that grows as the sheet stands off.
// Both are the asset's own silhouette, offset down-right and blurred, so a
// state that lifts the sheet changes only the shadow, never the paper: every
// state of an asset is the same paper on the same canvas (registration holds
// for scripts/check-kit.mjs). The canvas grows by --pad on every side; CSS
// gives that margin back with border-image-outset.
//
// --mount=width:hex lays the paper on an under-sheet of that colour, torn to
// follow the paper's own deckle about `width` px outside it, with a tear of
// its own (it wanders a few px either way), in the paper's grain; its torn
// fibres catch the upper-left light along the top and left and fall into
// shade along the bottom and right. The under-sheet, not the paper, casts the
// shadow. Used for a focused sheet: focus is a physical layer, not a line
// drawn on the paper.
import sharp from "sharp";

const args = process.argv.slice(2);
const [src, out] = args.filter((a) => !a.startsWith("--"));
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((f) => f.slice(2).split("=")));
if (!src || !out) {
  console.error("usage: paper-shadow.mjs <in> <out.webp> --pad=N [--ambient=dx:dy:blur:op] [--contact=dx:dy:blur:op] [--tint=hex]");
  process.exit(1);
}

const PAD = +(opt.pad ?? 48);
const layer = (s) => (s ? s.split(":").map(Number) : null);
const AMBIENT = layer(opt.ambient ?? "8:14:18:0.30");
const CONTACT = layer(opt.contact ?? "1:2:2.5:0.35");
const TINT = (opt.tint ?? "2a2418").match(/../g).map((c) => parseInt(c, 16));

const base = sharp(src).ensureAlpha();
const { width: W, height: H } = await base.metadata();
const CW = W + 2 * PAD;
const CH = H + 2 * PAD;
const [MW, MOUNT] = opt.mount ? [+opt.mount.split(":")[0], opt.mount.split(":")[1].match(/../g).map((c) => parseInt(c, 16))] : [0, null];
if (MW > PAD) throw new Error(`mount ${MW}px does not fit the ${PAD}px pad`);

// the silhouette on the padded canvas: the paper, or the card it is mounted on
const silhouette = Buffer.alloc(CW * CH);
const paperAlpha = await base.clone().extractChannel(3).raw().toBuffer();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) silhouette[(y + PAD) * CW + x + PAD] = paperAlpha[y * W + x];

// The under-sheet's coverage: px of distance from the paper, against its
// reach (`width`, plus a slow wander and a fine fibre tear, seeded so a
// rebuild draws the same tear).
let mountAlpha = null;
let reachLeft = null; // how far inside the under-sheet's own edge each pixel is
if (MOUNT) {
  const N = CW * CH;
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = silhouette[i] > 127 ? 0 : 1e9;
  const at = (x, y) => (x < 0 || y < 0 || x >= CW || y >= CH ? 1e9 : dist[y * CW + x]);
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      const i = y * CW + x;
      if (dist[i]) dist[i] = Math.min(dist[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    }
  for (let y = CH - 1; y >= 0; y--)
    for (let x = CW - 1; x >= 0; x--) {
      const i = y * CW + x;
      if (dist[i]) dist[i] = Math.min(dist[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    }
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  /** value noise: a grid of random heights every `step` px, smoothly interpolated */
  const noise = (step) => {
    const gw = Math.ceil(CW / step) + 2;
    const gh = Math.ceil(CH / step) + 2;
    const g = Float32Array.from({ length: gw * gh }, rand);
    const sm = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const [fx, fy] = [x / step, y / step];
      const [ix, iy] = [Math.floor(fx), Math.floor(fy)];
      const [tx, ty] = [sm(fx - ix), sm(fy - iy)];
      const v = (a, b) => g[(iy + b) * gw + ix + a];
      return (v(0, 0) * (1 - tx) + v(1, 0) * tx) * (1 - ty) + (v(0, 1) * (1 - tx) + v(1, 1) * tx) * ty;
    };
  };
  const [slow, fine] = [noise(46), noise(5)];
  mountAlpha = new Uint8Array(N);
  reachLeft = new Float32Array(N);
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      const i = y * CW + x;
      const reach = MW + 0.35 * MW * slow(x, y) + 1.6 * fine(x, y);
      const left = reach - dist[i] / 3;
      reachLeft[i] = left;
      mountAlpha[i] = Math.round(255 * Math.min(1, Math.max(0, left / 1.2)));
      silhouette[i] = Math.max(silhouette[i], mountAlpha[i]);
    }
}

/** one shadow layer: the silhouette's alpha, offset, blurred, scaled */
const shadow = async ([fx, fy, blur, opacity]) => {
  const [dx, dy] = [Math.round(fx), Math.round(fy)];
  const a = await sharp(silhouette, { raw: { width: CW, height: CH, channels: 1 } })
    .extract({ left: Math.max(0, -dx), top: Math.max(0, -dy), width: CW - Math.abs(dx), height: CH - Math.abs(dy) })
    .extend({ top: Math.max(0, dy), bottom: Math.max(0, -dy), left: Math.max(0, dx), right: Math.max(0, -dx), background: "#000" })
    .blur(Math.max(0.3, blur))
    .toColourspace("b-w") // extend/blur promote one channel to sRGB
    .extractChannel(0)
    .raw()
    .toBuffer();
  const px = Buffer.alloc(CW * CH * 4);
  for (let i = 0; i < CW * CH; i++) {
    px[i * 4] = TINT[0];
    px[i * 4 + 1] = TINT[1];
    px[i * 4 + 2] = TINT[2];
    px[i * 4 + 3] = Math.round(a[i] * opacity);
  }
  return sharp(px, { raw: { width: CW, height: CH, channels: 4 } }).png().toBuffer();
};

/** the card: the paper's grain (mirrored past its edge) in the mount colour */
const mount = async () => {
  // the grain comes from the paper's interior, clear of its torn fringe
  const IN = 100;
  const grain = await sharp(await base.clone().removeAlpha().extract({ left: IN, top: IN, width: W - 2 * IN, height: H - 2 * IN }).png().toBuffer())
    .extend({ top: PAD + IN, bottom: PAD + IN, left: PAD + IN, right: PAD + IN, extendWith: "mirror" })
    .greyscale()
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 0; i < grain.length; i++) sum += grain[i];
  const mean = sum / grain.length;
  const px = Buffer.alloc(CW * CH * 4);
  const R = (x, y) => reachLeft[Math.min(CH - 1, Math.max(0, y)) * CW + Math.min(CW - 1, Math.max(0, x))];
  for (let y = 1; y < CH - 1; y++)
    for (let x = 1; x < CW - 1; x++) {
      const i = y * CW + x;
      if (!mountAlpha[i]) continue;
      const g = 1 + 0.35 * (grain[i] / mean - 1);
      // the torn rim (its outer 3px): the paler core shows in the fibres,
      // lit where the edge faces the upper-left light, shaded where it faces away
      let edge = 1;
      if (reachLeft[i] < 3) {
        const [gx, gy] = [R(x + 2, y) - R(x - 2, y), R(x, y + 2) - R(x, y - 2)]; // points inward
        const gl = Math.hypot(gx, gy) || 1;
        const facing = (gx + gy) / gl / Math.SQRT2; // 1: faces the light
        const rim = 1 - reachLeft[i] / 3;
        edge = 1 + rim * (facing > 0 ? 0.32 * facing : 0.38 * facing);
      }
      for (let k = 0; k < 3; k++) px[i * 4 + k] = Math.min(255, Math.round(MOUNT[k] * g * edge));
      px[i * 4 + 3] = mountAlpha[i];
    }
  return sharp(px, { raw: { width: CW, height: CH, channels: 4 } }).png().toBuffer();
};

const layers = [];
if (AMBIENT && AMBIENT[3] > 0) layers.push({ input: await shadow(AMBIENT) });
if (CONTACT && CONTACT[3] > 0) layers.push({ input: await shadow(CONTACT) });
if (MOUNT) layers.push({ input: await mount() });
layers.push({ input: await base.png().toBuffer(), left: PAD, top: PAD });

const meta = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(layers)
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(out);
console.log(`${out} ${meta.width}x${meta.height} (pad ${PAD})`);
