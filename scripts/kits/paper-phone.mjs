// Cut the Paper Diorama's phone scene: the portrait mock's own landscape
// (art/originals/paper-phone.webp, 927x1697: a clear sun, the hiker on the
// hill, tall pines flanking both edges, layered hills), not a crop of the
// desktop scene.
//   node scripts/kits/paper-phone.mjs        (then: node scripts/build-kit.mjs paper)
//
// From generations in art/raw/paper (prompts in art/prompts/paper), in
// register with one another and with the mock:
//   phone-plate-day         the mock with its interface painted out
//   phone-plate-night       an edit of it by moonlight
//   phone-remove-left       the plate with the left pine taken out
//   phone-remove-right      the same with the hiker and the right pine taken out
//   phone-sky-day           the sky alone, sun and clouds whole
// cut into four layers (scripts/kits/paper-scene4.mjs: the sky, the land, the
// left cut-out, the right one), as the two further pages' scenes are.
//
// The kit's scene frames, and the 3D scene's planes, are 16:9 whatever the
// screen: a phone's `cover` shows the middle of the frame, full height. So the
// portrait is the middle of a 1920x1080 frame, 590px wide (the mock scaled to
// the frame's height), which is exactly what a phone of the mock's own shape
// (390x714) shows; a taller phone sees a little less of each side. The sides
// of the frame are for the screens wider than that (a tablet, a phone on its
// side), made of the scene itself:
//   - the sky: its own paper run on, the sun taken out of the copy (one sun)
//   - the land: its mirror, as the 3D scene mirrors a layer's overscan
//   - the cut-outs: the left pine's piece at the frame's left edge and the
//     right one's at its right edge (paper.css anchors each to its side), so a
//     pine and the hiker keep to their edges on any shape of screen.
//
// Writes art/raw/paper/layer-<raw>-phone-<finish>/registered.png (the kit's
// scene finishes phone-day and phone-night, in scripts/kits/paper.mjs).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { cutting } from "./paper-cut.mjs";
import { cutFourLayers, NAMES, SKY, LAND, LEFT, RIGHT } from "./paper-scene4.mjs";

const RAW = "art/raw/paper";
const [FW, FH] = [1920, 1080];
const [CW, CH] = [Math.round((927 * FH) / 1697), FH];
const X0 = (FW - CW) / 2;

const rgb = async (name) =>
  (await sharp(`${RAW}/${name}/${name}.png`).resize(CW, CH, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
const [plate, night, removeLeft, removeRight, sky] = await Promise.all(["plate-day", "plate-night", "remove-left", "remove-right", "sky-day"].map((n) => rgb(`phone-${n}`)));

// where to look for each cut-out's removal (read off the plate, in the core's
// px: the left pine, and the hiker with the right pine) and the row the land
// never rises above (the mountains' peak is at ~y 111)
const cut = await cutFourLayers({ W: CW, H: CH, plate, night, removeLeft, removeRight, sky, left: [0, 120, 170, 460], right: [430, 130, CW - 1, 470], land: 100,
  // the sun's peach paper is never the land, where the sky alone drew its rim a little off
  notLand: (px, p) => px[p] > 170 && px[p] - px[p + 2] > 60,
});

// ---- the sun, taken out of the sky's copy ----
// the disc is the peach paper (the moon, by night, the same place): found in
// the day sky, grown a few px, and replaced by the plain sky below it (the sky
// alone is clear down to its foot), corrected for the blue's deepening toward
// the horizon by the difference of the two rows' blue at the disc's sides
const sunMask = (() => {
  const { N, blur } = cutting(CW, CH);
  const m = new Float32Array(N);
  for (let y = 60; y < 230; y++)
    for (let x = 300; x < 560; x++) {
      const p = (y * CW + x) * 4;
      if (cut.day[SKY][p] > 170 && cut.day[SKY][p] - cut.day[SKY][p + 2] > 60) m[y * CW + x] = 1;
    }
  return Uint8Array.from(blur(m, 6, 1), (v) => (v > 0.02 ? 1 : 0));
})();
const sunless = (px) => {
  const out = Buffer.from(px);
  // the sun's rows and columns
  let [y0, y1, x0, x1] = [CH, 0, CW, 0];
  for (let i = 0; i < sunMask.length; i++)
    if (sunMask[i]) {
      const [x, y] = [i % CW, (i / CW) | 0];
      [y0, y1, x0, x1] = [Math.min(y0, y), Math.max(y1, y), Math.min(x0, x), Math.max(x1, x)];
    }
  const drop = y1 - y0 + 40;
  const side = (y) => {
    const t = [0, 0, 0];
    let n = 0;
    for (let k = 0; k < 40; k++)
      for (const x of [x0 - 50 + k, x1 + 10 + k]) {
        const q = (y * CW + Math.min(CW - 1, Math.max(0, x))) * 4;
        for (let c = 0; c < 3; c++) t[c] += px[q + c];
        n++;
      }
    return t.map((v) => v / n);
  };
  for (let y = y0; y <= y1; y++) {
    const [here, below] = [side(y), side(y + drop)];
    for (let x = x0; x <= x1; x++) {
      if (!sunMask[y * CW + x]) continue;
      const p = ((y + drop) * CW + x) * 4;
      for (let c = 0; c < 3; c++) out[(y * CW + x) * 4 + c] = Math.max(0, Math.min(255, Math.round(px[p + c] + here[c] - below[c])));
    }
  }
  return out;
};

const reflect = (x, w) => {
  const m = ((x % (2 * w)) + 2 * w) % (2 * w);
  return m < w ? m : 2 * w - 1 - m;
};

/** a layer's core in the middle of the frame, its sides the core mirrored
 *  (`plain`, if given, is the copy the sides are mirrored from) */
const centred = (core, plain = core) => {
  const out = Buffer.alloc(FW * FH * 4);
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const inCore = x >= X0 && x < X0 + CW;
      const src = inCore ? core : plain;
      const sx = inCore ? x - X0 : reflect(x - X0, CW);
      src.copy(out, (y * FW + x) * 4, (y * CW + sx) * 4, (y * CW + sx) * 4 + 4);
    }
  return out;
};

/** a cut-out's core at the frame's left (`at` 0) or right (`at` FW - CW) edge, nothing else */
const sided = (core, at) => {
  const out = Buffer.alloc(FW * FH * 4);
  for (let y = 0; y < FH; y++) core.copy(out, (y * FW + at) * 4, y * CW * 4, (y + 1) * CW * 4);
  return out;
};

for (const [finish, set] of [["day", cut.day], ["night", cut.night]]) {
  const frames = [
    centred(set[SKY], sunless(set[SKY])),
    centred(set[LAND]),
    sided(set[LEFT], 0),
    sided(set[RIGHT], FW - CW),
  ];
  for (let k = 0; k < 4; k++) {
    const dir = `${RAW}/layer-${NAMES[k]}-phone-${finish}`;
    mkdirSync(dir, { recursive: true });
    await sharp(frames[k], { raw: { width: FW, height: FH, channels: 4 } }).png().toFile(`${dir}/registered.png`);
  }
}
console.log(`phone scene layers cut: ${NAMES.join(", ")} (day, night), core ${CW}x${CH} at x ${X0} of ${FW}x${FH}`);
