// The cutting tools the Paper Diorama's scene scripts share
// (scripts/kits/paper-layers.mjs: the home's eight layers;
// scripts/kits/paper-pages.mjs: the project and launch pages'; and
// scripts/kits/paper-phone.mjs: the phone's, on its own frame): fields over a
// frame, and the masks a band is cut with. `cutting(w, h)` builds them for a
// frame of that size; the module's own exports are the mock's 1672x941.

export const cutting = (W, H) => {
  const N = W * H;

  /** separable box blur of a Float32Array field, `r` px each way, `passes` times (about a gaussian) */
  const blur = (f, r, passes = 2) => {
    let a = Float32Array.from(f), b = new Float32Array(N);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < H; y++) {
        let s = 0;
        const row = y * W;
        for (let x = -r; x <= r; x++) s += a[row + Math.min(W - 1, Math.max(0, x))];
        for (let x = 0; x < W; x++) {
          b[row + x] = s / (2 * r + 1);
          s += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
        }
      }
      [a, b] = [b, a];
      for (let x = 0; x < W; x++) {
        let s = 0;
        for (let y = -r; y <= r; y++) s += a[Math.min(H - 1, Math.max(0, y)) * W + x];
        for (let y = 0; y < H; y++) {
          b[y * W + x] = s / (2 * r + 1);
          s += a[Math.min(H - 1, y + r + 1) * W + x] - a[Math.max(0, y - r) * W + x];
        }
      }
      [a, b] = [b, a];
    }
    return a;
  };

  /** how far an edit's colour stands from the plate's, inside `roi` (x0, y0,
   *  x1, y1; outside it any difference is the generator's noise, not the
   *  band), blurred a pixel so the paper's grain does not fray the edge */
  const distance = (plate, img, [x0, y0, x1, y1]) => {
    const d = new Float32Array(N);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const i = y * W + x, p = i * 4;
        d[i] = Math.abs(plate[p] - img[p]) + Math.abs(plate[p + 1] - img[p + 1]) + Math.abs(plate[p + 2] - img[p + 2]);
      }
    return blur(d, 1, 1);
  };

  /** 4-connected components of `on` (a Uint8Array): calls `each(pixels)` per component */
  const components = (on, each) => {
    const seen = new Uint8Array(N);
    const stack = new Int32Array(N);
    for (let s = 0; s < N; s++) {
      if (!on[s] || seen[s]) continue;
      const px = [];
      let n = 0;
      stack[n++] = s;
      seen[s] = 1;
      while (n) {
        const i = stack[--n];
        px.push(i);
        const x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
          if (j >= 0 && j < N && on[j] && !seen[j]) {
            seen[j] = 1;
            stack[n++] = j;
          }
      }
      each(px);
    }
  };

  /** a band's outline from its distance: on past `t`, closed over a few px,
   *  specks under `minArea` px dropped and holes under `maxHole` filled
   *  (where its removal happened to match the plate's colour) */
  const solid = (d, t, minArea, maxHole) => {
    let m = Uint8Array.from(d, (v) => (v > t ? 1 : 0));
    // closing: grow by 3px, then shrink by 3px
    const grown = Uint8Array.from(blur(Float32Array.from(m), 3, 1), (v) => (v > 0.01 ? 1 : 0));
    m = Uint8Array.from(blur(Float32Array.from(grown), 3, 1), (v) => (v > 0.99 ? 1 : 0));
    components(m, (px) => px.length < minArea && px.forEach((i) => (m[i] = 0)));
    const off = Uint8Array.from(m, (v) => 1 - v);
    components(off, (px) => {
      if (px.length >= maxHole) return;
      const edge = px.some((i) => i % W === 0 || i % W === W - 1 || i < W || i >= N - W);
      if (!edge) px.forEach((i) => (m[i] = 1));
    });
    return m;
  };

  return { W, H, N, blur, distance, components, solid };
};

export const { W, H, N, blur, distance, components, solid } = cutting(1672, 941);
