// Read-only native raw audit. Usage: HIRES_KIT_RAW=... node ... /tmp/review-dir
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { kitRecipe } from '../kit-native.mjs';
import { kitConformance, kitRawProof } from './generators.mjs';
import { validateManifest } from './manifest.mjs';
import { prepareGeneratedPixels, resolveStateCandidate } from './upscale.mjs';
const out = resolve(process.argv[2] ?? '');
if (!out.startsWith('/tmp/') && out !== resolve('scratchpad/rawnative')) throw new Error('audit output must be under /tmp/ or scratchpad/rawnative');
await mkdir(out, { recursive: true });
const decode = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const families = [['sumi', 'tile-day'], ['sumi', 'tile-night'], ['sumi', 'tile-signal'], ['sumi', 'tile-signal-night'], ['solarpunk', 'sheet-card'], ['solarpunk', 'sheet-card-night']];
const manifest = validateManifest(JSON.parse(await readFile('art/hires.json', 'utf8')));
const rows = [];
for (const [kit, name] of families) {
  const states = ['normal', 'hover', 'pressed', 'focus', ...(kit === 'solarpunk' ? ['flat'] : [])];
  const g = { type: 'kit', kit, name: `${name}-normal` };
  const r = kitRecipe(g), proof = await kitRawProof(g);
  const dir = await mkdtemp(join(tmpdir(), 'audit-kit-raw-'));
  try {
    for (const d of [1, 2, 2]) await promisify(execFile)('node', ['scripts/build-kit.mjs', kit, `--kit=${g.name}`, `--density=${d}`,
      `--raw=${resolve(process.env.HIRES_KIT_RAW, r.raw)}`, `--out=${dir}/${d === 2 && await readFile(`${dir}/2/${g.name}.webp`).catch(() => null) ? 'repeat' : d}`, `--tmp=${dir}/work`], { maxBuffer: 1024 * 1024 });
    const reference = `public/kit/${kit}/${g.name}.webp`;
    const assets = validateManifest({ version: 1, defaults: {}, assets: states.map((state) => ({ src: `public/kit/${kit}/${name}-${state}.webp`,
      provider: 'resample', family: `${kit}/${name}`, reference, generator: { ...g, name: `${name}-${state}` } })) }).assets;
    const normal = await decode(reference), nativeNormal = await decode(`${dir}/2/${g.name}.webp`);
    for (const asset of assets) {
      const file = `${asset.generator.name}.webp`;
      const [source, one, two, repeat] = await Promise.all([readFile(asset.src), readFile(`${dir}/1/${file}`), readFile(`${dir}/2/${file}`), readFile(`${dir}/repeat/${file}`)]);
      if (!source.equals(one)) throw new Error(`STOP: 1x identity changed: ${asset.src}`);
      const s = await decode(source), t = await decode(two);
      const baselineBytes = await sharp(source).resize(s.width * 2, s.height * 2, { kernel: 'lanczos3' }).png().toBuffer();
      const baseline = await kitConformance(s, await decode(baselineBytes));
      const native = await kitConformance(s, t, g);
      const master = prepareGeneratedPixels(s, t, asset, normal, nativeNormal);
      const encoded = await sharp(master.data, { raw: { width: master.width, height: master.height, channels: 4 } }).webp({ lossless: true }).toBuffer();
      const delivered = await decode(encoded);
      const gate = await kitConformance(s, delivered, g);
      const stateResult = asset.src === reference ? null : await resolveStateCandidate(s, normal, nativeNormal, delivered, asset);
      const prefix = `${out}/${kit}-${asset.generator.name}`;
      await sharp(two).png().toFile(`${prefix}@2x.png`);
      await sharp(encoded).png().toFile(`${prefix}-delivered@2x.png`);
      const region = { left: kit === 'sumi' ? 20 : 164, top: kit === 'sumi' ? 20 : 164, width: Math.min(400, t.width - 164), height: kit === 'sumi' ? 280 : 260 };
      const crop = async (input) => sharp(input).extract(region).flatten({ background: kit === 'sumi' && !name.includes('night') ? '#e8ded2' : '#24342b' }).png().toBuffer();
      const parts = [await crop(baselineBytes), await crop(encoded)];
      await sharp({ create: { width: region.width * 2, height: region.height, channels: 3, background: '#ffffff' } })
        .composite(parts.map((input, i) => ({ input, left: region.width * i, top: 0 }))).png().toFile(`${prefix}-compare.png`);
      if (asset.generator.name.endsWith('-focus')) {
        const zoom = { left: kit === 'sumi' ? 36 : 190, top: kit === 'sumi' ? 36 : 190, width: 140, height: 140 };
        const parts = await Promise.all([baselineBytes, encoded].map((input) => sharp(input).extract(zoom).flatten({ background: '#24342b' }).resize(560, 560, { kernel: 'nearest' }).png().toBuffer()));
        await sharp({ create: { width: 1120, height: 560, channels: 3, background: '#24342b' } }).composite(parts.map((input, i) => ({ input, left: i * 560, top: 0 }))).png().toFile(`${prefix}-focus-4x.png`);
      }
      const shipped = await readFile(asset.src.replace('.webp', '@2x.webp')).catch(() => null);
      let shippedMae;
      if (shipped) {
        shippedMae = (await kitConformance(s, await decode(shipped), g)).mae;
        await sharp({ create: { width: region.width * 3, height: region.height, channels: 3, background: '#ffffff' } })
          .composite([parts[0], await crop(shipped), parts[1]].map((input, i) => ({ input, left: region.width * i, top: 0 }))).png().toFile(`${prefix}-shipped-compare.png`);
      }
      const row = { asset: asset.src, enabled: manifest.assets.some((a) => a.src === asset.src && a.generator?.type === 'kit'), ...proof, identity: source.equals(one), deterministic: two.equals(repeat), dimensions: [t.width, t.height],
        mae: native.mae, tail: native.tail, pixelTail: native.pixelTail, deliveredPixelTail: gate.pixelTail, deliveredMae: gate.mae, deliveredTail: gate.tail, baselineMae: baseline.mae, baselineTail: baseline.tail, shippedMae, limit: gate.limit, tailLimit: gate.tailLimit, tailMetric: gate.tailMetric, failures: stateResult?.failures ?? [], passes: native.passes && gate.passes && !(stateResult?.failures.length) };
      rows.push(row); console.error(`${kit}/${asset.generator.name}: identity=${row.identity}; MAE=${row.mae.toFixed(6)}; delivered=${row.deliveredMae.toFixed(6)}; baseline=${row.baselineMae.toFixed(6)}; failures=${row.failures.join(';')}`);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
await writeFile(`${out}/metrics.json`, JSON.stringify(rows, null, 2) + '\n');
if (rows.some((r) => r.enabled && (!r.identity || !r.deterministic || !r.passes))) process.exitCode = 1;
