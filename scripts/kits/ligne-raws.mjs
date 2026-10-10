// Ligne Claire raws cut from the original mock (art/raw/originals/ligne.png)
// and its plate, for scripts/kits/ligne.mjs:
//
// The home page's hero picture (art/raw/ligne/hero-day), in two steps around
// one generation:
//   node scripts/kits/ligne-raws.mjs ref       writes hero-day/ref.png
//   (generate: art/prompts/ligne/hero-day.txt on ref.png -> hero-day/generated.png)
//   node scripts/kits/ligne-raws.mjs compose   writes hero-day/hero-day.png
//   (by night: art/prompts/ligne/hero-night.txt on hero-day.png -> hero-night)
//
// The wordmark (art/raw/ligne/wordmark): the mock's own brushed "chong",
// lifted off the band as an ink mask (the page fills it with its ink, the
// name itself kept in the page as text):
//   node scripts/kits/ligne-raws.mjs wordmark
//
// The phone's hero (art/raw/ligne/hero-{day,night}-phone): the same picture
// with its moon painted out, since a phone's stacked panel sets its buttons
// across the sky where the moon hangs:
//   node scripts/kits/ligne-raws.mjs phone
//
// then: node scripts/build-kit.mjs ligne
//
// The picture is the original mock's establishing shot, from its plate
// (plate-day: the mock with its lettering painted out), extended upward with
// sky so that the taller hero panel shows more of it, not a crop.
//
// `ref`: the plate's panel interior (inside its ink border), its sky graded to
// the original's (the plate's edit came back a more saturated cyan), set at
// the foot of a 16:9 canvas whose top is magenta, for the generator to paint.
//
// `compose`: the generator redrew the planet larger and higher, and the tall
// cliff's upper rocks its own way. The plate's panel is kept below the seam
// (it registers with the mock), the generated planet is painted out of the
// sky, the generated sky is graded to the plate's at the seam, the cliff is
// the generated one above faded into the plate's below, and the planet's cap
// the old border cut is drawn from the generated disc scaled onto the
// plate's. The constants are measured from these two frames; a new
// generation means measuring them again.
import fs from "node:fs";
import sharp from "sharp";

const RAW = "art/raw/ligne";
const W = 1672;
const H = 941;
const PANEL = { left: 27, top: 110, width: 1618, height: 490 }; // the plate's interior
const SEAM = 440; // under the plate's top rows (the old border's antialiasing)
const FEATHER = 22;
const GEN_PLANET = { cx: 978, cy: 468.5, r: 172.5 };
// fitted to the plate planet's outline under the old border, which cut its
// top few rows
const PLATE_PLANET = { cx: 977.5, cy: 573.6, r: 142.5 };
const CLIFF = { x: 1525, fadeFrom: 480, fadeTo: 530 };

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const byte = (v) => Math.round(clamp(v, 0, 255));
const smooth = (a, b, t) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const at = (x, y) => (y * W + x) * 3;
// how surely a pixel is the pale blue sky (blue well over red)
const skyness = (p, i) => clamp((p[i + 2] - p[i] - 40) / 40);
const rgb = async (file) => (await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data;

// the plate's sky toward the original's, by how blue a pixel is
const gradeSky = (px) => {
  const out = Buffer.from(px);
  for (let i = 0; i < out.length; i += 3) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const w = clamp((b - r - 20) / 40);
    if (!w) continue;
    const target = [0.9 * r + 34, 1.09 * g - 24, 0.95 * b];
    for (let k = 0; k < 3; k++) out[i + k] = byte(px[i + k] + w * (target[k] - px[i + k]));
  }
  return out;
};

const ref = async () => {
  const { data, info } = await sharp(`${RAW}/plate-day/plate-day.png`)
    .removeAlpha()
    .extract(PANEL)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const h = Math.round((PANEL.height * W) / PANEL.width);
  const panel = await sharp(gradeSky(data), { raw: { width: info.width, height: info.height, channels: 3 } })
    .resize({ width: W, height: h })
    .png()
    .toBuffer();
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ff00ff" } })
    .composite([{ input: panel, left: 0, top: H - h }])
    .png()
    .toFile(`${RAW}/hero-day/ref.png`);
};

// each row through the generated planet's disc filled from the sky either
// side of it
const paintOutPlanet = (gen) => {
  const o = Buffer.from(gen);
  const { cx, cy, r } = GEN_PLANET;
  for (let y = Math.floor(cy - r - 4); y < SEAM + FEATHER + 4; y++) {
    const half = Math.sqrt(Math.max(0, (r + 4) ** 2 - (y - cy) ** 2));
    if (!half) continue;
    const [x0, x1] = [Math.floor(cx - half) - 3, Math.ceil(cx + half) + 3];
    for (let x = x0 + 1; x < x1; x++) {
      const t = (x - x0) / (x1 - x0);
      for (let k = 0; k < 3; k++) o[at(x, y) + k] = Math.round(gen[at(x0, y) + k] * (1 - t) + gen[at(x1, y) + k] * t);
    }
  }
  return o;
};

// the generated sky graded to the plate's at the seam (the generator lifted
// it a touch), per channel, where it is sky
const gradeToSeam = (px, plate) => {
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = SEAM; y < SEAM + 8; y++)
    for (let x = 40; x < 1500; x++) {
      const i = at(x, y);
      if (skyness(plate, i) < 1 || skyness(px, i) < 1) continue;
      for (let k = 0; k < 3; k++) sum[k] += plate[i + k] - px[i + k];
      n++;
    }
  const off = sum.map((s) => (n ? s / n : 0));
  const o = Buffer.from(px);
  for (let i = 0; i < o.length; i += 3) {
    const s = skyness(px, i);
    for (let k = 0; k < 3; k++) o[i + k] = byte(px[i + k] + s * off[k]);
  }
  return o;
};

const inPlatePlanet = (x, y) => Math.hypot(x - PLATE_PLANET.cx, y - PLATE_PLANET.cy) <= PLATE_PLANET.r + 2;

// how much of the plate shows at a pixel: the planet's columns from its top,
// the cliff faded in over its rows, elsewhere from the seam, feathered into
// the sky where both are sky
const plateAlpha = (x, y, i, sky, plate) => {
  if (x >= CLIFF.x) return smooth(CLIFF.fadeFrom, CLIFF.fadeTo, y);
  if (inPlatePlanet(x, y) && y > PLATE_PLANET.cy - PLATE_PLANET.r + 5) return 1;
  if (y < SEAM) return 0;
  if (y >= SEAM + FEATHER) return 1;
  return skyness(plate, i) === 1 && skyness(sky, i) === 1 ? (y - SEAM) / FEATHER : 1;
};

const layPlate = (sky, plate) => {
  const o = Buffer.from(sky);
  for (let y = SEAM - 6; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      const a = plateAlpha(x, y, i, sky, plate);
      for (let k = 0; k < 3; k++) o[i + k] = Math.round(plate[i + k] * a + sky[i + k] * (1 - a));
    }
  return o;
};

// the plate planet's cap, cut by the old border, from the generated disc
// scaled onto the plate's (its outline and bands), antialiased at the rim
const drawCap = (px, gen) => {
  const o = Buffer.from(px);
  const { cx, cy, r } = PLATE_PLANET;
  const sc = GEN_PLANET.r / r;
  for (let y = Math.floor(cy - r - 3); y <= cy - r + 6; y++)
    for (let x = Math.floor(cx - r); x < cx + r; x++) {
      const cover = clamp(r + 1.5 - Math.hypot(x - cx, y - cy));
      if (!cover) continue;
      const j = at(Math.round(GEN_PLANET.cx + (x - cx) * sc), Math.round(GEN_PLANET.cy + (y - cy) * sc));
      const i = at(x, y);
      for (let k = 0; k < 3; k++) o[i + k] = Math.round(o[i + k] + cover * (gen[j + k] - o[i + k]));
    }
  return o;
};

const compose = async () => {
  const [gen, plate] = await Promise.all([rgb(`${RAW}/hero-day/generated.png`), rgb(`${RAW}/hero-day/ref.png`)]);
  const sky = gradeToSeam(paintOutPlanet(gen), plate);
  const out = drawCap(layPlate(sky, plate), gen);
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${RAW}/hero-day/hero-day.png`);
};

// The wordmark: the mock's lettering inside the band's line (x 62-243,
// y 20-92), its ink as coverage over the band's blue by luminance, drawn up
// four times and its edge set crisp again (a smoothstep over the coverage),
// so the mask holds its brushed edge at any size the page lays it.
const WORDMARK = { left: 62, top: 20, width: 182, height: 73 };
const BAND_L = 192; // the band's blue
const INK_L = 30;
const UP = 4;
const wordmark = async () => {
  const { data, info } = await sharp("art/raw/originals/ligne.png")
    .removeAlpha()
    .extract(WORDMARK)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cover = Buffer.alloc(info.width * info.height);
  for (let p = 0; p < cover.length; p++) {
    const l = 0.2126 * data[p * 3] + 0.7152 * data[p * 3 + 1] + 0.0722 * data[p * 3 + 2];
    cover[p] = byte((255 * (BAND_L - l)) / (BAND_L - INK_L));
  }
  const up = await sharp(cover, { raw: { width: info.width, height: info.height, channels: 1 } })
    .resize({ width: info.width * UP, height: info.height * UP, kernel: "lanczos3" })
    .blur(0.8)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const rgba = Buffer.alloc(up.length * 4);
  for (let p = 0; p < up.length; p++) rgba[p * 4 + 3] = byte(255 * smooth(0.22, 0.62, up[p] / 255));
  await sharp(rgba, { raw: { width: info.width * UP, height: info.height * UP, channels: 4 } })
    .png()
    .toFile(`${RAW}/wordmark/wordmark.png`);
};

// The phone's hero: the moon (centred at 680,488, 35 across its outline)
// painted out of each finish by filling its rows from the clear sky above
// and below it, column by column (the sky is a vertical grade, and the
// clouds start under 530), so a phone's buttons never cut it in half.
const MOON = { left: 638, right: 722, top: 446, bottom: 530 };
const phone = async () => {
  for (const f of ["day", "night"]) {
    const px = await rgb(`${RAW}/hero-${f}/hero-${f}.png`);
    const o = Buffer.from(px);
    // each end the mean of a few pixels round it, so the sky's grain is
    // not drawn down the rows as streaks
    const mean = (x, y0, y1) =>
      [0, 1, 2].map((k) => {
        let sum = 0;
        let n = 0;
        for (let y = y0; y <= y1; y++)
          for (let dx = -3; dx <= 3; dx++, n++) sum += px[at(x + dx, y) + k];
        return sum / n;
      });
    for (let x = MOON.left; x <= MOON.right; x++) {
      const a = mean(x, MOON.top - 4, MOON.top);
      const b = mean(x, MOON.bottom, MOON.bottom + 4);
      for (let y = MOON.top + 1; y < MOON.bottom; y++) {
        const t = (y - MOON.top) / (MOON.bottom - MOON.top);
        const i = at(x, y);
        for (let k = 0; k < 3; k++) o[i + k] = byte(a[k] + t * (b[k] - a[k]));
      }
    }
    fs.mkdirSync(`${RAW}/hero-${f}-phone`, { recursive: true });
    await sharp(o, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${RAW}/hero-${f}-phone/hero-${f}-phone.png`);
  }
};

const steps = { ref, compose, wordmark, phone };
const step = steps[process.argv[2]];
if (!step) {
  console.error("usage: node scripts/kits/ligne-raws.mjs ref|compose|wordmark|phone");
  process.exit(1);
}
await step();
