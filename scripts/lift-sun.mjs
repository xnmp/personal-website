// Lift the sun (or moon) out of a sky layer, so the page can place it on its
// own (kit.css .scene-sun): it stays whole in the frame's upper-left margin at
// every width, where the sky itself has to be cropped to cover the frame.
//
// The sky art paints the sun with a small cloud in front of it, upper left.
// Within `box` (the sun, its cloud and their shadows, with a margin):
//   - the sky is rebuilt from a band of clean sky in the same rows further
//     right (the sky's gradient runs top to bottom, so a row's colour holds
//     across it), feathered into the original at the box's edge;
//   - the sun is the difference between the original and that clean sky:
//     where they differ by more than the paper's grain, the pixel is the
//     sun's (its alpha rising with the difference, its colour unmixed from
//     the clean sky), kept only where it joins the sun's disc, so stray stars
//     stay in the sky. Its own soft shadow falls inside the grain threshold
//     and is dropped; paper-shadow.mjs bakes a fresh one onto the sprite.
//
//   liftSun(rgba, width, height, { box: [x0, y0, x1, y1], sun: [u, v] })
//     -> { sky: Buffer (width x height RGBA), sprite: Buffer, spriteW, spriteH }

const FEATHER = 16; // px over which the rebuilt sky blends into the original
const GRAIN = [24, 64]; // colour distance: below, paper grain; above, the sun

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** the horizontal offset whose band of sky, beside the box, is calmest */
function cleanestOffset(px, W, [x0, y0, x1, y1]) {
  const bw = x1 - x0;
  let best = { dx: 0, score: Infinity };
  for (let dx = bw + 40; x1 + dx < W - 40; dx += 10) {
    let score = 0;
    for (let y = y0; y < y1; y++) {
      // the band's own row median: anything far from it is a cloud or a star
      const row = [];
      for (let x = x0 + dx; x < x1 + dx; x += 4) row.push(px[(y * W + x) * 4] + px[(y * W + x) * 4 + 1] + px[(y * W + x) * 4 + 2]);
      row.sort((a, b) => a - b);
      const med = row[row.length >> 1];
      for (let x = x0 + dx; x < x1 + dx; x += 2) {
        const i = (y * W + x) * 4;
        if (Math.abs(px[i] + px[i + 1] + px[i + 2] - med) > 60) score++;
      }
    }
    if (score < best.score) best = { dx, score };
  }
  return best.dx;
}

export function liftSun(rgba, W, _H, { box, sun }) {
  const [x0, y0, x1, y1] = box;
  const px = rgba;
  const dx = cleanestOffset(px, W, box);

  // the clean sky over the box
  const sky = Buffer.from(px);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const edge = Math.min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y);
      const w = smooth(0, FEATHER, edge);
      const i = (y * W + x) * 4;
      const j = (y * W + x + dx) * 4;
      for (let k = 0; k < 3; k++) sky[i + k] = Math.round(px[i + k] * (1 - w) + px[j + k] * w);
    }

  // the sun: alpha from the difference, kept where it joins the disc
  const bw = x1 - x0;
  const bh = y1 - y0;
  const alpha = new Float32Array(bw * bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const i = ((y + y0) * W + x + x0) * 4;
      const d = Math.hypot(px[i] - sky[i], px[i + 1] - sky[i + 1], px[i + 2] - sky[i + 2]);
      // the sun, the moon and their cloud are all lighter than the sky; what
      // is darker is a shadow, which the sprite gets afresh
      const lighter = px[i] + px[i + 1] + px[i + 2] > sky[i] + sky[i + 1] + sky[i + 2];
      alpha[y * bw + x] = lighter ? smooth(GRAIN[0], GRAIN[1], d) : 0;
    }
  const keep = new Uint8Array(bw * bh);
  const stack = [(sun[1] - y0) * bw + (sun[0] - x0)];
  while (stack.length) {
    const p = stack.pop();
    if (keep[p] || alpha[p] <= 0.02) continue;
    keep[p] = 1;
    const x = p % bw;
    const y = (p / bw) | 0;
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx >= 0 && ny >= 0 && nx < bw && ny < bh) stack.push(ny * bw + nx);
      }
  }
  const sprite = Buffer.alloc(bw * bh * 4);
  for (let p = 0; p < bw * bh; p++) {
    const a = keep[p] ? alpha[p] : 0;
    if (!a) continue;
    const x = p % bw;
    const y = (p / bw) | 0;
    const i = ((y + y0) * W + x + x0) * 4;
    for (let k = 0; k < 3; k++) sprite[p * 4 + k] = Math.min(255, Math.max(0, Math.round((px[i + k] - (1 - a) * sky[i + k]) / a)));
    sprite[p * 4 + 3] = Math.round(a * 255);
  }
  return { sky, sprite, spriteW: bw, spriteH: bh };
}
