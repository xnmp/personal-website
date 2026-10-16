// Read-only calibration of native kit renders: repaired positives, historical
// v1/v2 renders and synthetic defect probes. API/external assets are excluded.
// node scripts/hires/audit-kit-structure.mjs scratchpad/native4/gate <v1> <v2> <fixed> <review-evidence>
// Historical files use <theme>/<name>@2x.webp; fixed files omit @2x.
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { kitConformance } from './generators.mjs';
import { edgeStructure } from './structure.mjs';

const [destination, v1, v2, fixed, review] = process.argv.slice(2);
const methodSha256 = createHash('sha256').update(await readFile(new URL('./structure.mjs', import.meta.url))).digest('hex');
const out = resolve(destination ?? 'scratchpad/native4/gate');
if (!out.startsWith(resolve('scratchpad/native4') + sep)) throw new Error('calibration output must be inside worktree scratchpad/native4/');
await mkdir(out, { recursive: true });
const decode = async input => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const metrics = ['peak', 'added', 'lost', 'coherent'];
const score = (gate, key) => key === 'peak' ? gate.peak : gate[key].peak;
const ratio = gate => Math.max(gate.peak / gate.limit, ...metrics.slice(1).map(key => gate[key].peak / gate[key].limit));
const summarize = rows => ({
  count: rows.length,
  passed: rows.filter(row => row.structure.passes).length,
  passRate: rows.length ? rows.filter(row => row.structure.passes).length / rows.length : null,
  distribution: Object.fromEntries(metrics.map(key => {
    const values = rows.map(row => score(row.structure, key)).sort((a, b) => a - b);
    const percentile = p => values[Math.min(values.length - 1, Math.floor(p * values.length))] ?? null;
    return [key, { min: values[0] ?? null, p50: percentile(0.5), p90: percentile(0.9), p95: percentile(0.95), p99: percentile(0.99), max: values.at(-1) ?? null }];
  })),
  top10: [...rows].sort((a, b) => ratio(b.structure) - ratio(a.structure)).slice(0, 10).map(row => ({ asset: row.asset, ratio: ratio(row.structure), structure: row.structure })),
});
const targets = [
  ...['normal', 'hover', 'focus', 'pressed'].map(state => ['sumi', `tile-day-${state}`]),
  ...['sheet-card', 'sheet-card-night'].flatMap(family => ['normal', 'flat', 'focus', 'hover', 'pressed'].map(state => ['solarpunk', `${family}-${state}`])),
];
const renders = [];
if (![destination, v1, v2, fixed, review].every(Boolean)) throw new Error('usage: audit-kit-structure.mjs <scratchpad/native4/output> <v1> <v2> <repaired> <review-evidence>');
for (const [label, root, suffix] of [['v1', v1, '@2x'], ['v2', v2, '@2x'], ['fixed', fixed, '']]) if (root) for (const [kit, name] of targets) {
  const asset = `${kit}/${name}`, source = await decode(`public/kit/${asset}.webp`);
  const output = await decode(resolve(root, kit, name + suffix + '.webp'));
  renders.push({ asset, version: label, ...await kitConformance(source, output, { type: 'kit', kit, name }) });
}
const probes = [];
if (review) {
  const reference = await decode(resolve(review, 'control.png'));
  for (const name of ['corner-notch', 'nonrail-speck', 'erase-top-rail']) {
    const output = await decode(resolve(review, name + '.png'));
    probes.push({ asset: name, structure: edgeStructure(reference, output, { inset: 120 }) });
  }
  const blurred = await sharp(reference.data, { raw: { width: reference.width, height: reference.height, channels: 4 } }).blur(2).raw().toBuffer();
  probes.push({ asset: 'blur-sigma-2', structure: edgeStructure(reference, { ...reference, data: blurred }, { inset: 120 }) });
  // Independent reproduction of the review's entire erased black stroke.
  const source = Buffer.alloc(400 * 400 * 4);
  for (let x = 100; x < 220; x++) source[(200 * 400 + x) * 4 + 3] = 255;
  const width = 800, height = 800;
  const data = await sharp(source, { raw: { width: 400, height: 400, channels: 4 } }).resize(width, height, { kernel: 'lanczos3' }).raw().toBuffer();
  const line = { data, width, height, channels: 4 };
  probes.push({ asset: 'erased-line', structure: edgeStructure(line, { ...line, data: Buffer.alloc(data.length) }, { inset: 304 }) });
}
// Additional behavioral probes match the independent review and coverage tests.
const image = (pixel, width = 128, height = 128) => {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(pixel(x, y), (y * width + x) * 4);
  return { data, width, height, channels: 4 };
};
const probe = (asset, reference, output) => probes.push({ asset, structure: edgeStructure(reference, output) });
const grey = image(() => [100, 100, 100, 255]);
probe('isoluminant-colored-line', grey, image((x, y) => x >= 50 && x < 70 && y >= 60 && y < 63 ? [160, 82, 100, 255] : [100, 100, 100, 255]));
probe('erase-neighboring-parallel-line', image((_x, y) => [100, 100, 100, y === 40 || y === 44 ? 255 : 0]), image((_x, y) => [100, 100, 100, y === 44 ? 255 : 0]));
probe('notched-rail', image((_x, y) => [100, 100, 100, y >= 40 ? 255 : 0]), image((x, y) => [100, 100, 100, y >= 40 && !(x >= 50 && x < 70 && y < 42) ? 255 : 0]));
probe('coherent-material-step', grey, image((x, y) => { const v = x >= 30 && x <= 65 && y >= 48 ? 150 : 100; return [v, v, v, 255]; }));
const rail = tone => image((x, y) => { const v = tone(y); return [v, v, v, x >= 40 && x < 56 && y >= 12 && y < 84 ? 255 : 0]; });
probe('faint-cross-rail-join', rail(() => 100), rail(y => y >= 48 ? 112 : 100));
// A sampled blur boundary, not a universal sigma guarantee for arbitrary art.
const stroke = image((x, y) => [25, 30, 35, x >= 12 && x < 84 ? Math.round(255 * Math.max(0, Math.min(1, 3 - Math.abs(y - 40)))) : 0], 96, 96);
for (const sigma of [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) {
  const data = await sharp(stroke.data, { raw: { width: stroke.width, height: stroke.height, channels: 4 } }).blur(sigma).raw().toBuffer();
  probe(`stroke-blur-sigma-${sigma}`, stroke, { ...stroke, data });
}
const positives = renders.filter(row => row.version === 'fixed');
const negatives = [...renders.filter(row => row.version !== 'fixed'), ...probes];
const separation = Object.fromEntries(metrics.map(key => {
  const maximum = Math.max(...positives.map(row => score(row.structure, key)));
  const minimum = Math.min(...negatives.map(row => score(row.structure, key)));
  const limit = key === 'peak' ? positives[0].structure.limit : positives[0].structure[key].limit;
  const rejected = negatives.filter(row => score(row.structure, key) > limit);
  const rejectedMinimum = rejected.length ? Math.min(...rejected.map(row => score(row.structure, key))) : null;
  return [key, { limit, positiveMax: maximum, positiveMargin: limit - maximum, negativeMin: minimum,
    gap: minimum - maximum, rejectedMin: rejectedMinimum, rejectedGap: rejectedMinimum === null ? null : rejectedMinimum - maximum,
    rejects: rejected.map(row => `${row.version ?? 'probe'}/${row.asset}`),
    positiveFailures: positives.filter(row => score(row.structure, key) > limit).map(row => row.asset) }];
}));
const summary = {
  separation,
  methodSha256,
  renders: Object.fromEntries(['v1', 'v2', 'fixed'].map(version => [version, summarize(renders.filter(row => row.version === version))])),
  probes: summarize(probes),
};
await writeFile(resolve(out, 'calibration.json'), JSON.stringify({ summary, renders, probes }, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
