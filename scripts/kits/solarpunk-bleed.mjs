// Solarpunk's plates painted on past the mock's edges (kit.css: a plate's
// sky is registered to the stage and its bleed fills the frame round it at
// any aspect), made in two hand steps round each generation, per finish
// (day, night, project-day, project-night, launch-day, launch-night: the
// home page's plate and the two inner pages' own):
//   node scripts/kits/solarpunk-bleed.mjs ref <finish>
//     writes bleed-<finish>/ref.png: the plate (layer-sky-<finish>/
//     layer-sky-<finish>.core.png, 1672x941) at (320, 0) on a flat grey
//     2312x1301 canvas (16:9) to be painted out
//   (generate: art/prompts/solarpunk/bleed-<finish>.txt on it, with
//    scripts/gen-asset.sh -> bleed-<finish>/bleed-<finish>.png)
//   node scripts/kits/solarpunk-bleed.mjs assemble <finish>
//     writes layer-sky-<finish>/layer-sky-<finish>.png: the generation
//     scaled to the canvas and cropped to 2312x1261 (320 mock px each side
//     and below; solarpunk.css --sky-bleed-x, --sky-bleed-bottom, the
//     recipe's scene.bleed), the core pasted back over it, feathered over
//     24px on its left, right and bottom edges, so the core is pixel-exact
// then: node scripts/build-kit.mjs solarpunk
// (The night finishes are painted out from the grey canvas as the day is: a
// relit day bleed kept the day's floor under the night's dark foreground, a
// hard step at both lower corners.)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const R = "art/raw/solarpunk";
const [W, H, X, CW, CH, F, PH] = [2312, 1261, 320, 1672, 941, 24, 1301];
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const [mode, finish] = process.argv.slice(2);
if (!["ref", "assemble"].includes(mode) || !finish) {
  console.error("usage: solarpunk-bleed.mjs ref|assemble <finish>");
  process.exit(1);
}
const core = `${R}/layer-sky-${finish}/layer-sky-${finish}.core.png`;

if (mode === "ref") {
  mkdirSync(`${R}/bleed-${finish}`, { recursive: true });
  await sharp({ create: { width: W, height: PH, channels: 3, background: { r: 128, g: 128, b: 128 } } })
    .composite([{ input: await sharp(core).removeAlpha().png().toBuffer(), left: X, top: 0 }])
    .png()
    .toFile(`${R}/bleed-${finish}/ref.png`);
  console.log(`bleed-${finish}/ref.png: ${W}x${PH}`);
} else {
  const src = `${R}/bleed-${finish}/bleed-${finish}.png`;
  const bleed = await sharp(src).resize(W, PH, { fit: "fill", kernel: "lanczos3" }).extract({ left: 0, top: 0, width: W, height: H }).removeAlpha().png().toBuffer();
  const c = await sharp(core).removeAlpha().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const d = c.data;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) d[(y * CW + x) * 4 + 3] = Math.round(255 * smooth(Math.min(x, CW - 1 - x, CH - 1 - y) / F));
  const coreA = await sharp(d, { raw: c.info }).png().toBuffer();
  await sharp(bleed).composite([{ input: coreA, left: X, top: 0 }]).png().toFile(`${R}/layer-sky-${finish}/layer-sky-${finish}.png`);
  console.log(`layer-sky-${finish}: ${W}x${H}, core at ${X},0`);
}
