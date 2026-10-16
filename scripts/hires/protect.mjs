import { validateImage, colourStats, estimateFlow, padTransparent } from './merge.mjs';
import { stateEvidence } from './states.mjs';
import { resample } from './periodic.mjs';
import { validateProtection } from './manifest.mjs';

// Rectangles are source pixel cells; distances outside their scaled boundary
// are measured at output pixel centres. Union coverage uses max, never addition.
export function protectGlyphs(source, master, rects, feather = 6) {
  validateImage(source); validateImage(master);
  validateProtection({ src: 'protected image', provider: 'api', factor: 2, protect: rects, protectFeather: feather }, source.width, source.height);
  if (source.channels !== 4 || master.channels !== 4 || master.width !== source.width * 2 || master.height !== source.height * 2) throw new Error('Protection requires exact 2x RGBA geometry');
  const baseline = resample(source), data = master.data instanceof Float32Array ? Float32Array.from(master.data) : Uint8Array.from(master.data);
  const scaled = rects.map(({ x, y, w, h }) => ({ left: x * 2, top: y * 2, right: (x + w) * 2, bottom: (y + h) * 2 }));
  for (let y = 0; y < master.height; y++) for (let x = 0; x < master.width; x++) {
    let weight = 0;
    for (const r of scaled) {
      const distance = Math.hypot(Math.max(r.left - x - 0.5, 0, x + 0.5 - r.right), Math.max(r.top - y - 0.5, 0, y + 0.5 - r.bottom));
      const t = distance === 0 ? 1 : feather ? Math.max(0, 1 - distance / feather) : 0;
      weight = Math.max(weight, t * t * (3 - 2 * t));
    }
    if (!weight) continue; // Preserve every master byte beyond the feather.
    const i = (y * master.width + x) * 4;
    if (weight === 1) { data.set(baseline.data.subarray(i, i + 4), i); continue; }
    const a = master.data[i + 3] * (1 - weight), b = baseline.data[i + 3] * weight, alpha = a + b;
    data[i + 3] = Math.round(alpha);
    for (let c = 0; c < 3; c++) data[i + c] = data[i + 3] ? Math.round((master.data[i + c] * a + baseline.data[i + c] * b) / alpha) : 0;
  }
  return { ...master, data };
}

// Keep the existing conformance contract: RGB error, alpha-weighted visibility,
// and (for states) a grid fitted to the state's evidence support. Invisible RGB
// must not dilute colour error or invent alignment evidence.
export function protectedStats(source, down, stateWeights) {
  const a = padTransparent(source), b = padTransparent(down);
  if (stateWeights) {
    const stats = stateEvidence(a, b, stateWeights);
    return { ...stats, postWarp: stats.flow };
  }
  const weights = Float32Array.from({ length: source.width * source.height }, (_, p) => source.data[p * 4 + 3] / 255);
  return { ...colourStats(a, b, weights), postWarp: estimateFlow(a, b, { weights }).diagnostics };
}
