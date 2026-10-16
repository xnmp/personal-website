import postcss from 'postcss';
// Next ships this parser; reuse the installed copy so this tool also works offline.
import valueParser from 'next/dist/compiled/postcss-value-parser/index.js';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { extname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validateManifest } from './manifest.mjs';
import { lockMatches, outputPath, readLock } from './lock.mjs';

export const HIRES_MEDIA = '(min-resolution: 1.5dppx), (min-width: 2200px)';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const withoutFragment = (url) => url.split('#', 1)[0];
const hiresUrl = (url) => url.slice(0, -extname(url).length) + '@2x.webp';
const isHires = (url) => url.startsWith('/kit/') && withoutFragment(url).endsWith('@2x.webp');
const unavailable = (decl, available) => urls(rawValue(decl)).found
  .filter((n) => isHires(n.value) && !available.has(withoutFragment(n.value)))
  .map((n) => n.value);

// Walk functions, not text: a comment or a quoted CSS string can say "url(...)" too.
function urls(value) {
  const parsed = valueParser(value);
  const found = [];
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url') return;
    const parts = node.nodes.filter((n) => n.type !== 'space' && n.type !== 'comment');
    if (parts.length === 1 && ['string', 'word'].includes(parts[0].type)) found.push(parts[0]);
    return false;
  });
  return { parsed, found };
}

const rawValue = (decl) => decl.raws.value?.raw ?? decl.value;
const hasQuery = (decl) => urls(rawValue(decl)).found.some((n) => n.value.startsWith('/kit/') && n.value.includes('?'));
const twinDecl = (node) => node.nodes.find((n) => n.type === 'decl');

// These small nested blocks are reserved for twins. Recognising @2x even
// outside today's manifest lets a removed asset leave no override behind.
function isTwin(node) {
  if (node.type !== 'atrule' || node.name.toLowerCase() !== 'media') return false;
  const body = node.nodes?.filter((n) => n.type !== 'comment');
  if (body?.length !== 1 || body[0].type !== 'decl') return false;
  const found = urls(rawValue(body[0])).found;
  if (found.some((n) => isHires(n.value))) return true;
  let previous = node.prev();
  while (previous?.type === 'comment') previous = previous.prev();
  // A standalone policy query can itself contain authored 1x art. Only
  // recognise a reverted 1x twin when its source declaration is beside it.
  return node.params === HIRES_MEDIA && previous?.type === 'decl' && previous.prop === body[0].prop &&
    found.some((n) => n.value.startsWith('/kit/'));
}

function replacement(decl, available) {
  const { parsed, found } = urls(rawValue(decl));
  let changed = false;
  for (const node of found) {
    const source = withoutFragment(node.value);
    if (source.startsWith('/kit/') && !node.value.includes('?') && available.has(hiresUrl(source))) {
      node.value = hiresUrl(source) + node.value.slice(source.length);
      changed = true;
    }
  }
  if (!changed) return null;
  // A twin is one physical line; folding whitespace leaves its CSS tokens intact.
  const fold = (s) => s.replace(/\r?\n[\t ]*/g, ' ');
  parsed.walk((node) => {
    if (['space', 'comment'].includes(node.type)) node.value = fold(node.value);
    if (node.type === 'string') node.value = node.value.replace(/\\\r?\n/g, '');
    if (node.before) node.before = fold(node.before);
    if (node.after) node.after = fold(node.after);
  });
  return parsed.toString().trimEnd();
}

function twinFor(decl, value, newline) {
  const twin = postcss.atRule({ name: 'media', params: HIRES_MEDIA });
  // Keep the declaration's line indentation, including tabs and CRLF files.
  const indent = decl.raws.before?.match(/(?:^|\n)([\t ]*)$/)?.[1] ?? '';
  twin.raws = { before: newline + indent, afterName: ' ', between: ' ', after: ' ', semicolon: true };
  const child = decl.clone({ value });
  child.raws = { before: ' ', between: ': ' };
  twin.append(child);
  return twin;
}

/** Pure reconciliation: available contains manifest-filtered /kit/...@2x.webp URLs.
 * Issues describe the input; css is the repaired text. Queries are never edited. */
export function transformCss(text, available) {
  const bom = text.startsWith('\uFEFF') ? '\uFEFF' : '';
  const input = text.slice(bom.length);
  const root = postcss.parse(input);
  if (root.toString() !== input) throw new Error('PostCSS did not round-trip this file byte-identically');
  const issues = [];
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const report = (node, kind, message) => issues.push({
    kind, line: node.source?.start?.line ?? 1, column: node.source?.start?.column ?? 1, message,
  });
  const visit = (container) => {
    const nodes = [...container.nodes];
    const twins = nodes.filter(isTwin);
    const paired = new Set();
    const remove = (twin) => {
      const wasLast = container.nodes.findLast((n) => n.type !== 'comment') === twin;
      for (const comment of twin.nodes.filter((n) => n.type === 'comment')) container.insertBefore(twin, comment);
      twin.remove();
      const last = container.nodes.findLast((n) => n.type !== 'comment');
      // A declaration before a block had its own semicolon. PostCSS stores
      // the last semicolon on the container, so restore it when that block goes.
      if (wasLast && last?.type === 'decl') container.raws.semicolon = true;
    };
    for (const decl of nodes) {
      if (decl.type !== 'decl') continue;
      let next = decl.next();
      while (next?.type === 'comment') next = next.next();
      const twin = twins.includes(next) && twinDecl(next).prop === decl.prop ? next : null;
      if (twin) paired.add(twin);
      if (hasQuery(decl) || (twin && hasQuery(twinDecl(twin)))) {
        report(decl, 'query', `${decl.prop}: query-string kit URLs are out of scope; left untouched`);
        continue;
      }
      const value = replacement(decl, available);
      if (!value) {
        if (twin) {
          const missing = unavailable(twinDecl(twin), available);
          if (missing.length) report(twin, 'stale', `${decl.prop}: unavailable @2x URL(s): ${missing.join(', ')}`);
          report(twin, 'orphan', `${decl.prop}: orphan twin (no available @2x replacement for the 1x declaration)`);
          remove(twin);
        }
        continue;
      }
      const expected = twinFor(decl, value, newline);
      if (!twin) report(decl, 'missing', `${decl.prop}: missing twin`);
      else {
        const missing = unavailable(twinDecl(twin), available);
        if (missing.length) report(twin, 'stale', `${decl.prop}: unavailable @2x URL(s): ${missing.join(', ')}`);
        if (twin.params !== HIRES_MEDIA) report(twin, 'stale', `${decl.prop}: media must be ${HIRES_MEDIA}`);
        if (rawValue(twinDecl(twin)) !== rawValue(expected.first) || !!twinDecl(twin).important !== !!decl.important)
          report(twin, 'stale', `${decl.prop}: twin value differs from the 1x replacement`);
        if (twin.toString() !== expected.toString() || twin.raws.before !== expected.raws.before || decl.next() !== twin)
          report(twin, 'stale', `${decl.prop}: twin must be one line immediately after its declaration, with matching indentation`);
        remove(twin);
      }
      // Without a final semicolon PostCSS may keep the closing line break in
      // a custom property's value. Put it back after the new block instead.
      const raw = rawValue(decl);
      const trailing = raw.slice(raw.trimEnd().length);
      if (trailing && decl === container.last) {
        container.raws.after = trailing + (container.raws.after ?? '');
        decl.value = decl.value.trimEnd();
        if (decl.raws.value) decl.raws.value = { raw: raw.trimEnd(), value: decl.value };
      }
      container.insertAfter(decl, expected);
    }
    for (const twin of twins) {
      if (paired.has(twin)) continue;
      if (hasQuery(twinDecl(twin))) {
        report(twin, 'query', `${twinDecl(twin).prop}: query-string kit URLs are out of scope; left untouched`);
        continue;
      }
      report(twin, 'orphan', `${twinDecl(twin).prop}: orphan twin (no preceding 1x declaration with this property)`);
      remove(twin);
    }
    for (const node of nodes) if (node.nodes && !twins.includes(node)) visit(node);
  };
  visit(root);
  return { css: bom + root.toString(), issues };
}

async function cssFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.isFile() && entry.name.endsWith('.css') ? [path] : [];
  }));
  return files.flat().sort();
}

/** Read-only repo check, shared by the CLI and the repo-level test guard. */
export async function checkRepo(root = ROOT) {
  const manifest = validateManifest(JSON.parse(await readFile(resolve(root, 'art/hires.json'), 'utf8')));
  const lock = await readLock(root);
  const available = new Set();
  const issues = [];
  const states = await Promise.all(manifest.assets.map(async (asset) => {
    const output = outputPath({ src: asset.src, factor: 2 });
    const url = output.slice('public'.length);
    try {
      if (!(await stat(resolve(root, output))).isFile()) return { asset, url, valid: false };
    } catch (error) { if (error.code === 'ENOENT') return { asset, url, valid: false }; throw error; }
    // A missing sibling is normal; an existing one must prove its provenance,
    // even when its group is incomplete or no CSS declaration uses it yet.
    let valid = false;
    try { valid = asset.factor === 2 && lockMatches(lock.assets[output], await readFile(resolve(root, asset.src)), asset); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    return { asset, url, valid, issue: valid ? null : {
      kind: 'provenance', message: `${output}: stale or unlocked @2x; run bun run hires --only ${asset.src}`,
    } };
  }));
  const incomplete = new Set(states.filter((s) => s.asset.group && !s.valid).map((s) => s.asset.group));
  for (const { asset, url, valid, issue } of states) {
    if (issue) issues.push(issue);
    if (valid && !incomplete.has(asset.group)) available.add(url);
  }
  for (const group of [...incomplete].sort()) {
    const missing = states.filter((s) => s.asset.group === group && !s.valid).map((s) => s.asset.src);
    issues.push({ kind: 'group', severity: 'info', message: `${group}: incomplete group; using 1x for every member (unavailable: ${missing.join(', ')})` });
  }
  const results = await Promise.all((await cssFiles(resolve(root, 'src/app'))).map(async (path) => {
    const original = await readFile(path, 'utf8');
    return { path: relative(root, path), original, ...transformCss(original, available) };
  }));
  return [{ path: 'art/hires.lock.json', original: '', css: '', issues }, ...results];
}

export const diagnostics = (results, includeInfo = false) => results.flatMap(({ path, issues }) =>
  issues.filter((i) => includeInfo || i.severity !== 'info').map(({ line = 1, column = 1, kind, severity, message }) =>
    `${path}:${line}:${column}: ${severity === 'info' ? 'info: ' : ''}${kind}: ${message}`));

export async function main(args = process.argv.slice(2), { root = ROOT, log = console.log } = {}) {
  const { values } = parseArgs({ args, options: { check: { type: 'boolean' }, write: { type: 'boolean' } } });
  if (values.check && values.write) throw new Error('Choose either --check or --write');
  const results = await checkRepo(root);
  if (!values.write) {
    const messages = diagnostics(results, true);
    messages.forEach((message) => log(message));
    if (!messages.length) log('Hires CSS is up to date.');
    return diagnostics(results).length ? 1 : 0;
  }
  for (const { path, original, css } of results) {
    if (css === original) continue;
    await writeFile(resolve(root, path), css);
    log(`${path}: updated hires twins`);
  }
  // Rewriting twins cannot repair query URLs or provenance; groups stay info.
  const unresolved = results.map((r) => ({ ...r, issues: r.issues.filter((i) => ['query', 'provenance', 'group'].includes(i.kind)) }));
  diagnostics(unresolved, true).forEach((message) => log(message));
  return diagnostics(unresolved).length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message); process.exitCode = 1; });
}
