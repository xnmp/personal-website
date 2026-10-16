// Read-only delivered-state audit. Writes JSONL to stdout; never mutates outputs,
// locks or cache. Optional baseline fixes the calibration cohort across snapshots.
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { validateManifest } from './manifest.mjs';
import { outputPath, sourceSha256 } from './lock.mjs';
import { changeReproduction, residualRouting } from './states.mjs';
import { residualCandidate, currentCandidateKey, stateConformance, stateCandidateFailures } from './upscale.mjs';

const decode = async (path) => {
  const bytes = await readFile(path);
  const { data, info } = await sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { image: { data, width: info.width, height: info.height, channels: info.channels }, sha256: sourceSha256(bytes) };
};
const down = async (image) => {
  const { data, info } = await sharp(image.data, { raw: image }).resize(image.width / 2, image.height / 2, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

export async function auditStates({ root, manifestRoot = root, baseline, cache, calibrate = false }, emit = (row) => console.log(JSON.stringify(row))) {
  const manifestBytes = await readFile(resolve(manifestRoot, 'art/hires.json'));
  const lockBytes = await readFile(resolve(root, 'art/hires.lock.json'));
  const assets = validateManifest(JSON.parse(manifestBytes)).assets;
  const locked = JSON.parse(lockBytes).assets;
  const prompt = calibrate && cache ? await readFile(resolve(manifestRoot, 'art/prompts/hires/upscale.txt'), 'utf8') : null;
  const states = assets.filter((a) => a.family && a.src !== a.reference);
  const cohort = baseline ? new Set((await readFile(baseline, 'utf8')).trim().split('\n').map(JSON.parse).filter((r) => r.src).map((r) => r.src)) : null;
  emit({ scope: { time: new Date().toISOString(), root, manifestRoot, manifestSha256: sourceSha256(manifestBytes), lockSha256: sourceSha256(lockBytes), calibrate } });
  for (const asset of states) {
    const isLocked = Object.hasOwn(locked, outputPath(asset));
    if (calibrate ? cohort ? !cohort.has(asset.src) : isLocked : !isLocked) continue;
    try {
      const [state, normal, reference] = await Promise.all([
        decode(resolve(manifestRoot, asset.src)), decode(resolve(manifestRoot, asset.reference)),
        decode(resolve(root, outputPath({ src: asset.reference, factor: 2 }))),
      ]);
      const record = { src: asset.src, theme: asset.src.split('/')[2], type: asset.src.split('-').at(-1).split('.')[0],
        proof: { state: state.sha256, normal: normal.sha256, reference: reference.sha256 } };
      if (calibrate) {
        const routing = residualRouting(state.image, normal.image, asset);
        const candidate = await residualCandidate(state.image, normal.image, reference.image, asset);
        const failures = stateCandidateFailures(candidate);
        let generated;
        if (cache) {
          // Never choose an arbitrary historical master: use the current paid
          // request identity, which is independent of the derivation recipe.
          const key = await currentCandidateKey(asset, await readFile(resolve(manifestRoot, asset.src)), prompt, manifestRoot);
          const folder = resolve(cache, asset.src.slice(7, -extname(asset.src).length), key.slice(0, 12));
          try {
            const request = JSON.parse(await readFile(resolve(folder, 'request.json'), 'utf8'));
            if (request.key !== key || request.src !== asset.src) throw new Error('cached request identity mismatch');
            const stats = JSON.parse(await readFile(resolve(folder, 'stats.json'), 'utf8'));
            if (stats.stateDerivation?.method === 'residual') throw new Error('cached master is derived, not generated');
            const output = await decode(resolve(folder, 'master.png'));
            const change = changeReproduction(state.image, normal.image, await down(output.image), await down(reference.image));
            const conformance = await stateConformance(state.image, normal.image, reference.image, output.image, await down(output.image), asset);
            // Preserve upstream model/tile conformance failures as well as
            // recomputing current whole-image and state-scoped delivered gates.
            conformance.reasons = [...new Set([...(stats.reasons ?? []), ...conformance.reasons])];
            conformance.passes = !conformance.reasons.length;
            generated = { path: resolve(folder, 'master.png'), sha256: output.sha256, change, conformance,
              failures: stateCandidateFailures({ change, conformance }) };
          } catch (error) { generated = { path: resolve(folder, 'master.png'), error: error.message }; }
        }
        const generatedPasses = generated && !generated.error && !generated.failures.length;
        const mayFallback = routing.mode === 'auto';
        const fallback = mayFallback && routing.method === 'generate' && generated && !generated.error && !generated.change.passes && !failures.length;
        emit({ ...record, routing, diagnostics: candidate.diagnostics, change: candidate.change, conformance: candidate.conformance,
          failures, ...(generated ? { generated } : {}), changeFallback: !!fallback,
          noPassingRoute: routing.method === 'residual' ? !!failures.length : generatedPasses || (mayFallback && !failures.length) ? false : generated?.error || !generated ? null : true,
          finalRouting: routing.method === 'residual' ? failures.length ? 'rejected' : 'residual'
            : generatedPasses ? 'generate' : generated?.error || !generated ? 'generate-unchecked' : mayFallback && !failures.length ? 'residual' : 'rejected' });
      } else {
        const output = await decode(resolve(root, outputPath(asset)));
        const change = changeReproduction(state.image, normal.image, await down(output.image), await down(reference.image));
        emit({ ...record, output: outputPath(asset), outputSha256: output.sha256, accepted: !!locked[outputPath(asset)].accepted, change });
      }
    } catch (error) { emit({ src: asset.src, error: error.message }); }
  }
  if (cache && !calibrate) for (const name of ['sheet-day-focus', 'sheet-night-focus']) {
    const asset = states.find((a) => a.src === `public/kit/solarpunk/${name}.webp`);
    const folder = resolve(cache, 'kit/solarpunk', name);
    for (const key of await readdir(folder)) {
      try {
        const [state, normal, reference, output] = await Promise.all([
          decode(resolve(manifestRoot, asset.src)), decode(resolve(manifestRoot, asset.reference)),
          decode(resolve(root, outputPath({ src: asset.reference, factor: 2 }))), decode(resolve(folder, key, 'master.png')),
        ]);
        emit({ evidence: resolve(folder, key, 'master.png'), src: asset.src, change: changeReproduction(state.image, normal.image, await down(output.image), await down(reference.image)) });
      } catch (error) { emit({ evidence: resolve(folder, key), error: error.message }); }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'manifest-root': { type: 'string' }, baseline: { type: 'string' }, cache: { type: 'string' }, calibrate: { type: 'boolean' } } });
  if (!values.root) throw new Error('--root is required');
  await auditStates({ ...values, manifestRoot: values['manifest-root'] });
}
