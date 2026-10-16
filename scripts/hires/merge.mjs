const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const image = (img) => {
  if (!img || !Number.isSafeInteger(img.width) || img.width <= 0 || !Number.isSafeInteger(img.height) || img.height <= 0 ||
      !Number.isInteger(img.channels) || img.channels < 1 || img.channels > 4 ||
      !(img.data instanceof Float32Array || img.data instanceof Uint8Array) || img.data.length !== img.width * img.height * img.channels)
    throw new Error('Invalid image geometry or data');
  return img;
};
const same = (a, b) => {
  image(a); image(b);
  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) throw new Error('Images must have the same geometry');
};
const sample = (img, x, y, c) => {
  const sx = clamp(x, 0, img.width - 1), sy = clamp(y, 0, img.height - 1);
  const [x0, y0] = [Math.floor(sx), Math.floor(sy)];
  const [x1, y1] = [Math.min(x0 + 1, img.width - 1), Math.min(y0 + 1, img.height - 1)];
  const [fx, fy] = [sx - x0, sy - y0];
  const at = (px, py) => img.data[(py * img.width + px) * img.channels + c];
  return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy) + (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy;
};

export function padTransparent(rgba) {
  image(rgba);
  if (rgba.channels !== 4) throw new Error('padTransparent requires RGBA');
  const { width, height, data } = rgba;
  const first = { width, height, channels: 4, data: new Float32Array(data.length) };
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    for (let c = 0; c < 3; c++) first.data[i + c] = data[i + c] * a;
    first.data[i + 3] = a;
  }
  const levels = [first];
  while (levels.at(-1).width > 1 || levels.at(-1).height > 1) {
    const prev = levels.at(-1);
    const next = { width: Math.ceil(prev.width / 2), height: Math.ceil(prev.height / 2), channels: 4 };
    next.data = new Float32Array(next.width * next.height * 4);
    for (let y = 0; y < next.height; y++) for (let x = 0; x < next.width; x++) {
      let count = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const [px, py] = [2 * x + dx, 2 * y + dy];
        if (px >= prev.width || py >= prev.height) continue;
        count++;
        for (let c = 0; c < 4; c++) next.data[(y * next.width + x) * 4 + c] += prev.data[(py * prev.width + px) * 4 + c];
      }
      for (let c = 0; c < 4; c++) next.data[(y * next.width + x) * 4 + c] /= count;
    }
    levels.push(next);
  }
  let filled;
  for (let level = levels.length - 1; level >= 0; level--) {
    const current = levels[level];
    const out = { width: current.width, height: current.height, channels: 3, data: new Float32Array(current.width * current.height * 3) };
    for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
      const i = (y * out.width + x) * 4, a = current.data[i + 3];
      for (let c = 0; c < 3; c++) {
        const parent = filled ? sample(filled, (x + 0.5) / 2 - 0.5, (y + 0.5) / 2 - 0.5, c) : a ? current.data[i + c] / a : 0;
        out.data[(y * out.width + x) * 3 + c] = current.data[i + c] + (1 - a) * parent;
      }
    }
    filled = out;
  }
  return filled;
}

export function gaussianBlur(img, sigma) {
  image(img);
  if (!Number.isFinite(sigma) || sigma < 0) throw new Error('Invalid blur sigma');
  if (!sigma) return { ...img, data: new Float32Array(img.data) };
  const radius = Math.ceil(3 * sigma);
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const total = kernel.reduce((a, b) => a + b, 0);
  const weights = kernel.map((w) => w / total);
  const { width, height, channels } = img;
  const pass = (src, horizontal) => {
    const out = new Float32Array(src.length);
    const extent = horizontal ? width : height, stride = horizontal ? channels : width * channels;
    const taps = weights.length, offsets = new Int32Array(extent * taps);
    for (let p = 0; p < extent; p++) for (let k = 0; k < taps; k++)
      offsets[p * taps + k] = (clamp(p + k - radius, 0, extent - 1) - p) * stride;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let c = 0; c < channels; c++) {
      const p = (y * width + x) * channels + c, offset = (horizontal ? x : y) * taps;
      let sum = 0;
      for (let k = 0; k < taps; k++) sum += src[p + offsets[offset + k]] * weights[k];
      out[p] = sum;
    }
    return out;
  };
  return { width, height, channels, data: pass(pass(img.data, true), false) };
}

export function toneMatch(up, base, sigma) {
  same(up, base);
  const a = gaussianBlur(up, sigma), b = gaussianBlur(base, sigma);
  const data = new Float32Array(up.data.length);
  for (let i = 0; i < data.length; i++) data[i] = clamp(up.data[i] + b.data[i] - a.data[i], 0, 255);
  return { ...up, data };
}

// Tiles carry output coordinates (ox, oy, ow, oh) and an image of that size.
export function blendTiles(canvasW, canvasH, tiles) {
  if (![canvasW, canvasH].every((n) => Number.isSafeInteger(n) && n > 0) || !tiles.length) throw new Error('Invalid canvas or empty tiles');
  const channels = image(tiles[0].image).channels;
  for (const t of tiles) {
    image(t.image);
    if (![t.ox, t.oy, t.ow, t.oh].every(Number.isInteger) || t.ox < 0 || t.oy < 0 || t.ow <= 0 || t.oh <= 0 ||
        t.ox + t.ow > canvasW || t.oy + t.oh > canvasH || t.image.width !== t.ow || t.image.height !== t.oh || t.image.channels !== channels)
      throw new Error('Invalid tile geometry');
  }
  const data = new Float32Array(canvasW * canvasH * channels), sums = new Float64Array(data.length), weights = new Float64Array(canvasW * canvasH);
  for (const t of tiles) {
    const others = tiles.filter((other) => other !== t);
    const vertical = others.filter((o) => o.oy < t.oy + t.oh && o.oy + o.oh > t.oy);
    const horizontal = others.filter((o) => o.ox < t.ox + t.ow && o.ox + o.ow > t.ox);
    const left = t.ox === 0 ? 0 : Math.max(0, ...vertical.filter((o) => o.ox < t.ox).map((o) => o.ox + o.ow - t.ox));
    const right = t.ox + t.ow === canvasW ? 0 : Math.max(0, ...vertical.filter((o) => o.ox > t.ox).map((o) => t.ox + t.ow - o.ox));
    const top = t.oy === 0 ? 0 : Math.max(0, ...horizontal.filter((o) => o.oy < t.oy).map((o) => o.oy + o.oh - t.oy));
    const bottom = t.oy + t.oh === canvasH ? 0 : Math.max(0, ...horizontal.filter((o) => o.oy > t.oy).map((o) => t.oy + t.oh - o.oy));
    for (let y = 0; y < t.oh; y++) for (let x = 0; x < t.ow; x++) {
      const weight = Math.min(1, left ? (x + 0.5) / left : 1, right ? (t.ow - x - 0.5) / right : 1) *
        Math.min(1, top ? (y + 0.5) / top : 1, bottom ? (t.oh - y - 0.5) / bottom : 1);
      const p = (t.oy + y) * canvasW + t.ox + x;
      weights[p] += weight;
      for (let c = 0; c < channels; c++) sums[p * channels + c] += t.image.data[(y * t.ow + x) * channels + c] * weight;
    }
  }
  for (let p = 0; p < weights.length; p++) {
    if (!weights[p]) throw new Error('Tiles leave uncovered canvas pixels');
    for (let c = 0; c < channels; c++) data[p * channels + c] = sums[p * channels + c] / weights[p];
  }
  return { width: canvasW, height: canvasH, channels, data };
}

// The optional mask is source alpha in [0, 1], at source resolution.
const visibility = (src, weights) => {
  const pixels = src.width * src.height;
  if (weights !== undefined && (!(weights instanceof Float32Array || weights instanceof Float64Array) || weights.length !== pixels))
    throw new Error('Invalid pixel weights');
  let weightedArea = weights ? 0 : pixels;
  if (weights) for (const w of weights) {
    if (!Number.isFinite(w) || w < 0 || w > 1) throw new Error('Invalid pixel weight: expected 0..1');
    weightedArea += w;
  }
  const visibleFraction = weightedArea / pixels;
  return { weightedArea, visibleFraction, gateable: visibleFraction >= 0.01,
    ...(visibleFraction < 0.01 ? { note: 'too little visible content (weighted area under 1%)' } : {}) };
};

// Normalised convolution keeps arbitrary transparent RGB out of visible blur
// neighbourhoods, as well as out of the final weighted statistics.
const blurPair = (src, target, sigma, weights) => {
  if (!weights) return [gaussianBlur(src, sigma), gaussianBlur(target, sigma)];
  const support = gaussianBlur({ width: src.width, height: src.height, channels: 1, data: Float32Array.from(weights) }, sigma);
  return [src, target].map((img) => {
    const weighted = { ...img, data: Float32Array.from(img.data, (v, i) => weights[Math.floor(i / img.channels)] ? v * weights[Math.floor(i / img.channels)] : 0) };
    const blurred = gaussianBlur(weighted, sigma);
    return { ...blurred, data: Float32Array.from(blurred.data, (v, i) => {
      const w = support.data[Math.floor(i / img.channels)];
      return w > 0 ? v / w : 0;
    }) };
  });
};

export function colourStats(src, target, weights) {
  same(src, target);
  const visible = visibility(src, weights);
  const [a, b] = blurPair(src, target, 1.5, weights);
  const { channels } = src;
  const mae = Array(channels).fill(0), meanColourDelta = Array(channels).fill(0);
  for (let p = 0; p < src.width * src.height; p++) {
    const w = weights ? weights[p] : 1;
    if (!w) continue;
    for (let c = 0; c < channels; c++) {
      const delta = b.data[p * channels + c] - a.data[p * channels + c];
      mae[c] += Math.abs(delta) * w;
      meanColourDelta[c] += delta * w;
    }
  }
  for (let c = 0; c < channels; c++) {
    mae[c] /= visible.weightedArea || 1;
    meanColourDelta[c] /= visible.weightedArea || 1;
  }
  return { mae, meanColourDelta, blurredMae: mae.reduce((sum, n) => sum + n, 0) / channels, ...visible };
}

const luminance = (img) => ({ width: img.width, height: img.height, channels: 1,
  data: Float32Array.from({ length: img.width * img.height }, (_, p) => img.channels < 3 ? img.data[p * img.channels] :
    0.2126 * img.data[p * img.channels] + 0.7152 * img.data[p * img.channels + 1] + 0.0722 * img.data[p * img.channels + 2]),
});

const dogPair = (src, up, weights) => {
  const luma = [luminance(src), luminance(up)];
  const fine = blurPair(...luma, 1, weights), coarse = blurPair(...luma, 4, weights);
  return fine.map((img, j) => ({ ...img, data: Float32Array.from(img.data, (v, i) => v - coarse[j].data[i]) }));
};

// Scalar bilinear lookup for the bounded registration hot loop.
const scalarAt = (data, width, x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const p = iy * width + ix;
  const next = ix + 1 < width ? 1 : 0, row = p + width < data.length ? width : 0;
  return (data[p] * (1 - fx) + data[p + next] * fx) * (1 - fy) +
    (data[p + row] * (1 - fx) + data[p + row + next] * fx) * fy;
};
const median = (values) => {
  if (!values.length) return 0;
  const sorted = values.toSorted((a, b) => a - b), m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};
const magnitudeStats = (vectors) => {
  const sorted = vectors.map(({ dx, dy }) => Math.hypot(dx, dy)).sort((a, b) => a - b);
  return { median: median(sorted), p90: sorted[Math.max(0, Math.ceil(sorted.length * 0.9) - 1)] ?? 0, max: sorted.at(-1) ?? 0 };
};

/**
 * Positive dx means the model's feature lies RIGHT of the source feature.
 * Vectors are source pixels, located at the centres of a uniform block grid.
 * `blocks` optionally specifies { cols, rows }; defaults to ~80px blocks.
 * Diagnostics describe trusted MEASUREMENTS, before interpolation/smoothing.
 * @param {object} src
 * @param {object} up
 * @param {{ weights?: Float32Array | Float64Array, blocks?: { cols: number, rows: number }, search?: number, step?: number }} options
 */
export function estimateFlow(src, up, { weights, blocks, search = 4, step = 0.25 } = {}) {
  same(src, up);
  const visible = visibility(src, weights);
  if (!Number.isFinite(search) || search < 0 || search > 16 || !Number.isFinite(step) || step < 0.05 || step > 0.5)
    throw new Error('Invalid flow search or step');
  const { width, height } = src;
  const cols = blocks?.cols ?? Math.min(width, Math.max(3, Math.round(width / 80)));
  const rows = blocks?.rows ?? Math.min(height, Math.max(3, Math.round(height / 80)));
  if (![cols, rows].every((n) => Number.isSafeInteger(n) && n > 0) || cols > width || rows > height)
    throw new Error('Invalid flow blocks');
  const [a, b] = visible.gateable ? dogPair(src, up, weights) : [null, null];
  const measured = [];
  for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
    const left = Math.floor(bx * width / cols), right = Math.floor((bx + 1) * width / cols);
    const top = Math.floor(by * height / rows), bottom = Math.floor((by + 1) * height / rows);
    const block = { dx: 0, dy: 0, score: 0, reliable: false, visible: false, reason: 'visible-area' };
    measured.push(block);
    if (!visible.gateable) continue;
    // Alpha-stratified sampling preserves narrow cut-outs. At most ~384
    // samples/block makes cost linear in image area with bounded scratch space.
    const stride = Math.max(1, Math.ceil(Math.sqrt((right - left) * (bottom - top) / 384)));
    const xs = [], ys = [], ws = [], values = [];
    let area = 0;
    for (let sy = top; sy < bottom; sy += stride) for (let sx = left; sx < right; sx += stride) {
      let mass = 0, bestAlpha = 0, px = -1, py = -1, distance = Infinity;
      const ex = Math.min(right, sx + stride), ey = Math.min(bottom, sy + stride);
      for (let y = sy; y < ey; y++) for (let x = sx; x < ex; x++) {
        const w = weights ? weights[y * width + x] : 1;
        mass += w;
        const d = (x - (sx + ex - 1) / 2) ** 2 + (y - (sy + ey - 1) / 2) ** 2;
        if (w > bestAlpha || (w && w === bestAlpha && d < distance)) { px = x; py = y; bestAlpha = w; distance = d; }
      }
      area += mass;
      if (mass) { xs.push(px); ys.push(py); ws.push(mass); values.push(a.data[py * width + px]); }
    }
    block.visible = area > 0;
    if (area < Math.max(16, (right - left) * (bottom - top) * 0.01) || xs.length < 12) continue;
    const score = (dx, dy) => {
      let total = 0, sa = 0, sb = 0, aa = 0, bb = 0, ab = 0;
      for (let i = 0; i < xs.length; i++) {
        // Preserve visible paint at the canvas boundary. A tiny inset keeps
        // the scalar bilinear lookup valid even on the final pixel.
        const x = clamp(xs[i] + dx, 0, width - 1 - 1e-6), y = clamp(ys[i] + dy, 0, height - 1 - 1e-6);
        const w = ws[i] * (weights ? scalarAt(weights, width, x, y) : 1);
        const av = values[i], bv = scalarAt(b.data, width, x, y);
        total += w; sa += w * av; sb += w * bv;
        aa += w * av * av; bb += w * bv * bv; ab += w * av * bv;
      }
      const va = total ? (aa - sa * sa / total) / total : 0;
      const vb = total ? (bb - sb * sb / total) / total : 0;
      // 0.2 grey-level RMS of DoG is below useful geometry evidence.
      if (va < 0.04 || vb < 0.04) return -1;
      return clamp((ab - sa * sb / total) / total / Math.sqrt(va * vb), -1, 1);
    };
    let dx = 0, dy = 0, best = score(0, 0);
    const coarse = [];
    const consider = (x, y) => {
      const s = score(x, y);
      if (s > best + 1e-10 || (Math.abs(s - best) <= 1e-10 && Math.hypot(x, y) < Math.hypot(dx, dy))) { dx = x; dy = y; best = s; }
      return s;
    };
    const count = Math.ceil(search / 0.5);
    for (let y = -count; y <= count; y++) for (let x = -count; x <= count; x++) {
      const cx = clamp(x * 0.5, -search, search), cy = clamp(y * 0.5, -search, search);
      coarse.push({ dx: cx, dy: cy, score: consider(cx, cy) });
    }
    const cx = dx, cy = dy;
    for (let y = -Math.ceil(0.5 / step); y <= Math.ceil(0.5 / step); y++)
      for (let x = -Math.ceil(0.5 / step); x <= Math.ceil(0.5 / step); x++)
        consider(clamp(cx + x * step, -search, search), clamp(cy + y * step, -search, search));
    block.dx = dx; block.dy = dy; block.score = best;
    if (best < 0.5) { block.reason = best === -1 ? 'variance' : 'correlation'; continue; }
    // Curvature in both directions rejects the aperture problem (e.g. a single
    // straight edge). Distinct, near-equal distant peaks reject repeated motifs.
    const h = 0.5;
    const xx = 2 * best - score(clamp(dx - h, -search, search), dy) - score(clamp(dx + h, -search, search), dy);
    const yy = 2 * best - score(dx, clamp(dy - h, -search, search)) - score(dx, clamp(dy + h, -search, search));
    const xy = (score(clamp(dx + h, -search, search), clamp(dy + h, -search, search)) -
      score(clamp(dx + h, -search, search), clamp(dy - h, -search, search)) -
      score(clamp(dx - h, -search, search), clamp(dy + h, -search, search)) +
      score(clamp(dx - h, -search, search), clamp(dy - h, -search, search))) / 4;
    const curvature = (xx + yy - Math.hypot(xx - yy, 2 * xy)) / 2;
    // A one-pixel alternative within 0.5% correlation cannot establish
    // subpixel geometry, even when the discrete peak has local curvature.
    if (curvature < 0.0005 || coarse.some((p) => Math.hypot(p.dx - dx, p.dy - dy) >= 1 && p.score > best - 0.005)) {
      block.reason = 'ambiguous'; continue;
    }
    block.reliable = true; block.reason = 'reliable';
  }
  const neighbours = (i) => {
    const result = [], x = i % cols, y = Math.floor(i / cols);
    for (let yy = Math.max(0, y - 1); yy <= Math.min(rows - 1, y + 1); yy++)
      for (let xx = Math.max(0, x - 1); xx <= Math.min(cols - 1, x + 1); xx++) {
        const j = yy * cols + xx;
        if (measured[j].reliable) result.push(j);
      }
    return result;
  };
  // True vector median: select the neighbour minimising total Euclidean distance.
  const filtered = measured.map((p, i) => {
    const ns = neighbours(i);
    if (!ns.length) return { dx: p.dx, dy: p.dy };
    const cost = (j) => ns.reduce((sum, k) => sum + Math.hypot(measured[j].dx - measured[k].dx, measured[j].dy - measured[k].dy), 0);
    const j = ns.reduce((best, k) => cost(k) < cost(best) ? k : best, ns[0]);
    // Keep subpixel smooth ramps; only replace an isolated inconsistent vector.
    return ns.length >= 3 && Math.hypot(p.dx - measured[j].dx, p.dy - measured[j].dy) > 0.75 ?
      { dx: measured[j].dx, dy: measured[j].dy } : { dx: p.dx, dy: p.dy };
  });
  // Spatially inconsistent matches are not reliable displacement evidence.
  const measurements = measured.filter((p) => p.reliable);
  measured.forEach((p, i) => {
    if (p.reliable && Math.hypot(p.dx - filtered[i].dx, p.dy - filtered[i].dy) > 1.5) {
      p.reliable = false; p.reason = 'outlier';
    }
  });
  const reliable = measured.flatMap((p, i) => p.reliable ? [i] : []);
  const global = { dx: median(reliable.map((i) => measured[i].dx)), dy: median(reliable.map((i) => measured[i].dy)) };
  const filled = filtered.map((p, i) => {
    if (measured[i].reliable) return p;
    const ns = reliable.filter((j) => Math.abs(i % cols - j % cols) <= 3 && Math.abs(Math.floor(i / cols) - Math.floor(j / cols)) <= 3);
    if (!ns.length) return global;
    let dx = 0, dy = 0, total = 0;
    for (const j of ns) {
      const w = 1 / ((i % cols - j % cols) ** 2 + (Math.floor(i / cols) - Math.floor(j / cols)) ** 2);
      dx += filtered[j].dx * w; dy += filtered[j].dy * w; total += w;
    }
    return { dx: dx / total, dy: dy / total };
  });
  const vectors = new Float32Array(cols * rows * 2);
  filled.forEach((p, i) => {
    let dx = 0, dy = 0, total = 0;
    const x = i % cols, y = Math.floor(i / cols);
    // Light symmetric smoothing, keeping the central estimate at 80%.
    for (let yy = Math.max(0, y - 1); yy <= Math.min(rows - 1, y + 1); yy++)
      for (let xx = Math.max(0, x - 1); xx <= Math.min(cols - 1, x + 1); xx++) {
        if (xx === x && yy === y) continue;
        const q = filled[yy * cols + xx]; dx += q.dx; dy += q.dy; total++;
      }
    vectors[i * 2] = 0.8 * p.dx + (total ? 0.2 * dx / total : 0.2 * p.dx);
    vectors[i * 2 + 1] = 0.8 * p.dy + (total ? 0.2 * dy / total : 0.2 * p.dy);
  });
  return { width, height, cols, rows, vectors, blocks: measured,
    diagnostics: { ...visible, reliableShare: reliable.length / measured.length, reliableBlocks: reliable.length, totalBlocks: measured.length,
      visibleBlocks: measured.filter((p) => p.visible).length,
      measuredReliableBlocks: measurements.length, outlierBlocks: measurements.length - reliable.length,
      ...magnitudeStats(measured.filter((p) => p.reliable)), registrationMetric: 'block-luminance-dog-zncc', registrationSigmas: [1, 4], registrationStep: step } };
}

// Compose inverse maps: applying residual R after F samples x + R(x) + F(x + R(x)).
// Keep the uniform grid; only the original image is resampled by the composed map.
export function composeFlow(field, residual) {
  const valid = (f) => f && [f.width, f.height, f.cols, f.rows].every((n) => Number.isSafeInteger(n) && n > 0) &&
    f.cols <= f.width && f.rows <= f.height && f.vectors instanceof Float32Array &&
    f.vectors.length === f.cols * f.rows * 2 && f.vectors.every(Number.isFinite);
  if (!valid(field) || !valid(residual) || ['width', 'height', 'cols', 'rows'].some((k) => field[k] !== residual[k]))
    throw new Error('Invalid or mismatched flow fields');
  const { width, height, cols, rows } = field;
  const grid = { width: cols, height: rows, channels: 2, data: field.vectors };
  const vectors = new Float32Array(field.vectors.length);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const p = (y * cols + x) * 2, dx = residual.vectors[p], dy = residual.vectors[p + 1];
    vectors[p] = dx + sample(grid, x + dx * cols / width, y + dy * rows / height, 0);
    vectors[p + 1] = dy + sample(grid, x + dx * cols / width, y + dy * rows / height, 1);
  }
  return { width, height, cols, rows, vectors };
}

/** Inverse warp: destination (x,y) samples model (x + dx*factor,y + dy*factor). */
export function warp(up, field, factor) {
  image(up);
  if (!Number.isFinite(factor) || factor <= 0 || !field ||
      ![field.width, field.height, field.cols, field.rows].every((n) => Number.isSafeInteger(n) && n > 0) ||
      field.cols > field.width || field.rows > field.height || !(field.vectors instanceof Float32Array) ||
      field.vectors.length !== field.cols * field.rows * 2 || !field.vectors.every(Number.isFinite) ||
      Math.abs(up.width - field.width * factor) > 1 || Math.abs(up.height - field.height * factor) > 1)
    throw new Error('Invalid warp field, factor or geometry');
  const { width, height, channels } = up, { cols, rows, vectors } = field;
  // Tile boundaries are rounded on the whole canvas; their effective scale can
  // differ from the nominal factor by a fraction of one output pixel.
  const scaleX = width / field.width, scaleY = height / field.height;
  const data = new Float32Array(up.data.length);
  for (let y = 0; y < height; y++) {
    const gy = clamp((y + 0.5) / height * rows - 0.5, 0, rows - 1), iy = Math.floor(gy), fy = gy - iy;
    const ny = Math.min(iy + 1, rows - 1);
    for (let x = 0; x < width; x++) {
      const gx = clamp((x + 0.5) / width * cols - 0.5, 0, cols - 1), ix = Math.floor(gx), fx = gx - ix;
      const nx = Math.min(ix + 1, cols - 1), p = (iy * cols + ix) * 2, q = (ny * cols + ix) * 2;
      const r = (iy * cols + nx) * 2, s = (ny * cols + nx) * 2;
      const dx = (vectors[p] * (1 - fx) + vectors[r] * fx) * (1 - fy) + (vectors[q] * (1 - fx) + vectors[s] * fx) * fy;
      const dy = (vectors[p + 1] * (1 - fx) + vectors[r + 1] * fx) * (1 - fy) + (vectors[q + 1] * (1 - fx) + vectors[s + 1] * fx) * fy;
      const sx = clamp(x + dx * scaleX, 0, width - 1), sy = clamp(y + dy * scaleY, 0, height - 1);
      const x0 = Math.floor(sx), y0 = Math.floor(sy), ax = sx - x0, ay = sy - y0;
      const x1 = Math.min(x0 + 1, width - 1), y1 = Math.min(y0 + 1, height - 1);
      const dst = (y * width + x) * channels;
      for (let c = 0; c < channels; c++) data[dst + c] =
        (up.data[(y0 * width + x0) * channels + c] * (1 - ax) + up.data[(y0 * width + x1) * channels + c] * ax) * (1 - ay) +
        (up.data[(y1 * width + x0) * channels + c] * (1 - ax) + up.data[(y1 * width + x1) * channels + c] * ax) * ay;
    }
  }
  return { ...up, data };
}

export function conformanceStats(src, upDownscaled, weights) {
  const stats = colourStats(src, upDownscaled, weights);
  const registration = { registrationMetric: 'luminance-dog-zncc', registrationSigmas: [1, 4], registrationStep: 0.25 };
  if (!stats.gateable) return { ...stats, ...registration, bestShift: { dx: 0, dy: 0, error: 0 }, drift: 0, registrationReliable: false };
  const { width, height } = src;
  const [a, b] = dogPair(src, upDownscaled, weights);
  const mask = weights && { width, height, channels: 1, data: weights };
  // Area-stratified samples retain sparse cut-outs on large canvases. Each
  // stratum carries its total alpha, keeping the bounded sample alpha-weighted.
  const step = Math.max(1, Math.ceil(Math.sqrt(width * height / 4096)));
  const points = [];
  for (let by = 0; by < height; by += step) for (let bx = 0; bx < width; bx += step) {
    const right = Math.min(width, bx + step), bottom = Math.min(height, by + step);
    const cx = (bx + right - 1) / 2, cy = (by + bottom - 1) / 2;
    let mass = 0, selected, distance = Infinity;
    for (let y = by; y < bottom; y++) for (let x = bx; x < right; x++) {
      const w = weights ? weights[y * width + x] : 1;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      mass += w;
      if (w && (!selected || w > selected.alpha || (w === selected.alpha && d < distance))) {
        selected = { x, y, alpha: w, value: a.data[y * width + x] }; distance = d;
      }
    }
    if (selected) points.push({ ...selected, weight: mass });
  }
  const score = (dx, dy) => {
    let total = 0, sumA = 0, sumB = 0, aa = 0, bb = 0, ab = 0;
    for (const { x, y, weight, value } of points) {
      if (x + dx < 0 || x + dx > width - 1 || y + dy < 0 || y + dy > height - 1) continue;
      const w = weight * (mask ? sample(mask, x + dx, y + dy, 0) : 1);
      if (!w) continue;
      const v = sample(b, x + dx, y + dy, 0);
      total += w; sumA += w * value; sumB += w * v;
      aa += w * value * value; bb += w * v * v; ab += w * value * v;
    }
    const varA = total ? aa - sumA * sumA / total : 0;
    const varB = total ? bb - sumB * sumB / total : 0;
    if (varA <= 1e-8 * total || varB <= 1e-8 * total || !total) return { error: 1, reliable: false };
    // ZNCC removes residual DC and normalises contrast; positive affine tone
    // changes leave the score unchanged. MAE would still depend on contrast.
    return { error: 1 - clamp((ab - sumA * sumB / total) / Math.sqrt(varA * varB), -1, 1), reliable: true };
  };
  let bestShift = { dx: 0, dy: 0, error: Infinity }, registrationReliable = false;
  const consider = (dx, dy) => {
    const { error, reliable } = score(dx, dy);
    if (error < bestShift.error - 1e-10 || (Math.abs(error - bestShift.error) <= 1e-10 && Math.hypot(dx, dy) < Math.hypot(bestShift.dx, bestShift.dy))) {
      bestShift = { dx, dy, error }; registrationReliable = reliable;
    }
  };
  for (let dy = -3; dy <= 3; dy += 0.5) for (let dx = -3; dx <= 3; dx += 0.5) consider(dx, dy);
  const { dx, dy } = bestShift;
  for (let y = Math.max(-3, dy - 0.5); y <= Math.min(3, dy + 0.5); y += 0.25)
    for (let x = Math.max(-3, dx - 0.5); x <= Math.min(3, dx + 0.5); x += 0.25) consider(x, y);
  return { ...stats, ...registration, bestShift, drift: Math.hypot(bestShift.dx, bestShift.dy), registrationReliable };
}
