import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer, type MarkdownRootProps } from "../src/components/notebook/MarkdownRenderer";
import { interpolateContent } from "../src/lib/content-template";
import { editSource } from "../src/lib/studio/source-edits";
import type { SourceRange } from "../src/lib/studio/segments";

const blocks = (source: string, fields?: Record<string, string | number>) => {
  const ranges: SourceRange[] = [];
  const Root = ({ node, children }: MarkdownRootProps) => {
    if (node?.data?.studioRange) ranges.push(node.data.studioRange);
    return createElement(node?.data?.studioRootTag ?? "p", null, children);
  };
  const html = renderToStaticMarkup(<MarkdownRenderer text={fields ? interpolateContent(source, fields) : source}
    sourceValue={source} sourceFields={fields} rootComponent={Root} />);
  return { ranges, html, values: ranges.map(range => source.slice(range.start, range.end)) };
};

describe("native source fields", () => {
  test("keeps each paragraph independent while retaining all source syntax", () => {
    const source = "First [project](/about).\n\nSecond **paragraph** with `code`.";
    expect(blocks(source).values).toEqual(["First [project](/about).", "Second **paragraph** with `code`."]);
    expect(blocks(source).html).toContain('<a href="/about">project</a>');
  });
  test("maps whole interpolated blocks back to their authored placeholders", () => {
    const source = "Before {{version}}.\n\nAfter {{count}} runs.";
    expect(blocks(source, { version: "a much longer v1.2.3", count: 12 }).values)
      .toEqual(["Before {{version}}.", "After {{count}} runs."]);
  });
  test("exposes source for headings, lists, directives and code without normalizing it", () => {
    const values = ['## Heading', '- one\n- **two**', ':os[Ctrl+P] and :span[soft]{class=soft}', '```js\nconst x = 1;\n```'];
    expect(blocks(values.join("\n\n")).values).toEqual(values);
  });
  test("retains exact CRLF offsets and offers an empty field for blank content", () => {
    expect(blocks("First.\r\n\r\nSecond.").values).toEqual(["First.", "Second."]);
    expect(blocks("").values).toEqual([""]);
    expect(blocks("  \n").values).toEqual(["  \n"]);
  });
  test("clearing and retyping a field never changes the neighbouring source", () => {
    const source = "First.\n\nSecond **paragraph**.";
    const { ranges } = blocks(source);
    const edits = [{ ...ranges[0], value: "" }, { ...ranges[1], value: "Second **paragraph**, edited." }];
    expect(editSource(source, edits)).toBe("\n\nSecond **paragraph**, edited.");
    expect(editSource(source, [{ ...ranges[0], value: "One\n\n\nLast" }])).toBe("One\n\n\nLast\n\nSecond **paragraph**.");
  });
  test("applies edits in source order and rejects overlapping ranges", () => {
    const source = "First.\n\nSecond.";
    const edits = [{ start: 8, end: 15, value: "Next." }, { start: 0, end: 6, value: "A longer first." }];
    expect(editSource(source, edits)).toBe("A longer first.\n\nNext.");
    expect(source).toBe("First.\n\nSecond.");
    expect(() => editSource(source, [{ start: 0, end: 9, value: "" }, { start: 8, end: 15, value: "" }])).toThrow(RangeError);
    expect(() => editSource(source, [{ start: 0, end: 99, value: "" }])).toThrow(RangeError);
  });
});
