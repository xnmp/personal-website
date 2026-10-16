import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { planTiles } from '../scripts/hires/tiles.mjs';
import { planExternalTiles } from '../scripts/hires/external.mjs';
import { padRequestCanvas, extractRequestTile } from '../scripts/hires/canvas.mjs';
import { assetCacheKey, DEFAULTS } from '../scripts/hires/manifest.mjs';
import { currentCandidateKey } from '../scripts/hires/upscale.mjs';

const source = (width: number, height: number) => ({ width, height, channels: 3 as const,
  data: Buffer.from(Uint8Array.from({ length: width * height * 3 }, (_, i) => {
    const p = Math.floor(i / 3), x = p % width, y = Math.floor(p / width);
    return 80 + (x * 7 + y * 11 + i % 3 * 23) % 120;
  })) });
const encode = (image: ReturnType<typeof source>) => sharp(image.data, { raw: image }).png().toBuffer();
const asset = { ...DEFAULTS, src: 'public/strip.png', note: 'Keep the texture.' };
const prompt = '  Upscale faithfully.  \n';
// Previous requestPrompt contract, deliberately independent of the new planner.
const oldPrompt = (count: number) => ['Upscale faithfully.', ...(count > 1
  ? ['Image 1 is a crop of a larger painting: keep its edges continuous; no border, vignette or frame at the edges.'] : []), asset.note].join('\n') + '\n';

for (const [width, height] of [[1688, 140], [140, 1688]]) {
  test(`${width}x${height}: remove repainted padding without losing or stretching source paint`, async () => {
    const tile = planTiles({ width, height, factor: 2 }).tiles[0];
    const image = source(width, height), original = Buffer.from(image.data);
    const canvas = await padRequestCanvas(image, tile);
    expect(canvas.width / canvas.height).toBeCloseTo(tile.apiW / tile.apiH, 12);
    expect(Math.abs(tile.requestW! - width - tile.padLeft! * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(tile.requestH! - height - tile.padTop! * 2)).toBeLessThanOrEqual(1);
    expect(image.data).toEqual(original);
    const paddedBytes = Buffer.from(Uint8Array.from(canvas.data, Math.round));
    // The model scales the whole padded input correctly, but changes its padding.
    const response = await sharp(paddedBytes, { raw: canvas }).resize(tile.apiW, tile.apiH, { kernel: 'nearest' }).raw().toBuffer();
    const left = tile.padLeft! * 2, top = tile.padTop! * 2;
    for (let y = 0; y < tile.apiH; y++) for (let x = 0; x < tile.apiW; x++) {
      if (x >= left && x < left + tile.ow && y >= top && y < top + tile.oh) continue;
      response.set([255, 0, 255], (y * tile.apiW + x) * 3);
    }
    const encoded = await sharp(response, { raw: { width: tile.apiW, height: tile.apiH, channels: 3 } }).png().toBuffer();
    const result = await extractRequestTile(encoded, tile);
    const expected = await sharp(image.data, { raw: image }).resize(tile.ow, tile.oh, { kernel: 'nearest' }).raw().toBuffer();
    expect([result.width, result.height, result.channels]).toEqual([tile.ow, tile.oh, 3]);
    expect(result.data).toEqual(expected);
    // A changed prompt invalidates the rejected paid request, without touching it.
    const input = await encode(image);
    expect(await currentCandidateKey(asset, input, prompt, '/unused')).not.toBe(assetCacheKey(input, asset, oldPrompt(1)));
  });
}

for (const [width, height] of [[1192, 857], [42, 28], [900, 300], [300, 900]]) {
  test(`${width}x${height}: rounding and 3:1 boundaries preserve input and legacy cache key`, async () => {
    const tile = planTiles({ width, height, factor: 2 }).tiles[0];
    expect(tile.requestW).toBeUndefined();
    const image = source(width, height);
    expect(await padRequestCanvas(image, tile)).toEqual(image);
    const input = await encode(image);
    expect(await currentCandidateKey(asset, input, prompt, '/unused')).toBe(assetCacheKey(input, asset, oldPrompt(1)));
    const generated = await extractRequestTile(input, tile);
    const legacy = await sharp(input).toColourspace('srgb').removeAlpha().resize(tile.ow, tile.oh, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer();
    expect(generated.data).toEqual(legacy);
  });
}

test('multi-tile request pads only the tile beyond tolerance and changes the asset key', async () => {
  const plan = planTiles({ width: 3845, height: 438, factor: 2 });
  expect(plan.tiles).toHaveLength(3);
  expect(plan.tiles.map((t) => !!t.requestW)).toEqual([false, false, true]);
  for (const tile of plan.tiles) {
    const image = source(tile.w, tile.h), canvas = await padRequestCanvas(image, tile);
    if (tile.requestW) expect(canvas.width / canvas.height).toBeCloseTo(tile.apiW / tile.apiH, 12);
    else expect(canvas).toEqual(image);
  }
  const input = await encode(source(3845, 438));
  expect(await currentCandidateKey(asset, input, prompt, '/unused')).not.toBe(assetCacheKey(input, asset, oldPrompt(3)));
  // The same crop prompt on an unaffected multi-tile asset stays byte-identical.
  const unchanged = await encode(source(4000, 650));
  expect(await currentCandidateKey(asset, unchanged, prompt, '/unused')).toBe(assetCacheKey(unchanged, asset, oldPrompt(3)));
});

test('tiny strips retain exact API aspect despite minimum-area sizing and odd padding', async () => {
  for (const [width, height] of [[1, 12], [12, 1]]) {
    const tile = planTiles({ width, height, factor: 2 }).tiles[0];
    const image = { ...source(width, height), data: Buffer.alloc(width * height * 3, 117) };
    const canvas = await padRequestCanvas(image, tile);
    expect(canvas.width / canvas.height).toBeCloseTo(tile.apiW / tile.apiH, 12);
    const response = await sharp(Buffer.from(Uint8Array.from(canvas.data, Math.round)), { raw: canvas }).resize(tile.apiW, tile.apiH).png().toBuffer();
    const result = await extractRequestTile(response, tile);
    expect([result.width, result.height]).toEqual([width * 2, height * 2]);
    expect(result.data.every((v: number) => v === 117)).toBe(true);
  }
});

test('shared smear preserves opaque paint and external proportional-output extraction', async () => {
  const tile = planExternalTiles({ width: 42, height: 28, factor: 2, sizes: ['128x128'] }).tiles[0];
  const image = { ...source(42, 28), data: Buffer.alloc(42 * 28 * 3, 93) };
  const canvas = await padRequestCanvas(image, tile);
  expect(canvas.channels).toBe(3);
  expect(canvas.data.every((v: number) => v === 93)).toBe(true);
  const response = await sharp(Buffer.from(canvas.data), { raw: canvas }).resize(192, 192).png().toBuffer();
  const result = await extractRequestTile(response, tile);
  expect([result.width, result.height]).toEqual([84, 56]);
  expect(result.data.every((v: number) => v === 93)).toBe(true);
  const wrongAspect = await sharp(response).resize(192, 96).png().toBuffer();
  await expect(extractRequestTile(wrongAspect, tile)).rejects.toThrow(/aspect/);
});
