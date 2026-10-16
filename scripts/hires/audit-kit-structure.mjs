// Offline structural-gate calibration. No rendering or public/lock writes.
// node scripts/hires/audit-kit-structure.mjs scratchpad/native2/calibration <v1-dir> <fixed-dir>
// v1 files: <kit>/<name>@2x.webp; fixed files: <kit>/<name>.webp.
import sharp from 'sharp';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { kitConformance } from './generators.mjs';
import { edgeStructure } from './structure.mjs';
import { inkRecipe } from '../kit-native.mjs';

const [destination, before, after] = process.argv.slice(2);
const out = resolve(destination ?? 'scratchpad/native2/calibration');
if (!out.startsWith(resolve('scratchpad') + sep)) throw new Error('calibration output must be inside worktree scratchpad/');
await mkdir(out, { recursive: true });
const decode = async input => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const resize = async (image, width, height) => ({ data: await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } }).resize(width, height, { kernel: 'lanczos3' }).raw().toBuffer(), width, height, channels: 4 });
const states = ['normal', 'hover', 'focus', 'pressed'];
const painted = [
  ...['tile-day', 'tile-night', 'tile-signal', 'tile-signal-night'].flatMap(f => states.map(s => ['sumi', `${f}-${s}`])),
  ...['sheet-card', 'sheet-card-night'].flatMap(f => [...states, 'flat'].map(s => ['solarpunk', `${f}-${s}`])),
];
// The original tail calibration set: 26 painted assets plus 32 ligne assets.
const ligne = (await readdir('public/kit/ligne')).filter(f => /^(caption|mat|sheet|tile)-/.test(f) && f.endsWith('.webp') && !f.endsWith('@2x.webp')).flatMap(f => {
  const name = f.slice(0, -5);
  try { inkRecipe({ type: 'ink', kit: 'ligne', name }); return [['ligne', name]]; } catch { return []; }
});
const baseline = [];
for (const [kit, name] of [...painted, ...ligne]) {
  const asset = `public/kit/${kit}/${name}.webp`, source = await decode(asset);
  const enlarged = await resize(source, source.width * 2, source.height * 2);
  const roundtrip = await resize(await resize(enlarged, source.width, source.height), enlarged.width, enlarged.height);
  const gate = await kitConformance(source, enlarged);
  baseline.push({ asset, ...gate, structure: edgeStructure(enlarged, enlarged), roundtripStructure: edgeStructure(enlarged, roundtrip) });
}
const renders = [];
if (before || after) for (const [kit, name] of painted.filter(([kit, name]) => kit === 'solarpunk' || name.startsWith('tile-day-'))) {
  const source = await decode(`public/kit/${kit}/${name}.webp`), generator = { type: 'kit', kit, name };
  const row = { kit, name };
  for (const [label, root, suffix] of [['before', before, '@2x'], ['after', after, '']]) if (root) {
    const output = await decode(await readFile(resolve(root, kit, name + suffix + '.webp')));
    row[label] = await kitConformance(source, output, generator);
  }
  renders.push(row);
}
const summary = {
  baselineCount: baseline.length,
  baselineStructureMax: Math.max(...baseline.map(r => r.structure.peak)),
  roundtripStructureMax: Math.max(...baseline.map(r => r.roundtripStructure.peak)),
  baselineTailMax: Math.max(...baseline.map(r => r.tail)),
  ...(before ? { beforeRejected: renders.filter(r => !r.before.structure.passes).length, beforeMin: Math.min(...renders.map(r => r.before.structure.peak)) } : {}),
  ...(after ? { afterPassed: renders.filter(r => r.after.passes).length, afterMax: Math.max(...renders.map(r => r.after.structure.peak)) } : {}),
};
await writeFile(resolve(out, 'calibration.json'), JSON.stringify({ summary, baseline, renders }, null, 2) + '\n');
console.log(summary);
