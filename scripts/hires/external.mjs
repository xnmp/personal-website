/** External generation geometry. No IO, provider calls or image decoding. */
export function outputSizes(sizes, factor) {
  if (!Array.isArray(sizes) || !sizes.length || sizes.length > 32) throw new Error('external.sizes must be a nonempty array (at most 32 sizes)');
  const parsed = sizes.map((size) => {
    if (typeof size !== 'string' || !/^[1-9]\d*x[1-9]\d*$/.test(size)) throw new Error('external.sizes must contain WIDTHxHEIGHT strings');
    const [width, height] = size.split('x').map(Number);
    if (![width, height].every((n) => Number.isSafeInteger(n) && n <= 16384) || width * height > 64_000_000)
      throw new Error('external.sizes exceeds safe image dimensions');
    if (factor !== undefined && (!Number.isSafeInteger(factor) || factor < 1 || factor > 8 || width % factor || height % factor))
      throw new Error('external sizes must be divisible by an integer factor from 1 to 8');
    return { width, height };
  });
  if (new Set(sizes).size !== sizes.length) throw new Error('external.sizes contains duplicates');
  return parsed;
}

const axis = (size, capacity, overlap) => {
  if (size <= capacity) return [[0, size]];
  if (capacity <= overlap) throw new Error('external tile capacity must exceed overlap');
  const count = Math.ceil((size - overlap) / (capacity - overlap));
  if (count > 100000) return [];
  return Array.from({ length: count }, (_, i) => [Math.floor(i * (size - overlap) / count), Math.floor((i + 1) * (size - overlap) / count) + overlap]);
};

export function planExternalTiles({ width, height, factor, sizes, overlap = 64 }) {
  if (![width, height].every((n) => Number.isSafeInteger(n) && n > 0) || !Number.isSafeInteger(width * height * factor ** 2))
    throw new Error('Invalid external image dimensions');
  if (!Number.isSafeInteger(overlap) || overlap < 0) throw new Error('Invalid overlap');
  const candidates = outputSizes(sizes, factor).flatMap(({ width: apiW, height: apiH }) => {
    const requestW = apiW / factor, requestH = apiH / factor;
    if ((width > requestW && requestW <= overlap) || (height > requestH && requestH <= overlap)) return [];
    const xs = axis(width, requestW, overlap), ys = axis(height, requestH, overlap);
    if (!xs.length || !ys.length || xs.length * ys.length > 100000) return [];
    const tiles = ys.flatMap(([y, bottom]) => xs.map(([x, right]) => {
      const w = right - x, h = bottom - y;
      return { x, y, w, h, ox: x * factor, oy: y * factor, ow: w * factor, oh: h * factor,
        requestW, requestH, padLeft: Math.floor((requestW - w) / 2), padTop: Math.floor((requestH - h) / 2), apiW, apiH };
    }));
    return [{ outW: width * factor, outH: height * factor, tiles }];
  });
  candidates.sort((a, b) => a.tiles.length - b.tiles.length ||
    a.tiles.length * a.tiles[0].apiW * a.tiles[0].apiH - b.tiles.length * b.tiles[0].apiW * b.tiles[0].apiH);
  if (!candidates.length) throw new Error('Cannot plan external tiles: allowed sizes cannot accommodate overlap or exceed 100000 tiles');
  return candidates[0];
}

/** Accept only matching aspects (1% relative error); never crop/reframe to fit. */
export function normalizationSize(width, height, tile) {
  if (![width, height, tile.apiW, tile.apiH].every((n) => Number.isSafeInteger(n) && n > 0)) throw new Error('Invalid external output dimensions');
  const error = Math.abs((width / height) / (tile.apiW / tile.apiH) - 1);
  if (error > 0.01) throw new Error(`external output aspect ${width}x${height} differs from request ${tile.apiW}x${tile.apiH} by ${(error * 100).toFixed(2)}% (maximum 1%); tile rejected, no stretching`);
  return { width: tile.apiW, height: tile.apiH };
}
