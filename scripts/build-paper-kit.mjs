// Build the Paper Diorama raster kit (public/kit/paper) from the raw generations
// in art/raw/diorama/<name>/<name>.png (prompts: art/prompts/diorama/<name>.txt).
//   node scripts/build-paper-kit.mjs
//
// Every asset is trimmed to its paper, resized to a fixed source size (so the
// slice insets in kit.css stay valid if an asset is regenerated), given its
// state art, and then has its cast shadow baked in (scripts/paper-shadow.mjs).
// States come from the normal art (scripts/derive-state.mjs), so a state swap
// never moves an edge: only light and shadow change.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { liftSun } from "./lift-sun.mjs";

const RAW = "art/raw/diorama";
const OUT = "public/kit/paper";
const TMP = "art/raw/diorama/.build";
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const raw = (name) => `${RAW}/${name}/${name}.png`;
const has = (name) => existsSync(raw(name));
const node = (...args) => execFileSync("node", args, { stdio: ["ignore", "ignore", "inherit"] });
const derive = (src, out, mode, ...flags) => node("scripts/derive-state.mjs", src, out, mode, ...flags);
const shadow = (src, out, pad, ambient, contact, ...flags) =>
  node("scripts/paper-shadow.mjs", src, out, `--pad=${pad}`, `--ambient=${ambient}`, `--contact=${contact}`, ...flags);
// the torn rim takes the key light: lit along the top and left, shaded along
// the bottom and right (in place, on a base PNG)
const relight = (path, shade, lift = 0.06) => node("scripts/relight-edge.mjs", path, path, `--shade=${shade}`, `--lift=${lift}`);

/** trim transparent margin, then resize; returns the path of a PNG base */
const base = async (name, resize, { gain = 1 } = {}, out = `${TMP}/${name}.png`) => {
  const g = Array.isArray(gain) ? gain : [gain, gain, gain];
  const trimmed = await sharp(raw(name)).trim({ threshold: 1 }).resize(resize).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // the generator leaves paper a hair translucent (alpha ~253); paper is
  // opaque, and a shadow must not show through it
  const px = trimmed.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 236) px[i + 3] = 255;
    for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] * g[k]));
  }
  const info = await sharp(px, { raw: trimmed.info }).png().toFile(out);
  return { path: out, width: info.width, height: info.height };
};

/** Straighten a tile's long edges across the span a 9-slice stretches.
 * The generated board's top and bottom edges wander by a pixel or two. A
 * 9-slice stretches the middle columns but keeps the corners, so wherever the
 * edge at the slice line differs from the edge just inside it, a 1px step
 * shows: invisible on a plain edge, plain on a focus line drawn along it.
 * Each middle column's top half (and bottom half) is shifted so its edge
 * runs straight from the left slice line to the right one, keeping the
 * paper's texture. */
const straighten = async (path, slice) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const a = (x, y) => data[(y * W + x) * 4 + 3];
  const top = (x) => { for (let y = 0; y < H; y++) if (a(x, y) > 128) return y; return 0; };
  const bot = (x) => { for (let y = H - 1; y >= 0; y--) if (a(x, y) > 128) return y; return H - 1; };
  const [x0, x1] = [slice, W - 1 - slice];
  const line = (f) => (x) => Math.round(f(x0) + ((f(x1) - f(x0)) * (x - x0)) / (x1 - x0));
  const [topAt, botAt] = [line(top), line(bot)];
  const out = Buffer.from(data);
  const mid = H >> 1;
  for (let x = x0 + 1; x < x1; x++) {
    const [dt, db] = [topAt(x) - top(x), botAt(x) - bot(x)];
    for (let y = 0; y < H; y++) {
      const d = y < mid ? dt : db;
      const sy = y - d;
      const o = (y * W + x) * 4;
      if ((y < mid ? sy >= mid : sy < mid) || sy < 0 || sy >= H) {
        // shifted in from the other half or off the canvas: clear above the
        // top edge, board below it (and mirrored at the bottom)
        const src = (Math.min(H - 1, Math.max(0, y < mid ? mid - 1 : mid)) * W + x) * 4;
        data.copy(out, o, src, src + 4);
        if (y < mid ? sy < 0 : sy >= H) out[o + 3] = 0;
      } else data.copy(out, o, (sy * W + x) * 4, (sy * W + x) * 4 + 4);
    }
  }
  await sharp(out, { raw: info }).png().toFile(path);
};

const report = [];

/* ---------- sheets: torn watercolour paper, lifted / flat / focused ---------- */
// Sheet source 1000px wide; kit.css slices it 56px in from the paper edge.
const SHEET_PAD = 96;
const SHEET = {
  normal: ["8:14:18:0.26", "1:2:2.5:0.32"],
  // lifted well clear: a much longer, wider, softer and darker shadow
  // (offset + 2 blur stays inside SHEET_PAD)
  hover: ["16:34:28:0.58", "4:8:8:0.24"],
  // by day the shadow falls on a pale scene, so it is darker to read as far
  hoverDay: ["16:34:28:0.78", "4:8:8:0.32"],
  pressed: ["3:5:8:0.20", "0.5:1:1.5:0.38"],
  // a sheet pinned closer to the scene than its neighbours: a shorter, tighter
  // shadow, so a column of sheets stands at more than one depth
  flat: ["5:9:12:0.22", "0.5:1.5:2:0.34"],
};
// Two finishes. Night is its own paper. Alpenglow, worn by the light rice, is
// the day paper under the cool light of a mountain dusk: the generated day
// sheet with a slight per-channel gain, so it does not warm to pink against
// the rose sky.
const ALPENGLOW = [1.005, 0.995, 1.01];
// A focused sheet lies on an under-sheet in the focus colour, torn to follow
// its deckle about MOUNT px of source outside it, so focus never draws over
// the sheet's pin or its print. At night the under-sheet is a deep
// terracotta, not the peach of the night's focus channel on a tile.
const MOUNT = 14;
const UNDER = { alpenglow: "c4663f", night: "b45a38" };
// The night paper's pale torn fibres show on every side, so its rim takes the
// key light strongly; the day paper's cream rim barely shows, so less.
for (const [finish, src, gain, shade] of [["alpenglow", "sheet-day", ALPENGLOW, 0.2], ["night", "sheet-night", 1, 0.45]]) {
  const name = `sheet-${finish}`;
  if (!has(src)) continue;
  const b = await base(src, { width: 1000 }, { gain }, `${TMP}/${name}.png`);
  relight(b.path, shade);
  const hover = `${TMP}/${name}-hover.webp`;
  derive(b.path, hover, "hover", "--catch=0", "--sheen=0.08");
  shadow(b.path, `${OUT}/${name}-normal.webp`, SHEET_PAD, ...SHEET.normal);
  shadow(hover, `${OUT}/${name}-hover.webp`, SHEET_PAD, ...(finish === "alpenglow" ? SHEET.hoverDay : SHEET.hover));
  shadow(b.path, `${OUT}/${name}-focus.webp`, SHEET_PAD, ...SHEET.normal, `--mount=${MOUNT}:${UNDER[finish]}`);
  shadow(b.path, `${OUT}/${name}-pressed.webp`, SHEET_PAD, ...SHEET.pressed);
  shadow(b.path, `${OUT}/${name}-flat.webp`, SHEET_PAD, ...SHEET.flat);
  report.push(`${name}: paper ${b.width}x${b.height}, pad ${SHEET_PAD}`);
}

/* ---------- tiles: cut mounting board (the site's buttons and key legends) ---------- */
// Tile source 120px tall; kit.css slices it 40px in from the board edge.
const TILE_PAD = 20;
const TILE = {
  normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
  // lifted: the cast shadow falls longer and darker, with a crisp contact
  // line, so the card reads as standing off the sheet
  hover: ["4:10:5:0.46", "1:2.5:1.5:0.34"], // offset + 2 blur stays inside TILE_PAD
  pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
};
// The signal board is printed a shade deeper than generated (gain 0.8) so its
// cream legend holds 4.5:1.
// On the signal card the channel shows the cream core, and its shaded wall
// falls toward the card's own deep terracotta, not black (a shaded cream
// line reads as grey metal).
for (const [name, src, ring, gain, groove] of [
  ["tile-alpenglow", "tile-day", "c4663f", ALPENGLOW, ["--groove=0.45"]],
  ["tile-night", "tile-night", "e58f62", 1, ["--groove=0.45"]],
  ["tile-signal", "tile-signal", "f0e2c8", 0.8, ["--groove=0.3", "--groove-tint=8a3c20"]],
]) {
  if (!has(src)) continue;
  const b = await base(src, { height: 120 }, { gain }, `${TMP}/${name}.png`);
  await straighten(b.path, 40); // kit.css slices the board 40px in
  const st = (m) => `${TMP}/${name}-${m}.webp`;
  // hover lifts the card: its shadow falls longer (TILE.hover) and, raised
  // into the key light, its upper-left bevel catches it: a tight edge, not a
  // soft glow. No sheen on the face: the 9-slice would stretch it into a band
  // (and the board is matte).
  // (the slate night board needs more light to show the same catch)
  derive(b.path, st("hover"), "hover", `--catch=${name === "tile-night" ? 1.1 : 0.75}`, "--catch-width=5", "--sheen=0");
  // focus is a channel cut into the card just inside its edge, in the focus
  // colour, carrying the board's grain and the key light on its walls
  derive(b.path, st("focus"), "focus", "--catch=0", "--sheen=0", "--ring=4:10", `--ring-color=${ring}`, ...groove);
  derive(b.path, st("pressed"), "pressed", "--catch=0.4");
  shadow(b.path, `${OUT}/${name}-normal.webp`, TILE_PAD, ...TILE.normal);
  shadow(st("hover"), `${OUT}/${name}-hover.webp`, TILE_PAD, ...TILE.hover);
  shadow(st("focus"), `${OUT}/${name}-focus.webp`, TILE_PAD, ...TILE.normal);
  shadow(st("pressed"), `${OUT}/${name}-pressed.webp`, TILE_PAD, ...TILE.pressed);
  report.push(`${name}: board ${b.width}x${b.height}, pad ${TILE_PAD}`);
}

/* ---------- window mats (screens) ---------- */
const MAT_PAD = 40;
// the night board's cream core shows bright against it, so its rim is toned
// down on every side (lift < 0) as well as shaded away from the light, to read
// as the day board's does: a torn edge, not an outline
for (const [finish, shade, lift] of [["day", 0.25, 0.06], ["night", 0.5, -0.22]]) {
  const name = `mat-${finish}`;
  if (!has(name)) continue;
  const b = await base(name, { width: 1200 });
  relight(b.path, shade, lift); // its torn outer rim; the window's bevel is as authored
  // the mat stands off the print it frames, so its window edge shades the
  // top and left of the screen inside it
  shadow(b.path, `${OUT}/${name}.webp`, MAT_PAD, "5:9:12:0.26", "1:2:2:0.30");
  report.push(`${name}: mat ${b.width}x${b.height}, pad ${MAT_PAD}`);
}

/* ---------- pins: four heads in one generation, cut apart by their gaps ---------- */
if (has("pins")) {
  const trimmed = await sharp(raw("pins")).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const { data, info } = await sharp(trimmed.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cols = [...Array(info.width)].map((_, x) => {
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * 4 + 3] > 24) return true;
    return false;
  });
  const spans = [];
  cols.forEach((on, x) => {
    if (on && !cols[x - 1]) spans.push([x, x]);
    if (on) spans[spans.length - 1][1] = x;
  });
  const names = ["brass", "green", "amber", "signal"];
  if (spans.length !== 4) throw new Error(`pins: expected 4 heads, found ${spans.length}`);
  for (const [i, [x0, x1]] of spans.entries()) {
    const p = `${TMP}/pin-${names[i]}.png`;
    const cut = await sharp(trimmed.data).extract({ left: x0, top: 0, width: x1 - x0 + 1, height: info.height }).png().toBuffer();
    await sharp(cut).trim({ threshold: 1 }).resize({ width: 64 }).png().toFile(p);
    shadow(p, `${OUT}/pin-${names[i]}.webp`, 12, "2:4:3:0.35", "0.5:1:1:0.40");
  }
  report.push("pins: 64px heads, pad 12");
}

/* ---------- label tape ---------- */
if (has("tape-sage")) {
  const b = await base("tape-sage", { width: 700 });
  shadow(b.path, `${OUT}/tape-sage.webp`, 8, "0:1:2:0.18", "0:0.5:0.8:0.22");
  report.push(`tape-sage: ${b.width}x${b.height}, pad 8`);
}
// the same tape by moonlight (a recolour of tape-sage, so it registers)
if (has("tape-sage-night")) {
  const b = await base("tape-sage-night", { width: 700 });
  shadow(b.path, `${OUT}/tape-sage-night.webp`, 8, "0:1:2:0.18", "0:0.5:0.8:0.22");
  report.push(`tape-sage-night: ${b.width}x${b.height}, pad 8`);
}

/* ---------- props ---------- */
// the drifting cloud, lit by the low sun like the painted ones: peach-cream
// the drifting cloud, relit like the painted ones (a generated recolour of
// cloud-b: lilac-white with a peach underside); the plain one graded if the
// recolour is missing
if (has("cloud-b-alpenglow") || has("cloud-b")) {
  const relit = has("cloud-b-alpenglow");
  const b = await base(relit ? "cloud-b-alpenglow" : "cloud-b", { width: 720, height: 720, fit: "inside" }, { gain: relit ? 1 : [1.0, 0.93, 0.88] }, `${TMP}/cloud-b-alpenglow.png`);
  shadow(b.path, `${OUT}/cloud-b-alpenglow.webp`, 24, "6:10:12:0.24", "1:2:2:0.28");
  report.push(`cloud-b-alpenglow: ${relit ? "relit" : "graded"}`);
}

/* ---------- glass ----------
   A reflection map for the screens' glass, on neutral grey: blended in
   soft-light, grey is no change, lighter catches the window, darker falls
   off. Not trimmed (it is all one field). */
if (has("glass-glare")) {
  await sharp(raw("glass-glare")).resize({ width: 900, height: 600, fit: "fill" }).webp({ quality: 82 }).toFile(`${OUT}/glass-glare.webp`);
  report.push("glass-glare: 900x600");
}

/* ---------- scene layers ----------
   Full frames, never trimmed: every layer keeps the same 16:9 canvas so they
   register under the same `cover` fit. A layer that came back reframed is
   corrected by scripts/register-layer.mjs into registered.png beside it. The
   flat scene (for the social cards) is the layers composited, so it is
   always the scene the site shows. */
const LAYERS = [
  "sky",
  "mountains",
  "hills-far",
  "hills-near",
  "pines-left-back",
  "pines-right-back",
  "pines-left",
  "pines-right",
];
/* Each grove is generated as one picture and split into its back and front
   rows, which come back the same value. Trees further back sit deeper in
   the air: the back rows are printed a shade darker and cooler, so the two
   rows read apart even before they move. */
const LAYER_GAIN = {
  "pines-left-back": [0.84, 0.87, 0.93],
  "pines-right-back": [0.84, 0.87, 0.93],
};
/* The sun (moon) and the small cloud in front of it are lifted out of the sky
   (scripts/lift-sun.mjs) into scene/<finish>/sun.webp, which the page places
   on its own. `sun` is the disc's centre in the 1920x1080 frame; kit.css
   carries the sprite's geometry (--sun-*), which follows from these numbers
   and SUN_PAD. */
const SUN_BOX = [14, 40, 256, 244];
const SUN = { alpenglow: [167, 120], night: [155, 129] };
const SUN_PAD = 16;
for (const finish of ["alpenglow", "night"]) {
  const dir = `${OUT}/scene/${finish}`;
  mkdirSync(dir, { recursive: true });
  const frames = [];
  for (const layer of LAYERS) {
    const name = `layer-${layer}-${finish}`;
    const reg = `${RAW}/${name}/registered.png`;
    const src = existsSync(reg) ? reg : has(name) ? raw(name) : null;
    if (!src) continue;
    // one size for every screen: a phone's `cover` crop zooms into the
    // middle of the frame, so it needs the full width as much as a desktop
    const sized = await sharp(src).resize({ width: 1920, height: 1080, fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const g = LAYER_GAIN[layer] ?? [1, 1, 1];
    const px = sized.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 236) px[i + 3] = 255; // paper is opaque (see base)
      for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] * g[k]));
    }
    if (layer === "sky") {
      const lifted = liftSun(px, sized.info.width, sized.info.height, { box: SUN_BOX, sun: SUN[finish] });
      lifted.sky.copy(px);
      const sprite = `${TMP}/sun-${finish}.png`;
      await sharp(lifted.sprite, { raw: { width: lifted.spriteW, height: lifted.spriteH, channels: 4 } }).png().toFile(sprite);
      shadow(sprite, `${dir}/sun.webp`, SUN_PAD, "3:6:8:0.30", "1:1.5:1.5:0.32");
      report.push(`scene/${finish}/sun: ${lifted.spriteW + 2 * SUN_PAD}x${lifted.spriteH + 2 * SUN_PAD}`);
    }
    const frame = await sharp(px, { raw: sized.info }).png().toBuffer();
    await sharp(frame).webp({ quality: 78, alphaQuality: 90 }).toFile(`${dir}/${layer}.webp`);
    frames.push(frame);
  }
  if (frames.length !== LAYERS.length) continue;
  const [sky, ...rest] = frames;
  await sharp(sky).composite(rest.map((input) => ({ input }))).webp({ quality: 80 }).toFile(`${OUT}/scene-${finish}.webp`);
  report.push(`scene/${finish}: ${LAYERS.length} layers at 1920w, flattened to scene-${finish}.webp`);
}

// KEEP_TMP=1 keeps the intermediate bases, for trying state variants by hand
if (!process.env.KEEP_TMP) rmSync(TMP, { recursive: true, force: true });
console.log(report.join("\n"));
