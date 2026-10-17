import { describe, expect, test } from "bun:test";
import { interpolateContent } from "../src/lib/content-template";
import {
  interpolationRanges,
  replaceSourceRange,
  sourceRange,
  type SourceRange,
} from "../src/lib/studio/segments";

const rangeOf = (source: string, text: string, from = 0): SourceRange => {
  const start = source.indexOf(text, from);
  if (start < 0) throw new Error("Invalid fixture range");
  return { start, end: start + text.length };
};

describe("rendered paragraph source ranges", () => {
  test("edits either paragraph while preserving the exact sibling and surrounding whitespace", () => {
    const source =
      "  First **paragraph**.\n\n\nSecond [paragraph](/about).  \n";
    const first = rangeOf(source, "First **paragraph**.");
    const second = rangeOf(source, "Second [paragraph](/about).");
    expect(
      replaceSourceRange(source, sourceRange(source, first), "Edited first."),
    ).toBe("  Edited first.\n\n\nSecond [paragraph](/about).  \n");
    expect(
      replaceSourceRange(source, sourceRange(source, second), "Edited second."),
    ).toBe("  First **paragraph**.\n\n\nEdited second.  \n");
    expect(sourceRange(source, first)).not.toBe(first);
  });

  test("uses positions when identical paragraphs or identical phrases repeat", () => {
    const source = "Same paragraph.\n\nSame paragraph.\n\nSame paragraph.";
    const middle = rangeOf(source, "Same paragraph.", "Same paragraph.".length);
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, middle),
        "Only the middle changes.",
      ),
    ).toBe("Same paragraph.\n\nOnly the middle changes.\n\nSame paragraph.");
  });

  test("preserves CRLF and boundary whitespace without line-ending normalization", () => {
    const source = "First paragraph.\r\n\r\nSecond paragraph.\r\n\r\n";
    const second = rangeOf(source, "Second paragraph.");
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, second),
        "New\r\nsecond paragraph.",
      ),
    ).toBe("First paragraph.\r\n\r\nNew\r\nsecond paragraph.\r\n\r\n");
  });

  test("counts UTF-16 units with emoji, combining marks and non-Latin text", () => {
    const source = "🌱 e\u0301 中文.\n\n🧑‍💻 Second paragraph.";
    const second = rangeOf(source, "🧑‍💻 Second paragraph.");
    expect(
      replaceSourceRange(source, sourceRange(source, second), "次の段落 🌿"),
    ).toBe("🌱 e\u0301 中文.\n\n次の段落 🌿");
  });

  test("does not interpret literal placeholders when fields were omitted", () => {
    const source = "Literal {{name}}.\n\nNext paragraph.";
    const next = rangeOf(source, "Next paragraph.");
    expect(sourceRange(source, next)).toEqual(next);
  });
});

describe("interpolation offset mapping", () => {
  test("exposes each atomic interpolation's raw and UTF-16 rendered offsets", () => {
    const source = "A{{name}}/{{count}}{{empty}}Z";
    const fields = Object.freeze({ name: "🌱", count: 0, empty: "" });
    expect(interpolationRanges(source, fields)).toEqual([
      { source: { start: 1, end: 9 }, rendered: { start: 1, end: 3 } },
      { source: { start: 10, end: 19 }, rendered: { start: 4, end: 5 } },
      { source: { start: 19, end: 28 }, rendered: { start: 5, end: 5 } },
    ]);
    expect(interpolationRanges("Literal {{name}}.")).toEqual([]);
    expect(interpolationRanges("No field; {{Upper}} is literal.", {})).toEqual(
      [],
    );
    expect(() => interpolationRanges("{{missing}}", {})).toThrow(
      "must be text or a number",
    );
  });

  test("maps each paragraph across several differently sized interpolations", () => {
    const source =
      "Hi {{name}}: version {{version}}.\n\n{{name}} measured {{count}} runs.\n";
    const fields = { name: "Chong", version: "v2026.10.18", count: 12 };
    const rendered = interpolateContent(source, fields);
    const first = rangeOf(rendered, "Hi Chong: version v2026.10.18.");
    const second = rangeOf(rendered, "Chong measured 12 runs.");
    expect(sourceRange(source, first, fields)).toEqual(
      rangeOf(source, "Hi {{name}}: version {{version}}."),
    );
    expect(sourceRange(source, second, fields)).toEqual(
      rangeOf(source, "{{name}} measured {{count}} runs."),
    );
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, first, fields),
        "Hello {{name}}.",
      ),
    ).toBe("Hello {{name}}.\n\n{{name}} measured {{count}} runs.\n");
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, second, fields),
        "{{name}} measured more runs.",
      ),
    ).toBe(
      "Hi {{name}}: version {{version}}.\n\n{{name}} measured more runs.\n",
    );
  });

  test("maps a whole expanded value to its original placeholder and accepts either edge", () => {
    const source = "Before {{name}} after.";
    const fields = { name: "A much longer name 🌱" };
    const rendered = interpolateContent(source, fields);
    const value = rangeOf(rendered, fields.name);
    expect(sourceRange(source, value, fields)).toEqual(
      rangeOf(source, "{{name}}"),
    );
    expect(
      sourceRange(source, { start: value.start, end: value.start }, fields),
    ).toEqual({ start: 7, end: 7 });
    expect(
      sourceRange(source, { start: value.end, end: value.end }, fields),
    ).toEqual({ start: 15, end: 15 });
    const suffix = rangeOf(rendered, " after.");
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, suffix, fields),
        " afterwards.",
      ),
    ).toBe("Before {{name}} afterwards.");
  });

  test("rejects either boundary inside an expansion, including a zero-width selection inside it", () => {
    const source = "A {{name}} Z";
    const fields = { name: "Chong 🌱" };
    for (const range of [
      { start: 3, end: 5 },
      { start: 0, end: 3 },
      { start: 3, end: 3 },
      { start: 2, end: 7 },
    ]) {
      expect(() => sourceRange(source, range, fields)).toThrow("cannot split");
    }
  });

  test("preserves repeated placeholders and identical expanded values by source position", () => {
    const source = "{{one}} is here.\n\n{{two}} is here.\n\n{{one}} is here.";
    const fields = { one: "Same", two: "Same" };
    const rendered = interpolateContent(source, fields);
    const middle = rangeOf(rendered, "Same is here.", "Same is here.".length);
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, middle, fields),
        "Changed {{two}}.",
      ),
    ).toBe("{{one}} is here.\n\nChanged {{two}}.\n\n{{one}} is here.");
  });

  test("supports numeric values and empty expansions without dropping their source references", () => {
    const source =
      "{{empty}}Count {{zero}}, {{negative}}.{{empty}}\r\n\r\n{{empty}}Next {{fraction}}.";
    const fields = { empty: "", zero: 0, negative: -12, fraction: 0.125 };
    const rendered = interpolateContent(source, fields);
    const first = rangeOf(rendered, "Count 0, -12.");
    const second = rangeOf(rendered, "Next 0.125.");
    const firstRaw = sourceRange(source, first, fields);
    const secondRaw = sourceRange(source, second, fields);
    expect(source.slice(firstRaw.start, firstRaw.end)).toBe(
      "{{empty}}Count {{zero}}, {{negative}}.{{empty}}",
    );
    expect(source.slice(secondRaw.start, secondRaw.end)).toBe(
      "{{empty}}Next {{fraction}}.",
    );
    expect(
      replaceSourceRange(source, secondRaw, "{{empty}}Updated {{fraction}}."),
    ).toBe(
      "{{empty}}Count {{zero}}, {{negative}}.{{empty}}\r\n\r\n{{empty}}Updated {{fraction}}.",
    );
  });

  test("maps completely empty and consecutive expansions as whole raw placeholders", () => {
    expect(
      sourceRange("{{empty}}", { start: 0, end: 0 }, { empty: "" }),
    ).toEqual({ start: 0, end: 9 });
    expect(
      sourceRange(
        "A{{one}}{{two}}B",
        { start: 1, end: 1 },
        { one: "", two: "" },
      ),
    ).toEqual({ start: 1, end: 15 });
    expect(sourceRange("", { start: 0, end: 0 }, {})).toEqual({
      start: 0,
      end: 0,
    });
  });

  test("uses the shared interpolation grammar and validation, including underscore/hyphen identifiers", () => {
    const source =
      "{{valid_name}} {{also-valid}} {{Upper}} {{9invalid}} {{ spaced }}";
    const fields = { valid_name: "One", "also-valid": "Two" };
    const rendered = interpolateContent(source, fields);
    expect(
      sourceRange(source, { start: 0, end: rendered.length }, fields),
    ).toEqual({ start: 0, end: source.length });
    expect(sourceRange(source, rangeOf(rendered, "{{Upper}}"), fields)).toEqual(
      rangeOf(source, "{{Upper}}"),
    );
    expect(() => sourceRange("{{missing}}", { start: 0, end: 0 }, {})).toThrow(
      'interpolation "missing" must be text or a number',
    );
    expect(() =>
      sourceRange("{{invalid}}", { start: 0, end: 0 }, {
        invalid: null,
      } as unknown as Record<string, string>),
    ).toThrow("must be text or a number");
  });

  test("keeps Unicode and CRLF offsets correct after an interpolation", () => {
    const source = "🌱 {{name}}\r\n\r\n🧑‍💻 e\u0301 中文 {{count}}.";
    const fields = { name: "Chong 🧑‍💻", count: 12 };
    const rendered = interpolateContent(source, fields);
    const second = rangeOf(rendered, "🧑‍💻 e\u0301 中文 12.");
    expect(
      replaceSourceRange(
        source,
        sourceRange(source, second, fields),
        "New 中文 {{count}}.",
      ),
    ).toBe("🌱 {{name}}\r\n\r\nNew 中文 {{count}}.");
  });
});

describe("range validation and raw replacement", () => {
  test("rejects malformed, reversed, noninteger and out-of-bounds ranges", () => {
    const invalid = [
      null,
      undefined,
      [],
      {},
      { start: 0 },
      { start: "0", end: 1 },
      { start: -1, end: 1 },
      { start: 2, end: 1 },
      { start: 0, end: 4 },
      { start: 4, end: 4 },
      { start: 0.5, end: 1 },
      { start: 0, end: 1.5 },
      { start: NaN, end: 1 },
      { start: 0, end: Infinity },
      { start: 0, end: Number.MAX_SAFE_INTEGER + 1 },
    ];
    for (const range of invalid) {
      expect(() => sourceRange("abc", range as SourceRange)).toThrow();
      expect(() => sourceRange("abc", range as SourceRange, {})).toThrow();
      expect(() =>
        replaceSourceRange("abc", range as SourceRange, "new"),
      ).toThrow();
    }
    // Validation uses the interpolated length, not the raw placeholder length.
    expect(() =>
      sourceRange("{{name}}", { start: 0, end: 8 }, { name: "A" }),
    ).toThrow("in-bounds");
  });

  test("supports insertion, deletion, empty sources and exact whole-source replacements", () => {
    expect(replaceSourceRange("ab", { start: 1, end: 1 }, "🌱")).toBe("a🌱b");
    expect(replaceSourceRange("abc", { start: 1, end: 2 }, "")).toBe("ac");
    expect(replaceSourceRange("", { start: 0, end: 0 }, "new")).toBe("new");
    expect(replaceSourceRange("old", { start: 0, end: 3 }, "new")).toBe("new");
  });
});
