import { Children, Fragment, createElement, isValidElement, type ComponentType, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import rehypeHighlight from "rehype-highlight";
import javascript from "highlight.js/lib/languages/javascript";
import bash from "highlight.js/lib/languages/bash";
import { Cap } from "@/components/rack/Key";
import { ForOS } from "@/components/launch/ForOS";
import Link from "next/link";
import { MARKDOWN_VARIANTS } from "./markdown-variants";
import type { Root } from "mdast";
import type { Node } from "unist";
import type { Root as HtmlRoot, Element } from "hast";
import type { PluggableList } from "unified";
import { decodeString } from "micromark-util-decode-string";
import { interpolateContent } from "@/lib/content-template";
import { interpolationRanges, sourceRange, type SourceRange } from "@/lib/studio/segments";
import type { EmptyContainer } from "@/lib/studio/patches";

declare module "hast" {
  interface ElementData {
    studioRoot?: number;
    studioRootTag?: string;
    studioParagraphClassName?: string;
    studioParagraphStyle?: CSSProperties;
    studioHasText?: boolean;
    studioText?: { id: number; root: number; start: number; end: number; kind: "text" | "code"; epoch: number; emptyRange?: SourceRange; containers?: EmptyContainer[] };
  }
}

function textContent(children: ReactNode): string {
  return Children.toArray(children).map(child =>
    typeof child === "string" || typeof child === "number" ? String(child)
      : isValidElement<{ children?: ReactNode }>(child) ? textContent(child.props.children) : ""
  ).join("");
}

/** Only these code-owned inline helpers can be embedded in authored Markdown. */
function inlineDirectives() {
  return (tree: Root, file: { value: string | Uint8Array }) => {
    function visit(node: Node) {
      if (node.type === "textDirective") {
        const directive = node as Node & { name: string; attributes?: Record<string, string>; data?: Record<string, unknown> };
        if (!["kbd", "os", "nowrap", "break", "span", "code", "link", "command"].includes(directive.name)) {
          Object.assign(node, { type: "text", value: String(file.value).slice(node.position?.start.offset, node.position?.end.offset) });
          return;
        }
        directive.data = {
          hName: directive.name === "code" ? "code" : directive.name === "link" ? "a" : "span",
          hProperties: {
            "data-inline": directive.name,
            className: directive.attributes?.class,
            "data-variant": directive.attributes?.variant,
            ...(directive.name === "link" ? { href: directive.attributes?.href } : {}),
          },
        };
      }
      if ("children" in node) (node.children as Node[]).forEach(visit);
    }
    visit(tree);
  };
}

/** No raw HTML or executable MDX. Inline mode fits headings, captions and keys. */
export type MarkdownProps = { text: string; inline?: boolean; paragraphClassName?: string; paragraphStyle?: CSSProperties };
type RootProps = (first: boolean) => HTMLAttributes<HTMLElement>;
export type MarkdownRootProps = HTMLAttributes<HTMLElement> & { node?: Element };
/** Editor attributes attach to existing root elements, preserving CSS adjacency and layout. */
type EditingOptions = { custom?: boolean; inline?: boolean; paragraphClassName?: string; paragraphStyle?: CSSProperties; text?: boolean; source?: string; fields?: Record<string, string | number>; epoch?: number };
function markRoots(options: EditingOptions) {
  return (tree: HtmlRoot) => {
    let index = 0;
    let textIndex = 0;
    const expansions = interpolationRanges(options.source ?? "", options.fields);
    const renderedSource = options.fields ? interpolateContent(options.source ?? "", options.fields) : options.source ?? "";
    const decode = (value: string) => decodeString(value).replace(/\r\n?/g, "\n");
    const textPart = (node: HtmlRoot["children"][number], root: number, kind: "text" | "code" = "text", emptyRange?: SourceRange, containers?: EmptyContainer[], sourceOverride?: SourceRange): Element | undefined => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start === undefined || end === undefined || options.source === undefined) return;
      try {
        const range = sourceOverride ?? sourceRange(options.source, { start, end }, options.fields);
        // Template references remain source-owned atoms rather than resolved literals.
        if (options.fields && /\{\{[a-z][a-z0-9_-]*\}\}/.test(options.source.slice(range.start, range.end))) return;
        return {
          type: "element", tagName: "studio-text", properties: {},
          data: { studioText: { ...range, id: textIndex++, root, kind, epoch: options.epoch ?? 0, emptyRange, containers } },
          children: node.type === "element" ? node.children : [{ type: "text", value: "value" in node ? String(node.value) : "" }],
        };
      } catch { /* A generated/interpolated fragment is not an authored text leaf. */ }
    };
    const textParts = (node: Extract<HtmlRoot["children"][number], { type: "text" | "raw" }>, root: number, emptyRange?: SourceRange, containers?: EmptyContainer[]) => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      const atoms = start === undefined || end === undefined ? [] : expansions.filter(expansion => expansion.rendered.start <= end && expansion.rendered.end >= start);
      if (!atoms.length || start === undefined || end === undefined) return [textPart(node, root, "text", emptyRange, containers) ?? node];
      if (node.type !== "text" || decode(renderedSource.slice(start, end)) !== node.value) return [node];
      const parts: Element["children"] = [];
      let cursor = start;
      let sourceCursor: number | undefined;
      const append = (from: number, to: number, sourceEnd?: number) => {
        if (from >= to) return;
        const value = decode(renderedSource.slice(from, to));
        const part = { type: "text" as const, value, position: { start: { line: 1, column: 1, offset: from }, end: { line: 1, column: 1, offset: to } } };
        try {
          const range = sourceRange(options.source!, { start: from, end: to }, options.fields);
          parts.push(textPart(part, root, "text", undefined, containers, { start: sourceCursor ?? range.start, end: sourceEnd ?? range.end }) ?? part);
        } catch { parts.push(part); }
      };
      for (const atom of atoms) {
        append(cursor, Math.min(atom.rendered.start, end), atom.source.start);
        const from = Math.max(start, atom.rendered.start);
        const to = Math.min(end, atom.rendered.end);
        if (from < to) parts.push({ type: "text", value: decode(renderedSource.slice(from, to)) });
        cursor = Math.max(cursor, to);
        sourceCursor = atom.source.end;
      }
      append(cursor, end);
      return parts;
    };
    const visit = (node: Element, root: number, parentEmptyRange?: SourceRange, parentContainers: EmptyContainer[] = []) => {
      const directive = node.properties["data-inline"];
      if (directive && !["span", "link", "nowrap", "kbd", "code"].includes(String(directive))) return;
      let emptyRange = node.children.length === 1 ? parentEmptyRange : undefined;
      let containers = parentContainers;
      if ((["em", "strong", "del", "a"].includes(node.tagName) || directive) && options.source !== undefined) {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        const contentStart = node.children[0]?.position?.start.offset;
        const contentEnd = node.children.at(-1)?.position?.end.offset;
        if (start !== undefined && end !== undefined && contentStart !== undefined && contentEnd !== undefined) {
          try {
            const range = sourceRange(options.source, { start, end }, options.fields);
            containers = [...parentContainers, { ...range, content: sourceRange(options.source, { start: contentStart, end: contentEnd }, options.fields) }];
            if (!emptyRange && node.children.length === 1) emptyRange = range;
          } catch { /* Generated markup has no authored range. */ }
        }
      }
      if (node.tagName === "code" && !directive) {
        const part = textPart(node, root, "code", emptyRange, containers);
        if (part) node.children = [part];
        return;
      }
      node.children = node.children.flatMap((child) => {
        if (child.type === "element") { visit(child, root, emptyRange, containers); return [child]; }
        if (child.type === "text" || child.type === "raw") return textParts(child, root, emptyRange, containers);
        return [child];
      });
    };
    tree.children.forEach((node) => {
      if (node.type !== "element") return;
      const root = index++;
      const before = textIndex;
      if (options.text) visit(node, root);
      node.data = { ...node.data, studioRoot: root, studioRootTag: options.inline && node.tagName === "p" ? "span" : node.tagName, studioHasText: textIndex > before };
      if (node.tagName === "p") {
        node.data.studioParagraphClassName = options.inline ? "studio-region" : options.paragraphClassName;
        node.data.studioParagraphStyle = options.inline ? undefined : options.paragraphStyle;
      }
      if (options.custom) node.tagName = "studio-root";
    });
    if (options.text && textIndex === 0 && !options.source?.trim()) {
      tree.children.push({
        type: "element", tagName: "studio-root", properties: {},
        data: { studioRoot: index, studioRootTag: options.inline ? "span" : "p", studioHasText: true, studioParagraphClassName: "studio-empty-root" },
        children: [{ type: "element", tagName: "studio-text", properties: {}, children: [], data: { studioText: { id: 0, root: index, start: 0, end: options.source?.length ?? 0, kind: "text", epoch: options.epoch ?? 0 } } }],
      });
    }
  };
}
export function MarkdownRenderer({ text, inline = false, paragraphClassName, paragraphStyle, rootProps, rootComponent, textComponent, sourceValue, sourceFields, editEpoch }: MarkdownProps & { rootProps?: RootProps; rootComponent?: ComponentType<MarkdownRootProps>; textComponent?: ComponentType<MarkdownRootProps>; sourceValue?: string; sourceFields?: Record<string, string | number>; editEpoch?: number }) {
  const attributes = (node?: Element) => node?.data?.studioRoot === undefined ? {} : rootProps?.(node.data.studioRoot === 0) ?? {};
  const roots: Components = rootProps ? Object.fromEntries(["h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "pre", "blockquote", "table", "hr"].map((tag) => [tag, ({ node, ...props }: { node?: Element; children?: ReactNode }) => createElement(tag, { ...props, ...attributes(node) })])) : {};
  const rootPlugins: PluggableList = rootProps || rootComponent ? [[markRoots, { custom: Boolean(rootComponent), inline, paragraphClassName, paragraphStyle, text: Boolean(textComponent), source: sourceValue, fields: sourceFields, epoch: editEpoch }]] : [];
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, inlineDirectives]}
      rehypePlugins={[[rehypeHighlight, { languages: { javascript, bash }, ignoreMissing: true }], ...rootPlugins]}
      components={{
        ...roots,
        ...(rootComponent ? { "studio-root": rootComponent } as Components : {}),
        ...(textComponent ? { "studio-text": textComponent } as Components : {}),
        p: ({ node, children }) => inline ? <Fragment>{children}</Fragment> : <p {...attributes(node)} className={paragraphClassName} style={paragraphStyle}>{children}</p>,
        span: ({ node, children, className }) => {
          switch (node?.properties["data-inline"]) {
            case "kbd": return <Cap inline>{children}</Cap>;
            case "os": return <ForOS>{textContent(children)}</ForOS>;
            case "nowrap": return <span className="nowrap">{children}</span>;
            case "break": return <wbr />;
            case "command": {
              const command = textContent(children);
              const split = command.indexOf(":") + 1;
              return <code className="cmd-text">{command.slice(0, split)}<wbr /><span className="nowrap">{command.slice(split)}</span></code>;
            }
            default: return <span className={className} style={MARKDOWN_VARIANTS[String(node?.properties["data-variant"])]}>{children}</span>;
          }
        },
        a: ({ href, className, children }) => href?.startsWith("/")
          ? <Link href={href} className={className}>{children}</Link>
          : <a href={href} className={className}>{children}</a>,
        code: ({ node, children, className }) => <code className={className} style={MARKDOWN_VARIANTS[String(node?.properties["data-variant"])]}>{children}</code>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
