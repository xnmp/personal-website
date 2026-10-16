// Read-only strip audit. All intermediates and review crops stay in scratch.
// HIRES_KIT_RAW=... TMPDIR=$PWD/scratchpad/strips/tmp node scripts/hires/audit-kit-strips.mjs scratchpad/strips/audit [before-render-directory]
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { kitConformance, kitRawProof, kitRailSeams } from './generators.mjs';
import { kitRecipe } from '../kit-native.mjs';
const out = resolve(process.argv[2] ?? '');
const scratch = resolve('scratchpad/strips');
if (!out.startsWith(scratch + '/')) throw new Error('strip audit output must be under scratchpad/strips/');
await mkdir(out, { recursive: true });
const before = process.argv[3] && resolve(process.argv[3]);
const decode = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const background = '#243e50';
const crops = [];
// Every pair is Lanczos on the left, native on the right, nearest-neighbour 6x.
async function comparisons(name, stage, source, native, entry) {
  const { width: w, height: h } = await sharp(native).metadata();
  const baseline = await sharp(source).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer();
  const pair = async (label, region, extract = async input => sharp(input).extract(region).png().toBuffer()) => {
    const parts = await Promise.all([baseline, native].map(async input => sharp(await extract(input)).flatten({ background }).resize({ width: region.width * 6, kernel: 'nearest' }).png().toBuffer()));
    const path = `${out}/${name}-${stage}-${label}.png`;
    await sharp({ create: { width: region.width * 12, height: region.height * 6, channels: 3, background } })
      .composite(parts.map((input, i) => ({ input, left: i * region.width * 6, top: 0 }))).png().toFile(path);
    crops.push({ name, stage, label, path, region });
  };
  for (const [label, left, top] of [['tl', 168, 168], ['tr', w - 368, 168], ['bl', 168, h - 368], ['br', w - 368, h - 368]]) {
    // Both corner-to-rail joins, including the full 32 logical px overlap.
    await pair(`corner-${label}`, { left, top, width: 200, height: 200 });
  }
  for (const side of ['t', 'b', 'l', 'r']) {
    const horizontal = ['t', 'b'].includes(side), n = horizontal ? w : h;
    const region = pos => horizontal
      ? { left: pos, top: side === 't' ? 184 : h - 240, width: 104, height: 56 }
      : { left: side === 'l' ? 184 : w - 240, top: pos, width: 56, height: 104 };
    await pair(`mid-${side}`, region(Math.floor(n / 2 - 52)));
    // The periodic boundary is between the last and first rail texels.
    const wrap = horizontal ? { width: 104, height: 56 } : { width: 56, height: 104 };
    await pair(`repeat-${side}`, wrap, async input => {
      const boxes = [n - 304 - 52, 304].map(pos => ({ ...region(pos), ...(horizontal ? { width: 52 } : { height: 52 }) }));
      const parts = await Promise.all(boxes.map(box => sharp(input).extract(box).png().toBuffer()));
      return sharp({ create: { ...wrap, channels: 4, background: '#0000' } }).composite(parts.map((input, i) => ({ input, left: horizontal ? 52 * i : 0, top: horizontal ? 0 : 52 * i }))).png().toBuffer();
    });
    // Quilt placement is fixed by patch/overlap; inspect the complete overlap
    // at every handover, including the longer last overlap. No sampled seams.
    const P = entry.lengthen.patch ?? 64, O = entry.lengthen.overlap ?? 20;
    const length = entry.lengthen.length[horizontal ? 0 : 1];
    let end = P, index = 0;
    const positions = [];
    while (end < length - P + O) { positions.push(end - O); end += P - O; }
    positions.push(length - P);
    for (const pos of positions) await pair(`quilt-${side}-${String(index++).padStart(2, '0')}`, region(304 + pos * 2 - 4));
  }
}
const rows = [];
for (const name of ['sheet-strip-day', 'sheet-strip-night']) {
  const generator = { type: 'kit', kit: 'cyanotype', name: `${name}-normal` };
  const recipe = kitRecipe(generator), dir = await mkdtemp(join(out, 'work-'));
  try {
    for (const [d, label] of [[1, 'one'], [2, 'two'], [2, 'repeat']]) {
      await promisify(execFile)('node', ['scripts/build-kit.mjs', 'cyanotype', `--kit=${generator.name}`, `--density=${d}`,
        `--raw=${resolve(process.env.HIRES_KIT_RAW, 'cyanotype')}`, `--out=${dir}/${label}`, `--tmp=${dir}/work`]);
    }
    // Recipe states are the family contract; strips currently only have normal.
    for (const state of recipe.entry.states) {
      const file = `${name}-${state}.webp`, g = { ...generator, name: `${name}-${state}` };
      const [source, one, two, repeat] = await Promise.all([readFile(`public/kit/cyanotype/${file}`), readFile(`${dir}/one/${file}`), readFile(`${dir}/two/${file}`), readFile(`${dir}/repeat/${file}`)]);
      const s = await decode(source), t = await decode(two);
      const fidelity = await kitConformance(s, t, g), seams = await kitRailSeams(s, t, g);
      const row = { name: g.name, identity: source.equals(one), deterministic: two.equals(repeat), dimensions: [t.width, t.height],
        ...await kitRawProof(g), ...fidelity, seams, passes: source.equals(one) && two.equals(repeat) && fidelity.passes && seams.passes };
      rows.push(row);
      console.log(`${g.name}: identity=${row.identity}, deterministic=${row.deterministic}, MAE=${row.mae.toFixed(6)}, tail=${row.tail.toFixed(6)}, passes=${row.passes}`);
      await comparisons(g.name, 'after', source, two, recipe.entry);
      if (before) await comparisons(g.name, 'before', source, await readFile(join(before, file)), recipe.entry);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
await writeFile(`${out}/metrics.json`, JSON.stringify(rows, null, 2) + '\n');
await writeFile(`${out}/crops.json`, JSON.stringify(crops, null, 2) + '\n');
if (rows.some((row) => !row.passes)) process.exitCode = 1;
