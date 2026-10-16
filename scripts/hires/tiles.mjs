export const API_LIMITS = Object.freeze({ multiple: 16, maxEdge: 3840, minAspect: 1 / 3, maxAspect: 3, minPixels: 655360, maxPixels: 8294400 });

// Ignore <=2% API size rounding: 1714 -> 1728, and the shipped 42x28
// tile on a 992x672 minimum-area canvas (1.61%). Preserve their paid keys.
// Symmetric in orientation: a portrait and its transpose make the same decision.
export const API_PADDING_TOLERANCE = 0.02;

const gcd = (a, b) => b ? gcd(b, a % b) : a;

const requestPadding = (tile) => {
  const aspect = tile.apiW / tile.apiH, sourceAspect = tile.w / tile.h;
  if (Math.max(aspect / sourceAspect, sourceAspect / aspect) - 1 <= API_PADDING_TOLERANCE) return tile;
  // Integer multiples of the reduced API aspect preserve source pixels and
  // match the canvas exactly, even when minimum-area sizing enlarges both axes.
  const divisor = gcd(tile.apiW, tile.apiH);
  const unitW = tile.apiW / divisor, unitH = tile.apiH / divisor;
  const units = Math.ceil(Math.max(tile.w / unitW, tile.h / unitH));
  const requestW = unitW * units, requestH = unitH * units;
  return { ...tile, requestW, requestH,
    padLeft: Math.floor((requestW - tile.w) / 2), padTop: Math.floor((requestH - tile.h) / 2) };
};

const axis = (size, count, overlap) => Array.from({ length: count }, (_, i) => {
  if (count === 1) return [0, size];
  const start = Math.floor(i * (size - overlap) / count);
  return [start, Math.floor((i + 1) * (size - overlap) / count) + overlap];
});

// Clamp API aspect first, then grow proportionally for the minimum area.
const apiSize = (w, h, limits) => {
  const { multiple: m, maxEdge, minAspect, maxAspect, minPixels, maxPixels } = limits;
  const baseW = Math.max(w, h * minAspect), baseH = Math.max(h, w / maxAspect);
  const scale = Math.max(1, Math.sqrt(minPixels / (baseW * baseH)));
  const desiredW = baseW * scale, desiredH = baseH * scale;
  let best, score = Infinity;
  for (let aw = Math.ceil(desiredW / m) * m; aw <= maxEdge; aw += m) {
    const ah = Math.ceil(Math.max(desiredH, aw / maxAspect) / m) * m;
    const area = aw * ah;
    if (ah > maxEdge || area < minPixels || area > maxPixels || aw / ah < minAspect || aw / ah > maxAspect) continue;
    const growth = Math.max(aw / desiredW, ah / desiredH);
    if (growth < score || (growth === score && area < best[0] * best[1])) { best = [aw, ah]; score = growth; }
  }
  return best;
};

/** @param {{ width: number, height: number, factor: number, overlap?: number, limits?: Partial<Record<keyof typeof API_LIMITS, number>> }} options */
export function planTiles({ width, height, factor, overlap = 64, limits = API_LIMITS }) {
  if (![width, height].every((n) => Number.isSafeInteger(n) && n > 0) || !Number.isFinite(factor) || factor <= 0 || factor > 8)
    throw new Error('Invalid dimensions or factor (positive integer dimensions; 0 < factor <= 8 required)');
  if (!Number.isSafeInteger(overlap) || overlap < 0) throw new Error('Invalid overlap');
  const l = { ...API_LIMITS, ...limits };
  if (!Number.isSafeInteger(l.multiple) || l.multiple < 1 || !Number.isSafeInteger(l.maxEdge) || l.maxEdge < l.multiple ||
      ![l.minPixels, l.maxPixels, l.minAspect, l.maxAspect].every((n) => Number.isFinite(n) && n > 0) ||
      l.minPixels > l.maxPixels || l.minAspect > l.maxAspect) throw new Error('Invalid API limits');
  const [outW, outH] = [Math.round(width * factor), Math.round(height * factor)];
  if (!outW || !outH || !Number.isSafeInteger(outW * outH)) throw new Error('Output dimensions cannot be planned safely');
  const dims = [width, height];
  const [minW, minH] = dims.map((n, i) => Math.max(1, Math.floor(Math.min(n, overlap + 1) * [outW, outH][i] / n)));
  if (Math.max(minW, minH * l.minAspect) * Math.max(minH, minW / l.maxAspect) > l.maxPixels ||
      l.minPixels > (Math.floor(l.maxEdge / l.multiple) * l.multiple) ** 2)
    throw new Error('Cannot plan tiles: overlap or minimum area exceeds the API limits');
  // Rounded canvas geometry, rather than the nominal factor, sets the bounds.
  const maxSources = [
    Math.floor((l.maxEdge + 1) * width / outW),
    Math.floor((l.maxEdge + 1) * height / outH),
  ];
  const maxCounts = dims.map((n) => Math.max(1, n - overlap));
  if (dims.some((n, i) => n > maxSources[i] && maxSources[i] <= overlap)) throw new Error('Cannot plan tiles: overlap exceeds the available tile size');
  const minimum = dims.map((n, i) => n <= maxSources[i] ? 1 : Math.ceil((n - overlap) / (maxSources[i] - overlap)));
  const sizeCache = new Map();
  for (let count = minimum[0] * minimum[1]; count <= maxCounts[0] * maxCounts[1]; count++) {
    for (let cols = minimum[0]; cols <= Math.min(count, maxCounts[0]); cols++) {
      const rows = count / cols;
      if (!Number.isInteger(rows) || rows < minimum[1] || rows > maxCounts[1]) continue;
      const tiles = [];
      let valid = true;
      for (const [y, bottom] of axis(height, rows, overlap)) {
        for (const [x, right] of axis(width, cols, overlap)) {
          const [ox, oy, ex, ey] = [x, y, right, bottom].map((v, i) => Math.round(i % 2 === 0 ? v * outW / width : v * outH / height));
          const [ow, oh] = [ex - ox, ey - oy];
          const key = `${ow},${oh}`;
          if (!sizeCache.has(key)) sizeCache.set(key, ow && oh ? apiSize(ow, oh, l) : undefined);
          const api = sizeCache.get(key);
          if (!api) { valid = false; break; }
          tiles.push(requestPadding({ x, y, w: right - x, h: bottom - y, ox, oy, ow, oh, apiW: api[0], apiH: api[1] }));
        }
        if (!valid) break;
      }
      if (valid) return { outW, outH, tiles };
    }
  }
  throw new Error('Cannot plan tiles satisfying the API limits and overlap');
}
