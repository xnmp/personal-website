import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer, type MarkdownRootProps } from "../src/components/notebook/MarkdownRenderer";
import { interpolateContent } from "../src/lib/content-template";
import { applyTextPatches, type TextPatch } from "../src/lib/studio/patches";

type Leaf = NonNullable<NonNullable<MarkdownRootProps["node"]>["data"]>["studioText"];
const editable = (source: string, fields?: Record<string, string | number>) => {
  const leaves: NonNullable<Leaf>[] = [];
  const text = fields ? interpolateContent(source, fields) : source;
  const Root = ({ node, children }: MarkdownRootProps) => createElement(node?.data?.studioRootTag ?? "p", null, children);
  const Text = ({ node, children }: MarkdownRootProps) => { leaves.push(node!.data!.studioText!); return <span>{children}</span>; };
  const html = renderToStaticMarkup(<MarkdownRenderer text={text} sourceValue={source} sourceFields={fields} rootComponent={Root} textComponent={Text} />);
  const replace = (values: string[]) => applyTextPatches(source, leaves.map((leaf, index): TextPatch => ({ start: leaf.start, end: leaf.end, value: values[index], containers: leaf.containers })));
  return { leaves, html, replace };
};

describe("rendered Markdown editing", () => {
  test("keeps paragraphs separate and preserves formatted descendants", () => {
    const source = "First [project](/about).\n\nSecond **paragraph** with `code`.";
    const { leaves, html } = editable(source);
    expect(html).toContain('<a href="/about"><span>project</span></a>');
    expect(html).toContain('<strong><span>paragraph</span></strong>');
    expect(html).toContain('<code><span>code</span></code>');
    expect(leaves.map(leaf => source.slice(leaf.start, leaf.end))).toEqual(["First ", "project", ".", "Second ", "paragraph", " with ", "`code`", "."]);
    expect(leaves.map(leaf => leaf.root)).toEqual([0, 0, 0, 1, 1, 1, 1, 1]);
  });
  test("keeps prose around interpolations editable and preserves the field source", () => {
    const source = "Before &amp; {{version}} after {{count}} runs.";
    const { leaves, html, replace } = editable(source, { version: "v0.18", count: 12 });
    expect(html).toBe('<p><span>Before &amp; </span>v0.18<span> after </span>12<span> runs.</span></p>');
    expect(leaves.map(leaf => source.slice(leaf.start, leaf.end))).toEqual(["Before &amp; ", " after ", " runs."]);
    expect(replace(["Try ", " for ", " days."])).toBe("Try {{version}} for {{count}} days.");
  });
  test("preserves repeated and empty field atoms while editing surrounding text", () => {
    const source = "{{empty}}Before {{same}} between {{same}} after.{{empty}}";
    const { leaves, replace } = editable(source, { empty: "", same: "🌱" });
    expect(leaves.map(leaf => source.slice(leaf.start, leaf.end))).toEqual(["Before ", " between ", " after."]);
    expect(replace(["Start ", " and ", " end."])).toBe("{{empty}}Start {{same}} and {{same}} end.{{empty}}");
  });
  test("edits authored directive labels while retaining their attributes", () => {
    const source = ':span[Soft text]{class=soft} and :link[project]{href=/about}.';
    const { leaves, replace } = editable(source);
    expect(leaves.map(leaf => source.slice(leaf.start, leaf.end))).toEqual(["Soft text", " and ", "project", "."]);
    expect(replace(["Quiet text", " and ", "page", "."])).toBe(':span[Quiet text]{class=soft} and :link[page]{href=/about}.');
  });
  test("deleting all leaves removes empty nested formatting and directives", () => {
    for (const source of ['**hello [world](/about)**', ':span[text]{class=soft}', '*emphasis*']) {
      const { leaves, replace } = editable(source);
      expect(replace(leaves.map(() => ""))).toBe("");
    }
  });
  test("code-owned atoms stay intact without introducing a destructive blank editor", () => {
    const { leaves, html } = editable(':os[Ctrl+P]');
    expect(leaves).toHaveLength(0);
    expect(html).toContain('Ctrl');
    expect(html).not.toContain('Empty text');
  });
});
