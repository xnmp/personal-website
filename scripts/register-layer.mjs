// Register one generated scene layer against the others.
//   node scripts/register-layer.mjs <in.png> <out.png> [--dy=N] [--reflect] [--scale=S --anchor=left|right]
//
// Each scene layer is generated on its own, and the generator reframes a
// little every time. So a layer can come back sitting higher than it did in
// the full scene: the far hills, for instance, covering the mountains.
// --dy moves the layer's content down N px within its frame (the frame size
// is kept, so every layer still fits with the same `cover`).
// --reflect fills each column below the layer's lowest opaque pixel with a
// mirror image of the paper just above it. The near layers sink faster than
// this one when the page scrolls, so its lower edge must never show; a
// mirror keeps the paper texture, where a smear would streak.
// --scale shrinks (or grows) the content by S about the frame's bottom-left
// or bottom-right corner (--anchor), so a prop standing on the bottom edge
// at the side of the frame keeps standing there. Layers generated together
// (a grove's back and front rows) take the same scale, so they stay in
// register with each other.
import sharp from "sharp";

const args = process.argv.slice(2);
const [src, out] = args.filter((a) => !a.startsWith("--"));
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((f) => f.slice(2).split("=")));
if (!src || !out) {
  console.error("usage: register-layer.mjs <in> <out> [--dy=N] [--reflect]");
  process.exit(1);
}
const DY = Math.round(+(opt.dy ?? 0));
const REFLECT = "reflect" in opt;

const SCALE = +(opt.scale ?? 1);
const ANCHOR = opt.anchor ?? "left";
if (!(SCALE > 0) || !["left", "right"].includes(ANCHOR)) {
  console.error("--scale must be > 0 and --anchor left or right");
  process.exit(1);
}

const { width: W, height: H } = await sharp(src).metadata();
let input = sharp(src).ensureAlpha();
if (SCALE !== 1) {
  const w = Math.round(W * SCALE);
  const h = Math.round(H * SCALE);
  const scaled = await sharp(src).ensureAlpha().resize(w, h, { kernel: "lanczos3" }).png().toBuffer();
  // place it in a frame of the original size, on the anchor corner; what
  // runs past the frame is cropped
  const left = ANCHOR === "left" ? 0 : W - w;
  const top = H - h;
  const crop = { left: Math.max(0, -left), top: Math.max(0, -top), width: Math.min(w, W), height: Math.min(h, H) };
  const piece = await sharp(scaled).extract(crop).png().toBuffer();
  input = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]);
  input = sharp(await input.png().toBuffer());
}
const data = await input.raw().toBuffer();
const px = Buffer.alloc(W * H * 4); // transparent

// move the content down by DY (what falls off the bottom is dropped)
for (let y = 0; y < H; y++) {
  const sy = y - DY;
  if (sy < 0 || sy >= H) continue;
  data.copy(px, y * W * 4, sy * W * 4, (sy + 1) * W * 4);
}

if (REFLECT) {
  for (let x = 0; x < W; x++) {
    let last = -1;
    for (let y = H - 1; y >= 0; y--) if (px[(y * W + x) * 4 + 3] > 200) { last = y; break; }
    if (last < 0) continue; // nothing in this column (sky above the layer)
    for (let y = last + 1; y < H; y++) {
      const my = Math.max(0, 2 * last - y);
      px.copy(px, (y * W + x) * 4, (my * W + x) * 4, (my * W + x) * 4 + 4);
      px[(y * W + x) * 4 + 3] = 255;
    }
  }
}

await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
console.log(`${out} ${W}x${H} dy=${DY}${REFLECT ? " reflect" : ""}${SCALE !== 1 ? ` scale=${SCALE} from the bottom ${ANCHOR}` : ""}`);
