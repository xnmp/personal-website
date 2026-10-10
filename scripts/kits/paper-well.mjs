// Cut the grain of the screens' paper (art/briefs/paper.md, device 10): the
// well each screen sits in is a printed sheet pasted flush into the card, so it
// carries the card stock's own tooth and fibre. This lifts that tooth off the
// stock's generation (art/raw/paper/card-cream), as a neutral texture laid over
// the well's colour in `overlay` (paper.css), so one file serves the day's
// light paper and the night's dark one.
//   node scripts/kits/paper-well.mjs        (writes public/kit/paper/well-grain.webp)
//
// The patch is clear paper from the middle of the card (no torn edge), made
// tileable by mirroring it on both axes (noise survives a mirror unseen), at
// the card's own scale on the page (the card is ~0.495 of its art: paper.css
// draws the tile at 0.495 of its pixels). Its high pass keeps the fibre and
// the tooth and drops the stock's slow changes of tone, and is scaled so the
// grain lands near the stock's own on a light well: the card's measures 4
// levels (sd) over its patch, and `overlay` over a light base passes about a
// quarter of the texture's amplitude (twice the base's distance from white),
// so the texture stands at ~22 levels.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "art/raw/paper/card-cream/card-cream.png";
const OUT = "public/kit/paper/well-grain.webp";
const PATCH = { left: 110, top: 545, width: 450, height: 300 };
const BLUR = 18; // what counts as the stock's own tone, not tooth
const SD = 22; // the texture's std, in levels around 128

const grey = await sharp(SRC).extract(PATCH).removeAlpha().greyscale().raw().toBuffer();
const low = await sharp(SRC).extract(PATCH).removeAlpha().greyscale().blur(BLUR).raw().toBuffer();
const high = Float32Array.from(grey, (v, i) => v - low[i]);
const mean = high.reduce((a, b) => a + b, 0) / high.length;
const sd = Math.sqrt(high.reduce((a, b) => a + (b - mean) ** 2, 0) / high.length);
const k = SD / sd;
const tex = Uint8Array.from(high, (v) => Math.max(0, Math.min(255, Math.round(128 + (v - mean) * k))));

// the mirrored tile: [P | P flipped] over [P flipped | both]
const { width: w, height: h } = PATCH;
const tile = new Uint8Array(w * 2 * h * 2);
for (let y = 0; y < h * 2; y++) {
  const sy = y < h ? y : h * 2 - 1 - y;
  for (let x = 0; x < w * 2; x++) {
    const sx = x < w ? x : w * 2 - 1 - x;
    tile[y * w * 2 + x] = tex[sy * w + sx];
  }
}

mkdirSync("public/kit/paper", { recursive: true });
await sharp(tile, { raw: { width: w * 2, height: h * 2, channels: 1 } })
  .webp({ quality: 60, smartSubsample: true })
  .toFile(OUT);
console.log(`${OUT}: ${w * 2}x${h * 2}, patch sd ${sd.toFixed(2)} scaled x${k.toFixed(2)}`);
