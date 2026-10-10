// The home page's still life (the books, the pencil cup and the mug beside
// the copy) is one generated sprite; set against the mock's own props it was
// a little off in four places, and this corrects them on the generation's
// pixels (the generation is kept as still-life.gen.png; this writes
// still-life.png, which the kit's props step trims and resizes):
//   - the pencils stood about 14 mock px too tall and nearly touched the
//     "Try it live" pill (the mock leaves ~15 px of air): the strip above the
//     cup's rim is shortened;
//   - their erasers were pink, where the mock's pencils are capped in brass:
//     the erasers are recoloured to bronze;
//   - the cup was a quarter too wide: the cup, from its rim to the mug's top,
//     is narrowed about its own axis (the books and the mug stand in front
//     of the rest of it);
//   - the mug sat ~7 mock px high against the cup and the books: the mug is
//     lowered, and the cup behind it carried down to meet it.
//   node scripts/kits/solarpunk-still.mjs [art/raw/solarpunk/still-life]
import sharp from "sharp";
import { copyFileSync, existsSync } from "node:fs";

const dir = process.argv[2] ?? "art/raw/solarpunk/still-life";
const gen = `${dir}/still-life.gen.png`;
const out = `${dir}/still-life.png`;
if (!existsSync(gen)) copyFileSync(out, gen);

// the sprite's own pixels (1672x941; the props step trims it, then 1 raw px is
// about 0.24 mock px)
const PENCIL_TOP = 70; // the tallest pen's tip is at ~80
const RIM = 298; // the cup's rim begins; the pencils stand behind it
const CUP_X = 1113; // the cup's axis
const PENCILS_KY = 0.74; // and they stand lower still (210 raw px, 50 mock, become 155, 37)
const CUP_K = 0.82; // 297 raw px of rim (71 mock) become 244 (59); the pencils above it shrink with it
const MUG_TOP = 392; // the mug's rim begins (its arc's top, at its middle), in front of the cup
const CREST = 408; // below this the mug's rim reaches the cup; above it only the arc's crown stands
const MUG_DROP = 29; // 7 mock px
const BAND = [900, 1320]; // the columns the pencils and the cup occupy
const BOOKS_TOP = 364; // the stack's top edge, where it begins to hide the cup's left side
const BOOKS_END = 1034; // and where its right end is

const { data: src, info } = await sharp(gen).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const px = Buffer.from(src);
const at = (y, x) => (y * W + x) * 4;

function hsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx];
}

function fromHsv(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return [f(5), f(3), f(1)];
}

// ---- the pencils: the strip above the rim, brought in toward the cup's axis
// and down toward the rim (they stand in the cup, so they shrink with it) -----
{
  const [x0, x1] = BAND;
  const strip = await sharp(src, { raw: info }).extract({ left: x0, top: PENCIL_TOP, width: x1 - x0, height: RIM - PENCIL_TOP }).png().toBuffer();
  const newW = Math.round((x1 - x0) * CUP_K);
  const newH = Math.round((RIM - PENCIL_TOP) * PENCILS_KY);
  const left = Math.round(CUP_X - (CUP_X - x0) * CUP_K);
  const { data: short } = await sharp(strip).resize(newW, newH, { fit: "fill", kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = PENCIL_TOP; y < RIM; y++) for (let x = x0; x < x1; x++) px[at(y, x) + 3] = 0;
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const s = (y * newW + x) * 4;
      const d = at(RIM - newH + y, left + x);
      if (short[s + 3] === 0) continue;
      px[d] = short[s];
      px[d + 1] = short[s + 1];
      px[d + 2] = short[s + 2];
      px[d + 3] = short[s + 3];
    }
  }
  // the erasers: salmon pink to a bronze cap, the light kept
  for (let y = RIM - newH; y < RIM; y++) {
    for (let x = left; x < left + newW; x++) {
      const i = at(y, x);
      if (px[i + 3] < 8) continue;
      const [h, s, v] = hsv(px[i], px[i + 1], px[i + 2]);
      if ((h < 24 || h > 340) && s > 0.28 && v > 90) {
        const [r, g, b] = fromHsv(38, Math.min(0.72, s * 0.9 + 0.1), v * 0.78);
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
      }
    }
  }
}

// ---- the mug: taken off, so the cup behind it can be narrowed whole -------
const mug = [];
{
  const base = Buffer.from(px);
  // The mug's left edge by row: where the cup's brass gives way to a run of
  // anything else (the cup's glints are short, the mug's rim and body long).
  // Above the mug's rim only its arc's crown stands, right of the cup, and
  // all of that is the mug.
  const brass = (y, x) => {
    const i = at(y, x);
    if (base[i + 3] < 200) return false;
    const [h, s] = hsv(base[i], base[i + 1], base[i + 2]);
    return h > 18 && h < 58 && s > 0.72;
  };
  const mugLeft = (y) => {
    if (y < CREST) return 1222;
    for (let x = 1085; x < 1400; x++) {
      let run = 0;
      while (run < 10 && !brass(y, x + run)) run++;
      if (run === 10) return x;
    }
    return 1400;
  };
  for (let y = MUG_TOP; y < H; y++) {
    for (let x = mugLeft(y); x < W; x++) {
      const i = at(y, x);
      if (base[i + 3] === 0 || (y < CREST && brass(y, x))) continue;
      mug.push([y, x, base[i], base[i + 1], base[i + 2], base[i + 3]]);
      px[i + 3] = 0;
    }
  }
}

// ---- the cup: narrowed about its axis, from its rim to where the lowered
// mug's top will stand ---------------------------------------------------------
const CUP_END = MUG_TOP + MUG_DROP + 36; // the lowered rim's left tip is lower than its crown
{
  const before = Buffer.from(px);
  for (let y = RIM; y < CUP_END; y++) {
    // below the books' top the stack stands in front of the cup's left side
    // (its gilt edge is brass too, so the edge is taken at the stack's end)
    const bookEnd = y < BOOKS_TOP ? BAND[0] : BOOKS_END;
    for (let x = bookEnd + 1; x < BAND[1]; x++) {
      const xs = Math.max(bookEnd + 2, CUP_X + (x - CUP_X) / CUP_K);
      const x0 = Math.floor(xs);
      const t = xs - x0;
      const a = at(y, x0);
      const b = at(y, Math.min(W - 1, x0 + 1));
      const wa = (before[a + 3] / 255) * (1 - t);
      const wb = (before[b + 3] / 255) * t;
      const w = wa + wb;
      const d = at(y, x);
      if (w < 0.02 || xs > BAND[1]) {
        px[d + 3] = 0;
        continue;
      }
      for (let c = 0; c < 3; c++) px[d + c] = Math.round((before[a + c] * wa + before[b + c] * wb) / w);
      px[d + 3] = Math.round(w * 255);
    }
  }
}

// ---- the cup's face carried down behind the lowered mug (its shading runs
// down the cup), then the mug put back -------------------------------------------
{
  const cupRight = Math.round(CUP_X + (1248 - CUP_X) * CUP_K);
  for (let y = MUG_TOP; y < CUP_END; y++) {
    for (let x = 1085; x <= cupRight; x++) {
      const i = at(y, x);
      if (px[i + 3] > 200) continue;
      const s = at(MUG_TOP - 4, x);
      if (px[s + 3] === 0) continue;
      px[i] = px[s];
      px[i + 1] = px[s + 1];
      px[i + 2] = px[s + 2];
      px[i + 3] = px[s + 3];
    }
  }
  for (const [y, x, r, g, b, a] of mug) {
    const i = at(y + MUG_DROP, x);
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  }
}

await sharp(px, { raw: info }).png().toFile(out);
console.log(`${out}: cup and pencils ${CUP_K}, mug down ${MUG_DROP}`);
