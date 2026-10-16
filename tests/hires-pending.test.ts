import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, currentCandidateKey } from '../scripts/hires/upscale.mjs';
import { validateManifest } from '../scripts/hires/manifest.mjs';
import { lockEntry, outputPath, sourceSha256 } from '../scripts/hires/lock.mjs';
import { derivationDigest } from '../scripts/hires/states.mjs';

const fixture = async (family = false) => {
  const root = await mkdtemp(join(tmpdir(), 'hires-pending-'));
  await mkdir(join(root, 'public'));
  await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Upscale faithfully.');
  const input = { version: 1, defaults: {}, assets: ['a', 'b'].map((name) => ({ src: `public/${name}.png`,
    ...(family ? { family: 'button', reference: 'public/a.png' } : {}) })) };
  await writeFile(join(root, 'art/hires.json'), JSON.stringify(input));
  const assets = validateManifest(input).assets;
  const source = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#345678' } }).png().toBuffer();
  const output = await sharp(source).resize(16, 16).webp({ lossless: true }).toBuffer();
  const entries = Object.fromEntries(assets.map((asset: { src: string; factor: number; reference?: string }) => [outputPath(asset),
    lockEntry(source, asset, 'a'.repeat(64), { outputSha256: sourceSha256(output), width: 16, height: 16,
      ...(family && asset.src !== asset.reference ? { derivationDigest: derivationDigest(source, source, output, 4) } : {}) })]));
  for (const asset of assets) {
    await writeFile(join(root, asset.src), source);
    await writeFile(join(root, outputPath(asset)), output);
    entries[outputPath(asset)].cacheKey = await currentCandidateKey(asset, source, 'Upscale faithfully.', root);
  }
  const writeLock = () => writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: entries }));
  await writeLock();
  return { root, assets, entries, writeLock };
};

// Observe the processing boundary: a skipped asset cannot load tiles, merge or request.
const run = async (root: string, flags: string[] = []) => {
  const processed: string[] = [];
  const messages: string[] = [];
  const originalLog = console.log;
  console.log = (message: string) => { messages.push(message); };
  try {
    const code = await main(['--dry', '--pending', ...flags], { root,
      invoke: async () => { throw new Error('unexpected request'); },
      processAsset: async (asset: { src: string; provider: string }) => {
        processed.push(asset.src);
        return { provider: asset.provider, requests: 0, tiles: 0 };
      } });
    return { code, processed, messages };
  } finally { console.log = originalLog; }
};

test('pending skips valid locks before processing and composes with only, retries and dry', async () => {
  const { root } = await fixture();
  try {
    const result = await run(root, ['--only', 'a.png', '--retry-rejected', '3']);
    expect(result.code).toBe(0);
    expect(result.processed).toEqual([]);
    expect(result.messages).toContain('Skipped 1 assets as up to date.');
    expect(result.messages).toContain('Plan: 0 assets; api 0, external 0, resample 0; estimated API requests 0; external tiles 0.');
    // Exercise the real dry processor as well; skipping produces no per-asset plan.
    const messages: string[] = [];
    const originalLog = console.log;
    console.log = (message: string) => { messages.push(message); };
    try {
      expect(await main(['--dry', '--pending'], { root })).toBe(0);
      expect(messages).toEqual([
        'Skipped 2 assets as up to date.',
        'Plan: 0 assets; api 0, external 0, resample 0; estimated API requests 0; external tiles 0.',
      ]);
    } finally { console.log = originalLog; }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('pending processes changed source bytes and missing, corrupt or mismatched output proof', async () => {
  for (const change of ['source', 'missing', 'corrupt', 'hash', 'dimensions']) {
    const { root, assets, entries, writeLock } = await fixture();
    try {
      const path = outputPath(assets[0]);
      if (change === 'source') await writeFile(join(root, assets[0].src), await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ffffff' } }).png().toBuffer());
      if (change === 'missing') await rm(join(root, path));
      if (change === 'corrupt') await writeFile(join(root, path), 'invalid image');
      if (change === 'hash') entries[path].outputSha256 = 'b'.repeat(64);
      if (change === 'dimensions') entries[path].width = 15;
      await writeLock();
      expect((await run(root)).processed).toEqual(['public/a.png']);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test('pending accepts legacy output only at exact scale without rewriting the lock', async () => {
  for (const family of [false, true]) {
    for (const change of ['none', 'dimensions', 'missing']) {
      const { root, assets, entries, writeLock } = await fixture(family);
      try {
        for (const entry of Object.values(entries)) {
          delete entry.outputSha256; delete entry.width; delete entry.height;
        }
        const path = join(root, outputPath(assets[1]));
        if (change === 'dimensions') await writeFile(path, await sharp({ create: { width: 16, height: 15, channels: 4, background: '#345678' } }).webp().toBuffer());
        if (change === 'missing') await rm(path);
        await writeLock();
        const before = await readFile(join(root, 'art/hires.lock.json'), 'utf8');
        const result = await run(root);
        expect(result.code).toBe(0);
        expect(result.processed).toEqual(change === 'none' ? [] : ['public/b.png']);
        expect(await readFile(join(root, 'art/hires.lock.json'), 'utf8')).toBe(before);
      } finally { await rm(root, { recursive: true, force: true }); }
    }
  }
});

test('pending validates state dependencies without rebuilding valid locked siblings', async () => {
  for (const change of ['none', 'source', 'missing', 'recipe', 'membership', 'derivation', 'reference-output']) {
    const { root, assets, entries, writeLock } = await fixture(true);
    try {
      const path = outputPath(assets[1]);
      if (change === 'source') await writeFile(join(root, assets[1].src), Buffer.concat([await readFile(join(root, assets[1].src)), Buffer.from('changed')]));
      if (change === 'missing') await rm(join(root, path));
      if (change === 'recipe') entries[path].recipeDigest = 'b'.repeat(64);
      if (change === 'membership') entries[path].familyMembership = { ...entries[path].familyMembership, members: ['public/b.png'] };
      if (change === 'derivation') entries[path].derivationDigest = 'b'.repeat(64);
      if (change === 'reference-output') {
        const refPath = outputPath(assets[0]);
        const replacement = await sharp({ create: { width: 16, height: 16, channels: 4, background: '#ffffff' } }).webp().toBuffer();
        await writeFile(join(root, refPath), replacement);
        entries[refPath].outputSha256 = sourceSha256(replacement);
      }
      await writeLock();
      const result = await run(root, ['--only', 'b.png']);
      expect(result.processed).toEqual(change === 'none' ? [] : ['public/b.png']);
      expect(result.messages).toContain(`Skipped ${change === 'none' ? 2 : 1} assets as up to date.`);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test('accepted family members survive pending siblings only for identical candidate inputs', async () => {
  for (const change of ['none', 'source', 'prompt', 'candidate', 'output']) {
    const { root, assets, entries, writeLock } = await fixture(true);
    try {
      Object.assign(entries[outputPath(assets[0])], { accepted: true });
      await rm(join(root, outputPath(assets[1])));
      if (change === 'source') await writeFile(join(root, assets[0].src), Buffer.concat([await readFile(join(root, assets[0].src)), Buffer.from('new source')]));
      if (change === 'prompt') await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'A different candidate.');
      if (change === 'candidate') {
        const manifest = JSON.parse(await readFile(join(root, 'art/hires.json'), 'utf8'));
        manifest.assets[0].note = 'Different candidate instructions';
        await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
      }
      if (change === 'output') await writeFile(join(root, outputPath(assets[0])), await sharp({ create: { width: 16, height: 16, channels: 4, background: '#ffffff' } }).webp().toBuffer());
      await writeLock();
      const before = await readFile(join(root, 'art/hires.lock.json'));
      expect((await run(root)).processed).toEqual(change === 'none' ? ['public/b.png'] : ['public/a.png', 'public/b.png']);
      expect(await readFile(join(root, 'art/hires.lock.json'))).toEqual(before);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
