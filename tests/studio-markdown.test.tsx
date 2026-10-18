import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EditableMarkdown } from "../src/components/studio/EditableMarkdown";
import { StudioContext } from "../src/components/studio/StudioContext";
import { MarkdownRenderer, type MarkdownProps } from "../src/components/notebook/MarkdownRenderer";
import type { ContentBinding } from "../src/lib/studio/bindings";

const binding: ContentBinding = { documentId: "about", slotId: "block:intro", label: "intro", revision: "a".repeat(64), value: "Original." };
const output = (source: string, editing = true, markdown: Partial<MarkdownProps> = {}, fields?: Record<string, string | number>) =>
  renderToStaticMarkup(<StudioContext.Provider value={{ editing, ready: true, locked: false, value: () => source, update: () => {} }}>
    <EditableMarkdown binding={{ ...binding, fields }} markdown={{ text: binding.value, ...markdown }} />
  </StudioContext.Provider>);

describe("whole-section native fields", () => {
  test("paragraphs, headings, lists and code share one source textarea", () => {
    const source = "First **paragraph**.\n\nSecond paragraph.\n\n## Notes\n\n- One\n- Two\n\n```js\nconst x = 1;\n```";
    const html = output(source);
    expect(html.match(/<textarea\b/g)).toHaveLength(1);
    expect(html).toContain('aria-label="intro"');
    expect(html).toContain(source);
    expect(html).not.toContain("contenteditable");
  });
  test("empty sections still have one editable native control", () => {
    for (const source of ["", "\n\n", "  \n"]) expect(output(source).match(/<textarea\b/g)).toHaveLength(1);
  });
  test("preview uses the public Markdown renderer without adding a wrapper", () => {
    const text = "## Notes\n\nA **bold** result.\n\n- One\n- Two";
    expect(output(text, false)).toBe(renderToStaticMarkup(<MarkdownRenderer text={text} />));
  });
  test("inline fields retain legal phrasing markup and the caller's typography", () => {
    expect(output("**Label**", true, { inline: true })).toMatch(/^<span[^>]*><textarea/);
    const html = output("Two\n\nparagraphs", true, { paragraphClassName: "aside-note", paragraphStyle: { fontSize: 18 } });
    expect(html).toContain('class="aside-note"');
    expect(html).toContain('style="font-size:18px"');
    expect(html.match(/<textarea\b/g)).toHaveLength(1);
  });
  test("source preserves placeholders while preview interpolates their values", () => {
    const source = "Before {{version}}.\n\nAfter {{count}} runs.";
    expect(output(source, true, {}, { version: "v1.2", count: 12 })).toContain(source);
    const html = output(source, false, {}, { version: "v1.2", count: 12 });
    expect(html).toContain("Before v1.2.");
    expect(html).toContain("After 12 runs.");
    expect(output("Incomplete {{version}}.", false)).toContain("{{version}}");
  });
});
