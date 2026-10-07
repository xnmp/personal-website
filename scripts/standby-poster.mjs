// A powered-down frame of the live demo: the real app, desaturated and dimmed
// behind phosphor scanlines, so the screen shows the product before it boots
// without reading as a running app.
//   node scripts/standby-poster.mjs <capture.png> <out.webp>
import sharp from "sharp";

const [, , src, out] = process.argv;
const { data, info } = await sharp(src).modulate({ saturation: 0.35, brightness: 0.5 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const o = Buffer.from(data);
for (let y = 0; y < info.height; y++) {
  const k = y % 3 === 2 ? 0.62 : 1; // every third row is the gap between phosphor lines
  for (let x = 0; x < info.width; x++)
    for (let c = 0; c < 3; c++) {
      const p = (y * info.width + x) * 3 + c;
      o[p] = Math.round(o[p] * k);
    }
}
await sharp(o, { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 82 }).toFile(out);
console.log(out, info.width, info.height);
