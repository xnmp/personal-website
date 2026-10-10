import { test, expect, describe } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { FEATURED, FLAGSHIP, project, projects } from "../src/data/projects";
import { about } from "../src/data/about";
import { drawnBounds } from "../src/lib/drawn-bounds";
import recorded from "../src/data/screen-bounds.json";

// Adding a project is an entry in src/data/projects.ts, its page under
// src/app/(rack)/p/<slug>/ and its 1-bit art in public/screens/ (then
// `bun run screens:bounds`). These keep those in step, so a project added
// or removed fails here with its name rather than as a broken page.

describe("the project list", () => {
  test("every project has its own page and its art", () => {
    for (const p of projects) {
      expect(existsSync(`src/app/(rack)/p/${p.slug}/page.tsx`), `${p.slug}: no page`).toBe(true);
      expect(existsSync(`public${p.art}`), `${p.slug}: no art at public${p.art}`).toBe(true);
    }
  });

  test("every project has a glyph of one character", () => {
    for (const p of projects) expect([...p.glyph], p.slug).toHaveLength(1);
  });

  test("the first screen's flagship and row are projects in the list, each once", () => {
    expect(() => project(FLAGSHIP)).not.toThrow();
    for (const slug of FEATURED) expect(() => project(slug), slug).not.toThrow();
    expect(new Set(FEATURED).size, "a featured project twice").toBe(FEATURED.length);
    expect(FEATURED, "the flagship is not on the row too").not.toContain(FLAGSHIP);
  });

  test("a stale slug fails by name", () => {
    expect(() => project("no-such-project")).toThrow(/no-such-project/);
  });

  test("the about page links only projects that exist", () => {
    const links = [...JSON.stringify(about).matchAll(/\]\((\/p\/[^)#]+)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) expect(projects.some((p) => p.href === href), href).toBe(true);
  });
});

describe("screen art bounds (src/data/screen-bounds.json)", () => {
  test("are recorded for every screen art as it is now (else: bun run screens:bounds)", async () => {
    const table = recorded as Record<string, unknown>;
    for (const name of readdirSync("public/screens").filter((n) => n.endsWith(".png"))) {
      const { data, info } = await sharp(`public/screens/${name}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(table[`/screens/${name}`], name).toEqual(drawnBounds(data, info.width, info.height, info.channels)!);
    }
  });
});
