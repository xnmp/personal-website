import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../scripts/hires/upscale.mjs';

// A pending asset of the given 1x size and provider, planned with --dry --pending.
const plan = async (size: number, provider: string, flags: string[] = []) => {
  const root = await mkdtemp(join(tmpdir(), 'hires-api-budget-'));
  const messages: string[] = [];
  const [log, error] = [console.log, console.error];
  try {
    await mkdir(join(root, 'public'));
    await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
    await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Upscale faithfully.');
    await writeFile(join(root, 'art/hires.json'), JSON.stringify({ version: 1, defaults: { external: { sizes: ['1254x1254'] } }, assets: [{ src: 'public/a.png', provider }] }));
    // Textured, so the asset is a genuine generative candidate rather than flat colour.
    const noise = Buffer.from(Array.from({ length: size * size * 3 }, (_, i) => (i * 7919) % 251));
    await writeFile(join(root, 'public/a.png'), await sharp(noise, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer());
    console.log = console.error = (message: string) => { messages.push(String(message)); };
    const code = await main(['--dry', '--pending', ...flags], { root, invoke: async () => { throw new Error('unexpected request'); } });
    return { code, messages };
  } finally {
    [console.log, console.error] = [log, error];
    await rm(root, { recursive: true, force: true });
  }
};

test('the API refuses art under 2 MP at 2x and names the external provider', async () => {
  const { code, messages } = await plan(600, 'api'); // 1200x1200 = 1.44 MP at 2x
  expect(code).toBe(1);
  expect(messages.some((m) => m.includes('API refused: 1200x1200 is under 2 MP at 2x; set provider "external"'))).toBe(true);
});

test('the same small art plans through external without refusal', async () => {
  const { code, messages } = await plan(600, 'external');
  expect(code).toBe(0);
  expect(messages.some((m) => m.includes('API refused'))).toBe(false);
  expect(messages.some((m) => m.includes('external'))).toBe(true);
});

test('art of at least 2 MP at 2x still plans API requests', async () => {
  const { code, messages } = await plan(710, 'api'); // 1420x1420 = 2.02 MP at 2x
  expect(messages.some((m) => m.includes('API refused'))).toBe(false);
  expect(messages.some((m) => /a\.png: 710x710 -> 1420x1420; .*API/.test(m))).toBe(true);
  expect(code).toBe(0);
});
