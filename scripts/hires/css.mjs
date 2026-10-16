import postcss from 'postcss';
// Next ships this parser; reuse the installed copy so this tool also works offline.
import valueParser from 'next/dist/compiled/postcss-value-parser/index.js';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { extname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { processingRecipe, validateManifest } from './manifest.mjs';
import { familyMembershipMatches, lockMatches, outputPath, readLock, outputProof } from './lock.mjs';

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
// PostCSS represents comments after a semicolon as siblings. Keep comments
// starting on the declaration's line attached to it when inserting its twin.
function trailingCommentAnchor(decl) {
  let anchor = decl;
  while (anchor.next()?.type === 'comment' && /^[\t ]*$/.test(anchor.next().raws.before ?? '')) anchor = anchor.next();
  return anchor;
}

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

// Resolve all possible assignments, including aliases supplied by other theme
// files. Over-approximating the cascade is safe: mixed-use assets need density too.
export function borderSources(texts) {
  const declarations = texts.flatMap((text) => {
    const found = [];
    postcss.parse(text).walkDecls((decl) => { if (!isTwin(decl.parent)) found.push(decl); });
    return found;
  });
  const sources = new Set();
  const constraints = (decl) => {
    let contexts = [{}];
    for (let node = decl.parent; node; node = node.parent) {
      if (!node.selector) continue;
      const alternatives = postcss.list.comma(node.selector).map((selector) => {
        const scope = {};
        // Functional pseudos can contain alternatives, negations or descendant
        // attributes. Only attributes outside those functions constrain scope.
        const outer = valueParser.stringify(valueParser(selector).nodes.filter((n) => n.type !== 'function'));
        for (const match of outer.matchAll(/\[(data-[\w-]+)=["']?([\w-]+)["']?\]/g)) scope[match[1]] = match[2];
        return scope;
      });
      contexts = contexts.flatMap((context) => alternatives.map((scope) => ({ ...context, ...scope })));
    }
    return contexts;
  };
  const assignments = declarations.filter((d) => d.prop.startsWith('--'));
  const visited = new Set();
  const collect = (value, context) => {
    for (const node of urls(value).found) sources.add(withoutFragment(node.value));
    valueParser(value).walk((node) => {
      if (node.type !== 'function' || node.value.toLowerCase() !== 'var') return;
      const name = node.nodes.find((n) => n.type === 'word')?.value;
      for (const decl of assignments.filter((d) => d.prop === name)) {
        for (const scope of constraints(decl)) {
          if (Object.keys(scope).some((key) => context[key] && context[key] !== scope[key])) continue;
          const merged = { ...context, ...scope };
          const key = `${declarations.indexOf(decl)}:${JSON.stringify(Object.entries(merged).sort())}`;
          if (visited.has(key)) continue;
          visited.add(key);
          collect(rawValue(decl), merged);
        }
      }
    });
  };
  declarations.filter((d) => /^(?:-webkit-)?border-image(?:-source)?$/i.test(d.prop)).forEach((d) => constraints(d).forEach((context) => collect(rawValue(d), context)));
  return sources;
}

function replacement(decl, available, borders) {
  const { parsed, found } = urls(rawValue(decl));
  const borderNodes = new Set();
  let changed = false;
  for (const node of found) {
    const source = withoutFragment(node.value);
    if (source.startsWith('/kit/') && !node.value.includes('?') && available.has(hiresUrl(source))) {
      node.value = hiresUrl(source) + node.value.slice(source.length);
      if (borders.has(source)) borderNodes.add(node);
      changed = true;
    }
  }
  if (!changed) return null;
  // Wrap the URL function, never its argument. Collapse an authored image-set
  // to the single density-correct candidate when it feeds a border.
  const wrap = (nodes) => nodes.flatMap((node) => {
    if (node.type !== 'function') return [node];
    if (/^(?:-webkit-)?image-set$/i.test(node.value)) {
      const candidate = node.nodes.find((n) => n.type === 'function' && n.value.toLowerCase() === 'url' && n.nodes.some((n) => borderNodes.has(n)));
      if (candidate) return valueParser(`image-set(${valueParser.stringify(candidate)} 2x)`).nodes;
    }
    if (node.value.toLowerCase() === 'url' && node.nodes.some((n) => borderNodes.has(n)))
      return valueParser(`image-set(${valueParser.stringify(node)} 2x)`).nodes;
    node.nodes = wrap(node.nodes);
    return [node];
  });
  parsed.nodes = wrap(parsed.nodes);
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

function invalidBorderDensity(value, borders) {
  const visit = (nodes, sets = []) => nodes.some((node) => {
    if (node.type !== 'function') return false;
    if (node.value.toLowerCase() === 'url') {
      const url = node.nodes.find((n) => ['word', 'string'].includes(n.type))?.value;
      if (!url || !isHires(url) || !borders.has(withoutFragment(url))) return false;
      const tokens = sets[0]?.nodes.filter((n) => !['space', 'comment'].includes(n.type));
      return sets.length !== 1 || tokens.length !== 2 || tokens[0] !== node || tokens[1].value !== '2x';
    }
    return visit(node.nodes, /^(?:-webkit-)?image-set$/i.test(node.value) ? [...sets, node] : sets);
  });
  return visit(valueParser(value).nodes);
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
export function transformCss(text, available, borders = borderSources([text])) {
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
      if (invalidBorderDensity(rawValue(decl), borders)) report(decl, 'border', `${decl.prop}: @2x border sources require one single-candidate image-set with density 2x`);
      if (urls(rawValue(decl)).found.some((n) => isHires(n.value) && borders.has(withoutFragment(n.value)))) {
        let node = decl.parent;
        while (node && !(node.type === 'atrule' && node.name === 'media' && node.params === HIRES_MEDIA)) node = node.parent;
        if (!node) report(decl, 'border', `${decl.prop}: @2x border source must be under @media ${HIRES_MEDIA}`);
      }
      let next = decl.next();
      while (next?.type === 'comment') next = next.next();
      const twin = twins.includes(next) && twinDecl(next).prop === decl.prop ? next : null;
      if (twin) paired.add(twin);
      if (hasQuery(decl) || (twin && hasQuery(twinDecl(twin)))) {
        report(decl, 'query', `${decl.prop}: query-string kit URLs are out of scope; left untouched`);
        continue;
      }
      const value = replacement(decl, available, borders);
      if (!value) {
        if (twin) {
          const missing = unavailable(twinDecl(twin), available);
          if (missing.length) report(twin, 'stale', `${decl.prop}: unavailable @2x URL(s): ${missing.join(', ')}`);
          report(twin, 'orphan', `${decl.prop}: orphan twin (no available @2x replacement for the 1x declaration)`);
          remove(twin);
        }
        continue;
      }
      const anchor = trailingCommentAnchor(decl);
      const expected = twinFor(decl, value, newline);
      if (!twin) report(decl, 'missing', `${decl.prop}: missing twin`);
      else {
        const missing = unavailable(twinDecl(twin), available);
        if (missing.length) report(twin, 'stale', `${decl.prop}: unavailable @2x URL(s): ${missing.join(', ')}`);
        if (twin.params !== HIRES_MEDIA) report(twin, 'stale', `${decl.prop}: media must be ${HIRES_MEDIA}`);
        if (rawValue(twinDecl(twin)) !== rawValue(expected.first) || !!twinDecl(twin).important !== !!decl.important)
          report(twin, 'stale', `${decl.prop}: twin value differs from the 1x replacement`);
        if (twin.toString() !== expected.toString() || twin.raws.before !== expected.raws.before || anchor.next() !== twin)
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
      container.insertAfter(anchor, expected);
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
  const mismatchedFamilies = new Set(manifest.assets.filter((asset) => asset.family && lock.assets[outputPath(asset)] &&
    !familyMembershipMatches(lock.assets[outputPath(asset)], asset)).map((asset) => asset.family));
  for (const family of [...mismatchedFamilies].sort()) issues.push({ kind: 'family',
    message: `${family}: manifest family membership differs from locked membership; using 1x for every member; regenerate the complete family` });
  const states = await Promise.all(manifest.assets.map(async (asset) => {
    const output = outputPath({ src: asset.src, factor: 2 });
    const url = output.slice('public'.length);
    try {
      if (!(await stat(resolve(root, output))).isFile()) return { asset, url, valid: false };
    } catch (error) { if (error.code === 'ENOENT') return { asset, url, valid: false }; throw error; }
    // A missing sibling is normal; an existing one must prove its provenance,
    // even when its group is incomplete or no CSS declaration uses it yet.
    let valid = false;
    try {
      const bytes = await readFile(resolve(root, asset.src));
      let proof = {};
      if (processingRecipe(asset)) {
        const outputBytes = await readFile(resolve(root, output));
        proof = await outputProof(asset, bytes, outputBytes, root, manifest.assets);
      }
      valid = !mismatchedFamilies.has(asset.family) && asset.factor === 2 && lockMatches(lock.assets[output], bytes, asset, proof);
    } catch { valid = false; }
    return { asset, url, valid, issue: valid ? null : {
      kind: 'provenance', message: `${output}: stale or unlocked @2x; run bun run hires --only ${asset.src}`,
    } };
  }));
  // Group and family constraints compose: propagate a missing member through
  // every overlapping set before making any sibling available.
  const memberships = (asset) => [asset.group && `group:${asset.group}`, asset.family && `family:${asset.family}`].filter(Boolean);
  const incomplete = new Set(states.filter((s) => !s.valid).flatMap((s) => memberships(s.asset)));
  let size;
  do {
    size = incomplete.size;
    for (const { asset } of states) if (memberships(asset).some((m) => incomplete.has(m))) memberships(asset).forEach((m) => incomplete.add(m));
  } while (size !== incomplete.size);
  for (const { asset, url, valid, issue } of states) {
    if (issue) issues.push(issue);
    if (valid && !memberships(asset).some((m) => incomplete.has(m))) available.add(url);
  }
  for (const membership of [...incomplete].sort()) {
    const [kind, name] = membership.split(':');
    const missing = states.filter((s) => memberships(s.asset).includes(membership) && !s.valid).map((s) => s.asset.src);
    issues.push({ kind: 'group', severity: 'info', message: `${name}: incomplete ${kind}; using 1x for every member (unavailable: ${missing.join(', ')})` });
  }
  const files = await Promise.all((await cssFiles(resolve(root, 'src/app'))).map(async (path) => ({ path: relative(root, path), original: await readFile(path, 'utf8') })));
  const borders = borderSources(files.map((f) => f.original));
  const results = files.map((f) => ({ ...f, ...transformCss(f.original, available, borders) }));
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
  const unresolved = results.map((r) => ({ ...r, issues: r.issues.filter((i) => ['query', 'provenance', 'family', 'group', 'border'].includes(i.kind)) }));
  diagnostics(unresolved, true).forEach((message) => log(message));
  return diagnostics(unresolved).length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message); process.exitCode = 1; });
}
