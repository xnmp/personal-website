// The project print's inner edge (round 10): a cyanotype's emulsion is
// brushed on, so where the print stops and the paper begins the blue does not
// end on a rule. The original's border shows it: the edge is quick (a px or
// two across) but wanders, bites of paper standing in it and freckles of blue
// blown past it, and the print's blue is dropped out in chalky specks for a
// few px inside it. Drawn as the alpha of the print itself (cyanotype.css
// .screen-face: mask, stretched to the print's own 3:2), so the cream paper
// of the mount shows through it. In the print's px at 3x: the edge sits ~3 px
// inside the box on average, wanders by about 2, and the speckle takes it
// 2 either way.

export const PRINT_EDGE = { s: 3, w: 520, h: 347 };

// `h`: the recipe's helpers (smoothstep, wobble, lowField)
export const edgeMask = async ({ smoothstep, wobble, lowField }) => {
  const S = PRINT_EDGE.s;
  const [W, H] = [PRINT_EDGE.w * S, PRINT_EDGE.h * S];
  // the freckles (blobs 2 px across) that move the edge, and the specks
  const [shift, speck] = await Promise.all([lowField(W, H, 6, 71), lowField(W, H, 5, 73)]);
  // one side's edge: how far in it lies (px), at each step along it
  const side = (len, seed) => {
    const lie = wobble(len, seed, [[110 * S, 1.7], [24 * S, 1.1], [7 * S, 0.5]]);
    const hair = wobble(len, seed + 31, [[1.5 * S, 1]]);
    const burst = wobble(len, seed + 53, [[46 * S, 1]]);
    return Float32Array.from(lie, (v, t) => 3 + v + 1.8 * Math.max(0, hair[t]) * smoothstep(-0.25, 0.85, burst[t]));
  };
  const [top, bot, left, right] = [side(W, 1), side(W, 2), side(H, 3), side(H, 4)];
  const px = Buffer.alloc(W * H * 4, 255);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // in from the nearest side, past its edge, in the print's px; the
      // freckles move the edge by up to 1.8 either way
      const ins = Math.min(y / S - top[x], (H - 1 - y) / S - bot[x], x / S - left[y], (W - 1 - x) / S - right[y]);
      const d = ins + shift[i] * 1.15;
      let a = smoothstep(-0.5, 0.7, d);
      // chalky specks where the blue dropped out, thinning out ~9 px in
      a *= 1 - smoothstep(0.5, 1.05, speck[i]) * (1 - smoothstep(0, 9, ins)) * smoothstep(-1, 0.5, d);
      px[i * 4 + 3] = Math.round(255 * a);
    }
  return { data: px, info: { width: W, height: H, channels: 4 } };
};
