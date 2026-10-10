import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import sharp from "sharp";
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
      // kit.css registers a plate to the stage, its core the mock's 1672 x
      // 941 and its bleed as declared; a sky painted to another shape would
      // slide off the page it was painted for. A painted sky must also bleed
      // far enough to register from a 4:3 frame to a 21:9 one (a flat one
      // has nothing to register).
      if (s.scene === "plate")
        test("its plate is painted to the bleed it declares, far enough for 4:3 to 21:9", async () => {
          const bleed = (k: string) => Number(sNight.get(k) ?? 0);
          const [bx, bb] = [bleed("--sky-bleed-x"), bleed("--sky-bleed-bottom")];
          for (const finish of [sNight, sDay]) {
            const sky = (finish.get("--k-sky") ?? sNight.get("--k-sky"))?.match(/url\(([^)]+)\)/)?.[1];
            expect(sky).toBeDefined();
            const img = sharp(`public${sky}`);
            const { width, height } = await img.metadata();
            expect(width! / height!).toBeCloseTo((1672 + 2 * bx) / (941 + bb), 2);
            const flat = (await img.stats()).channels.every((c) => c.stdev < 2);
            if (!flat) {
              expect(bb).toBeGreaterThanOrEqual(313); // a 4:3 frame's foot
              expect(bx).toBeGreaterThanOrEqual(279); // a 21:9 frame's sides
            }
          }
        });
    });
  }
});

// The build's CSS minifier writes the shorthand `border-image: none` as an
// empty declaration (`border-image: ;`), which the browser drops, so the
// reset never happens and a kit's border image shows through. The longhand
// `border-image-source: none` survives and takes the image away.
describe("every stylesheet survives the build's minifier", () => {
  const sheets = ["src/app/kit.css", "src/app/globals.css", ...readdirSync("src/app/styles").filter((f) => f.endsWith(".css")).map((f) => `src/app/styles/${f}`)];
  for (const sheet of sheets)
    test(`${sheet} resets a border image by its source, not the shorthand`, () => {
      const css = readFileSync(sheet, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(css.match(/border-image\s*:\s*none\b[^;]*;?/g) ?? []).toEqual([]);
    });
});
