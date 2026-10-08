// Build one style's raster kit (public/kit/<style>) from its raw generations
// in art/raw/<raw>/<name>/<name>.png (prompts: art/prompts/<raw>/<name>.txt).
//   node scripts/build-kit.mjs <style>        (config: scripts/kits/<style>.mjs)
//
// Every asset is trimmed to its material, resized to a fixed source size (so
// the slice insets in kit.css hold for every style and survive a
// regeneration), given its state art, and then has its cast shadow baked in
// (scripts/paper-shadow.mjs). States come from the normal art
// (scripts/derive-state.mjs), so a state swap never moves an edge: only light
// and shadow change. The source geometry is the same for every style:
//
//   sheet  1000px wide, 96px shadow pad          (kit.css --slice-plate 152)
//   tile   120px tall, 20px pad                  (--slice-key 60)
//   mat    1200px wide, 40px pad                 (--mat-t/r/b/l, measured here)
//   pin    64px heads, 12px pad
//   tape   700px wide, 8px pad                   (3-slice, 48px ends)
//   scene  1920x1080 full frames, never trimmed
//
// A style's config names its raws and tunes the light; see scripts/kits/.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { liftSun } from "./lift-sun.mjs";
import { clearWindow, fillet, frameMask, glaze, paneLight, sheen, temper } from "./framed-pane.mjs";
import { drawInk, rings } from "./ink.mjs";
import { lengthenRails, mirrorBottom, mitre, smoothRails, tileRails } from "./mitre.mjs";
import { webpOptions } from "./webp.mjs";

const style = process.argv[2];
if (!style) {
  console.error("usage: build-kit.mjs <style>   (scripts/kits/<style>.mjs)");
  process.exit(1);
}
const { default: kit } = await import(`./kits/${style}.mjs`);
// flat colour in hard ink lines is encoded losslessly (scripts/webp.mjs), by
// every step, those run as their own processes too
if (kit.lossless) process.env.KIT_LOSSLESS = "1";

const RAW = `art/raw/${kit.raw}`;
const OUT = kit.out ?? `public/kit/${style}`;
const TMP = `${RAW}/.build`;
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const raw = (name) => `${RAW}/${name}/${name}.png`;
// A raw buffer's geometry, to read it back in. Not sharp's whole output info:
// after a resize that says `premultiplied: true` (the resize was done
// premultiplied; the pixels it hands back are not), and as an input option
// that would have sharp divide every soft edge by its alpha again, which
// lights a pale halo round anything cut out.
const geometry = ({ width, height, channels }) => ({ width, height, channels });
const has = (name) => existsSync(raw(name));
const node = (...args) => execFileSync("node", args, { stdio: ["ignore", "ignore", "inherit"] });
const derive = (src, out, mode, ...flags) => node("scripts/derive-state.mjs", src, out, mode, ...flags);
const shadow = (src, out, pad, ambient, contact, ...flags) =>
  node("scripts/paper-shadow.mjs", src, out, `--pad=${pad}`, `--ambient=${ambient}`, `--contact=${contact}`, ...flags);
// the outer rim takes the key light: lit along the top and left, shaded along
// the bottom and right (in place, on a base PNG)
const relight = (path, shade, lift = 0.06, band = 16) => node("scripts/relight-edge.mjs", path, path, `--shade=${shade}`, `--lift=${lift}`, `--band=${band}`);

/** an asset's raw with every pixel fainter than `floor` cleared: a shadow
 * the generator painted under an object although the prompt asked for none
 * (the kit bakes its own), which would otherwise double up and widen the trim */
const floored = async (path, floor) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < floor) data[i] = 0;
  return sharp(data, { raw: geometry(info) }).png().toBuffer();
};

/** trim transparent margin, then resize; returns the path of a PNG base */
const base = async (name, resize, { gain = 1, alphaFloor = 0 } = {}, out = `${TMP}/${name}.png`) => {
  const g = Array.isArray(gain) ? gain : [gain, gain, gain];
  const src = alphaFloor ? await floored(raw(name), alphaFloor) : raw(name);
  const trimmed = await sharp(src).trim({ threshold: 1 }).resize(resize).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // the generator leaves opaque material a hair translucent (alpha ~253); a
  // sheet is opaque, and a shadow must not show through it
  const px = trimmed.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 236) px[i + 3] = 255;
    for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] * g[k]));
  }
  const info = await sharp(px, { raw: geometry(trimmed.info) }).png().toFile(out);
  return { path: out, width: info.width, height: info.height };
};

/** Straighten a tile's long edges across the span a 9-slice stretches.
 * The generated board's top and bottom edges wander by a pixel or two. A
 * 9-slice stretches the middle columns but keeps the corners, so wherever the
 * edge at the slice line differs from the edge just inside it, a 1px step
 * shows: invisible on a plain edge, plain on a focus line drawn along it.
 * Each middle column's top half (and bottom half) is shifted so its edge
 * runs straight from the left slice line to the right one, keeping the
 * material's texture. The edge is read to a fraction of a pixel and smoothed
 * along its length, and the shift is fractional, so neighbouring columns
 * move together: a whole-pixel shift that changes from one column to the
 * next breaks every highlight running along the bezel into a seam. */
const straighten = async (path, slice) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const a = (x, y) => data[(y * W + x) * 4 + 3];
  // where the alpha crosses half, between the two pixels either side
  const cross = (x, y0, y1) => y0 + (128 - a(x, y0)) / Math.max(1, a(x, y1) - a(x, y0)) * (y1 - y0);
  const top = (x) => { for (let y = 1; y < H; y++) if (a(x, y) >= 128) return cross(x, y - 1, y); return 0; };
  const bot = (x) => { for (let y = H - 2; y >= 0; y--) if (a(x, y) >= 128) return cross(x, y + 1, y); return H - 1; };
  const [x0, x1] = [slice, W - 1 - slice];
  const along = (f) => {
    const raw = Array.from({ length: W }, (_, x) => (x >= x0 && x <= x1 ? f(x) : 0));
    return raw.map((_, x) => {
      let [t, n] = [0, 0];
      for (let i = -12; i <= 12; i++) if (x + i >= x0 && x + i <= x1) [t, n] = [t + raw[x + i], n + 1];
      return n ? t / n : 0;
    });
  };
  const [topS, botS] = [along(top), along(bot)];
  const line = (e) => (x) => e[x0] + ((e[x1] - e[x0]) * (x - x0)) / (x1 - x0);
  const [topAt, botAt] = [line(topS), line(botS)];
  const out = Buffer.from(data);
  const mid = H >> 1;
  for (let x = x0 + 1; x < x1; x++) {
    const [dt, db] = [topAt(x) - topS[x], botAt(x) - botS[x]];
    for (let y = 0; y < H; y++) {
      // sample within the row's own half: what would come in from the other
      // half is more board, off the canvas more clear
      const [lo, hi] = y < mid ? [0, mid - 1] : [mid, H - 1];
      const sy = Math.min(hi, Math.max(lo, y - (y < mid ? dt : db)));
      const ya = Math.floor(sy);
      const yb = Math.min(hi, ya + 1);
      const f = sy - ya;
      const [pa, pb] = [(ya * W + x) * 4, (yb * W + x) * 4];
      const [wa, wb] = [data[pa + 3] * (1 - f), data[pb + 3] * f];
      const o = (y * W + x) * 4;
      // the colour moves by the fraction (premultiplied, so a soft edge
      // doesn't pick up the clear pixels' colour); the silhouette by the
      // nearest row, so the edge stays as crisp as the art drew it and a
      // state's shadow can't show through a half-clear edge
      for (let k = 0; k < 3; k++) out[o + k] = wa + wb > 0 ? Math.round((data[pa + k] * wa + data[pb + k] * wb) / (wa + wb)) : 0;
      out[o + 3] = data[(f < 0.5 ? pa : pb) + 3];
    }
  }
  await sharp(out, { raw: geometry(info) }).png().toFile(path);
};

/** A mat's window: the transparent hole inside its board, as the 9-slice
 *  insets kit.css needs (--mat-t/r/b/l): the pad plus the board out to the
 *  window's edge, per side, measured along the middle row and column. */
const measureWindow = async (file, pad) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const solid = (x, y) => data[(y * W + x) * 4 + 3] > 128;
  const [cx, cy] = [W >> 1, H >> 1];
  let t = cy, b = cy, l = cx, r = cx;
  while (t > 0 && !solid(cx, t - 1)) t--;
  while (b < H - 1 && !solid(cx, b + 1)) b++;
  while (l > 0 && !solid(l - 1, cy)) l--;
  while (r < W - 1 && !solid(r + 1, cy)) r++;
  if (solid(cx, cy)) throw new Error(`${file}: no window at the mat's centre`);
  // each inset is the board's width on that side: up to the window's first clear pixel
  return { t, r: W - 1 - r, b: H - 1 - b, l, pad };
};

/** A seamless tile of a homogeneous material (frosted glass, paper grain)
 *  from a generated square. The tile is cut from the square with a margin
 *  of a quarter tile beyond it, and across its first quarter in x (and in
 *  y) it cross-fades from that margin into itself, so its last pixel runs
 *  on into its first; everywhere else it is the material as painted, mixed
 *  so the grain keeps its contrast (variance-preserving). (Mixing in a copy
 *  shifted by half a tile instead would repeat its content every half tile.)
 *  With `highpass` (px) only the grain is kept: anything broader (a light
 *  pool, a cloud of tone) would repeat visibly from tile to tile, so it is
 *  taken out and the tile set to `mean` (hex), the grain scaled by `gain`,
 *  softened by `soften`. With `mono` the grain is its lightness alone, laid
 *  on the mean's hue (each channel in proportion): a stone's pits darken
 *  it, where a painted grain's own hues read as stains on it. `despeckle`
 *  (a lightness, 0..255) takes out the specks that stand that far above
 *  their surroundings (a fleck of bare paper in a brushed field): a tile
 *  laid under type puts each one beside a word, where it reads as stray
 *  punctuation. With `veil` (hex) the tile is the material's darker grain
 *  alone, a film of that colour whose alpha is how far each pixel falls
 *  below the mean (as a share of a light tint's value, 220): laid over a
 *  flat colour, it gives the colour the material's fibre, whatever the
 *  colour, at a fraction of a tinted tile's weight (encoded lossily: it is
 *  noise). */
const seamless = async (src, size, alpha, out, { highpass = 0, mean: target, gain = 1, soften = 0, mono = false, despeckle = 0, veil = null } = {}) => {
  const ov = Math.round(size / 4);
  const S = size + ov;
  // `soften` (px) blurs the grain first: crisp pale fibres on a dark ground
  // read as scratches, softened as strands in the paper
  let img = sharp(src).resize(S, S, { fit: "cover" }).removeAlpha();
  if (soften) img = sharp(await img.blur(soften).png().toBuffer());
  const { data } = await img.clone().raw().toBuffer({ resolveWithObject: true });
  if (despeckle) await clearSpecks(img, data, S, despeckle);
  const broad = highpass ? (await img.clone().blur(highpass).raw().toBuffer({ resolveWithObject: true })).data : null;
  const field = Float32Array.from(data, (v, i) => (broad ? v - broad[i] : v));
  const px = (x, y, k) => field[(y * S + x) * 3 + k];
  const mean = [0, 1, 2].map((k) => {
    let t = 0;
    for (let i = k; i < field.length; i += 3) t += field[i];
    return t / (S * S);
  });
  const base = target ? target.match(/../g).map((c) => parseInt(c, 16)) : mean;
  const veilRgb = veil ? veil.match(/../g).map((c) => parseInt(c, 16)) : null;
  // weight of the material as painted: 0 at the tile's first pixel (all
  // margin, which the tile's last pixel runs into), 1 from a quarter in
  const w = (t) => (t >= ov ? 1 : Math.sin((Math.PI * t) / (2 * ov)) ** 2);
  const outBuf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [wx, wy] = [w(x), w(y)];
      const parts = [
        [wx * wy, 0, 0],
        [(1 - wx) * wy, size, 0],
        [wx * (1 - wy), 0, size],
        [(1 - wx) * (1 - wy), size, size],
      ];
      const norm = Math.sqrt(parts.reduce((a, [q]) => a + q * q, 0)) || 1;
      const devs = [0, 1, 2].map((k) => parts.reduce((a, [q, dx, dy]) => (q ? a + q * (px(x + dx, y + dy, k) - mean[k]) : a), 0));
      const light = 0.299 * devs[0] + 0.587 * devs[1] + 0.114 * devs[2];
      const baseLight = (base[0] + base[1] + base[2]) / 3 || 1;
      const o = (y * size + x) * 4;
      if (veil) {
        const fall = Math.max(0, (-gain * light) / norm);
        veilRgb.forEach((v, k) => (outBuf[o + k] = v));
        outBuf[o + 3] = Math.min(255, Math.round((fall * 255) / 220));
        continue;
      }
      for (let k = 0; k < 3; k++) {
        const dev = mono ? (light * base[k]) / baseLight : devs[k];
        outBuf[o + k] = Math.max(0, Math.min(255, Math.round(base[k] + (gain * dev) / norm)));
      }
      outBuf[o + 3] = Math.round(alpha * 255);
    }
  await sharp(outBuf, { raw: { width: size, height: size, channels: 4 } }).webp(veil ? { quality: 80, alphaQuality: 90, smartSubsample: true } : webpOptions(88)).toFile(out);
};

/** a speck (a pixel whose lightness stands `t` above its surroundings',
 *  within 8px, and the pixels round it) set to its surroundings, in place
 *  on `data` (RGB, `S` x `S`, from `img`) */
const clearSpecks = async (img, data, S, t) => {
  const around = (await img.clone().blur(8).raw().toBuffer({ resolveWithObject: true })).data;
  const light = (buf, p) => (buf[p] + buf[p + 1] + buf[p + 2]) / 3;
  const hit = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) if (light(data, i * 3) - light(around, i * 3) > t) hit[i] = 1;
  // the speck's soft rim with it: 2px round each pixel that stands out
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) near = hit[Math.min(S - 1, Math.max(0, y + dy)) * S + Math.min(S - 1, Math.max(0, x + dx))] === 1;
      if (near) for (let k = 0; k < 3; k++) data[(y * S + x) * 3 + k] = around[(y * S + x) * 3 + k];
    }
};

/** Ornaments laid over a sheet's corners (Natural Garden's ivy, the tape
 *  holding a cyanotype print), on every state of the sheet (`files`, the
 *  shadowed art, `pad` px round a `bw` x `bh` base), each with a contact
 *  shadow of its own. Each must lie inside the corner the 9-slice keeps
 *  unstretched (kit.css --slice-plate 152: the pad and the base's first
 *  56px), so it neither stretches nor repeats: `corner` is "tl" or "tr", `at`
 *  its offset in from that corner of the base (negative: overhanging the
 *  sheet), `size` its longer side after turning it by `angle` degrees,
 *  graded with the sheet (`gain`). Returns their coverage of the base, for
 *  the glaze to keep where they lie over the pane. */
const decals = async (files, pad, bw, bh, specs, gain = 1) => {
  const g = Array.isArray(gain) ? gain : [gain, gain, gain];
  const keep = new Float32Array(bw * bh);
  const layers = [];
  for (const { src, size, at: [ox, oy], corner = "tl", angle = 0, aspect = null, alpha: opacity = 1, tint = [1, 1, 1], shadow: [dx, dy, blur, alpha] = [2, 3, 3, 0.35] } of specs) {
    // `aspect`: the piece shortened to that length over its width before it
    // is turned (a generator draws tape long and thin, whatever it is asked;
    // laid small, the squeeze is never seen, and both its torn ends stay)
    const trimmed = await sharp(raw(src)).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
    const piece0 = aspect ? await sharp(trimmed.data).resize(Math.round(trimmed.info.height * aspect), trimmed.info.height, { fit: "fill" }).png().toBuffer() : trimmed.data;
    const turned = await sharp(piece0).rotate(angle, { background: "#0000" }).png().toBuffer();
    const art = await sharp(turned).trim({ threshold: 1 }).resize(size, size, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = art.info;
    if (ox < -pad || oy < -pad || ox + w > 56 || oy + h > 56) throw new Error(`decal ${src}: ${w}x${h} at (${ox}, ${oy}) from ${corner} leaves the corner`);
    // its top left in the base's coordinates
    const [x, y] = [corner === "tr" ? bw - ox - w : ox, oy];
    const px = Buffer.from(art.data);
    // `alpha`: a translucent piece (paper tape) shows what it lies on
    for (let i = 0; i < px.length; i += 4) {
      for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] * g[k] * tint[k]));
      px[i + 3] = Math.round(px[i + 3] * opacity);
    }
    const piece = await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    // its shadow on what it lies on: its silhouette, dark, soft, down and right
    const m = Math.ceil(blur * 3);
    const [sw, sh] = [w + 2 * m, h + 2 * m];
    const sil = Buffer.alloc(sw * sh * 4);
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) sil[((yy + m) * sw + xx + m) * 4 + 3] = Math.round(art.data[(yy * w + xx) * 4 + 3] * alpha);
    const shade = await sharp(sil, { raw: { width: sw, height: sh, channels: 4 } }).blur(blur).raw().toBuffer();
    layers.push({ input: await sharp(shade, { raw: { width: sw, height: sh, channels: 4 } }).png().toBuffer(), left: pad + x + dx - m, top: pad + y + dy - m });
    layers.push({ input: piece, left: pad + x, top: pad + y });
    // what the ornament and its shadow cover, over the base
    for (let yy = 0; yy < sh; yy++)
      for (let xx = 0; xx < sw; xx++) {
        const [bx, by] = [x + dx - m + xx, y + dy - m + yy];
        if (bx >= 0 && by >= 0 && bx < bw && by < bh) keep[by * bw + bx] = Math.max(keep[by * bw + bx], shade[(yy * sw + xx) * 4 + 3] / 255);
      }
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        const [bx, by] = [x + xx, y + yy];
        if (bx >= 0 && by >= 0 && bx < bw && by < bh) keep[by * bw + bx] = Math.max(keep[by * bw + bx], art.data[(yy * w + xx) * 4 + 3] / 255);
      }
  }
  for (const f of files) {
    const img = sharp(f).composite(layers);
    writeFileSync(f, await (f.endsWith(".webp") ? img.webp(webpOptions(92)) : img.png()).toBuffer());
  }
  return keep;
};

const report = [];

/* ---------- fills: tiled materials a style paints itself (kit.css --plate-fill) ---------- */
for (const f of kit.fills ?? []) {
  if (!has(f.src)) continue;
  await seamless(raw(f.src), f.size, f.alpha ?? 1, `${OUT}/${f.name}.webp`, f);
  report.push(`${f.name}: ${f.size}px seamless tile, alpha ${f.alpha ?? 1}`);
}

/** a fill tile's grain, its deviation from its mean (RGB), at `size` px */
const grainOf = async (tile, size) => {
  const { data } = await sharp(`${OUT}/${tile}.webp`).resize(size, size).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mean = [0, 1, 2].map((k) => {
    let t = 0;
    for (let i = k; i < data.length; i += 3) t += data[i];
    return t / (size * size);
  });
  return { size, dev: Float32Array.from(data, (v, i) => v - mean[i % 3]) };
};

/** `grain` (RGB deviations, a `size` px tile that repeats) added to the art
 *  at `path` where it is not clear, scaled by `gain`, in place */
const layGrain = async (path, { size, dev }, gain = 1) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const [i, j] = [(y * info.width + x) * 4, ((y % size) * size + (x % size)) * 3];
      if (data[i + 3]) for (let k = 0; k < 3; k++) data[i + k] = Math.max(0, Math.min(255, Math.round(data[i + k] + gain * dev[j + k])));
    }
  writeFileSync(path, await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer());
};
/** a page's material laid into an asset's art (`grain`: { fill, size, k,
 *  gain }: the fill tile, at the size the page prints it, `size` px, over
 *  the scale the asset prints at, `k`), so what is printed or cut from that
 *  material carries its texture at the page's scale */
const grainInto = async (path, g) => g && layGrain(path, await grainOf(g.fill, Math.round(g.size / g.k)), g.gain ?? 1);

/* ---------- sheets: the page's surfaces, lifted / flat / focused ---------- */
const SHEET_PAD = 96;
// Lossy WebP codes colour in blocks of 8x8 pixels (4x4 at half resolution):
// a pane edge that splits a block lends the band laid in along it (a focus
// glaze) to the frame's last pixels, a few px deep. A kit may have each
// side of a sheet's pane moved in to the block grid (`alignPane`, encoded
// lossily: at most 7px further into the face, which the art then keeps;
// the pad is a multiple of 8, so the grid is the base art's). It costs a
// sliver of the face between the frame and the band, which a face the art
// keeps as drawn (a glass pane, a silk mount) shows: those kits keep the
// band against the frame and its lossy fringe.
const lossy = process.env.KIT_LOSSLESS !== "1";
const BLOCK = 8;
const MOUNT = kit.sheet?.mount ?? 14;
for (const s of kit.sheets ?? []) {
  if (!has(s.src)) continue;
  const p = { ...kit.sheet, ...s };
  // a sheet is 1000px wide unless its frame is heavy: what the 9-slice needs
  // is that the frame fits in the 56px a corner keeps unstretched, and a
  // narrower base shrinks the frame to fit
  // (`height` fixes the base's height too, for a sheet stored at a scale,
  // `prescale`, whose size at it must come out in whole px)
  const b = await base(s.src, { width: p.width ?? 1000, ...(p.height && { height: p.height, fit: "fill" }) }, { gain: s.gain ?? 1, alphaFloor: s.alphaFloor }, `${TMP}/${s.name}.png`);
  // another sheet from the same art, turned end for end: art lit evenly (a
  // print) has no up, so one raw makes two sheets whose every edge differs
  // (its frame turns with it: the config gives it turned)
  if (s.turn) writeFileSync(b.path, await sharp(b.path).rotate(180).png().toBuffer());
  // drawn flat in the clear line, the art's shape and colours at an exact
  // ink width (scripts/ink.mjs)
  const drawn = s.ink ? await drawInk(b.path, b.width, b.height, rings(b.width, b.height, s.ink)) : null;
  // a frame of the pane's own material: its light and shade held to the
  // face's colour (scripts/framed-pane.mjs temper). Encoded lossily, the
  // pane is moved in to the block grid (below), and the face the art then
  // keeps, up to 7px inside the frame, is shown as frame: it is tempered
  // with it (what is cleared after does not matter), or a sunlit face's
  // glint by the frame shows as a bright band along it
  const align = lossy && (p.alignPane ?? false);
  const near = (v) => (align ? Math.ceil(v / BLOCK) * BLOCK : v);
  if (s.temper) {
    const f = s.frame;
    const shown = align ? { t: near(f.t), l: near(f.l), b: f.b + BLOCK - 1, r: f.r + BLOCK - 1 } : f;
    await temper(b.path, shown, s.temper);
  }
  // rails whose small marks would repeat at a beat, worn smooth (before the
  // corners are cut from them: a mitre of the rails as finished)
  if (s.smoothRails) await smoothRails(b.path, s.smoothRails);
  // the page's material laid into the frame's own (`grain`: a fill's grain,
  // the tile at the size it prints over the scale the sheet prints at, `k`),
  // so a frame cut from the same material as the face the page paints in it
  // (a stone slab's chamfer) carries the same grain: generated, it comes
  // back as smooth as moulded resin round the face's pitted stone. Laid
  // before the rails are rebuilt, which carry it on
  await grainInto(b.path, s.grain);
  // corners cut from the rails, so they meet them without a step (scripts/mitre.mjs)
  if (s.mitre) await mitre(b.path, { ...(s.mitre === true ? {} : s.mitre), frame: s.frame });
  // a bottom edge drawn as a regular motif: the top edge, mirrored
  if (s.mirror) await mirrorBottom(b.path);
  // a round-cornered window's face cleared to the metal, so the page's
  // face (another colour by night) runs right up to the frame
  if (s.window) await clearWindow(b.path, { ...(s.window === true ? {} : s.window), gain: s.gain ?? 1 });
  // rails grown longer than drawn, so the page's repeat of them (below) is
  // a long one (scripts/mitre.mjs lengthenRails)
  if (s.lengthen) Object.assign(b, await lengthenRails(b.path, s.lengthen));
  // rails that tile between the corners as drawn (the page repeats them:
  // its --plate-repeat), where a stretch would smear what runs across them
  if (s.tileRails) await tileRails(b.path, s.tileRails === true ? {} : s.tileRails);
  // a strip is printed at a quarter of its art's size: a fine weave in it
  // aliases into a moire there unless the art is filtered first
  if (s.soften) writeFileSync(b.path, await sharp(b.path).blur(s.soften).png().toBuffer());
  if (s.shade !== undefined) relight(b.path, s.shade, s.lift, s.band);
  const hover = `${TMP}/${s.name}-hover.webp`;
  derive(b.path, hover, "hover", ...(p.hoverFlags ?? ["--catch=0", "--sheen=0.08"]));
  // a frame round a pane (scripts/framed-pane.mjs): the page paints the
  // pane, the art keeps the frame and the light it throws on the glass. Its
  // states are finished losslessly and glazed into the kit, so the frame is
  // encoded once and stays the same pixels from state to state.
  // (the pane's sides moved in to the block grid: see `near`, above)
  const far = (v, span) => (align ? v + (((span - v) % BLOCK) + BLOCK) % BLOCK : v);
  const frame = p.frame && { t: near(p.frame.t), l: near(p.frame.l), b: far(p.frame.b, b.height), r: far(p.frame.r, b.width) };
  const mask = p.frame ? await frameMask(b.path, frame, { rivets: p.rivets ?? true, feather: p.feather ?? 0, cleared: Boolean(s.window), field: drawn?.field }) : null;
  const dest = (st) => (mask ? `${TMP}/${s.name}-${st}-shadowed.png` : `${OUT}/${s.name}-${st}.webp`);
  // a sheet that is never pressed or focused (a strip) builds only what it shows
  const states = p.states ?? ["normal", "hover", "focus", "pressed", "flat"];
  const want = (st) => states.includes(st);
  shadow(b.path, dest("normal"), SHEET_PAD, ...p.normal);
  if (want("hover")) shadow(hover, dest("hover"), SHEET_PAD, ...(s.hover ?? p.hover));
  let keep = null;
  if (!want("focus")) {
    /* nothing to focus */
  } else if (mask && s.focusInk) {
    // focus drawn in the clear line (scripts/ink.mjs): a band inside the
    // ink line, following it (a hand-drawn line gives along its sides), so
    // drawn whole rather than laid along the pane's edge; the glaze keeps it
    const focus = `${TMP}/${s.name}-focus.png`;
    ({ keep } = await drawInk(focus, b.width, b.height, rings(b.width, b.height, s.focusInk)));
    shadow(focus, dest("focus"), SHEET_PAD, ...p.normal);
  } else if (mask && p.fillet) {
    // focus: an enamel strip laid in along the pane's edge
    const focus = `${TMP}/${s.name}-focus.png`;
    keep = await fillet(b.path, mask, p.fillet, focus);
    shadow(focus, dest("focus"), SHEET_PAD, ...p.normal);
  } else if (p.focusFlags) {
    // focus is drawn on the surface itself (an inlay in its frame), not a mount
    const focus = `${TMP}/${s.name}-focus.webp`;
    derive(b.path, focus, "focus", ...p.focusFlags, `--ring-color=${s.under}`);
    shadow(focus, dest("focus"), SHEET_PAD, ...p.normal);
  } else shadow(b.path, dest("focus"), SHEET_PAD, ...p.normal, `--mount=${MOUNT}:${s.under}${p.mountCut ? `:${p.mountCut}` : ""}`);
  if (!want("pressed")) {
    /* nothing to press */
  } else if (p.pressedFlags) {
    // pressed: the frame sinks out of the light as the sheet goes flat
    const pressed = `${TMP}/${s.name}-pressed.webp`;
    derive(b.path, pressed, "pressed", ...p.pressedFlags);
    shadow(pressed, dest("pressed"), SHEET_PAD, ...p.pressed);
  } else shadow(b.path, dest("pressed"), SHEET_PAD, ...p.pressed);
  if (want("flat")) shadow(b.path, dest("flat"), SHEET_PAD, ...p.flat);
  // an ornament over the corner, in every state, kept where it lies on the pane
  const ornament = p.decal ? await decals(states.map(dest), SHEET_PAD, b.width, b.height, [p.decal].flat(), s.gain ?? 1) : null;
  const union = (a, c) => (a && c ? a.map((v, i) => Math.max(v, c[i])) : (a ?? c));
  if (mask) {
    const light = paneLight(mask, p.glass);
    for (const st of states)
      await glaze(dest(st), `${OUT}/${s.name}-${st}.webp`, SHEET_PAD, mask, light, {
        ...p.glass,
        keep: union(st === "focus" ? keep : null, ornament),
      });
    // the key light's pool on the pane, at rest and (stronger) lifted
    if (p.light) await sheen(256, p.light, `${OUT}/${s.name}-light.webp`);
    if (p.sheen) await sheen(256, p.sheen, `${OUT}/${s.name}-sheen.webp`);
    const rivets = mask.discs.map((d) => `(${Math.round(d.cx)},${Math.round(d.cy)}) r${d.r}`).join(" ");
    report.push(`${s.name}: ${b.width}x${b.height}, pad ${SHEET_PAD}, pane cleared inside the frame${rivets ? `; rivets ${rivets}` : ""}`);
  } else report.push(`${s.name}: ${b.width}x${b.height}, pad ${SHEET_PAD}`);
  // A sheet the page prints well below its art's size (`prescale`: a strip
  // at 0.375) is stored at that size, its slices with it (the style sets
  // --plate-slice to match), so the page draws it 1:1. Resampled by the
  // browser instead, a rail (scaled along one axis) and a corner (scaled in
  // both) are filtered differently: a rail's fine lines alias darker than
  // the same lines turning the corner beside them, a seam at every slice.
  if (p.prescale) {
    for (const st of states) {
      const f = `${OUT}/${s.name}-${st}.webp`;
      const { width: w, height: h } = await sharp(f).metadata();
      const [W, H] = [w * p.prescale, h * p.prescale];
      if (!Number.isInteger(W) || !Number.isInteger(H) || !Number.isInteger(SHEET_PAD * p.prescale))
        throw new Error(`${s.name}: prescale ${p.prescale} leaves ${W}x${H} (pad ${SHEET_PAD * p.prescale}); its slices would not land on whole px`);
      writeFileSync(f, await sharp(f).resize(W, H, { kernel: "lanczos3" }).webp(webpOptions(92)).toBuffer());
    }
    report.push(`${s.name}: stored at ${p.prescale} (--plate-slice: ${(SHEET_PAD + 56) * p.prescale})`);
  }
}

/* ---------- tiles: the site's buttons and key legends ---------- */
const TILE_PAD = 20;
for (const t of kit.tiles ?? []) {
  if (!has(t.src)) continue;
  // a plate may cast its own shadow (on a dark ground, a deeper one), and
  // catch the light its own way (a glaze dark ink must hold on)
  const p = { ...kit.tile, ...t.shadow, ...(t.hoverFlags && { hoverFlags: t.hoverFlags }) };
  const b = await base(t.src, { height: 120 }, { gain: t.gain ?? 1 }, `${TMP}/${t.name}.png`);
  // drawn flat in the clear line (scripts/ink.mjs): its edges are straight
  if (t.ink) await drawInk(b.path, b.width, b.height, rings(b.width, b.height, t.ink));
  else await straighten(b.path, 40); // kit.css slices the board 40px in
  // printed on the page's paper: its fibre in the flat colour (`grain`)
  await grainInto(b.path, t.grain);
  // a label whose printed rule fades or thins at its corners: the corners are
  // cut from its rails (scripts/mitre.mjs), so the rule meets itself without
  // a step where the 9-slice stretches it
  if (t.mitre) await mitre(b.path, { corner: 40, joint: 0, frame: { t: 40, r: 40, b: 40, l: 40 } });
  // a face that must repeat along the tile, not stretch (a glaze's mottle):
  // the whole face between the corners cut seamless (kit.css --key-repeat)
  // (`tileFace: { blend }`: its tone cross-faded through the hand-over,
  // scripts/mitre.mjs tileRails)
  if (t.tileFace) await tileRails(b.path, { corner: 40, sides: ["t"], overlap: 32, depth: b.height, ...(t.tileFace === true ? {} : t.tileFace) });
  // a plate whose edge takes the light at rest (`lit`: hover's catch flags,
  // weaker), in every state, where its art came back lit evenly
  if (t.lit) {
    const lit = `${TMP}/${t.name}-lit.png`;
    derive(b.path, lit, "hover", ...t.lit);
    writeFileSync(b.path, await sharp(lit).png().toBuffer());
  }
  const st = (m) => `${TMP}/${t.name}-${m}.webp`;
  // hover: raised into the key light, the upper-left bevel catches it
  derive(b.path, st("hover"), "hover", `--catch=${t.catch ?? 0.75}`, ...(p.hoverFlags ?? ["--catch-width=5", "--sheen=0"]));
  // focus: by default a channel cut just inside the edge, in the focus
  // colour; a tile drawn in ink draws its focus bands too
  const focus = t.focusInk ? `${TMP}/${t.name}-focus.png` : st("focus");
  if (t.focusInk) {
    await drawInk(focus, b.width, b.height, rings(b.width, b.height, t.focusInk));
    await grainInto(focus, t.grain);
  } else derive(b.path, focus, "focus", "--catch=0", "--sheen=0", ...(t.focusFlags ?? p.focusFlags ?? ["--ring=4:10"]), `--ring-color=${t.ring}`, ...(t.groove ?? []));
  derive(b.path, st("pressed"), "pressed", `--catch=${t.pressedCatch ?? 0.4}`, ...(p.pressedFlags ?? []));
  shadow(b.path, `${OUT}/${t.name}-normal.webp`, TILE_PAD, ...p.normal);
  shadow(st("hover"), `${OUT}/${t.name}-hover.webp`, TILE_PAD, ...p.hover);
  shadow(focus, `${OUT}/${t.name}-focus.webp`, TILE_PAD, ...p.normal);
  shadow(st("pressed"), `${OUT}/${t.name}-pressed.webp`, TILE_PAD, ...p.pressed);
  report.push(`${t.name}: ${b.width}x${b.height}, pad ${TILE_PAD}`);
}

/** A slimmer mount: `cut` px taken out of the middle of its board on every
 *  side, starting `at` px in from the board's outer edge, so its outer lip
 *  and its window's bevel are kept whole and only the flat face between them
 *  narrows (a scale would shrink the lip and bevel with it). The window keeps
 *  its size; the mount shrinks by 2 x `cut` each way. In place. */
const slimBoard = async (path, { at, cut }) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const [w, h] = [W - 2 * cut, H - 2 * cut];
  // source position along an axis of length L for output position i
  const from = (i, len) => (i < at ? i : i < len - at ? i + cut : i + 2 * cut);
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (from(y, h) * W + from(x, w)) * 4;
      data.copy(out, (y * w + x) * 4, p, p + 4);
    }
  writeFileSync(path, await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer());
};

/* ---------- screen mounts ---------- */
const MAT_PAD = 40;
for (const m of kit.mats ?? []) {
  if (!has(m.src)) continue;
  const b = await base(m.src, { width: 1200 }, { gain: m.gain ?? 1 });
  if (m.ink) await drawInk(b.path, b.width, b.height, rings(b.width, b.height, m.ink));
  await grainInto(b.path, m.grain);
  if (m.slim) await slimBoard(b.path, m.slim);
  if (m.shade !== undefined) relight(b.path, m.shade, m.lift);
  // the mount stands off the screen it frames, so its window edge shades the
  // top and left of the screen inside it
  const out = `${OUT}/${m.name}.webp`;
  shadow(b.path, out, MAT_PAD, ...(m.shadow ?? ["5:9:12:0.26", "1:2:2:0.30"]));
  const w = await measureWindow(out, MAT_PAD);
  report.push(`${m.name}: ${b.width}x${b.height}, pad ${MAT_PAD}; --mat-t: ${w.t}; --mat-r: ${w.r}; --mat-b: ${w.b}; --mat-l: ${w.l};`);
}

/** a rim of `color` (hex) `width` px deep laid round the inside of a
 *  head's silhouette (RGBA `px`, `w` x `h`), in place: each solid pixel
 *  within `width` of a clear one takes the colour, its edge smoothed over
 *  a pixel */
const ringHead = (px, w, h, { color, width }) => {
  const rgb = color.match(/../g).map((c) => parseInt(c, 16));
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] >= 128;
  const R = Math.ceil(width) + 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      let d = Infinity;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (!solid(x + dx, y + dy)) d = Math.min(d, Math.hypot(dx, dy));
      const t = Math.max(0, Math.min(1, width + 0.5 - d));
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) px[i + k] = Math.round(px[i + k] * (1 - t) + rgb[k] * t);
    }
};

/* ---------- status markers: four heads in one generation, cut apart by their gaps ---------- */
if (kit.pins && has(kit.pins.src)) {
  const trimmed = await sharp(raw(kit.pins.src)).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
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
    // a lamp drawn flat in the clear line: a disc of its colour in an ink
    // ring (scripts/ink.mjs), the colours the art's, and (`glint`) the flat
    // shape of a highlight where its glass faces the light, upper left
    const ink = kit.pins.ink;
    // toward the key light: upper left, or (`light: "right"`) upper right
    const right = ink?.light === "right";
    const glint = ink?.glint ? [{ ellipse: { cx: right ? 41 : 23, cy: 22, rx: 7.5, ry: 4.5, rot: right ? 40 : -40 }, color: ink.glint }] : [];
    if (ink) await drawInk(p, 64, 64, [...rings(64, 64, { radius: 32, bands: [[ink.line, ink.color]], fill: ink.fills[names[i]] }), ...glint]);
    else {
      const cut = await sharp(trimmed.data).extract({ left: x0, top: 0, width: x1 - x0 + 1, height: info.height }).png().toBuffer();
      // a head may be dyed (`gain`, by name): a white one that would vanish
      // on its style's white paper
      const g = kit.pins.gain?.[names[i]] ?? [1, 1, 1];
      const head = await sharp(cut).trim({ threshold: 1 }).resize({ width: 64 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let j = 0; j < head.data.length; j += 4) for (let k = 0; k < 3; k++) head.data[j + k] = Math.min(255, Math.round(head.data[j + k] * g[k]));
      // or ringed (`rim`, by name: { color, width } in the art's px): a head
      // that sits across two grounds, neither of which its own colour parts
      // from, held by an inked rim on the one and its colour on the other
      const rim = kit.pins.rim?.[names[i]];
      if (rim) ringHead(head.data, head.info.width, head.info.height, rim);
      await sharp(head.data, { raw: geometry(head.info) }).png().toFile(p);
    }
    shadow(p, `${OUT}/pin-${names[i]}.webp`, 12, ...(kit.pins.shadow ?? ["2:4:3:0.35", "0.5:1:1:0.40"]));
    // the same heads by night (`night`, a gain): a glazed bead under the
    // moon is graded with the glaze round it, not lit from within
    if (kit.pins.night) {
      const dim = `${TMP}/pin-${names[i]}-night.png`;
      await sharp(p).linear([kit.pins.night].flat().length === 3 ? [...kit.pins.night, 1] : [kit.pins.night, kit.pins.night, kit.pins.night, 1], [0, 0, 0, 0]).png().toFile(dim);
      shadow(dim, `${OUT}/pin-${names[i]}-night.webp`, 12, ...(kit.pins.shadow ?? ["2:4:3:0.35", "0.5:1:1:0.40"]));
    }
  }
  report.push(`pins: 64px heads, pad 12${kit.pins.night ? ", and by night" : ""}`);
}

/* ---------- label strips ---------- */
for (const t of kit.tapes ?? []) {
  if (!has(t.src)) continue;
  const b = await base(t.src, { width: 700 }, { gain: t.gain ?? 1 }, `${TMP}/${t.name}.png`);
  // drawn flat in the clear line at its own size (a 9-slice: its style's
  // css slices it on all four sides, so the line holds its weight)
  // (a caption's tail hangs below its box: the art is that much taller)
  if (t.ink) {
    const [w, h] = t.ink.size;
    [b.width, b.height] = [w, h + (t.ink.tail?.depth ?? 0)];
    await drawInk(b.path, b.width, b.height, rings(w, h, t.ink));
  }
  await grainInto(b.path, t.grain);
  shadow(b.path, `${OUT}/${t.name}.webp`, 8, ...(t.shadow ?? ["0:1:2:0.18", "0:0.5:0.8:0.22"]));
  report.push(`${t.name}: ${b.width}x${b.height}, pad 8`);
}

/* ---------- props ----------
   A prop may name several raws, best first: the first one present is used,
   graded by its own `gain`. */
for (const pr of kit.props ?? []) {
  const pick = pr.srcs.find((s) => has(s.src));
  if (!pick) continue;
  const b = await base(pick.src, pr.resize, { gain: pick.gain ?? 1 }, `${TMP}/${pr.name}.png`);
  shadow(b.path, `${OUT}/${pr.name}.webp`, pr.pad, ...pr.shadow);
  report.push(`${pr.name}: from ${pick.src}`);
}

/* ---------- cuts ----------
   A closer cut of the scene: an opaque panel of its own, drawn as the
   close-up an album cuts to (art/prompts/<style>/cut-*), which the page
   crops to the slot it fills (kit.css .tier-cut, --tier-cut-art). Drawn at
   its own scale, its line is as crisp as the scene's, where a cut enlarged
   from the scene would be soft. Scaled to `width`, encoded once. */
for (const c of kit.cuts ?? []) {
  if (!has(c.src)) continue;
  await sharp(raw(c.src)).resize({ width: c.width }).webp({ quality: 86 }).toFile(`${OUT}/${c.name}.webp`);
  report.push(`${c.name}: ${c.width}w`);
}

/* ---------- glass ----------
   A reflection map for the screens' glass, on neutral grey: blended in
   soft-light, grey is no change, lighter catches the window, darker falls
   off. Not trimmed (it is all one field). */
if (kit.glass && has(kit.glass)) {
  await sharp(raw(kit.glass)).resize({ width: 900, height: 600, fit: "fill" }).webp({ quality: 82 }).toFile(`${OUT}/glass-glare.webp`);
  report.push("glass-glare: 900x600");
}

/* ---------- scene layers ----------
   Full frames, never trimmed: every layer keeps the same 16:9 canvas so they
   register under the same `cover` fit. A layer that came back reframed is
   corrected by scripts/register-layer.mjs into registered.png beside it,
   which is preferred. The flat scene (for the social cards) is the layers
   composited. The sun (moon), if the style hangs one, is lifted out of the
   sky (scripts/lift-sun.mjs) into scene/<finish>/sun.webp; `sun.at` is the
   disc's centre in the 1920x1080 frame per finish, and kit.css carries the
   sprite's geometry (--sun-*), which follows from it and the pad. A sky the
   lift can't read cleanly (a disc on a glow, a disc close to the sky's own
   tone) is instead painted without it (`sun.sky`, the raw of that finish's
   clear sky) and the disc generated on its own (`sun.sprites`), sized to
   `sun.size` px across its trimmed art. */
const sc = kit.scene;
/** the paper's tooth (a fill tile's grain, grainOf), once */
let tooth0 = null;
const paperTooth = async ({ tile, size }) => (tooth0 ??= await grainOf(tile, size));
/** one pass of a separable [1 2 1] / 4 blur over RGBA, in premultiplied colour */
const softenPremultiplied = (px, W, H) => {
  const pm = new Float32Array(px.length);
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3] / 255;
    pm[i] = px[i] * a;
    pm[i + 1] = px[i + 1] * a;
    pm[i + 2] = px[i + 2] * a;
    pm[i + 3] = px[i + 3];
  }
  const pass = (src, dx, dy) => {
    const out = new Float32Array(src.length);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const at = (xx, yy) => (Math.min(H - 1, Math.max(0, yy)) * W + Math.min(W - 1, Math.max(0, xx))) * 4;
        const [a, b, c] = [at(x - dx, y - dy), at(x, y), at(x + dx, y + dy)];
        for (let k = 0; k < 4; k++) out[b + k] = (src[a + k] + 2 * src[b + k] + src[c + k]) / 4;
      }
    return out;
  };
  const blurred = pass(pass(pm, 1, 0), 0, 1);
  for (let i = 0; i < px.length; i += 4) {
    const a = blurred[i + 3];
    px[i + 3] = Math.round(a);
    for (let k = 0; k < 3; k++) px[i + k] = a > 0 ? Math.min(255, Math.round((blurred[i + k] * 255) / a)) : 0;
  }
};
/** a generated sun or moon as the page's sprite; its disc measured where
 *  it is solid (a moon's glow round it is not the disc) */
const sunSprite = async (name, size, pad, out) => {
  const b = await base(name, { width: size, height: size, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }, {}, `${TMP}/${name}.png`);
  // a cut-paper disc casts a shadow on the sky; a painted one does not
  const [ambient, contact] = sc.sun.shadow ?? ["3:6:8:0.22", "1:1.5:1.5:0.24"];
  shadow(b.path, out, pad, ambient, contact);
  const { data, info } = await sharp(b.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] >= 230) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  const [sw, sh] = [info.width + 2 * pad, info.height + 2 * pad];
  return `--sun-sw: ${sw}; --sun-sh: ${sh}; --sun-cx: ${Math.round(pad + (x0 + x1) / 2)}; --sun-cy: ${Math.round(pad + (y0 + y1) / 2)}; --sun-r: ${Math.round((x1 - x0 + 1) / 2)};`;
};
for (const finish of sc?.finishes ?? []) {
  const dir = `${OUT}/scene/${finish}`;
  mkdirSync(dir, { recursive: true });
  const frames = [];
  if (sc.sun?.sprites && has(sc.sun.sprites[finish]))
    report.push(`scene/${finish}/sun: ${await sunSprite(sc.sun.sprites[finish], sc.sun.size, sc.sun.pad, `${dir}/sun.webp`)}`);
  for (const layer of sc.layers) {
    // a finish may be graded from another's layers (`source`: night from
    // day, by `gain`) rather than painted on its own
    const from = sc.source?.[finish] ?? finish;
    const name = layer === "sky" && sc.sun?.sky?.[finish] && has(sc.sun.sky[finish]) ? sc.sun.sky[finish] : `layer-${layer}-${from}`;
    const reg = `${RAW}/${name}/registered.png`;
    const src = existsSync(reg) ? reg : has(name) ? raw(name) : null;
    if (!src) continue;
    // one size for every screen: a phone's `cover` crop zooms into the
    // middle of the frame, so it needs the full width as much as a desktop
    const sized = await sharp(src).resize({ width: 1920, height: 1080, fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // a gain keyed by layer grades it in every finish; by layer-finish, in
    // one; one number for all three channels, or one per channel
    const gain = sc.gain?.[`${layer}-${finish}`] ?? sc.gain?.[layer] ?? 1;
    const g = Array.isArray(gain) ? gain : [gain, gain, gain];
    const px = sized.data;
    // a layer generated with its ground behind it (a photogram's white
    // silhouettes on their blue paper) is keyed: its alpha is how far each
    // pixel stands from the ground's colour toward the silhouettes' light,
    // past a floor that keeps the paper's own mottle clear, and its colour is
    // what, laid over that ground, gives the pixel back
    if (sc.key?.layers.includes(layer)) {
      const [G, L] = [sc.key.ground, sc.key.light].map((h) => h.match(/../g).map((c) => parseInt(c, 16)));
      const D = [0, 1, 2].map((k) => L[k] - G[k]);
      const DD = D.reduce((a, d) => a + d * d, 0);
      const floor = sc.key.floor ?? 0.15;
      for (let i = 0; i < px.length; i += 4) {
        const t = [0, 1, 2].reduce((a, k) => a + (px[i + k] - G[k]) * D[k], 0) / DD;
        const a = Math.min(1, Math.max(0, (t - floor) / (1 - floor)));
        for (let k = 0; k < 3; k++) px[i + k] = a > 0.02 ? Math.min(255, Math.max(0, Math.round(G[k] + (px[i + k] - G[k]) / Math.max(a, t)))) : L[k];
        px[i + 3] = Math.round(px[i + 3] * a);
      }
    }
    // a ground generated with a texture that is not its material's (a
    // photogram's paper came back crinkled, like foil): its broad mottle is
    // kept, blurred by `blur` px, and its grain replaced with the material's
    // own, from a fill tile built above (`tile`, its deviation from its
    // mean, repeated at `size` px across the frame), so the scene's paper is
    // the prints' paper. Laid in the silhouettes printed on it, too.
    const pp = sc.paper;
    const tooth = pp && (pp.layers.includes(layer) || sc.photogram?.layers.includes(layer)) ? await paperTooth(pp) : null;
    if (pp?.layers.includes(layer)) {
      // blurred premultiplied, so a layer's clear surround (a ghost
      // silhouette's) lends its edge no colour
      const pm = Buffer.from(px);
      for (let i = 0; i < pm.length; i += 4) for (let k = 0; k < 3; k++) pm[i + k] = Math.round((pm[i + k] * pm[i + 3]) / 255);
      const blurred = await sharp(pm, { raw: geometry(sized.info) }).blur(pp.blur).raw().toBuffer();
      for (let i = 0; i < px.length; i += 4) {
        const a = blurred[i + 3];
        px[i + 3] = a;
        for (let k = 0; k < 3; k++) px[i + k] = a ? Math.min(255, Math.round((blurred[i + k] * 255) / a)) : 0;
      }
    }
    // objects generated modelled (lit faces, bevels, cast shadows, a
    // texture on them) printed as a photogram prints them: where an object
    // lay the paper stays white (`color`), as far as it kept the light off:
    // its cover is its lightness from `lo` (nothing: the gap between two
    // keys, a cast shadow) to `hi` (all of it), times its alpha, and its edge
    // a little soft, as an object's edge, never pressed quite flat, prints
    const pg = sc.photogram;
    if (pg?.layers.includes(layer)) {
      const C = pg.color.match(/../g).map((c) => parseInt(c, 16));
      const [lo, hi] = pg.cover?.[layer] ?? pg.cover?.default ?? [140, 190];
      for (let i = 0; i < px.length; i += 4) {
        const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        const c = Math.min(1, Math.max(0, (l - lo) / (hi - lo)));
        px[i + 3] = Math.round(px[i + 3] * c * c * (3 - 2 * c));
        for (let k = 0; k < 3; k++) px[i + k] = C[k];
      }
      softenPremultiplied(px, sized.info.width, sized.info.height);
    }
    if (tooth)
      for (let y = 0, i = 0; y < sized.info.height; y++)
        for (let x = 0; x < sized.info.width; x++, i += 4) {
          const t = ((y % tooth.size) * tooth.size + (x % tooth.size)) * 3;
          for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.max(0, Math.round(px[i + k] + pp.amount * tooth.dev[t + k])));
        }
    // a light that falls off across the scene (a lamp off its upper left):
    // each layer is graded by its distance from `at` (fractions of the
    // frame), over `reach` (an ellipse, fractions of the frame), from 1 at
    // the light down to `floor` at its reach and past it, and, if the light
    // has a colour (`tint`, a gain), takes it on as far as the light reaches
    const fo = sc.falloff?.[finish];
    const tint = fo?.tint ?? [1, 1, 1];
    const smoothstep = (a, b, t) => {
      const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };
    const { width: SW, height: SH } = sized.info;
    // the light's colour, taken on in proportion to each pixel's own
    // lightness (a gain, the grade's `warm`): a lamp lights the pale shapes
    // it falls on and leaves the dark ground they lie on its own colour
    // (one product with the gain, never clamped between: a white warmed
    // past 255 before the gain darkens it would lose the warmth to the clamp)
    const warm = sc.grade?.[finish]?.warm ?? [1, 1, 1];
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 236) px[i + 3] = 255;
      const pale = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      const w = warm.map((c) => 1 + (c - 1) * pale);
      let [f, lit] = [1, 0];
      if (fo) {
        const q = i >> 2;
        const [u, v] = [((q % SW) / SW - fo.at[0]) / fo.reach[0], (Math.floor(q / SW) / SH - fo.at[1]) / fo.reach[1]];
        lit = 1 - smoothstep(0, 1, Math.hypot(u, v));
        f = fo.floor + (1 - fo.floor) * lit;
      }
      for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] * w[k] * g[k] * f * (1 + (tint[k] - 1) * lit)));
    }
    // a finish's grade beyond its gain: `saturation` (1 keeps it), and
    // `soften` passes of a [1 2 1] blur, mixed premultiplied so a clear edge
    // does not darken what it is mixed with (a generated night that came back
    // crisper and more saturated than its day)
    const gr = sc.grade?.[finish];
    if (gr?.saturation !== undefined)
      for (let i = 0; i < px.length; i += 4) {
        const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.max(0, Math.round(l + gr.saturation * (px[i + k] - l))));
      }
    for (let n = 0; n < (gr?.soften ?? 0); n++) softenPremultiplied(px, SW, SH);
    if (layer === "sky" && sc.sun?.at) {
      const lifted = liftSun(px, sized.info.width, sized.info.height, { box: sc.sun.box, sun: sc.sun.at[finish] });
      lifted.sky.copy(px);
      const sprite = `${TMP}/sun-${finish}.png`;
      await sharp(lifted.sprite, { raw: { width: lifted.spriteW, height: lifted.spriteH, channels: 4 } }).png().toFile(sprite);
      shadow(sprite, `${dir}/sun.webp`, sc.sun.pad, "3:6:8:0.30", "1:1.5:1.5:0.32");
      report.push(`scene/${finish}/sun: ${lifted.spriteW + 2 * sc.sun.pad}x${lifted.spriteH + 2 * sc.sun.pad}`);
    }
    const frame = await sharp(px, { raw: geometry(sized.info) }).png().toBuffer();
    await sharp(frame).webp({ quality: 78, alphaQuality: 90 }).toFile(`${dir}/${layer}.webp`);
    frames.push(frame);
  }
  if (frames.length !== sc.layers.length) continue;
  const [sky, ...rest] = frames;
  await sharp(sky).composite(rest.map((input) => ({ input }))).webp({ quality: 80 }).toFile(`${OUT}/scene-${finish}.webp`);
  report.push(`scene/${finish}: ${sc.layers.length} layers at 1920w, flattened to scene-${finish}.webp`);
}

// KEEP_TMP=1 keeps the intermediate bases, for trying state variants by hand
if (!process.env.KEEP_TMP) rmSync(TMP, { recursive: true, force: true });
console.log(report.join("\n"));
