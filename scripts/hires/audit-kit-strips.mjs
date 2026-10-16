// Read-only cyanotype strip audit. Outputs and intermediates must be scratch.
// HIRES_KIT_RAW=<raw root> TMPDIR=<scratch> node scripts/hires/audit-kit-strips.mjs <scratch output>
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { kitConformance, kitRawProof, kitRailSeams } from './generators.mjs';
const out = resolve(process.argv[2] ?? '');
if (!out.startsWith('/tmp/')) throw new Error('strip audit output must be scratch under /tmp/');
await mkdir(out, { recursive: true });
const decode = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};
const rows = [];
for (const name of ['sheet-strip-day', 'sheet-strip-night', 'sheet-strip-day-d', 'sheet-strip-night-d']) {
  const generator = { type: 'kit', kit: 'cyanotype', name: `${name}-normal` };
  const dir = await mkdtemp(join(tmpdir(), 'strip-audit-'));
  try {
    for (const [d, label] of [[1, 'one'], [2, 'two'], [2, 'repeat']]) {
      await promisify(execFile)('node', ['scripts/build-kit.mjs', 'cyanotype', `--kit=${generator.name}`, `--density=${d}`,
        `--raw=${resolve(process.env.HIRES_KIT_RAW, 'cyanotype')}`, `--out=${dir}/${label}`, `--tmp=${dir}/work`]);
    }
    const source = await readFile(`public/kit/cyanotype/${generator.name}.webp`);
    const one = await readFile(`${dir}/one/${generator.name}.webp`), two = await readFile(`${dir}/two/${generator.name}.webp`);
    const repeat = await readFile(`${dir}/repeat/${generator.name}.webp`);
    const s = await decode(source), t = await decode(two);
    const fidelity = await kitConformance(s, t, generator), seams = await kitRailSeams(s, t, generator);
    const row = { name, identity: source.equals(one), deterministic: two.equals(repeat), dimensions: [t.width, t.height],
      ...await kitRawProof(generator), ...fidelity, seams, passes: source.equals(one) && two.equals(repeat) && fidelity.passes && seams.passes };
    rows.push(row);
    console.log(`${name}: identity=${row.identity}, deterministic=${row.deterministic}, MAE=${row.mae.toFixed(6)}, tail=${row.tail.toFixed(6)}, seams=${seams.passes}`);
    const baseline = await sharp(source).resize(t.width, t.height, { kernel: 'lanczos3' }).png().toBuffer();
    const crop = (input, region) => sharp(input).extract(region).flatten({ background: '#243e50' }).png().toBuffer();
    const pair = async (label, a, b) => {
      const { width, height } = await sharp(a).metadata();
      await sharp({ create: { width: 2 * width, height, channels: 3, background: '#243e50' } })
        .composite([{ input: a, left: 0, top: 0 }, { input: b, left: width, top: 0 }]).png().toFile(`${out}/${name}-${label}.png`);
    };
    for (const [label, left, top] of [['tl', 160, 160], ['tr', t.width - 384, 160], ['bl', 160, t.height - 384], ['br', t.width - 384, t.height - 384]]) {
      const box = { left, top, width: 224, height: 224 };
      await pair(`corner-${label}`, await crop(baseline, box), await crop(two, box));
    }
    // Last 128px of one rail followed by first 128px of its next repetition.
    for (const side of ['t', 'b', 'l', 'r']) {
      const horizontal = ['t', 'b'].includes(side), n = horizontal ? t.width : t.height;
      const joinImage = async (input) => {
        const boxes = [n - 304 - 128, 304].map((pos) => horizontal
          ? { left: pos, top: side === 't' ? 160 : t.height - 304, width: 128, height: 144 }
          : { left: side === 'l' ? 160 : t.width - 304, top: pos, width: 144, height: 128 });
        const pieces = await Promise.all(boxes.map(box => crop(input, box)));
        return sharp({ create: { width: horizontal ? 256 : 144, height: horizontal ? 144 : 256, channels: 3, background: '#243e50' } })
          .composite(pieces.map((input, i) => ({ input, left: horizontal ? 128 * i : 0, top: horizontal ? 0 : 128 * i }))).png().toBuffer();
      };
      await pair(`join-${side}`, await joinImage(baseline), await joinImage(two));
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
await writeFile(`${out}/metrics.json`, JSON.stringify(rows, null, 2) + '\n');
if (rows.some((row) => !row.passes)) process.exitCode = 1;
