// The caller may exclude the unstretched corner squares along the tangent;
// the full rail depth is tested, including shadow and inner edge.
// Sparse defects along a rail must not be averaged over the empty canvas.
// Measure excess tangential curvature on reference edges, in premultiplied
// luminance and coverage. The cross-edge gradient selects the tangent; normal
// edge sharpness is deliberately not a defect. Three cross-edge samples keep
// an isolated codec pixel from dominating. A +/-2px normal neighbourhood in
// the reference (and +/-1px along it) allows resampling phase differences
// without forgiving new cuts on a smooth reference rail.
// Offline calibration (audit-kit-structure.mjs): 58 Lanczos controls = 0;
// an additional down/up round trip peaks at 14. The 14 defective v1 rails
// span 45.143..81.667; corrected delivered rails peak at 21.826. A global
// 32-code-value allowance separates these sets without canvas-area percentiles.
export const KIT_STRUCTURE_LIMIT = 32;
export const KIT_STRUCTURE_CONTRAST = 30;
export const KIT_STRUCTURE_ANISOTROPY = 4;

export function edgeStructure(reference, output, { inset = 0 } = {}) {
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
      for (let c = 0; c < control.length; c++) {
        let sum = 0;
        for (let j = -1; j <= 1; j++) {
          const k = i + j * normal;
          let baseline = 0;
          for (let z = -2; z <= 2; z++) for (let phase = -1; phase <= 1; phase++) baseline = Math.max(baseline, curvature(control[c], k + z * normal + phase * tangent, tangent));
          sum += Math.max(0, curvature(actual[c], k, tangent) - baseline);
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
