import { describe, expect, test } from "bun:test";
import { EXTRA_PALETTES } from "../scripts/theme-palettes.mjs";
import { RICES, riceMode } from "../src/lib/rice";

const luminance = (hex: string) => {
  const channels = hex.slice(1).match(/../g)!.map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels.reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
};
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe("additional colour themes", () => {
  test("the registry has unique IDs and an explicit finish for each choice", () => {
    expect(new Set(RICES).size).toBe(RICES.length);
    for (const rice of RICES) expect(["light", "dark"]).toContain(riceMode(rice));
    expect(riceMode("catppuccin-latte")).toBe("light");
  });
  for (const [id, palette] of Object.entries(EXTRA_PALETTES)) {
    test(`${id} keeps normal, secondary and accent text readable on both surfaces`, () => {
      expect(RICES).toContain(id);
      for (const text of ["--ink", "--ink-soft", "--rice-accent", "--rust", "--amber", "--cyan", "--olive"]) {
        for (const bg of ["--paper", "--paper-warm"]) {
          expect(contrast(palette[text as keyof typeof palette], palette[bg as keyof typeof palette]), `${id}: ${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});
