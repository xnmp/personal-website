// Kit-native gates: rail curvature 32, added 32, lost 24, coherent 24.
// No cross-rail seam statistic separated authored or rendered join seams from
// brass texture; visual review of corners is the backstop for those seams.
// Calibrate only against native repaired/historical renders and synthetic probes
// (audit-kit-structure.mjs), never generative API or external positive controls.
// Rail curvature catches supported straight-rail steps, notches and cross-banding;
// it misses excluded corners, unsupported short marks, erasure and smooth blur.
// Added catches new local marks/coverage (including chromatic marks), but misses
// removed detail and can forgive changes inside the documented texture allowance.
// Lost catches erased/broken strokes and sufficient blur, but misses new marks
// and mild blur: the audit stroke passes at sigma 1.5 (lost 14.76), rejects at
// sigma 1.75 (50.07); the separate frame at sigma 2 scores 25.73. These are
// sampled fixture-specific boundaries, not a universal blur detection radius.
// Coherent catches sustained signed steps on quiet material; it misses short or
// alternating marks, lost detail, and faint joins amid textured brass.
// All 14 repaired renders pass; v1 rejects, but v2 (including visible corner
// joins) passes these four gates. No metric separates every negative class.
// Rail continuity remains capped at 32 code values. A rail must be supported
// at six of seven reference positions across a 24px run; isolated corners and
// short painted marks are handled by the full-image fields below.
// Tangential curvature allows 3x nearby reference curvature (normal +/-2,
// tangent +/-12) and, for colour only, the native texture's mean + one standard
// deviation at tangent distances 4..24. Coverage never borrows this noise floor.
// Scores are local maxima: unrelated empty canvas cannot dilute a defect.
export const KIT_STRUCTURE_LIMIT = 32;
export const KIT_STRUCTURE_CONTRAST = 30;
export const KIT_STRUCTURE_ANISOTROPY = 4;

export function railStructure(reference, output, { inset = 0 } = {}) {
  const { width: W, height: H } = reference;
  if (output.width !== W || output.height !== H || reference.data.length !== W * H * 4 || output.data.length !== W * H * 4) throw new Error('structure inputs must be matching RGBA images');
  const fields = (data) => [
    Float32Array.from({ length: W * H }, (_, i) => (0.2126 * data[4 * i] + 0.7152 * data[4 * i + 1] + 0.0722 * data[4 * i + 2]) * data[4 * i + 3] / 255),
    Float32Array.from({ length: W * H }, (_, i) => data[4 * i + 3]),
  ];
  const actual = fields(output.data), control = fields(reference.data);
  const curvature = (f, i, t) => Math.abs(f[i - t] - 2 * f[i] + f[i + t]);
  const axes = ['x', 'y'].map((axis) => {
    const tangent = axis === 'x' ? 1 : W, normal = axis === 'x' ? W : 1;
    let peak = 0, location = null;
    for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
      const position = axis === 'x' ? x : y, length = axis === 'x' ? W : H;
      if (position < inset || position >= length - inset) continue;
      const i = y * W + x;
      let across = 0, along = 0;
      for (const f of control) {
        across = Math.max(across, Math.abs(f[i + 2 * normal] - f[i - 2 * normal]));
        along = Math.max(along, Math.abs(f[i + 2 * tangent] - f[i - 2 * tangent]));
      }
      if (across < KIT_STRUCTURE_CONTRAST || across < along * KIT_STRUCTURE_ANISOTROPY) continue;
      let support = 0;
      for (const distance of [-12, -8, -4, 0, 4, 8, 12]) {
        if (position + distance < 2 || position + distance >= length - 2) continue;
        const k = i + distance * tangent;
        let transverse = 0, longitudinal = 0;
        for (const f of control) {
          transverse = Math.max(transverse, Math.abs(f[k + 2 * normal] - f[k - 2 * normal]));
          longitudinal = Math.max(longitudinal, Math.abs(f[k + 2 * tangent] - f[k - 2 * tangent]));
        }
        if (transverse >= KIT_STRUCTURE_CONTRAST && transverse >= longitudinal * KIT_STRUCTURE_ANISOTROPY) support++;
      }
      if (support < 6) continue;
      for (let c = 0; c < control.length; c++) {
        let sum = 0;
        for (let j = -1; j <= 1; j++) {
          const k = i + j * normal;
          let baseline = 0;
          for (let z = -2; z <= 2; z++) for (const phase of [-12, -8, -4, -1, 0, 1, 4, 8, 12]) {
            if (position + phase <= 0 || position + phase >= length - 1) continue;
            baseline = Math.max(baseline, curvature(control[c], k + z * normal + phase * tangent, tangent));
          }
          let texture = 0;
          if (c === 0) {
            let sumCurvature = 0, sumSquares = 0, count = 0;
            for (let distance = 4; distance <= 24; distance += 2) for (const sign of [-1, 1]) {
              const positionAlong = position + sign * distance;
              if (positionAlong > 0 && positionAlong < length - 1) {
                const value = curvature(actual[c], k + sign * distance * tangent, tangent);
                sumCurvature += value; sumSquares += value * value; count++;
              }
            }
            const mean = count ? sumCurvature / count : 0;
            texture = mean + Math.sqrt(Math.max(0, count ? sumSquares / count - mean * mean : 0));
          }
          sum += Math.max(0, curvature(actual[c], k, tangent) - 3 * baseline - texture);
        }
        if (sum / 3 > peak) { peak = sum / 3; location = { x, y, channel: c === 0 ? 'luminance' : 'alpha' }; }
      }
    }
    return { axis, peak, location };
  });
  const peak = Math.max(...axes.map(a => a.peak));
  return { metric: 'max-excess-tangential-curvature', peak, limit: KIT_STRUCTURE_LIMIT,
    inset, contrast: KIT_STRUCTURE_CONTRAST, anisotropy: KIT_STRUCTURE_ANISOTROPY, axes, passes: peak <= KIT_STRUCTURE_LIMIT };
}

// Compare both added and lost structure in premultiplied RGBA, everywhere.
// Central differences span two pixels. Added energy is a 3x3 mean of absolute
// differences; coherent energy is the absolute signed mean across a 9px run.
// Native detail may be sharper than Lanczos: allow 3x reference alpha energy
// within 4px and 6x colour energy within 64px. Colour uses the broad context only
// where the local 5x5 reference support exceeds one code value; truly flat
// patches cannot borrow a distant edge. These are explicit fidelity tolerances,
// not guarantees that every possible change inside a textured patch is caught.
// Loss compares both peak sharpness and 9x9 energy mass, with 1.4x output
// allowance. The latter prevents one surviving parallel line substituting for
// an erased neighbour. Its phase margin stays 2px regardless of colour context.
export const KIT_ADDED_STRUCTURE_LIMIT = 32;
export const KIT_LOST_STRUCTURE_LIMIT = 24;
export const KIT_COHERENT_STRUCTURE_LIMIT = 24;
const box = (f, width, height, rx, ry) => {
  const out = new Float32Array(f.length), horizontal = new Float32Array(f.length);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < Math.min(width, rx + 1); x++) sum += f[y * width + x];
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = sum / (Math.min(width - 1, x + rx) - Math.max(0, x - rx) + 1);
      if (x - rx >= 0) sum -= f[y * width + x - rx];
      if (x + rx + 1 < width) sum += f[y * width + x + rx + 1];
    }
  }
  const sums = new Float64Array(width);
  for (let y = 0; y < Math.min(height, ry + 1); y++) for (let x = 0; x < width; x++) sums[x] += horizontal[y * width + x];
  for (let y = 0; y < height; y++) {
    const count = Math.min(height - 1, y + ry) - Math.max(0, y - ry) + 1;
    for (let x = 0; x < width; x++) {
      out[y * width + x] = sums[x] / count;
      if (y - ry >= 0) sums[x] -= horizontal[(y - ry) * width + x];
      if (y + ry + 1 < height) sums[x] += horizontal[(y + ry + 1) * width + x];
    }
  }
  return out;
};
const dilate = (f, width, height, r = 2) => {
  const horizontal = new Float32Array(f.length), out = new Float32Array(f.length);
  const queue = new Int32Array(Math.max(width, height));
  for (let y = 0; y < height; y++) {
    let head = 0, tail = 0, next = 0;
    for (let x = 0; x < width; x++) {
      const end = Math.min(width - 1, x + r);
      while (next <= end) {
        while (tail > head && f[y * width + queue[tail - 1]] <= f[y * width + next]) tail--;
        queue[tail++] = next++;
      }
      while (queue[head] < x - r) head++;
      horizontal[y * width + x] = f[y * width + queue[head]];
    }
  }
  // The vertical pass visits each column in order; each input is enqueued and
  // removed once, independent of the phase allowance radius.
  for (let x = 0; x < width; x++) {
    let head = 0, tail = 0, next = 0;
    for (let y = 0; y < height; y++) {
      const end = Math.min(height - 1, y + r);
      while (next <= end) {
        while (tail > head && horizontal[queue[tail - 1] * width + x] <= horizontal[next * width + x]) tail--;
        queue[tail++] = next++;
      }
      while (queue[head] < y - r) head++;
      out[y * width + x] = horizontal[queue[head] * width + x];
    }
  }
  return out;
};
export function localStructure(reference, output) {
  const { width, height } = reference;
  if (width !== output.width || height !== output.height || reference.data.length !== width * height * 4 || output.data.length !== width * height * 4) throw new Error('structure inputs must be matching RGBA images');
  const metrics = {
    added: { peak: 0, limit: KIT_ADDED_STRUCTURE_LIMIT, location: null, passes: true },
    lost: { peak: 0, limit: KIT_LOST_STRUCTURE_LIMIT, location: null, passes: true },
    coherent: { peak: 0, limit: KIT_COHERENT_STRUCTURE_LIMIT, location: null, passes: true },
  };
  const update = (name, value, i, channel, axis) => {
    if (value > metrics[name].peak) metrics[name] = { ...metrics[name], peak: value, location: { x: i % width, y: Math.floor(i / width), channel, axis } };
  };
  for (const channel of ['red', 'green', 'blue', 'alpha']) {
    const channelIndex = ['red', 'green', 'blue', 'alpha'].indexOf(channel);
    const fields = [reference, output].map(({ data }) => {
      const f = new Float32Array(width * height);
      for (let i = 0; i < f.length; i++) f[i] = channel === 'alpha' ? data[i * 4 + 3] : data[i * 4 + channelIndex] * data[i * 4 + 3] / 255;
      return f;
    });
    for (const axis of ['x', 'y']) {
      const gradients = fields.map(f => {
        const gradient = new Float32Array(f.length);
        for (let i = 0; i < f.length; i++) {
          const x = i % width, y = Math.floor(i / width);
          const a = axis === 'x' ? y * width + Math.max(0, x - 1) : Math.max(0, y - 1) * width + x;
          const b = axis === 'x' ? y * width + Math.min(width - 1, x + 1) : Math.min(height - 1, y + 1) * width + x;
          gradient[i] = f[b] - f[a];
        }
        return gradient;
      });
      const energy = gradients.map(f => box(f.map(Math.abs), width, height, 1, 1));
      const maxima = energy.map(f => dilate(f, width, height, channel === 'alpha' ? 4 : 64));
      const nearby = dilate(energy[0], width, height, 4);
      const support = dilate(energy[0], width, height, 2);
      const mass = energy.map(f => box(f, width, height, 4, 4));
      const outputMass = dilate(mass[1], width, height, 2);
      const coherent = gradients.map(f => box(f, width, height, axis === 'x' ? 0 : 4, axis === 'y' ? 0 : 4).map(Math.abs));
      const referenceCoherent = dilate(coherent[0], width, height, channel === 'alpha' ? 4 : 64);
      const nearbyCoherent = dilate(coherent[0], width, height, 4);
      for (let i = 0; i < width * height; i++) {
        update('added', energy[1][i] - (channel === 'alpha' ? 3 : 6) * (support[i] > 1 ? maxima[0][i] : nearby[i]), i, channel, axis);
        update('lost', Math.max(energy[0][i] - 1.4 * maxima[1][i], mass[0][i] - 1.4 * outputMass[i]), i, channel, axis);
        update('coherent', coherent[1][i] - (channel === 'alpha' ? 3 : 6) * (support[i] > 1 ? referenceCoherent[i] : nearbyCoherent[i]), i, channel, axis);
      }
    }
  }
  for (const metric of Object.values(metrics)) metric.passes = metric.peak <= metric.limit;
  return { ...metrics, passes: Object.values(metrics).every(metric => metric.passes) };
}
export function edgeStructure(reference, output, options = {}) {
  const rail = railStructure(reference, output, options), local = localStructure(reference, output);
  return { ...rail, ...local, passes: rail.passes && local.passes };
}
