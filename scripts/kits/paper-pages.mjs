// Cut the scenes of the Paper Diorama's two further pages: the project page's
// (the blue gothic cathedral on its winding stair, the red sun, the cloaked
// wanderer and the brown trunk: art/originals/paper-project.webp) and the
// launch page's (the sun at the upper right, the hiker in the orange jacket
// with his dog at the lower left: art/originals/paper-launch.webp).
//   node scripts/kits/paper-pages.mjs        (then: node scripts/build-kit.mjs paper)
//
// Each scene is cut as the home's is (scripts/kits/paper-layers.mjs), from
// generations in art/raw/paper (prompts in art/prompts/paper), but from four
// layers, back to front: the sky, the land (mountains and hills), the left
// cut-out and the right one (scripts/kits/paper-scene4.mjs, which the phone's
// scene is cut by too). Per page <p> (proj, launch):
//   <p>-plate-day         the mock with its interface painted out
//   <p>-plate-night       an edit of it by moonlight (the two register)
//   <p>-remove-left       the plate with what stands at its left edge taken out
//   <p>-remove-right      the same at its right edge
//   <p>-sky-day           the sky alone, sun and clouds whole
// Where one of these differs from the plate is the band: a left or right
// cut-out where its removal does, the land where the sky alone does (below
// the skyline, from a row the land never rises above). A band carries the
// plate's pixels where it shows, so the settled scene is the plate, and what
// the nearer band's removal shows behind it where that covers it, so a layer
// that rises or slides uncovers the scene continued, never a hole. By night
// the labels are the day's; the colours where a band shows are the night
// plate's, and its hidden parts are the day's fills graded by that band's own
// day-to-night ratio. Every source is sharpened once (sigma 0.8) against the
// page's two resamplings of a layer (the kit frames the 1672 cut at 1920; the
// browser scales that back).
//
// Writes art/raw/paper/layer-<raw>-<page>-<finish>/registered.png (the kit's
// scene finishes project-day, project-night, launch-day, launch-night, in
// scripts/kits/paper.mjs).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { W, H, N, components } from "./paper-cut.mjs";
import { cutFourLayers, NAMES, LAND, LEFT, RIGHT } from "./paper-scene4.mjs";

const RAW = "art/raw/paper";
const rgb = async (name) =>
  (await sharp(`${RAW}/${name}/${name}.png`).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;

// where to look for each cut-out's removal (regions of interest read off the
// plate; outside them any difference is the generator's noise, not the band),
// and the row the land never rises above (what differs from the sky higher up
// is the sun's or a cloud's edge, drawn a little otherwise)
const PAGES = {
  project: { src: "proj", left: [0, 0, 540, H - 1], right: [1130, 0, W - 1, H - 1], land: 340 },
  launch: { src: "launch", left: [0, 150, 440, H - 1], right: [1450, 200, W - 1, H - 1], land: 250 },
};

// The project mock's cloaked wanderer stands at the foot of the left cut-out,
// where the page's own sheet (taller or shorter with its copy) comes down over
// him. He is moved, as a cut-out of his own, to the stone path below the
// print, which no sheet reaches: his pixels are taken from the left layer
// (the cloak and staff are red-brown and dark; the scenery carried into that
// layer around him is not), the layer's hole shows the land behind it (the
// removal continued it), and he is laid on the land layer, scaled, with his
// feet at `feet` (mock px). A deliberate departure from the mock (brief).
const WANDERER = { seed: [300, 760], box: [225, 665, 400, 837], boots: [[266, 834, 302, 852], [316, 834, 346, 852], [348, 834, 362, 852]], feet: [1040, 796], scale: 0.62 };

// The launch mock's foreground, at the foot of the page's stage, is stage art
// (scripts/kits/paper-front.mjs: the hiker with his dog and rock, and the
// pines at the ledge's ends, each a piece of cut paper laid over the ledge in
// the page's own px, so they register at any shape of screen and scroll with
// the sheets). It is taken out of the scene's layers, so no frame shows two of
// it: from the left cut-out everything below the spruce at the top of its
// edge (the hiker, dog, rock, hill chips and the pines at the foot; the
// spruce's own boughs, which lie in the same box, stay), from the right one
// the lowest pines (a component of their own, from y 741). The land layer's
// removal fill shows behind.
const SPRUCE = (r, g, b) => r + g + b < 250 && g >= r - 6 && g - b <= 14;
/** clears the stage art from a finish's frames; `day` is the day's left frame, whose colours say what is spruce (both finishes share its alpha) */
const stageGone = (set, day) => {
  const [left, right] = [set[LEFT], set[RIGHT]];
  for (let y = 515; y < H; y++)
    for (let x = 0; x < 420; x++) {
      const p = (y * W + x) * 4;
      if (y >= 560 || (x >= 118 && y >= 528) || (x >= 100 && !SPRUCE(day[p], day[p + 1], day[p + 2]))) left[p + 3] = 0;
    }
  for (let y = 736; y < H; y++) for (let x = 1440; x < W; x++) right[(y * W + x) * 4 + 3] = 0;
};

/** 1 within `r` px (square) of `on` */
const grown = (on, r) => {
  const out = new Uint8Array(N);
  for (let y = r; y < H - r; y++)
    for (let x = r; x < W - r; x++)
      for (let dy = -r; dy <= r && !out[y * W + x]; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (on[(y + dy) * W + x + dx]) {
            out[y * W + x] = 1;
            break;
          }
  return out;
};

/** the wanderer's pixels in the day left layer: red-brown or dark, in his box, joined to the seed */
const wandererMask = (left) => {
  const [x0, y0, x1, y1] = WANDERER.box;
  const on = new Uint8Array(N);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const p = (y * W + x) * 4;
      if (left[p + 3] < 200) continue;
      const [r, g, b] = [left[p], left[p + 1], left[p + 2]];
      if ((r - g > 16 && r - b > 20) || (r + g + b < 170 && r >= g - 4 && r >= b - 4)) on[y * W + x] = 1;
    }
  const mask = new Uint8Array(N);
  const seed = WANDERER.seed[1] * W + WANDERER.seed[0];
  components(on, (px) => px.includes(seed) && px.forEach((i) => (mask[i] = 1)));
  // (his boots' last rows and the staff's foot, under the cut at the ledge's top:
  // the darkest paper there, painted over from the ledge's own below)
  const boots = new Uint8Array(N);
  for (const [x0, y0, x1, y1] of WANDERER.boots)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const p = (y * W + x) * 4;
        if (left[p + 3] && left[p] + left[p + 1] + left[p + 2] < 125) boots[y * W + x] = 1;
      }
  return { mask, boots };
};

/** `set` (the four frames of a finish) with the wanderer lifted off the left layer and stood on the land */
const relocated = async (set, { mask, boots }) => {
  const [hole, edge] = [grown(mask, 2), grown(mask, 1)];
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  for (let i = 0; i < N; i++)
    if (edge[i]) [x0, y0, x1, y1] = [Math.min(x0, i % W), Math.min(y0, (i / W) | 0), Math.max(x1, i % W), Math.max(y1, (i / W) | 0)];
  const [w, h] = [x1 - x0 + 1, y1 - y0 + 1];
  const fig = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y0 + y) * W + x0 + x;
      if (!edge[i]) continue;
      set[LEFT].copy(fig, (y * w + x) * 4, i * 4, i * 4 + 3);
      fig[(y * w + x) * 4 + 3] = 255;
    }
  const [tw, th] = [Math.round(w * WANDERER.scale), Math.round(h * WANDERER.scale)];
  const small = await sharp(fig, { raw: { width: w, height: h, channels: 4 } }).resize(tw, th, { kernel: "lanczos3" }).png().toBuffer();
  // a contact shadow under his feet, so he stands on the path
  const [fx, fy] = WANDERER.feet;
  const shade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><filter id="b"><feGaussianBlur stdDeviation="2"/></filter><ellipse cx="${fx}" cy="${fy - 1}" rx="${(tw * 0.42).toFixed(1)}" ry="4" fill="#1e140f" fill-opacity="0.42" filter="url(#b)"/></svg>`,
  );
  const land = await sharp(set[LAND], { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: shade }, { input: small, left: Math.round(fx - tw / 2), top: fy - th }])
    .raw()
    .toBuffer();
  const leftLayer = Buffer.from(set[LEFT]);
  for (let i = 0; i < N; i++) {
    if (hole[i]) leftLayer.fill(0, i * 4, i * 4 + 4);
    else if (boots[i]) set[LEFT].copy(leftLayer, i * 4, (i + 9 * W) * 4, (i + 9 * W) * 4 + 3);
  }
  return set.map((frame, k) => (k === LAND ? land : k === LEFT ? leftLayer : frame));
};

for (const [page, { src, left, right, land }] of Object.entries(PAGES)) {
  const [plate, night, removeLeft, removeRight, sky] = await Promise.all(["plate-day", "plate-night", "remove-left", "remove-right", "sky-day"].map((n) => rgb(`${src}-${n}`)));
  let cut = await cutFourLayers({ W, H, plate, night, removeLeft, removeRight, sky, left, right, land });
  if (page === "project") {
    const mask = wandererMask(cut.day[LEFT]);
    cut = { day: await relocated(cut.day, mask), night: await relocated(cut.night, mask) };
  }
  if (page === "launch") {
    const dayLeft = Buffer.from(cut.day[LEFT]);
    for (const set of [cut.day, cut.night]) stageGone(set, dayLeft);
  }
  for (const [finish, set] of [["day", cut.day], ["night", cut.night]])
    for (let k = 0; k < 4; k++) {
      const dir = `${RAW}/layer-${NAMES[k]}-${page}-${finish}`;
      mkdirSync(dir, { recursive: true });
      await sharp(set[k], { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${dir}/registered.png`);
    }
  console.log(`${page} scene layers cut: ${NAMES.join(", ")} (day, night)`);
}
