// Rebuild the rack's back panel as a seamless tile from the authored panel
// bitmap. The generator lights the sheet unevenly and drifts the perforation
// grid, so neither tiles. This keeps the authored material (sheet colour,
// grain, the punched hole and its lip) and re-lays it on an exact staggered
// grid under flat light.
//   node scripts/build-backpanel.mjs <authored.png> <out.webp> [--sheet=hex] [--gain=0.4]
// --sheet recolours the sheet (the holes stay dark), for the paper rice.
import sharp from "sharp";

const [, , src, out, ...flags] = process.argv;
if (!src || !out) {
  console.error("usage: build-backpanel.mjs <authored.png> <out.webp> [--sheet=hex] [--gain=0.4]");
  process.exit(1);
}
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
// The source grain is per-pixel at 2048px; at this scale it reads as speckle
// unless it is turned down.
const GAIN = +(opt.gain ?? 0.4);

// Output geometry, in 2x pixels (the CSS draws it at half size).
const PITCH = 14; // hole centres across a row
const ROW = 12; // row spacing: 14 * sin(60°) ≈ 12.1, a 60-degree stagger
const HOLE = 7; // hole diameter
const COLS = 16, ROW_PAIRS = 8;
const TW = PITCH * COLS, TH = ROW * 2 * ROW_PAIRS;

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;
const lum = Float32Array.from({ length: N }, (_, i) => 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]);

// Flatten the light: divide by a heavy blur of the luminance.
const illum = await sharp(Buffer.from(lum.map((v) => Math.round(v))), { raw: { width: W, height: H, channels: 1 } })
  .blur(W / 24)
  .raw()
  .toBuffer();
const mean = illum.reduce((a, b) => a + b, 0) / N;
const flat = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++)
  for (let k = 0; k < 3; k++) flat[i * 3 + k] = Math.min(255, Math.round((data[i * 3 + k] * mean) / Math.max(1, illum[i])));
const flum = (i) => 0.2126 * flat[i * 3] + 0.7152 * flat[i * 3 + 1] + 0.0722 * flat[i * 3 + 2];

// Holes are the dark connected components.
const sorted = Array.from({ length: N }, (_, i) => flum(i)).sort((a, b) => a - b);
const median = sorted[N >> 1];
const dark = Uint8Array.from({ length: N }, (_, i) => (flum(i) < median * 0.45 ? 1 : 0));
const label = new Int32Array(N).fill(-1);
const comps = [];
for (let s = 0; s < N; s++) {
  if (!dark[s] || label[s] >= 0) continue;
  const stack = [s];
  label[s] = comps.length;
  let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    area++;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    for (const j of [i - 1, i + 1, i - W, i + W])
      if (j >= 0 && j < N && dark[j] && label[j] < 0 && Math.abs((j % W) - x) <= 1) {
        label[j] = comps.length;
        stack.push(j);
      }
  }
  comps.push({ x0, y0, x1, y1, area });
}
const areas = comps.map((c) => c.area).filter((a) => a > 20).sort((a, b) => a - b);
const typical = areas[areas.length >> 1];
// A round hole of typical size near the centre (clean, undistorted by the edges).
const hole = comps
  .filter((c) => c.area > typical * 0.8 && c.area < typical * 1.2)
  .map((c) => {
    const w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1;
    const round = Math.abs(w - h) / Math.max(w, h) + Math.abs(c.area / (w * h) - Math.PI / 4);
    const centre = Math.hypot((c.x0 + c.x1) / 2 - W / 2, (c.y0 + c.y1) / 2 - H / 2) / W;
    return { ...c, w, h, score: round + centre };
  })
  .sort((a, b) => a.score - b.score)[0];
if (!hole) throw new Error("no clean hole found in the source");

// The sheet: colour from the median of non-hole pixels; grain from their
// residuals, borrowed row by row like the rail (fine grain hides the wrap).
const near = new Uint8Array(N); // the hole plus its lip
for (let i = 0; i < N; i++) if (dark[i]) for (let dy = -14; dy <= 14; dy += 2) for (let dx = -14; dx <= 14; dx += 2) {
  const j = i + dy * W + dx;
  if (j >= 0 && j < N) near[j] = 1;
}
const sheetPx = [];
for (let i = 0; i < N; i += 7) if (!near[i]) sheetPx.push(i);
const med = (k) => sheetPx.map((i) => flat[i * 3 + k]).sort((a, b) => a - b)[sheetPx.length >> 1];
const sheet = [0, 1, 2].map(med);
const target = opt.sheet ? opt.sheet.match(/../g).map((h) => parseInt(h, 16)) : sheet;

const outBuf = Buffer.alloc(TW * TH * 3);
let cursor = 0;
for (let i = 0; i < TW * TH; i++) {
  // next sheet pixel, wrapping through the source
  const s = sheetPx[(cursor = (cursor + 9973) % sheetPx.length)];
  for (let k = 0; k < 3; k++) {
    const grain = (flat[s * 3 + k] - sheet[k]) * GAIN;
    outBuf[i * 3 + k] = Math.max(0, Math.min(255, Math.round(target[k] + grain)));
  }
}

// The hole patch with its lip, scaled to HOLE and feathered into the sheet.
const dia = (hole.w + hole.h) / 2;
const M = Math.round(dia * 0.35);
const scale = HOLE / dia;
const pw = Math.round((hole.w + 2 * M) * scale), ph = Math.round((hole.h + 2 * M) * scale);
const patch = await sharp(flat, { raw: { width: W, height: H, channels: 3 } })
  .extract({ left: hole.x0 - M, top: hole.y0 - M, width: hole.w + 2 * M, height: hole.h + 2 * M })
  .resize(pw, ph, { kernel: "lanczos3" })
  .raw()
  .toBuffer();
// the patch's sheet, recoloured with the rest (the void and lip shading stay)
const ratio = target.map((t, k) => t / Math.max(1, sheet[k]));
const r = Math.min(pw, ph) / 2;
for (let row = 0; row < ROW_PAIRS * 2; row++)
  for (let col = 0; col < COLS; col++) {
    const cx = col * PITCH + (row % 2 ? PITCH / 2 : 0) + PITCH / 4;
    const cy = row * ROW + ROW / 2;
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const d = Math.hypot(x + 0.5 - pw / 2, y + 0.5 - ph / 2);
        const w = Math.min(1, Math.max(0, (r - d) / (r * 0.3)));
        if (!w) continue;
        const ox = (((Math.round(cx - pw / 2) + x) % TW) + TW) % TW;
        const oy = (((Math.round(cy - ph / 2) + y) % TH) + TH) % TH;
        const o = (oy * TW + ox) * 3, p = (y * pw + x) * 3;
        for (let k = 0; k < 3; k++) {
          // lighter than the sheet = lip catch, kept as is; the sheet tone is recoloured
          const v = Math.min(255, patch[p + k] * ratio[k]);
          outBuf[o + k] = Math.round(outBuf[o + k] * (1 - w) + v * w);
        }
      }
  }

await sharp(outBuf, { raw: { width: TW, height: TH, channels: 3 } }).webp({ quality: 90 }).toFile(out);
console.log(out, TW, TH, `hole ${hole.w}x${hole.h} at ${hole.x0},${hole.y0}`, `sheet ${sheet}`);
