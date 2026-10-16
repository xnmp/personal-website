// Read-only evidence runner. Builds into private scratch directories, never public
// or the raw/cache trees. HIRES_KIT_RAW points at the parent of <kit.raw>/.
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { inkRecipe } from '../kit-native.mjs';
import { inkConformance } from './generators.mjs';
import { validateManifest } from './manifest.mjs';
import { prepareGeneratedPixels, resolveStateCandidate } from './upscale.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const decode = async (b) => {
  const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const root = process.cwd(), raw = process.env.HIRES_KIT_RAW ?? resolve(root, 'art/raw');
const manifest = validateManifest(JSON.parse(await readFile('art/hires.json', 'utf8')));
const groups = Map.groupBy(manifest.assets.filter((a) => a.generator?.type === 'ink'), (a) => inkRecipe(a.generator).entry.name);
const rows = [];
for (const assets of groups.values()) {
  const g = assets[0].generator;
  const dir = await mkdtemp(join(tmpdir(), 'audit-ink-'));
  try {
    for (const d of [1, 2]) await promisify(execFile)(process.execPath, ['scripts/build-kit.mjs', g.kit, `--ink=${g.name}`, `--density=${d}`,
      `--raw=${resolve(raw, inkRecipe(g).raw)}`, `--out=${dir}/${d}`, `--tmp=${dir}/work`], { maxBuffer: 1024 * 1024 });
    for (const asset of assets) {
      const [source, one, two] = await Promise.all([readFile(asset.src), readFile(`${dir}/1/${asset.generator.name}.webp`), readFile(`${dir}/2/${asset.generator.name}.webp`)]);
      const [s, t] = await Promise.all([decode(source), decode(two)]);
      const gate = await inkConformance(s, t);
      let delivered = t, failures = [], registration;
      if (asset.family && asset.reference !== asset.src) {
        const normal = await decode(await readFile(asset.reference));
        const reference = await decode(await readFile(`${dir}/2/${asset.reference.split('/').at(-1)}`));
        const master = prepareGeneratedPixels(s, t, asset, normal, reference);
        delivered = await decode(await sharp(master.data, { raw: { width: master.width, height: master.height, channels: 4 } }).webp({ lossless: true }).toBuffer());
        const result = await resolveStateCandidate(s, normal, reference, delivered, asset);
        failures = result.failures;
        registration = result.conformance.registration;
      }
      const deliveredGate = await inkConformance(s, delivered);
      const row = { deliveredMae: deliveredGate.mae, deliveredPasses: deliveredGate.passes && !failures.length, failures,
        ...(registration ? { outsideDifferingPixels: registration.outsideDifferingPixels } : {}), name: asset.generator.name, width: s.width, height: s.height, byteIdentical: source.equals(one), sourceSha256: sha(source), oneSha256: sha(one), twoSha256: sha(two), ...gate };
      rows.push(row); console.error(`${row.name}: 1x ${row.byteIdentical ? 'IDENTICAL' : 'DIFF'}; 2x MAE ${gate.mae.toFixed(6)}/255 ${gate.passes ? 'PASS' : 'FAIL'}; delivered ${deliveredGate.mae.toFixed(6)} ${row.deliveredPasses ? 'PASS' : failures.join('; ')}`);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
console.log(JSON.stringify(rows, null, 2));
if (rows.some((r) => !r.byteIdentical || !r.passes || !r.deliveredPasses)) process.exitCode = 1;
