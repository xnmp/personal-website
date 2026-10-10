// Cut a Paper Diorama scene of four layers, back to front: the sky, the land
// (mountains and hills), the left cut-out and the right one. Shared by the two
// further pages' scenes (scripts/kits/paper-pages.mjs, on the mock's 1672x941)
// and the phone's (scripts/kits/paper-phone.mjs, on its portrait core).
//
// From generations, all in register to the pixel (the callers read and size them):
//   plate         the mock with its interface painted out
//   night         an edit of it by moonlight
//   removeLeft    the plate with what stands at its left edge taken out
//   removeRight   the same at its right edge
//   sky           the sky alone, sun and clouds whole
// Where one of these differs from the plate is the band: a left or right
// cut-out where its removal does, the land where the sky alone does (below
// the skyline, from a row the land never rises above). A band carries the
// plate's pixels where it shows, so the settled scene is the plate, and what
// the nearer band's removal shows behind it where that covers it, so a layer
// that rises or slides uncovers the scene continued, never a hole. By night
// the labels are the day's; the colours where a band shows are the night
// plate's, and its hidden parts are the day's fills graded by that band's own
// day-to-night ratio. Every source is sharpened once (sigma 0.8) against the
// page's two resamplings of a layer (the kit frames the cut at 1920; the
// browser scales that back).
import sharp from "sharp";
import { cutting } from "./paper-cut.mjs";

export const SKY = 0, LAND = 1, LEFT = 2, RIGHT = 3;
// the raws' names the kit's scene slots take (scripts/kits/paper.mjs scene.layers)
export const NAMES = ["sky", "hills-far", "pines-left", "pines-right"];

/**
 * @param {{W: number, H: number, plate: Buffer, night: Buffer, removeLeft: Buffer, removeRight: Buffer, sky: Buffer,
 *          left: number[], right: number[], land: number}} o
 *   the generations as W x H RGBA; `left` and `right` are where to look for each
 *   cut-out's removal (regions of interest read off the plate [x0, y0, x1, y1]:
 *   outside them any difference is the generator's noise, not the band), `land`
 *   the row the land never rises above (what differs from the sky higher up is
 *   the sun's or a cloud's edge, drawn a little otherwise); `notLand(plate, p)`,
 *   if given, marks plate pixels (at byte offset p) that are never the land
 *   (the sun's rim, where the sky alone drew its disc a little otherwise)
 * @returns {{day: Buffer[], night: Buffer[]}} four RGBA frames each, back to front
 */
export async function cutFourLayers({ W, H, plate, night, removeLeft, removeRight, sky, left, right, land, notLand }) {
  const { N, blur, distance, solid } = cutting(W, H);
  // the specks and holes a mask drops are sized for the mock's frame
  const area = N / (1672 * 941);
  const crisp = async (px) =>
    (await sharp(px, { raw: { width: W, height: H, channels: 4 } }).sharpen({ sigma: 0.8, m1: 0.4, m2: 1.5 }).raw().toBuffer({ resolveWithObject: true })).data;
  const [dayShown, nightShown, fillLeft, fillRight, fillSky] = await Promise.all([plate, night, removeLeft, removeRight, sky].map(crisp));

  const mask = new Array(4);
  mask[RIGHT] = solid(distance(plate, removeRight, right), 70, 1200 * area, 6000 * area);
  mask[LEFT] = solid(distance(plate, removeLeft, left), 70, 1200 * area, 6000 * area);
  // the land: where the plate stands off the sky alone (a few px of blur so
  // its grain never counts, the mountains' blue being near the sky's)
  const apart = new Float32Array(N);
  for (let y = land; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (notLand?.(plate, p)) continue;
      apart[y * W + x] = Math.abs(plate[p] - sky[p]) + Math.abs(plate[p + 1] - sky[p + 1]) + Math.abs(plate[p + 2] - sky[p + 2]);
    }
  mask[LAND] = solid(blur(apart, 4, 2), 46, 3000 * area, 40000 * area);

  /** the land's outline per column: the first row of a solid run of it. Where
   *  a cut-out covers the column before the land shows, the outline is hidden
   *  there and runs on between the columns either side. */
  const nearer = (i) => mask[LEFT][i] === 1 || mask[RIGHT][i] === 1;
  const raw = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H - 6; y++) {
      const i = y * W + x;
      if (nearer(i)) break;
      let run = true;
      for (let r = 0; r < 6 && run; r++) run = mask[LAND][i + r * W] === 1;
      if (run) {
        raw[x] = y;
        break;
      }
    }
  const known = [...raw.keys()].filter((x) => raw[x] >= 0);
  const top = Int32Array.from(raw, (v, x) => {
    if (v >= 0) return v;
    const l = known.findLast((q) => q < x), r = known.find((q) => q > x);
    return l === undefined ? raw[r] : r === undefined ? raw[l] : Math.round(raw[l] + ((raw[r] - raw[l]) * (x - l)) / (r - l));
  });

  // the label: the nearest band that shows at each pixel
  const label = new Uint8Array(N);
  for (let i = 0; i < N; i++) label[i] = mask[RIGHT][i] ? RIGHT : mask[LEFT][i] ? LEFT : (i / W | 0) >= top[i % W] ? LAND : SKY;
  const present = (k, i) => k === SKY || (k === LAND ? (i / W | 0) >= top[i % W] && label[i] >= LAND : label[i] === k);
  /** what lies behind the nearer band f, for band k */
  const behind = (k, f) => (k === SKY ? fillSky : f === LEFT ? fillLeft : fillRight);

  const frames = NAMES.map(() => Buffer.alloc(N * 4));
  const shown = NAMES.map(() => new Uint8Array(N)); // 1 where the band shows (the plate's colour)
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    for (let k = 0; k < 4; k++) {
      if (!present(k, i)) continue;
      const src = label[i] === k ? dayShown : behind(k, label[i]);
      for (let c = 0; c < 3; c++) frames[k][p + c] = src[p + c];
      frames[k][p + 3] = 255;
      shown[k][i] = label[i] === k ? 1 : 0;
    }
  }

  // By night: each band's grade, day to night, measured where it shows (a
  // normalised blur of the two plates over its own pixels, so a band's dark
  // neighbour never darkens its fill), applied to its hidden fill.
  const nights = frames.map((day, k) => {
    const w = Float32Array.from(shown[k]);
    const sw = blur(w, 24);
    const [td, tn] = [[0, 0, 0], [0, 0, 0]];
    const grade = [0, 1, 2].map((c) => {
      for (let i = 0; i < N; i++)
        if (shown[k][i]) {
          td[c] += plate[i * 4 + c];
          tn[c] += night[i * 4 + c];
        }
      return {
        d: blur(Float32Array.from({ length: N }, (_, i) => w[i] * plate[i * 4 + c]), 24),
        n: blur(Float32Array.from({ length: N }, (_, i) => w[i] * night[i * 4 + c]), 24),
        mean: td[c] ? tn[c] / td[c] : 0.45,
      };
    });
    const out = Buffer.from(day);
    for (let i = 0; i < N; i++) {
      const p = i * 4;
      if (!day[p + 3]) continue;
      for (let c = 0; c < 3; c++) {
        if (shown[k][i]) {
          out[p + c] = nightShown[p + c];
          continue;
        }
        const { d, n, mean } = grade[c];
        const local = sw[i] > 0.02 && d[i] > 1 ? n[i] / d[i] : mean;
        out[p + c] = Math.min(255, Math.round(day[p + c] * Math.min(2, local)));
      }
    }
    return out;
  });
  return { day: frames, night: nights };
}
