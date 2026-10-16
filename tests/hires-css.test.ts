import { describe, expect, test } from "bun:test";
import { checkRepo, diagnostics, HIRES_MEDIA, main, transformCss } from "../scripts/hires/css.mjs";
import { layerBitmap, layerTextureWidth } from "../src/components/rack/scene3d/layer-bitmap";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { lockEntry, outputPath, writeLockEntry } from "../scripts/hires/lock.mjs";
import { validateManifest } from "../scripts/hires/manifest.mjs";

const available = new Set(["/kit/a@2x.webp", "/kit/b@2x.webp"]);
const media = "(min-resolution: 1.5dppx), (min-width: 2200px)";
const twin = (prop: string, value: string) => `@media ${media} { ${prop}: ${value}; }`;

describe("hires CSS reconciliation", () => {
  test("writes exactly one adjacent twin, preserving comments and later overrides; a second write is a no-op", () => {
    expect(HIRES_MEDIA).toBe(media);
    const input = `/* art */\n.a {\n  --sky: url(/kit/a.webp); /* keep */\n  --sky: none;\n}\n`;
    const expected = `/* art */\n.a {\n  --sky: url(/kit/a.webp); /* keep */\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n  --sky: none;\n}\n`;
    const written = transformCss(input, available);
    expect(written.css).toBe(expected);
    expect(written.issues.map((i: { kind: string }) => i.kind)).toEqual(["missing"]);
    expect(transformCss(expected, available)).toEqual({ css: expected, issues: [] });
  });

  test("keeps trailing block comments on the source declaration and leaves uncommented declarations intact", () => {
    for (const newline of ["\n", "\r\n"]) {
      for (const comment of ["", " /* painted moon */", " /* first */ /* second */", " /* multi\n     line */"]) {
        const input = `.a {\n  --sky: url(/kit/a.webp);${comment}\n  color: red;\n}\n`.replaceAll("\n", newline);
        const expected = `.a {\n  --sky: url(/kit/a.webp);${comment}\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n  color: red;\n}\n`.replaceAll("\n", newline);
        const written = transformCss(input, available);
        expect(written.css).toBe(expected);
        expect(written.issues.map((i: { kind: string }) => i.kind)).toEqual(["missing"]);
        expect(transformCss(written.css, available)).toEqual({ css: expected, issues: [] });
      }
    }
  });

  test("replaces quoted and unquoted URLs in a multi-URL value, only where an @2x file is available", () => {
    const value = `image-set(URL('/kit/a.webp') 1x, url( "/kit/b.webp" ) 2x), url(/kit/missing.webp), url(/else/a.webp)`;
    const expectedValue = `image-set(URL('/kit/a@2x.webp') 1x, url( "/kit/b@2x.webp" ) 2x), url(/kit/missing.webp), url(/else/a.webp)`;
    const input = `.a {\n\tbackground: ${value} !important;\n}`;
    expect(transformCss(input, available).css).toBe(`.a {\n\tbackground: ${value} !important;\n\t${twin("background", expectedValue + " !important")}\n}`);
  });

  test("updates an old URL and old media without duplicating the twin", () => {
    const input = `.a {\n  --sky: url(/kit/a.webp);\n  @media (min-resolution: 2dppx) { --sky: url('/kit/old@2x.webp'); }\n}`;
    const { css, issues } = transformCss(input, available);
    expect(css).toBe(`.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`);
    expect(issues.map((i: { message: string }) => i.message).join("\n")).toMatch(/unavailable.*old@2x.webp/);
    expect(issues.map((i: { message: string }) => i.message).join("\n")).toMatch(/media must be/);
    expect(transformCss(css, available).issues).toEqual([]);
  });

  test("repairs a reverted twin while preserving standalone authored 1x policy queries", () => {
    const input = `.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/b.webp)")}\n}`;
    expect(transformCss(input, available).css).toBe(`.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`);
    const authored = `.a {\n  @media ${media} {\n    --sky: url(/kit/a.webp);\n  }\n}`;
    const expected = `.a {\n  @media ${media} {\n    --sky: url(/kit/a.webp);\n    ${twin("--sky", "url(/kit/a@2x.webp)")}\n  }\n}`;
    expect(transformCss(authored, available).css).toBe(expected);
    expect(transformCss(expected, available).issues).toEqual([]);
  });

  test("removes orphan twins after a deleted, renamed, or changed base declaration", () => {
    for (const base of ["", "  color: red;\n", "  --sky: none;\n"]) {
      const input = `.a {\n${base}  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`;
      const result = transformCss(input, available);
      expect(result.css).toBe(`.a {${base ? "\n" + base.trimEnd() : ""}\n}`);
      expect(result.issues.some((i: { kind: string }) => i.kind === "orphan")).toBe(true);
    }
  });

  test("removes twins for a missing file and duplicates, and repairs a changed property", () => {
    const existing = `.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`;
    expect(transformCss(existing, new Set()).css).toBe(".a {\n  --sky: url(/kit/a.webp);\n}");
    const duplicate = existing.replace("\n}", `\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`);
    expect(transformCss(duplicate, available).css).toBe(existing);
    const renamed = existing.replace("--sky: url(/kit/a.webp)", "--near: url(/kit/a.webp)");
    const result = transformCss(renamed, available);
    expect(result.css).toBe(existing.replaceAll("--sky", "--near"));
    expect(transformCss(result.css, available).issues).toEqual([]);
  });

  test("nests twins inside media queries and nested selectors at every reference", () => {
    const input = `@media (max-width: 720px) {\n  .a {\n    --sky: url(/kit/a.webp);\n    & .b {\n      --sky: url(/kit/a.webp);\n    }\n  }\n}`;
    const expected = `@media (max-width: 720px) {\n  .a {\n    --sky: url(/kit/a.webp);\n    ${twin("--sky", "url(/kit/a@2x.webp)")}\n    & .b {\n      --sky: url(/kit/a.webp);\n      ${twin("--sky", "url(/kit/a@2x.webp)")}\n    }\n  }\n}`;
    expect(transformCss(input, available).css).toBe(expected);
    expect(transformCss(expected, available).issues).toEqual([]);
  });

  test("reports query-string URLs and leaves their whole declarations untouched", () => {
    for (const value of ["url('/kit/a.webp?v=2')", "url(/kit/a.webp), url(/kit/b.webp?version=1)"]) {
      const input = `.a { --sky: ${value}; }`;
      const result = transformCss(input, available);
      expect(result.css).toBe(input);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({ kind: "query", line: 1, column: 6 });
    }
  });

  test("round-trips unrelated CSS byte-identically, including CRLF, comments and apparent URLs inside strings", () => {
    const input = `/* url(/kit/a.webp) */\r\n.a{ content: 'url(/kit/a.webp)'; --x: url(/kit/unlisted.webp) /* art */; }\r\n@media (width < 30em){.b { color : red!important }}\r\n@media ${media} { color: red; }\r\n.b { @media ${media} { color: blue; } }\r\n`;
    expect(transformCss(input, available)).toEqual({ css: input, issues: [] });
    const crlf = ".a {\r\n\t--sky: url(/kit/a.webp);\r\n}\r\n";
    const expected = `.a {\r\n\t--sky: url(/kit/a.webp);\r\n\t${twin("--sky", "url(/kit/a@2x.webp)")}\r\n}\r\n`;
    expect(transformCss(crlf, available).css).toBe(expected);
    expect(transformCss(expected, available).issues).toEqual([]);
  });

  test("moves a separated twin to immediately after its declaration, keeping intervening comments", () => {
    const input = `.a {\n  --sky: url(/kit/a.webp);\n  /* art note */\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n}`;
    expect(transformCss(input, available).css).toBe(`.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp)")}\n  /* art note */\n}`);
  });

  test("repairs twins containing comments and keeps unrelated declaration semicolons as authored", () => {
    const input = `.a {\n  --sky: url(/kit/a.webp);\n  @media (min-resolution: 2dppx) { /* art */ --sky: url(/kit/a@2x.webp); }\n  color: red\n}`;
    const result = transformCss(input, available);
    expect(result.css).toBe(`.a {\n  --sky: url(/kit/a.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp)")} /* art */\n  color: red\n}`);
    expect(transformCss(result.css, available)).toEqual({ css: result.css, issues: [] });
  });

  test("keeps URL fragments, folds a multiline value into one line, and preserves a BOM", () => {
    const input = `\uFEFF.a {\n  --sky: url(/kit/a.webp#art),\n    url(/kit/b.webp);\n}`;
    const expected = `\uFEFF.a {\n  --sky: url(/kit/a.webp#art),\n    url(/kit/b.webp);\n  ${twin("--sky", "url(/kit/a@2x.webp#art), url(/kit/b@2x.webp)")}\n}`;
    expect(transformCss(input, available).css).toBe(expected);
    expect(transformCss(expected, available).issues).toEqual([]);
    expect(transformCss("\uFEFF.a{}", available)).toEqual({ css: "\uFEFF.a{}", issues: [] });
  });

  test("preserves comments inside declaration values and handles a missing final semicolon", () => {
    const input = ".a {\n  --sky: url(/kit/a.webp) /* paper */\n}";
    const result = transformCss(input, available);
    expect(result.css).toBe(`.a {\n  --sky: url(/kit/a.webp) /* paper */;\n  ${twin("--sky", "url(/kit/a@2x.webp) /* paper */")}\n}`);
    expect(transformCss(result.css, available).issues).toEqual([]);
  });

  test("empty input is unchanged, malformed CSS and conflicting modes fail clearly", async () => {
    expect(transformCss("", available)).toEqual({ css: "", issues: [] });
    expect(() => transformCss(".a {", available)).toThrow(/Unclosed block/);
    await expect(main(["--check", "--write"])).rejects.toThrow(/Choose either/);
    await expect(main(["--surprise"])).rejects.toThrow(/Unknown option/);
  });

  test("repo CSS has current twins for every available manifest asset", async () => {
    const messages = diagnostics(await checkRepo());
    expect(messages, `Run node scripts/hires/css.mjs --write after upscales finish:\n${messages.join("\n")}`).toEqual([]);
  });
});

describe("hires provenance and whole groups", () => {
  test("withholds partial groups, ships complete groups, and rejects every stale or unlocked sibling", async () => {
    const root = await mkdtemp(join(tmpdir(), 'hires-css-'));
    try {
      await Promise.all(['art', 'src/app', 'public/kit'].map((dir) => mkdir(join(root, dir), { recursive: true })));
      const manifest = { version: 1, defaults: {}, assets: [
        { src: 'public/kit/a.webp', group: 'paper/day' },
        { src: 'public/kit/b.webp', group: 'paper/day' },
        { src: 'public/kit/c.webp' },
      ] };
      const { assets } = validateManifest(manifest);
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
      const cssPath = join(root, 'src/app/kit.css');
      const original = `.a {\n  --a: url(/kit/a.webp);\n  --b: url(/kit/b.webp);\n  --c: url(/kit/c.webp);\n}\n`;
      await writeFile(cssPath, original);
      const source = Buffer.from('source image bytes');
      const key = 'a'.repeat(64);
      for (const asset of assets) await writeFile(join(root, asset.src), source);
      const publish = async (asset: typeof assets[number]) => {
        await writeFile(join(root, outputPath(asset)), 'shipped image bytes');
        await writeLockEntry(root, asset, lockEntry(source, asset, key));
      };
      // c is independent of the paper finish, and a alone must stay at 1x.
      await publish(assets[0]);
      await publish(assets[2]);
      const messages: string[] = [];
      expect(await main(['--write'], { root, log: (s: string) => messages.push(s) })).toBe(0);
      expect(await readFile(cssPath, 'utf8')).toBe(transformCss(original, new Set(['/kit/c@2x.webp'])).css);
      expect(await main(['--check'], { root, log: (s: string) => messages.push(s) })).toBe(0);
      expect(messages.join('\n')).toMatch(/info: group: paper\/day: incomplete group/);
      expect(diagnostics(await checkRepo(root))).toEqual([]);

      await publish(assets[1]);
      expect(await main(['--write'], { root, log: () => {} })).toBe(0);
      expect(await readFile(cssPath, 'utf8')).toBe(transformCss(original, new Set(['/kit/a@2x.webp', '/kit/b@2x.webp', '/kit/c@2x.webp'])).css);
      expect(await main(['--check'], { root, log: () => {} })).toBe(0);

      // Rebuilding a's 1x invalidates it. b's missing lock must also be named,
      // even after the twins are removed and the group falls back to 1x.
      await writeFile(join(root, assets[0].src), 'rebuilt source image bytes');
      const lockPath = join(root, 'art/hires.lock.json');
      const lock = JSON.parse(await readFile(lockPath, 'utf8'));
      delete lock.assets[outputPath(assets[1])];
      await writeFile(lockPath, JSON.stringify(lock));
      expect(await main(['--write'], { root, log: () => {} })).toBe(1);
      expect(await readFile(cssPath, 'utf8')).toBe(transformCss(original, new Set(['/kit/c@2x.webp'])).css);
      const errors = diagnostics(await checkRepo(root));
      expect(errors).toHaveLength(2);
      for (const name of ['a', 'b']) expect(errors.join('\n')).toContain(`public/kit/${name}@2x.webp: stale or unlocked @2x; run bun run hires --only public/kit/${name}.webp`);
      expect(await main(['--check'], { root, log: () => {} })).toBe(1);

      // A changed factor/model or malformed key cannot bless old art either.
      for (const change of [{ factor: 3 }, { model: 'other-model' }, { cacheKey: 'bad-key' }]) {
        await writeLockEntry(root, assets[2], { ...lockEntry(source, assets[2], key), ...change });
        expect(diagnostics(await checkRepo(root)).join('\n')).toContain('public/kit/c@2x.webp: stale or unlocked');
      }
      await writeLockEntry(root, assets[2], lockEntry(source, assets[2], key));
      await writeFile(join(root, 'art/hires.json'), JSON.stringify({ ...manifest, assets: [...manifest.assets.slice(0, 2), { ...manifest.assets[2], factor: 3 }] }));
      expect(diagnostics(await checkRepo(root)).join('\n')).toContain('public/kit/c@2x.webp: stale or unlocked');
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
      await rm(lockPath);
      expect(diagnostics(await checkRepo(root)).filter((s: string) => s.includes('stale or unlocked'))).toHaveLength(3);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});

describe("diorama layer bitmap sizes", () => {
  test("sizes to the drawing buffer between the phone/desktop floor and the 2x ceiling", () => {
    expect([0, 900, 1500, 2600, 3840, 8000].map((width) => layerTextureWidth(width, true))).toEqual([1280, 1280, 1920, 3200, 3840, 3840]);
    expect([0, 900, 1500, 2600, 3840, 8000].map((width) => layerTextureWidth(width, false))).toEqual([1920, 1920, 1920, 3200, 3840, 3840]);
    expect([1919, 1920, 1921, 2559, 2560, 2561].map((width) => layerTextureWidth(width, false))).toEqual([1920, 1920, 2560, 2560, 2560, 3200]);
  });

  const image = (width: number, height: number, close: () => void) => ({ width, height, close }) as ImageBitmap;
  test("decodes at natural size and returns small/equal sources without resizing up", async () => {
    for (const width of [640, 1920]) {
      let closed = false;
      const img = image(width, width / 2, () => { closed = true; });
      const inputs: unknown[] = [];
      const decode = (async (input: ImageBitmapSource, options?: ImageBitmapOptions) => {
        inputs.push({ input, options });
        return img;
      }) as typeof createImageBitmap;
      const blob = new Blob();
      expect(await layerBitmap(blob, 1920, decode)).toBe(img);
      expect(inputs).toEqual([{ input: blob, options: { imageOrientation: "flipY", premultiplyAlpha: "premultiply" } }]);
      expect(closed).toBe(false);
    }
  });

  test("resizes from the decoded bitmap, preserving its flip and aspect, and releases the intermediate", async () => {
    let closed = false;
    const natural = image(3840, 2160, () => { closed = true; });
    const resized = image(2560, 1440, () => {});
    const inputs: unknown[] = [];
    const decode = (async (input: ImageBitmapSource, options?: ImageBitmapOptions) => {
      inputs.push({ input, options });
      return input instanceof Blob ? natural : resized;
    }) as typeof createImageBitmap;
    expect(await layerBitmap(new Blob(), 2560, decode)).toBe(resized);
    // no second flip: the resize must not ask for one
    expect(inputs[1]).toEqual({ input: natural, options: { premultiplyAlpha: "premultiply", resizeWidth: 2560, resizeQuality: "high" } });
    expect(closed).toBe(true);
  });

  test("releases the decoded bitmap if resizing fails, and propagates decode errors", async () => {
    let closed = false;
    const img = image(3840, 2160, () => { closed = true; });
    const decode = (async (input: ImageBitmapSource) => {
      if (input instanceof Blob) return img;
      throw new Error("resize failed");
    }) as typeof createImageBitmap;
    await expect(layerBitmap(new Blob(), 1920, decode)).rejects.toThrow("resize failed");
    expect(closed).toBe(true);
    await expect(layerBitmap(new Blob(), 1920, (async () => { throw new Error("decode failed"); }) as typeof createImageBitmap)).rejects.toThrow("decode failed");
  });
});
