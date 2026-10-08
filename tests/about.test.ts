import { describe, expect, test } from "bun:test";
import { parseInline, safeHref } from "../src/lib/inline";
import { about, publishable } from "../src/data/about";

describe("parseInline", () => {
  test("plain text is one text span", () => {
    expect(parseInline("just words")).toEqual([{ kind: "text", text: "just words" }]);
  });
  test("empty input gives no spans", () => {
    expect(parseInline("")).toEqual([]);
  });
  test("code, bold, italic and links render as their kinds, in order", () => {
    expect(parseInline("a `t` b **c** d *e* [f](/g) h")).toEqual([
      { kind: "text", text: "a " },
      { kind: "code", text: "t" },
      { kind: "text", text: " b " },
      { kind: "strong", text: "c" },
      { kind: "text", text: " d " },
      { kind: "em", text: "e" },
      { kind: "text", text: " " },
      { kind: "link", text: "f", href: "/g" },
      { kind: "text", text: " h" },
    ]);
  });
  test("markup inside code stays literal", () => {
    expect(parseInline("`**x** [y](/z)`")).toEqual([{ kind: "code", text: "**x** [y](/z)" }]);
  });
  test("an unclosed marker is kept as text, not swallowed", () => {
    expect(parseInline("2 * 3 = 6 and `open")).toEqual([{ kind: "text", text: "2 * 3 = 6 and `open" }]);
    expect(parseInline("[label](no close")).toEqual([{ kind: "text", text: "[label](no close" }]);
  });
  test("an unsafe link keeps its words and drops the target", () => {
    expect(parseInline("[click](javascript:alert(1))")).toEqual([{ kind: "text", text: "click)" }]);
    expect(parseInline("see [x](//evil.example)")).toEqual([{ kind: "text", text: "see x" }]);
  });
  test("a long line parses without losing characters", () => {
    const long = "word **bold** ".repeat(5000);
    const spans = parseInline(long);
    const rebuilt = spans.map((s) => (s.kind === "strong" ? `**${s.text}**` : s.text)).join("");
    expect(rebuilt).toBe(long);
  });
});

describe("safeHref", () => {
  test("allows the web, mail, site paths and fragments", () => {
    for (const h of ["https://x.y", "http://x.y", "mailto:a@b.c", "/p/bwai", "#top"]) expect(safeHref(h)).toBe(true);
  });
  test("refuses script, data and protocol-relative targets", () => {
    for (const h of ["javascript:alert(1)", "JAVASCRIPT:x", "data:text/html,x", "//evil.example", "vbscript:x"])
      expect(safeHref(h)).toBe(false);
  });
});

describe("about content", () => {
  test("drafts show while writing and are left out of production", () => {
    const items = [{ id: 1 }, { id: 2, draft: true }, { id: 3, draft: false }];
    expect(publishable(items, true).map((i) => i.id)).toEqual([1, 2, 3]);
    expect(publishable(items, false).map((i) => i.id)).toEqual([1, 3]);
  });
  test("the published page still has an intro, a section and facts", () => {
    expect(about.intro.length).toBeGreaterThan(0);
    expect(publishable(about.sections, false).length).toBeGreaterThan(0);
    expect(publishable(about.facts, false).length).toBeGreaterThan(0);
  });
  test("every link in the content is one a visitor can safely follow", () => {
    const strings = [
      ...about.intro,
      ...about.sections.flatMap((s) => [s.aside ?? "", ...s.body]),
      ...about.facts.map((f) => f.value),
    ];
    for (const s of strings) {
      for (const m of s.matchAll(/\]\(([^)\s]+)\)/g)) expect(safeHref(m[1])).toBe(true);
    }
  });
  test("section headings are unique (they key the sheets)", () => {
    const h = about.sections.map((s) => s.heading);
    expect(new Set(h).size).toBe(h.length);
  });
});
