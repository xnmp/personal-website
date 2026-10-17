import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "../src/components/notebook/MarkdownRenderer";
import { interpolateContent } from "../src/lib/content-template";
import { markdownCode, markdownText } from "../src/lib/studio/text";

const render = (text: string) =>
  renderToStaticMarkup(createElement(MarkdownRenderer, { text }));
const escapedHtml = (text: string) =>
  renderToStaticMarkup(createElement("span", null, text)).slice(6, -7);
const literalParagraph = (text: string) =>
  text === ""
    ? ""
    : `<p>${text.replace(/\r\n?/g, "\n").split("\n").map(escapedHtml).join("<br/>\n")}</p>`;
const codeContents = (html: string) => {
  const match = html.match(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/);
  if (!match) throw new Error(`Expected a rendered code element: ${html}`);
  return match[1].replace(/<\/?span\b[^>]*>/g, "").replace(/\r\n?/g, "\n");
};

describe("literal text serialization", () => {
  test("renders entered punctuation literally instead of emphasis, links, images or code", () => {
    for (const value of [
      "*bold* and **strong**",
      "_ and _emphasis_ and __strong__",
      "~~deleted~~ and ~single~",
      "[label](/about)",
      "![image](/portrait.webp)",
      "[reference][id]",
      "[^footnote]",
      "`inline code` and ``longer ticks``",
      "``` a fence ```",
      "a | b | c",
      "a\\b \\*literal* \\",
      "literal {braces} and [brackets] (parentheses)!",
      "🌱 中文 e\u0301 🧑‍💻 — café",
    ]) {
      expect(render(markdownText(value))).toBe(literalParagraph(value));
    }
  });

  test("does not create keyboard helpers, other directives, HTML or decoded entities", () => {
    for (const value of [
      ":kbd[Ctrl]",
      ":span[words]{class=soft}",
      ":link[click]{href=/about}",
      ":::note",
      ":unknown[body]",
      '<script>alert("bad")</script>',
      '<img src="x" onerror="bad()">',
      "<!-- comment -->",
      "&copy; &amp; &#65; &#x1F331; &notanentity;",
      "<https://example.invalid/path>",
    ]) {
      const output = render(markdownText(value));
      if (value === "<https://example.invalid/path>") {
        // GFM's existing bare-URL auto-link behavior is intentionally retained.
        expect(output.replace(/<\/?a\b[^>]*>/g, "")).toBe(
          literalParagraph(value),
        );
      } else expect(output).toBe(literalParagraph(value));
    }
  });

  test("prevents heading, list, quote, rule and GFM-table syntax on every typed line", () => {
    for (const value of [
      "# Heading",
      "## Heading\n### Next heading",
      "- item\n+ item\n* item",
      "1. first\n2) second",
      "> quote\n>> nested quote",
      "---",
      "***",
      "___",
      "Title\n====",
      "Title\n----",
      "A | B\n--- | ---\nleft | right",
      "- [x] checked\n- [ ] unchecked",
      "    indented code",
      "\tindented code",
    ]) {
      expect(render(markdownText(value))).toBe(literalParagraph(value));
    }
  });

  test("keeps typed lines, blank lines, boundary whitespace and CRLF visible", () => {
    for (const value of [
      "First\nSecond",
      "First\n\nThird",
      "\nFirst",
      "Last\n",
      "\n",
      "\n\n",
      "First\r\nSecond\r\n",
      " leading and trailing ",
      "   ",
      "\tTabs\t",
      "Ends in a backslash\\\nNext",
    ]) {
      expect(render(markdownText(value))).toBe(literalParagraph(value));
    }
  });

  test("preserves ordinary prose punctuation as readable source", () => {
    const value =
      "Hello, world. It's keyboard-first (really): 12:34! a + b = c; C#.";
    expect(markdownText(value)).toBe(value.replace("!", "\\!"));
    expect(render(markdownText(value))).toBe(literalParagraph(value));
  });

  test("preserves existing surrounding emphasis, links and helper markup", () => {
    const value = "[literal] *words* :kbd[Ctrl] &copy;";
    const encoded = markdownText(value);
    expect(render(`Before **${encoded}** after.`)).toBe(
      `<p>Before <strong>${escapedHtml(value)}</strong> after.</p>`,
    );
    expect(render(`[${encoded}](/about)`)).toBe(
      `<p><a href="/about">${escapedHtml(value)}</a></p>`,
    );
    expect(render(`:span[${encoded}]{class="soft"}`)).toBe(
      `<p><span class="soft">${escapedHtml(value)}</span></p>`,
    );
  });

  test("does not turn a preserved sibling link into an image after literal exclamation text", () => {
    const output = render(`${markdownText("See!")}[project](/about)`);
    expect(output).toBe('<p>See!<a href="/about">project</a></p>');
    expect(output).not.toContain("<img");
  });

  test("retains a preserved sibling directive after literal colon text", () => {
    expect(render(`${markdownText("See:")}:kbd[Ctrl]`)).toBe(
      '<p>See:<kbd class="key cap cap-inline"><span>Ctrl</span></kbd></p>',
    );
    expect(render(`${markdownText("See:")}:span[helper]{class="soft"}`)).toBe(
      '<p>See:<span class="soft">helper</span></p>',
    );
  });

  test("keeps preserved sibling links, code and emphasis beside escaped punctuation", () => {
    expect(render(`${markdownText("\\")}[project](/about)`)).toBe(
      '<p>\\<a href="/about">project</a></p>',
    );
    expect(render(`${markdownText("`")}` + "`code`")).toBe(
      "<p>`<code>code</code></p>",
    );
    expect(
      render(
        `${markdownText("Literal * ")}**bold**${markdownText(" _ after")}`,
      ),
    ).toBe("<p>Literal * <strong>bold</strong> _ after</p>");
    expect(render(`[${markdownText("literal ] ! : *")}](/about)`)).toBe(
      '<p><a href="/about">literal ] ! : *</a></p>',
    );
  });

  test("literal template-looking text does not introduce a shared-field interpolation", () => {
    const encoded = markdownText("{{version}} is literal.");
    expect(render(interpolateContent(encoded, { version: "v999" }))).toBe(
      literalParagraph("{{version}} is literal."),
    );
    expect(markdownText("")).toBe("");
    expect(render(markdownText(""))).toBe("");
  });

  test("rejects malformed text and NUL characters", () => {
    for (const value of [null, undefined, 12, {}, []])
      expect(() => markdownText(value as string)).toThrow(TypeError);
    expect(() => markdownText("before\0after")).toThrow("NUL");
  });
});

describe("code serialization", () => {
  test("preserves inline code semantics, existing fence width and literal edited characters", () => {
    for (const value of [
      "plain",
      "*bold* _text_",
      "[link](/about)",
      ":kbd[Ctrl]",
      "<script>&copy;</script>",
      "a\\b",
      "🌱 中文 e\u0301",
      " leading ",
      "  ",
      "`starts",
      "ends`",
      "`tick`",
      "inside``ticks",
    ]) {
      const encoded = markdownCode(value, "```original```");
      const html = render(encoded);
      expect(html).toBe(`<p><code>${escapedHtml(value)}</code></p>`);
      expect(encoded.startsWith("```")).toBe(true);
    }
  });

  test("lengthens inline delimiters when needed, while leaving existing surrounding formatting untouched", () => {
    const value = "new ``` code";
    const encoded = markdownCode(value, "`old`");
    const html = render(`Before **${encoded}** after.`);
    expect(html).toBe(
      `<p>Before <strong><code>${escapedHtml(value)}</code></strong> after.</p>`,
    );
  });

  test("preserves fenced language/info, safe opening/closing widths and actual highlighted text", () => {
    const original = '```js title="example"\nold\n````  \n';
    const value = 'const garden = "🌱";\nconsole.log(garden);\n';
    const encoded = markdownCode(value, original);
    const html = render(encoded);
    expect(encoded.startsWith('```js title="example"\n')).toBe(true);
    expect(encoded.endsWith("````  \n")).toBe(true);
    expect(html).toContain("language-js");
    expect(codeContents(html)).toBe(escapedHtml(value));
  });

  test("extends fenced delimiters around closing-fence-looking edits, retaining the original fence character", () => {
    for (const [original, value] of [
      ["```text\nold\n```", "before\n```\nafter\n"],
      ["~~~text\nold\n~~~", "before\n~~~~\nafter\n"],
    ]) {
      const encoded = markdownCode(value, original);
      const html = render(encoded);
      expect(html.startsWith("<pre>")).toBe(true);
      expect((html.match(/<pre>/g) ?? []).length).toBe(1);
      expect(codeContents(html)).toBe(escapedHtml(value));
      expect(encoded[0]).toBe(original[0]);
    }
  });

  test("preserves indented fence and CRLF source style while retaining rendered code lines", () => {
    const original = "  ~~~~text\r\n  old\r\n  ~~~~~\r\n";
    const encoded = markdownCode("first\n\tsecond\n\nlast\n", original);
    expect(encoded.startsWith("  ~~~~text\r\n")).toBe(true);
    expect(encoded.endsWith("  ~~~~~\r\n")).toBe(true);
    expect(encoded.replace(/\r\n/g, "")).not.toContain("\n");
    expect(codeContents(render(encoded))).toBe(
      escapedHtml("first\n\tsecond\n\nlast\n"),
    );
  });

  test("supports empty fenced code and canonical final newline semantics", () => {
    expect(codeContents(render(markdownCode("", "```text\nold\n```")))).toBe(
      "",
    );
    expect(codeContents(render(markdownCode("new", "```text\nold\n```")))).toBe(
      "new\n",
    );
  });

  test("rejects incomplete/unsupported original syntax and unrepresentable inline edits", () => {
    for (const original of [
      "plain text",
      "`unclosed",
      "`old``",
      "``",
      "```js\nold",
      "````text\nold\n```",
      "```text\nold\n~~~",
      "    indented code",
      "```js\nold\n```\nextra\n```",
      "```bad`info\nold\n```",
      "~not code~",
    ]) {
      expect(() => markdownCode("new", original)).toThrow();
    }
    expect(() => markdownCode("", "`old`")).toThrow("cannot be empty");
    expect(() => markdownCode("two\nlines", "`old`")).toThrow("line breaks");
    expect(() => markdownCode("bad\0code", "`old`")).toThrow("NUL");
    expect(() => markdownCode("new", "`bad\0code`")).toThrow("NUL");
    expect(() => markdownCode(null as unknown as string, "`old`")).toThrow(
      TypeError,
    );
    expect(() => markdownCode("new", null as unknown as string)).toThrow(
      TypeError,
    );
  });
});
