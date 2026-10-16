// One-time migration; see docs/hires-settings-migration.md. No images or cache writes.
import { readFile, writeFile, open, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { validateManifest, settingsDigest, orderAssets } from './manifest.mjs';
import { readLock, lockMatches, outputPath, outputProof, sourceSha256 } from './lock.mjs';
import { currentCandidateKey } from './upscale.mjs';

// History was audited for this exact manifest. A later manifest needs a fresh
// history audit, not an automatic assertion about unknown legacy settings.
export const AUDITED_MANIFEST = '68f1426742ff912c80d82393c266f8936217bbcdc543d675a994001e9fb26795';
export async function backfillSettings({ root, write = false, manifestSha256 = AUDITED_MANIFEST }) {
  const path = resolve(root, 'art/hires.lock.json'), guard = path + '.writing';
  const pending = path + `.${randomUUID()}.pending`;
  // Same guard as pipeline publication. Refuse a live writer; never steal it.
  const handle = write ? await open(guard, 'wx') : null;
  try {
    const manifestBytes = await readFile(resolve(root, 'art/hires.json'));
    if (sourceSha256(manifestBytes) !== manifestSha256) throw new Error('Manifest differs from audited history; audit settings before backfill');
    const { assets } = validateManifest(JSON.parse(manifestBytes));
    const prompt = await readFile(resolve(root, 'art/prompts/hires/upscale.txt'), 'utf8');
    const lock = await readLock(root);
    const migrated = [], rejected = [];
    const updated = { ...lock.assets };
    for (const asset of orderAssets(assets)) {
      const output = outputPath(asset), entry = lock.assets[output];
      if (!entry || Object.hasOwn(entry, 'settingsDigest')) continue;
      try {
        const source = await readFile(resolve(root, asset.src));
        const bytes = await readFile(resolve(root, output));
        const proof = await outputProof(asset, source, bytes, root, assets, new Set(), { ...lock, assets: updated });
        proof.candidateKey = await currentCandidateKey(asset, source, prompt, root, entry);
        const candidate = { ...entry, settingsDigest: settingsDigest(asset) };
        if (!lockMatches(candidate, source, asset, proof)) throw new Error('stale source, settings, request identity or output proof');
        updated[output] = candidate;
        migrated.push(output);
      } catch (error) { rejected.push({ output, reason: error.message }); }
    }
    if (write && migrated.length) {
      // Avoid stamping settings from a manifest that changed while validating.
      if (!(await readFile(resolve(root, 'art/hires.json'))).equals(manifestBytes)) throw new Error('Manifest changed during backfill');
      await writeFile(pending, JSON.stringify({ ...lock, assets: updated }, null, 2) + '\n', { flag: 'wx' });
      await rename(pending, path);
    }
    return { write, migrated, rejected };
  } finally {
    if (handle) {
      try { await unlink(pending).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      finally { try { await handle.close(); } finally { await unlink(guard); } }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, write: { type: 'boolean' } } });
  if (!values.root) throw new Error('--root is required; omit --write for a read-only report');
  const result = await backfillSettings(values);
  console.log(JSON.stringify({ ...result, migratedCount: result.migrated.length, rejectedCount: result.rejected.length }, null, 2));
}
