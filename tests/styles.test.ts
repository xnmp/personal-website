import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { DEFAULT_STYLE, STYLES, isStyle, styleName, styleOr } from "../src/lib/styles";

describe("style registry", () => {
  test("ids are unique and the default is one of them", () => {
    const ids = STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(isStyle(DEFAULT_STYLE)).toBe(true);
  });
  test("an unknown, empty or non-string stored value falls back to the default", () => {
    for (const v of [null, undefined, "", "PAPER", "retired-style", 42, {}, "x".repeat(10_000)]) {
      expect(styleOr(v)).toBe(DEFAULT_STYLE);
    }
  });
  test("every listed style reads back as itself", () => {
    for (const s of STYLES) expect(styleOr(s.id)).toBe(s.id);
  });
  test("names are what people read, and an unknown id is shown as given", () => {
    expect(styleName("paper")).toBe("Paper Diorama");
    expect(styleName("nope")).toBe("nope");
  });
});

/** The custom properties declared in the first block opened by `selector`. */
function block(css: string, selector: string): Map<string, string> {
  const at = css.indexOf(`${selector} {`);
  if (at < 0) return new Map();
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("\n}", at));
  return new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const kit = readFileSync("src/app/kit.css", "utf8");
// Geometry is shared: every kit is built to the same source sizes
// (scripts/build-kit.mjs), so a style never re-slices (it may print its
// sheets or mounts at another scale, --plate-k / --mat-k, from the default).
const SHARED = new Set(["--slice-plate", "--plate-k", "--plate-w", "--slice-key", "--key-k", "--key-w", "--mat-k", "--bezel-w", "--rack-gap"]);
const night = [...block(kit, ":root").keys()].filter((k) => !SHARED.has(k));
const day = [...block(kit, ':root[data-rice="paper"]').keys()];

describe("every style is a complete kit", () => {
  test("the Paper Diorama's own token blocks were found", () => {
    expect(night.length).toBeGreaterThan(30);
    expect(day.length).toBeGreaterThan(30);
  });

  for (const s of STYLES.filter((s) => s.id !== "paper")) {
    const file = `src/app/styles/${s.id}.css`;
    describe(s.name, () => {
      const css = existsSync(file) ? readFileSync(file, "utf8") : "";
      const sNight = block(css, `:root[data-style="${s.id}"]`);
      const sDay = block(css, `:root[data-style="${s.id}"][data-rice="paper"]`);

      test("its night finish sets every token the kit reads", () => {
        expect(night.filter((k) => !sNight.has(k))).toEqual([]);
      });
      test("its day finish sets every token the day finish changes", () => {
        expect(day.filter((k) => !sDay.has(k))).toEqual([]);
      });
      test("it never shows another style's art", () => {
        for (const [k, v] of [...sNight, ...sDay]) {
          const m = v.match(/url\(([^)]+)\)/);
          if (m && k !== "--k-glass") expect(m[1].startsWith(`/kit/${s.id}/`)).toBe(true);
        }
      });
      test("every bitmap it names exists", () => {
        for (const v of [...sNight.values(), ...sDay.values()]) {
          const m = v.match(/url\(([^)]+)\)/);
          if (m) expect(existsSync(`public${m[1]}`)).toBe(true);
        }
      });
    });
  }
});
