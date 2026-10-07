// Contact sheet for reviewing generated assets: node scripts/contact-sheet.mjs out.jpg cellW cols img...
import sharp from "sharp";
const [, , out, cellW = "400", cols = "4", ...imgs] = process.argv;
const w = +cellW, c = +cols;
const cells = await Promise.all(imgs.map(async (p) => {
  const buf = await sharp(p).resize({ width: w, height: w, fit: "contain", background: "#808080" }).png().toBuffer();
  return buf;
}));
const rows = Math.ceil(cells.length / c);
await sharp({ create: { width: w * c, height: w * rows, channels: 3, background: "#808080" } })
  .composite(cells.map((input, i) => ({ input, left: (i % c) * w, top: Math.floor(i / c) * w })))
  .jpeg({ quality: 85 }).toFile(out);
console.log(out);
