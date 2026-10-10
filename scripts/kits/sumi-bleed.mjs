// The Sumi-e Ink plates painted on past the mock's edges (kit.css: a plate's
// sky is registered to the home page's stage, and its bleed fills the frame
// round the stage at any aspect), made in two steps round each generation:
//   node scripts/kits/sumi-bleed.mjs ref day       writes bleed-day/ref.png
//   (generate: art/prompts/sumi/bleed-day.txt on it -> bleed-day/bleed-day.png)
//   node scripts/kits/sumi-bleed.mjs compose day   writes plate-day-bleed
//   node scripts/kits/sumi-bleed.mjs ref night     the composed day, as its ref
//   (generate: art/prompts/sumi/bleed-night.txt -> bleed-night/bleed-night.png)
//   node scripts/kits/sumi-bleed.mjs compose night writes plate-night-bleed
//   then: node scripts/build-kit.mjs sumi
//
// The canvas is the mock's 1672x941 (the core) grown by BLEED px on each side
// and below (sumi.css --sky-bleed-x, --sky-bleed-bottom), padded at its foot
// to the generator's 16:9 and cropped back after.
//
// `ref`: by day, the calm plate (plate-day-calm) at the canvas's top middle,
// the margins a flat grey to be painted; by night, the composed day canvas
// (the night is an edit of the day, so the two finishes' margins register).
//
// `compose`: the generation scaled to the canvas, its tone fitted to the core
// (a per-channel gain and offset that brings its painted core to the plate's),
// then its light matched to the plate's along the core's edge, and the plate
// itself laid back over the core, feathered over FEATHER px along its left,
// right and bottom edges, so the core is the plate's own pixels and the bleed
// meets it without a seam. The light is matched the way seamless cloning
// does it: the difference between the plate and the fitted generation over
// the core, smoothed to its low frequencies (CELL px cells, blurred over
// SMOOTH cells), is fixed on the core and carried out over the bleed as a
// membrane (Laplace's equation, solved by relaxation, its outer edges free),
// so the bleed takes on the plate's local light where it meets it (the
// night's paper darkens to the left) and keeps its own brushwork.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const RAW = "art/raw/sumi";
const [CW, CH] = [1672, 941];
const BLEED = 320;
const [W, H] = [CW + 2 * BLEED, CH + BLEED];
// the generator's 16:9, padded at the foot
const PH = Math.round((W * 9) / 16);
const FEATHER = 24;
const CELL = 8;
const SMOOTH = 4;
const CORE = { day: "plate-day-calm", night: "plate-night-calm" };

const [mode, finish] = process.argv.slice(2);
if (!["ref", "compose"].includes(mode) || !CORE[finish]) {
  console.error("usage: sumi-bleed.mjs ref|compose day|night");
  process.exit(1);
}
const gen = `bleed-${finish}`;
const out = `plate-${finish}-bleed`;
const rgb = async (src) => sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });

if (mode === "ref") {
  mkdirSync(`${RAW}/${gen}`, { recursive: true });
  const ref =
    finish === "day"
      ? sharp({ create: { width: W, height: PH, channels: 3, background: "#9a9a9a" } }).composite([
          { input: `${RAW}/${CORE.day}/${CORE.day}.png`, left: BLEED, top: 0 },
        ])
      : // the composed day, its foot carried down to the padded canvas
        sharp(`${RAW}/plate-day-bleed/plate-day-bleed.png`).extend({ bottom: PH - H, extendWith: "copy" });
  await ref.png().toFile(`${RAW}/${gen}/ref.png`);
  console.log(`${gen}/ref.png: ${W}x${PH}, the core at ${BLEED},0`);
} else {
  const g = await rgb(await sharp(`${RAW}/${gen}/${gen}.png`).resize(W, PH, { fit: "fill", kernel: "lanczos3" }).png().toBuffer());
  const core = await rgb(`${RAW}/${CORE[finish]}/${CORE[finish]}.png`);
  // the generation's tone fitted to the plate's over the core (least squares,
  // per channel), so its margins carry on in the plate's own tone
  const fit = [0, 1, 2].map((c) => {
    let [n, sx, sy, sxx, sxy] = [0, 0, 0, 0, 0];
    for (let y = 0; y < CH; y += 2)
      for (let x = 0; x < CW; x += 2) {
        const a = g.data[(y * W + x + BLEED) * 3 + c];
        const b = core.data[(y * CW + x) * 3 + c];
        n++;
        sx += a;
        sy += b;
        sxx += a * a;
        sxy += a * b;
      }
    const k = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return [k, (sy - k * sx) / n];
  });
  // the light's difference over the core, in cells (area means), smoothed
  // within the core (a normalised box blur) and relaxed out over the bleed
  const [GW, GH] = [Math.ceil(W / CELL), Math.ceil(H / CELL)];
  const [c0, c1, r1] = [BLEED / CELL, (BLEED + CW) / CELL, CH / CELL].map(Math.floor);
  const inCore = (i, j) => i >= c0 && i < c1 && j < r1;
  const field = [0, 1, 2].map((c) => {
    const [k, b] = fit[c];
    const d = new Float32Array(GW * GH);
    for (let j = 0; j < r1; j++)
      for (let i = c0; i < c1; i++) {
        let sum = 0;
        for (let y = j * CELL; y < (j + 1) * CELL; y++)
          for (let x = i * CELL; x < (i + 1) * CELL; x++) sum += core.data[(y * CW + x - BLEED) * 3 + c] - (g.data[(y * W + x) * 3 + c] * k + b);
        d[j * GW + i] = sum / (CELL * CELL);
      }
    const m = new Float32Array(GW * GH);
    for (let j = 0; j < r1; j++)
      for (let i = c0; i < c1; i++) {
        let [sum, n] = [0, 0];
        for (let v = Math.max(0, j - SMOOTH); v <= Math.min(r1 - 1, j + SMOOTH); v++)
          for (let u = Math.max(c0, i - SMOOTH); u <= Math.min(c1 - 1, i + SMOOTH); u++) {
            sum += d[v * GW + u];
            n++;
          }
        m[j * GW + i] = sum / n;
      }
    // relaxation (Gauss-Seidel) over the bleed's cells, the core's fixed,
    // started from the nearest core cell's value
    for (let j = 0; j < GH; j++)
      for (let i = 0; i < GW; i++)
        if (!inCore(i, j)) m[j * GW + i] = m[Math.min(r1 - 1, j) * GW + Math.min(c1 - 1, Math.max(c0, i))];
    for (let it = 0; it < 3000; it++)
      for (let j = 0; j < GH; j++)
        for (let i = 0; i < GW; i++) {
          if (inCore(i, j)) continue;
          let [sum, n] = [0, 0];
          for (const [u, v] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
            if (u < 0 || v < 0 || u >= GW || v >= GH) continue;
            sum += m[v * GW + u];
            n++;
          }
          m[j * GW + i] = sum / n;
        }
    return m;
  });
  // the membrane at a pixel, bilinear between cell centres
  const light = (x, y, c) => {
    const m = field[c];
    const fx = Math.min(GW - 1, Math.max(0, (x + 0.5) / CELL - 0.5));
    const fy = Math.min(GH - 1, Math.max(0, (y + 0.5) / CELL - 0.5));
    const [i, j] = [Math.floor(fx), Math.floor(fy)];
    const [i1, j1] = [Math.min(GW - 1, i + 1), Math.min(GH - 1, j + 1)];
    const [a, e] = [fx - i, fy - j];
    return (m[j * GW + i] * (1 - a) + m[j * GW + i1] * a) * (1 - e) + (m[j1 * GW + i] * (1 - a) + m[j1 * GW + i1] * a) * e;
  };
  const res = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 3;
      // how far inside the core: 1 past the feather, 0 at its edge and out
      const cx = x - BLEED;
      const d = cx < 0 || cx >= CW || y >= CH ? 0 : Math.min(cx + 1, CW - cx, CH - y) / FEATHER;
      const t = Math.min(1, d);
      for (let c = 0; c < 3; c++) {
        const [k, b] = fit[c];
        const v = g.data[p + c] * k + b + (t < 1 ? light(x, y, c) : 0);
        const o = t > 0 ? core.data[(y * CW + cx) * 3 + c] : 0;
        res[p + c] = Math.round(Math.min(255, Math.max(0, v * (1 - t) + o * t)));
      }
    }
  mkdirSync(`${RAW}/${out}`, { recursive: true });
  await sharp(res, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${RAW}/${out}/${out}.png`);
  console.log(`${out}: ${W}x${H}; tone fit ${fit.map(([k, b]) => `${k.toFixed(3)}x${b >= 0 ? "+" : ""}${b.toFixed(1)}`).join(" ")}`);
}
