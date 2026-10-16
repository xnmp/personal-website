import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { cliOptions, main, acceptanceReasons } from '../scripts/hires/upscale.mjs';
import { detailStats } from '../scripts/hires/detail.mjs';
import { stateGateWeights, stateEvidence } from '../scripts/hires/states.mjs';
import { writeLockEntry } from '../scripts/hires/lock.mjs';
import { resample, seamStats, wrapRegion } from '../scripts/hires/periodic.mjs';
import { webpOptions } from '../scripts/webp.mjs';
import { validateManifest } from '../scripts/hires/manifest.mjs';

// These tests exercise API mechanics on small fixtures, so they lift the 2 MP
// credit floor (apiMinPixels: 0); hires-api-budget.test.ts covers that policy.

const image = (w: number, h: number, pixel: (x: number, y: number, c: number) => number) => ({ width: w, height: h, channels: 4,
  data: Uint8Array.from({ length: w * h * 4 }, (_, i) => i % 4 === 3 ? 255 : pixel(Math.floor(i / 4) % w, Math.floor(i / 4 / w), i % 4)) });
const paint = (x: number, y: number, c: number) => 120 + 35 * Math.sin(x * .31 + y * .17 + c) + 30 * Math.cos(y * .41 - x * .13 + c);
const png = (img: ReturnType<typeof image>) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer();
const fixture = async (provider = 'api') => {
  const root = await mkdtemp(join(tmpdir(), 'hires-improvements-'));
  await mkdir(join(root, 'public'), { recursive: true });
  await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
  await writeFile(join(root, 'art/hires.json'), JSON.stringify({ version: 1, defaults: {}, assets: [
    { src: 'public/a.png', provider, lossless: true, ...(provider === 'external' ? { external: { sizes: ['384x384'] } } : {}) },
  ] }));
  await writeFile(join(root, 'public/a.png'), await png(image(160, 160, paint)));
  return root;
};
const cache = async (root: string) => join(root, 'art/raw/hires/a', (await readdir(join(root, 'art/raw/hires/a')))[0]);
const arg = (args: string[], name: string) => args[args.indexOf(name) + 1];
const faithful = async (_command: string, args: string[]) => {
  const [w, h] = arg(args, '--size').split('x').map(Number);
  await sharp(arg(args, '--image')).resize(w, h).png().toFile(arg(args, '--out'));
};
const badOutput = (path: string, width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#111' } }).png().toFile(path);
const never = async () => { throw new Error('unexpected provider invocation'); };

describe('bounded candidate replacement', () => {
  test('validates the CLI budget', () => {
    expect(cliOptions([]).retryRejected).toBe(0);
    for (const n of ['-1', '1.5', 'NaN', 'Infinity', '9007199254740992']) expect(() => cliOptions([`--retry-rejected=${n}`])).toThrow(/non-negative integer/);
    expect(cliOptions(['--retry-rejected', '2']).retryRejected).toBe(2);
  });
  test('keeps rejected outputs, regenerates through gates, and publishes only the passing attempt', async () => {
    const root = await fixture(); let calls = 0;
    try {
      const invoke = async (command: string, args: string[]) => {
        calls++;
        if (calls < 3) { const [w, h] = arg(args, '--size').split('x').map(Number); await badOutput(arg(args, '--out'), w, h); }
        else await faithful(command, args);
      };
      expect(await main(['--retry-rejected', '2'], { root, apiMinPixels: 0, invoke })).toBe(0);
      expect(calls).toBe(3);
      const dir = await cache(root), names = await readdir(dir);
      expect(names).toContain('tile-0.rejected1.png'); expect(names).toContain('tile-0.rejected2.png');
      const stats = JSON.parse(await readFile(join(dir, 'stats.json'), 'utf8'));
      expect(stats).toMatchObject({ rejected: false, attempts: { requests: 3, retries: 2 } });
      expect(await readdir(join(root, 'public'))).toContain('a@2x.webp');
      // Verification must not recreate a missing lock, even for byte-identical output.
      const lockPath = join(root, 'art/hires.lock.json'); await rm(lockPath);
      expect(await main(['--remerge', '--verify', '--retry-rejected', '5'], { root, apiMinPixels: 0, invoke: never })).toBe(0);
      expect(await readdir(join(root, 'art'))).not.toContain('hires.lock.json');
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 30_000);
  test('default makes one request and explicit budgets cap failures including wrapper errors', async () => {
    for (const budget of [0, 2]) {
      const root = await fixture(); let calls = 0;
      try {
        expect(await main(['--retry-rejected', String(budget)], { root, apiMinPixels: 0, invoke: async () => { calls++; throw new Error('provider failed'); } })).toBe(1);
        expect(calls).toBe(budget + 1);
        expect(await readdir(join(root, 'public'))).toEqual(['a.png']);
        expect(JSON.parse(await readFile(join(await cache(root), 'stats.json'), 'utf8')).attempts.requests).toBe(budget + 1);
      } finally { await rm(root, { recursive: true, force: true }); }
    }
    const root = await fixture(); let calls = 0;
    try {
      await rm(join(root, 'public/a.png'));
      expect(await main(['--retry-rejected', '9'], { root, apiMinPixels: 0, invoke: async () => { calls++; } })).toBe(1);
      expect(calls).toBe(0);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test('deterministic process launch errors do not consume extra requests', async () => {
    const root = await fixture(); let calls = 0;
    try {
      expect(await main(['--retry-rejected', '4'], { root, apiMinPixels: 0, invoke: async () => {
        calls++; throw Object.assign(new Error('missing executable'), { code: 'ENOENT' });
      } })).toBe(1);
      expect(calls).toBe(1);
      expect(await readdir(join(root, 'public'))).toEqual(['a.png']);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test('multi-tile failures cannot spend a per-tile retry budget', async () => {
    const root = await fixture(); let calls = 0;
    try {
      await writeFile(join(root, 'public/a.png'), await png(image(2200, 100, paint)));
      expect(await main(['--retry-rejected', '1'], { root, apiMinPixels: 0, invoke: async () => { calls++; throw new Error('provider failed'); } })).toBe(1);
      expect(calls).toBe(2); // two initial tiles, no budget for replacing both
      expect(JSON.parse(await readFile(join(await cache(root), 'stats.json'), 'utf8')).attempts.retries).toBe(0);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test('external replacements persist their budget across generation passes', async () => {
    const root = await fixture('external');
    try {
      const flags = ['--retry-rejected', '1'];
      expect(await main(flags, { root, apiMinPixels: 0, invoke: never })).toBe(0);
      const dir = await cache(root), requestsPath = join(dir, 'requests.json');
      const request = JSON.parse(await readFile(requestsPath, 'utf8')).requests[0];
      await writeFile(request.outputPath, 'truncated PNG'); // corrupt external output also re-emits
      expect(await main(flags, { root, apiMinPixels: 0, invoke: never })).toBe(0);
      expect(await readdir(dir)).toContain('tile-0.rejected1.png');
      expect(JSON.parse(await readFile(requestsPath, 'utf8')).requests).toHaveLength(1);
      await badOutput(request.outputPath, 200, 100);
      expect(await main(flags, { root, apiMinPixels: 0, invoke: never })).toBe(1);
      expect(JSON.parse(await readFile(join(dir, 'stats.json'), 'utf8')).attempts).toMatchObject({ requests: 2, retries: 1 });
      expect(await readdir(join(root, 'public'))).toEqual(['a.png']);
      await sharp(request.requestPath).resize(384, 384).png().toFile(request.outputPath);
      expect(await main(flags, { root, apiMinPixels: 0, invoke: never })).toBe(0);
      expect(await readdir(join(root, 'public'))).toContain('a@2x.webp');
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 30_000);
});

test('state evidence ignores displacement outside its use mask and rejects displacement inside it', () => {
  const normal = image(240, 240, paint);
  const state = image(240, 240, (x, y, c) => paint(x, y, c) + (x >= 80 && x < 160 && y >= 80 && y < 160 ? 10 : 0));
  const weights = stateGateWeights(state, normal);
  const generated = (inside: boolean) => image(240, 240, (x, y, c) => {
    const selected = weights[y * 240 + x] > 0;
    const dx = selected === inside ? 3 : 0;
    return state.data[(y * 240 + Math.min(239, x + dx)) * 4 + c];
  });
  const reasons = (target: ReturnType<typeof image>) => {
    const stats = stateEvidence(state, target, weights);
    return acceptanceReasons({ ...stats, postWarp: stats.flow }, 'state', 14);
  };
  expect(reasons(generated(false))).toEqual([]);
  expect(reasons(generated(true)).join('; ')).toMatch(/residual/);
  expect(weights[0]).toBe(0);
  expect(weights[79 * 240 + 79]).toBe(1); // margin is evidence only
});

test('a state upscale displaced only in discarded paint still ships an unchanged canonical exterior', async () => {
  const root = await fixture();
  try {
    const entries = ['normal', 'hover'].map((name) => ({ src: `public/${name}.png`, provider: 'api', family: 'test/day', reference: 'public/normal.png' }));
    await writeFile(join(root, 'art/hires.json'), JSON.stringify({ version: 1, defaults: {}, assets: entries }));
    const normal = image(240, 240, paint);
    const state = image(240, 240, (x, y, c) => paint(x, y, c) + (x >= 80 && x < 160 && y >= 80 && y < 160 ? 10 : 0));
    const weights = stateGateWeights(state, normal);
    await writeFile(join(root, entries[0].src), await png(normal));
    await writeFile(join(root, entries[1].src), await png(state));
    const invoke = async (command: string, args: string[]) => {
      if (!arg(args, '--image').includes('/hover/')) return faithful(command, args);
      const discardedDisplacement = image(240, 240, (x, y, c) => weights[y * 240 + x] ? state.data[(y * 240 + x) * 4 + c] : paint(x + 12, y - 9, c));
      const [w, h] = arg(args, '--size').split('x').map(Number);
      await sharp(await png(discardedDisplacement)).resize(w, h).png().toFile(arg(args, '--out'));
    };
    expect(await main([], { root, apiMinPixels: 0, invoke })).toBe(0);
    const reference = await sharp(join(root, 'public/normal@2x.webp')).ensureAlpha().raw().toBuffer();
    const shipped = await sharp(join(root, 'public/hover@2x.webp')).ensureAlpha().raw().toBuffer();
    expect(shipped).not.toEqual(reference);
    // Far outside the state mask, every delivered RGBA value is canonical.
    expect(shipped.subarray(0, 480 * 80 * 4)).toEqual(reference.subarray(0, 480 * 80 * 4));
  } finally { await rm(root, { recursive: true, force: true }); }
}, 30_000);

test('HF energy measures visible paint over both backgrounds', () => {
  const smooth = image(96, 96, (x, y) => 60 + x / 3 + y / 3);
  expect(detailStats(smooth).passes).toBe(true);
  expect(detailStats(image(96, 96, (x) => x % 2 * 255)).passes).toBe(false);
  const invisible = { ...smooth, data: smooth.data.slice() };
  for (let i = 0; i < invisible.data.length; i += 4) { invisible.data[i] = i % 8 ? 255 : 0; invisible.data[i + 3] = 0; }
  expect(detailStats(invisible).hfRms).toBe(0);
  const alphaOnly = image(96, 96, () => 0);
  for (let p = 0; p < 96 * 96; p++) alphaOnly.data[p * 4 + 3] = p % 2 * 255;
  expect(detailStats(alphaOnly).black).toBe(0);
  expect(detailStats(alphaOnly).white).toBeGreaterThan(.6);
  expect(() => detailStats(null)).toThrow();
});

test('concurrent processes atomically merge every lock entry and release the guard after errors', async () => {
  const root = await fixture();
  const moduleURL = new URL('../scripts/hires/lock.mjs', import.meta.url).href;
  const child = (worker: number) => new Promise<void>((done, reject) => {
    const code = `import {writeLockEntry} from ${JSON.stringify(moduleURL)};for(let i=0;i<10;i++)await writeLockEntry(${JSON.stringify(root)},{src:'public/w${worker}-'+i+'.png',factor:2},{worker:${worker},i});`;
    const proc = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = ''; proc.stderr.on('data', (chunk) => { errors += chunk; });
    proc.on('error', reject); proc.on('exit', (code) => code === 0 ? done() : reject(new Error(errors)));
  });
  try {
    await Promise.all([0, 1, 2, 3].map(child));
    const path = join(root, 'art/hires.lock.json');
    const lock = JSON.parse(await readFile(path, 'utf8'));
    expect(Object.keys(lock.assets)).toHaveLength(40);
    for (let w = 0; w < 4; w++) for (let i = 0; i < 10; i++) expect(lock.assets[`public/w${w}-${i}@2x.webp`]).toEqual({ worker: w, i });
    await writeFile(path, '{bad');
    await expect(writeLockEntry(root, { src: 'public/new.png', factor: 2 }, {})).rejects.toThrow();
    expect((await readdir(join(root, 'art'))).filter((n) => /writing|pending/.test(n))).toEqual([]);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 30_000);

test('real periodic controls pass calibrated seams while an encoded boundary line fails', async () => {
  const { assets } = validateManifest(JSON.parse(await readFile(new URL('../art/hires.json', import.meta.url), 'utf8')));
  for (const asset of assets.filter((a: { periodic: boolean }) => a.periodic)) {
    const { data, info } = await sharp(new URL('../' + asset.src, import.meta.url).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const source = { data, width: info.width, height: info.height, channels: 4 }, baseline = resample(source, 2, true);
    const context = wrapRegion(source, -16, -16, source.width + 32, source.height + 32);
    const encoded = await sharp(Buffer.from(context.data), { raw: { width: context.width, height: context.height, channels: 4 } })
      .resize(context.width * 2, context.height * 2, { kernel: 'lanczos3' }).extract({ left: 32, top: 32, width: baseline.width, height: baseline.height })
      .webp(webpOptions(asset.quality)).toBuffer();
    const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer();
    expect(seamStats({ ...baseline, data: decoded }, baseline).passes).toBe(true);
    if (asset.src.endsWith('enamel-day.webp')) {
      const damaged = Buffer.from(decoded);
      for (let y = 0; y < baseline.height; y++) for (let c = 0; c < 3; c++) damaged[(y * baseline.width) * 4 + c] -= 20;
      const bytes = await sharp(damaged, { raw: { width: baseline.width, height: baseline.height, channels: 4 } }).webp({ lossless: true }).toBuffer();
      expect(seamStats({ ...baseline, data: await sharp(bytes).ensureAlpha().raw().toBuffer() }, baseline).passes).toBe(false);
    }
  }
}, 60_000);
