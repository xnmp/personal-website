import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Real-ESRGAN ncnn models the "sr" generator may name, pinned to the SHA-256 of
// their 2x weight files. The pins are part of the processing recipe, so other
// weights published under the same name never reuse a cached output or satisfy
// a lock. Regenerating needs the realesrgan-ncnn-vulkan binary and these files
// (Arch: realesrgan-ncnn-vulkan-bin; elsewhere the upstream release zip, with
// HIRES_SR_BIN / HIRES_SR_MODELS pointing at it). Verifying locks never does.
export const SR_MODELS = Object.freeze({
  'realesr-animevideov3': Object.freeze({
    'realesr-animevideov3-x2.param': 'b88ff4f00ebf019a7fdac17fdd45a7fd3665d37509efc5baf2e4da2e24420a04',
    'realesr-animevideov3-x2.bin': '548a36f9c3f4ab8da56cd3b13badf23968bee207b396dad14d04b830e5f2ab2d',
  }),
});

// Bump `implementation` whenever srImage's pre- or post-processing changes.
export const srRecipe = ({ model }) => ({ implementation: 'realesrgan-ncnn-vulkan/x2-luma-v1', weights: SR_MODELS[model] });

export const DEFAULT_SR_MODELS_DIR = '/usr/share/realesrgan-ncnn-vulkan/models';

/** Refuses to run a model whose installed weights are missing or are not the pinned ones. */
export async function verifySrWeights(model, dir) {
  if (!Object.hasOwn(SR_MODELS, model)) throw new Error(`unknown sr model ${model}`);
  for (const [file, pin] of Object.entries(SR_MODELS[model])) {
    const bytes = await readFile(join(dir, file)).catch(() => null);
    if (!bytes) throw new Error(`sr weights ${join(dir, file)} not found; install realesrgan-ncnn-vulkan or set HIRES_SR_MODELS`);
    if (createHash('sha256').update(bytes).digest('hex') !== pin) throw new Error(`sr weights ${join(dir, file)} do not match the pinned SHA-256 for ${model}`);
  }
}
