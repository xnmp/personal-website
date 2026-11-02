import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { abelChapters } from "../src/lib/abel-notes";
import { parseContent, contentBlock } from "../src/lib/content";
import MathMarkdownRenderer from "../src/components/notebook/MathMarkdownRenderer";

describe("worked maths notes", () => {
  test("every published chapter has a unique navigable ID, readable body and typeset equations", () => {
    const document = parseContent(readFileSync("content/abel-ruffini-notes.md", "utf8"));
    for (const chapter of abelChapters(document)) {
      const html = renderToStaticMarkup(<MathMarkdownRenderer text={contentBlock(document, chapter.id)} />);
      expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("$$");
    }
  });

  test("malformed, duplicate or missing chapter destinations fail before publication", () => {
    const document = parseContent('---\nchapters:\n  - id: first\n    title: First\n    summary: A note\n---\n<!-- block: first -->\nBody.');
    const first = { id: "first", title: "First", summary: "A note" };
    expect(abelChapters(document).map(chapter => chapter.id)).toEqual(["first"]);
    for (const chapters of [null, [], [{}], [{ id: "../private", title: "T", summary: "S" }],
      [{ id: "missing", title: "T", summary: "S" }], [first, first]]) {
      expect(() => abelChapters({ ...document, data: { ...document.data, chapters } })).toThrow();
    }
  });

  test("inline maths preserves accessible notation without block markup or nested links", () => {
    const html = renderToStaticMarkup(<a href="/original"><MathMarkdownRenderer text={"## **A root**\n\n$x^2$ and [a note](/p/abel-ruffini)"} inline allowLinks={false} /></a>);
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/<(?:h[1-6]|p|ul|li)\b/);
  });
});
