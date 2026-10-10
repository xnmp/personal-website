// Cyanotype (art/briefs/cyanotype.md): the whole page is one cyanotype print,
// Prussian blue inside a torn white paper edge, its photograms and notes at
// its margins (art/originals/cyanotype.webp), with cards of off-white cotton
// paper taped onto it. Raws in art/raw/cyanotype; prompts in
// art/prompts/cyanotype.
//
// Only the day finish is generated. Night is the same print after dark under
// a desk lamp: every asset graded from the day's (`gain`, LAMP; the print's
// own grade below), so the two finishes register by construction.
import sharp from "sharp";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { BEZEL, bezel, grain } from "./cyanotype-screen.mjs";
import { CLEANS, cleanPatch, restoreOriginal } from "./cyanotype-clean.mjs";
import { paintKeyboard } from "./cyanotype-keyboard.mjs";
import { tapeSprite } from "./cyanotype-tape.mjs";
import { PRINT_EDGE, edgeMask } from "./cyanotype-edge.mjs";
import { ORNAMENTS, ornamentSvg } from "./cyanotype-ornaments.mjs";
import { groundOf } from "./cyanotype-ground.mjs";
import { TYPE, typeTiles } from "./cyanotype-type.mjs";

const RAW = "art/raw/cyanotype";
// a plate built from a rule in this file is rebuilt when the rule changes
const RECIPE = new URL(import.meta.url).pathname;
const raw = (name) => `${RAW}/${name}/${name}.png`;

// lamplight: the paper warms to a lamplit cream (it stays the brightest
// thing in the room) and the blues deepen
const LAMP = [0.97, 0.91, 0.79];
// the print's paper by night: it lies in the photogram's shadow behind the
// lamp-lit cards, cool, in the print's own blues (a warm grade of it, over
// the blue, read as olive). A deep blue-grey (about 85, 103, 118 for the
// day's cream): with the blue gained any higher over the red it read as lilac
// (107, 123, 152), a periwinkle that belongs to no print.
const PRINT_NIGHT = [0.36, 0.44, 0.5];
// ... and its tooth. Graded down the paper's own grain falls to half its
// strength (the day's is ~3.7 levels, 1.9 left), and the margin reads as a flat
// slab: so the night paper is given back the tooth the day's has (fine
// fibre, and the broad mottle between), in levels, one drawing for all three
// channels
const NIGHT_GRAIN = { fine: 3.6, mottle: 5.2 };

/* ---------- raws this recipe derives from others ----------
   Each is rebuilt when its source is newer, so a regeneration carries
   through. Written as raws, they are finished by the build's own steps
   (fills, inks, cuts). */
const stale = (out, src) => !existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs;
// white noise, seeded (mulberry32: an LCG's low bits repeat within a row)
const noiseOf = (length, seed) => {
  let t = seed >>> 0;
  const b = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    b[i] = ((r ^ (r >>> 14)) >>> 0) & 255;
  }
  return b;
};
const smoothstep = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const write = async (name, buf, info) => {
  mkdirSync(`${RAW}/${name}`, { recursive: true });
  await sharp(buf, { raw: info }).png().toFile(raw(name));
};

// The torn white edge of the print, round the whole page (cyanotype.css
// body::before), lifted off the empty print (print-empty: the original's
// sheet with everything inside its edge taken out): its paper opaque, its
// blue clear, the dry brushed boundary between them as far as it is paper.
// Only the band the page's 9-slice keeps at each side (FRAME, the print's px)
// is lifted, fading out before the slice line: the blue's own pale mottle
// further in is the scene's. Each pixel's colour is what, laid over the blue
// at its alpha, gives the print back.
export const FRAME = { t: 40, r: 60, b: 100, l: 60 };
// The edge's paper, in the day finish, as the original's is: the generated
// empty print (print-empty) is paler and warmer than the original's own edge.
// Measured on the paper at the page's four edges (the median of its bright
// pixels, at 1672 x 941), the original against the page: left 220,217,212 /
// 232,227,221; right 215,211,206 / 230,226,220; top 207,206,205 / 227,224,222;
// bottom 212,212,210 / 230,228,224. The gain brings the page's to the original's
// mean (the night finish is graded from the paper as it was, below).
const PAPER_DAY = [0.925, 0.935, 0.945];
const frame = async () => {
  const src = raw("print-empty");
  if (!existsSync(src) || !(stale(raw("frame-day"), src) || stale(raw("frame-day"), RECIPE))) return;
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const blue = [3, 52, 98]; // the empty print's mean, inside its edge
  const out = { day: Buffer.alloc(W * H * 4), night: Buffer.alloc(W * H * 4) };
  const [fine, mottle] = await Promise.all([lowField(W, H, 1, 83), lowField(W, H, 7, 89)]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 3;
      const o = (y * W + x) * 4;
      // how far into each side's band, 1 at the edge, 0 past its slice
      const band = Math.max(
        1 - smoothstep(FRAME.t - 14, FRAME.t, y),
        1 - smoothstep(FRAME.b - 14, FRAME.b, H - 1 - y),
        1 - smoothstep(FRAME.l - 14, FRAME.l, x),
        1 - smoothstep(FRAME.r - 14, FRAME.r, W - 1 - x),
      );
      const l = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      const a = smoothstep(140, 195, l) * band;
      if (a < 0.01) continue;
      const tooth = a * (NIGHT_GRAIN.fine * fine[y * W + x] + NIGHT_GRAIN.mottle * mottle[y * W + x]);
      for (let k = 0; k < 3; k++) {
        const c = Math.min(255, Math.max(0, (data[p + k] - (1 - a) * blue[k]) / a));
        out.day[o + k] = Math.round(c * PAPER_DAY[k]);
        out.night[o + k] = Math.round(Math.min(255, Math.max(0, c * PRINT_NIGHT[k] + tooth)));
      }
      out.day[o + 3] = out.night[o + 3] = Math.round(a * 255);
    }
  const geo = { width: W, height: H, channels: 4 };
  await write("frame-day", out.day, geo);
  await write("frame-night", out.night, geo);
};

// The handwritten notes the original sets against the page (chalk-white on
// the blue), cut from it and keyed off the blue, as ink on white for the
// build's inks step: the page lays each as a mask (cyanotype.css), in the
// finish's chalk. A stroke is thin and bright on a dark ground; where the
// ground round a pixel is itself bright (the torn paper edge a note runs
// into), it is paper, not chalk, and stays clear. Boxes are the original's
// px; `round` keeps only what lies in a circle (the stamp at the foot,
// which a gear overlaps).
const NOTES = {
  "note-doing": { box: [478, 392, 176, 104] }, // "Less clicking. More doing."
  "note-toys": { box: [1072, 560, 398, 42] }, // "Different toys for a more interesting world.."
  "note-repeat": { box: [28, 812, 96, 94] }, // "Build. Play. Repeat."
  "note-medium": { box: [1556, 826, 112, 106], round: [1611, 880, 52] }, // "SAME CURIOSITY DIFFERENT MEDIUM"
  // the chalk rule under the flagship's name, heavier at its start and worn
  // to a broken line at its end (cyanotype.css .launchpad-title::after)
  // (its tail's dots are the stroke's last dry touches: lifted, as the
  // original's read bright, where a keyed 1px dot would fade)
  "rule-title": { box: [242, 245, 445, 16], gamma: 0.5 },
};
const notes = async () => {
  const src = "art/raw/originals/cyanotype.png";
  for (const [name, { box: [left, top, width, height], round, gamma = 1 }] of Object.entries(NOTES)) {
    if (!existsSync(src) || !stale(raw(name), src)) continue;
    const crop = sharp(src).extract({ left, top, width, height }).removeAlpha().greyscale();
    const [{ data }, { data: ground }] = await Promise.all([crop.clone().raw().toBuffer({ resolveWithObject: true }), crop.clone().blur(5).raw().toBuffer({ resolveWithObject: true })]);
    const out = Buffer.alloc(width * height * 3, 255);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        let a = smoothstep(72, 165, data[i]) * (1 - smoothstep(105, 140, ground[i]));
        if (round) a *= 1 - smoothstep(round[2] - 3, round[2], Math.hypot(left + x - round[0], top + y - round[1]));
        if (a < 0.06) continue;
        out[i * 3] = out[i * 3 + 1] = out[i * 3 + 2] = Math.round(255 * (1 - a ** gamma));
      }
    await write(name, out, { width, height, channels: 3 });
  }
};

// The cards' paper as a seamless tile the page lays inside their deckle: the
// generated sheet's clean middle
const paperTile = async () => {
  const src = raw("card-paper");
  if (!existsSync(src) || !stale(raw("paper-tile"), src)) return;
  const { data, info } = await sharp(src).extract({ left: 200, top: 160, width: 1000, height: 800 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await write("paper-tile", data, info);
};

// The print's core (the scene's one layer, before its bleed: below): the
// plate with the site painted out and its edge taken off (plate-bleed,
// art/prompts/cyanotype/layer-sky-day.txt), given back the original's own
// ground. The generation came back a deeper, flatter navy, its brushwork
// redrawn as crumple: so the original's tone is laid into it at every scale
// above its tooth (the plate's own grain kept, scaled to the original's),
// measured on the blue ground alone (no paper, prop, type or the site's
// dark window), where the original shows ground at that scale and from
// further out where it shows the site. Then the two things the
// painting-out lost, both the original's own pixels: the brushed seam of
// bare paper ruled across above the projects (SEAM, its brightness keyed
// off the blue), and the clean band under it where "Projects" stands, which
// the plate had grown a fern into (BAND, cloned from the plate's own clean
// blue further along the same rows).
const ORIGINAL = "art/raw/originals/cyanotype.png";
const SEAM = { box: [112, 524, 1424, 36], line: 541, fernTo: 340 };
const SHADOW = 28;
const BAND = { box: [112, 551, 470, 66], from: 600 };
// The keyboards (art/briefs/cyanotype.md, "the keyboards"). The generated
// plates carry a keyboard the image model drew wrong, so each is painted out
// (cyanotype-clean.mjs: the model's keyboard-free edit, used inside the old
// board's footprint only, art/prompts/cyanotype/keyboard-*.txt) and a proper
// ANSI board is drawn in its place by cyanotype-keyboard.mjs, onto the
// composed print before it is put on the ramp (so night, a grade of the day
// print, carries it too). The raws below are the plates the prints are built
// from.
const CLEAN_RECIPE = new URL("./cyanotype-clean.mjs", import.meta.url).pathname;
const KEYBOARD_RECIPE = new URL("./cyanotype-keyboard.mjs", import.meta.url).pathname;
const cleans = async () => {
  for (const { name, original, edited, region, ...params } of CLEANS) {
    const [out, src, edit] = [raw(name), raw(original), raw(edited)];
    if (!existsSync(src) || !existsSync(edit) || !(stale(out, src) || stale(out, edit) || stale(out, CLEAN_RECIPE))) continue;
    const { data, info, area } = await cleanPatch({ original: src, edited: edit, region, ...params });
    console.log(`${name}: patched from the edit (${area} px)`);
    await write(name, data, info);
  }
};

// The prints this recipe builds, each the original's picture with the site
// painted out. `original`: the mock (its px are the plate's); `plate`: the
// generation with the site and the torn edge taken off; `core`: that with the
// mock's own ground laid back in (sky); `gen`: the margins painted on
// (bleed); `out`: the core and its margins (the scene's sky layer); `site`:
// what the mock shows of the site, boxes [x, y, w, h] with the shadows they
// cast, which is not its ground. The home print alone has the brushed seam and
// its band, and the photo print that runs off its core.
const PRINTS = {
  home: {
    original: ORIGINAL,
    plate: "plate-bleed-clean",
    core: "sky-core",
    gen: "bleed-day-clean",
    board: "home",
    out: "layer-sky-day",
    night: "layer-sky-night",
    site: [[718, 120, 759, 400], [130, 600, 1398, 285]],
    seam: SEAM,
    band: BAND,
    photo: true,
    restore: true,
  },
  // the project page (art/originals/cyanotype-project.webp): the headline
  // and its copy at the left, the mounted figure at the right of centre, the
  // cream panel at the foot
  project: {
    original: "art/originals/cyanotype-project.webp",
    plate: "plate-bleed-project-full",
    core: "sky-core-project",
    gen: "bleed-project-plain",
    board: "project",
    out: "layer-sky-project-day",
    night: "layer-sky-project-night",
    site: [[105, 70, 340, 60], [110, 140, 720, 380], [865, 45, 535, 650], [495, 780, 1105, 161]],
  },
  // the Tauri Explorer page (cyanotype-launch.webp): the promise at the left,
  // the mounted window at the right, the cream band at the foot (not under
  // the keycap drawing at its right)
  launch: {
    original: "art/originals/cyanotype-launch.webp",
    plate: "plate-bleed-launch-clean",
    core: "sky-core-launch",
    gen: "bleed-launch",
    board: "launch",
    // its keyboard stands in the ground too (bleed): the facts' knock-out
    // patch reaches over the board's top corner, and would wipe it
    groundBoard: true,
    out: "layer-sky-launch-day",
    night: "layer-sky-launch-night",
    site: [[75, 55, 600, 450], [675, 40, 840, 610], [0, 670, 1420, 271]],
  },
  // the phone home (cyanotype-phone.webp, 899 x 1750): no bleed
  phone: {
    original: "art/originals/cyanotype-phone.webp",
    plate: "plate-bleed-phone-clean",
    core: "sky-core-phone",
    board: "phone",
    size: [899, 1750],
    site: [[55, 95, 640, 410], [120, 635, 660, 235], [40, 900, 820, 600], [0, 1525, 899, 225]],
  },
};
/** The values of a field (`ch` a pixel) where `valid`, spread over the
 *  rest of the W x H frame as their gaussian-weighted mean at `sigma` px,
 *  and how much of what lies round each pixel is valid (0 to 1). Done in
 *  floats on a grid one `step` px apart: a blur in 8 bits steps its mean in
 *  bands where it is thin (and a band of each channel steps at its own
 *  place: contour ribbons of every hue across the print), and loses the far
 *  interior of a wide hole altogether. */
const smoothFill = (field, valid, W, H, sigma, ch = 3, step = 8) => {
  const [w, h] = [Math.ceil(W / step), Math.ceil(H / step)];
  const num = new Float32Array(w * h * ch);
  const den = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = Math.min(H - 1, y * step) * W + Math.min(W - 1, x * step);
      if (!valid(i)) continue;
      den[y * w + x] = 1;
      for (let k = 0; k < ch; k++) num[(y * w + x) * ch + k] = field[i * ch + k];
    }
  const r = Math.ceil((3 * sigma) / step);
  const g = Array.from({ length: 2 * r + 1 }, (_, j) => Math.exp(-(((j - r) * step) ** 2) / (2 * sigma * sigma)));
  const pass = (src, c, horizontal) => {
    const out = new Float32Array(src.length);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        for (let k = 0; k < c; k++) {
          let acc = 0;
          for (let j = -r; j <= r; j++) {
            const [xx, yy] = horizontal ? [x + j, y] : [x, y + j];
            if (xx >= 0 && xx < w && yy >= 0 && yy < h) acc += g[j + r] * src[(yy * w + xx) * c + k];
          }
          out[(y * w + x) * c + k] = acc;
        }
    return out;
  };
  const [bn, bd] = [pass(pass(num, ch, true), ch, false), pass(pass(den, 1, true), 1, false)];
  const norm = g.reduce((a, v) => a + v, 0) ** 2;
  const [out, cover] = [new Float32Array(W * H * ch), new Float32Array(W * H)];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // bilinear between the grid's four nearest nodes
      const [gx, gy] = [Math.min(w - 1, x / step), Math.min(h - 1, y / step)];
      const [x0, y0] = [Math.floor(gx), Math.floor(gy)];
      const [x1, y1, tx, ty] = [Math.min(w - 1, x0 + 1), Math.min(h - 1, y0 + 1), gx - x0, gy - y0];
      for (let k = 0; k < ch; k++) {
        let [a, b] = [0, 0];
        for (const [xx, yy, t] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
          a += t * bn[(yy * w + xx) * ch + k];
          b += t * bd[yy * w + xx];
        }
        out[(y * W + x) * ch + k] = b > 1e-6 ? a / b : 0;
        if (!k) cover[y * W + x] = b / norm;
      }
    }
  return { mean: out, cover };
};
const sky = async (job) => {
  const { original, site: SITE, seam, band } = job;
  const src = raw(job.plate);
  const out = raw(job.core);
  if (!existsSync(src) || !existsSync(original) || !(stale(out, src) || stale(out, original) || (job.restore && stale(out, CLEAN_RECIPE)))) return;
  const [W, H] = job.size ?? [1672, 941];
  const n = W * H;
  const rgb = async (f) => sharp(f).removeAlpha().resize(W, H, { fit: "fill" }).raw().toBuffer();
  // (a one-channel buffer comes back from a blur as three, unless kept one)
  const blur = (buf, ch, s) => {
    const b = sharp(buf, { raw: { width: W, height: H, channels: ch } }).blur(s);
    return (ch === 1 ? b.extractChannel(0) : b).raw().toBuffer();
  };
  const [O, P] = await Promise.all([rgb(original), rgb(src)]);
  const luma = (b, i) => 0.299 * b[i * 3] + 0.587 * b[i * 3 + 1] + 0.114 * b[i * 3 + 2];
  // the blue ground: blue well over red, not bright, and no brighter than
  // the ground round it (a faint chalk stroke is blue enough, and dim)
  const ground = async (b) => {
    const m = Buffer.alloc(n);
    const l = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      l[i] = Math.round(luma(b, i));
      m[i] = b[i * 3 + 2] - b[i * 3] > 35 && l[i] < 150 ? 255 : 0;
    }
    const [sum, cover] = await Promise.all([blur(l.map((v, i) => (m[i] ? v : 0)), 1, 6), blur(m, 1, 6)]);
    for (let i = 0; i < n; i++) if (m[i] && l[i] > (sum[i] * 255) / Math.max(1, cover[i]) + 16) m[i] = 0;
    return m;
  };
  const SCALES = [10, 40, 120, 360];
  // the fine scales as a blur (8 bits are enough where the ground is dense),
  // the coarse ones in floats (smoothFill): either has its `m` the share of
  // ground round a pixel, 0 to 255, and its colour as `mean` (floats) or
  // `c` (premultiplied, bytes)
  const levels = async (b, m) => {
    const masked = Buffer.alloc(n * 3);
    for (let i = 0; i < n; i++) if (m[i]) masked.set(b.subarray(i * 3, i * 3 + 3), i * 3);
    return Promise.all(
      SCALES.map(async (s) => {
        if (s < 100) return { c: await blur(masked, 3, s), m: await blur(m, 1, s) };
        const { mean, cover } = smoothFill(b, (i) => m[i] > 0, W, H, s, 3, s > 200 ? 8 : 4);
        return { mean, m: cover.map((v) => v * 255) };
      }),
    );
  };
  // ... and clear of anything that is not (the soft edge of a letter, a
  // note's stroke, a leaflet is neither ground nor not, and would ghost)
  const clear = async (m) => {
    const off = Buffer.alloc(n);
    for (let i = 0; i < n; i++) off[i] = m[i] ? 0 : 255;
    const near = await blur(off, 1, 2.5);
    for (let i = 0; i < n; i++) if (near[i] > 12) m[i] = 0;
    return m;
  };
  const [mO, mP] = await Promise.all([ground(O).then(clear), ground(P).then(clear)]);
  const siteMask = Buffer.alloc(n);
  for (const [x0, y0, w, h] of SITE)
    for (let y = Math.max(0, y0 - SHADOW); y < Math.min(H, y0 + h + SHADOW); y++) siteMask.fill(255, y * W + Math.max(0, x0 - SHADOW), y * W + Math.min(W, x0 + w + SHADOW));
  for (let i = 0; i < n; i++) if (siteMask[i]) mO[i] = 0;
  const [lO, lP] = await Promise.all([levels(O, mO), levels(P, mP)]);
  // Under the site the original shows no ground to measure: what is laid
  // there only reaches in from the ground beyond the site's edge, and where
  // a pixel's scale changes the tone steps, in contour bands following the
  // site's outline (they read as ribbons across the print). So under the
  // site the tone is not measured but filled in from round it, smoothly (a
  // wide blur of what is laid outside): `under` is how far into the site a
  // pixel lies, softened over SHADOW px.
  const under = await blur(siteMask, 1, SHADOW);
  // the ground's mean colour round a pixel at a scale, and how much of
  // what lies round it is ground
  const mean = (lv, s, i, k) => (lv[s].mean ? lv[s].mean[i * 3 + k] : (lv[s].c[i * 3 + k] * 255) / Math.max(1, lv[s].m[i]));
  // both read at the finest scale at which both show ground enough round
  // the pixel (blended into the next, coarser one as it thins), the
  // coarsest always: so the plate's own shapes are never measured against
  // a different scale of the original's
  const weights = (i) => {
    const w = [];
    let rest = 1;
    for (let s = 0; s < SCALES.length; s++) {
      const here = s === SCALES.length - 1 ? 1 : smoothstep(0.3, 0.6, Math.min(lO[s].m[i], lP[s].m[i]) / 255);
      w.push(rest * here);
      rest *= 1 - here;
    }
    return w;
  };
  const delta = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const w = weights(i);
    for (let k = 0; k < 3; k++) for (let s = 0; s < SCALES.length; s++) if (w[s]) delta[i * 3 + k] += w[s] * (mean(lO, s, i, k) - mean(lP, s, i, k));
  }
  // ... and the tone under the site: the delta outside it, smoothed wide
  // and normalised by what lies outside (smoothFill, in floats)
  const { mean: filled } = smoothFill(delta, (i) => under[i] < 20, W, H, 220);
  const sky = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    const u = smoothstep(30, 200, under[i]);
    for (let k = 0; k < 3; k++) {
      const d = delta[i * 3 + k] * (1 - u) + filled[i * 3 + k] * u;
      sky[i * 3 + k] = Math.min(255, Math.max(0, Math.round(P[i * 3 + k] + d)));
    }
  }
  // the original's ground just round a pixel (at the finest scale that has any)
  const groundAt = (i, k) => mean(lO, lO[0].m[i] > 50 ? 0 : 1, i, k);
  // the tooth: the original's own, where both show ground (the plate's is
  // a generation's crumple, not the paper's grain); the plate's elsewhere.
  // The original's measured from the mean of its ground alone, so a stroke
  // beside a ground pixel leaves no dark print of itself in it.
  const masked = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) if (mO[i]) masked.set(O.subarray(i * 3, i * 3 + 3), i * 3);
  const [cO, kO, fS, both] = await Promise.all([blur(masked, 3, 2.5), blur(mO, 1, 2.5), blur(sky, 3, 2.5), blur(mO.map((v, i) => (v && mP[i] ? 255 : 0)), 1, 1.5)]);
  for (let i = 0; i < n; i++) {
    const t = both[i] / 255;
    if (t > 0 && kO[i] > 0)
      for (let k = 0; k < 3; k++) {
        const fO = (cO[i * 3 + k] * 255) / kO[i];
        sky[i * 3 + k] = Math.min(255, Math.max(0, Math.round(sky[i * 3 + k] + t * (O[i * 3 + k] - fO - (sky[i * 3 + k] - fS[i * 3 + k])))));
      }
  }
  // the band under the seam: the plate's own clean blue from further along
  // the row, feathered in at its ends and foot
  const [bx, by, bw, bh] = band?.box ?? [0, 0, 0, 0];
  for (let y = by; y < by + bh; y++)
    for (let x = bx; x < bx + bw; x++) {
      const a = smoothstep(bx, bx + 10, x) * (1 - smoothstep(bx + bw - 30, bx + bw, x)) * (1 - smoothstep(by + bh - 14, by + bh, y)) * smoothstep(by, by + 3, y);
      const [i, j] = [y * W + x, y * W + x - bx + band.from];
      for (let k = 0; k < 3; k++) sky[i * 3 + k] = Math.round(sky[i * 3 + k] * (1 - a) + sky[j * 3 + k] * a);
    }
  // the seam: the original wherever it is brighter than its ground, along
  // the ruled line (past the fern, above the line too: there the fern's
  // leaflets are the plate's own)
  const [sx, sy, sw, sh] = seam?.box ?? [0, 0, 0, 0];
  for (let y = sy; y < sy + sh; y++)
    for (let x = sx; x < sx + sw; x++) {
      if (x < seam.fernTo && y < seam.line) continue;
      const i = y * W + x;
      const lift = luma(O, i) - (0.299 * groundAt(i, 0) + 0.587 * groundAt(i, 1) + 0.114 * groundAt(i, 2));
      const a = smoothstep(18, 70, lift) * smoothstep(sx, sx + 6, x) * (1 - smoothstep(sx + sw - 40, sx + sw, x)) * smoothstep(sy, sy + 4, y) * (1 - smoothstep(sy + sh - 4, sy + sh, y));
      for (let k = 0; k < 3; k++) sky[i * 3 + k] = Math.round(sky[i * 3 + k] * (1 - a) + O[i * 3 + k] * a);
    }
  // what the plate re-drew that the original has as it stood: its own pixels
  // (cyanotype-clean.mjs RESTORE), the last thing laid
  if (job.restore) {
    const pe = await rgb(raw("print-empty"));
    const paperLuma = Float32Array.from({ length: n }, (_, i) => luma(pe, i));
    const area = restoreOriginal({ sky, O, W, H, paperLuma });
    console.log(`${job.core}: the original's own pixels restored in the right column (${area} px)`);
  }
  console.log(`${job.core}: the original's ground and tooth laid in`);
  await write(job.core, sky, { width: W, height: H, channels: 3 });
};

// The print painted on past the mock's edges (kit.css registers a plate to
// the home page's stage; its bleed fills the frame round the stage at any
// aspect): BLEED mock px on each side and below (cyanotype.css
// --sky-bleed-x, --sky-bleed-bottom, scene.bleed below), round generations,
// for each print (PRINTS):
//   bleedRef: its core at the top middle of the generator's 16:9 (the canvas
//     padded at its foot), the margins a flat grey to be painted
//     (bleed-*/ref.png; art/prompts/cyanotype/bleed-*.txt -> bleed-*/bleed-*.png
//     by scripts/gen-asset.sh)
//   the home print's photo print at the upper right runs off the core, and
//     the generation finished it as a second print beside it: PHOTO, the
//     margin beside it, painted again on a 9:16 crop of the canvas round it,
//     the margin grey (bleed-photo/ref.png; art/prompts/cyanotype/
//     bleed-photo.txt -> bleed-photo/bleed-photo.png)
//   compose: each generation scaled to its place, its tone fitted to the
//     core's (a gain and offset per channel, least squares over the core it
//     repainted), the patch laid over the margin feathered over FEATHER px,
//     and the core itself laid back over the core, feathered over FEATHER px
//     along its left, right and bottom edges, so the core is pixel-exact.
//     (The generation's grain is the plate's: a faint crumple, at the core's
//     own strength.)
//   duotone: the whole canvas, margins and core alike, onto the mock's ramp
//     (below): layer-sky-*.
// Night is graded from it pixel by pixel (nightOf), so one bleed serves both.
const BLEED = 320;
const FEATHER = 24;
const [CW, CH] = [1672, 941];
const [BW, BH] = [CW + 2 * BLEED, CH + BLEED];
const PH = Math.round((BW * 9) / 16);
// the crop round the photo print (canvas px, 9:16), and the margin in it
// that is painted again
const PHOTO = { crop: [1603, 0, 709, 1261], box: [1992, 96, 320, 352] };
const rgb = async (src) => sharp(src).removeAlpha().raw().toBuffer();

// The print is Prussian blue and white and nothing else (the original's own
// ramp). Whatever hue a generation carried in (lilac in a fern, pink in a
// keycap, teal and violet in a band of ground), every pixel of every plate is
// put back on the one ramp the original's print runs along from its blue to
// its white: its luminance kept, its colour the original's at that
// luminance (the median of the print's pixels in each luminance bin,
// outside the site and the warm paper, smoothed).
const lumaOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
let ramp0;
const duotoneRamp = () => (ramp0 ??= buildRamp());
const buildRamp = async () => {
  const { data, info } = await sharp(ORIGINAL).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const inSite = (x, y) => PRINTS.home.site.some(([x0, y0, w, h]) => x >= x0 - SHADOW && x < x0 + w + SHADOW && y >= y0 - SHADOW && y < y0 + h + SHADOW);
  const hist = Array.from({ length: 256 }, () => [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]);
  const count = new Uint32Array(256);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (b < r - 4 || inSite(x, y)) continue; // paper, tape and the site are not the print
      const l = Math.round(lumaOf(r, g, b));
      count[l]++;
      hist[l][0][r]++;
      hist[l][1][g]++;
      hist[l][2][b]++;
    }
  const median = (h, n) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += h[v]) >= n / 2) return v;
    return 255;
  };
  // each bin's median colour; a bin with too few pixels takes its neighbours'
  const raw = Array.from({ length: 256 }, (_, l) => (count[l] >= 40 ? [0, 1, 2].map((k) => median(hist[l][k], count[l])) : null));
  const known = raw.map((c, l) => (c ? l : -1)).filter((l) => l >= 0);
  const filled = raw.map((c, l) => {
    if (c) return c;
    const [lo, hi] = [known.filter((k) => k < l).pop(), known.find((k) => k > l)];
    if (lo === undefined) return raw[hi];
    if (hi === undefined) return raw[lo];
    const t = (l - lo) / (hi - lo);
    return [0, 1, 2].map((k) => raw[lo][k] * (1 - t) + raw[hi][k] * t);
  });
  // smoothed along the ramp, then each colour scaled to its bin's luminance
  const ramp = filled.map((_, l) => {
    const c = [0, 0, 0];
    let n = 0;
    for (let d = -6; d <= 6; d++) {
      const j = Math.min(255, Math.max(0, l + d));
      for (let k = 0; k < 3; k++) c[k] += filled[j][k];
      n++;
    }
    const m = c.map((v) => v / n);
    const s = l / Math.max(1, lumaOf(...m));
    return m.map((v) => v * s);
  });
  console.log(`duotone ramp: ${[16, 48, 96, 160, 220].map((l) => `${l}:${ramp[l].map(Math.round)}`).join(" ")}`);
  return ramp;
};
const duotone = async (res) => {
  const R = await duotoneRamp();
  for (let i = 0; i < res.length; i += 3) {
    const l = lumaOf(res[i], res[i + 1], res[i + 2]);
    const [lo, t] = [Math.min(254, Math.floor(l)), l - Math.floor(l)];
    for (let k = 0; k < 3; k++) res[i + k] = Math.round(Math.min(255, Math.max(0, R[lo][k] * (1 - t) + R[lo + 1][k] * t)));
  }
  return res;
};
const fitTone = (g, gw, [ox, oy], C) =>
  [0, 1, 2].map((c) => {
    let [n, sx, sy, sxx, sxy] = [0, 0, 0, 0, 0];
    for (let y = 0; y < CH; y += 2)
      for (let x = 0; x < CW; x += 2) {
        const [gx, gy] = [x + BLEED - ox, y - oy];
        if (gx < 0 || gx >= gw || gy < 0 || gy * gw + gx >= g.length / 3) continue;
        const [a, b] = [g[(gy * gw + gx) * 3 + c], C[(y * CW + x) * 3 + c]];
        n++;
        sx += a;
        sy += b;
        sxx += a * a;
        sxy += a * b;
      }
    const k = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return [k, (sy - k * sx) / n];
  });
const compose = async (job, { patch }) => {
  const C = await rgb(raw(job.core));
  const g = await rgb(await sharp(raw(job.gen)).resize(BW, PH, { fit: "fill", kernel: "lanczos3" }).png().toBuffer());
  const fit = fitTone(g, BW, [0, 0], C);
  const res = Buffer.alloc(BW * BH * 3);
  for (let i = 0; i < BW * BH; i++) for (let c = 0; c < 3; c++) res[i * 3 + c] = Math.round(Math.min(255, Math.max(0, g[i * 3 + c] * fit[c][0] + fit[c][1])));
  const fits = [fit];
  if (patch) {
    const [px, py, pw, ph] = PHOTO.crop;
    const q = await rgb(await sharp(raw("bleed-photo")).resize(pw, ph, { fit: "fill", kernel: "lanczos3" }).png().toBuffer());
    const qf = fitTone(q, pw, [px, py], C);
    fits.push(qf);
    const [bx, by, bw, bh] = PHOTO.box;
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) {
        // feathered in at the box's top and foot (its sides are the core's
        // edge and the canvas's)
        const t = Math.min(1, (y - by + 1) / FEATHER, (by + bh - y) / FEATHER);
        const [i, j] = [y * BW + x, (y - py) * pw + x - px];
        for (let c = 0; c < 3; c++) res[i * 3 + c] = Math.round(Math.min(255, Math.max(0, res[i * 3 + c] * (1 - t) + (q[j * 3 + c] * qf[c][0] + qf[c][1]) * t)));
      }
  }
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      // how far inside the core: 1 past the feather, 0 at its edge
      const t = Math.min(1, Math.min(x + 1, CW - x, CH - y) / FEATHER);
      const [i, j] = [y * BW + x + BLEED, y * CW + x];
      for (let c = 0; c < 3; c++) res[i * 3 + c] = Math.round(res[i * 3 + c] * (1 - t) + C[j * 3 + c] * t);
    }
  return { res, fits };
};
const bleedRef = async (job) => {
  const core = raw(job.core);
  if (!existsSync(core)) return;
  const out = `${RAW}/${job.gen}/ref.png`;
  if (stale(out, core)) {
    mkdirSync(`${RAW}/${job.gen}`, { recursive: true });
    await sharp({ create: { width: BW, height: PH, channels: 3, background: "#8a8a8a" } })
      .composite([{ input: core, left: BLEED, top: 0 }])
      .png()
      .toFile(out);
    console.log(`${job.gen}/ref.png: ${BW}x${PH}, the core at ${BLEED},0`);
  }
  if (!job.photo) return;
  const ref = `${RAW}/bleed-photo/ref.png`;
  if (existsSync(raw(job.gen)) && (stale(ref, raw(job.gen)) || stale(ref, core))) {
    mkdirSync(`${RAW}/bleed-photo`, { recursive: true });
    const { res } = await compose(job, { patch: false });
    const [px, py, pw, ph] = PHOTO.crop;
    const [bx, by, bw, bh] = PHOTO.box;
    const grey = await sharp({ create: { width: bw, height: bh, channels: 3, background: "#8a8a8a" } }).png().toBuffer();
    await sharp(res, { raw: { width: BW, height: BH, channels: 3 } })
      .extract({ left: px, top: py, width: pw, height: ph })
      .composite([{ input: grey, left: bx - px, top: by - py }])
      .png()
      .toFile(ref);
    console.log(`bleed-photo/ref.png: ${pw}x${ph}, the margin grey at ${bx - px},${by - py}`);
  }
};
// A print's clean ground, the print with everything drawn on it taken out
// (cyanotype-ground.mjs): what the page lays under its type, so no rule or
// prop of the print passes under a word. Its name is the print's with
// "ground" before the finish (layer-sky-ground-project-day), and it is
// graded for night and lit like the print (the scene step: more finishes
// of the one layer, kit.scene below), so it registers with it exactly.
const GROUND_RECIPE = new URL("./cyanotype-ground.mjs", import.meta.url).pathname;
const groundName = (name) => name.replace("layer-sky-", "layer-sky-ground-");
const bleed = async (job) => {
  const [core, gen, photo, out] = [raw(job.core), raw(job.gen), raw("bleed-photo"), raw(job.out)];
  if (!existsSync(core) || !existsSync(gen)) return;
  const patch = job.photo && existsSync(photo);
  const ground = raw(groundName(job.out));
  const staler = (to) => stale(to, core) || stale(to, gen) || (patch && stale(to, photo)) || stale(to, RECIPE);
  const [outStale, groundStale] = [staler(out) || stale(out, KEYBOARD_RECIPE), staler(ground) || stale(ground, GROUND_RECIPE) || (job.groundBoard && stale(ground, KEYBOARD_RECIPE)) || !existsSync(out)];
  if (!outStale && !groundStale) return;
  const { res, fits } = await compose(job, { patch });
  // the ground is the print without its keyboard, which is drawn on next (a
  // keyboard's glass and its walls are no brighter than the print's own
  // blue where they are thin, and would leave a ghost of the board behind)
  const bare = groundStale && job.board ? Buffer.from(res) : res;
  // the print's keyboard, drawn on the composed print (the bleed's canvas)
  if (job.board) await paintKeyboard(res, BW, BH, job.board);
  const fmt = (fit) => fit.map(([k, b]) => `${k.toFixed(3)}x${b >= 0 ? "+" : ""}${b.toFixed(1)}`).join(" ");
  if (outStale) {
    console.log(`${job.out}: ${BW}x${BH}; tone fit ${fits.map(fmt).join("; ")}`);
    await write(job.out, await duotone(res), { width: BW, height: BH, channels: 3 });
  }
  if (groundStale) {
    const { data } = groundOf(await duotone(bare), BW, BH);
    // (a keyboard that stands clear of every block of type is part of the
    // ground: a knock-out patch's feathered edge reaching over it would
    // otherwise wipe a strip of it. Painted after the ground is built, not
    // taken out of it: a board's thin glass leaves ghosts when it is)
    if (job.groundBoard) await paintKeyboard(data, BW, BH, job.board);
    console.log(`${groundName(job.out)}: the clean ground`);
    await write(groundName(job.out), data, { width: BW, height: BH, channels: 3 });
  }
};


// the bare fibre of a torn or cut rim, paler than the paper's face
const RIM = [246, 244, 238];
// A smooth random wobble along an edge: `octaves` of [period, amplitude] px
const wobble = (len, seed, octaves) => {
  const out = new Float32Array(len);
  octaves.forEach(([period, amp], o) => {
    const r = noiseOf(Math.ceil(len / period) + 2, seed + o * 97);
    for (let i = 0; i < len; i++) {
      const [t, k] = [i / period, Math.floor(i / period)];
      const e = (t - k) * (t - k) * (3 - 2 * (t - k));
      out[i] += amp * 2 * ((r[k] / 255 - 0.5) * (1 - e) + (r[k + 1] / 255 - 0.5) * e);
    }
  });
  return out;
};

// The tape that holds every print and sheet down: one warm beige masking
// tape at fairly high opacity, creased, with a hairline of shadow along its
// edges (cyanotype-tape.mjs says what the original's is and how it is drawn).
const TAPE_RECIPE = new URL("./cyanotype-tape.mjs", import.meta.url).pathname;
const tapeClear = async () => {
  if (!stale(raw("tape-clear"), RECIPE) && !stale(raw("tape-clear"), TAPE_RECIPE)) return;
  const { data, info } = await tapeSprite({ noiseOf, smoothstep, wobble, lowField });
  await write("tape-clear", data, info);
};

// The call ("Join the alpha"): a slab of the cards' paper cut with a blade, its
// edges straight and only a hair off true (the original's label is clean-
// edged, with fibre dots along its foot; round 10: round 9's wander of 5 px
// read as a torn top), its rim a little paler where the cut opened the fibre,
// nothing printed on it, from the sheet's clean middle, with a margin clear
// round it for the tile's shadow. The paper's own fibre is brought up on its
// face as the original's is: long pale and dark threads lying every way, a
// few levels either side of the paper. The wobble and the threads are in the
// slab's px (900 wide: on the page it is drawn at about a third of that).
const slip = async () => {
  const src = raw("card-paper");
  if (!existsSync(src) || !(stale(raw("slip"), src) || stale(raw("slip"), RECIPE))) return;
  const [w, h, pad] = [900, 300, 24];
  const face = await sharp(src).extract({ left: 250, top: 420, width: w, height: h }).removeAlpha().raw().toBuffer();
  const out = Buffer.alloc((w + 2 * pad) * (h + 2 * pad) * 4);
  const [top, bot, left, right] = [wobble(w, 41, [[70, 2], [19, 0.9]]), wobble(w, 43, [[70, 2], [19, 0.9]]), wobble(h, 47, [[60, 2], [17, 0.9]]), wobble(h, 53, [[60, 2], [17, 0.9]])];
  // the threads: soft strokes along gently bending paths, pale or dark
  const thread = new Float32Array(w * h);
  const rnd = (n) => noiseOf(1, 5100 + n)[0] / 255;
  for (let n = 0; n < 150; n++) {
    const [len, wid, sign] = [40 + 90 * rnd(n * 6), 2.2 + 1.2 * rnd(n * 6 + 1), rnd(n * 6 + 2) < 0.5 ? -1 : 1];
    let [px, py, ang] = [rnd(n * 6 + 3) * w, rnd(n * 6 + 4) * h, rnd(n * 6 + 5) * Math.PI * 2];
    const bend = (rnd(n * 6 + 6) - 0.5) * 0.02;
    const amp = (3.5 + 5 * rnd(n * 6 + 7)) * sign;
    for (let t = 0; t < len; t += 1) {
      ang += bend;
      [px, py] = [px + Math.cos(ang), py + Math.sin(ang)];
      const fade = Math.sin((Math.PI * t) / len);
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const [qx, qy] = [Math.round(px) + dx, Math.round(py) + dy];
          if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
          const dd = Math.hypot(qx - px, qy - py) / wid;
          if (dd < 1) thread[qy * w + qx] += amp * fade * (1 - dd * dd) ** 2 * 0.35;
        }
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [i, o] = [(y * w + x) * 3, ((y + pad) * (w + 2 * pad) + x + pad) * 4];
      // how far inside the hand-cut edge, in px (the wobble inset 8 px)
      const d = Math.min(y - 8 - top[x], h - 1 - y - 8 - bot[x], x - 8 - left[y], w - 1 - x - 8 - right[y]);
      const a = smoothstep(-0.6, 1.4, d);
      if (a <= 0) continue;
      const rim = (1 - smoothstep(0, 10, d)) * 0.45;
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(Math.min(255, Math.max(0, face[i + k] + thread[y * w + x]) * (1 - rim) + RIM[k] * rim));
      out[o + 3] = Math.round(a * 255);
    }
  await write("slip", out, { width: w + 2 * pad, height: h + 2 * pad, channels: 4 });
};

// The cards' stock: the generated sheet (card-paper: warm off-white, torn by
// hand along a ruler, its edge ragged and its fibres exposed), the torn rim
// whitened as the original's is (a thin band of bare fibre, paler than the
// face, brighter where the paper thinned out), and a trace of the print's
// blue washed into its margins (the emulsion brushed up to the edge of the
// sheet laid on it, as the original's cards are stained), in soft patches,
// strongest at the edge and gone some 30 px in. (The art only keeps the
// deckle's band; the page carries the wash on further in: cyanotype.css
// --card-wash.) The sheets are cut from it.
const STAIN = [104, 140, 178];
const FIBRE = 0.9;
// A smooth random field of z-scores about zero, its bumps `cell` px across:
// a coarse grid of noise brought up to size by a cubic (blurring noise in 8
// bits leaves it a few levels either side of grey, which steps).
const lowField = async (width, height, cell, seed) => {
  const [w, h] = [Math.ceil(width / cell) + 2, Math.ceil(height / cell) + 2];
  const up = await sharp(noiseOf(w * h, seed), { raw: { width: w, height: h, channels: 1 } })
    .resize({ width: w * cell, height: h * cell, kernel: "cubic" })
    .extract({ left: cell, top: cell, width, height })
    .extractChannel(0)
    .raw()
    .toBuffer();
  return Float32Array.from(up, (q) => (q - 127.5) / 74);
};
// The torn edge as the original's cards have it: soft and wavy, its ragged
// fibres fine, not the generated sheet's small even teeth. The silhouette is
// carried along a smooth displacement (6 px over bumps of 30), softened, and
// frayed again at a finer grain; the fibre is displaced the same way only near
// the edge (inside it the paper is as it came). Worked in place on the sheet's
// RGBA.
// (the edge's softness, in px of blur, and how far its fray moves the cut level:
// the original's is a soft cloud of fibre, where a harder blur-and-cut reads
// as torn teeth)
const EDGE_SOFT = 3.2;
const EDGE_FRAY = 0.12;
const softEdge = async (data, W, H, seed) => {
  const n = W * H;
  const [fx, fy, fray] = await Promise.all([lowField(W, H, 30, seed), lowField(W, H, 30, seed + 1), lowField(W, H, 3, seed + 2)]);
  const warped = Buffer.alloc(n * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const sx = Math.min(W - 1.001, Math.max(0, x + 6 * fx[i]));
      const sy = Math.min(H - 1.001, Math.max(0, y + 6 * fy[i]));
      const [x0, y0] = [sx | 0, sy | 0];
      const [ax, ay] = [sx - x0, sy - y0];
      for (let k = 0; k < 4; k++) {
        const at = (yy, xx) => data[(yy * W + xx) * 4 + k];
        warped[i * 4 + k] = at(y0, x0) * (1 - ax) * (1 - ay) + at(y0, x0 + 1) * ax * (1 - ay) + at(y0 + 1, x0) * (1 - ax) * ay + at(y0 + 1, x0 + 1) * ax * ay;
      }
    }
  const alpha = Buffer.alloc(n);
  const was = Buffer.alloc(n);
  for (let i = 0; i < n; i++) [alpha[i], was[i]] = [warped[i * 4 + 3], data[i * 4 + 3]];
  const one = (b, sigma) => sharp(b, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
  const [soft, inside] = await Promise.all([one(alpha, EDGE_SOFT), one(was, 14)]);
  for (let i = 0; i < n; i++) {
    const e = 1 - smoothstep(0.62, 0.97, inside[i] / 255);
    for (let k = 0; k < 3; k++) data[i * 4 + k] = Math.round(data[i * 4 + k] * (1 - e) + warped[i * 4 + k] * e);
    // (the fray moves the cut level, never below a few per cent: the clear
    // round the sheet is to stay clear, or a trim would take it for paper)
    const fr = EDGE_FRAY * fray[i];
    data[i * 4 + 3] = Math.round(255 * smoothstep(Math.max(0.03, 0.12 + fr), Math.max(0.5, 0.88 + fr), soft[i] / 255));
  }
};
const stock = async () => {
  const src = raw("card-paper");
  if (!existsSync(src) || !(stale(raw("card-stock"), src) || stale(raw("card-stock"), RECIPE))) return;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const n = W * H;
  await softEdge(data, W, H, 71);
  const off = Buffer.alloc(n);
  for (let i = 0; i < n; i++) off[i] = 255 - data[i * 4 + 3];
  const one = (b, s) => sharp(b, { raw: { width: W, height: H, channels: 1 } }).blur(s).extractChannel(0).raw().toBuffer();
  const noise = (s, seed) => one(noiseOf(n, seed), s);
  // a blurred field as z-scores (blurring white noise leaves it 128 +- a
  // few, however broad), so a threshold on it means the same at any scale
  const zed = async (s, seed) => {
    const f = await noise(s, seed);
    let m = 0;
    for (let i = 0; i < n; i += 7) m += f[i];
    m /= Math.ceil(n / 7);
    let v = 0;
    for (let i = 0; i < n; i += 7) v += (f[i] - m) ** 2;
    const sd = Math.sqrt(v / Math.ceil(n / 7)) || 1;
    return (i) => (f[i] - m) / sd;
  };
  const [near, close, wash, strands] = await Promise.all([one(off, 36), one(off, 3.5), zed(14, 19), noise(1, 29)]);
  // its fibre a little stronger than it came back (the original's paper is
  // the more fibrous), the deviation from its own local mean raised
  const rgb = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) rgb.set(data.subarray(i * 4, i * 4 + 3), i * 3);
  const local = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).blur(6).raw().toBuffer();
  for (let i = 0; i < n; i++) {
    if (!data[i * 4 + 3]) continue;
    // how near the edge (the clear round the sheet, blurred in), how blotchy
    const edge = smoothstep(0.02, 0.32, near[i] / 255);
    const blot = smoothstep(-0.8, 0.8, wash(i));
    const a = 0.24 * edge * (0.25 + 0.75 * blot);
    // the bare-fibre rim: within some 7 px of the edge, broken into strands
    const rim = 0.7 * smoothstep(0.1, 0.5, close[i] / 255) * (0.55 + 0.45 * smoothstep(100, 160, strands[i]));
    for (let k = 0; k < 3; k++) {
      const fibre = data[i * 4 + k] + FIBRE * (data[i * 4 + k] - local[i * 3 + k]);
      const stained = fibre * (1 - a) + STAIN[k] * a;
      data[i * 4 + k] = Math.min(255, Math.max(0, Math.round(stained * (1 - rim) + RIM[k] * rim)));
    }
  }
  await write("card-stock", data, info);
};

// A print mounted on a margin of the cards' paper and taped down: the project
// page's figure and the launch page's window (cyanotype.css), both set as the
// originals set theirs (cyanotype-project, cyanotype-launch): a thin cream
// border, cut with a blade (straight, its edge a hair off true: the mock's
// polaroid is not torn), the print itself laid on it (the page's own element,
// over this), and a piece of masking tape at each corner the mock tapes
// (tape-clear). Two sheets of one size, which the page lays one over the
// other: the paper (mount-*), cut from the paper's seamless tile at the
// sheets' own tone and fibre, one solid backing (the print covers its
// middle), the cast shadow of the paper baked in with room round it, and the
// tape (mount-tape-*), which the page lays over the print: the mock's tape
// lies across the print's corner as well as the border, and a piece baked
// into the paper would be hidden where it overlaps the print. Each a day and
// a night raw (the cards' paper by lamp), cut as they are (kit.cuts). In the
// original's px, drawn at MOUNT_S px to each; `size` the mount's own size (the
// page sets its element to it: cyanotype.css), `cut` the blade's wander along a
// side, [period, amplitude] px in the mount's px, `tapes` [centre x, centre y,
// length, width, angle] on it, and the canvas runs MOUNT_ROOM px past it on
// every side for the tapes' overhang and the shadow.
const MOUNT_S = 2;
const MOUNT_ROOM = 48;
const MOUNTS = {
  // (the mock's is a portrait, 520 x 630; ours holds the project's art, which
  // is 3:2, so its mount is cut to that: as wide as the column beside the
  // headline and the keycap drawing allows, 560. Round 10, measured on the
  // mock's: its cream border is thin and not even, 18 of its px at the sides,
  // 12 above the print and 20 below it, where it was 21 all round and 27
  // below. The print's own edge is brushed (printEdge), which takes a few px
  // of it, so the padding the page sets (cyanotype.css) is 15, 9 and 17:
  // 531 x 354 of print in 560 x 380. The tapes are the mock's, 98 x 43 at the
  // top left lying across the corner, 96 x 42 at the top right turned a
  // sixth of a quarter the other way, a short piece 50 x 46 at the foot)
  project: {
    size: [560, 380],
    seed: 61,
    cut: [[260, 0.7], [58, 0.45], [12, 0.3]],
    tapes: [[62, 15, 98, 43, -1], [520, 7, 96, 42, 17], [14, 356, 50, 46, -4]],
  },
  // (the mock's window has the same thin border, its edge a little rougher;
  // round 9, measured on the mock's: the cream band is 11 to 18 px wide, the
  // sprite's 812 x 525 around a 782 x 491 screen leaves 15 at the sides and
  // top, 19 below it, where it was ~10)
  launch: {
    size: [812, 525],
    seed: 67,
    cut: [[220, 1.4], [44, 0.9], [11, 0.6]],
    tapes: [[27, 30, 104, 40, -22], [798, 495, 112, 42, -40]],
  },
};
// the lamp's cast on the paper, as the cards' paper is warmed (kit.fills mean)
const PAPER_NIGHT = [0.93, 0.876, 0.762];
const mounts = async () => {
  const [tileSrc, tapeSrc] = [raw("paper-tile"), raw("tape-clear")];
  if (!existsSync(tileSrc) || !existsSync(tapeSrc)) return;
  const tape = await sharp(tapeSrc).trim({ threshold: 1 }).ensureAlpha().toBuffer();
  for (const [id, { size: [mw, mh], seed, cut, tapes }] of Object.entries(MOUNTS)) {
    const outs = [raw(`mount-${id}-day`), raw(`mount-${id}-night`), raw(`mount-tape-${id}-day`), raw(`mount-tape-${id}-night`)];
    if (!outs.some((o) => stale(o, tileSrc) || stale(o, tapeSrc) || stale(o, RECIPE))) continue;
    const S = MOUNT_S;
    const [W, H] = [(mw + 2 * MOUNT_ROOM) * S, (mh + 2 * MOUNT_ROOM) * S];
    const [px0, py0] = [MOUNT_ROOM * S, MOUNT_ROOM * S];
    const [pw, ph] = [mw * S, mh * S];
    // the paper: the page's tile laid four times over (it is seamless), only
    // its grain kept and raised round the sheets' own mean, as kit.fills do
    const tile = await sharp(tileSrc).raw().toBuffer({ resolveWithObject: true });
    const [tw, th] = [tile.info.width, tile.info.height];
    const four = await sharp({ create: { width: tw * 2, height: th * 2, channels: 3, background: "#000" } })
      .composite([[0, 0], [tw, 0], [0, th], [tw, th]].map(([left, top]) => ({ input: tileSrc, left, top })))
      .raw()
      .toBuffer();
    const grain = await sharp(four, { raw: { width: tw * 2, height: th * 2, channels: 3 } }).blur(48).raw().toBuffer();
    // the mock's border is a warm cream (234, 227, 212 along its left side)
    const ground = [233, 227, 213];
    const paperAt = (x, y, k) => {
      const i = (((y + 60) % (th * 2)) * tw * 2 + ((x + 60) % (tw * 2))) * 3 + k;
      return Math.min(255, Math.max(0, ground[k] + 1.9 * (four[i] - grain[i])));
    };
    // the cut: each side along a ruler with a blade (a long drift, a short
    // wander, a fibre's width: `cut`, in the mount's px), the whole rim
    // broken a hair by noise
    const side = (len, o) => wobble(len, seed + o, cut.map(([period, amp]) => [period * S, amp * S]));
    const [top, bot, left, right] = [side(pw, 1), side(pw, 2), side(ph, 3), side(ph, 4)];
    const fibre = await sharp(noiseOf(pw * ph, seed + 9), { raw: { width: pw, height: ph, channels: 1 } }).blur(1.4).extractChannel(0).raw().toBuffer();
    const patch = await sharp(noiseOf(pw * ph, seed + 11), { raw: { width: pw, height: ph, channels: 1 } }).blur(12).extractChannel(0).raw().toBuffer();
    const paper = Buffer.alloc(W * H * 4);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const d = Math.min(y - 3 - top[x], ph - 1 - y - 3 - bot[x], x - 3 - left[y], pw - 1 - x - 3 - right[y]) + (fibre[y * pw + x] - 128) * 0.02;
        const a = smoothstep(-0.8, 1.6, d);
        if (a <= 0) continue;
        const o = ((y + py0) * W + x + px0) * 4;
        // the bare fibre of the cut's rim, a few px of it, and the print's
        // blue crept in at the edge
        const rim = (1 - smoothstep(0, 5, d)) * (0.35 + 0.35 * smoothstep(110, 150, fibre[y * pw + x]));
        const stain = 0.1 * (1 - smoothstep(0, 40, d)) * smoothstep(118, 142, patch[y * pw + x]);
        for (let k = 0; k < 3; k++) {
          const face = paperAt(x, y, k) * (1 - stain) + STAIN[k] * stain;
          paper[o + k] = Math.round(face * (1 - rim) + RIM[k] * rim);
        }
        paper[o + 3] = Math.round(a * 255);
      }
    // the cast shadow of the paper alone: a short dark contact line and a
    // wider, fainter one, from the upper left
    const alpha = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) alpha[i] = paper[i * 4 + 3];
    const cast = async (dx, dy, sigma, opacity) => {
      const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
      const out = Buffer.alloc(W * H * 4);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const [sx, sy] = [x - dx, y - dy];
          if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
          const o = (y * W + x) * 4;
          out.set([4, 14, 34], o);
          out[o + 3] = Math.round(blurred[sy * W + sx] * opacity);
        }
      return { input: out, raw: { width: W, height: H, channels: 4 } };
    };
    const shadows = [await cast(7, 14, 11, 0.4), await cast(2, 4, 2.4, 0.5)];
    for (const [out, tapeOut, night] of [[outs[0], outs[2], false], [outs[1], outs[3], true]]) {
      // the tape, cut as a sheet of its own: the page lays it over the print
      // as the mock lays it (the paper is behind the print, the tape across
      // its corner and the paper's border, and a piece under the print would
      // be hidden where it overlaps it); by night the lamp's warmth on it as
      // on the paper
      const laid = await Promise.all(
        tapes.map(async ([cx, cy, len, wid, angle]) => {
          const piece = await sharp(tape)
            .resize(len * S, wid * S, { fit: "fill" })
            .linear(night ? [LAMP[0], LAMP[1], LAMP[2], 1] : [1, 1, 1, 1], [0, 0, 0, 0])
            .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer({ resolveWithObject: true });
          return { input: piece.data, left: Math.round((cx + MOUNT_ROOM) * S - piece.info.width / 2), top: Math.round((cy + MOUNT_ROOM) * S - piece.info.height / 2) };
        }),
      );
      const lit = Buffer.from(paper);
      if (night)
        for (let i = 0; i < lit.length; i += 4) for (let k = 0; k < 3; k++) lit[i + k] = Math.round(lit[i + k] * PAPER_NIGHT[k]);
      const blank = { create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } };
      const [paperPng, tapePng] = await Promise.all([
        sharp(blank).composite([...shadows, { input: lit, raw: { width: W, height: H, channels: 4 } }]).raw().toBuffer(),
        sharp(blank).composite(laid).raw().toBuffer(),
      ]);
      for (const o of [out, tapeOut]) mkdirSync(o.replace(/\/[^/]*$/, ""), { recursive: true });
      await Promise.all([
        sharp(paperPng, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out),
        sharp(tapePng, { raw: { width: W, height: H, channels: 4 } }).png().toFile(tapeOut),
      ]);
    }
  }
};

// The project print's inner edge (round 10), brushed rather than ruled
// (cyanotype-edge.mjs says how; cyanotype.css .screen-face lays it as a mask
// over the print, so the mount's cream paper shows through it)
const EDGE_RECIPE = new URL("./cyanotype-edge.mjs", import.meta.url).pathname;
const printEdge = async () => {
  const out = raw("print-edge");
  if (!stale(out, RECIPE) && !stale(out, EDGE_RECIPE)) return;
  const { data, info } = await edgeMask({ smoothstep, wobble, lowField });
  await write("print-edge", data, info);
};

// The print's generic ornaments (cyanotype-ornaments.mjs): gears, centre lines,
// a dimension, registration marks, for the blue beside the home page's intro
// sheet. Drawn as vector linework, then printed: the white of the print takes
// a mottle (a line is not even where the exposure is not) and chips, so it
// reads as the photogram's own linework and not as vector. Alpha only: the
// page lays it as a mask in the finish's chalk.
const ORNAMENTS_RECIPE = new URL("./cyanotype-ornaments.mjs", import.meta.url).pathname;
const ornaments = async () => {
  const out = raw("ornaments");
  if (!stale(out, RECIPE) && !stale(out, ORNAMENTS_RECIPE)) return;
  const { w, h, scale } = ORNAMENTS;
  const [W, H] = [w * scale, h * scale];
  const drawn = await sharp(Buffer.from(ornamentSvg()), { density: 72 }).ensureAlpha().raw().toBuffer();
  const [mottle, chips] = await Promise.all([lowField(W, H, 38, 91), lowField(W, H, 2, 93)]);
  const px = Buffer.alloc(W * H * 4, 255);
  for (let i = 0; i < W * H; i++) {
    const a = drawn[i * 4 + 3] / 255;
    // the linework's strength wanders with the exposure, and here and there a
    // fleck of it is missing
    const keep = 1 - 0.34 * smoothstep(0.1, 1.2, -mottle[i]) - 0.55 * smoothstep(1.35, 1.9, chips[i]);
    px[i * 4 + 3] = Math.round(255 * a * Math.min(1, Math.max(0, keep)));
  }
  await write("ornaments", px, { width: W, height: H, channels: 4 });
};

// The fern printed on the launch page's cream band, at its left: the
// original's own pixels (a blue photogram on the band's paper), keyed off the
// paper into the print's blue, so it lies on the page's own paper, in either
// finish. Where the paper is darkest in the original (its ground) is clear,
// where the blue is deepest it is solid, the fern's pale veins between.
const FERN = { from: "art/originals/cyanotype-launch.webp", box: [0, 700, 236, 241], paper: 218, ink: 62, blue: [18, 52, 104] };
const fernBand = async () => {
  const out = raw("fern-band");
  if (!stale(out, FERN.from) && !stale(out, RECIPE)) return;
  const { data, info } = await sharp(FERN.from).extract({ left: FERN.box[0], top: FERN.box[1], width: FERN.box[2], height: FERN.box[3] }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const l = lumaOf(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    const t = smoothstep(0.08, 0.86, (FERN.paper - l) / (FERN.paper - FERN.ink));
    px.set(FERN.blue, i * 4);
    px[i * 4 + 3] = Math.round(t * 255);
  }
  await write("fern-band", px, { width: info.width, height: info.height, channels: 4 });
};

// The phone's cream strip (cyanotype.css .showcase::before): the original's
// own band of paper with its three drawings in blue (a gear, a keycap, a fern
// of the phone mock, below its torn edge), cut to a strip whose top and
// bottom edges are torn as the cards' paper is, the cut running off at its
// sides (the page lays it the screen's width). By night the paper is the
// cards' lamplit paper.
const PHONE_STRIP = { from: "art/originals/cyanotype-phone.webp", box: [8, 1566, 883, 184], seed: 71 };
const stripPhone = async () => {
  const outs = [raw("strip-phone-day"), raw("strip-phone-night")];
  if (!outs.some((o) => stale(o, PHONE_STRIP.from) || stale(o, RECIPE))) return;
  const [x, y, w, h] = PHONE_STRIP.box;
  const { data } = await sharp(PHONE_STRIP.from).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [top, bot] = [wobble(w, PHONE_STRIP.seed, [[110, 5], [31, 3], [9, 1.3]]), wobble(w, PHONE_STRIP.seed + 1, [[110, 5], [31, 3], [9, 1.3]])];
  const fibre = await sharp(noiseOf(w * h, PHONE_STRIP.seed + 2), { raw: { width: w, height: h, channels: 1 } }).blur(1).extractChannel(0).raw().toBuffer();
  const day = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const d = Math.min(r - 5 - top[c], h - 1 - r - 5 - bot[c]) + (fibre[r * w + c] - 128) * 0.03;
      const a = smoothstep(-0.8, 1.6, d);
      const rim = (1 - smoothstep(0, 7, d)) * (0.5 + 0.5 * smoothstep(110, 150, fibre[r * w + c]));
      for (let k = 0; k < 3; k++) day[(r * w + c) * 4 + k] = Math.round(data[(r * w + c) * 3 + k] * (1 - rim) + RIM[k] * rim);
      day[(r * w + c) * 4 + 3] = Math.round(a * 255);
    }
  const night = Buffer.from(day);
  for (let i = 0; i < night.length; i += 4) for (let k = 0; k < 3; k++) night[i + k] = Math.round(night[i + k] * PAPER_NIGHT[k]);
  await write("strip-phone-day", day, { width: w, height: h, channels: 4 });
  await write("strip-phone-night", night, { width: w, height: h, channels: 4 });
};

// The print on the page's own lettering (cyanotype-type.mjs says what it is):
// the tiles are written as raws, and cut by the build (kit.cuts).
const TYPE_RECIPE = new URL("./cyanotype-type.mjs", import.meta.url).pathname;
const typeTile = async () => {
  if (!(stale(raw("type-day"), RECIPE) || stale(raw("type-day"), TYPE_RECIPE))) return;
  for (const { name, data, info } of typeTiles({ noiseOf, smoothstep })) await write(name, data, info);
};

// Night: the same print after dark, under the lamp (the build's falloff and
// warm grade then light it): the blue toward ink, and its whites, the
// photograms, the chalk and the gears, dimmed less than the blue (a lamp
// finds the pale shapes), so they still read across the dark print
const NIGHT = { gain: [0.37, 0.41, 0.48], lift: 0.95, from: 0.3, to: 0.75 };
// the desk lamp off the upper left, and its warmth on the pale shapes (the
// scene step's falloff and grade, below)
const LAMPLIGHT = { at: [0.1, 0.05], reach: [1.7, 1.5], floor: 0.74, tint: [1.16, 1.07, 0.94] };
const WARM = [1.25, 1.1, 0.8];
const nightOf = async (from, to) => {
  const src = raw(from);
  if (!existsSync(src) || !stale(raw(to), src)) return;
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const p = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const lift = 1 + NIGHT.lift * smoothstep(NIGHT.from, NIGHT.to, p);
    for (let k = 0; k < 3; k++) data[i + k] = Math.min(255, Math.round(data[i + k] * NIGHT.gain[k] * lift));
  }
  await write(to, data, info);
};

// The phone's print (cyanotype.css, a phone's first screen): the phone
// original's picture with the site painted out, at its own proportions (a
// tall sheet, not the 16:9's): its ground laid back in (sky, as the others'),
// then onto the ramp. The page is set against it at the mock's own
// coordinates, from the top edge down, so the print is the mock's frame
// exactly (its fern runs off the top as the mock's does) and is not painted on
// past its sides or top. Past its foot it is carried on (PHONE_FOOT): the
// print is fixed to the screen's frame, and a phone taller than the mock's
// sheet would show the scene's flat ground under it, a different blue, as a
// band. It is the print's own foot mirrored (the foot is plain field: its
// grid rules and crosses carry on through the fold, and nothing there has a
// handedness). Its night is graded as the home page's is, under the same
// lamp: the blue toward ink, the whites dimmed and warmed, deeper toward the
// far corner (the scene step's own grade, which a cut does not get).
const PHONE_FOOT = 520;
/** A W x H RGB print with its last `rows` rows mirrored on below it. */
const mirrorFoot = (print, W, H, rows) => {
  const out = Buffer.alloc(W * (H + rows) * 3);
  print.copy(out, 0, 0, W * H * 3);
  for (let y = 0; y < rows; y++) print.copy(out, (H + y) * W * 3, (H - 1 - y) * W * 3, (H - y) * W * 3);
  return out;
};
/** The phone's print after dark (a W x H RGB print): the home page's grade. */
const phoneNight = (sheet, W, H) => {
  const night = Buffer.from(sheet);
  for (let i = 0; i < night.length; i += 3) {
    const l = lumaOf(night[i], night[i + 1], night[i + 2]) / 255;
    const lift = 1 + NIGHT.lift * smoothstep(NIGHT.from, NIGHT.to, l);
    const q = i / 3;
    const [u, v] = [((q % W) / W - LAMPLIGHT.at[0]) / LAMPLIGHT.reach[0], (Math.floor(q / W) / H - LAMPLIGHT.at[1]) / LAMPLIGHT.reach[1]];
    const lit = 1 - smoothstep(0, 1, Math.hypot(u, v));
    const f = LAMPLIGHT.floor + (1 - LAMPLIGHT.floor) * lit;
    for (let k = 0; k < 3; k++) {
      const warm = 1 + (WARM[k] - 1) * l;
      night[i + k] = Math.min(255, Math.round(sheet[i + k] * NIGHT.gain[k] * lift * warm * f * (1 + (LAMPLIGHT.tint[k] - 1) * lit)));
    }
  }
  return night;
};
// (the phone's clean ground, plate-phone-ground-*: the print with everything
// drawn on it taken out, as the other prints' (cyanotype-ground.mjs), cut at
// the same size and laid fixed under "Try it live", so the outlined call is
// open onto the print's blue and grain and no key of the board behind it
// shows through)
const phone = async () => {
  const [core, out, ground] = [raw("sky-core-phone"), raw("plate-phone-day"), raw("plate-phone-ground-day")];
  if (!existsSync(core) || !(stale(out, core) || stale(out, RECIPE) || stale(out, KEYBOARD_RECIPE) || stale(ground, out) || stale(ground, GROUND_RECIPE))) return;
  const { data: sheet, info } = await sharp(core).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bare = Buffer.from(sheet); // (before its keyboard: the ground is built from the print without it)
  await paintKeyboard(sheet, info.width, info.height, PRINTS.phone.board);
  const [W, H] = [info.width, info.height];
  const geo = { width: W, height: H + PHONE_FOOT, channels: 3 };
  await write("plate-phone-day", mirrorFoot(await duotone(sheet), W, H, PHONE_FOOT), geo);
  await write("plate-phone-night", mirrorFoot(phoneNight(sheet, W, H), W, H, PHONE_FOOT), geo);
  const clean = groundOf(await duotone(bare), W, H).data;
  console.log("plate-phone-ground: the clean ground");
  await write("plate-phone-ground-day", mirrorFoot(clean, W, H, PHONE_FOOT), geo);
  await write("plate-phone-ground-night", mirrorFoot(phoneNight(clean, W, H), W, H, PHONE_FOOT), geo);
};

// The cards' screens: their bezel and the grain of their paper (the page
// lays both: cyanotype.css; cyanotype-screen.mjs says what each is)
const SCREEN_RECIPE = new URL("./cyanotype-screen.mjs", import.meta.url).pathname;
const screens = async () => {
  for (const finish of ["day", "night"]) {
    if (stale(raw(`screen-bezel-${finish}`), RECIPE) || stale(raw(`screen-bezel-${finish}`), SCREEN_RECIPE)) {
      const { data, info } = await bezel(finish);
      await write(`screen-bezel-${finish}`, data, info);
    }
    if (stale(raw(`screen-grain-${finish}`), SCREEN_RECIPE)) {
      const { data, info } = await grain(finish, noiseOf);
      await write(`screen-grain-${finish}`, data, info);
    }
  }
};

const cleaned = cleans();
await Promise.all([
  cleaned,
  frame(),
  notes(),
  screens(),
  paperTile(),
  slip(),
  stock(),
  tapeClear().then(mounts),
  printEdge(),
  ornaments(),
  fernBand(),
  stripPhone(),
  typeTile(),
  // the home print and the two page prints: the mock's ground laid into the
  // plate, the margins painted on, all onto the ramp (day), then each one's
  // night
  ...["home", "project", "launch"].map((id) =>
    cleaned
      .then(() => sky(PRINTS[id]))
      .then(() => bleedRef(PRINTS[id]))
      .then(() => bleed(PRINTS[id]))
      .then(() => Promise.all([nightOf(PRINTS[id].out, PRINTS[id].night), nightOf(groundName(PRINTS[id].out), groundName(PRINTS[id].night))])),
  ),
  cleaned.then(() => sky(PRINTS.phone)).then(phone),
]);


// a label's focus: a grease-pencil rule laid inside its edge, with ink
// keylines either side (yellow alone would not hold on white paper). Ruled
// square to the label's bounds (--ring-radius), not along its deckle: a rule
// following it steps where the 9-slice stretches it.
const LABEL_FOCUS = ["--ring=10:19", "--ring-radius=1", "--crown=0.12", "--halo=8.5:10,19:20.5", "--halo-color=142033"];
// labels lit by the lamp cast deeper shadows on the darker print
const NIGHT_SHADOW = {
  normal: ["2:5:5:0.45", "0:1:1.2:0.5"],
  hover: ["6:14:7:0.66", "1:3:2:0.42"],
  pressed: ["1:2:2.5:0.38", "0:1:1:0.55"],
};

// The cards: sheets of off-white cotton paper with a soft deckle all round
// (card-paper). The deckle is the art; the paper inside it is the page's own
// tile (paper-*.webp, kit.css --plate-fill), so its fibres keep their scale
// on a card and on a page-wide sheet alike. `frame` is where solid paper
// begins on each side (the deckle's deepest bite, measured on the base) and
// the art hands over to the page's paper over `feather` px past it
// (scripts/framed-pane.mjs). Based at 410, so a card (about 340 wide) hangs
// near the art's own size, its deckle a few px deep as the original's.
//
// No two neighbouring sheets are the same sheet: one paper, its rails rebuilt
// from pieces of themselves with four seeds (scripts/mitre.mjs
// lengthenRails), two of them hung turned end for end (`turn`: paper lit
// evenly has no up), so each has its own deckle; the page hangs the four in
// turn (cyanotype.css). The rails are made to tile (tileRails; a stretch
// smears the fibres into streaks; cyanotype.css --plate-repeat).
const PANE = { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 };
const TILED = { sides: ["t", "r", "b", "l"], overlap: 32 };
const SHEET = { rivets: false, glass: PANE, width: 410, feather: 4, tileRails: TILED, src: "card-stock" };
const turned = ({ t, r, b, l }) => ({ t: b, r: l, b: t, l: r });
// the art kept as far in as the stock's stain runs, the paper tile inside
const EDGE = { t: 20, r: 20, b: 20, l: 20 };
// short, broad pieces of masking tape across a sheet's top corners, most of
// each on the sheet, each sheet taped by hand (the pieces' lengths and angles
// differ, and none that meet across a gutter lie at mirrored angles). The
// piece (tape-clear) is translucent by its own alpha: the paper and the print
// show through. [angle, length, in from the side, down from the top]
const tape = (pieces) =>
  pieces.map(([angle, size, x, y], i) => ({
    src: "tape-clear",
    size,
    corner: i ? "tr" : "tl",
    at: [x, y],
    angle: i ? -angle : angle,
    aspect: 2.2,
    // (a film's contact line only: a shadow under the whole piece would show
    // through it as a dirty patch)
    shadow: [1, 1, 1.4, 0.2],
  }));
// the four sheets the page hangs in turn, each a way up, a seed and its tape
const SHEETS = [
  { id: "", frame: EDGE, seed: 3, decal: tape([[28, 62, -15, -14], [25, 58, -12, -13]]) },
  { id: "-b", frame: turned(EDGE), turn: true, seed: 5, decal: tape([[55, 60, -13, -16], [50, 64, -16, -17]]) },
  { id: "-c", frame: EDGE, seed: 11, decal: tape([[22, 62, -14, -12], [30, 56, -11, -14]]) },
  { id: "-d", frame: turned(EDGE), turn: true, seed: 17, decal: tape([[58, 64, -15, -17], [55, 58, -12, -15]]) },
];
// rails about as long as a card's side, so the page's whole-number repeat of
// them (--plate-repeat: round) keeps every sheet within about 0.75-1.3 of the
// drawn size
const LONG = { length: [505, 505], pool: true, splice: TILED.sides };
// a page's own sheets (a section, a detail page's opening, its foot) run the
// column's width: two wide sheets, their long rails a page's width, hang in
// turn there (cyanotype.css, from 900px). Never pressed: resting and flat.
// By day they are the original's warmer cream (231, 225, 212 and 224, 219, 209
// on its project and launch panels, where the cards' stock reads 234, 232,
// 225): the art graded by WARM_SHEET, its paper the matching fill (paper-warm-
// day, below). By night the lamp (both) warms every sheet alike.
const WARM_SHEET = [0.975, 0.955, 0.935];
const WIDE = { lengthen: { length: [1100, 505], pool: true, splice: TILED.sides }, states: ["normal", "flat"], gain: WARM_SHEET };
// a strip (masthead, shelf heads, feet, picker) is a sheet without tape, its
// sides cut to a strip's height, its rails from the paper's calmer half
const STRIP = { lengthen: { length: [960, 120], pool: true, quiet: { share: 0.5, depth: 10 }, splice: TILED.sides }, states: ["normal"] };
// focus: the grease-pencil rule, on the paper just inside its deckle
const MARK = { side: "pane", width: 7, color: "f2c14e", grain: 0.35 };

const both = (spec, name) => [
  { ...spec, name: `${name.replace("$", "day")}` },
  { ...spec, name: `${name.replace("$", "night")}`, gain: LAMP, ...(spec.light && { light: { color: "ffd9a0", alpha: 0.12 } }) },
];

// the scene's finishes: each print's day and night, and the same for its
// clean ground (ground-project-night ...), which is graded as the print is
const PRINT_FINISHES = ["day", "night", "project-day", "project-night", "launch-day", "launch-night"];
const GROUND_FINISHES = PRINT_FINISHES.map((f) => `ground-${f}`);
const NIGHTS = [...PRINT_FINISHES, ...GROUND_FINISHES].filter((f) => f.endsWith("night"));

const kit = {
  raw: "cyanotype",
  sheet: {
    // the pane's sides on the lossy block grid (scripts/build-kit.mjs)
    alignPane: true,
    // a thin sheet taped flat to the print: a short, tight shadow (the
    // original's cards cast almost none, no diffuse halo)
    normal: ["1:3:4:0.3", "0:1:1.5:0.42"],
    // lifted off the print: a longer, wider, softer shadow
    hover: ["8:16:14:0.42", "2:4:4:0.26"],
    // pressed flat to the print (and set down a hair, cyanotype.css
    // --plate-press-shift): the shadow closes to a line under the deckle
    pressed: ["0:1:1.5:0.22", "0:0.5:1:0.5"],
    flat: ["1:2.5:3.5:0.26", "0:0.8:1.2:0.4"],
    hoverFlags: ["--catch=0.3", "--catch-width=10", "--sheen=0", "--light=fffaf0"],
    pressedFlags: ["--catch=0", "--dim=1"],
  },
  sheets: [
    ...SHEETS.flatMap(({ id, seed, ...s }, i) =>
      both({ ...SHEET, ...s, lengthen: { ...LONG, seed }, fillet: MARK, ...(i ? {} : { light: { color: "ffffff", alpha: 0.05 } }) }, `sheet-$${id}`),
    ),
    // the home page's cards: the same four sheets without their tape (each
    // card is taped once, at a corner of its own: cyanotype.css .card-mark)
    ...SHEETS.flatMap(({ id, seed, ...s }) => both({ ...SHEET, ...s, decal: null, lengthen: { ...LONG, seed }, fillet: MARK }, `sheet-$-card${id}`)),
    ...[SHEETS[1], SHEETS[2]].flatMap(({ seed, id, ...s }) =>
      both({ ...SHEET, ...s, ...WIDE, lengthen: { ...WIDE.lengthen, seed: seed + 20 } }, `sheet-$-w${id}`),
    ),
    ...[SHEETS[0], SHEETS[3]].flatMap(({ id, seed, ...s }) =>
      both({ ...SHEET, ...s, decal: null, ...STRIP, lengthen: { ...STRIP.lengthen, seed } }, `sheet-strip-$${id}`),
    ),
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    hover: ["6:14:7:0.5", "1:3:2:0.28"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
    hoverFlags: ["--catch=0.4", "--catch-width=6", "--sheen=0.2"],
    pressedFlags: ["--catch=0", "--dim=0.88"],
  },
  // the keys: labels of the cards' cream paper, typed in Prussian ink; the
  // call (the original's "Join the alpha") a slab of it cut clean (slip); a
  // key that is neither is ruled on the print in its ink instead
  // (cyanotype.css)
  tiles: [
    { name: "tile-day", src: "tile-day", mitre: true, gain: 0.92, ring: "f2c14e", focusFlags: LABEL_FOCUS },
    { name: "tile-night", src: "tile-day", mitre: true, gain: LAMP.map((g) => g * 0.92), ring: "f2c14e", focusFlags: LABEL_FOCUS, shadow: NIGHT_SHADOW },
    { name: "tile-signal", src: "slip", gain: [1.05, 1.04, 1.03], ring: "f2c14e", focusFlags: LABEL_FOCUS },
    { name: "tile-signal-night", src: "slip", gain: LAMP.map((g) => g * 0.95), ring: "f2c14e", focusFlags: LABEL_FOCUS, shadow: NIGHT_SHADOW },
  ],
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-day", gain: LAMP },
  ],
  // status heads: paper dots; the white one ringed in ink, as it sits on
  // the white paper; the others dyed the print's own tints (no green, coral
  // or yellow grows on a cyanotype): active a pale Prussian, paused the
  // paper's cream, alpha open an ice white. Gains are measured against the
  // generated heads' mean colours (green 174,190,150; amber 220,114,89;
  // signal 235,192,92)
  pins: {
    src: "pins",
    rim: { brass: { color: "142033", width: 4 } },
    gain: { green: [0.75, 0.87, 1.37], amber: [1.02, 1.93, 2.29], signal: [0.87, 1.19, 2.67] },
  },
  tapes: [
    { name: "tape-day", src: "tape-day" },
    { name: "tape-night", src: "tape-day", gain: LAMP },
    // inline code: a straight-cut slip of white card, a shade down
    { name: "chip-day", src: "chip-day", gain: 0.92 },
    { name: "chip-night", src: "chip-day", gain: LAMP.map((g) => g * 0.92) },
  ],
  // the piece of tape over the window's corner and on each home card
  // (cyanotype.css), squeezed to a stubby piece as the sheets' are
  props: [
    { name: "tape-bit-day", srcs: [{ src: "tape-clear" }], resize: { width: 220, height: 100, fit: "fill" }, pad: 10, shadow: ["0.8:1.5:2.5:0.16", "0:0.4:0.8:0.2"] },
    { name: "tape-bit-night", srcs: [{ src: "tape-clear", gain: LAMP }], resize: { width: 220, height: 100, fit: "fill" }, pad: 10, shadow: ["0.8:1.5:2.5:0.22", "0:0.4:0.8:0.26"] },
  ],
  // the cards' paper, tiled by the page inside their deckle, at the sheets'
  // own mean (by night, under the LAMP), only its grain kept (anything
  // broader repeats as a cloud from tile to tile), and that raised to the
  // original's fibre
  fills: [
    { name: "paper-day", src: "paper-tile", size: 768, alpha: 1, highpass: 48, mean: "ebe9e2", gain: 1.2 },
    { name: "paper-night", src: "paper-tile", size: 768, alpha: 1, highpass: 48, mean: "d3c5a7", gain: 1.4 },
    // the other pages' sheets by day: the cards' paper warmed (WARM_SHEET)
    { name: "paper-warm-day", src: "paper-tile", size: 768, alpha: 1, highpass: 48, mean: "e5e0d3", gain: 1.2 },
  ],
  // the notes, keyed off the blue as ink on white (above), lifted to white:
  // the page lays them as masks in the finish's chalk
  inks: Object.entries(NOTES).map(([name, { box }]) => ({ name, src: name, width: box[2] * 2, tint: "ffffff", page: true })),
  // the print's torn edge, at the original's size (cyanotype.css body::before)
  cuts: [
    { name: "frame-day", src: "frame-day", width: 1672 },
    { name: "frame-night", src: "frame-night", width: 1672 },
    // the sun-print in the lettering (typeTile)
    { name: "type-day", src: "type-day", width: TYPE.size },
    { name: "type-night", src: "type-night", width: TYPE.size },
    { name: "type-clean-day", src: "type-clean-day", width: TYPE.size },
    { name: "type-clean-night", src: "type-clean-night", width: TYPE.size },
    // the phone's print (phone, above)
    { name: "plate-phone-day", src: "plate-phone-day", width: 900 },
    { name: "plate-phone-night", src: "plate-phone-night", width: 900 },
    // and its clean ground, under "Try it live" (phone)
    { name: "plate-phone-ground-day", src: "plate-phone-ground-day", width: 900 },
    { name: "plate-phone-ground-night", src: "plate-phone-ground-night", width: 900 },
    // the phone's cream strip (stripPhone)
    { name: "strip-phone-day", src: "strip-phone-day", width: PHONE_STRIP.box[2] },
    { name: "strip-phone-night", src: "strip-phone-night", width: PHONE_STRIP.box[2] },
    // the cards' screens: the bezel (9-slice) and the grain of their paper (screens)
    ...["day", "night"].flatMap((f) => [
      { name: `screen-bezel-${f}`, src: `screen-bezel-${f}`, width: 2 * BEZEL.slice + BEZEL.side },
      { name: `screen-grain-${f}`, src: `screen-grain-${f}`, width: 512 },
    ]),
    // the blue beside the home page's intro sheet (ornaments)
    { name: "ornaments", src: "ornaments", width: ORNAMENTS.w * ORNAMENTS.scale },
    // the project print's brushed edge (printEdge)
    { name: "print-edge", src: "print-edge", width: PRINT_EDGE.w * PRINT_EDGE.s },
    // the fern on the launch page's band (fernBand)
    { name: "fern-band", src: "fern-band", width: FERN.box[2] * 2 },
    // the mounts the project page's figure and the launch page's window lie
    // on (mounts, above)
    ...Object.entries(MOUNTS).flatMap(([id, { size: [w] }]) =>
      ["day", "night"].flatMap((f) =>
        ["mount", "mount-tape"].map((kind) => ({ name: `${kind}-${id}-${f}`, src: `${kind}-${id}-${f}`, width: (w + 2 * MOUNT_ROOM) * MOUNT_S })),
      ),
    ),
  ],
  // The print itself: the original with the site painted out (sky-core,
  // from plate-bleed, an edit of plate-day: art/prompts/cyanotype/
  // layer-sky-day.txt), its torn edge taken off too (the page lays its own
  // round the viewport), painted on past its edges (layer-sky-day): one
  // layer. Night is the same print after dark (nightOf, above): the blue
  // toward ink, its whites dim and warmed by the lamp, a little deeper
  // toward the far corner.
  // The project page's and the launch page's prints (PRINTS, above: each its
  // original's picture, props and all) are built beside it as more finishes
  // of the one layer, so they are registered and lit as the home page's:
  // scene/project-day/sky.webp, scene/launch-night/sky.webp ... (the flat
  // scene-<finish>.webp is --k-scene-flat, which only the home's prints are).
  scene: {
    finishes: [...PRINT_FINISHES, ...GROUND_FINISHES],
    flat: ["day", "night"],
    layers: ["sky"],
    // the print painted on past the mock's edges (bleed, above)
    bleed: { x: BLEED, bottom: BLEED },
    falloff: Object.fromEntries(NIGHTS.map((f) => [f, LAMPLIGHT])),
    grade: Object.fromEntries(NIGHTS.map((f) => [f, { warm: WARM }])),
  },
};

export default kit;
