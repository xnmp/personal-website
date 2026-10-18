import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseContent, contentBlock, contentField } from "../src/lib/content";
import { projectEntry } from "../src/lib/project-content";
import { Markdown } from "../src/components/notebook/Markdown";
import { Feature } from "../src/components/notebook/Features";
import { OpenQuestion } from "../src/components/notebook/OpenQuestion";
import { Plate } from "../src/components/notebook/Plate";
import { EditableText } from "../src/components/studio/EditableText";
import { Key } from "../src/components/rack/Key";
import { MarkdownRenderer } from "../src/components/notebook/MarkdownRenderer";

describe("authored content", () => {
  test("reads YAML metadata and preserves multiline Markdown blocks", () => {
    const document = parseContent("---\ntitle: Notes\n---\n<!-- block: intro -->\nFirst **paragraph**.\n\nSecond paragraph.\n<!-- block: footer -->\nBye.");
    expect(contentField(document, "title")).toBe("Notes");
    expect(contentBlock(document, "intro")).toBe("First **paragraph**.\n\nSecond paragraph.");
    expect(contentBlock(document, "footer")).toBe("Bye.");
  });

  test("reports duplicate and missing copy at the authored file", () => {
    expect(() => parseContent("<!-- block: intro -->\nA\n<!-- block: intro -->\nB", "notes.md")).toThrow('notes.md: duplicate block "intro"');
    expect(() => contentBlock(parseContent("", "notes.md"), "intro")).toThrow('notes.md: missing block "intro"');
    expect(() => contentField(parseContent("", "notes.md"), "title")).toThrow('notes.md: missing frontmatter "title"');
  });

  test("interpolates shared values and rejects missing or structured values", () => {
    const source = "---\nversion: v2\nempty: null\n---\n<!-- block: install -->\nInstall {{version}}.";
    expect(contentBlock(parseContent(source), "install")).toBe("Install v2.");
    expect(() => contentBlock(parseContent(source.replace("{{version}}", "{{missing}}")), "install")).toThrow("missing");
    expect(() => contentBlock(parseContent(source.replace("{{version}}", "{{empty}}")), "install")).toThrow("empty");
  });

  test("rejects executable frontmatter before it can run", () => {
    const probe = globalThis as typeof globalThis & { contentProbe?: boolean };
    probe.contentProbe = false;
    for (const prefix of ["---javascript", "---js", "\uFEFF---javascript"]) {
      expect(() => parseContent(`${prefix}\n(globalThis.contentProbe = true)\n---\nhello`)).toThrow("only YAML");
    }
    expect(probe.contentProbe).toBe(false);
    delete probe.contentProbe;
    expect(() => parseContent("---\ntitle: [broken\n---")).toThrow();
    expect(() => parseContent("---\n- list\n---")).toThrow("mapping");
  });

  test("preserves a large block without truncation", () => {
    const text = "A paragraph about a project.\n".repeat(20_000).trim();
    expect(contentBlock(parseContent(`<!-- block: notes -->\n${text}`), "notes")).toBe(text);
  });

  test("project edits change the card and search data; invalid metadata fails by field", () => {
    const source = readFileSync("content/projects/scrivo.md", "utf8");
    const document = parseContent(source, "scrivo.md");
    expect(projectEntry({ ...document, data: { ...document.data, title: "An edited title" } }).title).toBe("An edited title");
    for (const [field, value] of [["summary", null], ["summary", "  "], ["status", "unknown"], ["tags", null], ["tags", [null]], ["order", Infinity], ["slug", "../bad"], ["href", "/bad"], ["glyph", "two"], ["repo", "javascript:alert(1)"], ["art", "/screens/../private"]] as const) {
      expect(() => projectEntry({ ...document, data: { ...document.data, [field]: value } })).toThrow(String(field));
    }
  });

  test("a real product preview is optional and validates its image and accessible description", () => {
    const document = parseContent(readFileSync("content/projects/tauri-explorer.md", "utf8"), "tauri-explorer.md");
    const preview = projectEntry(document).preview!;
    expect(preview.src).toBe("/tauri/hero-quick-open-{theme}.webp");
    expect(projectEntry({ ...document, data: { ...document.data, preview: undefined } }).preview).toBeUndefined();
    for (const candidate of [null, {}, { ...preview, src: "javascript:alert(1)" },
      { ...preview, src: "/../private.png" }, { ...preview, alt: "" },
      { ...preview, width: Infinity }, { ...preview, height: 0 }]) {
      expect(() => projectEntry({ ...document, data: { ...document.data, preview: candidate } })).toThrow("preview");
    }
  });
});

test("project website URLs are optional and must be valid HTTPS links", () => {
  const document = parseContent(readFileSync("content/projects/tauri-explorer.md", "utf8"));
  expect(projectEntry(document).website).toBe("https://tauri-explorer.vercel.app");
  expect(projectEntry({ ...document, data: { ...document.data, website: undefined } }).website).toBeUndefined();
  for (const website of [null, 42, "", " ", "/about", "https://", "https:example.com", "https:/example.com", "not a URL", "javascript:alert(1)", "http://example.com", "https://user:password@example.com"]) {
    expect(() => projectEntry({ ...document, data: { ...document.data, website } })).toThrow("website");
  }
});

describe("Markdown output", () => {
  const html = (text: string, inline = false) => renderToStaticMarkup(<Markdown text={text} inline={inline} />);

  test("supports paragraphs, headings, lists, links and fenced code", () => {
    const output = html("## Notes\n\nFirst **paragraph**.\n\nSecond paragraph.\n\n- One\n- Two\n\n[Project](/p/scrivo)\n\n```rust\nlet x = 1;\n```");
    expect(output).toContain('<h2 class="md-heading">Notes</h2>');
    expect(output).toContain("<p>Second paragraph.</p>");
    expect(output).toContain("<li>Two</li>");
    expect(output).toContain('<ul class="md-list">');
    expect(output).toContain('href="/p/scrivo"');
    expect(output).toContain("let x = 1;");
  });

  test("renders inline helpers without literal markup or lost link classes", () => {
    const output = html(':span[(:kbd[:os[Alt+I]]).]{class="nowrap"} :code[foo/:break[]bar] :link[About] {href="/about" class="text-action"}'.replace("] {", "]{"), true);
    expect(output).toContain('class="nowrap"');
    expect(output.replace(/<[^>]*>/g, "")).toContain("Alt+I");
    expect(output).toContain("<code>foo/<wbr/>bar</code>");
    expect(output).toContain('class="text-action"');
    expect(output).not.toMatch(/:kbd|:os|:break|:span|:link/);
  });

  test("public text fields render Markdown without bindings and keep code literal", () => {
    const output = renderToStaticMarkup(<><h1><EditableText>A **bold** title</EditableText></h1><code><EditableText format="plain">{"**/*.tsx _literal_"}</EditableText></code></>);
    expect(output).toContain("<h1>A <strong>bold</strong> title</h1>");
    expect(output).toContain("<code>**/*.tsx _literal_</code>");
    expect(renderToStaticMarkup(<EditableText shortcuts>{"Press **Ctrl+P**"}</EditableText>)).toContain("<strong>Ctrl+P</strong>");
  });

  test("inline labels cannot introduce block markup or nested links", () => {
    const source = "## **Heading**\n\n- [About](/about)\n- https://example.com\n\n:link[More]{href=/about}";
    const output = renderToStaticMarkup(<a href="/original"><EditableText>{source}</EditableText></a>);
    expect(output).toContain("<strong>Heading</strong>");
    expect(output).toContain("About");
    expect(output.match(/<a\b/g)).toHaveLength(1);
    expect(output).not.toMatch(/<(?:h[1-6]|p|ul|ol|li)\b/);
    const key = renderToStaticMarkup(<Key href="/"><Markdown text={source} inline allowLinks={false} /></Key>);
    expect(key.match(/<a\b/g)).toHaveLength(1);
    expect(key).toContain("<strong>Heading</strong>");
  });

  test("Mac shortcuts adapt formatted prose, preserving source code and URLs", () => {
    const text = "_Ctrl+P_ __Ctrl+Shift+F5__ **Alt+I** `Ctrl+P` [Ctrl+P](/Ctrl+P) :code[Ctrl+P]";
    const output = renderToStaticMarkup(<MarkdownRenderer text={text} inline shortcutOS="mac" />);
    expect(output).toContain("<em>⌘P</em>");
    expect(output).toContain("<strong>⇧⌘F5</strong>");
    expect(output).toContain("<strong>⌥I</strong>");
    expect(output).toContain("<code>Ctrl+P</code>");
    expect(output.match(/<code>Ctrl\+P<\/code>/g)).toHaveLength(2);
    expect(output).toContain('href="/Ctrl+P">⌘P</a>');
    expect(renderToStaticMarkup(<MarkdownRenderer text={text} inline shortcutOS="linux" />)).toContain("<em>Ctrl+P</em>");
  });

  test("ordinary colon syntax remains text and raw HTML or unsafe URLs cannot execute", () => {
    expect(html("model: predict; 12:34; field:plan")).toContain("model: predict; 12:34; field:plan");
    const output = html('<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)');
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("javascript:");
  });

  test("install commands preserve exact command text across adjacent Markdown nodes", () => {
    const output = html(":command[nix run github:xnmp/tauri-explorer]", true);
    expect(output.replace(/<[^>]*>/g, "")).toBe("nix run github:xnmp/tauri-explorer");
    expect(output).toContain("<wbr/>");
  });

  test("component labels and captions render their authored inline formatting", () => {
    const output = renderToStaticMarkup(<><Feature label="**Feature**">Body</Feature><OpenQuestion label="*Question*">Body</OpenQuestion><Plate figure="FIG. **1**" caption="A `code` caption.">Figure</Plate></>);
    expect(output).toContain("<h3><strong>Feature</strong></h3>");
    expect(output).toContain("<em>Question</em>");
    expect(output).toContain("<code>code</code>");
    expect(output).toContain('aria-label="FIG. 1"');
    expect(output).not.toContain("**");
  });

  test("code examples retain syntax highlighting without authored HTML", () => {
    expect(html('```js\nconst answer = "yes";\n```')).toContain('class="hljs-keyword"');
  });

  test("every shipped Markdown block renders without leaked helper syntax", () => {
    const files = readdirSync("content").filter(f => f.endsWith(".md")).map(f => `content/${f}`)
      .concat(readdirSync("content/projects").map(f => `content/projects/${f}`));
    for (const file of files) {
      const document = parseContent(readFileSync(file, "utf8"), file);
      for (const name of Object.keys(document.blocks)) {
        const output = html(contentBlock(document, name));
        expect(output, `${file}: ${name}`).not.toMatch(/:(?:span|kbd|os|code|link|break)\[/);
        expect(output, `${file}: ${name}`).not.toContain("{variant=");
      }
    }
  });
});
